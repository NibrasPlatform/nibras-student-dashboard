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
    var listView = document.getElementById('courses-list-view');
    var detailView = document.getElementById('course-detail-view');

    var services = window.NibrasServices;
    var coursesSummary = [];
    var activeCharts = [];

    function destroyCharts() {
        activeCharts.forEach(function (c) { try { c.destroy(); } catch (_) {} });
        activeCharts = [];
    }

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

            coursesSummary = data.coursesGradeSummary || [];
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

                    var item = document.createElement('div');
                    item.className = 'cm-item cm-clickable';
                    item.innerHTML = [
                        '<div class="cm-header">',
                        '<span class="cm-title">' + escapeHtml(title) + '</span>',
                        '<span class="cm-badge">' + escapeHtml(c.level || '') + '</span>',
                        '</div>',
                        '<div class="cm-stats-row">',
                        '<div class="cm-stat"><span class="cm-label">Progress</span><span class="cm-val">' + pct + '%</span></div>',
                        '<div class="cm-stat"><span class="cm-label">Grade</span><span class="cm-val">' + grade + '%</span></div>',
                        '<div class="cm-stat"><span class="cm-label">Status</span><span class="cm-val">' + statusLabel + '</span></div>',
                        '</div>',
                    ].join('');
                    item.addEventListener('click', function () { openCourseDetail(c); });
                    courseContainer.appendChild(item);
                });
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load course data.</p>';
        });
    }

    function openCourseDetail(course) {
        if (!detailView || !listView) return;
        destroyCharts();

        listView.style.display = 'none';
        detailView.style.display = 'block';

        var title = course.title || course.courseCode || 'Course';
        document.getElementById('detail-course-title').textContent = title;
        document.getElementById('detail-course-subtitle').textContent = 'Detailed analytics for ' + title;

        // Reset and show loading in all tabs
        document.getElementById('detail-stats-container').innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Loading metrics...</p>';
        document.getElementById('sections-container').innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Loading sections...</p>';
        document.getElementById('assignments-container').innerHTML = '<tr><td colspan="4" style="color:var(--text-secondary);padding:1rem;text-align:center;">Loading assignments...</td></r>';

        // Switch to overview tab
        document.querySelectorAll('.detail-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.detail-tab-content').forEach(function (c) { c.classList.remove('active'); });
        var firstTab = document.querySelector('.detail-tab[data-tab="overview"]');
        if (firstTab) firstTab.classList.add('active');
        var firstContent = document.getElementById('detail-tab-overview');
        if (firstContent) firstContent.classList.add('active');

        var courseId = course._id || course.courseId || course.courseCode;
        if (!courseId || !services || !services.backendAnalyticsService) return;

        services.backendAnalyticsService.getCourseMetrics(courseId).then(function (res) {
            var metrics = res && (res.data || res);
            renderDetailStats(metrics);
            renderGradeChart(metrics);
            renderCompletionChart(metrics);
        }).catch(function () {
            document.getElementById('detail-stats-container').innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Metrics unavailable (Phase 9 API not ready).</p>';
        });

        services.backendAnalyticsService.getCourseSections(courseId).then(function (res) {
            var sections = res && (res.data || res);
            renderSections(sections);
        }).catch(function () {
            document.getElementById('sections-container').innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Sections data unavailable (Phase 9 API not ready).</p>';
        });

        services.backendAnalyticsService.getCourseAssignments(courseId).then(function (res) {
            var assignments = res && (res.data || res);
            renderAssignments(assignments);
        }).catch(function () {
            document.getElementById('assignments-container').innerHTML = '<tr><td colspan="4" style="color:var(--text-secondary);padding:1rem;text-align:center;">Assignments data unavailable (Phase 9 API not ready).</td></tr>';
        });
    }

    function renderDetailStats(metrics) {
        var container = document.getElementById('detail-stats-container');
        if (!container) return;
        if (!metrics) {
            container.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No metrics available.</p>';
            return;
        }

        var completionRate = metrics.completionRate || metrics.completion || 0;
        var avgGrade = metrics.averageGrade || metrics.avgGrade || 0;
        var enrollmentCount = metrics.enrollmentCount || metrics.enrolled || 0;
        var engagementScore = metrics.engagementScore || metrics.engagement || 0;

        var detailStats = [
            { label: 'Completion Rate', value: Math.round(completionRate) + '%', change: 'of students completed', isPos: completionRate >= 50, icon: 'fa-solid fa-check-circle' },
            { label: 'Average Grade', value: Math.round(avgGrade) + '%', change: 'class average', isPos: avgGrade >= 60, icon: 'fa-solid fa-graduation-cap' },
            { label: 'Enrolled', value: String(enrollmentCount), change: 'total students', isPos: true, icon: 'fa-solid fa-users' },
            { label: 'Engagement', value: Math.round(engagementScore) + '%', change: 'participation rate', isPos: engagementScore >= 50, icon: 'fa-solid fa-chart-simple' },
        ];

        container.innerHTML = '';
        detailStats.forEach(function (s) {
            var changeClass = s.isPos ? 'pos' : 'neg';
            container.innerHTML += [
                '<div class="ana-stat-card">',
                '<div class="as-label"><i class="' + s.icon + '"></i> ' + s.label + '</div>',
                '<div class="as-val">' + s.value + '</div>',
                '<div class="as-change ' + changeClass + '">' + s.change + '</div>',
                '</div>',
            ].join('');
        });
    }

    function renderGradeChart(metrics) {
        var canvas = document.getElementById('gradeDistributionChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var dist = metrics && (metrics.gradeDistribution || metrics.grades);
        if (!dist || !Array.isArray(dist) || dist.length === 0) {
            canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fa-solid fa-chart-pie"></i><span>Grade distribution data not available</span></div>';
            return;
        }

        var labels = dist.map(function (d) { return d.label || d.range || ''; });
        var values = dist.map(function (d) { return d.count || d.value || 0; });
        var colors = ['#10b981', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#a855f7'];

        activeCharts.push(new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 1 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'right', labels: { font: { family: 'Inter', size: 11 } } }
                }
            }
        }));
    }

    function renderCompletionChart(metrics) {
        var canvas = document.getElementById('completionRateChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var completed = (metrics && (metrics.completedCount || metrics.completed)) || 0;
        var notCompleted = (metrics && (metrics.notCompletedCount || metrics.notCompleted || metrics.enrollmentCount)) || 0;
        var total = completed + notCompleted;
        if (total === 0) {
            canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fa-solid fa-chart-simple"></i><span>Completion data not available</span></div>';
            return;
        }
        var completionPct = Math.round((completed / total) * 100);

        activeCharts.push(new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed (' + completionPct + '%)', 'Remaining (' + (100 - completionPct) + '%)'],
                datasets: [{
                    data: [completed, notCompleted],
                    backgroundColor: ['#10b981', '#e5e7eb'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 } } }
                }
            }
        }));
    }

    function renderSections(sections) {
        var container = document.getElementById('sections-container');
        if (!container) return;

        var sectionsList = Array.isArray(sections) ? sections : (sections && sections.sections) || [];
        if (sectionsList.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No section data available.</p>';
            return;
        }

        container.innerHTML = '';
        sectionsList.forEach(function (s) {
            var name = s.name || s.title || s.section || 'Section';
            var avgScore = s.averageScore || s.avgScore || s.score || 0;
            var completionRate = s.completionRate || s.completion || 0;

            container.innerHTML += [
                '<div class="section-item">',
                '<div class="section-head">',
                '<span class="section-name">' + escapeHtml(name) + '</span>',
                '<span class="section-score">' + Math.round(avgScore) + '%</span>',
                '</div>',
                '<div class="section-track">',
                '<div class="section-fill" style="width:' + avgScore + '%;background-color:var(--accent-blue);"></div>',
                '</div>',
                '<span class="section-completion">' + Math.round(completionRate) + '% completion</span>',
                '</div>',
            ].join('');
        });

        // Chart
        var canvas = document.getElementById('sectionsChart');
        if (canvas && typeof Chart !== 'undefined') {
            var labels = sectionsList.map(function (s) { return s.name || s.title || s.section || ''; });
            var scores = sectionsList.map(function (s) { return s.averageScore || s.avgScore || s.score || 0; });
            var colors = scores.map(function (s) {
                if (s >= 80) return '#10b981';
                if (s >= 60) return '#3b82f6';
                if (s >= 40) return '#eab308';
                return '#ef4444';
            });

            activeCharts.push(new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average Score',
                        data: scores,
                        backgroundColor: colors,
                        borderColor: colors,
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter' } } },
                        y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
                    }
                }
            }));
        }
    }

    function renderAssignments(assignments) {
        var container = document.getElementById('assignments-container');
        if (!container) return;

        var list = Array.isArray(assignments) ? assignments : (assignments && assignments.assignments) || [];
        if (list.length === 0) {
            container.innerHTML = '<tr><td colspan="4" style="color:var(--text-secondary);padding:1rem;text-align:center;">No assignment data available.</td></tr>';
            return;
        }

        container.innerHTML = '';
        list.forEach(function (a) {
            var name = a.name || a.title || 'Assignment';
            var score = a.averageScore || a.avgScore || a.score || 0;
            var subRate = a.submissionRate || a.submission || 0;
            var status = a.status || (score >= 60 ? 'passed' : 'needs review');
            var statusClass = status === 'passed' ? 'status-passed' : (status === 'needs review' ? 'status-review' : 'status-pending');

            container.innerHTML += [
                '<tr>',
                '<td class="assign-name">' + escapeHtml(name) + '</td>',
                '<td class="assign-score">' + Math.round(score) + '%</td>',
                '<td class="assign-rate">' + Math.round(subRate) + '%</td>',
                '<td><span class="assign-status ' + statusClass + '">' + escapeHtml(status) + '</span></td>',
                '</tr>',
            ].join('');
        });
    }

    // Back button
    var backBtn = document.getElementById('back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            destroyCharts();
            if (detailView) detailView.style.display = 'none';
            if (listView) listView.style.display = 'block';
        });
    }

    // Sub-tab switching
    document.querySelectorAll('.detail-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.detail-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            document.querySelectorAll('.detail-tab-content').forEach(function (c) { c.classList.remove('active'); });
            var contentId = 'detail-tab-' + tab.getAttribute('data-tab');
            var content = document.getElementById(contentId);
            if (content) content.classList.add('active');
        });
    });

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

    // Export
    var exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            downloadExport('/analytics/export/courses?format=pdf', 'course-report.pdf');
        });
    }
});

function downloadExport(path, filename) {
    var token = localStorage.getItem('token') || localStorage.getItem('nibras.webSession') || localStorage.getItem('accessToken') || '';
    var baseUrl = window.NIBRAS_API_SERVICES?.admin || 'https://nibras-backend.up.railway.app/api';
    fetch(baseUrl + path, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { if (!r.ok) throw new Error(); return r.blob(); })
        .then(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
        })
        .catch(function () {
            window.open(baseUrl + path + '&token=' + encodeURIComponent(token), '_blank');
        });
}
