window.NibrasReact.run(() => {

    // --- 1. SIDEBAR ACTIVE LOGIC ---
    // This makes sure the clicked item turns blue (active)
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(n => n.classList.remove('active'));
        link.classList.add('active');
    });
});


    // --- 2. DATA (Backend Mock) ---
    const coursesData = [
        { id: 1, title: "Data Structures & Algorithms", instructor: "Dr. Sarah Johnson", progress: 75, rating: 4.8, level: "Intermediate", deadline: "3 Assignments • Due in 5 days", isPopular: true, category: "core", type: "standard" },
        { id: 2, title: "Database Systems", instructor: "Prof. Michael Chen", progress: 91, rating: 4.7, level: "Advanced", deadline: "Assignment 2 • Due in 3 weeks", isPopular: false, category: "core", type: "standard"},
        { id: 3, title: "Web Development", instructor: "Dr. Emily Rodriguez", progress: 92, rating: 4.9, level: "Intermediate", deadline: "7 Quizzes • Due in 2 weeks", isPopular: true, category: "elective", type: "standard", page:"../Courses/Course Description/courseContent.html" },
        { id: 4, title: "Competitive Programming", instructor: "Dr. Ahmed Hassan", progress: 69, rating: 4.7, level: "Advanced", deadline: "Weekly Contest • Tomorrow, 2 PM", isPopular: true, category: "comp_prog", type: "standard" , page:"../Competitions/Contests/contest.html"},
        { id: 5, title: "Operating Systems", instructor: "Dr. Mariam Mahmoud", progress: 72, rating: 4.7, level: "Advanced", deadline: "2 Assignments • Due in 3 days", isPopular: false, category: "core", type: "standard" },
        { id: 6, title: "IT Essentials", instructor: "Dr. Amir Hassan", progress: 34, rating: 4.7, level: "Advanced", deadline: "Weekly Contest • Tomorrow, 2 PM", isPopular: true, category: "elective", type: "standard" },
        { id: 7, title: "Mathematics Fundamentals", instructor: "Dr. Osama Mohsen", progress: 100, rating: 4.7, level: "Advanced", deadline: "3 Assignments • Due in 4 days", isPopular: false, category: "core", type: "standard" },
        { id: 8, title: "Human Computer Interaction", instructor: "Dr. Salma Mohamed", progress: 75, rating: 4.7, level: "Advanced", deadline: "Assignment 2 • Due in 2 weeks", isPopular: true, category: "elective", type: "standard" },
        { id: 99, title: "Practice Labs", instructor: "Competitive Programming • Adaptive Level", progress: null, rating: null, level: null, deadline: "5-10 problems per lab", isPopular: true, isPractice: true, category: "comp_prog", type: "practice_lab", features: ["Topic-based problem sets", "AI hints & mistake analysis", "Contest simulation mode"] , page:"../Competitions/Practice/practice.html" }
    ];

    // --- 3. RENDER LOGIC ---
    const grid = document.getElementById('courses-container');
    const countBadge = document.getElementById('course-count');
    const tabs = document.querySelectorAll('.tab-btn');

    filterAndRender('all');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAndRender(tab.dataset.category);
        });
    });

    function filterAndRender(category) {
        grid.innerHTML = '';
        const filteredData = coursesData.filter(course => {
            if (category === 'all') return true;
            return course.category === category;
        });
        countBadge.textContent = filteredData.length;
        filteredData.forEach(course => {
            if (course.type === 'practice_lab') {
                renderPracticeCard(course);
            } else {
                renderStandardCard(course);
            }
        });
    }

    function renderStandardCard(course) {
        const popularBadge = course.isPopular ? `<span class="badge-popular">POPULAR</span>` : '';
        const html = `
            <div class="course-card">
                <div class="card-header"><div><h3>${course.title}</h3><span class="instructor">${course.instructor}</span></div>${popularBadge}</div>
                <div class="progress-section"><div class="progress-label"><span>Progress</span><span>${course.progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width: ${course.progress}%"></div></div></div>
                <div class="meta-info"><div class="rating"><i class="fa-solid fa-star"></i> ${course.rating} / 5</div><span class="level-tag">${course.level}</span></div>
                <div class="deadline-info"><i class="fa-regular fa-file-lines"></i> ${course.deadline}</div>
                <a href="${course.page}" class="btn-continue">Continue Learning</a>
            </div>`;
        grid.innerHTML += html;
    }

    function renderPracticeCard(course) {
        const html = `
            <div class="course-card">
                <div class="card-header"><div><h3>${course.title}</h3><span class="instructor">${course.instructor}</span></div><div style="display:flex; gap:5px"><span class="badge-practice">Practice-Focused</span><span class="badge-popular">POPULAR</span></div></div>
                <div class="practice-features"><p>Practice curated Codeforces problems with AI guidance, timed labs, and performance analytics.</p>${course.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}</div>
                <div class="problem-count"><i class="fa-regular fa-file-lines"></i> ${course.deadline}</div>
                <a href="${course.page}" class="btn-continue">Start Practice</a>
            </div>`;
        grid.innerHTML += html;
    }

    // --- 4. THEME TOGGLE (WITH LOGO SWAP) ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo'); // Get logo element
    
    // Check initial state
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../assets/images/logo-dark.png'; // Ensure correct logo on load
    } else {
        if(appLogo) appLogo.src = '../assets/images/logo-light.png';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            // Switch to Dark
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../assets/images/logo-dark.png'; // Switch to White text logo
        } else {
            // Switch to Light
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../assets/images/logo-light.png'; // Switch to Black text logo
        }
    });

    // --- 5. SEARCH ---
    const searchInput = document.getElementById('course-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.course-card');
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = title.includes(term) ? 'flex' : 'none';
        });
    });
});
