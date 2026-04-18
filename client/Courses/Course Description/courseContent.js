window.NibrasReact.run(() => {
    const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
    if (!selectedCourse) return;

    const courseId = selectedCourse.id;
    const courseData = selectedCourse.overview;

    const themeBtn = document.getElementById("themeBtn");
    const themeIcon = themeBtn?.querySelector("i");
    const themeText = themeBtn?.querySelector("span");

    function updateThemeBtn(theme) {
        if (!themeIcon || !themeText) return;
        if (theme === "dark") {
            themeIcon.classList.remove("fa-moon");
            themeIcon.classList.add("fa-sun");
            themeText.textContent = "Light Mode";
        } else {
            themeIcon.classList.remove("fa-sun");
            themeIcon.classList.add("fa-moon");
            themeText.textContent = "Dark Mode";
        }
    }

    updateThemeBtn(document.documentElement.getAttribute("data-theme"));

    themeBtn?.addEventListener("click", () => {
        const htmlEl = document.documentElement;
        const currentTheme = htmlEl.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        htmlEl.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeBtn(newTheme);
    });

    function setCourseLinks() {
        const links = [
            { selector: '.nav-link[href*="courseContent.html"]', path: "./courseContent.html" },
            { selector: '.nav-link[href*="videos.html"]', path: "../Videos/videos.html" },
            { selector: '.nav-link[href*="Assignments.html"]', path: "../Assignments/Assignments.html" },
            { selector: '.nav-link[href*="Projects.html"]', path: "../Projects/Projects.html" },
            { selector: '.nav-link[href*="grades.html"]', path: "../Grades/grades.html" },
            { selector: ".back-btn", path: "../courses.html" },
            { selector: "#discussion-forum-link", path: "../../Community/CourseDiscussions/discussions.html" },
        ];

        links.forEach(({ selector, path }) => {
            const el = document.querySelector(selector);
            if (el) {
                el.setAttribute("href", window.NibrasCourses.withCourseId(path, courseId));
            }
        });
    }

    setCourseLinks();
    populateDashboard(courseData, selectedCourse);
    hydrateOverviewFromAdmin();

    function populateDashboard(data, selected) {
        setText("header-code", data.code);
        setText("sidebar-course-code", data.code);
        setText("header-title", data.title);
        setText("header-desc", data.description);
        setText("sidebar-term", `${data.term} • Week ${data.currentWeek}`);
        setText("header-duration", `${data.term} • ${data.stats.duration}`);
        setText("header-commitment", data.stats.commitment);
        setText("header-students", `${data.stats.enrolled} Students Enrolled`);
        setText("current-week-num", data.currentWeek);
        setText("total-weeks", data.totalWeeks);
        setText("sidebar-progress-text", `${data.progress.completedLectures} of ${data.progress.totalLectures} lectures completed`);
        setText("progress-percent-text", `${data.progress.percent}%`);
        setText("stat-score", data.progress.avgScore);
        setText("stat-assignments", data.progress.assignmentsDone);
        setText("instructor-initials", data.instructor.initials);
        setText("instructor-name", data.instructor.name);
        setText("instructor-role", data.instructor.role);
        setText("instructor-rating", data.instructor.rating);
        setText("instructor-bio", data.instructor.bio);

        const breadcrumb = document.querySelector(".breadcrumbs");
        if (breadcrumb) {
            breadcrumb.textContent = `Dashboard / ${selected.title}`;
        }

        const sidebarFill = document.getElementById("sidebar-progress-fill");
        if (sidebarFill) {
            sidebarFill.style.width = `${(data.progress.completedLectures / data.progress.totalLectures) * 100}%`;
        }

        const progressFillMain = document.getElementById("progress-fill-main");
        if (progressFillMain) {
            progressFillMain.style.width = `${data.progress.percent}%`;
        }

        const announceContainer = document.getElementById("announcements-container");
        if (announceContainer) {
            announceContainer.innerHTML = "";
            data.announcements.forEach((item) => {
                announceContainer.innerHTML += `
                    <div class="announcement-item">
                        <div class="announcement-header">
                            <h4>${item.title}</h4>
                            <span class="announcement-date">${item.date}</span>
                        </div>
                        <p>${item.content}</p>
                    </div>`;
            });
        }

        const objContainer = document.getElementById("objectives-container");
        if (objContainer) {
            objContainer.innerHTML = "";
            data.objectives.forEach((obj) => {
                objContainer.innerHTML += `<li><i class="fa-regular fa-circle-check"></i> ${obj}</li>`;
            });
        }

        const preContainer = document.getElementById("prereq-container");
        if (preContainer) {
            preContainer.innerHTML = "";
            data.prerequisites.forEach((pre) => {
                preContainer.innerHTML += `<li><span>•</span> ${pre}</li>`;
            });
        }

        const currContainer = document.getElementById("curriculum-container");
        if (currContainer) {
            currContainer.innerHTML = "";
            data.curriculum.forEach((week) => {
                let iconHtml;
                let activeClass = "";
                if (week.status === "completed") {
                    iconHtml = `<div class="week-icon completed"><i class="fa-solid fa-check"></i></div>`;
                } else if (week.status === "current") {
                    iconHtml = `<div class="week-icon current">${week.week}</div>`;
                    activeClass = "week-card-active";
                } else {
                    iconHtml = `<div class="week-icon upcoming">${week.week}</div>`;
                }

                const tagsHtml = week.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
                const badgeHtml = week.status === "current" ? `<span class="status-badge">Current</span>` : "";

                currContainer.innerHTML += `
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
            });
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    async function hydrateOverviewFromAdmin() {
        const loadRemoteCourse = window.NibrasCourses?.getAdminCourseByLocalId;
        if (typeof loadRemoteCourse !== "function") return;

        try {
            const remoteCourse = await loadRemoteCourse(courseId);
            if (!remoteCourse) return;

            if (remoteCourse.title) {
                setText("header-title", remoteCourse.title);
                const breadcrumb = document.querySelector(".breadcrumbs");
                if (breadcrumb) breadcrumb.textContent = `Dashboard / ${remoteCourse.title}`;
            }

            if (remoteCourse.description) {
                setText("header-desc", remoteCourse.description);
            }

            if (remoteCourse.instructorName) {
                setText("instructor-name", remoteCourse.instructorName);
            }
        } catch (error) {
            console.warn("[COURSE-CONTENT] Failed to hydrate overview from admin backend:", error?.message || error);
        }
    }
});
