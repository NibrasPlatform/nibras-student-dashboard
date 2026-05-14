window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsEl = document.getElementById('stats-container');
    var recentEl = document.getElementById('recent-container');
    var allEl = document.getElementById('all-container');

    var services = window.NibrasServices;

    Promise.all([
        services.gamificationService.getAllBadges().catch(function () { return null; }),
        services.gamificationService.checkAwardBadges().catch(function () { return null; }),
        services.reputationService.getMyReputation().catch(function () { return null; }),
    ]).then(function (results) {
        var badgesRes = results[0];
        var awardRes = results[1];
        var repRes = results[2];

        var badges = (badgesRes && (badgesRes.data || badgesRes)) || [];
        if (!Array.isArray(badges)) badges = [];
        var awardedIds = new Set();
        if (awardRes) {
            var awarded = awardRes.data || awardRes;
            if (Array.isArray(awarded)) {
                awarded.forEach(function (b) { if (b && b._id) awardedIds.add(b._id.toString()); });
            }
        }
        var repTotal = 0;
        if (repRes && repRes.data) repTotal = repRes.data.total || repRes.data.reputationScore || 0;
        else if (repRes && repRes.total) repTotal = repRes.total;

        var earnedCount = 0;
        var totalPoints = 0;
        badges.forEach(function (b) {
            totalPoints += (b.points || 0);
            if (awardedIds.has(b._id.toString())) earnedCount++;
        });

        var completion = badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;

        var stats = [
            { icon: 'fa-solid fa-trophy', color: '#d97706', val: String(badges.length), label: 'Achievements' },
            { icon: 'fa-solid fa-star', color: '#eab308', val: String(repTotal), label: 'Total Points' },
            { icon: 'fa-solid fa-chart-line', color: '#dc2626', val: String(repTotal), label: 'Reputation' },
            { icon: 'fa-solid fa-bullseye', color: '#2563eb', val: completion + '%', label: 'Completion' },
        ];

        statsEl.innerHTML = '';
        stats.forEach(function (s) {
            statsEl.innerHTML += [
                '<div class="a-stat-card">',
                '<div class="a-stat-icon" style="color:' + s.color + '"><i class="' + s.icon + '"></i></div>',
                '<div class="a-stat-val">' + s.val + '</div>',
                '<div class="a-stat-label">' + s.label + '</div>',
                '</div>',
            ].join('');
        });

        var recentBadges = badges.filter(function (b) { return awardedIds.has(b._id.toString()); });
        recentBadges.sort(function (a, b) { return (b.earnedAt || '').localeCompare(a.earnedAt || ''); });
        recentBadges = recentBadges.slice(0, 3);

        recentEl.innerHTML = '';
        recentBadges.forEach(function (b) {
            renderCard(b, 'complete', recentEl);
        });
        if (recentBadges.length === 0) {
            recentEl.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Complete achievements to see them here.</p>';
        }

        allEl.innerHTML = '';
        badges.forEach(function (b) {
            var status = awardedIds.has(b._id.toString()) ? 'complete' : 'locked';
            renderCard(b, status, allEl);
        });
        if (badges.length === 0) {
            allEl.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No achievements available yet.</p>';
        }
    });

    function renderCard(item, status, container) {
        var icon = item.badgeIcon || 'fa-solid fa-medal';
        var desc = item.description || item.desc || '';
        var title = item.name || item.title || '';
        var points = item.points || 0;

        var statusHtml = '';
        var iconColor = 'var(--text-primary)';
        if (status === 'complete') {
            statusHtml = '<span class="ach-status status-complete">complete</span>';
            iconColor = 'var(--green)';
        } else {
            statusHtml = '<span class="ach-status status-locked">locked</span>';
        }

        container.innerHTML += [
            '<div class="achieve-card">',
            '<div class="ach-icon-box"><i class="' + icon + '" style="color:' + iconColor + ';"></i></div>',
            '<div class="ach-content">',
            '<div class="ach-title">' + escapeHtml(title) + '</div>',
            '<div class="ach-desc">' + escapeHtml(desc) + '</div>',
            '<div class="ach-meta">' + statusHtml + '<span>Points: ' + points + '</span></div>',
            '</div>',
            '</div>',
        ].join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

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

    var segTabs = document.querySelectorAll('.seg-btn');
    segTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            segTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
        });
    });
});
