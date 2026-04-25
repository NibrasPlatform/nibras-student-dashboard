(function () {
    const SELECTED_COURSE_KEY = "selectedCourseId";
    const TRACKING_COURSE_KEY = "nibras_tracking_course_id";
    const DEFAULT_COURSE_ID = "cs106a-programming-methodology";
    const PRACTICE_LAB_COURSE_ID = "practice-labs";

    const gradeScale = [
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
        { grade: "F", range: "Below 60%", color: "f" },
    ];

    const gradeWeights = [
        { cat: "Assignments", pct: "40%" },
        { cat: "Projects", pct: "30%" },
        { cat: "Quizzes", pct: "20%" },
        { cat: "Participation", pct: "10%" },
    ];

    const youtubeIds = [
        "dQw4w9WgXcQ",
        "M7lc1UVf-VE",
        "aqz-KE-bpKQ",
        "jNQXAC9IVRw",
        "9bZkp7q19f0",
        "LeAltgu_pbM",
        "OPf0YbXqDm0",
        "7wtfhZwyrcc",
    ];

    const instructorRoster = [
        "Dr. Sarah Johnson",
        "Prof. Michael Chen",
        "Dr. Emily Rodriguez",
        "Dr. Ahmed Hassan",
        "Dr. Mariam Mahmoud",
        "Dr. Amir Hassan",
        "Dr. Osama Mohsen",
        "Dr. Salma Mohamed",
    ];

    const beginnerCourseRows = [
        { code: "CS106A", title: "Programming Methodology", category: "core" },
        { code: "CS106B", title: "Programming Abstractions", category: "core" },
        { code: "CS106X", title: "Programming Abstractions (Accelerated)", category: "core" },
        { code: "MATH 18", title: "Foundations for Calculus", category: "core" },
        { code: "MATH 19", title: "Calculus I", category: "core" },
        { code: "MATH 20", title: "Calculus II", category: "core" },
        { code: "MATH 21", title: "Calculus III / Calculus with Infinite Processes", category: "core" },
        { code: "MATH 51", title: "Linear Algebra, Multivariable Calculus, & Optimization", category: "core" },
        { code: "MATH 52", title: "Multivariable Integration & Ordinary Differential Equations", category: "core" },
        { code: "MATH 53", title: "Differential Calculus of Several Variables", category: "core" },
        { code: "CS 103", title: "Mathematical Foundations of Computing", category: "core" },
        { code: "CS 109", title: "Probability for Computer Scientists / Theory of Probability", category: "core" },
        { code: "PHYS 41", title: "Introductory Mechanics Course (Classical Mechanics)", category: "core" },
        { code: "PHYS 43", title: "Electricity and Magnetism", category: "core" },
        { code: "BIO", title: "Biology", category: "core" },
        { code: "CHEM", title: "Chemistry", category: "core" },
        { code: "MATH 104", title: "Applied Matrix Theory", category: "core" },
        { code: "MATH 107", title: "Graph Theory", category: "core" },
        { code: "MATH 108", title: "Introduction to Combinatorics and Its Applications", category: "core" },
        { code: "MATH 109", title: "Groups and Symmetry", category: "core" },
        { code: "MATH 110", title: "Number Theory for Cryptography", category: "core" },
        { code: "MATH 113", title: "Linear Algebra and Matrix Theory", category: "core" },
        { code: "CS 157", title: "Computational Logic", category: "core" },
        { code: "CS 205L", title: "Continuous Mathematical Methods with an Emphasis on Machine Learning", category: "core" },
        { code: "PHIL 251", title: "Metalogic (PHIL 251)", category: "core" },
        { code: "ENGR 40M", title: "Making: Integrated Engineering", category: "elective" },
        { code: "ENGR 76", title: "Information Science & Engineering", category: "elective" },
        { code: "Other EF", title: "See Stanford list of approved EF courses", category: "elective" },
    ];

    const intermediateCourseRows = [
        { code: "CS 181", title: "Computers, Ethics, and Public Policy", category: "elective" },
        { code: "CS 181W", title: "Computers, Ethics, and Public Policy (WIM)", category: "elective" },
        { code: "STS options", title: "Science, Technology, and Society courses", category: "elective" },
        { code: "CS 107", title: "Computer Organization & Systems", category: "core" },
        { code: "CS 110", title: "Principles of Computer Systems / Operating Systems Principles", category: "core" },
        { code: "CS 161", title: "Design & Analysis of Algorithms", category: "core" },
        { code: "CS 194", title: "Software Project", category: "core" },
        { code: "CS 210", title: "Software Project Experience with Corporate Partners", category: "core" },
        { code: "CS 294", title: "Research Project in Computer Science", category: "core" },
    ];

    function normalizeCourseField(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function buildCourseId(code, title) {
        const base = `${normalizeCourseField(code)}-${normalizeCourseField(title)}`;
        return base
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function buildTopics(code, title) {
        const normalizedCode = normalizeCourseField(code) || "Course";
        const normalizedTitle = normalizeCourseField(title) || "Course";
        const shortTitle = normalizedTitle.split("/")[0].trim();
        return [
            `${shortTitle} Fundamentals`,
            `${normalizedCode} Core Techniques`,
            `${shortTitle} Problem Solving`,
            `${shortTitle} Applied Practice`,
        ];
    }

    function mapSpreadsheetRowsToMeta(rows, level, seedOffset) {
        return rows
            .filter((row) => normalizeCourseField(row?.code) || normalizeCourseField(row?.title))
            .map((row, index) => {
                const seed = seedOffset + index;
                const code = normalizeCourseField(row.code) || `COURSE-${seed + 1}`;
                const title = normalizeCourseField(row.title) || code;
                return {
                    id: buildCourseId(code, title),
                    code,
                    title,
                    instructor: instructorRoster[seed % instructorRoster.length],
                    progress: toPercent(34 + ((seed * 11) % 61), 50),
                    rating: Number((4.3 + ((seed % 7) * 0.1)).toFixed(1)),
                    level,
                    category: row.category || "core",
                    deadline: `${2 + (seed % 5)} Assignments - Due in ${3 + (seed % 6)} days`,
                    isPopular: seed % 4 === 0,
                    topics: buildTopics(code, title),
                };
            });
    }

    const coursesMeta = [
        ...mapSpreadsheetRowsToMeta(beginnerCourseRows, "Beginner", 0),
        ...mapSpreadsheetRowsToMeta(intermediateCourseRows, "Intermediate", beginnerCourseRows.length),
    ];

    const cs106aMultiVideoLectures = [
        { title: "Welcome to Code in Place", videos: [{ title: "Welcome", youtubeId: "dxZFXJhZPvU" }, { title: "General Info", youtubeId: "ukpUVAhdo94" }, { title: "Karel", youtubeId: "LpxjnuQwTg4" }] },
        { title: "Control Flow in Karel", videos: [{ title: "Recap", youtubeId: "xAQlbo82EuU" }, { title: "For Loops", youtubeId: "yVmGFatf-Y8" }, { title: "While Loops", youtubeId: "S5y2u7VITMo" }, { title: "If/Else", youtubeId: "ACkcPIB5SZs" }, { title: "Steeple Chase", youtubeId: "nxu8NBAv2pM" }] },
        { title: "Decomposition", videos: [{ title: "Recap", youtubeId: "YFWUzglTrBQ" }, { title: "Morning", youtubeId: "Cz-wnRvlAMI" }, { title: "Mountain", youtubeId: "ecqDCBm8tkY" }, { title: "Rhoomba", youtubeId: "JIQr_gtAWrc" }, { title: "WordSearch", youtubeId: "62RtoSXfitU" }] },
        { title: "Variables in Python", videos: [{ title: "Recap", youtubeId: "pkh2gDQ8tjM" }, { title: "HelloWorld", youtubeId: "wEbmXvfl8TM" }, { title: "Add2Numbers", youtubeId: "oUuIMt5KmyQ" }] },
        { title: "Expressions", videos: [{ title: "Recap", youtubeId: "YwePpeJn828" }, { title: "Expressions", youtubeId: "iTBsRFnaoJ0" }, { title: "Constants", youtubeId: "sAo9IdC223s" }, { title: "Math Library", youtubeId: "H90Ud28sedo" }, { title: "Random Numbers", youtubeId: "SQ2_cDLgrHI" }, { title: "Dice Simulator", youtubeId: "_rMzEF0v6UI" }] },
        { title: "Control Flow in Python", videos: [{ title: "Recap", youtubeId: "60AMFkbGZGY" }, { title: "Conditions", youtubeId: "c6CZIQ3UFZE" }, { title: "Guess Num and Sentinel Sum", youtubeId: "Y_IWN4OxhlM" }, { title: "Booleans", youtubeId: "Y7evkU5j7TY" }, { title: "For Loops", youtubeId: "5BTJ4gVXaFQ" }, { title: "GameShow Teaser", youtubeId: "mVoerPV6YLY" }] },
        { title: "Functions Revisited", videos: [{ title: "Recap with GameShow", youtubeId: "wY68LUvnJ04" }, { title: "Functions are like Toasters", youtubeId: "hmcuptr9WBE" }, { title: "Anatomy of a Function", youtubeId: "lZ8DGnIRsng" }, { title: "Many Examples", youtubeId: "CS-BMynY5ko" }, { title: "I/O", youtubeId: "8vXvRwj8fos" }] },
        { title: "Functions: More Practice", videos: [{ title: "Recap", youtubeId: "vMy48Q6aPk0" }, { title: "Factorial", youtubeId: "kZpiuJ1r3rg" }, { title: "DocTests", youtubeId: "rXtLAPxeSgI" }, { title: "Passing Primitives", youtubeId: "vmzFKkyjo4o" }, { title: "Calendar", youtubeId: "8PCQndHgkPE" }] },
        { title: "Images", videos: [{ title: "Recap", youtubeId: "gjT_okH7HD8" }, { title: "Images in Python", youtubeId: "iC82OUseeeY" }, { title: "First Examples", youtubeId: "aeGbb8wC56g" }, { title: "GreenScreen", youtubeId: "pAG9rAqA4N4" }, { title: "Mirrored", youtubeId: "x0PpSbK4k_s" }, { title: "Nested For vs For Each Pixel", youtubeId: "DhohL7AOzsw" }] },
        { title: "Graphics", videos: [{ title: "Recap", youtubeId: "h9nnz_QSzZA" }, { title: "Blue Rect", youtubeId: "3RMrC1wWyFE" }, { title: "Programming is Awesome", youtubeId: "SfiEWn9RCXM" }, { title: "Checkers", youtubeId: "Y9Qi-6TWwpM" }] },
        { title: "Animations", videos: [{ title: "Recap", youtubeId: "B8-lPPUU7eY" }, { title: "Animation Loop", youtubeId: "jz02xtVaBo8" }, { title: "Move to Center", youtubeId: "frTXMIWSuq0" }, { title: "Bouncing Ball", youtubeId: "qjsxi3UzoA0" }, { title: "References", youtubeId: "g0G4S_woMRA" }, { title: "Pong", youtubeId: "XcvbczJF6CU" }] },
        { title: "Lists", videos: [{ title: "Recap with Console", youtubeId: "QioUAmUAIgE" }, { title: "None", youtubeId: "A-NrRd9GyYg" }, { title: "Lists", youtubeId: "vhknJZ-2Bzg" }, { title: "Lists as Parameters", youtubeId: "w4beNu04CMs" }, { title: "AverageScores", youtubeId: "L_TyVmOQq-I" }] },
        { title: "Text Processing", videos: [{ title: "Hook and Recap", youtubeId: "BQQVnsE2DZI" }, { title: "Working with Strings", youtubeId: "xRhjkyJHFbE" }, { title: "Helpful String Functions", youtubeId: "MOhsuyHr6fU" }, { title: "Just Number and DNA to mRNA", youtubeId: "fNChmzR6rVs" }, { title: "Characters", youtubeId: "SnJYJHmNW7s" }, { title: "Immutable", youtubeId: "-cIzBBzTnK8" }, { title: "ReverseString and Palindrome", youtubeId: "PB4tJZHdcAk" }, { title: "FakeMedicine", youtubeId: "BbE4dnoAmXs" }] },
        { title: "Dictionaries", videos: [{ title: "Recap with Files", youtubeId: "GyexyR1qwZE" }, { title: "What are Dictionaries", youtubeId: "iW6PlKk5XZk" }, { title: "Mutability and Dictionaries", youtubeId: "vN9qV2hHbGk" }, { title: "Dictionapalooza", youtubeId: "IUTaANNVS_w" }, { title: "CountWords", youtubeId: "Pvcvy0W38T8" }, { title: "PhoneBook", youtubeId: "jx8u6dFUxpY" }] },
    ];

    const practiceLabMeta = {
        id: PRACTICE_LAB_COURSE_ID,
        code: "PRACTICE 001",
        title: "Practice Labs",
        instructor: "Competitive Programming • Adaptive Level",
        progress: 0,
        rating: 5,
        level: "Beginner",
        category: "comp_prog",
        deadline: "5-10 problems per lab",
        isPopular: true,
        topics: ["Topic-based problem sets", "AI hints", "Contest simulation", "Performance analytics"],
    };

    function instructorInitials(name) {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("");
    }

    function toPercent(value, fallback) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, parsed));
        return fallback;
    }

    function buildLessons(meta, completedLessons, seed) {
        const titles = [
            `Introduction to ${meta.title}`,
            `${meta.topics[0]} Foundations`,
            `${meta.topics[1]} in Practice`,
            `${meta.topics[2]} Workshop`,
            `${meta.topics[3]} Techniques`,
            `${meta.title} Problem Solving`,
            `Advanced ${meta.topics[1]}`,
            `${meta.title} Capstone Review`,
        ];

        return titles.map((title, index) => {
            const lessonNumber = index + 1;
            const isCompleted = lessonNumber <= completedLessons;
            const isOpen = lessonNumber <= completedLessons + 1;
            return {
                id: `${meta.id}-lesson-${lessonNumber}`,
                title: `Lesson ${lessonNumber}: ${title}`,
                duration: `${12 + ((seed + index) % 14)}:${(10 + index * 7).toString().padStart(2, "0")}`,
                completed: isCompleted,
                locked: !isOpen,
                videoSources: {
                    youtube: `https://www.youtube.com/embed/${youtubeIds[(seed + index) % youtubeIds.length]}`,
                    html5: "https://www.w3schools.com/html/mov_bbb.mp4",
                },
                captions: { en: null },
            };
        });
    }

    function buildCs106aLessons(meta, completedLessons) {
        return cs106aMultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = lectureNumber <= completedLessons;
            const isOpen = lectureNumber <= completedLessons + 1;
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${10 + ((lectureIndex + videoIndex) % 16)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} videos`,
                completed: isCompleted,
                locked: !isOpen,
                videoItems,
                activeVideoItemId: videoItems[0]?.id || "",
                videoSources: {
                    youtube: videoItems[0]?.youtube || "",
                    html5: "",
                },
                captions: { en: null },
            };
        });
    }

    function buildAssignments(meta, completedAssignments, seed) {
        const statuses = ["graded", "submitted", "not_started", "late", "not_started"];
        const statusLabels = {
            graded: "Graded",
            submitted: "Submitted",
            not_started: "Not Started",
            late: "Late",
        };

        return Array.from({ length: 5 }).map((_, index) => {
            const assignmentNumber = index + 1;
            const status = statuses[index];
            const points = 15 + assignmentNumber * 5;
            const score = status === "graded" ? Math.max(10, points - 2) : null;
            const dueDay = 10 + seed + assignmentNumber * 3;
            return {
                id: `${meta.id}-assignment-${assignmentNumber}`,
                title: `Assignment ${assignmentNumber}: ${meta.topics[index % meta.topics.length]}`,
                status,
                statusLabel: statusLabels[status],
                description: `Apply ${meta.topics[index % meta.topics.length]} concepts in ${meta.title}.`,
                points,
                score,
                dueDate: `Dec ${Math.min(dueDay, 29)}, 2024`,
                dueTime: "11:59 PM",
                type: assignmentNumber % 2 === 0 ? "Quiz" : "File Upload",
                action: score !== null ? "View Details" : status === "submitted" ? "View Submission" : "Submit",
                milestoneId: `${meta.id}-milestone-${assignmentNumber}`,
                projectKey: `${meta.id}-project-${Math.min(assignmentNumber, 2)}`,
                page: assignmentNumber === 1 ? "./Assignments Content/AssignmentContent.html" : null,
            };
        });
    }

    function buildGrades(meta, assignments, scoreBase) {
        const gradedItems = assignments.filter((item) => item.score !== null);
        const earnedPoints = gradedItems.reduce((sum, item) => sum + item.score, 0);
        const totalPoints = gradedItems.reduce((sum, item) => sum + item.points, 0) || 1;
        const assignmentPercent = ((earnedPoints / totalPoints) * 100).toFixed(1);
        const overall = Math.max(55, Math.min(98, scoreBase));
        const classAverage = 82.5;

        return {
            stats: [
                { label: "Overall Grade", value: `${overall.toFixed(1)}%`, sub: "", icon: "fa-solid fa-award", type: "primary", extra: overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : "F" },
                { label: "Class Average", value: `${classAverage}%`, sub: "B", icon: "fa-solid fa-bullseye", type: "standard" },
                {
                    label: "vs Class Avg",
                    value: `${(overall - classAverage).toFixed(1)}%`,
                    sub: overall >= classAverage ? "Above average" : "Below average",
                    icon: overall >= classAverage ? "fa-solid fa-arrow-trend-up" : "fa-solid fa-arrow-trend-down",
                    type: "standard",
                    color: overall >= classAverage ? "green" : "red",
                },
                { label: "Graded Items", value: `${gradedItems.length}/8`, sub: "Completed", icon: "fa-regular fa-circle-check", type: "standard" },
            ],
            breakdown: [
                { category: "Assignments", score: `${earnedPoints}/${totalPoints}`, percent: `${assignmentPercent}%`, weight: "40% of final grade", change: `+${(Number(assignmentPercent) * 0.4).toFixed(1)}% total`, color: "#f59e0b" },
                { category: "Projects", score: "0/0", percent: "0.0%", weight: "30% of final grade", change: "+0.0% total", color: "#374151" },
                { category: "Quizzes", score: "54/60", percent: "90.0%", weight: "20% of final grade", change: "+18.0% total", color: "#10b981" },
                { category: "Participation", score: "9/10", percent: "90.0%", weight: "10% of final grade", change: "+9.0% total", color: "#10b981" },
            ],
            grades: [
                ...assignments.map((item) => ({
                    title: item.title,
                    type: item.type.toLowerCase().includes("quiz") ? "quiz" : "assignment",
                    date: `Due: ${item.dueDate}`,
                    score: item.score !== null ? `${item.score}/${item.points}` : null,
                    percent: item.score !== null ? `${((item.score / item.points) * 100).toFixed(1)}%` : null,
                    status: item.score !== null ? "Graded" : item.status === "late" ? "Late Submission" : "Pending",
                })),
                {
                    title: `Project: ${meta.title} Applied Build`,
                    type: "project",
                    date: "Due: Jan 15, 2025",
                    score: null,
                    percent: null,
                    status: "Pending",
                },
            ],
            scale: gradeScale,
            weights: gradeWeights,
        };
    }

    function buildCourse(meta, index) {
        const progressPercent = toPercent(meta.progress, 50);
        const lectureCount = meta.id === "cs106a-programming-methodology" ? cs106aMultiVideoLectures.length : 8;
        const completedLectures = Math.max(1, Math.min(lectureCount, Math.round((progressPercent / 100) * lectureCount)));
        const completedAssignments = Math.max(1, Math.min(5, Math.round((progressPercent / 100) * 5)));
        const term = "Fall 2024";
        const currentWeek = Math.max(2, Math.min(8, 2 + index));
        const scoreBase = 60 + progressPercent * 0.35;
        const assignments = buildAssignments(meta, completedAssignments, index);
        const lessons = meta.id === "cs106a-programming-methodology"
            ? buildCs106aLessons(meta, completedLectures)
            : buildLessons(meta, completedLectures, index);
        const currentLessonId = lessons[0]?.id || "";

        return {
            id: meta.id,
            code: meta.code,
            title: meta.title,
            level: meta.level,
            category: meta.category,
            instructor: meta.instructor,
            overview: {
                code: meta.code,
                title: `${meta.title} Fundamentals`,
                description: `Learn ${meta.title} through guided modules, real practice, and continuous feedback focused on ${meta.topics.join(", ")}.`,
                term,
                currentWeek,
                totalWeeks: 8,
                stats: {
                    duration: "8 Weeks",
                    commitment: "10-12 hours/week",
                    enrolled: 180 + index * 19,
                },
                progress: {
                    completedLectures,
                    totalLectures: lessons.length,
                    percent: progressPercent,
                    avgScore: `${Math.round(scoreBase)}%`,
                    assignmentsDone: `${completedAssignments}/5`,
                },
                instructor: {
                    name: meta.instructor,
                    role: `${meta.title} Instructor`,
                    initials: instructorInitials(meta.instructor),
                    rating: meta.rating,
                    bio: `${meta.instructor} leads this course with practical coverage of ${meta.topics[0]} and ${meta.topics[1]}.`,
                },
                announcements: [
                    {
                        title: `Week ${currentWeek} session released`,
                        date: "Dec 18, 2024",
                        content: `New learning material for ${meta.topics[2]} is now available in videos and assignments.`,
                    },
                    {
                        title: "Assignment update",
                        date: "Dec 17, 2024",
                        content: `Rubric clarifications were posted for ${meta.topics[0]} submission tasks.`,
                    },
                    {
                        title: "Resources added",
                        date: "Dec 16, 2024",
                        content: `A reference sheet covering ${meta.topics[1]} has been added to the course files.`,
                    },
                ],
                objectives: [
                    `Understand core concepts in ${meta.topics[0]}`,
                    `Apply ${meta.topics[1]} in hands-on labs and assignments`,
                    `Analyze real scenarios using ${meta.topics[2]}`,
                    `Deliver a practical mini-project using ${meta.topics[3]}`,
                    `Communicate technical decisions clearly and professionally`,
                ],
                prerequisites: [
                    "Basic computer literacy and internet navigation",
                    "Readiness to practice 8-12 hours weekly",
                    "A laptop with a modern browser and editor",
                    `Willingness to experiment with ${meta.title} exercises`,
                ],
                curriculum: [
                    { week: 1, title: `Introduction to ${meta.title}`, tags: [meta.topics[0], "Foundations"], activity: "Intro Lab", status: "completed" },
                    { week: 2, title: `Core Concepts`, tags: [meta.topics[1], "Practice"], activity: "Skill Check", status: "completed" },
                    { week: 3, title: `Applied Workflows`, tags: [meta.topics[2], "Case Study"], activity: "Workshop", status: "completed" },
                    { week: 4, title: `Intermediate Implementation`, tags: [meta.topics[3], "Hands-on"], activity: "Mini Build", status: "current" },
                    { week: 5, title: "Optimization & Quality", tags: [meta.topics[0], "Best Practices"], activity: "Refactor Task", status: "upcoming" },
                    { week: 6, title: "Project Sprint", tags: [meta.topics[1], "Teamwork"], activity: "Milestone 1", status: "upcoming" },
                    { week: 7, title: "Testing & Validation", tags: [meta.topics[2], "Evaluation"], activity: "Milestone 2", status: "upcoming" },
                    { week: 8, title: "Final Delivery", tags: [meta.topics[3], "Presentation"], activity: "Capstone Demo", status: "upcoming" },
                ],
            },
            videos: {
                title: `${meta.title} Video Lessons`,
                progress: { completed: completedLectures, total: lessons.length },
                currentLessonId,
                lessons,
            },
            assignments: {
                stats: {
                    completed: assignments.filter((item) => item.status === "graded").length,
                    total: assignments.length,
                    pointsEarned: assignments.filter((item) => item.score !== null).reduce((sum, item) => sum + item.score, 0),
                    pointsTotal: assignments.reduce((sum, item) => sum + item.points, 0),
                    progressPercent: Math.round((assignments.filter((item) => item.status === "graded").length / assignments.length) * 100),
                },
                items: assignments,
            },
            assignmentDetail: {
                title: assignments[0].title,
                points: assignments[0].points,
                scoreEarned: assignments[0].score || assignments[0].points - 2,
                description: assignments[0].description,
                dueDate: assignments[0].dueDate,
                dueTime: assignments[0].dueTime,
                submissionType: assignments[0].type,
                milestoneId: assignments[0].milestoneId,
                projectKey: assignments[0].projectKey,
                instructions: {
                    intro: `Complete the assignment using concepts from ${meta.topics[0]} and ${meta.topics[1]}.`,
                    points: [
                        `Implement a working solution for ${meta.topics[0]}`,
                        `Document design choices and assumptions`,
                        `Include tests/examples to validate behavior`,
                        "Submit organized files with clear naming",
                    ],
                },
                files: [
                    { name: `${meta.id}-requirements.pdf`, type: "pdf" },
                    { name: `${meta.id}-starter-template.zip`, type: "zip" },
                ],
                rubric: [
                    { criteria: "Code Quality & Structure", percent: "40%" },
                    { criteria: "Requirements Coverage", percent: "40%" },
                    { criteria: "Documentation", percent: "20%" },
                ],
                feedback: {
                    comment: `Good progress in ${meta.title}. Improve edge-case handling around ${meta.topics[2]}.`,
                    grader: meta.instructor,
                    date: "Dec 19, 2024, 3:42 PM",
                },
            },
            projects: {
                subtitle: `${meta.code}: ${meta.title} • ${term}`,
                overallProgressPercent: Math.max(30, progressPercent - 10),
                primaryProjectId: `${meta.id}-project-1`,
                secondaryProjectId: `${meta.id}-project-2`,
                primaryProjectTitle: `${meta.title} Applied Project`,
                secondaryProjectTitle: `${meta.title} Portfolio Challenge`,
                primaryProjectDescription: `Build an applied solution that demonstrates ${meta.topics[0]}, ${meta.topics[1]}, and ${meta.topics[2]}.`,
                secondaryProjectDescription: `Develop an individual showcase focused on ${meta.topics[3]}.`,
                groupWorkspaceTitle: `Group Workspace: ${meta.title} Applied Project`,
            },
            grades: buildGrades(meta, assignments, scoreBase),
        };
    }

    const coursesById = {};
    coursesMeta.forEach((meta, index) => {
        coursesById[meta.id] = buildCourse(meta, index);
    });
    coursesById[practiceLabMeta.id] = {
        ...buildCourse(practiceLabMeta, coursesMeta.length),
        type: "practice_lab",
        isPractice: true,
    };

    const remoteCourseState = {
        loadingPromise: null,
        byLocalId: null,
        unresolved: [],
    };

    const remoteAssignmentsState = {};
    const emittedMappingWarnings = new Set();

    function normalizeText(value) {
        if (typeof value !== "string") return "";
        return value.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function normalizeIdentifierValue(value) {
        if (value == null) return "";
        return String(value).trim();
    }

    function normalizeIdentifierToken(value) {
        return normalizeText(normalizeIdentifierValue(value));
    }

    function firstNonEmptyIdentifier(...values) {
        for (const candidate of values) {
            const normalized = normalizeIdentifierValue(candidate);
            if (normalized) return normalized;
        }
        return "";
    }

    function emitCourseMappingWarning(key, message) {
        if (!key || !message || emittedMappingWarnings.has(key)) return;
        emittedMappingWarnings.add(key);
        console.warn(`[NibrasCourses] ${message}`);
    }

    function buildMissingCourseMappingMessage(localCourseId, mappingType) {
        const localId = String(localCourseId || DEFAULT_COURSE_ID);
        if (mappingType === "tracking") {
            return `Missing tracking course ID mapping for "${localId}". Falling back to local ID for tracking API calls.`;
        }
        return `Missing admin/backend course ID mapping for "${localId}". Remote course hydration is unavailable for this course.`;
    }

    function getRuntimeCourseIdOverrides() {
        const raw = window.NIBRAS_COURSE_ID_MAP || window.NIBRAS_COURSE_IDENTIFIERS;
        return raw && typeof raw === "object" ? raw : {};
    }

    function getMetaByCourseId(localCourseId) {
        return coursesMeta.find((meta) => meta.id === localCourseId) || null;
    }

    function collectAliases(values, sink) {
        if (!Array.isArray(values)) return;
        values.forEach((item) => {
            const alias = normalizeIdentifierValue(item);
            if (alias) sink.push(alias);
        });
    }

    function getConfiguredCourseIdentifiers(localCourseId) {
        const localId = String(localCourseId || "");
        const meta = getMetaByCourseId(localId);
        const overrides = getRuntimeCourseIdOverrides();
        const overrideEntry = overrides?.[localId] && typeof overrides[localId] === "object" ? overrides[localId] : {};
        const metaIdentifiers = meta?.identifiers && typeof meta.identifiers === "object" ? meta.identifiers : {};
        const aliases = [];

        collectAliases(overrideEntry.aliases, aliases);
        collectAliases(overrideEntry.localAliases, aliases);
        collectAliases(metaIdentifiers.aliases, aliases);
        collectAliases(meta?.localAliases, aliases);

        return {
            trackingCourseId: firstNonEmptyIdentifier(
                overrideEntry.trackingCourseId,
                overrideEntry.trackingId,
                overrideEntry.tracking_course_id,
                meta?.trackingCourseId,
                metaIdentifiers.trackingCourseId
            ),
            adminCourseId: firstNonEmptyIdentifier(
                overrideEntry.adminCourseId,
                overrideEntry.remoteCourseId,
                overrideEntry.admin_course_id,
                meta?.adminCourseId,
                metaIdentifiers.adminCourseId
            ),
            backendCourseId: firstNonEmptyIdentifier(
                overrideEntry.backendCourseId,
                overrideEntry.backendId,
                overrideEntry.backend_course_id,
                meta?.backendCourseId,
                metaIdentifiers.backendCourseId
            ),
            aliases,
        };
    }

    function registerIndexEntry(index, token, localId) {
        if (!token || !localId) return;
        if (!Object.prototype.hasOwnProperty.call(index, token)) {
            index[token] = localId;
            return;
        }
        if (index[token] !== localId) {
            index[token] = null;
        }
    }

    function resolveIndexEntry(index, token) {
        if (!token) return null;
        const found = index[token];
        return typeof found === "string" && found ? found : null;
    }

    function buildLocalCourseLookupIndex() {
        const index = {
            byLocalAlias: {},
            byCode: {},
            byTitle: {},
            byAdminId: {},
            byTrackingId: {},
        };

        coursesMeta.forEach((meta) => {
            const localId = String(meta.id || "");
            if (!localId) return;
            const configured = getConfiguredCourseIdentifiers(localId);

            registerIndexEntry(index.byLocalAlias, normalizeIdentifierToken(localId), localId);
            registerIndexEntry(index.byCode, normalizeIdentifierToken(meta.code), localId);
            registerIndexEntry(index.byTitle, normalizeIdentifierToken(meta.title), localId);
            registerIndexEntry(index.byAdminId, normalizeIdentifierToken(configured.adminCourseId), localId);
            registerIndexEntry(index.byAdminId, normalizeIdentifierToken(configured.backendCourseId), localId);
            registerIndexEntry(index.byTrackingId, normalizeIdentifierToken(configured.trackingCourseId), localId);

            configured.aliases.forEach((alias) => {
                registerIndexEntry(index.byLocalAlias, normalizeIdentifierToken(alias), localId);
            });
        });

        return index;
    }

    function resolveLocalCourseIdFromRemote(remoteCourse, lookupIndex) {
        const localAliasCandidates = [
            remoteCourse?.localCourseId,
            remoteCourse?.localId,
            remoteCourse?.courseSlug,
            remoteCourse?.slug,
            remoteCourse?.courseKey,
            remoteCourse?.courseAlias,
        ];
        for (const candidate of localAliasCandidates) {
            const localId = resolveIndexEntry(lookupIndex.byLocalAlias, normalizeIdentifierToken(candidate));
            if (localId) return { localId, source: "explicit-local-alias" };
        }

        const adminIdCandidates = [
            remoteCourse?._id,
            remoteCourse?.adminCourseId,
            remoteCourse?.backendCourseId,
            remoteCourse?.id,
            remoteCourse?.courseId,
        ];
        for (const candidate of adminIdCandidates) {
            const localId = resolveIndexEntry(lookupIndex.byAdminId, normalizeIdentifierToken(candidate));
            if (localId) return { localId, source: "explicit-admin-id" };
        }

        const trackingIdCandidates = [
            remoteCourse?.trackingCourseId,
            remoteCourse?.trackingId,
            remoteCourse?.tracking?.courseId,
        ];
        for (const candidate of trackingIdCandidates) {
            const localId = resolveIndexEntry(lookupIndex.byTrackingId, normalizeIdentifierToken(candidate));
            if (localId) return { localId, source: "explicit-tracking-id" };
        }

        const localIdByCode = resolveIndexEntry(
            lookupIndex.byCode,
            normalizeIdentifierToken(remoteCourse?.code || remoteCourse?.courseCode)
        );
        if (localIdByCode) return { localId: localIdByCode, source: "exact-code-match" };

        const localIdByTitle = resolveIndexEntry(lookupIndex.byTitle, normalizeIdentifierToken(remoteCourse?.title));
        if (localIdByTitle) return { localId: localIdByTitle, source: "exact-title-match" };

        return { localId: null, source: "unresolved" };
    }

    function resolveRemoteTrackingCourseId(remoteCourse) {
        return firstNonEmptyIdentifier(
            remoteCourse?.trackingCourseId,
            remoteCourse?.trackingId,
            remoteCourse?.tracking?.courseId,
            remoteCourse?.courseTrackingId
        );
    }

    function formatDisplayDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "TBD";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function getAdminBaseUrl() {
        return (
            window.NibrasShared?.resolveServiceUrl?.("admin") ||
            window.NibrasApi?.resolveServiceUrl?.("admin") ||
            window.NibrasApiConfig?.getServiceUrl?.("admin") ||
            window.NIBRAS_API_URL ||
            window.NIBRAS_BACKEND_URL ||
            (/^https?:/i.test(window.location?.origin || "") ? window.location.origin.replace(/\/+$/, "") : "")
        );
    }

    async function adminApiFetch(path) {
        const shared = window.NibrasShared;
        if (shared && typeof shared.apiFetch === "function") {
            return shared.apiFetch(path, { service: "admin" });
        }

        const token =
            shared?.auth?.getToken?.() ||
            window.NibrasApi?.getToken?.() ||
            null;
        const headers = shared?.auth?.buildAuthHeaders
            ? shared.auth.buildAuthHeaders({ "Content-Type": "application/json" }, { token })
            : window.NibrasApi?.buildAuthHeaders?.({ "Content-Type": "application/json" }, { token }) || { "Content-Type": "application/json" };
        const response = await fetch(`${getAdminBaseUrl()}${path}`, {
            headers,
        });
        const payload = await response.json();
        if (!response.ok) {
            const message = payload?.message || payload?.error || `Request failed (${response.status})`;
            throw new Error(message);
        }
        return payload;
    }

    function parseArrayPayload(payload) {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.results)) return payload.results;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
    }

    async function loadRemoteCourseMap() {
        if (remoteCourseState.byLocalId) return remoteCourseState.byLocalId;
        if (remoteCourseState.loadingPromise) return remoteCourseState.loadingPromise;

        remoteCourseState.loadingPromise = adminApiFetch("/courses?page=1&limit=100")
            .then((payload) => {
                const remoteList = parseArrayPayload(payload);
                const lookupIndex = buildLocalCourseLookupIndex();
                const byLocalId = {};
                const unresolved = [];

                remoteList.forEach((remoteCourse) => {
                    const mapping = resolveLocalCourseIdFromRemote(remoteCourse, lookupIndex);
                    const localId = mapping.localId;
                    if (!localId) {
                        unresolved.push({
                            title: remoteCourse?.title || "",
                            remoteId: remoteCourse?._id || remoteCourse?.id || "",
                        });
                        return;
                    }
                    if (byLocalId[localId]) {
                        emitCourseMappingWarning(
                            `duplicate-remote-course:${localId}`,
                            `Multiple remote courses mapped to "${localId}". Keeping first deterministic match and ignoring duplicates.`
                        );
                        return;
                    }

                    byLocalId[localId] = {
                        remoteId: remoteCourse?._id || null,
                        adminCourseId: remoteCourse?._id || null,
                        backendCourseId: remoteCourse?.backendCourseId || null,
                        trackingCourseId: resolveRemoteTrackingCourseId(remoteCourse) || "",
                        title: remoteCourse?.title || "",
                        description: remoteCourse?.description || "",
                        instructorName: remoteCourse?.instructor?.name || "",
                        sections: Array.isArray(remoteCourse?.sections) ? remoteCourse.sections : [],
                        mappingSource: mapping.source,
                    };
                });

                remoteCourseState.byLocalId = byLocalId;
                remoteCourseState.unresolved = unresolved;
                if (unresolved.length) {
                    const preview = unresolved
                        .slice(0, 3)
                        .map((item) => item.title || item.remoteId || "unknown-course")
                        .join(", ");
                    emitCourseMappingWarning(
                        "unresolved-admin-courses",
                        `Could not map ${unresolved.length} admin course(s) to local IDs. Configure window.NIBRAS_COURSE_ID_MAP to map them explicitly. Examples: ${preview}.`
                    );
                }
                return byLocalId;
            })
            .catch((error) => {
                console.warn("[NibrasCourses] Failed to load remote courses:", error?.message || error);
                remoteCourseState.byLocalId = {};
                remoteCourseState.unresolved = [];
                return remoteCourseState.byLocalId;
            })
            .finally(() => {
                remoteCourseState.loadingPromise = null;
            });

        return remoteCourseState.loadingPromise;
    }

    async function getAdminCoursesList() {
        const localCourses = getAllCoursesList();
        const remoteByLocalId = await loadRemoteCourseMap();

        return localCourses.map((course) => {
            if (course.type !== "standard") return course;
            const remote = remoteByLocalId[course.id];
            const merged = !remote
                ? course
                : {
                    ...course,
                    title: remote.title || course.title,
                    instructor: remote.instructorName || course.instructor,
                    remoteCourseId: remote.remoteId || null,
                };
            const identifiers = resolveCourseIdentifiers(merged.id);
            if (!identifiers) return merged;
            return {
                ...merged,
                trackingCourseId: identifiers.trackingCourseId,
                trackingCourseIdForApi: identifiers.trackingCourseIdForApi,
                adminCourseId: identifiers.adminCourseId,
                backendCourseId: identifiers.backendCourseId,
                remoteCourseId: identifiers.adminCourseId || merged.remoteCourseId || null,
            };
        });
    }

    function resolveCourseIdentifiers(courseOrId, options = {}) {
        const requestedId = typeof courseOrId === "string" ? courseOrId : courseOrId?.id;
        const localCourseId = isValidCourseId(requestedId) ? String(requestedId) : "";
        if (!localCourseId) return null;

        const resolvedCourse = typeof courseOrId === "object" && courseOrId
            ? courseOrId
            : coursesById[localCourseId];
        const configured = getConfiguredCourseIdentifiers(localCourseId);
        const remote = remoteCourseState.byLocalId?.[localCourseId];

        let trackingFromStorage = "";
        try {
            trackingFromStorage = normalizeIdentifierValue(localStorage.getItem(TRACKING_COURSE_KEY));
        } catch (_error) {
            trackingFromStorage = "";
        }
        const trackingCourseId = firstNonEmptyIdentifier(
            resolvedCourse?.trackingCourseId,
            resolvedCourse?.tracking?.courseId,
            resolvedCourse?.apiCourseId,
            configured.trackingCourseId,
            remote?.trackingCourseId,
            trackingFromStorage
        );

        const adminCourseId = firstNonEmptyIdentifier(
            resolvedCourse?.adminCourseId,
            resolvedCourse?.remoteCourseId,
            configured.adminCourseId,
            remote?.adminCourseId,
            remote?.remoteId
        );
        const backendCourseId = firstNonEmptyIdentifier(
            resolvedCourse?.backendCourseId,
            configured.backendCourseId,
            remote?.backendCourseId,
            adminCourseId
        );

        const trackingCourseIdForApi = trackingCourseId || localCourseId;
        const messages = {
            tracking: trackingCourseId ? "" : buildMissingCourseMappingMessage(localCourseId, "tracking"),
            admin: adminCourseId ? "" : buildMissingCourseMappingMessage(localCourseId, "admin"),
        };

        if (options.warnOnMissing && messages.tracking) {
            emitCourseMappingWarning(`missing-tracking:${localCourseId}`, messages.tracking);
        }
        if (options.warnOnMissing && messages.admin) {
            emitCourseMappingWarning(`missing-admin:${localCourseId}`, messages.admin);
        }

        return {
            localCourseId,
            trackingCourseId,
            trackingCourseIdForApi,
            adminCourseId,
            backendCourseId,
            hasTrackingMapping: Boolean(trackingCourseId),
            hasAdminMapping: Boolean(adminCourseId),
            messages,
        };
    }

    async function resolveCourseIdentifiersAsync(courseOrId, options = {}) {
        if (options.loadRemote !== false) {
            await loadRemoteCourseMap();
        }
        return resolveCourseIdentifiers(courseOrId, options);
    }

    function enrichCourseWithIdentifiers(course) {
        if (!course || typeof course !== "object" || !isValidCourseId(course.id)) return course;
        if (course.type === "practice_lab") return course;
        const identifiers = resolveCourseIdentifiers(course.id);
        if (!identifiers) return course;
        return {
            ...course,
            trackingCourseId: identifiers.trackingCourseId,
            trackingCourseIdForApi: identifiers.trackingCourseIdForApi,
            adminCourseId: identifiers.adminCourseId,
            backendCourseId: identifiers.backendCourseId,
            remoteCourseId: identifiers.adminCourseId || course.remoteCourseId || null,
        };
    }

    function normalizeAssignmentItem(item, index, localCourseId) {
        const pointsRaw = Number(item?.maxScore ?? item?.points ?? item?.totalPoints ?? 100);
        const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 100;
        const scoreRaw = Number(item?.score ?? item?.grade ?? item?.earnedScore);
        const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(points, scoreRaw)) : null;
        const status = score !== null ? "graded" : item?.submittedAt ? "submitted" : "not_started";
        const statusLabel = status === "graded" ? "Graded" : status === "submitted" ? "Submitted" : "Not Started";
        const scopedCourseId = normalizeIdentifierValue(localCourseId) || "course";
        const fallbackAssignmentId = `${scopedCourseId}-assignment-${index + 1}`;
        const assignmentId = String(item?._id || item?.id || fallbackAssignmentId);
        const milestoneId = String(item?.milestoneId || item?.milestone_id || item?._id || `${scopedCourseId}-milestone-${index + 1}`);
        const projectKey = String(item?.projectKey || item?.project_id || `${scopedCourseId}-project-1`);

        return {
            id: assignmentId,
            backendAssignmentId: item?._id || null,
            title: item?.title || `Assignment ${index + 1}`,
            status,
            statusLabel,
            description: item?.description || "No description provided.",
            points,
            score,
            dueDate: formatDisplayDate(item?.dueDate),
            dueTime: "11:59 PM",
            type: "File Upload",
            action: score !== null ? "View Details" : "Submit",
            milestoneId,
            projectKey,
            page: "./Assignments Content/AssignmentContent.html",
        };
    }

    function toAssignmentDetail(assignment, selectedCourse) {
        return {
            title: assignment.title,
            points: assignment.points,
            scoreEarned: assignment.score ?? 0,
            description: assignment.description,
            dueDate: assignment.dueDate,
            dueTime: assignment.dueTime,
            submissionType: assignment.type,
            milestoneId: assignment.milestoneId,
            projectKey: assignment.projectKey,
            instructions: {
                intro: `Complete this assignment for ${selectedCourse.title}.`,
                points: [
                    "Follow all assignment requirements listed above.",
                    "Submit clear and well-structured work.",
                    "Include notes for important design decisions.",
                ],
            },
            files: [],
            rubric: [
                { criteria: "Correctness", percent: "50%" },
                { criteria: "Code Quality", percent: "30%" },
                { criteria: "Documentation", percent: "20%" },
            ],
            feedback: {
                comment: assignment.score !== null ? "Graded successfully." : "No feedback yet.",
                grader: selectedCourse.instructor,
                date: "Pending",
            },
        };
    }

    async function getAdminAssignmentsByCourseId(localCourseId) {
        const normalizedLocalCourseId = isValidCourseId(localCourseId) ? String(localCourseId) : "";
        if (!normalizedLocalCourseId) return null;
        const selectedCourse = getCourseById(normalizedLocalCourseId);
        if (!selectedCourse) return null;

        const remoteByLocalId = await loadRemoteCourseMap();
        const identifiers = resolveCourseIdentifiers(normalizedLocalCourseId, { warnOnMissing: true });
        const remoteCourseId = firstNonEmptyIdentifier(
            remoteByLocalId?.[normalizedLocalCourseId]?.remoteId,
            identifiers?.adminCourseId,
            identifiers?.backendCourseId
        );
        if (!remoteCourseId) {
            const message = identifiers?.messages?.admin || buildMissingCourseMappingMessage(normalizedLocalCourseId, "admin");
            emitCourseMappingWarning(`missing-admin-assignments:${normalizedLocalCourseId}`, message);
            const mappingError = new Error(message);
            mappingError.code = "COURSE_ID_MAPPING_MISSING";
            throw mappingError;
        }

        if (remoteAssignmentsState[remoteCourseId]) {
            return remoteAssignmentsState[remoteCourseId];
        }

        try {
            const payload = await adminApiFetch(`/assignments/course/${encodeURIComponent(remoteCourseId)}?page=1&limit=50`);
            const rawItems = parseArrayPayload(payload);
            if (!rawItems.length) return null;

            const items = rawItems.map((item, index) => normalizeAssignmentItem(item, index, normalizedLocalCourseId));
            const gradedItems = items.filter((item) => item.status === "graded");
            const stats = {
                completed: gradedItems.length,
                total: items.length,
                pointsEarned: gradedItems.reduce((sum, item) => sum + (item.score || 0), 0),
                pointsTotal: items.reduce((sum, item) => sum + item.points, 0),
                progressPercent: items.length ? Math.round((gradedItems.length / items.length) * 100) : 0,
            };

            const result = {
                stats,
                items,
                assignmentDetail: toAssignmentDetail(items[0], selectedCourse),
            };
            remoteAssignmentsState[remoteCourseId] = result;
            return result;
        } catch (error) {
            console.warn("[NibrasCourses] Failed to load remote assignments:", error?.message || error);
            return null;
        }
    }

    async function getAdminCourseByLocalId(localCourseId) {
        const remoteByLocalId = await loadRemoteCourseMap();
        const normalizedLocalCourseId = isValidCourseId(localCourseId) ? String(localCourseId) : "";
        const remoteCourse = remoteByLocalId?.[normalizedLocalCourseId] || null;
        if (!remoteCourse && normalizedLocalCourseId) {
            emitCourseMappingWarning(
                `missing-admin-overview:${normalizedLocalCourseId}`,
                buildMissingCourseMappingMessage(normalizedLocalCourseId, "admin")
            );
        }
        return remoteCourse;
    }

    function getPracticeLabCourse() {
        return {
            id: PRACTICE_LAB_COURSE_ID,
            title: "Practice Labs",
            instructor: "Competitive Programming • Adaptive Level",
            progress: null,
            rating: null,
            level: null,
            deadline: "5-10 problems per lab",
            isPopular: true,
            isPractice: true,
            category: "comp_prog",
            type: "practice_lab",
            features: [
                "Topic-based problem sets",
                "AI hints & mistake analysis",
                "Contest simulation mode",
            ],
            page: "../Competitions/Practice/practice.html",
        };
    }

    function getAllCoursesList() {
        const standardCourses = coursesMeta.map((meta) => {
            const identifiers = resolveCourseIdentifiers(meta.id);
            return {
                id: meta.id,
                title: meta.title,
                instructor: meta.instructor,
                progress: meta.progress,
                rating: meta.rating,
                level: meta.level,
                deadline: meta.deadline,
                isPopular: meta.isPopular,
                category: meta.category,
                type: "standard",
                trackingCourseId: identifiers?.trackingCourseId || "",
                trackingCourseIdForApi: identifiers?.trackingCourseIdForApi || meta.id,
                adminCourseId: identifiers?.adminCourseId || "",
                backendCourseId: identifiers?.backendCourseId || "",
                remoteCourseId: identifiers?.adminCourseId || null,
            };
        });

        return [...standardCourses, getPracticeLabCourse()];
    }

    function getCoursesList() {
        return getAllCoursesList().filter((course) => course.type === "practice_lab" || course.level === "Beginner");
    }

    function getIntermediateCoursesList() {
        return getAllCoursesList().filter((course) => course.level === "Intermediate");
    }

    function getCourseIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("courseId");
    }

    function isValidCourseId(courseId) {
        return typeof courseId === "string" && !!coursesById[courseId];
    }

    function setSelectedCourseId(courseId) {
        if (isValidCourseId(courseId)) {
            localStorage.setItem(SELECTED_COURSE_KEY, courseId);
        }
    }

    function getStoredCourseId() {
        const stored = localStorage.getItem(SELECTED_COURSE_KEY);
        return isValidCourseId(stored) ? stored : null;
    }

    function resolveCourseId() {
        const fromUrl = getCourseIdFromUrl();
        if (isValidCourseId(fromUrl)) {
            setSelectedCourseId(fromUrl);
            return fromUrl;
        }

        const stored = getStoredCourseId();
        if (stored) return stored;

        setSelectedCourseId(DEFAULT_COURSE_ID);
        return DEFAULT_COURSE_ID;
    }

    function getCourseById(courseId) {
        const course = coursesById[courseId] || coursesById[DEFAULT_COURSE_ID];
        return enrichCourseWithIdentifiers(course);
    }

    function getSelectedCourse() {
        const courseId = resolveCourseId();
        return getCourseById(courseId);
    }

    function withCourseId(path, courseId) {
        if (!path) return path;
        if (path.includes("courseId=")) return path;
        const separator = path.includes("?") ? "&" : "?";
        return `${path}${separator}courseId=${encodeURIComponent(courseId)}`;
    }

    window.NibrasCourses = {
        getCoursesList,
        getAdminCoursesList,
        getIntermediateCoursesList,
        getCourseById,
        getSelectedCourse,
        getAdminAssignmentsByCourseId,
        getAdminCourseByLocalId,
        resolveCourseIdentifiers,
        resolveCourseIdentifiersAsync,
        getCourseIdFromUrl,
        resolveCourseId,
        setSelectedCourseId,
        withCourseId,
    };
})();
