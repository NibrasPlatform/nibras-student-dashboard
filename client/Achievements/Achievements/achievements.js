window.NibrasReact.run(function () {

    var STORAGE_KEY = 'nibras_earned_badges';

    var statsEl = document.getElementById('stats-container');
    var sectionsEl = document.getElementById('badge-sections');

    function getStoredEarnedIds() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
    }

    function addStoredEarnedIds(newIds) {
        var existing = getStoredEarnedIds();
        var all = existing.slice();
        newIds.forEach(function (id) {
            if (all.indexOf(id) === -1) all.push(id);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return all;
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
        return d.innerHTML;
    }

    function rarityClass(idx) {
        var rarities = ['badge-card--common', 'badge-card--rare', 'badge-card--epic', 'badge-card--legendary'];
        return rarities[idx % rarities.length];
    }

    function showLoading() {
        if (statsEl) statsEl.innerHTML = '<div class="loading-skeleton" aria-hidden="true"><div class="loading-skeleton-stats loading-shimmer"></div></div>';
        if (sectionsEl) sectionsEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading badges...</div>';
    }

    function init() {
        showLoading();
        var services = window.NibrasServices;
        if (!services) return;

        var repPromise = services.usersService
            ? services.usersService.getMe()
                .then(function (r) { return r?.user?.reputationScore ?? 0; })
                .catch(function () { return 0; })
            : Promise.resolve(0);

        var badgesPromise = services.gamificationService
            ? services.gamificationService.getAllBadges()
                .then(function (r) {
                    var data = r?.data || r || [];
                    return Array.isArray(data) ? data : [];
                })
                .catch(function () { return []; })
            : Promise.resolve([]);

        var awardPromise = services.gamificationService
            ? services.gamificationService.checkAwardBadges()
                .then(function (r) {
                    var data = r?.data || r || [];
                    return Array.isArray(data) ? data : [];
                })
                .catch(function () { return []; })
            : Promise.resolve([]);

        Promise.all([repPromise, badgesPromise, awardPromise]).then(function (results) {
            var repTotal = results[0];
            var allBadges = results[1];
            var newlyAwarded = results[2];

            var newIds = [];
            newlyAwarded.forEach(function (b) {
                var id = b._id ? b._id.toString() : '';
                if (id) newIds.push(id);
            });
            var earnedIds = addStoredEarnedIds(newIds);

            renderStats(repTotal, allBadges.length, earnedIds);
            renderBadges(allBadges, earnedIds);
        });
    }

    function renderStats(repTotal, totalBadges, earnedIds) {
        if (!statsEl) return;
        var earnedCount = earnedIds.length;
        var completionPct = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;
        statsEl.innerHTML = [
            renderStatTile({ icon: 'fa-solid fa-trophy', value: earnedCount, caption: 'of ' + totalBadges, label: 'Badges Earned' }),
            renderStatTile({ icon: 'fa-solid fa-star', value: repTotal, label: 'Reputation' }),
            renderStatTile({ icon: 'fa-solid fa-ranking-star', value: completionPct + '%', label: 'Completion', caption: totalBadges + ' total' }),
            renderStatTile({ icon: 'fa-solid fa-gem', value: 0, label: 'Legendary', caption: 'Rarest unlocks' }),
        ].join('');
    }

    function renderStatTile(o) {
        var captionHtml = o.caption ? '<span class="stat-tile-caption">' + escapeHtml(o.caption) + '</span>' : '';
        return [
            '<div class="stat-tile">',
            '<div class="stat-tile-head">',
            '<i class="' + o.icon + ' stat-tile-icon"></i>',
            '<span class="stat-tile-label">' + escapeHtml(o.label) + '</span>',
            '</div>',
            '<div class="stat-tile-value">' + escapeHtml(String(o.value)) + '</div>',
            '<div class="stat-tile-foot">' + captionHtml + '</div>',
            '</div>',
        ].join('');
    }

    function renderBadges(allBadges, earnedIds) {
        if (!sectionsEl) return;

        var earned = [];
        var locked = [];
        allBadges.forEach(function (b) {
            var id = b._id ? b._id.toString() : '';
            if (earnedIds.indexOf(id) >= 0) earned.push(b);
            else locked.push(b);
        });

        var html = '';
        if (earned.length > 0) {
            html += badgeBlock('Earned', earned.length + ' unlocked', earned, earnedIds);
        }
        if (locked.length > 0) {
            html += badgeBlock('Locked', locked.length + ' to go', locked, earnedIds);
        }
        html += comingSoonHtml();

        sectionsEl.innerHTML = html;
    }

    function badgeBlock(title, meta, items, earnedIds) {
        return [
            '<div class="badge-block">',
            '<div class="badge-section-head">',
            '<h3 class="badge-section-title">' + escapeHtml(title) + '</h3>',
            '<span class="badge-section-meta">' + escapeHtml(meta) + '</span>',
            '</div>',
            '<div class="panel">',
            '<div class="badge-grid">',
            items.map(function (b, i) { return badgeCard(b, i, earnedIds); }).join(''),
            '</div>',
            '</div>',
            '</div>',
        ].join('');
    }

    function badgeCard(item, index, earnedIds) {
        var name = item.name || '';
        var desc = item.description || '';
        var id = item._id ? item._id.toString() : '';
        var isEarned = earnedIds.indexOf(id) >= 0;
        var iconHtml = renderIcon(item.badgeIcon);
        var earnedLabel = isEarned ? '<span class="badge-progress-label" style="margin-top:4px;color:var(--primary-strong);font-weight:600;">Earned</span>' : '';
        return [
            '<div class="badge-card ' + rarityClass(index) + ' ' + (isEarned ? 'badge-card--earned' : 'badge-card--locked') + '">',
            '<div class="badge-icon-holder">' + iconHtml + '</div>',
            '<strong class="badge-name">' + escapeHtml(name) + '</strong>',
            '<span class="badge-desc">' + escapeHtml(desc) + '</span>',
            earnedLabel,
            '</div>',
        ].join('');
    }

    function renderIcon(icon) {
        if (!icon) {
            return '<svg class="badge-icon-default" viewBox="0 0 32 32" fill="none"><path d="M16 4l3 7 7.5.7-5.7 5 1.7 7.5L16 20.7 9.5 24.2 11.2 16.7 5.5 11.7 13 11z" fill="currentColor" opacity=".85"/></svg>';
        }
        if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
            return '<img src="' + escapeHtml(icon) + '" alt="" class="badge-icon">';
        }
        return '<i class="' + escapeHtml(icon) + '" style="font-size:22px;"></i>';
    }

    function comingSoonHtml() {
        return [
            '<div class="badge-block">',
            '<div class="badge-section-head">',
            '<h3 class="badge-section-title">More Coming Soon</h3>',
            '<span class="badge-section-meta">Additional badges in development</span>',
            '</div>',
            '<div class="panel">',
            '<div style="padding:24px 20px;text-align:center;color:var(--text-muted);font-size:0.85rem;">',
            '<p style="margin-bottom:6px;">More badges for courses, projects, contests, and community participation are being developed.</p>',
            '<p>Keep using Nibras to unlock future achievements!</p>',
            '</div>',
            '</div>',
            '</div>',
        ].join('');
    }

    init();

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
