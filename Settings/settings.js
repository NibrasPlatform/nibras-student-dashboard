document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const settingsData = {
        profile: {
            name: "Ziad Alaa",
            email: "ziad.alaa@nibras.edu",
            studentId: "ST-2024-001234",
            avatar: "ZA"
        },
        notifications: [
            { id: "notif-assign", title: "Assignment Deadlines", desc: "Get notified about upcoming assignment due dates", checked: true },
            { id: "notif-grade", title: "Grade Updates", desc: "Receive notifications when new grades are posted", checked: true },
            { id: "notif-course", title: "Course Announcements", desc: "Stay updated with course announcements from instructors", checked: true },
            { id: "notif-achieve", title: "Achievement Unlocked", desc: "Get notified when you earn new badges and achievements", checked: true },
            { id: "notif-email", title: "Email Notifications", desc: "Send notifications to your email address", checked: false }
        ],
        preferences: {
            language: "English",
            timezone: "Cairo",
            level: "Level 3"
        },
        privacy: [
            { id: "priv-public", title: "Public Profile", desc: "Make your profile visible to other students", checked: true },
            { id: "priv-progress", title: "Show Learning Progress", desc: "Display your course progress on your profile", checked: true },
            { id: "priv-achieve", title: "Show Achievements", desc: "Display your badges and achievements publicly", checked: true }
        ],
        theme: "light" // Initial load
    };

    // --- 3. RENDER UI ---
    
    // Populate Profile
    document.getElementById('input-name').value = settingsData.profile.name;
    document.getElementById('input-email').value = settingsData.profile.email;
    document.getElementById('input-id').value = settingsData.profile.studentId;

    // Populate Notifications
    const notifContainer = document.getElementById('notification-container');
    notifContainer.innerHTML = '';
    settingsData.notifications.forEach(n => {
        const isChecked = n.checked ? 'checked' : '';
        notifContainer.innerHTML += `
            <div class="toggle-row">
                <div class="toggle-info">
                    <h4>${n.title}</h4>
                    <p>${n.desc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="${n.id}" ${isChecked}>
                    <span class="slider round"></span>
                </label>
            </div>
        `;
    });

    // Populate Preferences
    document.getElementById('pref-lang').value = settingsData.preferences.language;
    document.getElementById('pref-timezone').value = settingsData.preferences.timezone;
    document.getElementById('pref-level').value = settingsData.preferences.level;

    // Populate Privacy
    const privContainer = document.getElementById('privacy-container');
    privContainer.innerHTML = '';
    settingsData.privacy.forEach(p => {
        const isChecked = p.checked ? 'checked' : '';
        privContainer.innerHTML += `
            <div class="toggle-row">
                <div class="toggle-info">
                    <h4>${p.title}</h4>
                    <p>${p.desc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="${p.id}" ${isChecked}>
                    <span class="slider round"></span>
                </label>
            </div>
        `;
    });

    // --- 4. THEME TOGGLE & SYNC ---
    const appLogo = document.getElementById('app-logo');
    const themeSelector = document.getElementById('theme-selector');

    // 1. Initial Check
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeUI(currentTheme);

    // 2. Handle Dropdown Change
    themeSelector.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('theme', selectedTheme);
        updateThemeUI(selectedTheme);
    });

    function updateThemeUI(theme) {
        // Update Logo
        if(appLogo) {
            appLogo.src = theme === 'dark' ? '../assets/images/logo-dark.png' : '../assets/images/logo-light.png';
        }
        // Update Dropdown Value
        if(themeSelector) {
            themeSelector.value = theme;
        }
    }

    // --- 5. SAVE MOCK ---
    document.querySelector('.btn-save').addEventListener('click', () => {
        const btn = document.querySelector('.btn-save');
        const originalText = btn.textContent;
        btn.textContent = "Saving...";
        setTimeout(() => {
            btn.textContent = "Saved!";
            btn.style.backgroundColor = "var(--change-pos)"; // Green feedback if variable exists, else stays blue
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = ""; 
            }, 2000);
        }, 800);
    });

});