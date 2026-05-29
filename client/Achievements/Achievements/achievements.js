window.NibrasReact.run(function () {

    // ── State ──
    var badges = [];
    var awardedIds = new Set();
    var repTotal = 0;
    var isLoading = true;

    // ── DOM refs ──
    var statsEl = document.getElementById('stats-container');
    var bannerEl = document.getElementById('new-badge-banner');

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

    // ── Loader ──
    function showLoading() {
        if (!statsEl) return;
        statsEl.innerHTML = [
            '<div class="loading-skeleton" aria-hidden="true">',
            '<div class="loading-skeleton-stats loading-shimmer"></div>',
            '</div>',
        ].join('');
        isLoading = true;
    }

    function showError(message) {
        if (!statsEl) return;
        statsEl.innerHTML = [
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
