const projectsPageState = {
    courseId: '',
    trackingCourseId: '',
    activeViewId: 'my-projects-view',
    activeProjectId: '',
    ui: {
        statusCounters: { approved: 0, in_review: 0, complete: 0 },
        projects: [],
    },
    pollingInterval: null,
    groupWorkspaceStatusType: 'info',
};

const milestoneStatusUiMap = Object.freeze({
    approved: {
        label: 'Approved',
        badgeClass: 'badge-graded',
        iconClass: 'fa-solid fa-check',
        iconContainerClass: 'm-graded',
        canFeedback: true,
        canSubmit: false,
    },
    in_review: {
        label: 'In Review',
        badgeClass: 'badge-submitted',
        iconClass: 'fa-solid fa-hourglass-half',
        iconContainerClass: 'm-submitted',
        canFeedback: false,
        canSubmit: false,
    },
    needs_changes: {
        label: 'Needs Changes',
        badgeClass: 'badge-late',
        iconClass: 'fa-solid fa-rotate-right',
        iconContainerClass: 'm-default',
        canFeedback: true,
        canSubmit: true,
    },
    pending: {
        label: 'Pending',
        badgeClass: 'badge-default',
        iconClass: 'fa-solid fa-clock',
        iconContainerClass: 'm-default',
        canFeedback: false,
        canSubmit: true,
    },
    complete: {
        label: 'Complete',
        badgeClass: 'badge-submitted',
        iconClass: 'fa-solid fa-flag-checkered',
        iconContainerClass: 'm-submitted',
        canFeedback: true,
        canSubmit: false,
    },
    default: {
        label: 'Pending',
        badgeClass: 'badge-default',
        iconClass: 'fa-solid fa-clock',
        iconContainerClass: 'm-default',
        canFeedback: false,
        canSubmit: true,
    },
});

const projectsApiClient = window.NibrasProjectsApi?.createClient?.({
    baseUrl: window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL,
    getAuthToken: () => window.NibrasShared?.auth?.getToken?.() || localStorage.getItem('token') || null,
}) || null;

const IDs = {
    toDom: (id) => String(id || '').startsWith('project-') ? String(id) : `project-${id}`,
    toApi: (id) => String(id || '').replace(/^project-/i, ''),
};

window.NibrasReact.run(() => {
    document.addEventListener('DOMContentLoaded', () => {
        setupThemeToggle();
        setGroupWorkspaceStatus('info', 'Student mode: Group Workspace is visible but read-only in this integration.');

        const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
        if (!selectedCourse) {
            setApiNotice('Please select a course first.', 'empty');
            return;
        }

        const context = resolveProjectsCourseContext(selectedCourse);
        projectsPageState.courseId = String(context.localCourseId || '');
        projectsPageState.trackingCourseId = String(context.trackingCourseIdForApi || '');

        updateCourseMeta(selectedCourse);
        setupNavigationLinks(context.localCourseId);

        const submitForm = document.getElementById('milestoneSubmitForm');
        if (submitForm) submitForm.addEventListener('submit', handleMilestoneSubmit);

        void loadProjectsOverview();
    });
});

async function loadProjectsOverview() {
    if (!projectsApiClient) {
        setApiNotice('Projects API is not configured.', 'error');
        return;
    }

    setApiNotice('Loading projects...', 'loading');
    try {
        const response = await projectsApiClient.getProjectsOverview({
            courseId: projectsPageState.trackingCourseId,
        });
        const payload = response?.data || {};
        mergeOverviewToState(payload);
        renderProjects();
        updateHeaderStats();
        setApiNotice(payload.pageError || '', payload.pageError ? 'empty' : '');
        setGroupWorkspaceStatus('ok', 'Student mode: Group Workspace is read-only here. Tracking API connection is active.');
    } catch (error) {
        const message = formatRequestError(error, 'Unable to load projects.');
        setApiNotice(message, 'error');
        setGroupWorkspaceStatus('error', `Student mode: Group Workspace is read-only. API status: ${message}`);
    }
}

function mergeOverviewToState(payload) {
    const projects = Array.isArray(payload?.projects) ? payload.projects : [];
    projectsPageState.ui.projects = projects.map((project, index) => {
        const projectId = IDs.toApi(project.projectId || project.id || index + 1);
        const projectKey = String(project.projectKey || '');

        return {
            domId: IDs.toDom(projectId),
            apiProjectId: projectId,
            projectKey,
            card: {
                title: String(project.title || `Project ${index + 1}`),
                meta: String(project.cardMeta || ''),
            },
            details: {
                title: String(project.title || `Project ${index + 1}`),
                description: String(project.description || ''),
            },
            milestones: Array.isArray(project.milestones) ? project.milestones : [],
            stats: {
                completion: Number(project.stats?.completion || 0),
                approved: Number(project.stats?.approved || 0),
                in_review: Number(project.stats?.in_review || 0),
                complete: Number(project.stats?.complete || 0),
                total: Number(project.stats?.total || 0),
            },
            cli: {
                setupCommand: `nibras setup --project ${projectKey || 'your-course/project-key'}`,
            },
        };
    });

    if (!projectsPageState.ui.projects.length) {
        projectsPageState.activeProjectId = '';
    } else if (!projectsPageState.activeProjectId
        || !projectsPageState.ui.projects.some((entry) => entry.domId === projectsPageState.activeProjectId)) {
        projectsPageState.activeProjectId = projectsPageState.ui.projects[0].domId;
    }

    const payloadCounters = payload?.statusCounters || {};
    const computedCounters = projectsPageState.ui.projects.reduce((acc, project) => {
        acc.approved += project.stats.approved;
        acc.in_review += project.stats.in_review;
        acc.complete += project.stats.complete;
        return acc;
    }, { approved: 0, in_review: 0, complete: 0 });

    projectsPageState.ui.statusCounters = {
        approved: Number(payloadCounters.approved ?? computedCounters.approved),
        in_review: Number(payloadCounters.in_review ?? computedCounters.in_review),
        complete: Number(payloadCounters.complete ?? computedCounters.complete),
    };
}

function renderProjects() {
    const tabsRoot = document.getElementById('projectListTabs');
    if (!tabsRoot) return;

    const projects = projectsPageState.ui.projects;
    if (!projects.length) {
        tabsRoot.innerHTML = '<div class="project-card-tab active"><h3>No Projects Found</h3></div>';
        const host = document.getElementById('projectDetailsHost');
        if (host) host.innerHTML = '<div class="card"><p>No project details available yet.</p></div>';
        return;
    }

    tabsRoot.innerHTML = projects.map((project) => `
        <button type="button" class="project-card-tab ${project.domId === projectsPageState.activeProjectId ? 'active' : ''}"
                data-dom-id="${escapeHtml(project.domId)}">
            <h3>${escapeHtml(project.card.title)}</h3>
            <p>${escapeHtml(project.card.meta || 'Project')}</p>
        </button>
    `).join('');

    tabsRoot.querySelectorAll('.project-card-tab').forEach((button) => {
        button.onclick = () => {
            projectsPageState.activeProjectId = button.dataset.domId || '';
            renderProjects();
        };
    });

    renderProjectDetails();
}

function renderProjectDetails() {
    const host = document.getElementById('projectDetailsHost');
    if (!host) return;

    const project = projectsPageState.ui.projects.find((entry) => entry.domId === projectsPageState.activeProjectId);
    if (!project) {
        host.innerHTML = '<div class="card"><p>Select a project to view details.</p></div>';
        return;
    }

    host.innerHTML = `
        <div class="project-details active">
            <div class="two-col-grid">
                <div class="left-col">
                    <div class="card">
                        <h3>${escapeHtml(project.details.title)}</h3>
                        <p class="section-desc">${escapeHtml(project.details.description || 'No description provided yet.')}</p>
                    </div>
                    <div class="card">
                        <div class="card-header"><h4>Milestones</h4></div>
                        <div class="timeline">
                            ${project.milestones.map((milestone) => createMilestoneRow(project, milestone)).join('')}
                        </div>
                    </div>
                </div>
                <div class="right-col">
                    <div class="card progress-widget">
                        <h4>Overall Progress: ${Math.max(0, Math.min(100, Math.round(project.stats.completion || 0)))}%</h4>
                        <div class="progress-bar-container">
                            <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, Math.round(project.stats.completion || 0)))}%"></div>
                        </div>
                        <div class="stat-row"><span>Approved</span><span class="stat-val green">${project.stats.approved}</span></div>
                        <div class="stat-row"><span>In Review</span><span class="stat-val">${project.stats.in_review}</span></div>
                        <div class="stat-row"><span>Total Milestones</span><span class="stat-val">${project.stats.total}</span></div>
                    </div>
                    ${createCliQuickstartCard(project)}
                </div>
            </div>
        </div>
    `;
}

function createMilestoneRow(project, milestone) {
    const status = String(milestone?.status || 'pending');
    const config = milestoneStatusUiMap[status] || milestoneStatusUiMap.default;
    const milestoneId = String(milestone?.apiMilestoneId || milestone?.id || '');
    const canSubmit = config.canSubmit && milestoneId;
    const canFeedback = config.canFeedback && milestoneId;

    let actions = '';
    if (canFeedback) {
        actions += `<button class="btn btn-outline btn-sm" type="button" onclick="openFeedbackModal('${escapeHtml(project.apiProjectId)}','${escapeHtml(milestoneId)}')">View Feedback</button> `;
    }
    if (canSubmit) {
        actions += `<button class="btn btn-primary btn-sm" type="button" onclick="openSubmissionModal('${escapeHtml(project.apiProjectId)}','${escapeHtml(milestoneId)}')">Submit Milestone</button>`;
    }
    if (!actions) actions = '<span class="card-subtitle">No action needed.</span>';

    return `
        <div class="milestone">
            <div class="m-icon ${config.iconContainerClass}"><i class="${config.iconClass}"></i></div>
            <div class="m-content">
                <div class="m-header">
                    <h4>${escapeHtml(String(milestone?.title || 'Milestone'))}</h4>
                    <span class="status-badge ${config.badgeClass}">${config.label}</span>
                </div>
                <div class="m-meta"><i class="fa-regular fa-calendar"></i> ${escapeHtml(String(milestone?.dueLabel || milestone?.dueDateLabel || 'TBD'))}</div>
                <div class="cli-actions">${actions}</div>
            </div>
        </div>
    `;
}

function createCliQuickstartCard(project) {
    return `
        <div class="card cli-quickstart">
            <div class="card-header"><h4>CLI Quickstart</h4></div>
            <p class="section-desc">Use the Nibras CLI to setup, test, and submit this project from your terminal.</p>
            <div class="cli-command-box">
                <code class="cli-command">${escapeHtml(project.cli.setupCommand)}</code>
            </div>
            <div class="cli-actions">
                <button class="btn btn-outline btn-sm" type="button" onclick="copyActiveCliSetupCommand()">Copy setup command</button>
                <button class="btn btn-primary btn-sm" type="button" onclick="openCliHelpModal()">Open CLI Guide</button>
            </div>
        </div>
    `;
}

function updateHeaderStats() {
    const counters = projectsPageState.ui.statusCounters;

    const approved = document.querySelector('[data-counter="approved"]');
    const inReview = document.querySelector('[data-counter="in_review"]');
    const complete = document.querySelector('[data-counter="complete"]');
    if (approved) approved.textContent = `Approved: ${counters.approved}`;
    if (inReview) inReview.textContent = `In Review: ${counters.in_review}`;
    if (complete) complete.textContent = `Complete: ${counters.complete}`;

    const projects = projectsPageState.ui.projects;
    const averageCompletion = projects.length
        ? Math.round(projects.reduce((sum, project) => sum + (project.stats.completion || 0), 0) / projects.length)
        : 0;
    const completionLabel = document.querySelector('.header-stats .stat-line.secondary');
    if (completionLabel) completionLabel.textContent = `${averageCompletion}% Complete`;
}

function resolveCliBaseUrl() {
    return projectsApiClient?.getCliBaseUrl?.() || resolveCliApiBase() || '{your-api-url}';
}

function getCliProjectKey() {
    var project = projectsPageState.ui.projects.find(function (e) { return e.domId === projectsPageState.activeProjectId; });
    return project?.projectKey || project?.details?.projectKey || '';
}

function updateCliCommands(courseSlug, projectKey) {
    var cliBase = resolveCliBaseUrl();
    var loginCmd = 'nibras login --api-base-url ' + cliBase;
    var setupCmd = 'nibras setup --project ' + ((projectKey || courseSlug) ? (courseSlug + '/' + (projectKey || 'project')) : 'your-course/project-key');
    var loginEl = document.getElementById('cli-login-command');
    var setupEl = document.getElementById('cli-setup-command');
    if (loginEl) loginEl.textContent = loginCmd;
    if (setupEl) setupEl.textContent = setupCmd;
}

function populateCourseDropdown(courses, selectedCourseId) {
    var select = document.getElementById('cli-course-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select a course...</option>';
    var hasSelected = false;
    (courses || []).forEach(function (c) {
        var id = c.id || c._id || '';
        var name = c.name || c.title || c.courseCode || id;
        var selected = (id === selectedCourseId) ? 'selected' : '';
        if (selected) hasSelected = true;
        select.innerHTML += '<option value="' + escapeHtml(id) + '" ' + selected + '>' + escapeHtml(name) + '</option>';
    });
    select.onchange = function () {
        var courseId = this.value;
        if (courseId) loadProjectsForCourse(courseId);
        else document.getElementById('cli-project-select').innerHTML = '<option value="">Select a project...</option>';
    };
    if (!hasSelected && courses && courses.length === 1) {
        select.value = courses[0].id || courses[0]._id || '';
        loadProjectsForCourse(select.value);
    }
}

function loadProjectsForCourse(courseId) {
    var select = document.getElementById('cli-project-select');
    if (!select) return;
    select.innerHTML = '<option value="">Loading projects...</option>';
    var services = window.NibrasServices;
    if (!services || !services.trackingProjectService) {
        select.innerHTML = '<option value="">Service unavailable</option>';
        return;
    }
    services.trackingProjectService.listByCourse(courseId).then(function (res) {
        var projects = Array.isArray(res) ? res : (res?.data || res?.projects || []);
        select.innerHTML = '<option value="">Select a project...</option>';
        var activeProjectKey = getCliProjectKey();
        (projects || []).forEach(function (p) {
            var key = p.projectKey || p.slug || p.id || p._id || '';
            var title = p.title || p.name || key;
            var selected = key && activeProjectKey && (key === activeProjectKey || title === activeProjectKey) ? 'selected' : '';
            select.innerHTML += '<option value="' + escapeHtml(key) + '" data-title="' + escapeHtml(title) + '" ' + selected + '>' + escapeHtml(title) + '</option>';
        });
        select.onchange = function () {
            var opt = this.options[this.selectedIndex];
            var key = this.value;
            var slug = document.getElementById('cli-course-select')?.value || '';
            updateCliCommands(slug, key);
        };
        var firstVal = select.value;
        var slug = document.getElementById('cli-course-select')?.value || '';
        updateCliCommands(slug, firstVal);
    }).catch(function () {
        select.innerHTML = '<option value="">Failed to load projects</option>';
    });
}

window.loadCliGuide = function () {
    var statusIcon = document.getElementById('cli-status-icon');
    var statusText = document.getElementById('cli-status-text');
    if (statusIcon) statusIcon.style.background = '#6b7280';
    if (statusText) statusText.textContent = 'Checking connection...';

    var services = window.NibrasServices;
    if (!services || !services.authService) {
        if (statusText) statusText.textContent = 'Services not loaded. Please refresh.';
        return;
    }

    var activeProjectKey = getCliProjectKey();
    var cliBase = resolveCliBaseUrl();
    updateCliCommands('', activeProjectKey);

    services.authService.getMe().then(function (res) {
        var user = res?.user || res?.data?.user || res?.data || {};
        var name = user.name || user.username || user.email || 'User';
        var githubUser = user.githubUsername || user.githubLogin || '';
        var hasGithub = Boolean(user.githubId || githubUser || user.githubAppInstalled);
        if (statusIcon) statusIcon.style.background = hasGithub ? '#10b981' : '#f59e0b';
        if (statusText) {
            statusText.textContent = hasGithub
                ? 'Connected as ' + escapeHtml(name) + (githubUser ? ' (GitHub: @' + escapeHtml(githubUser) + ')' : '')
                : 'Logged in as ' + escapeHtml(name) + ' — Link GitHub to submit projects.';
        }
    }).catch(function () {
        if (statusIcon) statusIcon.style.background = '#ef4444';
        if (statusText) statusText.textContent = 'Not connected. Run nibras login from your terminal.';
    });

    services.trackingCourseService.list().then(function (res) {
        var courses = Array.isArray(res) ? res : (res?.data || res?.courses || []);
        var selectedCourseId = '';
        var currentProject = projectsPageState.ui.projects.find(function (e) { return e.domId === projectsPageState.activeProjectId; });
        if (currentProject && currentProject.trackingCourseId) selectedCourseId = currentProject.trackingCourseId;
        populateCourseDropdown(courses, selectedCourseId);
    }).catch(function () {
        var select = document.getElementById('cli-course-select');
        if (select) select.innerHTML = '<option value="">Failed to load courses</option>';
    });
};

window.checkCliGitHubStatus = function () {
    var result = document.getElementById('cli-verify-result');
    if (result) result.textContent = 'Checking GitHub...';
    var services = window.NibrasServices;
    if (!services || !services.githubService) {
        if (result) result.textContent = 'Service unavailable';
        return;
    }
    services.githubService.getConfig().then(function (res) {
        var configured = res?.configured ?? res?.data?.configured ?? false;
        var appName = res?.appName || res?.data?.appName || '';
        if (result) result.textContent = configured ? 'GitHub App connected' + (appName ? ' (' + appName + ')' : '') + ' ✓' : 'GitHub App not installed — click Install App in Settings.';
    }).catch(function () {
        if (result) result.textContent = 'GitHub check failed (API unavailable)';
    });
};

window.checkCliApiPing = function () {
    var result = document.getElementById('cli-verify-result');
    if (result) result.textContent = 'Pinging...';
    var cliBase = resolveCliBaseUrl();
    var pingUrl = cliBase.replace(/\/+$/, '') + '/v1/health';
    fetch(pingUrl, { method: 'GET' }).then(function (r) {
        if (result) result.textContent = r.ok ? 'API reachable ✓' : 'API returned status ' + r.status;
    }).catch(function () {
        if (result) result.textContent = 'API unreachable — check the URL';
    });
};

window.linkCliGitHub = function () {
    var result = document.getElementById('cli-verify-result');
    if (result) result.textContent = 'Opening GitHub...';
    var cliBase = resolveCliBaseUrl();
    var raw = String(window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL || '').trim();
    var candidates = [];
    if (raw) candidates.push(raw.replace(/\/+$/, ''));
    var adminUrl = String(window.NIBRAS_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
    if (adminUrl && adminUrl !== raw.replace(/\/+$/, '')) candidates.push(adminUrl);
    candidates.push(cliBase);

    function tryConnect(idx) {
        if (idx >= candidates.length) {
            window.location.href = candidates[0] + '/v1/github/oauth/start';
            return;
        }
        var base = candidates[idx];
        fetch(base + '/v1/github/config', { method: 'GET' }).then(function (r) {
            if (r.status !== 404) {
                window.location.href = base + '/v1/github/oauth/start';
            } else {
                tryConnect(idx + 1);
            }
        }).catch(function () {
            tryConnect(idx + 1);
        });
    }
    tryConnect(0);
};

async function handleMilestoneSubmit(event) {
    event.preventDefault();
    if (!projectsApiClient) return;

    const payload = buildSubmissionPayload(event.currentTarget);
    setSubmissionBusy(true, 'Submitting...');

    try {
        const result = await projectsApiClient.submitMilestone(payload);
        const submissionId = String(result?.data?.submissionId || '');
        if (submissionId) {
            showPulseTracker(submissionId);
        } else {
            setSubmissionMessage('Submitted successfully.', 'success');
            setTimeout(() => closeModal('submissionModal'), 1200);
            await loadProjectsOverview();
        }
    } catch (error) {
        setSubmissionMessage(formatRequestError(error, 'Submission failed.'), 'error');
    } finally {
        setSubmissionBusy(false);
    }
}

function buildSubmissionPayload(form) {
    const data = new FormData(form);
    return {
        courseId: projectsPageState.trackingCourseId,
        projectId: IDs.toApi(data.get('project_id')),
        milestoneId: String(data.get('milestone_id') || ''),
        submissionType: String(data.get('submission_type') || 'github'),
        resourceLink: String(data.get('resource_link') || ''),
        branch: String(data.get('submission_branch') || 'main'),
        commitSha: String(data.get('submission_commit_sha') || ''),
        notes: String(data.get('notes') || ''),
    };
}

function showPulseTracker(submissionId) {
    const formContent = document.getElementById('milestone-form-content');
    const pulseTracker = document.getElementById('modal-pulse-tracker');
    const submitButton = document.getElementById('submit-milestone-btn');
    const closePulseButton = document.getElementById('btn-close-pulse');

    if (formContent) formContent.style.display = 'none';
    if (pulseTracker) pulseTracker.style.display = 'block';
    if (submitButton) submitButton.style.display = 'none';
    if (closePulseButton) closePulseButton.style.display = 'none';

    updatePulseUI('queued');

    if (projectsPageState.pollingInterval) {
        clearInterval(projectsPageState.pollingInterval);
    }

    projectsPageState.pollingInterval = setInterval(async () => {
        try {
            const statusData = await projectsApiClient.getSubmissionStatus(submissionId);
            const status = String(statusData?.status || '');
            updatePulseUI(status);

            if (['completed', 'passed', 'approved', 'failed', 'error'].includes(status)) {
                clearInterval(projectsPageState.pollingInterval);
                projectsPageState.pollingInterval = null;
                if (closePulseButton) closePulseButton.style.display = 'inline-block';
                setSubmissionMessage(status === 'failed' ? 'Submission failed.' : 'Submission completed.', status === 'failed' ? 'error' : 'success');
                await loadProjectsOverview();
            }
        } catch (error) {
            clearInterval(projectsPageState.pollingInterval);
            projectsPageState.pollingInterval = null;
            setSubmissionMessage(formatRequestError(error, 'Unable to fetch submission status.'), 'error');
        }
    }, 3000);
}

function updatePulseUI(status) {
    const steps = { init: 'step-init', clone: 'step-clone', test: 'step-test', grade: 'step-grade' };
    Object.values(steps).forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.classList.remove('step-active', 'step-done');
    });

    if (status === 'queued') {
        document.getElementById(steps.init)?.classList.add('step-active');
        return;
    }
    if (status === 'cloning') {
        document.getElementById(steps.init)?.classList.add('step-done');
        document.getElementById(steps.clone)?.classList.add('step-active');
        return;
    }
    if (status === 'running') {
        document.getElementById(steps.init)?.classList.add('step-done');
        document.getElementById(steps.clone)?.classList.add('step-done');
        document.getElementById(steps.test)?.classList.add('step-active');
        return;
    }
    if (['completed', 'passed', 'approved'].includes(status)) {
        Object.values(steps).forEach((id) => document.getElementById(id)?.classList.add('step-done'));
        return;
    }
    if (['failed', 'error'].includes(status)) {
        document.getElementById(steps.init)?.classList.add('step-done');
        document.getElementById(steps.clone)?.classList.add('step-done');
        document.getElementById(steps.test)?.classList.add('step-done');
        document.getElementById(steps.grade)?.classList.add('step-active');
    }
}

function resetSubmissionModalUi() {
    const form = document.getElementById('milestoneSubmitForm');
    const formContent = document.getElementById('milestone-form-content');
    const pulseTracker = document.getElementById('modal-pulse-tracker');
    const submitButton = document.getElementById('submit-milestone-btn');
    const closePulseButton = document.getElementById('btn-close-pulse');

    if (form) form.reset();
    if (formContent) formContent.style.display = 'block';
    if (pulseTracker) pulseTracker.style.display = 'none';
    if (submitButton) submitButton.style.display = 'inline-flex';
    if (closePulseButton) closePulseButton.style.display = 'none';
    setSubmissionMessage('');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    if (modalId === 'submissionModal') {
        if (projectsPageState.pollingInterval) {
            clearInterval(projectsPageState.pollingInterval);
            projectsPageState.pollingInterval = null;
        }
        resetSubmissionModalUi();
    }
}

function setApiNotice(message, type) {
    const element = document.getElementById('projects-api-notice');
    if (!element) return;
    element.hidden = !message;
    element.textContent = message;
    element.style.color = type === 'error' ? 'red' : 'var(--text-secondary)';
}

function setGroupWorkspaceStatus(type, message) {
    const notice = document.getElementById('group-readonly-notice');
    if (!notice) return;
    projectsPageState.groupWorkspaceStatusType = type;
    notice.textContent = message;
    if (type === 'error') {
        notice.style.color = 'red';
    } else if (type === 'ok') {
        notice.style.color = 'var(--status-graded-text)';
    } else {
        notice.style.color = 'var(--text-secondary)';
    }
}

function formatRequestError(error, fallbackMessage) {
    const code = String(error?.code || '').toUpperCase();
    const status = Number(error?.status || 0);
    const rawMessage = String(error?.message || '').trim();

    if (code === 'NETWORK_OR_CORS' || rawMessage.toLowerCase().includes('failed to fetch')) {
        return `Could not reach tracking API from ${window.location.origin}. Usually CORS/network. Add this origin to API CORS allowlist (NIBRAS_WEB_CORS_ORIGINS).`;
    }
    if (code === 'AUTH_REQUIRED' || status === 401) {
        return 'Tracking API authentication is required. Please sign in again and retry.';
    }
    if (code === 'FORBIDDEN' || status === 403) {
        return 'Your account does not have access to this course/milestone data yet.';
    }
    if (code === 'NOT_FOUND' || status === 404) {
        return 'Requested project/milestone data was not found.';
    }
    return rawMessage || fallbackMessage;
}

function setSubmissionBusy(busy, message) {
    const button = document.getElementById('submit-milestone-btn');
    if (button) button.disabled = Boolean(busy);
    if (message) setSubmissionMessage(message, busy ? '' : 'success');
}

function setSubmissionMessage(message, type) {
    const element = document.getElementById('submission-status-message');
    if (!element) return;
    element.textContent = message || '';
    if (type === 'error') {
        element.style.color = 'red';
    } else if (type === 'success') {
        element.style.color = 'green';
    } else {
        element.style.color = 'inherit';
    }
}

function updateCourseMeta(course) {
    const sidebarTitle = document.querySelector('.course-meta h4');
    if (sidebarTitle) sidebarTitle.textContent = `${course.code}: ${course.title}`;

    const pageSubtitle = document.querySelector('.header-titles p');
    if (pageSubtitle) pageSubtitle.textContent = `${course.code}: ${course.title}`;
}

function setupNavigationLinks(courseId) {
    const navLinks = [
        { key: 'courseContent', path: '../Course Description/courseContent.html' },
        { key: 'videos', path: '../Videos/videos.html' },
        { key: 'assignments', path: '../Assignments/Assignments.html' },
        { key: 'projects', path: './Projects.html' },
        { key: 'grades', path: '../Grades/grades.html' },
    ];

    navLinks.forEach(({ key, path }) => {
        const element = document.querySelector(`[data-nav-link="${key}"]`);
        if (element) element.setAttribute('href', window.NibrasCourses.withCourseId(path, courseId));
    });

    const backButton = document.querySelector('.back-btn');
    if (backButton) backButton.setAttribute('href', window.NibrasCourses.withCourseId('../courses.html', courseId));
}

function setupThemeToggle() {
    // Ensure theme is set on page load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const button = document.getElementById('themeBtn');
    if (!button) return;

    const appLogo = document.getElementById('app-logo');

    function updateThemeButton() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        
        // Update logo
        if (appLogo) {
            appLogo.src = isDark ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
        }
    }

    updateThemeButton();
    button.onclick = () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeButton();
    };
}

function resolveProjectsCourseContext(course) {
    return {
        localCourseId: course.id,
        trackingCourseIdForApi: course.trackingCourseId || course.id,
    };
}

function resolveCliApiBase() {
    const raw = String(window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL || '').trim();
    if (!raw) return '{your-api-url}';
    return raw.replace(/\/+$/, '').replace(/\/v1$/i, '');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

window.switchView = (viewId, event) => {
    projectsPageState.activeViewId = viewId;

    document.querySelectorAll('.context-tab').forEach((tab) => {
        tab.classList.remove('active');
        tab.setAttribute('aria-pressed', 'false');
    });

    if (event?.target) {
        event.target.classList.add('active');
        event.target.setAttribute('aria-pressed', 'true');
    }

    document.querySelectorAll('.view-section').forEach((section) => {
        section.classList.remove('active');
    });

    document.getElementById(viewId)?.classList.add('active');
    if (viewId === 'my-projects-view') void loadProjectsOverview();
};

window.selectProject = (domId, event) => {
    projectsPageState.activeProjectId = String(domId || '');
    if (event?.target) {
        document.querySelectorAll('.project-card-tab').forEach((button) => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        });
        event.target.classList.add('active');
        event.target.setAttribute('aria-pressed', 'true');
    }
    renderProjects();
};

window.openSubmissionModal = (projectId, milestoneId) => {
    document.getElementById('modal_project_id').value = String(projectId || '');
    document.getElementById('modal_milestone_id').value = String(milestoneId || '');

    const project = projectsPageState.ui.projects.find((entry) => entry.apiProjectId === IDs.toApi(projectId));
    const projectKeyInput = document.getElementById('modal_project_key');
    if (projectKeyInput && project?.projectKey) projectKeyInput.value = project.projectKey;

    resetSubmissionModalUi();

    const modal = document.getElementById('submissionModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
};

window.openFeedbackModal = async (projectId, milestoneId) => {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    const statusBadge = document.getElementById('feedback-status-badge');
    const comment = document.getElementById('feedback-comment');
    const checklist = document.getElementById('feedback-checklist');
    const historyBody = document.getElementById('history-body');
    if (statusBadge) statusBadge.textContent = 'Loading...';
    if (comment) comment.textContent = 'Loading feedback...';
    if (checklist) checklist.innerHTML = '<li><i class="fa-regular fa-square"></i> Loading...</li>';
    if (historyBody) historyBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    if (!projectsApiClient) return;

    try {
        const response = await projectsApiClient.getMilestoneFeedbackHistory({
            projectId: String(projectId || ''),
            milestoneId: String(milestoneId || ''),
        });
        const submissions = Array.isArray(response?.data?.submissions) ? response.data.submissions : [];
        const latestFeedback = response?.data?.latestFeedback || null;

        if (statusBadge) {
            const statusKey = String(latestFeedback?.status || '').toLowerCase();
            const config = milestoneStatusUiMap[statusKey] || milestoneStatusUiMap.default;
            statusBadge.textContent = config.label;
            statusBadge.className = `status-badge ${config.badgeClass}`;
        }

        if (comment) {
            comment.textContent = latestFeedback?.reviewerComment || 'No feedback available yet.';
        }

        // Test Results
        const testResultsContainer = document.getElementById('feedback-test-results');
        const testResultsContent = document.getElementById('feedback-test-results-content');
        if (testResultsContainer && testResultsContent) {
            if (latestFeedback?.testResults) {
                testResultsContainer.style.display = 'block';
                // Assuming testResults is a string; if it's an object, we might need to format it.
                testResultsContent.textContent = typeof latestFeedback.testResults === 'string'
                    ? latestFeedback.testResults
                    : JSON.stringify(latestFeedback.testResults, null, 2);
            } else {
                testResultsContainer.style.display = 'none';
                testResultsContent.textContent = '';
            }
        }

        // AI Evidence
        const aiAnalysisContainer = document.getElementById('project-ai-analysis');
        const aiConfidence = document.getElementById('project-ai-confidence');
        const aiReasoning = document.getElementById('project-ai-reasoning');
        const aiEvidence = document.getElementById('project-ai-evidence');
        const toggleAiButton = document.getElementById('btn-toggle-project-ai');
        if (aiAnalysisContainer && aiConfidence && aiReasoning && aiEvidence && toggleAiButton) {
            if (latestFeedback?.aiEvidence) {
                // Show the AI analysis section
                aiAnalysisContainer.style.display = 'block';
                // Set confidence if available
                if (latestFeedback.aiEvidence.confidence !== undefined) {
                    aiConfidence.textContent = `Confidence: ${latestFeedback.aiEvidence.confidence}%`;
                } else {
                    aiConfidence.textContent = 'Confidence: --%';
                }
                // Set reasoning
                aiReasoning.textContent = latestFeedback.aiEvidence.reasoning || 'No reasoning provided.';
                // Set evidence (assuming it's a string or code)
                aiEvidence.textContent = typeof latestFeedback.aiEvidence.evidence === 'string'
                    ? latestFeedback.aiEvidence.evidence
                    : JSON.stringify(latestFeedback.aiEvidence.evidence, null, 2);
                // Show the toggle button
                toggleAiButton.style.display = 'inline-block';

                // Add toggle functionality
                toggleAiButton.onclick = () => {
                    const isHidden = aiAnalysisContainer.style.display === 'none';
                    aiAnalysisContainer.style.display = isHidden ? 'block' : 'none';
                    toggleAiButton.textContent = isHidden ?
                        '<i class="fa-solid fa-brain"></i> Hide AI Analysis' :
                        '<i class="fa-solid fa-brain"></i> AI Analysis';
                };
            } else {
                // Hide the AI analysis section
                aiAnalysisContainer.style.display = 'none';
                // Reset content
                aiConfidence.textContent = 'Confidence: --%';
                aiReasoning.textContent = '...';
                aiEvidence.textContent = '...';
                // Hide the toggle button
                toggleAiButton.style.display = 'none';
                // Remove any existing onclick handler
                toggleAiButton.onclick = null;
            }
        }

        if (checklist) {
            checklist.innerHTML = latestFeedback?.reviewerComment
                ? `<li><i class="fa-regular fa-square"></i> ${escapeHtml(latestFeedback.reviewerComment)}</li>`
                : '<li><i class="fa-regular fa-square"></i> No required changes listed yet.</li>';
        }

        if (historyBody) {
            if (!submissions.length) {
                historyBody.innerHTML = '<tr><td colspan="4">No submission history yet.</td></tr>';
            } else {
                historyBody.innerHTML = submissions.map((entry, index) => {
                    const statusKey = String(entry.status || '').toLowerCase();
                    const config = milestoneStatusUiMap[statusKey] || milestoneStatusUiMap.default;
                    return `
                        <tr>
                            <td>Attempt ${submissions.length - index}</td>
                            <td>${escapeHtml(formatDateTime(entry.createdAt || entry.updatedAt))}</td>
                            <td><span class="status-badge ${config.badgeClass}">${config.label}</span></td>
                            <td>${escapeHtml(entry.reviewerComment || 'No notes')}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        if (statusBadge) statusBadge.textContent = 'Error';
        if (comment) comment.textContent = formatRequestError(error, 'Error loading feedback.');
        if (checklist) checklist.innerHTML = '<li><i class="fa-regular fa-square"></i> Unable to load required changes.</li>';
        if (historyBody) historyBody.innerHTML = '<tr><td colspan="4">Unable to load history. Check authentication, course access, and API connectivity.</td></tr>';
    }
};

window.closeModal = closeModal;

window.copyActiveCliSetupCommand = () => {
    const project = projectsPageState.ui.projects.find((entry) => entry.domId === projectsPageState.activeProjectId);
    const command = project?.cli?.setupCommand || 'nibras setup --project your-course/project-key';
    navigator.clipboard.writeText(command).then(() => setApiNotice('CLI setup command copied.', 'info'));
};

window.addEventListener('beforeunload', () => {
    if (projectsPageState.pollingInterval) {
        clearInterval(projectsPageState.pollingInterval);
        projectsPageState.pollingInterval = null;
    }
});
