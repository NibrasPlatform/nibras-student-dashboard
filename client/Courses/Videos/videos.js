console.log("[VIDEOS.JS] Script started (direct execution)");

const selectedCourse = window.NibrasCourses?.getSelectedCourse?.();
let courseData = selectedCourse ? JSON.parse(JSON.stringify(selectedCourse.videos)) : null;
const courseId = selectedCourse?.id;
let currentVideoElement = null;
let currentIframeElement = null;

function stopCurrentMedia() {
    try {
        if (currentVideoElement) {
            currentVideoElement.pause();
            currentVideoElement.currentTime = 0;
            currentVideoElement.src = "";
            currentVideoElement.load();
            currentVideoElement = null;
        }
        if (currentIframeElement && currentIframeElement.parentElement) {
            currentIframeElement.src = "about:blank";
            currentIframeElement.remove();
            currentIframeElement = null;
        }
        const container = document.querySelector(".video-screen");
        if (container) {
            const videos = container.querySelectorAll("video");
            videos.forEach(v => {
                v.pause();
                v.currentTime = 0;
                v.src = "";
                v.load();
            });
            const iframes = container.querySelectorAll("iframe");
            iframes.forEach(iframe => {
                iframe.src = "about:blank";
                iframe.remove();
            });
        }
        const orphanedVideos = document.querySelectorAll("video");
        orphanedVideos.forEach(v => {
            v.pause();
            v.currentTime = 0;
        });
    } catch (e) {
        console.warn("[VIDEOS.JS] Error stopping media:", e);
        currentVideoElement = null;
        currentIframeElement = null;
    }
}

function getCompletedLecturesKey() {
    return `nibras_completed_lectures_${courseId}`;
}

function getCompletedLectures() {
    try {
        const stored = localStorage.getItem(getCompletedLecturesKey());
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveCompletedLectures(completedList) {
    localStorage.setItem(getCompletedLecturesKey(), JSON.stringify(completedList));
}

function handleVideoComplete(lesson, videoItem) {
    if (!lesson || !courseId) return;

    const completed = getCompletedLectures();
    const lessonId = lesson.id;

    if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        saveCompletedLectures(completed);
        console.log(`[VIDEOS.JS] Marked lecture as complete: ${lessonId}`);

        const badge = document.getElementById("lesson-status");
        if (badge) {
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Completed`;
            badge.style.display = "flex";
        }

        const lessons = courseData?.lessons || [];
        let maxUnlocked = 0;
        completed.forEach(id => {
            const match = id.match(/-lecture-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxUnlocked) maxUnlocked = num;
            }
        });

        const nextLectureNum = maxUnlocked + 1;
        if (nextLectureNum <= lessons.length) {
            console.log(`[VIDEOS.JS] Lecture ${nextLectureNum} is now unlocked!`);
            applyCompletionState();
            renderLectureList();
        }
    }
}

function applyCompletionState() {
    const completed = getCompletedLectures();
    if (courseData?.lessons && completed.length > 0) {
        courseData.lessons.forEach(lesson => {
            if (completed.includes(lesson.id)) {
                lesson.completed = true;
            }

            const match = lesson.id.match(/-lecture-(\d+)$/);
            if (match) {
                const lectureNum = parseInt(match[1], 10);
                const maxCompleted = Math.max(...completed.map(id => {
                    const m = id.match(/-lecture-(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                }), 0);

                lesson.locked = lectureNum > maxCompleted + 1;
            }
        });
    }
}

function setCourseLinks() {
    if (!courseId) return;

    // Update data-nav-link elements
    const navLinks = [
        { key: "courseContent", path: "../Course Description/courseContent.html" },
        { key: "videos", path: "./videos.html" },
        { key: "assignments", path: "../Assignments/Assignments.html" },
        { key: "projects", path: "../Projects/Projects.html" },
        { key: "grades", path: "../Grades/grades.html" },
    ];

    navLinks.forEach(({ key, path }) => {
        const el = document.querySelector(`[data-nav-link="${key}"]`);
        if (el) el.setAttribute("href", window.NibrasCourses.withCourseId(path, courseId));
    });

    // Also update back button
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) backBtn.setAttribute("href", window.NibrasCourses.withCourseId("../courses.html", courseId));
}

function initThemeToggle() {
    const themeBtn = document.getElementById("themeBtn");
    const themeIcon = themeBtn?.querySelector("i");
    const themeText = themeBtn?.querySelector("span");

    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateButtonState(savedTheme);

    function updateButtonState(theme) {
        if (theme === "dark") {
            if (themeIcon) themeIcon.className = "fa-solid fa-sun";
            if (themeText) themeText.textContent = "Light Mode";
        } else {
            if (themeIcon) themeIcon.className = "fa-solid fa-moon";
            if (themeText) themeText.textContent = "Dark Mode";
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const htmlEl = document.documentElement;
            const currentTheme = htmlEl.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            htmlEl.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateButtonState(newTheme);
        });
    }
}

function initVideos() {
    if (!courseData || !selectedCourse) return;
    initThemeToggle();
    setCourseLinks();
    populateUI(courseData);
    setupVideoPlayer();
    setupLectureListHandler();
    setupLectureVideoItemsHandler();
    setupNavigationButtons();
    hydrateLessonsFromAdmin();
}

function populateUI(data) {
    applyCompletionState();
    const currentLesson = data.lessons.find((l) => l.id === data.currentLessonId);
    const activeVideoItem = getActiveVideoItem(currentLesson);
    if (currentLesson) {
        const courseCrumb = document.getElementById("course-title-crumb");
        if (courseCrumb) courseCrumb.textContent = selectedCourse.title;

        document.getElementById("lesson-title-crumb").textContent = currentLesson.title;
        document.getElementById("lesson-title-main").textContent = currentLesson.title;
        const displayedDuration = activeVideoItem?.duration || currentLesson.duration;
        document.getElementById("lesson-duration").textContent = `Duration: ${displayedDuration}`;
        document.getElementById("total-time").textContent = displayedDuration;
        renderLectureVideos(currentLesson, activeVideoItem);

        const badge = document.getElementById("lesson-status");
        if (currentLesson.completed) {
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Completed`;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }

    document.getElementById("progress-text").textContent = `${data.progress.completed} of ${data.progress.total} lectures completed`;
    const pct = (data.progress.completed / data.progress.total) * 100;
    document.getElementById("progress-fill").style.width = `${pct}%`;

    const listContainer = document.getElementById("lecture-list");
    listContainer.innerHTML = "";

    data.lessons.forEach((lesson) => {
        const isActive = lesson.id === data.currentLessonId;
        let itemClass = "lecture-item";
        let iconClass = "fa-regular fa-circle";

        if (lesson.locked) {
            itemClass += " locked";
            iconClass = "fa-solid fa-lock";
        } else if (isActive) {
            itemClass += " active";
            iconClass = "fa-solid fa-circle-play";
        } else if (lesson.completed) {
            itemClass += " completed";
            iconClass = "fa-solid fa-circle-check";
        } else {
            itemClass += " open";
        }

        listContainer.innerHTML += `
            <div class="${itemClass}" data-lesson-id="${lesson.id}">
                <div class="lecture-icon"><i class="${iconClass}"></i></div>
                <div class="lecture-info">
                    <span class="lecture-title">${lesson.title}</span>
                    <span class="lecture-time">${lesson.duration}</span>
                </div>
            </div>
        `;
    });

    const currentIndex = data.lessons.findIndex((l) => l.id === data.currentLessonId);
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= data.lessons.length - 1;
}

function getActiveVideoItem(lesson) {
    if (!lesson || !Array.isArray(lesson.videoItems) || lesson.videoItems.length === 0) {
        return null;
    }
    const activeItem = lesson.videoItems.find((item) => item.id === lesson.activeVideoItemId) || lesson.videoItems[0];
    lesson.activeVideoItemId = activeItem.id;
    return activeItem;
}

function renderLectureVideos(lesson, activeVideoItem) {
    const panel = document.getElementById("lecture-videos-panel");
    const list = document.getElementById("lecture-videos-list");
    if (!panel || !list) return;

    if (!lesson || !Array.isArray(lesson.videoItems) || lesson.videoItems.length === 0) {
        panel.hidden = true;
        list.innerHTML = "";
        return;
    }

    panel.hidden = false;
    list.innerHTML = lesson.videoItems
        .map((item) => `
            <button type="button" class="lecture-video-chip ${activeVideoItem?.id === item.id ? "active" : ""}" data-video-item-id="${item.id}">
                <span class="lecture-video-chip-title">${item.title}</span>
                <span class="lecture-video-chip-time">${item.duration || "Video"}</span>
            </button>
        `)
        .join("");
}

function setupVideoPlayer() {
    stopCurrentMedia();
    const videoContainer = document.querySelector(".video-screen");
    if (!videoContainer) return;

    const currentLesson = courseData.lessons.find((l) => l.id === courseData.currentLessonId);
    if (!currentLesson) {
        return;
    }
    const activeVideoItem = getActiveVideoItem(currentLesson);
    const html5Source = activeVideoItem?.html5 || currentLesson.videoSources?.html5;
    const youtubeSource = activeVideoItem?.youtube || currentLesson.videoSources?.youtube;
    const bilibiliSource = activeVideoItem?.bilibili || currentLesson.videoSources?.bilibili;

    videoContainer.innerHTML = "";

    const controlsLeft = document.querySelector(".controls-left");
    const controlsRight = document.querySelector(".controls-right");
    const progressBar = document.querySelector(".progress-bar");
    const currentTimeEl = document.getElementById("current-time");
    const totalTimeEl = document.getElementById("total-time");

    if (html5Source) {
        if (controlsLeft) controlsLeft.style.display = "";
        if (controlsRight) controlsRight.style.display = "";
        if (progressBar) progressBar.style.display = "";
        if (currentTimeEl) currentTimeEl.style.display = "";
        if (totalTimeEl) totalTimeEl.style.display = "";

        videoContainer.innerHTML = `
            <video id="lesson-video" width="100%" height="100%" style="width: 100%; height: 100%; object-fit: contain; background: #000;">
                <source src="${html5Source}" type="video/mp4">
            </video>
        `;
        currentVideoElement = document.getElementById("lesson-video");
        if (currentVideoElement) setupVideoControls(currentVideoElement);
    } else {
        if (controlsLeft) controlsLeft.style.display = "none";
        if (controlsRight) controlsRight.style.display = "none";
        if (progressBar) progressBar.style.display = "none";
        if (currentTimeEl) currentTimeEl.style.display = "none";
        if (totalTimeEl) totalTimeEl.style.display = "none";

        if (bilibiliSource) {
            videoContainer.innerHTML = `
                <iframe
                    id="lesson-video-iframe"
                    width="100%"
                    height="100%"
                    src="${bilibiliSource}"
                    frameborder="0"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowfullscreen
                    style="width: 100%; height: 100%;">
                </iframe>
            `;
            currentIframeElement = document.getElementById("lesson-video-iframe");
        } else if (youtubeSource) {
            const joiner = youtubeSource.includes("?") ? "&" : "?";
            videoContainer.innerHTML = `
                <iframe
                    id="lesson-video-iframe"
                    width="100%"
                    height="100%"
                    src="${youtubeSource}${joiner}autoplay=0&rel=0&modestbranding=1"
                    frameborder="0"
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                    style="width: 100%; height: 100%;">
                </iframe>
            `;
            currentIframeElement = document.getElementById("lesson-video-iframe");
        }
    }
}

function setupVideoControls(videoElement) {
    const playBtn = document.querySelector(".controls-left .control-btn:first-child");
    const volumeBtn = document.querySelector(".controls-left .control-btn:nth-child(2)");
    const progressBar = document.querySelector(".progress-bar");
    const progressTrack = document.querySelector(".progress-track");
    const currentTimeEl = document.getElementById("current-time");
    const totalTimeEl = document.getElementById("total-time");
    const fullscreenBtn = document.querySelector(".controls-right .control-btn:last-child");

    videoElement.addEventListener("loadedmetadata", () => {
        totalTimeEl.textContent = formatTime(videoElement.duration);
    });

    videoElement.addEventListener("ended", () => {
        handleVideoComplete(currentLesson, activeVideoItem);
    });

    videoElement.addEventListener("timeupdate", () => {
        if (videoElement.duration) {
            const percent = (videoElement.currentTime / videoElement.duration) * 100;
            if (progressBar) progressBar.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(videoElement.currentTime);
        }
    });

    if (playBtn) {
        playBtn.addEventListener("click", () => {
            if (videoElement.paused) {
                videoElement.play();
                playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            } else {
                videoElement.pause();
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        });
        videoElement.addEventListener("play", () => (playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'));
        videoElement.addEventListener("pause", () => (playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'));
    }

    if (volumeBtn) {
        volumeBtn.addEventListener("click", () => {
            videoElement.muted = !videoElement.muted;
            volumeBtn.innerHTML = videoElement.muted
                ? '<i class="fa-solid fa-volume-mute"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
        });
    }

    if (progressTrack) {
        progressTrack.addEventListener("click", (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoElement.currentTime = percent * videoElement.duration;
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
            const container = document.querySelector(".video-container");
            if (!container) return;
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        });
    }

    videoElement.addEventListener("timeupdate", () => {
        const currentLesson = courseData.lessons.find((l) => l.id === courseData.currentLessonId);
        if (currentLesson && !currentLesson.completed) {
            const percentWatched = (videoElement.currentTime / videoElement.duration) * 100;
            if (percentWatched >= 95) {
                currentLesson.completed = true;
                courseData.progress.completed = Math.min(courseData.progress.total, courseData.progress.completed + 1);
                populateUI(courseData);
            }
        }
    });

    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
        videoElement.addEventListener("seeking", () => spinner.classList.add("visible"));
        videoElement.addEventListener("seeked", () => spinner.classList.remove("visible"));
        videoElement.addEventListener("waiting", () => spinner.classList.add("visible"));
        videoElement.addEventListener("canplay", () => spinner.classList.remove("visible"));
    }

    const progressTrackEl = document.getElementById("progress-track-element");
    const timelinePreview = document.getElementById("timeline-preview");
    if (progressTrackEl && timelinePreview) {
        progressTrackEl.addEventListener("mousemove", (e) => {
            const rect = progressTrackEl.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * videoElement.duration;
            timelinePreview.textContent = formatTime(time);
            timelinePreview.style.left = `${percent * 100}%`;
            timelinePreview.classList.add("visible");
        });
        progressTrackEl.addEventListener("mouseleave", () => timelinePreview.classList.remove("visible"));
    }

    const qualityBtn = document.getElementById("quality-btn");
    const qualityMenu = document.getElementById("quality-menu");
    if (qualityBtn && qualityMenu) {
        const qualities = ["Auto", "1080p", "720p", "480p"];
        qualityMenu.innerHTML = qualities
            .map((q) => `<button class="quality-option ${q === "Auto" ? "active" : ""}" data-quality="${q}">${q}</button>`)
            .join("");

        qualityBtn.addEventListener("click", () => qualityMenu.classList.toggle("visible"));
        qualityMenu.querySelectorAll(".quality-option").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                qualityMenu.querySelectorAll(".quality-option").forEach((b) => b.classList.remove("active"));
                e.target.classList.add("active");
                const quality = e.target.dataset.quality;
                qualityBtn.querySelector("span").textContent = quality;
                qualityMenu.classList.remove("visible");
                localStorage.setItem("selectedQuality", quality);
            });
        });
        qualityBtn.querySelector("span").textContent = localStorage.getItem("selectedQuality") || "Auto";
    }

    const captionBtn = document.getElementById("caption-btn");
    const captionDisplay = document.getElementById("caption-display");
    let captionsEnabled = false;
    if (captionBtn && captionDisplay) {
        captionBtn.addEventListener("click", () => {
            captionsEnabled = !captionsEnabled;
            captionDisplay.style.display = captionsEnabled ? "block" : "none";
            captionBtn.style.opacity = captionsEnabled ? "1" : "0.8";
        });

        const demoCaption = { startTime: 0, endTime: 5, text: "Welcome to this video lesson!" };
        videoElement.addEventListener("timeupdate", () => {
            if (!captionsEnabled || !videoElement.duration) return;
            const time = videoElement.currentTime;
            if (time >= demoCaption.startTime && time <= demoCaption.endTime) {
                captionDisplay.textContent = demoCaption.text;
                captionDisplay.classList.add("visible");
            } else {
                captionDisplay.classList.remove("visible");
            }
        });
    }
}

function setupLectureListHandler() {
    const lectureList = document.getElementById("lecture-list");
    if (!lectureList) return;

    lectureList.addEventListener("click", (e) => {
        const item = e.target.closest(".lecture-item");
        if (!item || item.classList.contains("locked")) return;
        const lessonId = String(item.dataset.lessonId || "");
        loadLesson(lessonId);
    });
}

function setupLectureVideoItemsHandler() {
    const list = document.getElementById("lecture-videos-list");
    if (!list) return;

    list.addEventListener("click", (event) => {
        const button = event.target.closest(".lecture-video-chip[data-video-item-id]");
        if (!button) return;
        const currentLesson = courseData.lessons.find((lesson) => lesson.id === courseData.currentLessonId);
        if (!currentLesson || !Array.isArray(currentLesson.videoItems)) return;

        const videoItemId = String(button.dataset.videoItemId || "");
        if (!currentLesson.videoItems.some((item) => item.id === videoItemId)) return;

        currentLesson.activeVideoItemId = videoItemId;
        populateUI(courseData);
        setupVideoPlayer();
    });
}

function setupNavigationButtons() {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const currentIndex = courseData.lessons.findIndex((l) => l.id === courseData.currentLessonId);
            if (currentIndex > 0) {
                loadLesson(courseData.lessons[currentIndex - 1].id);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const currentIndex = courseData.lessons.findIndex((l) => l.id === courseData.currentLessonId);
            if (currentIndex < courseData.lessons.length - 1) {
                const nextLesson = courseData.lessons[currentIndex + 1];
                if (nextLesson.locked) {
                    alert(`Lesson "${nextLesson.title}" is locked. Complete previous lessons to unlock.`);
                    return;
                }
                loadLesson(nextLesson.id);
            }
        });
    }
}

function loadLesson(lessonId) {
    courseData.currentLessonId = lessonId;
    populateUI(courseData);
    setupVideoPlayer();
    window.scrollTo(0, 0);
}

async function hydrateLessonsFromAdmin() {
    const loadRemoteCourse = window.NibrasCourses?.getAdminCourseByLocalId;
    if (typeof loadRemoteCourse !== "function" || !courseId) return;

    try {
        const remoteCourse = await loadRemoteCourse(courseId);
        if (!remoteCourse || !Array.isArray(remoteCourse.sections) || remoteCourse.sections.length === 0) return;

        courseData.lessons = courseData.lessons.map((lesson, index) => {
            const remoteSection = remoteCourse.sections[index];
            if (!remoteSection?.title) return lesson;
            return {
                ...lesson,
                title: `Lesson ${index + 1}: ${remoteSection.title}`,
            };
        });

        populateUI(courseData);
        setupVideoPlayer();
    } catch (error) {
        console.warn("[VIDEOS.JS] Failed to hydrate lessons from admin backend:", error?.message || error);
    }
}

function formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideos);
} else {
    initVideos();
}
