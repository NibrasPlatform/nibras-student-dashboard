window.NibrasReact.run(function () {

    // ── Static badge data from HTML (backend has no badge system) ──
    var EARNED_COUNT = 3;
    var TOTAL_BADGES = 206;
    var LEGENDARY_COUNT = 0;

    // ── DOM refs ──
    var statsEl = document.getElementById('stats-container');

    // ── Helpers ──
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
    }

    function showError(message) {
        if (!statsEl) return;
        statsEl.innerHTML = [
            '<div class="error-state">',
            '<div class="empty-state-icon"><i class="fa-solid fa-circle-exclamation"></i></div>',
            '<strong>Couldn\'t load stats</strong>',
            '<p>' + escapeHtml(message || 'Something went wrong.') + '</p>',
            '<button type="button" class="retry-btn" id="retry-btn">Retry</button>',
            '</div>',
        ].join('');
        var retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', loadStats);
    }

    // ── Data fetching ──
    function loadStats() {
        showLoading();
        var services = window.NibrasServices;

        if (!services || !services.usersService) {
            renderStats(0);
            return;
        }

        services.usersService.getMe().then(function (res) {
            var rep = (res && res.user && res.user.reputation) || 0;
            renderStats(rep);
        }).catch(function () {
            renderStats(0);
        });
    }

    function renderStats(repTotal) {
        if (!statsEl) return;
        var completionPct = Math.round((EARNED_COUNT / TOTAL_BADGES) * 100);

        statsEl.innerHTML = [
            renderStatTile({ icon: 'fa-solid fa-trophy', value: EARNED_COUNT, caption: 'of ' + TOTAL_BADGES, label: 'Badges Earned' }),
            renderStatTile({ icon: 'fa-solid fa-star', value: repTotal, label: 'Reputation' }),
            renderStatTile({ icon: 'fa-solid fa-ranking-star', value: completionPct + '%', label: 'Completion', caption: TOTAL_BADGES + ' total' }),
            renderStatTile({ icon: 'fa-solid fa-gem', value: LEGENDARY_COUNT, label: 'Legendary', caption: 'Rarest unlocks' }),
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

    // ── Init ──
    loadStats();

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
