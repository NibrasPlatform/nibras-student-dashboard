window.NibrasReact.run(() => {
    const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
    if (!selectedCourse) return;
    const courseId = selectedCourse.id;
    let data = selectedCourse.assignmentDetail;
    const storedDetailRaw = localStorage.getItem("selectedAssignmentDetail");
    if (storedDetailRaw) {
        try {
            const parsedDetail = JSON.parse(storedDetailRaw);
            if (parsedDetail?.courseId === courseId && parsedDetail?.title) {
                data = parsedDetail;
            }
        } catch (_) {
            // Keep default seeded data when stored payload is invalid.
        }
    }

    const links = [
        { selector: '.nav-link[href*="courseContent.html"]', path: "../../Course Description/courseContent.html" },
        { selector: '.nav-link[href*="videos.html"]', path: "../../Videos/videos.html" },
        { selector: '.nav-link[href*="Assignments.html"]', path: "../Assignments.html" },
        { selector: '.nav-link[href*="Projects.html"]', path: "../../Projects/Projects.html" },
        { selector: '.nav-link[href*="grades.html"]', path: "../../Grades/grades.html" },
        { selector: ".back-btn", path: "../../courses.html" },
        { selector: ".crumb-link", path: "../Assignments.html" },
    ];

    links.forEach(({ selector, path }) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute("href", window.NibrasCourses.withCourseId(path, courseId));
    });

    const metaTitle = document.querySelector(".course-meta h4");
    const metaSubtitle = document.querySelector(".course-meta span");
    if (metaTitle) metaTitle.textContent = `${selectedCourse.code}: ${selectedCourse.title}`;
    if (metaSubtitle) metaSubtitle.textContent = `${selectedCourse.overview.term} • Week ${selectedCourse.overview.currentWeek}`;

    // --- API CLIENT INITIALIZATION ---
    const projectsClient = window.NibrasProjectsApi?.createClient?.();
    let pollingInterval = null;

    // --- 1. SIDEBAR NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. SUBMISSION LOGIC ---
    const btnSubmit = document.getElementById('btn-submit');
    const githubUrlInput = document.getElementById('github-url');
    const branchInput = document.getElementById('submission-branch');
    const commitShaInput = document.getElementById('submission-commit-sha');
    const pulseCard = document.getElementById('submission-pulse');
    const submitSection = document.getElementById('submit-section');

    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const repoUrl = githubUrlInput.value.trim();
            if (!repoUrl) {
                alert('Please enter a valid GitHub repository URL.');
                return;
            }

            try {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Submitting...';

                // Submit to backend
                const result = await projectsClient.submitMilestone({
                    milestoneId: data.milestoneId || 'default-milestone', // Fallback if data doesn't have it
                    courseId: courseId,
                    projectKey: String(data.projectKey || ''),
                    submissionType: 'github',
                    resourceLink: repoUrl,
                    branch: String(branchInput?.value || 'main').trim() || 'main',
                    commitSha: String(commitShaInput?.value || '').trim()
                });

                if (result.ok) {
                    if (result.data?.submissionId && data?.milestoneId) {
                        localStorage.setItem(`last_sub_${data.milestoneId}`, String(result.data.submissionId));
                    }
                    // Switch UI to Pulse mode
                    submitSection.style.display = 'none';
                    pulseCard.classList.add('active');
                    startPolling(result.data.submissionId);
                }
            } catch (err) {
                console.error('Submission failed:', err);
                alert(`Submission failed: ${err.message}`);
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Submit Now';
            }
        });
    }

    function startPolling(submissionId) {
        if (pollingInterval) clearInterval(pollingInterval);
        
        updatePulseUI('queued'); // Start at init

        pollingInterval = setInterval(async () => {
            try {
                const statusData = await projectsClient.getSubmissionStatus(submissionId);
                const status = String(statusData?.status || ''); // e.g., 'queued', 'running', 'passed', 'needs_review', 'failed'
                
                updatePulseUI(status);

                if (status === 'completed' || status === 'passed' || status === 'approved' || status === 'needs_review' || status === 'failed' || status === 'error') {
                    clearInterval(pollingInterval);
                    if (status === 'completed' || status === 'passed' || status === 'approved') {
                        setTimeout(() => location.reload(), 2000); // Reload to show new grade
                    }
                }
            } catch (err) {
                console.warn('Polling error:', err);
            }
        }, 3000);
    }

    function updatePulseUI(status) {
        const steps = {
            init: document.getElementById('step-init'),
            clone: document.getElementById('step-clone'),
            test: document.getElementById('step-test'),
            grade: document.getElementById('step-grade')
        };

        // Reset classes
        Object.values(steps).forEach(el => {
            el.classList.remove('step-active', 'step-done', 'step-failed');
        });

        // Map backend status to UI steps
        if (status === 'queued' || status === 'pending') {
            steps.init.classList.add('step-active');
        } else if (status === 'cloning') {
            steps.init.classList.add('step-done');
            steps.clone.classList.add('step-active');
        } else if (status === 'running_tests' || status === 'running') {
            steps.init.classList.add('step-done');
            steps.clone.classList.add('step-done');
            steps.test.classList.add('step-active');
        } else if (status === 'grading') {
            steps.init.classList.add('step-done');
            steps.clone.classList.add('step-done');
            steps.test.classList.add('step-done');
            steps.grade.classList.add('step-active');
        } else if (status === 'completed' || status === 'passed' || status === 'approved' || status === 'needs_review') {
            Object.values(steps).forEach(el => el.classList.add('step-done'));
        } else if (status === 'failed' || status === 'error') {
            // Find current active and mark as failed
            const current = document.querySelector('.pulse-step.step-active') || steps.init;
            current.classList.remove('step-active');
            current.classList.add('step-failed');
        }
    }

    // --- 3. THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');

    updateThemeBtn(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeBtn(newTheme);
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

    // --- 4. RENDER UI ---
    populateUI(data);

    async function populateUI(data) {
        // Breadcrumb & Header
        document.getElementById('crumb-title').textContent = data.title;
        document.getElementById('assign-title').textContent = data.title;
        document.getElementById('assign-points').textContent = data.points;
        document.getElementById('assign-desc').textContent = data.description;
        const scoreEarned = typeof data.scoreEarned === 'number' ? data.scoreEarned : 0;
        document.getElementById('assign-score').textContent = `${scoreEarned}/${data.points}`;
        
        // Meta
        document.getElementById('meta-due').textContent = data.dueDate;
        document.getElementById('meta-time').textContent = data.dueTime;
        document.getElementById('meta-type').textContent = data.submissionType;

        // Hide submission if already graded
        if (scoreEarned > 0 || data.feedback.comment !== '...') {
            if (submitSection) submitSection.style.display = 'none';
        }

        // Instructions
        const instrContainer = document.getElementById('instructions-container');
        let instrHtml = `<p>${data.instructions.intro}</p><ul>`;
        data.instructions.points.forEach(pt => {
            instrHtml += `<li>${pt}</li>`;
        });
        instrHtml += `</ul>`;
        instrContainer.innerHTML = instrHtml;

        // Files
        const fileContainer = document.getElementById('files-container');
        fileContainer.innerHTML = '';
        data.files.forEach(file => {
            let icon = 'fa-regular fa-file';
            if(file.type === 'pdf') icon = 'fa-regular fa-file-pdf';
            if(file.type === 'zip') icon = 'fa-regular fa-file-zipper';
            
            fileContainer.innerHTML += `
                <div class="file-item">
                    <div class="file-info"><i class="${icon}"></i> ${file.name}</div>
                    <a href="#" class="download-link">Download</a>
                </div>
            `;
        });

        // Rubric
        const rubricContainer = document.getElementById('rubric-container');
        rubricContainer.innerHTML = '';
        data.rubric.forEach(item => {
            rubricContainer.innerHTML += `
                <div class="rubric-item">
                    <span class="rubric-name">${item.criteria}</span>
                    <span class="rubric-percent">${item.percent}</span>
                </div>
            `;
        });

        // Feedback
        document.getElementById('feedback-text').textContent = data.feedback.comment;
        document.getElementById('grader-name').textContent = data.feedback.grader;
        document.getElementById('graded-date').textContent = data.feedback.date;

        // --- AI DEEP ANALYSIS LOGIC ---
        const toggleBtn = document.getElementById('toggle-ai-analysis');
        const aiContainer = document.getElementById('ai-analysis-container');
        
        // Check if we have a submission ID to fetch deep feedback
        const submissionId = data.submissionId || localStorage.getItem(`last_sub_${data.milestoneId}`);
        
        if (submissionId && (scoreEarned > 0 || data.status === 'approved')) {
            try {
                const review = await projectsClient.getSubmissionReview(submissionId);
                if (review && (review.reasoning || review.evidence || typeof review.confidence_score === 'number')) {
                    toggleBtn.style.display = 'flex';
                    const confidencePercent = typeof review.confidence_score === 'number'
                        ? Math.round(review.confidence_score * 100)
                        : null;
                    document.getElementById('ai-reasoning-text').textContent = review.reasoning || 'No semantic reasoning was returned for this review.';
                    document.getElementById('ai-confidence').textContent = confidencePercent == null ? 'Confidence: --%' : `Confidence: ${confidencePercent}%`;
                    document.getElementById('ai-evidence-code').textContent = review.evidence || '// No specific code snippet flagged.';
                    
                    toggleBtn.addEventListener('click', () => {
                        const isHidden = aiContainer.style.display === 'none';
                        aiContainer.style.display = isHidden ? 'block' : 'none';
                        toggleBtn.innerHTML = isHidden 
                            ? '<i class="fa-solid fa-eye-slash"></i> Hide AI Analysis' 
                            : '<i class="fa-solid fa-brain"></i> View AI Analysis';
                    });
                }
            } catch (err) {
                console.warn('Could not fetch AI review:', err);
            }
        }
    }
});
