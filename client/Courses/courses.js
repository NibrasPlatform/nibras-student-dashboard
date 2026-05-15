console.log('[COURSES.JS] Script started (direct execution)');

// --- 1. DATA ---
let coursesData = [];

function initCourses() {
    console.log('[COURSES.JS] Initializing courses page');

    // Check if user has selected a level (first-time onboarding)
    var storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem('user')); } catch (_) {}
    if (!storedUser || !storedUser.selectedLevel) {
        window.location.replace('../Levels/level.html');
        return;
    }

    // --- 2. SIDEBAR ACTIVE LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 3. RENDER LOGIC ---
    const grid = document.getElementById('courses-container');
    const countBadge = document.getElementById('course-count');
    const tabs = document.querySelectorAll('.tab-btn');

    if (!grid) {
        console.error('[COURSES.JS] ERROR: courses-container not found!');
        return;
    }

    console.log('[COURSES.JS] Found container, rendering courses');
    let activeCategory = 'all';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            filterAndRender(activeCategory);
        });
    });

    hydrateCoursesFromAdmin();

    function filterAndRender(category) {
        grid.innerHTML = '';
        const filteredData = coursesData.filter(course => {
            if (category === 'all') return true;
            return course.category === category;
        });
        countBadge.textContent = filteredData.length;
        console.log(`[COURSES.JS] Rendering ${filteredData.length} courses for category: ${category}`);
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
        const coursePage = window.NibrasCourses?.withCourseId?.("./Course Description/courseContent.html", course.id) || "./Course Description/courseContent.html";
        const buttonHTML = `<a href="${coursePage}" class="btn-continue">Continue Learning</a>`;
        
        const html = `
            <div class="course-card">
                <div class="card-header"><div><h3>${course.title}</h3><span class="instructor">${course.instructor}</span></div>${popularBadge}</div>
                <div class="progress-section"><div class="progress-label"><span>Progress</span><span>${course.progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width: ${course.progress}%"></div></div></div>
                <div class="meta-info"><div class="rating"><i class="fa-solid fa-star"></i> ${course.rating} / 5</div><span class="level-tag">${course.level}</span></div>
                <div class="deadline-info"><i class="fa-regular fa-file-lines"></i> ${course.deadline}</div>
                ${buttonHTML}
            </div>`;
        grid.innerHTML += html;
    }

    function renderPracticeCard(course) {
        const pageLink = course.page || "../Competitions/Practice/practice.html";
        const html = `
            <div class="course-card">
                <div class="card-header"><div><h3>${course.title}</h3><span class="instructor">${course.instructor}</span></div><div style="display:flex; gap:5px"><span class="badge-practice">Practice-Focused</span><span class="badge-popular">POPULAR</span></div></div>
                <div class="practice-features"><p>Practice curated Codeforces problems with AI guidance, timed labs, and performance analytics.</p>${course.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}</div>
                <div class="problem-count"><i class="fa-regular fa-file-lines"></i> ${course.deadline}</div>
                <a href="${pageLink}" class="btn-continue">Start Practice</a>
            </div>`;
        grid.innerHTML += html;
    }

    async function hydrateCoursesFromAdmin() {
        // Step 1: Get admin merged courses (preserves local IDs for navigation)
        const loadAdminCourses = window.NibrasCourses?.getAdminCoursesList;
        if (typeof loadAdminCourses !== 'function') return;

        try {
            const adminCourses = await loadAdminCourses();
            if (!Array.isArray(adminCourses) || !adminCourses.length) return;

            // Keep only courses with a backend mapping (id, level, category from backend)
            const mappedCourses = adminCourses.filter(c => (c.adminCourseId || c.backendCourseId || c.remoteCourseId) && c.level === 'Beginner');

            // Fetch real progress from backend for each mapped course
            const coursesService = window.NibrasServices?.coursesService;
            if (coursesService && typeof coursesService.getProgress === 'function') {
                const progressResults = await Promise.allSettled(
                    mappedCourses.map(c => {
                        const bid = c.adminCourseId || c.backendCourseId || c.remoteCourseId;
                        return bid ? coursesService.getProgress(bid) : Promise.resolve(null);
                    })
                );
                mappedCourses.forEach((c, i) => {
                    const result = progressResults[i];
                    if (result.status === 'fulfilled' && result.value) {
                        const pct = result.value?.data?.percentage
                            ?? result.value?.percentage
                            ?? result.value?.data?.overallPercentage;
                        if (Number.isFinite(Number(pct))) {
                            c.progress = Math.max(0, Math.min(100, Math.round(Number(pct))));
                        }
                    }
                });
            }

            // Step 2: Fetch all backend courses to add any unmapped ones
            const backendCourses = {};
            if (coursesService && typeof coursesService.list === 'function') {
                try {
                    const response = await coursesService.list({ page: 1, limit: 100 });
                    const rawList = Array.isArray(response?.data)
                        ? response.data
                        : (Array.isArray(response?.data?.courses)
                            ? response.data.courses
                            : (Array.isArray(response?.courses) ? response.courses : []));
                    rawList.forEach(c => {
                        const bid = c?._id || c?.id;
                        if (bid) backendCourses[bid] = c;
                    });
                } catch (_) {}
            }

            // Remove backend IDs already covered by mapped courses
            mappedCourses.forEach(c => {
                const bid = c.adminCourseId || c.backendCourseId || c.remoteCourseId;
                if (bid && backendCourses[bid]) delete backendCourses[bid];
            });

            // Add unmapped backend courses (with level/type from backend)
            const extraCourses = Object.values(backendCourses)
                .filter(course => course?.level?.toLowerCase() === 'beginner')
                .map(course => ({
                id: course?._id || course?.id,
                title: course?.title || 'Untitled',
                instructor: course?.instructor?.name || course?.instructorName || 'Instructor',
                progress: 0,
                rating: 0,
                level: course?.level || 'Beginner',
                deadline: 'No deadline set',
                isPopular: false,
                category: (course?.category || 'core').toLowerCase(),
                type: course?.type || 'standard',
            }));

            coursesData = [...mappedCourses, ...extraCourses];
            filterAndRender(activeCategory);
        } catch (error) {
            console.warn('[COURSES.JS] Failed to hydrate:', error?.message || error);
        }
    }

    // --- 4. THEME TOGGLE (WITH LOGO SWAP) ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn?.querySelector('i');
    const appLogo = document.getElementById('app-logo');
    
    // Check initial state
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '/Assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '/Assets/images/logo-light.png';
    }

    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            
            if (current === 'light') {
                // Switch to Dark
                html.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
                if(appLogo) appLogo.src = '/Assets/images/logo-dark.png';
            } else {
                // Switch to Light
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(themeIcon) themeIcon.className = 'fa-regular fa-moon';
                if(appLogo) appLogo.src = '/Assets/images/logo-light.png';
            }
        });
    }

    // --- 5. SEARCH ---
    const searchInput = document.getElementById('course-search');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.course-card');
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                card.style.display = title.includes(term) ? 'flex' : 'none';
            });
        });
    }

    console.log('[COURSES.JS] Initialization complete');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourses);
} else {
    initCourses();
}
