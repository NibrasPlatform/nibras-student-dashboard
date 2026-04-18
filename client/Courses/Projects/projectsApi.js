/**
 * =============================================================================
 * PART 1: NIBRAS PROJECTS API ADAPTER
 * =============================================================================
 */
(function initProjectsApi(global) {
    const PATHS = {
        DASHBOARD_STUDENT: '/v1/tracking/dashboard/student',
        DASHBOARD_HOME: '/v1/tracking/dashboard/home',
        SUBMISSIONS_BY_MILESTONE: '/v1/tracking/milestones/{milestoneId}/submissions',
        SUBMISSIONS_QUERY: '/v1/tracking/submissions',
        SUBMISSION_DETAIL: '/v1/tracking/submissions/{submissionId}',
        SUBMISSION_REVIEW: '/v1/tracking/submissions/{submissionId}/review',
        LEGACY_SUBMISSIONS: '/v1/submissions'
    };

    const RUNTIME_ORIGIN = /^https?:/i.test(global.location?.origin || '') ? String(global.location.origin).replace(/\/+$/, '') : '';
    const DEFAULT_BACKEND_URL = global.NibrasShared?.resolveServiceUrl?.('tracking') || global.NibrasApi?.resolveServiceUrl?.('tracking') || global.NIBRAS_TRACKING_API_URL || RUNTIME_ORIGIN;

    function createClient(options = {}) {
        const settings = {
            baseUrl: String(options.baseUrl || DEFAULT_BACKEND_URL).replace(/\/+$/, ''),
            mockMode: Boolean(options.mockMode),
            getAuthToken: options.getAuthToken || (() => global.NibrasShared?.auth?.getToken?.() || global.NibrasApi?.getToken?.() || null),
            fetchImpl: options.fetchImpl || (typeof global.fetch === 'function' ? global.fetch.bind(global) : null),
        };

        return Object.freeze({
            getProjectsOverview: (req) => getProjectsOverview(req || {}, settings),
            getMilestoneFeedbackHistory: (req) => getMilestoneFeedbackHistory(req || {}, settings),
            submitMilestone: (payload) => submitMilestone(payload || {}, settings),
            getSubmissionStatus: (id) => getSubmissionStatus(id, settings),
            getSubmissionReview: (id) => getSubmissionReview(id, settings),
        });
    }

    async function getSubmissionStatus(submissionId, settings) {
        const res = await requestJsonWithCompatibility([
            { flavor: 'tracking', path: PATHS.SUBMISSION_DETAIL.replace('{submissionId}', encodeURIComponent(submissionId)) },
            { flavor: 'legacy', path: `${PATHS.LEGACY_SUBMISSIONS}/${encodeURIComponent(submissionId)}` }
        ], { method: 'GET' }, settings);
        return { submissionId, status: res?.status || res?.data?.status || '', raw: res };
    }

    async function getProjectsOverview(request, settings) {
        const query = request.courseId ? `?courseId=${encodeURIComponent(request.courseId)}` : '';
        const data = await requestJsonWithCompatibility([
            { flavor: 'tracking', path: `${PATHS.DASHBOARD_STUDENT}${query}` },
            { flavor: 'tracking', path: `${PATHS.DASHBOARD_HOME}${query}&mode=student` }
        ], { method: 'GET' }, settings);
        return { ok: true, data };
    }

    async function getMilestoneFeedbackHistory(request, settings) {
        const { milestoneId, projectId } = request;
        const res = await requestJsonWithCompatibility([
            { flavor: 'tracking', path: PATHS.SUBMISSIONS_BY_MILESTONE.replace('{milestoneId}', encodeURIComponent(milestoneId)) },
            { flavor: 'legacy', path: `${PATHS.LEGACY_SUBMISSIONS}?projectId=${projectId}&milestoneId=${milestoneId}` }
        ], { method: 'GET' }, settings);
        return { ok: true, data: { submissions: Array.isArray(res) ? res : res?.submissions || [] } };
    }

    async function submitMilestone(payload, settings) {
        const body = { ...payload, submissionValue: payload.resourceLink };
        const res = await requestJsonWithCompatibility([
            { flavor: 'tracking', path: PATHS.SUBMISSIONS_BY_MILESTONE.replace('{milestoneId}', encodeURIComponent(payload.milestoneId)) },
            { flavor: 'legacy', path: PATHS.LEGACY_SUBMISSIONS }
        ], { method: 'POST', body }, settings);
        return { ok: true, data: res };
    }

    async function getSubmissionReview(submissionId, settings) {
        try {
            return await requestJsonWithCompatibility([
                { flavor: 'tracking', path: PATHS.SUBMISSION_REVIEW.replace('{submissionId}', encodeURIComponent(submissionId)) },
                { flavor: 'legacy', path: `${PATHS.LEGACY_SUBMISSIONS}/${submissionId}/review` }
            ], { method: 'GET' }, settings);
        } catch { return null; }
    }

    async function requestJsonWithCompatibility(candidates, options, settings) {
        for (const c of candidates) {
            try { return await requestJson(c.path, options, settings); } 
            catch (e) { if (e.status !== 404) throw e; }
        }
        throw new Error('API Route not found');
    }

    async function requestJson(path, options, settings) {
        const headers = { 'Content-Type': 'application/json' };
        const token = settings.getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await settings.fetchImpl(`${settings.baseUrl}${path}`, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        const parsed = await response.json().catch(() => null);
        if (!response.ok) {
            const err = new Error(parsed?.message || 'API Error');
            err.status = response.status;
            throw err;
        }
        return parsed;
    }

    global.NibrasProjectsApi = { createClient };
})(window);

/**
 * =============================================================================
 * PART 2: PROJECTS FRONTEND CONTROLLER
 * =============================================================================
 */
const projectsPageState = {
    courseId: '',
    trackingCourseId: '',
    activeViewId: 'my-projects-view',
    activeProjectId: null, // Store the actual API ID here
    ui: { projects: [] },
    asyncState: { submitting: false },
    pollingInterval: null
};

const milestoneStatusUiMap = Object.freeze({
    approved: { label: 'Approved', badgeClass: 'badge-graded', iconClass: 'fa-solid fa-check', canFeedback: true, canSubmit: false },
    in_review: { label: 'In Review', badgeClass: 'badge-submitted', iconClass: 'fa-solid fa-hourglass-half', canFeedback: false, canSubmit: false },
    needs_changes: { label: 'Needs Changes', badgeClass: 'badge-late', iconClass: 'fa-solid fa-rotate-right', canFeedback: true, canSubmit: true },
    pending: { label: 'Pending', badgeClass: 'badge-default', iconClass: 'fa-solid fa-clock', canFeedback: false, canSubmit: true },
    complete: { label: 'Complete', badgeClass: 'badge-submitted', iconClass: 'fa-solid fa-flag-checkered', canFeedback: true, canSubmit: false },
    default: { label: 'Pending', badgeClass: 'badge-default', iconClass: 'fa-solid fa-clock', canFeedback: false, canSubmit: true }
});

const projectsApiClient = window.NibrasProjectsApi?.createClient?.({
    baseUrl: window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL,
    mockMode: window.NIBRAS_PROJECTS_MOCK_MODE === true
}) || null;

window.NibrasReact.run(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
        if (!selectedCourse) return;

        projectsPageState.courseId = String(selectedCourse.id || '');
        projectsPageState.trackingCourseId = String(selectedCourse.trackingCourseId || selectedCourse.id);

        void loadProjectsOverview();

        const submitForm = document.getElementById('milestoneSubmitForm');
        if (submitForm) submitForm.addEventListener('submit', handleMilestoneSubmit);
        setupThemeToggle();
    });
});

// --- Core Logic ---

async function loadProjectsOverview() {
    if (!projectsApiClient) return;
    setApiNotice('Loading...', 'loading');
    try {
        const response = await projectsApiClient.getProjectsOverview({ courseId: projectsPageState.trackingCourseId });
        const payload = response.data;
        if (payload?.projects) {
            mergeOverviewToState(payload);
            renderTabs();
            renderDetails();
            setApiNotice('', '');
        }
    } catch (e) {
        setApiNotice('Error loading projects', 'error');
    }
}

function mergeOverviewToState(payload) {
    projectsPageState.ui.projects = payload.projects.map(p => ({
        apiProjectId: String(p.projectId),
        card: { title: p.title, meta: p.cardMeta || 'Individual' },
        details: { title: p.title, description: p.description || '' },
        milestones: p.milestones || [],
        stats: p.stats || { completion: 0, approved: 0, total: 0 }
    }));

    // IMPORTANT: Set default active project to the FIRST project in the list
    if (projectsPageState.ui.projects.length > 0) {
        projectsPageState.activeProjectId = projectsPageState.ui.projects[0].apiProjectId;
    }
}

function renderTabs() {
    const tabsRoot = document.getElementById('projectListTabs');
    if (!tabsRoot) return;

    const projects = projectsPageState.ui.projects;
    tabsRoot.innerHTML = projects.map(p => `
        <button type="button" class="project-card-tab ${p.apiProjectId === projectsPageState.activeProjectId ? 'active' : ''}" 
                data-api-id="${p.apiProjectId}">
            <h3>${p.card.title}</h3>
            <p>${p.card.meta}</p>
        </button>
    `).join('');

    tabsRoot.querySelectorAll('.project-card-tab').forEach(btn => {
        btn.onclick = () => {
            // 1. Update the state
            projectsPageState.activeProjectId = btn.dataset.apiId;
            // 2. Update only the tabs UI
            renderTabs();
            // 3. Update the details UI
            renderDetails();
        };
    });
}

function renderDetails() {
    const host = document.getElementById('projectDetailsHost');
    if (!host) return;

    // Find project using API ID
    const project = projectsPageState.ui.projects.find(p => p.apiProjectId === projectsPageState.activeProjectId);
    
    if (!project) {
        host.innerHTML = '<div class="card"><p>Please select a project from the list.</p></div>';
        return;
    }

    host.innerHTML = `
        <div class="project-details active">
            <div class="two-col-grid">
                <div class="left-col">
                    <div class="card">
                        <h3>${project.details.title}</h3>
                        <p>${project.details.description}</p>
                    </div>
                    <div class="card">
                        <div class="card-header"><h4>Milestones</h4></div>
                        <div class="timeline">
                            ${project.milestones.map(m => createMilestoneRow(project, m)).join('')}
                        </div>
                    </div>
                </div>
                <div class="right-col">
                    <div class="card progress-widget">
                        <h4>Overall Progress: ${project.stats.completion}%</h4>
                        <div class="progress-bar-container">
                            <div class="progress-fill" style="width: ${project.stats.completion}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createMilestoneRow(project, m) {
    const status = m.status || 'pending';
    const cfg = milestoneStatusUiMap[status] || milestoneStatusUiMap.default;
    const apiProjId = project.apiProjectId;
    const apiMileId = m.apiMilestoneId || m.id;

    let actionBtn = '';
    if (cfg.canFeedback) {
        actionBtn += `<button class="btn btn-outline btn-sm" onclick="openFeedbackModal('${apiProjId}', '${apiMileId}')">View Feedback</button> `;
    }
    if (cfg.canSubmit) {
        actionBtn += `<button class="btn btn-primary btn-sm" onclick="openSubmissionModal('${apiProjId}', '${apiMileId}')">Submit Milestone</button>`;
    }

    return `
        <div class="milestone">
            <div class="m-icon ${cfg.iconContainerClass}"><i class="${cfg.iconClass}"></i></div>
            <div class="m-content">
                <div class="m-header">
                    <h4>${m.title || 'Milestone'}</h4>
                    <span class="status-badge ${cfg.badgeClass}">${cfg.label}</span>
                </div>
                <div class="m-meta"><i class="fa-regular fa-calendar"></i> ${m.dueLabel || 'TBD'}</div>
                <div style="margin-top:10px">${actionBtn}</div>
            </div>
        </div>
    `;
}

// --- Modal & Global Functions ---

window.switchView = (viewId, event) => {
    projectsPageState.activeViewId = viewId;
    document.querySelectorAll('.context-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-pressed', 'false');
    });
    if (event) {
        event.target.classList.add('active');
        event.target.setAttribute('aria-pressed', 'true');
    }
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId)?.classList.add('active');
    void loadProjectsOverview();
};

window.openSubmissionModal = (projId, mileId) => {
    document.getElementById('modal_project_id').value = projId;
    document.getElementById('modal_milestone_id').value = mileId;
    document.getElementById('submissionModal').classList.add('active');
};

window.openFeedbackModal = async (projId, mileId) => {
    document.getElementById('feedbackModal').classList.add('active');
    document.getElementById('feedback-comment').textContent = 'Loading...';
    try {
        const res = await projectsApiClient.getMilestoneFeedbackHistory({ projectId: projId, milestoneId: mileId });
        const latest = res.data.latestFeedback || {};
        document.getElementById('feedback-status-badge').textContent = latest.status || 'Pending';
        document.getElementById('feedback-comment').textContent = latest.reviewerComment || 'No feedback available yet.';
    } catch (e) {
        document.getElementById('feedback-comment').textContent = 'Error loading feedback.';
    }
};

window.closeModal = (modalId) => {
    document.getElementById(modalId)?.classList.remove('active');
    if (modalId === 'submissionModal' && projectsPageState.pollingInterval) {
        clearInterval(projectsPageState.pollingInterval);
        projectsPageState.pollingInterval = null;
    }
};

async function handleMilestoneSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
        courseId: projectsPageState.trackingCourseId,
        projectId: document.getElementById('modal_project_id').value,
        milestoneId: document.getElementById('modal_milestone_id').value,
        resourceLink: document.getElementById('resource_link').value,
        branch: document.getElementById('submission_branch')?.value || 'main'
    };
    
    setSubmissionBusy(true, 'Submitting...');
    try {
        const result = await projectsApiClient.submitMilestone(payload);
        if (result.ok && result.data?.submissionId) {
            showPulseTracker(result.data.submissionId);
        }
    } catch (e) {
        setSubmissionMessage(e.message, 'error');
    } finally {
        setSubmissionBusy(false);
    }
}

function showPulseTracker(submissionId) {
    document.getElementById('milestone-form-content').style.display = 'none';
    document.getElementById('modal-pulse-tracker').style.display = 'block';
    projectsPageState.pollingInterval = setInterval(async () => {
        const statusData = await projectsApiClient.getSubmissionStatus(submissionId);
        updatePulseUI(statusData.status);
        if (['completed', 'failed', 'approved'].includes(statusData.status)) {
            clearInterval(projectsPageState.pollingInterval);
            document.getElementById('btn-close-pulse').style.display = 'block';
        }
    }, 3000);
}

function setApiNotice(msg, type) {
    const el = document.getElementById('projects-api-notice');
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg;
    el.style.color = type === 'error' ? 'red' : 'inherit';
}

function setSubmissionBusy(busy, msg) {
    document.getElementById('submit-milestone-btn').disabled = busy;
    if (msg) setSubmissionMessage(msg);
}

function setSubmissionMessage(msg, type) {
    const el = document.getElementById('submission-status-message');
    if (el) {
        el.textContent = msg;
        el.style.color = type === 'error' ? 'red' : 'green';
    }
}

function updatePulseUI(status) {
    const steps = { init: 'step-init', clone: 'step-clone', test: 'step-test', grade: 'step-grade' };
    if (status === 'queued') document.getElementById(steps.init)?.classList.add('step-active');
    if (status === 'completed') Object.values(steps).forEach(id => document.getElementById(id)?.classList.add('step-done'));
}

function setupThemeToggle() {
    document.getElementById('themeBtn')?.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}