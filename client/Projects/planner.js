document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    }
});

// PLANNER TAB SWITCHING LOGIC
function switchPlannerTab(tabId) {
    // 1. Update Tab Buttons
    document.querySelectorAll('.tab-pill').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase() === tabId) btn.classList.add('active');
    });

    // 2. Update Content Visibility
    document.querySelectorAll('.planner-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-' + tabId).classList.add('active');

    // 3. Update Hero Section Content based on Tab
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroActions = document.getElementById('heroActions');

    if (tabId === 'overview') {
        heroTitle.innerText = "University-style program planning";
        heroDesc.innerText = "Organize your degree path, choose a track when eligible, file petitions, and keep a printable record of requirement progress.";
        heroActions.innerHTML = `<button class="btn-outline">Choose Track</button><button class="btn-planner-primary">Printable Sheet</button>`;
    } else if (tabId === 'track') {
        heroTitle.innerText = "Choose your academic track";
        heroDesc.innerText = "Select the specialization path attached to your program version. Track selection follows the current year gate in your program policy.";
        heroActions.innerHTML = `<button class="btn-outline">Back to planner</button>`;
    } else if (tabId === 'petitions') {
        heroTitle.innerText = "Petitions and exceptions";
        heroDesc.innerText = "Request transfer credit, substitutions, or waivers and track each review state alongside your program record.";
        heroActions.innerHTML = `<button class="btn-outline">Back to planner</button>`;
    } else if (tabId === 'sheet') {
        heroTitle.innerText = "Printable program sheet";
        heroDesc.innerText = "Generate a snapshot of your requirement matches, petitions, approvals, and current track for advisor or department review.";
        heroActions.innerHTML = `<button class="btn-outline">Print</button><button class="btn-planner-primary">Generate snapshot</button>`;
    }
}

// Logic for the "Enroll" button transition
const btnEnrollNow = document.getElementById('btn-enroll-now');
const enrollSection = document.getElementById('enroll-section');
const degreePlanSection = document.getElementById('degree-plan-section');

if (btnEnrollNow) {
    btnEnrollNow.addEventListener('click', () => {
        // Hide the enrollment cards
        enrollSection.style.display = 'none';
        
        // Show the 4-year planning grid
        degreePlanSection.style.display = 'block';
        
        // Optional: Smooth scroll to the top of the plan
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}