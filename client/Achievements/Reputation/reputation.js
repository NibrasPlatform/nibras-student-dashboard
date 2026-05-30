window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var bdContainer = document.getElementById('breakdown-container');
    var lvContainer = document.getElementById('levels-container');
    var posContainer = document.getElementById('rules-pos-container');
    var actContainer = document.getElementById('activity-container');

    var levels = [
        { name: 'Novice', range: '0 - 100 points', desc: 'Ask questions &bull; Submit assignments', dotColor: '#10b981' },
        { name: 'Learner', range: '100 - 500 points', desc: 'Vote on answers &bull; Comment on posts', dotColor: '#3b82f6' },
        { name: 'Contributor', range: '500 - 1000 points', desc: 'Edit community posts &bull; Flag irrelevant content', dotColor: '#9333ea' },
        { name: 'Expert', range: '1000 - 2000 points', desc: 'Contest &bull; Moderate Discussions &bull; Create Study Groups', dotColor: '#ec4899' },
        { name: 'Master', range: '2500 - 5000 points', desc: 'Edit community posts &bull; Moderate content', dotColor: '#f59e0b' },
        { name: 'Legend', range: '5000+ points', desc: 'All privileges &bull; Mentor credential', dotColor: '#ef4444' },
    ];

    var rulesPos = [
        { action: 'Solve a beginner problem', points: '+10' },
        { action: 'Solve a newbie problem', points: '+20' },
        { action: 'Solve an intermediate problem', points: '+35' },
        { action: 'Solve an advanced problem', points: '+50' },
        { action: 'Join a contest', points: '+15' },
        { action: 'Top 25% in contest', points: '+25' },
        { action: 'Top 10% in contest', points: '+50' },
        { action: 'Contest rating gain (per +10 Elo)', points: '+1', note: 'cap 30' },
        { action: 'Create a question', points: '+5' },
        { action: 'Create an answer', points: '+15' },
        { action: 'Have answer accepted', points: '+25' },
        { action: 'Receive question upvote', points: '+2', note: '20 pts/day max' },
        { action: 'Receive answer upvote', points: '+3', note: '30 pts/day max' },
        { action: 'Create a discussion thread', points: '+5' },
        { action: 'Earn a badge', points: '+15' },
    ];


    var levelThresholds = [0, 100, 500, 1000, 2000, 2500, 5000];

    function getLevelIndex(score) {
        for (var i = levelThresholds.length - 1; i >= 0; i--) {
            if (score >= levelThresholds[i]) return i;
        }
        return 0;
    }

    function renderLevels(score) {
        if (!lvContainer) return;
        lvContainer.innerHTML = '';
        levels.forEach(function (lvl, i) {
            var status = 'locked';
            if (i < getLevelIndex(score)) status = 'passed';
            else if (i === getLevelIndex(score)) status = 'active';
            var activeClass = status === 'active' ? 'active' : '';
            var liveBadge = status === 'active' ? '<span class="live-badge">LIVE</span>' : '';

            lvContainer.innerHTML += [
                '<div class="lvl-card ' + activeClass + '">',
                '<div class="lvl-header">',
                '<div class="lvl-title"><div class="status-dot" style="background-color:' + lvl.dotColor + '"></div>' + lvl.name + ' ' + liveBadge + '</div>',
                '<span class="lvl-points">' + lvl.range + '</span>',
                '</div>',
                '<div class="lvl-desc">' + lvl.desc + '</div>',
                '</div>',
            ].join('');
        });
    }

    function renderRules() {
        if (posContainer) {
            posContainer.innerHTML = '';
            rulesPos.forEach(function (r) {
                var noteHtml = r.note ? ' <span style="color:var(--text-muted);font-size:0.7rem;">(' + r.note + ')</span>' : '';
                posContainer.innerHTML += '<div class="rule-row"><span>' + r.action + noteHtml + '</span><span class="rule-pts pos">' + r.points + '</span></div>';
            });
        }
    }

    function renderActivity() {
        if (!actContainer) return;
        actContainer.innerHTML = '<div class="act-item" style="justify-content:center;padding:2rem;"><p style="color:var(--text-secondary);">Activity feed will appear here once backend endpoints are connected.</p></div>';
    }

    function renderBreakdown(breakdown) {
        if (!bdContainer) return;
        bdContainer.innerHTML = '';
        var categories = [
            { label: 'Academic Performance', score: breakdown.course || 0, color: 'blue', icon: 'fa-solid fa-book' },
            { label: 'Community Contribution', score: breakdown.community || 0, color: 'green', icon: 'fa-solid fa-users' },
            { label: 'Challenge Solutions', score: breakdown.problem || 0, color: 'purple', icon: 'fa-regular fa-lightbulb' },
            { label: 'Competition Results', score: breakdown.contest || 0, color: 'orange', icon: 'fa-solid fa-trophy' },
        ];
        categories.forEach(function (cat) {
            var max = Math.max(cat.score * 2, 500);
            var pct = Math.min((cat.score / max) * 100, 100);
            var colorVar = 'var(--bar-' + cat.color + ')';

            bdContainer.innerHTML += [
                '<div class="bd-item">',
                '<div class="bd-head">',
                '<span><i class="' + cat.icon + '" style="color:' + colorVar + '"></i> ' + cat.label + '</span>',
                '<span class="bd-val">' + cat.score + ' <span class="bd-sub">/ ' + max + '</span></span>',
                '</div>',
                '<div class="bd-track"><div class="bd-fill" style="width:' + pct + '%;background-color:' + colorVar + '"></div></div>',
                '</div>',
            ].join('');
        });
    }

    var services = window.NibrasServices;
    services.reputationService.getMyReputation().then(function (res) {
        var data = res && (res.data || res);
        var total = (data && data.total) || 0;
        var breakdown = (data && data.breakdown) || { problem: 0, community: 0, contest: 0, course: 0 };

        var nextLevelIdx = getLevelIndex(total) + 1;
        var nextThreshold = nextLevelIdx < levelThresholds.length ? levelThresholds[nextLevelIdx] : total;
        var prevThreshold = levelThresholds[getLevelIndex(total)] || 0;
        var progressToNext = nextThreshold > prevThreshold ? Math.round(((total - prevThreshold) / (nextThreshold - prevThreshold)) * 100) : 100;

        var currentRepCard = document.querySelector('.current-rep-card');
        if (currentRepCard) {
            var fill = currentRepCard.querySelector('.cr-fill');
            var info = currentRepCard.querySelector('.cr-info');
            if (fill) fill.style.width = Math.min(progressToNext, 100) + '%';
            if (info) info.innerHTML = '<strong>' + total + '</strong> / ' + nextThreshold + ' points to ' + (levels[nextLevelIdx] ? levels[nextLevelIdx].name : 'Max');
            var val = currentRepCard.querySelector('.cr-val');
            if (val) val.textContent = total;
        }

        renderBreakdown(breakdown);
        renderLevels(total);
        renderRules();
        renderActivity();
    }).catch(function () {
        renderLevels(0);
        renderRules();
        renderActivity();
    });

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
