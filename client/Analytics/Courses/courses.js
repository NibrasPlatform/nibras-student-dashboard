window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
    var courseContainer = document.getElementById('courses-container');

    var services = window.NibrasServices;

    function getUserId() {
        try {
            var raw = localStorage.getItem('user');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return null;
    }

    var user = getUserId();
    if (user && user._id && services && services.backendAnalyticsService) {
        services.backendAnalyticsService.getStudentPerformance(user._id).then(function (res) {
            var data = res && (res.data || res);
            if (!data) return;

            var coursesSummary = data.coursesGradeSummary || [];
            var submissionSum = data.submissionSummary || {};

            var enrolled = coursesSummary.length;
            var completed = coursesSummary.filter(function (c) { return c.status === 'completed'; }).length;
            var inProgress = coursesSummary.filter(function (c) { return c.status === 'in_progress'; }).length;
            var grades = coursesSummary.map(function (c) { return c.weightedGrade || 0; }).filter(function (g) { return g > 0; });
            var avgGrade = grades.length > 0 ? Math.round(grades.reduce(function (a, b) { return a + b; }, 0) / grades.length) : 0;

            var stats = [
                { label: 'Enrolled', value: String(enrolled), change: 'total courses', isPos: true, icon: 'fa-solid fa-book-open' },
                { label: 'In Progress', value: String(inProgress), change: 'active courses', isPos: true, icon: 'fa-solid fa-spinner' },
                { label: 'Completed', value: String(completed), change: 'courses done', isPos: true, icon: 'fa-regular fa-circle-check' },
                { label: 'Avg Grade', value: avgGrade + '%', change: 'overall average', isPos: true, icon: 'fa-solid fa-graduation-cap' },
            ];

            statsContainer.innerHTML = '';
            stats.forEach(function (s) {
                var changeClass = s.isPos ? 'pos' : 'neg';
                statsContainer.innerHTML += [
                    '<div class="ana-stat-card">',
                    '<div class="as-label"><i class="' + s.icon + '"></i> ' + s.label + '</div>',
                    '<div class="as-val">' + s.value + '</div>',
                    '<div class="as-change ' + changeClass + '">' + s.change + '</div>',
                    '</div>',
                ].join('');
            });

            courseContainer.innerHTML = '';
            if (coursesSummary.length === 0) {
                courseContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No course data available.</p>';
            } else {
                coursesSummary.forEach(function (c) {
                    var title = c.title || c.courseCode || 'Course';
                    var pct = c.percentage || 0;
                    var grade = c.weightedGrade || 0;
                    var status = c.status || 'not_started';
                    var statusLabel = status.replace('_', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });

                    courseContainer.innerHTML += [
                        '<div class="cm-item">',
                        '<div class="cm-header">',
                        '<span class="cm-title">' + escapeHtml(title) + '</span>',
                        '<span class="cm-badge">' + escapeHtml(c.level || '') + '</span>',
                        '</div>',
                        '<div class="cm-stats-row">',
                        '<div class="cm-stat"><span class="cm-label">Progress</span><span class="cm-val">' + pct + '%</span></div>',
                        '<div class="cm-stat"><span class="cm-label">Grade</span><span class="cm-val">' + grade + '%</span></div>',
                        '<div class="cm-stat"><span class="cm-label">Status</span><span class="cm-val">' + statusLabel + '</span></div>',
                        '</div>',
                        '</div>',
                    ].join('');
                });
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load course data.</p>';
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
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

    var anaTabs = document.querySelectorAll('.ana-tab');
    anaTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            anaTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
        });
    });
});
