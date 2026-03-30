document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateButtonState(savedTheme);

    // Set initial button state based on HTML
    updateButtonState(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const htmlEl = document.documentElement;
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateButtonState(newTheme);
});


    function updateButtonState(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeText.textContent = 'Dark Mode';
        }
    }

    // --- 2. BACKEND DATA OBJECT ---
    // The backend developer replaces this object.
    const courseData = {
        title: "Web Development Fundamentals",
        progress: { completed: 2, total: 8 },
        currentLessonId: 1, // ID of the lesson currently displayed
        lessons: [
            { id: 1, title: "Lesson 1: Introduction", duration: "12:45", completed: true, locked: false},
            { id: 2, title: "Lesson 2: Basics", duration: "18:30", completed: true, locked: false },
            { id: 3, title: "Lesson 3: Advanced Tools", duration: "25:15", completed: false, locked: false },
            { id: 4, title: "Lesson 4: Deep Dive", duration: "22:00", completed: false, locked: false },
            { id: 5, title: "Lesson 5: Best Practices", duration: "16:45", completed: false, locked: false },
            { id: 6, title: "Lesson 6: Real-World Examples", duration: "28:20", completed: false, locked: true },
            { id: 7, title: "Lesson 7: Troubleshooting", duration: "19:10", completed: false, locked: true },
            { id: 8, title: "Lesson 8: Performance Tuning", duration: "24:50", completed: false, locked: true }
        ]
    };

    // --- 3. POPULATE UI ---
    populateUI(courseData);

    const lectureList = document.getElementById('lecture-list');

    lectureList.addEventListener('click', e => {
    const item = e.target.closest('.lecture-item');
    if (!item) return;

    if (item.classList.contains('locked')) return;

    const lessonId = Number(item.dataset.lessonId);
    loadLesson(lessonId);
});


    function populateUI(data) {
        
        // A. Set Breadcrumbs
        const currentLesson = data.lessons.find(l => l.id === data.currentLessonId);
        if (currentLesson) {
            document.getElementById('course-title-crumb').textContent = data.title;
            document.getElementById('lesson-title-crumb').textContent = currentLesson.title;
            
            // Set Main Title
            document.getElementById('lesson-title-main').textContent = currentLesson.title;
            document.getElementById('lesson-duration').textContent = `Duration: ${currentLesson.duration}`;
            document.getElementById('total-time').textContent = currentLesson.duration; // Player time

            // Set Status Badge
            const badge = document.getElementById('lesson-status');
            if (currentLesson.status === 'completed' || currentLesson.status === 'current') {
                // Assuming "Introduction" (current) is also marked 'Completed' in screenshot
                badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Completed`;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // B. Sidebar Progress
        document.getElementById('progress-text').textContent = `${data.progress.completed} of ${data.progress.total} lectures completed`;
        const pct = (data.progress.completed / data.progress.total) * 100;
        document.getElementById('progress-fill').style.width = `${pct}%`;

        // C. Sidebar List
        const listContainer = document.getElementById('lecture-list');
        listContainer.innerHTML = '';

        data.lessons.forEach(lesson => {
            const isActive = lesson.id === data.currentLessonId;

            let itemClass = 'lecture-item';
            let iconClass = 'fa-regular fa-circle';

            if (lesson.locked) {
                itemClass += ' locked';
                iconClass = 'fa-solid fa-lock';
            } else if (isActive) {
                itemClass += ' active';
                iconClass = 'fa-solid fa-circle-play';
            }else if (lesson.completed) {
                itemClass += ' completed';
                iconClass = 'fa-solid fa-circle-check';
            } else {
                itemClass += ' open';
}

            // Using template literal for cleaner HTML injection
            const html = `
                <div class="${itemClass}" data-lesson-id="${lesson.id}">
                    <div class="lecture-icon"><i class="${iconClass}"></i></div>
                    <div class="lecture-info">
                        <span class="lecture-title">${lesson.title}</span>
                        <span class="lecture-time">${lesson.duration}</span>
                    </div>
                </div>
            `;
            listContainer.innerHTML += html;
        });

        // D. Nav Buttons logic (Simple Prev/Next based on array index)
        const currentIndex = data.lessons.findIndex(l => l.id === data.currentLessonId);
        const prevBtn = document.getElementById('prev-btn');
        
        if (currentIndex > 0) {
            prevBtn.disabled = false;
        } else {
            prevBtn.disabled = true;
        }
    }
    function loadLesson(lessonId) {
        courseData.currentLessonId = lessonId;
        populateUI(courseData);
}

});