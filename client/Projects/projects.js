var projectsPage = { courseId: '', activeCourse: null, activeProgress: null };

window.NibrasReact.run(function () {
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        var htmlEl = document.documentElement;
        var themeIcon = themeToggle.querySelector('i');
        var saved = localStorage.getItem('theme') || 'light';
        htmlEl.setAttribute('data-theme', saved);
        updateUI(themeIcon, saved);
        themeToggle.addEventListener('click', function () {
            var cur = htmlEl.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateUI(themeIcon, next);
        });
    }
    function updateUI(el, theme) {
        if (!el) return;
        el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    var sel = document.getElementById('course-select');
    if (sel) sel.addEventListener('change', function () { if (this.value) loadCourse(this.value); else showEmpty(); });

    loadDropdown();
});

function setMsg(msg, type) {
    var el = document.getElementById('projects-api-notice');
    if (!el) return;
    el.style.display = msg ? '' : 'none';
    el.textContent = msg || '';
    if (type === 'error') el.style.color = '#ef4444';
    else if (type === 'loading') el.style.color = '';
    else el.style.color = '';
}

function showEmpty() {
    document.getElementById('projects-hero').style.display = 'none';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('project-grid').style.display = 'none';
    document.getElementById('projects-empty').style.display = '';
}

function showContent() {
    document.getElementById('projects-empty').style.display = 'none';
    document.getElementById('projects-hero').style.display = '';
    document.getElementById('progress-container').style.display = '';
    document.getElementById('project-grid').style.display = '';
}

function loadDropdown() {
    var sel = document.getElementById('course-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Loading courses...</option>';
    var urlId = new URLSearchParams(window.location.search).get('courseId') || '';

    if (!window.NibrasServices?.coursesService) {
        sel.innerHTML = '<option value="">Service unavailable</option>';
        return;
    }
    window.NibrasServices.coursesService.list({ page: 1, limit: 100 }).then(function (res) {
        var items = res?.data?.items || res?.data || [];
        var courses = Array.isArray(items) ? items : (Array.isArray(res?.data) ? res.data : []);
        if (!courses.length) { sel.innerHTML = '<option value="">No courses</option>'; return; }
        sel.innerHTML = '<option value="">Select a course...</option>';
        var matched = false;
        courses.forEach(function (c) {
            var id = c._id || c.id || '';
            var name = c.title || c.courseCode || id;
            var selected = id === urlId ? 'selected' : '';
            if (selected) matched = true;
            sel.innerHTML += '<option value="' + esc(id) + '" ' + selected + '>' + esc(name) + '</option>';
        });
        document.getElementById('available-count').textContent = courses.length + ' available';
        var target = urlId || (courses.length === 1 ? (courses[0]._id || courses[0].id) : '');
        if (target) { sel.value = target; loadCourse(target); }
        else showEmpty();
    }).catch(function () {
        sel.innerHTML = '<option value="">Failed to load</option>';
        showEmpty();
    });
}

function loadCourse(courseId) {
    if (!courseId) { showEmpty(); return; }
    projectsPage.courseId = courseId;
    showContent();
    setMsg('Loading course...', 'loading');

    var svc = window.NibrasServices;
    if (!svc || !svc.coursesService) { setMsg('Service unavailable', 'error'); return; }

    var userId = null;
    try { var u = JSON.parse(localStorage.getItem('user') || '{}'); if (u._id) userId = u._id; } catch (_) {}

    Promise.all([
        svc.coursesService.getById(courseId).catch(function () { return null; }),
        svc.coursesService.getProgress(courseId).catch(function () { return null; }),
        userId ? svc.backendAnalyticsService.getStudentPerformance(userId).catch(function () { return null; }) : Promise.resolve(null),
    ]).then(function (results) {
        var courseRes = results[0];
        var progRes = results[1];
        var perfRes = results[2];
        setMsg('');

        if (!courseRes) { setMsg('Course not found', 'error'); showEmpty(); return; }

        var course = courseRes.data || courseRes;
        var progress = (progRes && (progRes.data || progRes)) || {};
        var performance = (perfRes && (perfRes.data || perfRes)) || {};

        projectsPage.activeCourse = course;
        projectsPage.activeProgress = progress;

        renderPage(course, progress, performance);
    });
}

function renderPage(course, progress, performance) {
    var title = course.title || 'Course';
    var code = course.courseCode || '';
    var desc = course.description || '';
    var level = course.level || '';
    var category = course.category || '';
    var sections = course.sections || [];
    var instructorName = course.instructorName || '';

    var items = progress.items || [];
    var completedSections = progress.completedSections || [];
    var pct = progress.percentage || 0;
    var status = progress.status || 'not_started';

    var completedCount = Array.isArray(completedSections) ? completedSections.length : 0;
    var totalSections = sections.length || items.length || 0;
    if (!totalSections) totalSections = course.assignmentsCount || 0;

    var courseGrade = '';
    var gradeSummary = performance.coursesGradeSummary || [];
    if (gradeSummary.length) {
        var match = gradeSummary.find(function (g) {
            var gid = g.courseId || '';
            return gid === course._id || gid === course.id || g.title === title;
        });
        if (match) courseGrade = match.weightedGrade ? match.weightedGrade + '%' : (match.percentage ? match.percentage + '%' : '');
    }

    // Hero
    document.getElementById('hero-course-code').textContent = (code ? code + ' · ' : '') + (level || '') + (level && instructorName ? ' · ' : '') + (instructorName || '');
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-subtitle').textContent = category || 'Track your course progress and milestones.';

    // Stats
    document.getElementById('stat-sections').textContent = totalSections;
    document.getElementById('stat-completed').textContent = completedCount;
    document.getElementById('stat-complete').textContent = pct + '%';

    // Progress bar
    document.getElementById('progress-title').textContent = (code ? code + ' — ' : '') + title;
    document.getElementById('progress-pct').textContent = pct + '%';
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-level').textContent = level || category || 'Active';
    document.getElementById('progress-status').textContent = status.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });

    // Progress card
    document.getElementById('progress-pct-large').textContent = pct + '%';
    document.getElementById('legend-approved').textContent = completedCount;
    document.getElementById('legend-review').textContent = 0;
    document.getElementById('legend-open').textContent = totalSections - completedCount;

    document.getElementById('stat-approved-val').textContent = completedCount + ' / ' + totalSections;
    document.getElementById('stat-review-val').textContent = '0';
    document.getElementById('stat-open-val').textContent = totalSections - completedCount;

    // Milestones
    document.getElementById('milestone-count').textContent = completedCount + ' / ' + totalSections + ' complete';
    var milestoneList = document.getElementById('milestone-list');
    milestoneList.innerHTML = '';

    if (sections.length === 0 && items.length === 0) {
        milestoneList.innerHTML = '<div class="milestone-item"><div class="milestone-left"><div class="milestone-circle"><i class="far fa-circle"></i></div><div><h4>No sections yet</h4><p>Course content coming soon.</p></div></div></div>';
    } else {
        var itemMap = {};
        if (items.length) items.forEach(function (it) { if (it.sectionId) itemMap[it.sectionId] = it; });

        (sections.length ? sections : items).forEach(function (sec) {
            var secId = sec._id || sec.sectionId || '';
            var secTitle = sec.title || 'Section';
            var state = 'available';
            if (secId && itemMap[secId]) state = itemMap[secId].state || 'available';
            var isDone = state === 'completed';
            var icon = isDone ? 'fa-regular fa-circle-check' : (state === 'available' ? 'far fa-circle' : 'fa-solid fa-lock');
            var iconColor = isDone ? 'color:#22c55e;' : (state === 'locked' ? 'color:#94a3b8;' : '');
            var label = state.charAt(0).toUpperCase() + state.slice(1).replace(/_/g, ' ');

            milestoneList.innerHTML += [
                '<div class="milestone-item">',
                '<div class="milestone-left">',
                '<div class="milestone-circle" style="' + iconColor + '"><i class="' + icon + '"></i></div>',
                '<div>',
                '<h4>' + esc(secTitle) + ' <span class="status-open">' + label + '</span></h4>',
                '<p>' + (sec.description ? esc(sec.description) : '') + '</p>',
                '</div>',
                '</div>',
                '<i class="fas fa-chevron-right arrow"></i>',
                '</div>',
            ].join('');
        });
    }

    // Intro card
    document.getElementById('project-desc').textContent = desc || 'No description available.';
    var badge = document.getElementById('project-badge');
    if (badge) badge.textContent = level ? level.toUpperCase() : 'ACTIVE';

    var metaWeight = document.getElementById('meta-weight');
    var metaType = document.getElementById('meta-type');
    if (metaWeight) metaWeight.textContent = courseGrade || 'Graded';
    if (metaType) metaType.textContent = category || 'Course';

    document.getElementById('standing-label').textContent = level || 'Year 1';
    var hint = document.getElementById('standing-hint');
    if (hint) hint.textContent = 'Complete all sections to advance.';
    document.getElementById('final-desc').textContent = 'Submit your work for ' + esc(title) + '.';

    document.getElementById('stat-time').textContent = status.replace(/_/g, ' ');
}

function esc(str) {
    if (!str && str !== 0) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}

function openSubmissionModal() {
    var modal = document.getElementById('submissionModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('finalSubmitForm').onsubmit = handleSubmit;
    document.getElementById('submission-status-message').textContent = '';
    document.getElementById('milestone-form-content').style.display = '';
    document.getElementById('submit-final-btn').style.display = '';
    document.getElementById('btn-close-pulse').style.display = 'none';
}

function closeSubmissionModal() {
    var modal = document.getElementById('submissionModal');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
    document.getElementById('submission-status-message').textContent = '';
}

async function handleSubmit(event) {
    event.preventDefault();
    var fd = new FormData(document.getElementById('finalSubmitForm'));
    var repoUrl = fd.get('resource_link') || '';
    if (!repoUrl.trim()) { alert('Please enter a submission URL.'); return; }

    var submitBtn = document.getElementById('submit-final-btn');
    var msg = document.getElementById('submission-status-message');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    msg.textContent = '';

    try {
        var svc = window.NibrasServices;
        if (svc && svc.coursesService) {
            await svc.coursesService.createSubmission({
                courseId: projectsPage.courseId,
                assignmentId: 'final',
                githubLink: repoUrl,
            });
            msg.textContent = 'Submitted successfully!';
            msg.style.color = '#22c55e';
            document.getElementById('milestone-form-content').style.display = 'none';
            document.getElementById('btn-close-pulse').style.display = '';
        } else {
            msg.textContent = 'Submission service unavailable.';
            msg.style.color = '#ef4444';
        }
    } catch (err) {
        msg.textContent = 'Error: ' + (err.message || 'Submission failed');
        msg.style.color = '#ef4444';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Project';
}

document.addEventListener('click', function (event) {
    var modal = document.getElementById('submissionModal');
    if (modal && modal.classList.contains('active') && event.target === modal) closeSubmissionModal();
});
