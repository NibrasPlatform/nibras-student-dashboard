window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var currentState = { period: 'weekly', scope: 'global', page: 1 };
    var userContainer = document.getElementById('user-rank-container');
    var listContainer = document.getElementById('leaderboard-container');

    var services = window.NibrasServices;

    function loadLeaderboard() {
        var period = currentState.period;
        var scope = currentState.scope;
        var page = currentState.page;

        Promise.all([
            services.gamificationService.getLeaderboard({ period: period, scope: scope, page: page, limit: 20 }).catch(function () { return null; }),
            services.gamificationService.getMyLeaderboardRank({ period: period, scope: scope }).catch(function () { return null; }),
        ]).then(function (results) {
            var lbRes = results[0];
            var myRes = results[1];

            var lbData = (lbRes && (lbRes.data || lbRes)) || null;
            var myData = (myRes && (myRes.data || myRes)) || null;

            var entries = (lbData && lbData.entries) || [];
            var currentUser = myData || null;
            var pagination = (lbData && lbData.pagination) || null;

            var storedUser = null;
            try {
                var raw = localStorage.getItem('user');
                if (raw) storedUser = JSON.parse(raw);
            } catch (_) {}

            var userName = (storedUser && storedUser.name) || (currentUser && currentUser.name) || 'You';
            var userInitials = userName.split(' ').map(function (w) { return w.charAt(0); }).join('').toUpperCase().slice(0, 2);

            if (userContainer) {
                var uRank = currentUser && currentUser.rank != null ? currentUser.rank : '-';
                var uScore = currentUser && currentUser.score != null ? currentUser.score : 0;
                var uChange = currentUser && currentUser.scoreChange != null ? currentUser.scoreChange : 0;
                var uChangeType = uChange >= 0 ? 'pos' : 'neg';
                var uChangeIcon = uChange >= 0 ? '^' : 'v';
                var uChangeText = (uChange >= 0 ? '^' : 'v') + Math.abs(uChange);

                userContainer.innerHTML = [
                    '<div class="ur-left">',
                    '<div class="ur-avatar">' + escapeHtml(userInitials) + '</div>',
                    '<div class="ur-rank">#' + uRank + '</div>',
                    '<div class="ur-info"><h3>' + escapeHtml(userName) + ' <span class="ur-badge">student</span></h3></div>',
                    '</div>',
                    '<div class="ur-right">',
                    '<div class="ur-points">' + uScore + ' <span class="change-val ' + uChangeType + '">' + uChangeText + '</span></div>',
                    '<span class="ur-sub">reputation points</span>',
                    '</div>',
                ].join('');
            }

            if (listContainer) {
                listContainer.innerHTML = '';
                if (!entries || entries.length === 0) {
                    listContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center;">No leaderboard entries yet. Start earning points!</p>';
                    return;
                }

                entries.forEach(function (item) {
                    var rank = item.rank || 0;
                    var entryName = (item.userId && item.userId.name) || item.name || 'User';
                    var initials = entryName.split(' ').map(function (w) { return w.charAt(0); }).join('').toUpperCase().slice(0, 2);
                    var score = item.score || 0;
                    var change = item.scoreChange || 0;
                    var changeType = change >= 0 ? 'pos' : 'neg';
                    var changeText = (change >= 0 ? '^' : 'v') + Math.abs(change);
                    var role = 'student';
                    var meta = (item.activeDays ? item.activeDays + ' active days' : '');
                    if (item.breakdown) {
                        var achCount = Object.keys(item.breakdown).filter(function (k) { return item.breakdown[k] > 0; }).length;
                        if (achCount) meta = (meta ? meta + ' &bull; ' : '') + achCount + ' categories';
                    }

                    var rankHtml = '<div class="rank-box">#' + rank + '</div>';
                    if (rank === 1) rankHtml = '<div class="rank-box"><i class="fa-solid fa-crown rank-icon gold"></i></div>';
                    else if (rank === 2) rankHtml = '<div class="rank-box"><i class="fa-solid fa-shield rank-icon silver"></i></div>';
                    else if (rank === 3) rankHtml = '<div class="rank-box"><i class="fa-solid fa-gem rank-icon bronze"></i></div>';

                    var isMe = (userName === entryName) ? 'style="border: 2px solid var(--accent-blue);"' : '';

                    listContainer.innerHTML += [
                        '<div class="lb-row" ' + isMe + '>',
                        '<div class="lb-left">',
                        rankHtml,
                        '<div class="lb-avatar">' + escapeHtml(initials) + '</div>',
                        '<div class="lb-user-info">',
                        '<h4>' + escapeHtml(entryName) + ' <span class="ur-badge" style="font-size:0.7rem">' + role + '</span></h4>',
                        '<span class="lb-meta">' + escapeHtml(meta) + '</span>',
                        '</div>',
                        '</div>',
                        '<div class="lb-right">',
                        '<div class="lb-points">' + score + ' <span class="lb-change ' + changeType + '">' + changeText + '</span></div>',
                        '<span class="lb-meta">reputation points</span>',
                        '</div>',
                        '</div>',
                    ].join('');
                });

                if (pagination && pagination.totalPages > 1) {
                    var pagHtml = '<div class="pagination" style="display:flex;justify-content:center;gap:0.5rem;padding:1rem;">';
                    if (pagination.page > 1) {
                        pagHtml += '<button class="pill-btn active" data-page="' + (pagination.page - 1) + '">Prev</button>';
                    }
                    pagHtml += '<span style="padding:0.5rem;color:var(--text-secondary)">Page ' + pagination.page + ' of ' + pagination.totalPages + '</span>';
                    if (pagination.page < pagination.totalPages) {
                        pagHtml += '<button class="pill-btn active" data-page="' + (pagination.page + 1) + '">Next</button>';
                    }
                    pagHtml += '</div>';
                    listContainer.innerHTML += pagHtml;

                    listContainer.querySelectorAll('[data-page]').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            currentState.page = parseInt(this.getAttribute('data-page'));
                            loadLeaderboard();
                        });
                    });
                }
            }
        });
    }

    loadLeaderboard();

    var pills = document.querySelectorAll('.pill-btn');
    pills.forEach(function (p) {
        p.addEventListener('click', function () {
            var periodMap = { 'overall-btn': null, 'week-btn': 'weekly', 'month-btn': 'monthly' };
            var scopeMap = { 'global-btn': 'global', 'course-btn': 'course' };
            var text = this.textContent.trim().toLowerCase();
            if (text === 'overall' || text === 'all time' || this.id === 'overall-btn') { currentState.period = 'all-time'; }
            else if (text === 'this week' || text === 'weekly' || this.id === 'week-btn') { currentState.period = 'weekly'; }
            else if (text === 'this month' || text === 'monthly' || this.id === 'month-btn') { currentState.period = 'monthly'; }

            pills.forEach(function (btn) { btn.classList.remove('active'); });
            this.classList.add('active');
            currentState.page = 1;
            loadLeaderboard();
        });
    });

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
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
