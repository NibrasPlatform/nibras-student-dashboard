// 1. Theme Toggle Logic
window.NibrasReact.run(() => {
    const themeBtn = document.getElementById('themeBtn');
    
    // Set initial button state based on saved theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeButtonUI(currentTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = activeTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Save preference
            
            updateThemeButtonUI(newTheme);
        });
    }

    function updateThemeButtonUI(theme) {
        if (!themeBtn) return;
        if (theme === 'dark') {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
        } else {
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
        }
    }
});

// 2. View Context Switching (My Projects / Group Workspace)
function switchView(viewId, event) {
    const tabs = document.querySelectorAll('.context-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if(event) {
        event.target.classList.add('active');
    }

    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');
}

// 3. Dynamic Project Selection 
function selectProject(projectId, event) {
    const cards = document.querySelectorAll('.project-card-tab');
    cards.forEach(card => card.classList.remove('active'));
    
    if(event) {
        event.currentTarget.classList.add('active');
    }

    const details = document.querySelectorAll('.project-details');
    details.forEach(detail => detail.classList.remove('active'));

    const targetElement = document.getElementById(projectId);
    if(targetElement) {
        targetElement.classList.add('active');
    }
}

// 4. Backend-Ready Modal Controls (Milestone Submission)
function openSubmissionModal(projectId, milestoneId) {
    document.getElementById('modal_project_id').value = projectId || '';
    document.getElementById('modal_milestone_id').value = milestoneId || '';
    document.getElementById('modal_is_draft').value = "0";

    document.getElementById('submissionModal').classList.add('active');
}

// 5. Backend-Ready Modal Controls (Feedback & History)
function openFeedbackModal(projectId, milestoneId) {

    document.getElementById('feedbackModal').classList.add('active');
}

// Generic Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    // Clear forms inside the closed modal if applicable
    if(modalId === 'submissionModal') {
        document.getElementById('milestoneSubmitForm').reset();
    }
}

function submitAsDraft() {
    document.getElementById('modal_is_draft').value = "1";
    document.getElementById('milestoneSubmitForm').submit();
}

window.onclick = function(event) {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        if (event.target === overlay) {
            closeModal(overlay.id);
        }
    });
}