document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent jump for demo
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');

    updateThemeBtn(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
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

    // --- 3. BACKEND DATA OBJECT ---
    const data = {
        title: "Assignment 1: Fundamentals of HTML & CSS",
        points: 20,
        scoreEarned: 18,
        description: "Create a responsive landing page using HTML5 and CSS3",
        dueDate: "Dec 20, 2024",
        dueTime: "11:59 PM",
        submissionType: "File Upload",
        instructions: {
            intro: "Build a single-page website with:",
            points: [
                "Semantic HTML structure",
                "Flexbox or Grid layout",
                "Responsive design (mobile-first)",
                "Clean, modern styling"
            ]
        },
        files: [
            { name: "assignment1_requirements.pdf", type: "pdf" },
            { name: "starter_template.zip", type: "zip" }
        ],
        rubric: [
            { criteria: "Code Quality & Structure", percent: "40%" },
            { criteria: "Functionality & Requirements", percent: "40%" },
            { criteria: "Documentation & Comments", percent: "20%" }
        ],
        feedback: {
            comment: "Excellent work! Your code is clean and well-structured. Minor improvement needed in responsive breakpoints.",
            grader: "Prof. Jane Smith",
            date: "Dec 19, 2024, 3:42 PM"
        }
    };

    // --- 4. RENDER UI ---
    populateUI(data);

    function populateUI(data) {
        // Breadcrumb & Header
        document.getElementById('crumb-title').textContent = data.title;
        document.getElementById('assign-title').textContent = data.title;
        document.getElementById('assign-points').textContent = data.points;
        document.getElementById('assign-desc').textContent = data.description;
        document.getElementById('assign-score').textContent = `${data.scoreEarned}/${data.points}`;
        
        // Meta
        document.getElementById('meta-due').textContent = data.dueDate;
        document.getElementById('meta-time').textContent = data.dueTime;
        document.getElementById('meta-type').textContent = data.submissionType;

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
    }

});