// 1. Theme Toggle Logic
const themeToggleBtn = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Swap icon based on theme
        const iconSvg = document.getElementById('themeIcon');
        if(newTheme === 'dark') {
            // Sun icon for dark mode
            iconSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
        } else {
            // Moon icon for light mode
            iconSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
        }
        
        // [BACKEND OPTIONAL]: You can save 'newTheme' to LocalStorage or send via API to save user preference
    });
}

// 2. View Context Switching (My Projects / Group Workspace)
function switchView(viewId, event) {
    // Update Tab Styling
    const tabs = document.querySelectorAll('.context-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if(event) {
        event.target.classList.add('active');
    }

    // Hide all main sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // Show target section
    document.getElementById(viewId).classList.add('active');
}

// 3. Dynamic Project Selection 
// Used by the backend to swap which project's details are visible based on dynamic ID (e.g. 'project-1')
function selectProject(projectId, event) {
    // Update active styling on the clicked project card
    const cards = document.querySelectorAll('.project-card-tab');
    cards.forEach(card => card.classList.remove('active'));
    
    // using currentTarget ensures we get the element with the onclick event
    if(event) {
        event.currentTarget.classList.add('active');
    }

    // Hide all project details containers
    const details = document.querySelectorAll('.project-details');
    details.forEach(detail => detail.classList.remove('active'));

    // Show the selected dynamic project details content
    const targetElement = document.getElementById(projectId);
    if(targetElement) {
        targetElement.classList.add('active');
    }
}

// 4. Backend-Ready Modal Controls
// Injects the corresponding milestone/project IDs directly into the form before opening
function openSubmissionModal(projectId, milestoneId) {
    // Populate hidden inputs for backend recognition
    document.getElementById('modal_project_id').value = projectId || '';
    document.getElementById('modal_milestone_id').value = milestoneId || '';
    
    // Reset draft state in case it was toggled before
    document.getElementById('modal_is_draft').value = "0";

    // Show Modal
    document.getElementById('submissionModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    // Optionally clear form on close
    if(modalId === 'submissionModal') {
        document.getElementById('milestoneSubmitForm').reset();
    }
}

// Handles submitting the form as a draft rather than final
function submitAsDraft() {
    // Set hidden 'is_draft' field to 1
    document.getElementById('modal_is_draft').value = "1";
    
    // Submit the form
    document.getElementById('milestoneSubmitForm').submit();
}

// Close modal if clicking outside content window
window.onclick = function(event) {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        if (event.target === overlay) {
            closeModal(overlay.id);
        }
    });
}