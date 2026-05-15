var projectsPageState = {
    trackingCourseId: '',
    activeProject: null,
    pollingInterval: null,
    allCourses: [],
};

var projectsApiClient = window.NibrasProjectsApi?.createClient?.({
    baseUrl: window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL,
    getAuthToken: function () { return window.NibrasShared?.auth?.getToken?.() || localStorage.getItem('token') || null; },
}) || null;

window.NibrasReact.run(function () {
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        var htmlEl = document.documentElement;
        var themeIcon = themeToggle.querySelector('i');
        var savedTheme = localStorage.getItem('theme') || 'light';
        htmlEl.setAttribute('data-theme', savedTheme);
        updateIcon(themeIcon, savedTheme);
        themeToggle.addEventListener('click', function () {
            var cur = htmlEl.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateIcon(themeIcon, next);
        });
    }
    function updateIcon(el, theme) {
        if (!el) return;
        el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    var courseSelect = document.getElementById('course-select');
    if (courseSelect) {
        courseSelect.addEventListener('change', function () {
            var val = this.value;
            if (val) {
                projectsPageState.trackingCourseId = val;
                loadProjectsForCourse(val);
            } else {
                showEmptyState();
            }
        });
    }

    loadCourseDropdown();
});

function setNotice(msg, type) {
    var el = document.getElementById('projects-api-notice');
    if (!el) return;
    if (!msg) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = msg;
    el.style.color = type === 'error' ? '#ef4444' : type === 'loading' ? '' : '';
}

function showEmptyState() {
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

function loadCourseDropdown() {
    var select = document.getElementById('course-select');
    if (!select) return;
    select.innerHTML = '<option value="">Loading courses...</option>';

    var urlParams = new URLSearchParams(window.location.search);
    var preselectedId = urlParams.get('courseId') || '';

    var tryTracking = function () {
        if (!window.NibrasServices?.trackingCourseService) { tryCoursesBackend(); return; }
        window.NibrasServices.trackingCourseService.list().then(function (res) {
            var courses = Array.isArray(res) ? res : (res?.data || res?.courses || []);
            if (!courses || courses.length === 0) { tryCoursesBackend(); return; }
            fillDropdown(courses, preselectedId, 'id');
        }).catch(function () { tryCoursesBackend(); });
    };

    var tryCoursesBackend = function () {
        if (!window.NibrasServices?.coursesService) {
            select.innerHTML = '<option value="">Select a course...</option>';
            finishSelection(preselectedId);
            return;
        }
        window.NibrasServices.coursesService.list({ page: 1, limit: 100 }).then(function (res) {
            var items = res?.data?.items || res?.data || res?.courses || [];
            var courses = Array.isArray(items) ? items : (Array.isArray(res?.data) ? res.data : []);
            var mapped = courses.map(function (c) {
                var localId = '';
                try {
                    var resolved = window.NibrasCourses?.resolveCourseIdentifiers?.(c._id || c.id);
                    localId = resolved?.trackingCourseIdForApi || resolved?.trackingCourseId || c._id || c.id || '';
                } catch (_) { localId = c._id || c.id || ''; }
                return { display: c.title || c.courseCode || 'Course', value: localId };
            });
            if (mapped.length === 0) {
                select.innerHTML = '<option value="">No courses found</option>';
                finishSelection(preselectedId);
                return;
            }
            select.innerHTML = '<option value="">Select a course...</option>';
            var hasSelected = false;
            mapped.forEach(function (c) {
                var selected = (c.value === preselectedId) ? 'selected' : '';
                if (selected) hasSelected = true;
                select.innerHTML += '<option value="' + escapeHtml(c.value) + '" ' + selected + '>' + escapeHtml(c.display) + '</option>';
            });
            document.getElementById('available-count').textContent = mapped.length + ' available';
            if (!hasSelected && preselectedId) {
                select.innerHTML += '<option value="' + escapeHtml(preselectedId) + '" selected>Course</option>';
            }
            finishSelection(preselectedId || (mapped.length === 1 ? mapped[0].value : ''));
        }).catch(function () {
            select.innerHTML = '<option value="">Select a course...</option>';
            finishSelection(preselectedId);
        });
    };

    var finishSelection = function (targetId) {
        if (targetId) {
            select.value = targetId;
            projectsPageState.trackingCourseId = targetId;
            loadProjectsForCourse(targetId);
        } else {
            showEmptyState();
        }
    };

    tryTracking();
}

function fillDropdown(courses, preselectedId) {
    var select = document.getElementById('course-select');
    select.innerHTML = '<option value="">Select a course...</option>';
    var hasSelected = false;
    (courses || []).forEach(function (c) {
        var id = c.id || c._id || '';
        var name = c.name || c.title || c.courseCode || c.slug || id;
        var selected = (id === preselectedId) ? 'selected' : '';
        if (selected) hasSelected = true;
        select.innerHTML += '<option value="' + escapeHtml(id) + '" ' + selected + '>' + escapeHtml(name) + '</option>';
    });
    document.getElementById('available-count').textContent = (courses?.length || 0) + ' available';
    var targetId = preselectedId || (courses && courses.length === 1 ? (courses[0].id || courses[0]._id) : '');
    if (targetId && !hasSelected) {
        select.value = targetId;
        projectsPageState.trackingCourseId = targetId;
        loadProjectsForCourse(targetId);
    }
}

function loadProjectsForCourse(courseId) {
    if (!courseId) { showEmptyState(); return; }
    showContent();
    setNotice('Loading projects...', 'loading');

    if (!projectsApiClient) {
        setNotice('Projects API is not available.', 'error');
        return;
    }

    projectsApiClient.getProjectsOverview({ courseId: courseId }).then(function (response) {
        var payload = response?.data || {};
        var projects = payload.projects || [];
        setNotice('');

        if (!projects || projects.length === 0) {
            showEmptyState();
            return;
        }
        populatePage(projects[0], payload);
    }).catch(function (error) {
        setNotice('Failed to load projects: ' + (error?.message || 'Connection error'), 'error');
        showEmptyState();
    });
}

function populatePage(project, payload) {
    projectsPageState.activeProject = project;
    showContent();

    var title = project.details?.title || project.card?.title || project.title || 'Project';
    var courseCode = project.details?.courseCode || project.card?.courseCode || '';
    var desc = project.details?.description || project.card?.description || '';
    var stats = project.stats || {};
    var total = stats.total || 0;
    var approved = stats.approved || 0;
    var inReview = stats.in_review || 0;
    var completion = stats.completion || 0;
    var milestones = project.milestones || [];

    document.getElementById('hero-course-code').textContent = courseCode || 'Course';
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-subtitle').textContent = 'Track milestones, submit work, and monitor your progress.';

    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-review').textContent = inReview;
    document.getElementById('stat-complete').textContent = completion + '%';

    document.getElementById('progress-title').textContent = (courseCode ? courseCode + ' — ' : '') + title;
    document.getElementById('progress-pct').textContent = completion + '%';
    document.getElementById('progress-fill').style.width = completion + '%';

    document.getElementById('progress-pct-large').textContent = completion + '%';
    document.getElementById('legend-approved').textContent = approved;
    document.getElementById('legend-review').textContent = inReview;
    document.getElementById('legend-open').textContent = Math.max(0, total - approved - inReview);

    document.getElementById('stat-approved-val').textContent = approved + ' / ' + total;
    document.getElementById('stat-review-val').textContent = inReview;
    document.getElementById('stat-open-val').textContent = Math.max(0, total - approved - inReview);

    var completedCount = milestones.filter(function (m) { return m.status === 'approved' || m.status === 'complete' || m.status === 'passed'; }).length;
    document.getElementById('milestone-count').textContent = completedCount + ' / ' + milestones.length + ' complete';

    var milestoneList = document.getElementById('milestone-list');
    if (milestones.length === 0) {
        milestoneList.innerHTML = '<div class="milestone-item"><div class="milestone-left"><div class="milestone-circle"><i class="far fa-circle"></i></div><div><h4>No milestones yet</h4><p>Check back later for milestones.</p></div></div></div>';
    } else {
        milestoneList.innerHTML = '';
        milestones.forEach(function (m) {
            var mStatus = m.status || 'open';
            var icon = (mStatus === 'approved' || mStatus === 'complete' || mStatus === 'passed') ? 'fa-regular fa-circle-check' : 'far fa-circle';
            var iconColor = (mStatus === 'approved' || mStatus === 'complete' || mStatus === 'passed') ? 'color:#22c55e;' : '';
            var statusLabel = mStatus.charAt(0).toUpperCase() + mStatus.slice(1).replace(/_/g, ' ');
            var isFinal = /final/i.test(m.title || '');
            milestoneList.innerHTML += [
                '<div class="milestone-item">',
                '<div class="milestone-left">',
                '<div class="milestone-circle" style="' + iconColor + '"><i class="' + icon + '"></i></div>',
                '<div>',
                '<h4>' + escapeHtml(m.title || 'Milestone') + (isFinal ? ' <span class="badge-final">FINAL</span>' : '') + ' <span class="status-open">' + statusLabel + '</span></h4>',
                '<p>' + escapeHtml(m.description || '') + '</p>',
                '</div>',
                '</div>',
                '<i class="fas fa-chevron-right arrow"></i>',
                '</div>',
            ].join('');
        });
    }

    document.getElementById('project-desc').textContent = desc || 'No description available.';
    var badge = document.getElementById('project-badge');
    if (badge) badge.textContent = project.details?.projectKey ? 'PUBLISHED' : 'ACTIVE';

    var metaWeight = document.getElementById('meta-weight');
    var metaType = document.getElementById('meta-type');
    if (metaWeight) metaWeight.textContent = project.details?.rubricWeight || 'Standard rubric';
    if (metaType) metaType.textContent = project.details?.deliveryMode || project.details?.type || 'Individual';

    document.getElementById('standing-label').textContent = project.details?.level || 'Year 1';
    var hint = document.getElementById('standing-hint');
    if (hint) hint.textContent = 'Complete all projects to advance to the next level.';

    document.getElementById('final-desc').textContent = 'Submit your ' + escapeHtml(title) + ' final project for grading. Provide your GitHub repository link below.';

    var statTime = document.getElementById('stat-time');
    if (project.details?.dueDate) {
        var days = Math.ceil((new Date(project.details.dueDate) - new Date()) / 86400000);
        statTime.textContent = days > 0 ? days + ' days' : days === 0 ? 'Due today' : 'Overdue';
    } else {
        statTime.textContent = '—';
    }
}

function escapeHtml(str) {
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
}

function closeSubmissionModal() {
    var modal = document.getElementById('submissionModal');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
    if (projectsPageState.pollingInterval) { clearInterval(projectsPageState.pollingInterval); projectsPageState.pollingInterval = null; }
    document.getElementById('milestone-form-content').style.display = '';
    document.getElementById('modal-pulse-tracker').style.display = 'none';
    document.getElementById('submit-final-btn').style.display = '';
    document.getElementById('btn-close-pulse').style.display = 'none';
    document.getElementById('submission-status-message').textContent = '';
    document.querySelectorAll('.pulse-step').forEach(function (s) { s.classList.remove('active', 'done'); });
}

function updatePulseUI(status) {
    var map = { queued: 'step-init', processing: 'step-init', cloning: 'step-clone', testing: 'step-test', grading: 'step-grade' };
    var stepId = map[status] || null;
    document.querySelectorAll('.pulse-step').forEach(function (s) { s.classList.remove('active'); });
    var found = false;
    document.querySelectorAll('.pulse-step').forEach(function (s) {
        if (!found && stepId && s.id === stepId) { s.classList.add('active'); found = true; }
        else if (!found) s.classList.add('done');
        else s.classList.remove('done');
    });
    var msg = document.getElementById('submission-status-message');
    if (msg) {
        var labels = { queued: 'Submission queued...', processing: 'Processing...', cloning: 'Cloning repo...', testing: 'Running tests...', grading: 'AI analysis...', passed: 'All checks passed!', failed: 'Submission failed.' };
        msg.textContent = labels[status] || status;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    var form = document.getElementById('finalSubmitForm');
    var fd = new FormData(form);
    var repoUrl = fd.get('resource_link') || '';
    if (!repoUrl.trim()) { alert('Please enter a submission URL.'); return; }

    document.getElementById('milestone-form-content').style.display = 'none';
    document.getElementById('modal-pulse-tracker').style.display = '';
    document.getElementById('submit-final-btn').style.display = 'none';
    document.getElementById('btn-close-pulse').style.display = '';
    document.getElementById('submission-status-message').textContent = 'Starting submission...';
    updatePulseUI('queued');

    try {
        if (projectsApiClient && typeof projectsApiClient.submitMilestone === 'function') {
            var p = projectsPageState.activeProject;
            var result = await projectsApiClient.submitMilestone({
                milestoneId: 'final',
                courseId: projectsPageState.trackingCourseId,
                projectKey: p?.details?.projectKey || '',
                submissionType: fd.get('submission_type') || 'github',
                resourceLink: repoUrl,
                branch: String(fd.get('submission_branch') || 'main').trim() || 'main',
            });
            if (result && result.ok) {
                updatePulseUI('passed');
                document.getElementById('submission-status-message').textContent = 'Submission successful!';
                if (result.data && result.data.submissionId) startPolling(result.data.submissionId);
            } else throw new Error(result?.error || 'Submission failed');
        } else {
            updatePulseUI('passed');
            document.getElementById('submission-status-message').textContent = 'Submitted! (demo mode)';
        }
    } catch (err) {
        updatePulseUI('failed');
        document.getElementById('submission-status-message').textContent = 'Error: ' + (err.message || 'Unknown');
        document.getElementById('milestone-form-content').style.display = '';
        document.getElementById('modal-pulse-tracker').style.display = 'none';
        document.getElementById('submit-final-btn').style.display = '';
        document.getElementById('btn-close-pulse').style.display = 'none';
    }
}

function startPolling(submissionId) {
    if (projectsPageState.pollingInterval) clearInterval(projectsPageState.pollingInterval);
    projectsPageState.pollingInterval = setInterval(async function () {
        try {
            if (projectsApiClient && typeof projectsApiClient.getSubmissionStatus === 'function') {
                var res = await projectsApiClient.getSubmissionStatus(submissionId);
                if (res && res.status) {
                    updatePulseUI(res.status);
                    if (res.status === 'passed' || res.status === 'failed' || res.status === 'approved') {
                        clearInterval(projectsPageState.pollingInterval);
                        projectsPageState.pollingInterval = null;
                    }
                }
            } else { clearInterval(projectsPageState.pollingInterval); projectsPageState.pollingInterval = null; }
        } catch (_) {}
    }, 3000);
}

document.addEventListener('click', function (event) {
    var modal = document.getElementById('submissionModal');
    if (modal && modal.classList.contains('active') && event.target === modal) closeSubmissionModal();
});
