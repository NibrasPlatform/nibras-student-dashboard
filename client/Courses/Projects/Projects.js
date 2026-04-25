const projectsPageState = {
    courseId: '',
    trackingCourseId: '',
    activeViewId: 'my-projects-view',
    activeProjectId: '',
    activeMilestoneId: '',
    overview: null,
    ui: {
        statusCounters: { approved: 0, in_review: 0, complete: 0 },
        projects: []
    },
    asyncState: { loadingFeedback: false, submitting: false },
    pollingInterval: null // Moved here to prevent memory leaks
};

const milestoneStatusUiMap = Object.freeze({
    approved: { label: 'Approved', badgeClass: 'badge-graded', iconClass: 'fa-solid fa-check', iconContainerClass: 'm-graded', iconInlineStyle: '' },
    in_review: { label: 'In Review', badgeClass: 'badge-submitted', iconClass: 'fa-solid fa-hourglass-half', iconContainerClass: 'm-submitted', iconInlineStyle: '' },
    needs_changes: { label: 'Needs Changes', badgeClass: 'badge-late', iconClass: 'fa-solid fa-rotate-right', iconContainerClass: 'm-default', iconInlineStyle: 'border-color: var(--status-late-text); color: var(--status-late-text);' },
    pending: { label: 'Pending', badgeClass: 'badge-default', iconClass: 'fa-solid fa-clock', iconContainerClass: 'm-default', iconInlineStyle: '' },
    draft: { label: 'Draft Saved', badgeClass: 'badge-default', iconClass: 'fa-regular fa-floppy-disk', iconContainerClass: 'm-default', iconInlineStyle: '' },
    complete: { label: 'Complete', badgeClass: 'badge-submitted', iconClass: 'fa-solid fa-flag-checkered', iconContainerClass: 'm-submitted', iconInlineStyle: '' },
    default: { label: 'Pending', badgeClass: 'badge-default', iconClass: 'fa-solid fa-clock', iconContainerClass: 'm-default', iconInlineStyle: '' }
});

const projectsApiClient = window.NibrasProjectsApi?.createClient?.({
    baseUrl: window.NibrasShared?.resolveServiceUrl?.('tracking') || window.NIBRAS_TRACKING_API_URL,
    mockMode: window.NIBRAS_PROJECTS_MOCK_MODE === true,
    getAuthToken: () => window.NibrasShared?.auth?.getToken?.() || null
}) || null;

// Utility: ID Normalization
const IDs = {
    toDom: (id) => String(id || '').startsWith('project-') ? id : `project-${id}`,
    toApi: (id) => String(id || '').replace(/^project-/i, '')
};

// --- Main Initialization ---

window.NibrasReact.run(() => {
    // FIX: Ensure DOM is fully loaded before running logic
    document.addEventListener('DOMContentLoaded', () => {
        const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
        if (!selectedCourse) return;

        // 1. Setup Course Context
        const context = resolveProjectsCourseContext(selectedCourse);
        projectsPageState.courseId = String(context.localCourseId || '');
        projectsPageState.trackingCourseId = String(context.trackingCourseIdForApi || '');

        // 2. Update UI Elements
        updateCourseMeta(selectedCourse);
        setupNavigationLinks(context.localCourseId);
        
        // 3. Load Data
        void loadProjectsOverview();

        // 4. Setup Form Listeners
        const submitForm = document.getElementById('milestoneSubmitForm');
        if (submitForm) submitForm.addEventListener('submit', handleMilestoneSubmit);

        // 5. Setup Theme
        setupThemeToggle();
    });
});

async function loadProjectsOverview() {
    if (!projectsApiClient) return;
    setApiNotice('Loading projects...', 'loading');
    try {
        const response = await projectsApiClient.getProjectsOverview({ courseId: projectsPageState.trackingCourseId });
        const payload = response.data;
        if (payload && Array.isArray(payload.projects)) {
            mergeOverviewToState(payload);
            renderProjects();
            setApiNotice(payload.pageError || '', payload.pageError ? 'empty' : '');
        }
    } catch (error) {
        setApiNotice('Unable to load projects.', 'error');
    }
}

async function handleMilestoneSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!projectsApiClient) return;

    const payload = buildSubmissionPayload(form);
    setSubmissionBusy(true, 'Submitting...');

    try {
        const result = await projectsApiClient.submitMilestone(payload);
        if (result.ok && result.data?.submissionId) {
            showPulseTracker(result.data.submissionId);
        } else {
            setSubmissionMessage('Submitted successfully.', 'success');
            setTimeout(() => closeModal('submissionModal'), 2000);
        }
    } catch (error) {
        setSubmissionMessage(error.message || 'Submission failed.', 'error');
    } finally {
        // FIX: Always unlock button regardless of outcome
        setSubmissionBusy(false);
    }
}

function showPulseTracker(submissionId) {
    const formContent = document.getElementById('milestone-form-content');
    const pulseTracker = document.getElementById('modal-pulse-tracker');
    const submitBtn = document.getElementById('submit-milestone-btn');

    if (formContent) formContent.style.display = 'none';
    if (pulseTracker) pulseTracker.style.display = 'block';
    if (submitBtn) submitBtn.style.display = 'none';

    updatePulseUI('queued');

    // FIX: Use state-managed interval for clean clearing
    projectsPageState.pollingInterval = setInterval(async () => {
        try {
            const statusData = await projectsApiClient.getSubmissionStatus(submissionId);
            const status = String(statusData.status || '');
            updatePulseUI(status);

            if (['completed', 'passed', 'approved', 'failed', 'error'].includes(status)) {
                clearInterval(projectsPageState.pollingInterval);
                projectsPageState.pollingInterval = null;
                document.getElementById('btn-close-pulse').style.display = 'inline-block';
                void loadProjectsOverview();
            }
        } catch (e) { console.warn('Polling error:', e); }
    }, 3000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    // FIX: Stop polling immediately if the modal is closed
    if (modalId === 'submissionModal' && projectsPageState.pollingInterval) {
        clearInterval(projectsPageState.pollingInterval);
        projectsPageState.pollingInterval = null;
    }

    if (modalId === 'submissionModal') {
        document.getElementById('milestoneSubmitForm')?.reset();
        setSubmissionMessage('');
    }
}

// --- Render Functions ---

function renderProjects() {
    const tabsRoot = document.getElementById('projectListTabs');
    if (!tabsRoot) return;

    const projects = projectsPageState.ui.projects;
    if (!projects.length) {
        tabsRoot.innerHTML = '<div class="project-card-tab active"><h3>No Projects Found</h3></div>';
        return;
    }

    tabsRoot.innerHTML = projects.map(p => `
        <button type="button" class="project-card-tab ${p.domId === projectsPageState.activeProjectId ? 'active' : ''}" 
                data-dom-id="${p.domId}">
            <h3>${p.card.title}</h3>
            <p>${p.card.meta}</p>
        </button>
    `).join('');

    tabsRoot.querySelectorAll('.project-card-tab').forEach(btn => {
        btn.onclick = () => {
            projectsPageState.activeProjectId = btn.dataset.domId;
            renderProjects();
        };
    });

    renderProjectDetails();
}

function renderProjectDetails() {
    const host = document.getElementById('projectDetailsHost');
    if (!host) return;

    const project = projectsPageState.ui.projects.find(p => p.domId === projectsPageState.activeProjectId);
    if (!project) {
        host.innerHTML = '<p>Select a project to view details.</p>';
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
                        <h4>Progress: ${project.stats.completion}%</h4>
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
    const status = m.status;
    const cfg = milestoneStatusUiMap[status] || milestoneStatusUiMap.default;
    const apiProjId = IDs.toApi(project.apiProjectId);
    const apiMileId = m.apiMilestoneId;

    return `
        <div class="milestone">
            <div class="m-icon ${cfg.iconContainerClass}"><i class="${cfg.iconClass}"></i></div>
            <div class="m-content">
                <div class="m-header">
                    <h4>${m.title}</h4>
                    <span class="status-badge ${cfg.badgeClass}">${cfg.label}</span>
                </div>
                <div class="m-meta"><i class="fa-regular fa-calendar"></i> ${m.dueLabel || 'TBD'}</div>
                <button class="btn btn-sm" onclick="openSubmissionModal('${apiProjId}', '${apiMileId}')">
                    Submit Milestone
                </button>
            </div>
        </div>
    `;
}

// --- Helpers ---

function mergeOverviewToState(payload) {
    projectsPageState.ui.projects = payload.projects.map((p, i) => ({
        domId: IDs.toDom(i + 1),
        apiProjectId: IDs.toApi(p.projectId),
        card: { title: p.title, meta: p.cardMeta || 'Individual' },
        details: { title: p.title, description: p.description || '' },
        milestones: p.milestones || [],
        stats: p.stats || { completion: 0, approved: 0, total: 0 }
    }));
}

function buildSubmissionPayload(form) {
    const data = new FormData(form);
    return {
        courseId: projectsPageState.trackingCourseId,
        projectId: IDs.toApi(data.get('project_id')),
        milestoneId: data.get('milestone_id'),
        submissionType: data.get('submission_type') || 'link',
        resourceLink: data.get('resource_link'),
        branch: data.get('submission_branch') || 'main',
        commitSha: data.get('submission_commit_sha') || ''
    };
}

function setApiNotice(msg, type) {
    const el = document.getElementById('projects-api-notice');
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg;
    el.style.color = type === 'error' ? 'red' : 'var(--text-secondary)';
}

function setSubmissionBusy(busy, msg) {
    const btn = document.getElementById('submit-milestone-btn');
    if (btn) btn.disabled = busy;
    if (msg) setSubmissionMessage(msg);
}

function setSubmissionMessage(msg, type) {
    const el = document.getElementById('submission-status-message');
    if (el) {
        el.textContent = msg;
        el.style.color = type === 'success' ? 'green' : (type === 'error' ? 'red' : 'inherit');
    }
}

function updatePulseUI(status) {
    const steps = { init: 'step-init', clone: 'step-clone', test: 'step-test', grade: 'step-grade' };
    Object.values(steps).forEach(id => document.getElementById(id)?.classList.remove('step-active', 'step-done'));
    
    if (status === 'queued') document.getElementById(steps.init)?.classList.add('step-active');
    else if (status === 'cloning') {
        document.getElementById(steps.init)?.classList.add('step-done');
        document.getElementById(steps.clone)?.classList.add('step-active');
    } else if (status === 'running') {
        document.getElementById(steps.init)?.classList.add('step-done');
        document.getElementById(steps.clone)?.classList.add('step-done');
        document.getElementById(steps.test)?.classList.add('step-active');
    } else if (status === 'completed') {
        Object.values(steps).forEach(id => document.getElementById(id)?.classList.add('step-done'));
    }
}

function updateCourseMeta(course) {
    const title = document.querySelector(".course-meta h4");
    if (title) title.textContent = `${course.code}: ${course.title}`;
}

function setupNavigationLinks(courseId) {
    // Update data-nav-link elements
    const navLinks = [
        { key: "courseContent", path: "../Course Description/courseContent.html" },
        { key: "videos", path: "../Videos/videos.html" },
        { key: "assignments", path: "../Assignments/Assignments.html" },
        { key: "projects", path: "./Projects.html" },
        { key: "grades", path: "../Grades/grades.html" },
    ];

    navLinks.forEach(({ key, path }) => {
        const el = document.querySelector(`[data-nav-link="${key}"]`);
        if (el) el.setAttribute("href", window.NibrasCourses.withCourseId(path, courseId));
    });

    // Also update back button
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) backBtn.setAttribute("href", window.NibrasCourses.withCourseId("../courses.html", courseId));
}

function setupThemeToggle() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    btn.onclick = () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };
}

function resolveProjectsCourseContext(course) {
    return {
        localCourseId: course.id,
        trackingCourseIdForApi: course.trackingCourseId || course.id
    };
}

// Global access for modal buttons
window.openSubmissionModal = (projId, mileId) => {
    document.getElementById('modal_project_id').value = projId;
    document.getElementById('modal_milestone_id').value = mileId;
    document.getElementById('submissionModal').classList.add('active');
};