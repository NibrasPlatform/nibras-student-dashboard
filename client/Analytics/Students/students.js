window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
    var perfContainer = document.getElementById('performance-container');
    var badgesContainer = document.getElementById('badges-container');

    var services = window.NibrasServices;

    function getUserId() {
        try {
            var raw = localStorage.getItem('user');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return null;
    }

    var user = getUserId();
    var userRole = String(user?.role?.name || user?.role || '').toLowerCase();
    var isInstructor = userRole === 'instructor' || userRole === 'admin' || userRole === 'ta';

    if (user && user._id && services && services.backendAnalyticsService) {
        services.backendAnalyticsService.getStudentPerformance(user._id).then(function (res) {
            var data = res && (res.data || res);
            if (!data) return;

            var studentStats = data.studentStats || {};
            var problemProg = data.problemProgress || {};
            var badges = data.badges || [];
            var submissionSum = data.submissionSummary || {};

            var problemsSolved = studentStats.problemsSolved || 0;
            var totalProblems = 0;
            var difficultyLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
            var difficultyColors = { beginner: 'var(--grade-a)', intermediate: 'var(--grade-c)', advanced: 'var(--grade-f)' };

            Object.keys(problemProg).forEach(function (key) {
                totalProblems += (problemProg[key].total || 0);
            });

            var stats = [
                { label: 'Problems Solved', value: String(problemsSolved), change: totalProblems > 0 ? Math.round((problemsSolved / totalProblems) * 100) + '% of all' : '', isPos: true, icon: 'fa-solid fa-code' },
                { label: 'Sub Approved', value: String(submissionSum.approved || 0), change: (submissionSum.pending || 0) + ' pending', isPos: true, icon: 'fa-regular fa-circle-check' },
                { label: 'Reputation', value: String(studentStats.reputation || 0), change: 'total points', isPos: true, icon: 'fa-solid fa-star' },
                { label: 'Study Streak', value: (studentStats.studyStreak || 0) + 'd', change: 'current streak', isPos: true, icon: 'fa-solid fa-fire' },
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

            perfContainer.innerHTML = '';
            var hasProblems = Object.keys(problemProg).length > 0;
            if (!hasProblems) {
                perfContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No problem data available.</p>';
            } else {
                Object.keys(problemProg).filter(function (k) { return difficultyLabels[k]; }).forEach(function (key) {
                    var p = problemProg[key];
                    var label = difficultyLabels[key];
                    var color = difficultyColors[key] || 'var(--grade-c)';
                    var pct = p.percentage || 0;
                    var solved = p.solved || 0;
                    var total = p.total || 0;

                    perfContainer.innerHTML += [
                        '<div class="perf-item">',
                        '<div class="perf-head">',
                        '<span>' + escapeHtml(label) + '</span>',
                        '<span class="perf-count">' + solved + ' / ' + total + '</span>',
                        '</div>',
                        '<div class="perf-track">',
                        '<div class="perf-fill" style="width:' + pct + '%;background-color:' + color + '"></div>',
                        '</div>',
                        '</div>',
                    ].join('');
                });
            }

            if (badgesContainer) {
                badgesContainer.innerHTML = '';
                if (badges.length === 0) {
                    badgesContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No badges earned yet. Complete achievements to earn badges!</p>';
                } else {
                    badges.forEach(function (b) {
                        var icon = b.badgeIcon || 'fa-solid fa-medal';
                        badgesContainer.innerHTML += [
                            '<div class="risk-card-item" style="display:flex;align-items:center;gap:0.75rem;">',
                            '<i class="' + icon + '" style="font-size:1.5rem;color:var(--accent-blue);width:2rem;text-align:center;"></i>',
                            '<div class="risk-info" style="flex:1;">',
                            '<h4>' + escapeHtml(b.name || 'Badge') + '</h4>',
                            '<span class="risk-sub">' + escapeHtml(b.description || '') + '</span>',
                            '<span class="risk-time">' + (b.dateAwarded ? new Date(b.dateAwarded).toLocaleDateString() : '') + '</span>',
                            '</div>',
                            '<span class="risk-badge bg-high" style="background-color:var(--accent-blue);">' + (b.points || 0) + ' pts</span>',
                            '</div>',
                        ].join('');
                    });
                }
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load performance data.</p>';
        });

        services.backendAnalyticsService.getStudentProgress(user._id).then(function (res) {
            var progressData = res && (res.data || res);
            renderStudentProgressChart(progressData);
        }).catch(function () {
            renderStudentProgressChart(null);
        });

        if (isInstructor) {
            services.backendAnalyticsService.getAtRiskStudents().then(function (res) {
                var atRiskData = res && (res.data || res);
                renderAtRiskStudents(atRiskData);
            }).catch(function () {
                var container = document.getElementById('atrisk-container');
                if (container) container.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Failed to load at-risk data.</p>';
            });
        }
    }

    function renderStudentProgressChart(progressData) {
        var canvas = document.getElementById('studentProgressChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var hasData = progressData && progressData.progress && progressData.progress.length > 0;

        if (!hasData) {
            var wrapper = canvas.parentElement;
            wrapper.innerHTML = '<div class="chart-empty"><i class="fa-solid fa-chart-line"></i><span>Progress data will appear once the backend aggregates your learning history</span></div>';
            return;
        }

        var points = progressData.progress;
        var labels = points.map(function (p) { return p.period || p.label || ''; });
        var gradeData = points.map(function (p) { return p.grade || 0; });
        var completionData = points.map(function (p) { return p.completion || p.completionRate || 0; });
        var activityData = points.map(function (p) { return p.activity || p.submissions || 0; });

        var datasets = [
            {
                label: 'Grade',
                data: gradeData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
            },
            {
                label: 'Completion',
                data: completionData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
            }
        ];

        if (activityData.some(function (v) { return v > 0; })) {
            datasets.push({
                label: 'Activity',
                data: activityData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#f59e0b',
            });
        }

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
                }
            }
        });
    }

    function renderAtRiskStudents(atRiskData) {
        var section = document.getElementById('atrisk-section');
        var container = document.getElementById('atrisk-container');
        if (!section || !container) return;

        var students = Array.isArray(atRiskData) ? atRiskData : (atRiskData && atRiskData.students) || [];

        if (students.length === 0) {
            section.style.display = 'block';
            container.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No at-risk students identified at this time.</p>';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';
        students.sort(function (a, b) { return (b.riskScore || 0) - (a.riskScore || 0); });

        students.forEach(function (s) {
            var studentName = s.student?.name || s.name || 'Unknown';
            var riskScore = s.riskScore || 0;
            var riskFactors = s.riskFactors || [];
            var lastActive = s.lastActive || s.lastActivity || '';
            var lastActiveStr = lastActive ? timeSince(new Date(lastActive)) : 'Unknown';

            var riskLevel = riskScore >= 70 ? 'high' : (riskScore >= 40 ? 'med' : 'low');
            var riskColors = { high: 'var(--risk-high-bg)', med: '#d97706', low: 'var(--risk-med-bg)' };
            var riskBg = riskColors[riskLevel] || 'var(--risk-high-bg)';

            var factorsHtml = '';
            if (riskFactors.length > 0) {
                factorsHtml = '<div class="risk-factors">';
                riskFactors.forEach(function (f) {
                    factorsHtml += '<span class="risk-tag">' + escapeHtml(f) + '</span>';
                });
                factorsHtml += '</div>';
            }

            var trendIcon = riskScore >= 70 ? 'fa-arrow-down' : (riskScore >= 40 ? 'fa-minus' : 'fa-arrow-up');
            var trendColor = riskScore >= 70 ? '#ef4444' : (riskScore >= 40 ? '#f59e0b' : '#10b981');

            container.innerHTML += [
                '<div class="risk-card-item">',
                '<div class="risk-info" style="flex:1;">',
                '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">',
                '<h4>' + escapeHtml(studentName) + '</h4>',
                '<i class="fa-solid ' + trendIcon + '" style="color:' + trendColor + ';font-size:0.8rem;"></i>',
                '</div>',
                factorsHtml,
                '<span class="risk-time">Last active: ' + lastActiveStr + '</span>',
                '</div>',
                '<span class="risk-badge" style="background-color:' + riskBg + ';">' + riskScore + '%</span>',
                '</div>',
            ].join('');
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
        return d.innerHTML;
    }

    function timeSince(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        var intervals = [
            [31536000, 'year'], [2592000, 'month'], [604800, 'week'],
            [86400, 'day'], [3600, 'hour'], [60, 'minute']
        ];
        for (var i = 0; i < intervals.length; i++) {
            var val = Math.floor(seconds / intervals[i][0]);
            if (val >= 1) return val + ' ' + intervals[i][1] + (val > 1 ? 's' : '') + ' ago';
        }
        return 'just now';
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
