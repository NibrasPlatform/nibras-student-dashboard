var projectsPageState = {
    courseId: '',
    trackingCourseId: '',
    activeProject: null,
    pollingInterval: null,
};

var projectsApiClient = window.NibrasProjectsApi?.createClient?.({
    baseUrl: window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL,
    getAuthToken: function () { return window.NibrasShared?.auth?.getToken?.() || localStorage.getItem('token') || null; },
}) || null;

window.NibrasReact.run(function () {
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        var htmlElement = document.documentElement;
        var themeIcon = themeToggle.querySelector('i');
        var savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        if (themeIcon) updateIcon(themeIcon, savedTheme);
        themeToggle.addEventListener('click', function () {
            var cur = htmlElement.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if (themeIcon) updateIcon(themeIcon, next);
        });
    }
    function updateIcon(el, theme) {
        el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        var logo = document.getElementById('app-logo');
        if (logo) logo.src = theme === 'dark' ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
    }

    var urlParams = new URLSearchParams(window.location.search);
    var courseId = urlParams.get('courseId') || '';
    if (courseId) {
        projectsPageState.trackingCourseId = courseId;
        loadSelectedCourseProjects(courseId);
    } else {
        showEmptyState();
    }
});

function setNotice(message, type) {
    var el = document.getElementById('projects-api-notice');
    if (!el) return;
    if (!message) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = message;
    el.style.color = type === 'error' ? '#ef4444' : type === 'loading' ? 'var(--text-secondary)' : '';
}

function loadSelectedCourseProjects(courseId) {
    if (!courseId) { showEmptyState(); return; }
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
        showProjectData(projects[0], payload);
    }).catch(function (error) {
        setNotice('Failed to load projects. ' + (error?.message || ''), 'error');
        showEmptyState();
    });
}

function showEmptyState() {
    document.getElementById('projects-hero').style.display = 'none';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('project-grid').style.display = 'none';
    document.getElementById('projects-empty').style.display = '';
}

function showProjectData(project, payload) {
    projectsPageState.activeProject = project;
    document.getElementById('projects-empty').style.display = 'none';
    document.getElementById('projects-hero').style.display = '';
    document.getElementById('progress-container').style.display = '';
    document.getElementById('project-grid').style.display = '';

    var title = project.details?.title || project.card?.title || project.title || 'Project';
    var courseCode = project.details?.courseCode || project.card?.courseCode || '';
    var desc = project.details?.description || project.card?.description || '';

    document.getElementById('hero-course-code').textContent = courseCode;
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-subtitle').textContent = 'Track milestones, submit work, and monitor your progress.';

    var stats = project.stats || {};
    var total = stats.total || 0;
    var approved = stats.approved || 0;
    var inReview = stats.in_review || 0;
    var completion = stats.completion || 0;

    var courseNameEl = document.getElementById('course-name');
    if (courseNameEl) courseNameEl.textContent = courseCode || title;

    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-review').textContent = inReview;
    document.getElementById('stat-complete').textContent = completion + '%';

    document.getElementById('progress-title').textContent = (courseCode ? courseCode + ' — ' : '') + title;
    document.getElementById('progress-pct').textContent = completion + '%';
    document.getElementById('progress-fill').style.width = completion + '%';

    document.getElementById('progress-pct-large').textContent = completion + '%';
    document.getElementById('legend-approved').textContent = approved;
    document.getElementById('legend-review').textContent = inReview;
    document.getElementById('legend-open').textContent = (total - approved - inReview);

    document.getElementById('stat-approved-count').textContent = approved + ' / ' + total;
    document.getElementById('stat-review-count').textContent = inReview;
    document.getElementById('stat-open-count').textContent = (total - approved - inReview);

    var milestones = project.milestones || [];
    var completedCount = milestones.filter(function (m) { return m.status === 'approved' || m.status === 'complete' || m.status === 'passed'; }).length;
    document.getElementById('milestone-count').textContent = completedCount + ' / ' + milestones.length + ' complete';

    var milestoneList = document.getElementById('milestone-list');
    milestoneList.innerHTML = '';
    milestones.forEach(function (m) {
        var mStatus = m.status || 'open';
        var icon = (mStatus === 'approved' || mStatus === 'complete' || mStatus === 'passed') ? 'fa-regular fa-circle-check' : 'far fa-circle';
        var iconColor = (mStatus === 'approved' || mStatus === 'complete' || mStatus === 'passed') ? 'color:#22c55e;' : '';
        var statusLabel = mStatus.charAt(0).toUpperCase() + mStatus.slice(1).replace('_', ' ');

        milestoneList.innerHTML += [
            '<div class="milestone-item">',
            '<div class="milestone-left">',
            '<div class="milestone-circle" style="' + iconColor + '"><i class="' + icon + '"></i></div>',
            '<div>',
            '<h4>' + escapeHtml(m.title || 'Milestone') + ' <span class="status-open">' + statusLabel + '</span></h4>',
            '<p>' + escapeHtml(m.description || '') + '</p>',
            '</div>',
            '</div>',
            '<i class="fas fa-chevron-right arrow"></i>',
            '</div>',
        ].join('');
    });

    document.getElementById('project-desc').textContent = desc;
    document.getElementById('project-badge').textContent = project.details?.projectKey ? 'PUBLISHED' : 'DRAFT';

    var metaEl = document.getElementById('project-meta');
    metaEl.innerHTML = '';
    if (project.details?.rubricWeight) {
        metaEl.innerHTML += '<span class="meta-pill">WEIGHT <strong>' + escapeHtml(project.details.rubricWeight) + '</strong></span>';
    }
    metaEl.innerHTML += '<span class="meta-pill">TYPE <strong>' + escapeHtml(project.details?.deliveryMode || project.details?.type || 'Individual') + '</strong></span>';

    document.getElementById('standing-level').textContent = project.details?.level || 'Year 1';
    var standingTracker = document.getElementById('standing-tracker');
    standingTracker.innerHTML = '';
    ['Freshman', 'Sophomore', 'Junior', 'Senior'].forEach(function (y, i) {
        var active = i === 0 ? 'active' : '';
        standingTracker.innerHTML += '<div class="step ' + active + '"><span>' + (i + 1) + '</span><p>Yr ' + (i + 1) + ' ' + y + '</p></div>';
    });
    document.getElementById('standing-hint').textContent = 'Complete all projects to advance.';
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
    var form = document.getElementById('finalSubmitForm');
    if (form) form.onsubmit = handleFinalSubmit;
}

function closeSubmissionModal() {
    var modal = document.getElementById('submissionModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
    if (projectsPageState.pollingInterval) {
        clearInterval(projectsPageState.pollingInterval);
        projectsPageState.pollingInterval = null;
    }
    var formContent = document.getElementById('milestone-form-content');
    var pulse = document.getElementById('modal-pulse-tracker');
    var submitBtn = document.getElementById('submit-final-btn');
    var closePulseBtn = document.getElementById('btn-close-pulse');
    var msg = document.getElementById('submission-status-message');
    if (formContent) formContent.style.display = '';
    if (pulse) pulse.style.display = 'none';
    if (submitBtn) submitBtn.style.display = '';
    if (closePulseBtn) closePulseBtn.style.display = 'none';
    if (msg) msg.textContent = '';
    document.querySelectorAll('.pulse-step').forEach(function (s) { s.classList.remove('active', 'done'); });
}

function updatePulseUI(status) {
    var stepMap = { queued: 'step-init', processing: 'step-init', cloning: 'step-clone', testing: 'step-test', grading: 'step-grade' };
    var stepId = stepMap[status] || null;
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

async function handleFinalSubmit(event) {
    event.preventDefault();
    var form = document.getElementById('finalSubmitForm');
    var formData = new FormData(form);
    var repoUrl = formData.get('resource_link') || '';
    if (!repoUrl.trim()) { alert('Please enter a submission URL.'); return; }

    var formContent = document.getElementById('milestone-form-content');
    var pulse = document.getElementById('modal-pulse-tracker');
    var submitBtn = document.getElementById('submit-final-btn');
    var closePulseBtn = document.getElementById('btn-close-pulse');
    var msg = document.getElementById('submission-status-message');

    if (formContent) formContent.style.display = 'none';
    if (pulse) pulse.style.display = '';
    if (submitBtn) submitBtn.style.display = 'none';
    if (closePulseBtn) closePulseBtn.style.display = '';
    if (msg) msg.textContent = 'Starting submission...';

    updatePulseUI('queued');

    try {
        if (projectsApiClient && typeof projectsApiClient.submitMilestone === 'function') {
            var project = projectsPageState.activeProject;
            var result = await projectsApiClient.submitMilestone({
                milestoneId: 'final',
                courseId: projectsPageState.trackingCourseId,
                projectKey: project?.details?.projectKey || '',
                submissionType: formData.get('submission_type') || 'github',
                resourceLink: repoUrl,
                branch: String(formData.get('submission_branch') || 'main').trim() || 'main',
                commitSha: String(formData.get('submission_commit_sha') || '').trim()
            });
            if (result && result.ok) {
                updatePulseUI('passed');
                if (msg) msg.textContent = 'Submission successful!';
                if (result.data && result.data.submissionId) startPolling(result.data.submissionId);
            } else throw new Error(result?.error || 'Submission failed');
        } else {
            updatePulseUI('passed');
            if (msg) msg.textContent = 'Submitted! (demo mode)';
        }
    } catch (err) {
        updatePulseUI('failed');
        if (msg) msg.textContent = 'Error: ' + (err.message || 'Unknown');
        if (formContent) formContent.style.display = '';
        if (pulse) pulse.style.display = 'none';
        if (submitBtn) submitBtn.style.display = '';
        if (closePulseBtn) closePulseBtn.style.display = 'none';
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
