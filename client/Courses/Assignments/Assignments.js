window.NibrasReact.run(() => {
    const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
    if (!selectedCourse) return;
    const courseId = selectedCourse.id;
    let assignmentData = JSON.parse(JSON.stringify(selectedCourse.assignments));
    let activeFilter = "all";
    const assignmentsNotice = document.getElementById("assignments-api-notice");
    const sharedUiStates = window.NibrasShared?.uiStates || null;

    function resolveUiStateFromError(error, fallbackMessage) {
        if (sharedUiStates?.fromError) {
            return sharedUiStates.fromError(error, fallbackMessage);
        }
        return {
            state: "error",
            message: error?.message || fallbackMessage || "Request failed",
        };
    }

    function setAssignmentsNotice(message, type = "info") {
        if (!assignmentsNotice) return;
        const state = sharedUiStates?.normalize
            ? sharedUiStates.normalize(type)
            : (type || "info");
        if (sharedUiStates?.render) {
            sharedUiStates.render(assignmentsNotice, {
                state,
                message,
                mode: "notice",
            });
            return;
        }
        if (!message) {
            assignmentsNotice.hidden = true;
            assignmentsNotice.textContent = "";
            return;
        }
        assignmentsNotice.hidden = false;
        assignmentsNotice.textContent = message;
        if (state === "error" || state === "unauthorized" || state === "forbidden") {
            assignmentsNotice.style.color = "#ef4444";
            assignmentsNotice.style.borderColor = "rgba(239, 68, 68, 0.35)";
            assignmentsNotice.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
            return;
        }
        assignmentsNotice.style.color = "var(--text-secondary)";
        assignmentsNotice.style.borderColor = "var(--border-color)";
        assignmentsNotice.style.backgroundColor = "var(--bg-secondary)";
    }

    // --- 1. SIDEBAR NAVIGATION LOGIC (New Addition) ---
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            
            // Remove 'active' class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            
            // Add 'active' class to the clicked link
            link.classList.add('active');
            
            console.log(`Switched tab to: ${link.textContent.trim()}`);
        });
    });

    // --- 2. TOGGLE THEME LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');
    
    // Check initial theme logic
    updateThemeBtn(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark'); // Save preference
            updateThemeBtn('dark');
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light'); // Save preference
            updateThemeBtn('light');
        }
    });

    function updateThemeBtn(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeText.textContent = 'Dark Mode';
        }
    }

    // Update data-nav-link elements
    const navLinks = [
        { key: "courseContent", path: "../Course Description/courseContent.html" },
        { key: "videos", path: "../Videos/videos.html" },
        { key: "assignments", path: "./Assignments.html" },
        { key: "projects", path: "../Projects/Projects.html" },
        { key: "grades", path: "../Grades/grades.html" },
    ];

    navLinks.forEach(({ key, path }) => {
        const el = document.querySelector(`[data-nav-link="${key}"]`);
        if (el) el.setAttribute("href", window.NibrasCourses.withCourseId(path, courseId));
    });

    // Also update back button
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) backBtn.setAttribute("href", window.NibrasCourses.withCourseId("../courses.html", courseId));

    const termLabel = document.getElementById("course-term");
    if (termLabel) {
        termLabel.textContent = `${selectedCourse.code}: ${selectedCourse.title} • ${selectedCourse.overview.term}`;
    }

    const courseMetaTitle = document.querySelector(".course-meta h4");
    const courseMetaSubtitle = document.querySelector(".course-meta span");
    if (courseMetaTitle) courseMetaTitle.textContent = `${selectedCourse.code}: ${selectedCourse.title}`;
    if (courseMetaSubtitle) courseMetaSubtitle.textContent = `${selectedCourse.overview.term} • Week ${selectedCourse.overview.currentWeek}`;

    // --- 4. RENDER UI ---
    
    // Render List
    const container = document.getElementById('assignments-container');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const syncStats = () => {
        const completedCountEl = document.getElementById('completed-count');
        const pointsCountEl = document.getElementById('points-count');
        const progressEl = document.getElementById('overall-progress');
        if (completedCountEl) completedCountEl.textContent = `${assignmentData.stats.completed} of ${assignmentData.stats.total} completed`;
        if (pointsCountEl) pointsCountEl.textContent = `${assignmentData.stats.pointsEarned} / ${assignmentData.stats.pointsTotal} points earned`;
        if (progressEl) {
            const progress = Number(assignmentData.stats.progressPercent || 0);
            progressEl.style.width = `${progress}%`;
            progressEl.setAttribute('aria-valuenow', String(progress));
            progressEl.setAttribute('aria-valuetext', `${progress}% complete`);
        }
    };

    // Initial Render (All)
    syncStats();
    renderAssignments(activeFilter);
    hydrateAssignmentsFromAdmin();

    // Filter Click Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            filterBtns.forEach((button) => {
                button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
            });
            activeFilter = btn.getAttribute('data-filter');
            // Render
            renderAssignments(activeFilter);
        });
    });

    container?.addEventListener('click', (event) => {
        const link = event.target.closest('.action-btn[data-item-id]');
        if (!link) return;
        const itemId = link.getAttribute('data-item-id');
        const item = assignmentData.items.find((entry) => String(entry.id) === String(itemId));
        if (!item || !item.page) return;

        const detailPayload = {
            courseId,
            ...buildAssignmentDetail(item),
        };
        localStorage.setItem('selectedAssignmentDetail', JSON.stringify(detailPayload));
    });

    function renderAssignments(filter) {
        if (!container) return;
        container.innerHTML = '';
        
        assignmentData.items.forEach(item => {
            // Filter Logic
            if (filter !== 'all') {
                if (filter === 'pending' && (item.status === 'graded' || item.status === 'submitted')) return;
                if (filter === 'submitted' && item.status !== 'submitted') return;
                if (filter === 'graded' && item.status !== 'graded') return;
            }

            // Determine Badge Class & Icon
            let badgeClass = 'badge-default';
            let badgeIcon = 'fa-regular fa-clock'; // default icon
            
            if (item.status === 'graded') {
                badgeClass = 'badge-graded';
                badgeIcon = 'fa-solid fa-check';
            } else if (item.status === 'submitted') {
                badgeClass = 'badge-submitted';
                badgeIcon = 'fa-solid fa-check-double';
            } else if (item.status === 'late') {
                badgeClass = 'badge-late';
                badgeIcon = 'fa-regular fa-clock';
            }

            // Points Display Logic
            let pointsHtml = `<span class="points-label">${item.points} pts</span>`;
            if (item.score !== null) {
                pointsHtml = `
                    <span class="points-label">${item.points} pts</span>
                    <span class="score-earned">${item.score}/${item.points}</span>
                `;
            }

            // Type Icon Logic
            const typeIcon = item.type === 'File Upload' ? 'fa-solid fa-upload' : 'fa-regular fa-file-lines';

            const itemHref = item.page
                ? window.NibrasCourses.withCourseId(item.page, courseId)
                : '#';
            const actionDisabled = !item.page;
            const actionText = actionDisabled ? 'Unavailable' : item.action;
            const actionAriaLabel = actionDisabled
                ? `Assignment details unavailable for ${item.title}`
                : `${item.action} for ${item.title}`;
            const actionAttributes = actionDisabled
                ? 'aria-disabled="true" tabindex="-1"'
                : '';

            const html = `
                <article class="assignment-card">
                    <div class="card-header">
                        <div class="card-title-group">
                            <h3>${item.title}</h3>
                            <span class="status-badge ${badgeClass}">
                                <i class="${badgeIcon}"></i> ${item.statusLabel}
                            </span>
                        </div>
                        <div class="card-points">
                            ${pointsHtml}
                        </div>
                    </div>
                    
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-footer">
                        <div class="meta-info">
                            <div class="meta-item">
                                <i class="fa-regular fa-calendar"></i> Due: ${item.dueDate}
                            </div>
                            <div class="meta-item">
                                <i class="fa-regular fa-clock"></i> ${item.dueTime}
                            </div>
                            <div class="meta-item">
                                <i class="${typeIcon}"></i> ${item.type}
                            </div>
                        </div>
                        <a href="${itemHref}" class="action-btn" aria-label="${actionAriaLabel}" data-item-id="${item.id}" ${actionAttributes}>${actionText}</a>
                    </div>
                </article>
            `;
            container.innerHTML += html;
        });
        
        // Empty State
        if (container.innerHTML === '') {
            if (sharedUiStates?.render) {
                sharedUiStates.render(container, {
                    state: "empty",
                    message: "No assignments match this filter yet. Try another filter to see your work.",
                });
            } else {
                container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-secondary);">No assignments match this filter yet. Try another filter to see your work.</div>`;
            }
        }
    }

    function buildAssignmentDetail(item) {
        return {
            title: item.title,
            points: item.points,
            scoreEarned: item.score ?? 0,
            description: item.description,
            dueDate: item.dueDate,
            dueTime: item.dueTime,
            submissionType: item.type,
            milestoneId: item.milestoneId || item.id || `ms-${item.title}`,
            projectKey: item.projectKey || `${courseId}-project-1`,
            instructions: {
                intro: `Complete ${item.title} based on course requirements.`,
                points: [
                    "Follow the assignment brief.",
                    "Attach all required files and references.",
                    "Ensure your submission is complete before deadline.",
                ],
            },
            files: [],
            rubric: [
                { criteria: "Correctness", percent: "50%" },
                { criteria: "Quality", percent: "30%" },
                { criteria: "Documentation", percent: "20%" },
            ],
            feedback: {
                comment: item.score !== null ? "Graded successfully." : "No feedback yet.",
                grader: selectedCourse.instructor,
                date: "Pending",
            },
        };
    }

    async function hydrateAssignmentsFromAdmin() {
        const loadAssignments = window.NibrasCourses?.getAdminAssignmentsByCourseId;
        if (typeof loadAssignments !== 'function') return;
        
        // Don't show loading notice if we already have local data
        if (!assignmentData.items || assignmentData.items.length === 0) {
            setAssignmentsNotice('Loading assignments from the backend...', 'loading');
        }
        
        try {
            const remoteAssignments = await loadAssignments(courseId);
            if (!remoteAssignments || !Array.isArray(remoteAssignments.items) || remoteAssignments.items.length === 0) {
                console.log('[ASSIGNMENTS.JS] No remote items found, staying with local data');
                return;
            }
            assignmentData = JSON.parse(JSON.stringify(remoteAssignments));
            assignmentData.items = assignmentData.items.map((item) => ({
                ...item,
                page: item.page || "./Assignments Content/AssignmentContent.html",
                milestoneId: item.milestoneId || item.id || `ms-${item.title}` // Ensure milestoneId exists
            }));
            syncStats();
            renderAssignments(activeFilter);
            setAssignmentsNotice('');
        } catch (error) {
            console.warn('[ASSIGNMENTS.JS] Failed to hydrate assignments:', error?.message || error);
            // On error, just clear the loading notice and keep the local data
            setAssignmentsNotice('');
        }
    }
});
