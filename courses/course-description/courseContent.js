document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');

    themeBtn.addEventListener('click', () => {
        const htmlEl = document.documentElement;
        const currentTheme = htmlEl.getAttribute('data-theme');
        
        if (currentTheme === 'light') {
            htmlEl.setAttribute('data-theme', 'dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeText.textContent = 'Light Mode';
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            themeText.textContent = 'Dark Mode';
        }
    });

    // --- 2. BACKEND DATA SIMULATION ---
    // The backend developer just needs to replace this object with API data
    const courseData = {
        code: "CS 101",
        title: "Web Development Fundamentals",
        description: "Master the essential skills to build modern, responsive websites and web applications. From HTML & CSS fundamentals to advanced React development and full-stack integration.",
        term: "Fall 2024",
        currentWeek: 4,
        totalWeeks: 8,
        stats: {
            duration: "8 Weeks",
            commitment: "12 hours/week",
            enrolled: 247
        },
        progress: {
            completedLectures: 2,
            totalLectures: 8,
            percent: 38,
            avgScore: "85%",
            assignmentsDone: "3/5"
        },
        instructor: {
            name: "Prof. Jane Smith",
            role: "Senior Web Developer",
            initials: "JS",
            rating: 4.8,
            bio: "15+ years of experience in web development and education. Previously worked at Google and Meta."
        },
        announcements: [
            {
                title: "Week 4 Live Session Tomorrow",
                date: "Dec 18, 2024",
                content: "Join us for a live coding session on JavaScript async patterns. We'll build a real-time data dashboard together."
            },
            {
                title: "Assignment Extension",
                date: "Dec 17, 2024",
                content: "Assignment 3 deadline has been extended to Dec 25, 2024 due to the holiday break."
            },
            {
                title: "New Resources Available",
                date: "Dec 16, 2024",
                content: "Check out the new JavaScript cheat sheet and video tutorials in the Resources section."
            }
        ],
        objectives: [
            "Build responsive, accessible websites using HTML5, CSS3, and modern JavaScript",
            "Develop interactive web applications with React and modern frameworks",
            "Understand web development best practices and design patterns",
            "Create RESTful APIs and integrate with databases",
            "Deploy and maintain production-ready web applications",
            "Collaborate effectively using Git and version control"
        ],
        prerequisites: [
            "Basic computer skills and familiarity with using web browsers",
            "No prior programming experience required - we'll start from the basics",
            "Dedication to spend 10-12 hours per week on coursework",
            "A computer with a modern web browser and code editor installed"
        ],
        curriculum: [
            { week: 1, title: "Introduction to Web Development", tags: ["HTML Fundamentals", "Semantic HTML", "Web Standards", "Dev Tools Intro"], activity: "HTML Structure Exercise", status: "completed" },
            { week: 2, title: "CSS Fundamentals", tags: ["CSS Syntax", "Selectors & Specificity", "Box Model", "Typography"], activity: "Style a Blog Page", status: "completed" },
            { week: 3, title: "Advanced CSS & Layouts", tags: ["Flexbox", "CSS Grid", "Responsive Design", "Media Queries"], activity: "Responsive Landing Page", status: "completed" },
            { week: 4, title: "JavaScript Basics", tags: ["Variables & Data Types", "Functions", "DOM Manipulation", "Event Handling"], activity: "Interactive Quiz App", status: "current" },
            { week: 5, title: "Modern JavaScript (ES6+)", tags: ["Arrow Functions", "Promises", "Modules", "Destructuring"], activity: "API Data Fetcher", status: "upcoming" },
            { week: 6, title: "React Fundamentals", tags: ["Components", "Props & State", "Hooks", "Lifecycle Methods"], activity: "Todo List App", status: "upcoming" },
            { week: 7, title: "Advanced React & State", tags: ["Context API", "Redux Basics", "React Router", "Form Handling"], activity: "Shopping Cart", status: "upcoming" },
            { week: 8, title: "Backend & Full-Stack", tags: ["Node.js Basics", "Express.js", "REST APIs", "Database Integration"], activity: "Full-Stack CRUD App", status: "upcoming" }
        ]
    };

    // --- 3. POPULATE THE UI ---
    populateDashboard(courseData);

    function populateDashboard(data) {
        // Header Info
        setText('header-code', data.code);
        setText('sidebar-course-code', data.code);
        setText('header-title', data.title);
        setText('header-desc', data.description);
        setText('sidebar-term', `${data.term} • Week ${data.currentWeek}`);
        
        // Header Stats
        setText('header-duration', `${data.term} • ${data.stats.duration}`);
        setText('header-commitment', data.stats.commitment);
        setText('header-students', `${data.stats.enrolled} Students Enrolled`);
        setText('current-week-num', data.currentWeek);
        setText('total-weeks', data.totalWeeks);

        // Sidebar Progress
        setText('sidebar-progress-text', `${data.progress.completedLectures} of ${data.progress.totalLectures} lectures completed`);
        document.getElementById('sidebar-progress-fill').style.width = `${(data.progress.completedLectures/data.progress.totalLectures)*100}%`;

        // Main Progress Widget
        setText('progress-percent-text', `${data.progress.percent}%`);
        document.getElementById('progress-fill-main').style.width = `${data.progress.percent}%`;
        setText('stat-score', data.progress.avgScore);
        setText('stat-assignments', data.progress.assignmentsDone);

        // Instructor
        setText('instructor-initials', data.instructor.initials);
        setText('instructor-name', data.instructor.name);
        setText('instructor-role', data.instructor.role);
        setText('instructor-rating', data.instructor.rating);
        setText('instructor-bio', data.instructor.bio);

        // Announcements Loop
        const announceContainer = document.getElementById('announcements-container');
        announceContainer.innerHTML = ''; // Clear loading state
        data.announcements.forEach(item => {
            const html = `
                <div class="announcement-item">
                    <div class="announcement-header">
                        <h4>${item.title}</h4>
                        <span class="announcement-date">${item.date}</span>
                    </div>
                    <p>${item.content}</p>
                </div>`;
            announceContainer.innerHTML += html;
        });

        // Objectives Loop
        const objContainer = document.getElementById('objectives-container');
        objContainer.innerHTML = '';
        data.objectives.forEach(obj => {
            objContainer.innerHTML += `<li><i class="fa-regular fa-circle-check"></i> ${obj}</li>`;
        });

        // Prerequisites Loop
        const preContainer = document.getElementById('prereq-container');
        preContainer.innerHTML = '';
        data.prerequisites.forEach(pre => {
            preContainer.innerHTML += `<li><span>•</span> ${pre}</li>`;
        });

        // Curriculum Loop (Complex)
        const currContainer = document.getElementById('curriculum-container');
        currContainer.innerHTML = '';
        
        data.curriculum.forEach(week => {
            let iconHtml, activeClass = '';
            
            // Determine styling based on status
            if (week.status === 'completed') {
                iconHtml = `<div class="week-icon completed"><i class="fa-solid fa-check"></i></div>`;
            } else if (week.status === 'current') {
                iconHtml = `<div class="week-icon current">${week.week}</div>`;
                activeClass = 'week-card-active';
            } else {
                iconHtml = `<div class="week-icon upcoming">${week.week}</div>`;
            }

            // Generate Tags HTML
            const tagsHtml = week.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            // Generate Badge HTML (only for current)
            const badgeHtml = week.status === 'current' ? `<span class="status-badge">Current</span>` : '';

            const weekHtml = `
                <div class="curriculum-week">
                    ${iconHtml}
                    <div class="week-content ${activeClass}">
                        <div class="week-header">
                            <span class="week-title">Week ${week.week}: ${week.title}</span>
                            ${badgeHtml}
                        </div>
                        <div class="week-tags">${tagsHtml}</div>
                        <div class="week-activity">
                            <i class="fa-regular fa-file-code"></i> ${week.activity}
                        </div>
                    </div>
                </div>`;
            
            currContainer.innerHTML += weekHtml;
        });
    }

    // Helper function to safely set text content
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

});