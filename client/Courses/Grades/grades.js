window.NibrasReact.run(() => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. THEME TOGGLE ---
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

    // --- 3. BACKEND DATA ---
    const gradesData = {
        stats: [
            { label: "Overall Grade", value: "56.9%", sub: "", icon: "fa-solid fa-award", type: "primary", extra: "F" },
            { label: "Class Average", value: "82.5%", sub: "B", icon: "fa-solid fa-bullseye", type: "standard" },
            { label: "vs Class Avg", value: "-25.6%", sub: "Below average", icon: "fa-solid fa-arrow-trend-down", type: "standard", color: "red" },
            { label: "Graded Items", value: "6/8", sub: "Completed", icon: "fa-regular fa-circle-check", type: "standard" }
        ],
        breakdown: [
            { category: "Assignments", score: "56/75", percent: "74.7%", weight: "40% of final grade", change: "+29.9% total", color: "#f59e0b" },
            { category: "Projects", score: "0/0", percent: "0.0%", weight: "30% of final grade", change: "+0.0% total", color: "#374151" },
            { category: "Quizzes", score: "54/60", percent: "90.0%", weight: "20% of final grade", change: "+18.0% total", color: "#10b981" },
            { category: "Participations", score: "9/10", percent: "90.0%", weight: "10% of final grade", change: "+9.0% total", color: "#10b981" }
        ],
        grades: [
            { title: "Assignment 1: HTML & CSS Fundamentals", type: "assignment", date: "Due: Dec 20, 2024", score: "18/20", percent: "90.0%", status: "Graded" },
            { title: "Quiz 1: HTML5 Basics", type: "quiz", date: "Due: Dec 15, 2024", score: "28/30", percent: "93.3%", status: "Graded" },
            { title: "Assignment 2: JavaScript Basics", type: "assignment", date: "Due: Dec 22, 2024", score: "23/25", percent: "92.0%", status: "Graded" },
            { title: "Assignment 3: Responsive Design", type: "assignment", date: "Due: Dec 25, 2024", score: null, status: "Pending" },
            { title: "Project: E-Commerce Platform", type: "project", date: "Due: Jan 15, 2025", score: null, status: "Pending" },
            { title: "Quiz 2: CSS & Layouts", type: "quiz", date: "Due: Dec 10, 2024", score: "26/30", percent: "86.7%", status: "Graded" },
            { title: "Class Participation - Week 1-4", type: "participation", date: "Due: Dec 20, 2024", score: "9/10", percent: "90.0%", status: "Graded" },
            { title: "Assignment 4: React Components", type: "assignment", date: "Due: Dec 18, 2024", score: "15/30", percent: "50.0%", status: "Late Submission" }
        ],
        scale: [
            { grade: "A", range: "93-100%", color: "a" },
            { grade: "A-", range: "90-92%", color: "a" },
            { grade: "B+", range: "87-89%", color: "a" },
            { grade: "B", range: "83-86%", color: "b" },
            { grade: "B-", range: "80-82%", color: "b" },
            { grade: "C+", range: "77-79%", color: "c" },
            { grade: "C", range: "73-76%", color: "c" },
            { grade: "C-", range: "70-72%", color: "c" },
            { grade: "D+", range: "67-69%", color: "d" },
            { grade: "D", range: "63-66%", color: "d" },
            { grade: "D-", range: "60-62%", color: "d" },
            { grade: "F", range: "Below 60%", color: "f" }
        ],
        weights: [
            { cat: "Assignments", pct: "40%" },
            { cat: "Projects", pct: "30%" },
            { cat: "Quizzes", pct: "20%" },
            { cat: "Participation", pct: "10%" }
        ]
    };

    // --- 4. RENDER UI ---
    renderUI(gradesData);

    function renderUI(data) {
        
        // A. Stats Overview
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = '';
        data.stats.forEach(stat => {
            const isPrimary = stat.type === 'primary' ? 'primary-blue' : '';
            const textColor = stat.color === 'red' ? 'style="color: #ef4444;"' : '';
            const extraHtml = stat.extra ? `<span class="grade-f">${stat.extra}</span>` : '';
            
            statsContainer.innerHTML += `
                <div class="stat-box ${isPrimary}">
                    <div class="stat-label"><i class="${stat.icon}"></i> ${stat.label}</div>
                    <div class="stat-value" ${textColor}>${stat.value} ${extraHtml}</div>
                    <div class="stat-sub">${stat.sub}</div>
                </div>
            `;
        });

        // B. Grade Breakdown
        const bdContainer = document.getElementById('breakdown-container');
        bdContainer.innerHTML = '';
        data.breakdown.forEach(item => {
            bdContainer.innerHTML += `
                <div class="bd-item">
                    <div class="bd-header">
                        <div>
                            <div class="bd-title">${item.category}</div>
                            <div class="bd-sub">${item.score}points • ${item.weight}</div>
                        </div>
                        <div style="text-align:right;">
                            <div class="bd-percent">${item.percent}</div>
                            <div class="bd-sub">${item.change}</div>
                        </div>
                    </div>
                    <div class="bd-bar-track">
                        <div class="bd-bar-fill" style="width: ${parseFloat(item.percent)}%; background-color: ${item.color};"></div>
                    </div>
                </div>
            `;
        });

        // C. All Grades List
        const gradesContainer = document.getElementById('grades-list-container');
        gradesContainer.innerHTML = '';
        data.grades.forEach(grade => {
            let scoreHtml = '';
            let statusHtml = '';
            let viewHtml = '';

            if (grade.status === 'Pending') {
                scoreHtml = `<div class="g-points" style="font-size: 0.9rem; color: var(--text-secondary);"><i class="fa-regular fa-clock"></i> Pending</div>`;
            } else {
                scoreHtml = `
                    <span class="g-points">${grade.score}</span>
                    <span class="g-pct" style="color: ${parseFloat(grade.percent) < 60 ? 'var(--grade-f)' : 'var(--grade-a)'};">${grade.percent}</span>
                `;
                
                let badgeClass = 'g-status';
                if(grade.status === 'Late Submission') badgeClass += ' status-late';
                
                statusHtml = `<span class="${badgeClass}">${grade.status === 'Late Submission' ? 'Late Submission' : 'Graded'}</span>`;
                viewHtml = `<a class="view-link">View Details</a>`;
            }

            gradesContainer.innerHTML += `
                <div class="grade-row">
                    <div class="g-info">
                        <h4>${grade.title}</h4>
                        <span class="g-meta">${grade.type} • ${grade.date}</span>
                        <div style="margin-top:0.5rem;">${statusHtml}</div>
                    </div>
                    <div class="g-score">
                        ${scoreHtml}
                        ${viewHtml}
                    </div>
                </div>
            `;
        });

        // D. Scale
        const scaleContainer = document.getElementById('scale-container');
        scaleContainer.innerHTML = '';
        data.scale.forEach(s => {
            // Map color code to CSS variable manually for simplicity
            let bgVar = `var(--scale-${s.color}-bg)`;
            let textVar = `var(--scale-${s.color}-text)`;
            
            scaleContainer.innerHTML += `
                <div class="scale-row">
                    <div class="scale-badge" style="background-color: ${bgVar}; color: ${textVar};">${s.grade}</div>
                    <span>${s.range}</span>
                </div>
            `;
        });

        // E. Weights
        const wContainer = document.getElementById('weights-container');
        wContainer.innerHTML = '';
        data.weights.forEach(w => {
            wContainer.innerHTML += `
                <div class="info-row">
                    <span>${w.cat}</span>
                    <span>${w.pct}</span>
                </div>
            `;
        });
    }
});
