window.NibrasReact.run(function () {

    // ── State ──
    var badges = [];
    var awardedIds = new Set();
    var repTotal = 0;
    var activeTab = 'all';
    var isLoading = true;

    // ── DOM refs ──
    var statsEl = document.getElementById('stats-container');
    var tabEl = document.getElementById('tab-container');
    var sectionsEl = document.getElementById('badge-sections');
    var bannerEl = document.getElementById('new-badge-banner');

    // ── Config ──
    var CATEGORIES = [
        { id: 'all', label: 'All' },
        { id: 'rating', label: 'Rating' },
        { id: 'projects', label: 'Projects' },
        { id: 'community', label: 'Community' },
        { id: 'practice', label: 'Practice' },
        { id: 'competitions', label: 'Contests' },
        { id: 'onboarding', label: 'Onboarding' },
        { id: 'meta', label: 'Meta' },
    ];

    var LEVEL_THRESHOLDS = [0, 100, 500, 1000, 2000, 2500, 5000];
    var LEVEL_NAMES = ['Novice', 'Learner', 'Contributor', 'Expert', 'Master', 'Legend'];

    // ── Helpers ──
    function getLevelLabel(score) {
        for (var i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (score >= LEVEL_THRESHOLDS[i]) return LEVEL_NAMES[i] || 'Legend';
        }
        return 'Novice';
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
        return d.innerHTML;
    }

    function pick(obj) {
        for (var key of ['name', 'title']) if (obj[key]) return obj[key];
        return '';
    }

    function rarityClass(rarity) {
        switch (rarity) {
            case 'legendary': return 'badge-card--legendary';
            case 'epic': return 'badge-card--epic';
            case 'rare': return 'badge-card--rare';
            default: return 'badge-card--common';
        }
    }

    // ── Loader ──
    function showLoading() {
        if (!sectionsEl) return;
        statsEl.innerHTML = '';
        tabEl.innerHTML = '';
        sectionsEl.innerHTML = [
            '<div class="loading-skeleton" aria-hidden="true">',
            '<div class="loading-skeleton-stats loading-shimmer"></div>',
            '<div class="loading-skeleton-grid">',
            Array.from({ length: 8 }).map(function () {
                return '<div class="loading-skeleton-card loading-shimmer"></div>';
            }).join(''),
            '</div>',
            '</div>',
        ].join('');
        isLoading = true;
    }

    function showError(message) {
        if (!sectionsEl) return;
        statsEl.innerHTML = '';
        tabEl.innerHTML = '';
        sectionsEl.innerHTML = [
            '<div class="error-state">',
            '<div class="empty-state-icon"><i class="fa-solid fa-circle-exclamation"></i></div>',
            '<strong>Couldn\'t load achievements</strong>',
            '<p>' + escapeHtml(message || 'Something went wrong.') + '</p>',
            '<button type="button" class="retry-btn" id="retry-btn">Retry</button>',
            '</div>',
        ].join('');
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', fetchData);
    }

    // ── Data fetching ──
    function fetchData() {
        showLoading();
        var services = window.NibrasServices;

        Promise.all([
            services.gamificationService.getAllBadges().catch(function () { return null; }),
            services.gamificationService.checkAwardBadges().catch(function () { return null; }),
            services.reputationService.getMyReputation().catch(function () { return null; }),
        ]).then(function (results) {
            var badgesRes = results[0];
            var awardRes = results[1];
            var repRes = results[2];

            var rawBadges = (badgesRes && (badgesRes.data || badgesRes)) || [];
            if (!Array.isArray(rawBadges)) rawBadges = [];
            badges = rawBadges;

            awardedIds = new Set();
            if (awardRes) {
                var awarded = awardRes.data || awardRes;
                if (Array.isArray(awarded)) {
                    awarded.forEach(function (b) { if (b && b._id) awardedIds.add(b._id.toString()); });
                }
            }

            repTotal = 0;
            if (repRes && repRes.data) repTotal = repRes.data.total || repRes.data.reputationScore || 0;
            else if (repRes && repRes.total) repTotal = repRes.total;

            isLoading = false;
            renderAll();
        }).catch(function (err) {
            isLoading = false;
            showError(err && err.message ? err.message : 'Failed to load');
        });
    }

    // ── Render ──
    function renderAll() {
        renderStats();
        renderTabs();
        renderBadgeSections();
    }

    function renderStats() {
        if (!statsEl) return;
        var earnedCount = 0;
        var totalPoints = 0;
        var legendaryEarned = 0;
        badges.forEach(function (b) {
            totalPoints += (b.points || 0);
            var id = b._id ? b._id.toString() : '';
            if (awardedIds.has(id)) {
                earnedCount++;
                if (b.rarity === 'legendary') legendaryEarned++;
            }
        });

        var completionPct = badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;

        var levelLabel = repTotal > 0 ? getLevelLabel(repTotal) : null;

        statsEl.innerHTML = [
            renderStatTile({ icon: 'fa-solid fa-trophy', value: earnedCount, caption: 'of ' + badges.length, label: 'Badges Earned' }),
            renderStatTile({ icon: 'fa-solid fa-star', value: repTotal, label: 'Reputation', delta: levelLabel ? levelLabel : null, deltaTrend: 'up' }),
            renderStatTile({ icon: 'fa-solid fa-ranking-star', value: completionPct + '%', label: 'Completion', caption: badges.length + ' total' }),
            renderStatTile({ icon: 'fa-solid fa-gem', value: legendaryEarned, label: 'Legendary', caption: 'Rarest unlocks' }),
        ].join('');
    }

    function renderStatTile(o) {
        var deltaHtml = '';
        if (o.delta) {
            var dirClass = 'stat-tile-delta-up';
            var arrow = '<svg viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            if (o.deltaTrend === 'down') {
                dirClass = 'stat-tile-delta-down';
                arrow = '<svg viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            } else if (o.deltaTrend === 'flat') {
                dirClass = 'stat-tile-delta-flat';
                arrow = '<svg viewBox="0 0 12 12" fill="none"><path d="M3 6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
            }
            deltaHtml = '<span class="stat-tile-delta ' + dirClass + '">' + arrow + escapeHtml(o.delta) + '</span>';
        }
        var captionHtml = o.caption ? '<span class="stat-tile-caption">' + escapeHtml(o.caption) + '</span>' : '';

        return [
            '<div class="stat-tile">',
            '<div class="stat-tile-head">',
            '<i class="' + o.icon + ' stat-tile-icon"></i>',
            '<span class="stat-tile-label">' + escapeHtml(o.label) + '</span>',
            '</div>',
            '<div class="stat-tile-value">' + escapeHtml(String(o.value)) + '</div>',
            '<div class="stat-tile-foot">' + deltaHtml + captionHtml + '</div>',
            '</div>',
        ].join('');
    }

    function renderTabs() {
        if (!tabEl) return;
        tabEl.innerHTML = CATEGORIES.map(function (cat) {
            var active = cat.id === activeTab ? ' tab--active' : '';
            return '<button type="button" role="tab" aria-selected="' + (cat.id === activeTab) + '" class="tab' + active + '" data-tab="' + cat.id + '">' + escapeHtml(cat.label) + '</button>';
        }).join('');

        tabEl.querySelectorAll('.tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tabId = this.getAttribute('data-tab');
                if (tabId === activeTab) return;
                activeTab = tabId;
                tabEl.querySelectorAll('.tab').forEach(function (b) {
                    var isActive = b.getAttribute('data-tab') === activeTab;
                    b.classList.toggle('tab--active', isActive);
                    b.setAttribute('aria-selected', String(isActive));
                });
                renderBadgeSections();
            });
        });
    }

    function renderBadgeSections() {
        if (!sectionsEl) return;

        var filtered = activeTab === 'all'
            ? badges
            : badges.filter(function (b) { return (b.category || '').toLowerCase() === activeTab; });

        var earned = filtered.filter(function (b) {
            if (b.earnedAt) return true;
            return awardedIds.has(b._id ? b._id.toString() : '');
        });
        var locked = filtered.filter(function (b) {
            if (b.earnedAt) return false;
            return !awardedIds.has(b._id ? b._id.toString() : '');
        });

        if (filtered.length === 0) {
            sectionsEl.innerHTML = [
                '<div class="empty-state">',
                '<div class="empty-state-icon"><i class="fa-regular fa-face-meh"></i></div>',
                '<strong>No badges in this category</strong>',
                '<p>Try another tab or keep building reputation to unlock more.</p>',
                '</div>',
            ].join('');
            return;
        }

        var html = '';
        if (earned.length > 0) {
            html += renderBadgeBlock('Earned', earned.length + ' unlocked', earned, true);
        }
        if (locked.length > 0) {
            html += renderBadgeBlock('Locked', locked.length + ' to go', locked, false);
        }
        sectionsEl.innerHTML = html;
    }

    function renderBadgeBlock(title, meta, items, earned) {
        return [
            '<div class="badge-block">',
            '<div class="badge-section-head">',
            '<h3 class="badge-section-title">' + escapeHtml(title) + '</h3>',
            '<span class="badge-section-meta">' + escapeHtml(meta) + '</span>',
            '</div>',
            '<div class="panel">',
            '<div class="badge-grid">',
            items.map(function (b) { return renderBadgeCard(b, earned); }).join(''),
            '</div>',
            '</div>',
            '</div>',
        ].join('');
    }

    function renderBadgeCard(item, earned) {
        var name = pick(item);
        var desc = item.description || item.desc || '';
        var rarity = item.rarity || 'common';
        var id = item._id ? item._id.toString() : '';
        var hasThreshold = typeof item.threshold === 'number' && item.threshold > 0;
        var currentProgress = earned ? (item.threshold || 0) : (typeof item.progress === 'number' ? item.progress : 0);
        var progressPct = hasThreshold ? Math.min(100, Math.round((currentProgress / item.threshold) * 100)) : (earned ? 100 : 0);

        var iconUrl = item.iconUrl || item.badgeIcon || '';
        var iconHtml = iconUrl && (iconUrl.startsWith('http') || iconUrl.startsWith('/') || iconUrl.startsWith('data:'))
            ? '<img src="' + escapeHtml(iconUrl) + '" alt="" class="badge-icon">'
            : '<svg class="badge-icon-default" viewBox="0 0 32 32" fill="none"><path d="M16 4l3 7 7.5.7-5.7 5 1.7 7.5L16 20.7 9.5 24.2 11.2 16.7 5.5 11.7 13 11z" fill="currentColor" opacity=".85"/></svg>';

        var progressHtml = hasThreshold
            ? '<div class="badge-progress-track" aria-label="' + progressPct + '% to unlock"><div class="badge-progress-fill" style="width:' + progressPct + '%"></div></div><span class="badge-progress-label">' + (earned ? 'Complete' : currentProgress + ' / ' + item.threshold) + '</span>'
            : '';

        var descHtml = desc ? '<span class="badge-desc">' + escapeHtml(desc) + '</span>' : '';

        return [
            '<button type="button" class="badge-card ' + rarityClass(rarity) + ' ' + (earned ? 'badge-card--earned' : 'badge-card--locked') + '" aria-pressed="' + earned + '" data-badge-id="' + escapeHtml(id) + '">',
            '<div class="badge-icon-holder">' + iconHtml + '</div>',
            '<strong class="badge-name">' + escapeHtml(name) + '</strong>',
            descHtml,
            progressHtml,
            '</button>',
        ].join('');
    }

    // ── Init ──
    fetchData();

    // ── Theme toggle ──
    var themeBtn = document.getElementById('themeBtn');
    var themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    var appLogo = document.getElementById('app-logo');

    var savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
        if (appLogo) appLogo.src = '/Assets/images/logo-dark.png';
    } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
        if (appLogo) appLogo.src = '/Assets/images/logo-light.png';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var html = document.documentElement;
            var cur = html.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if (themeIcon) themeIcon.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            if (appLogo) appLogo.src = next === 'dark' ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
        });
    }
});
