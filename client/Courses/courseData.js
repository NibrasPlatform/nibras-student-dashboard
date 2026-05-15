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

    const cs106bMultiVideoLectures = [
        { title: "About the CS106 Series at Stanford", videos: [{ title: "Lecture 1", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture01.mp4" }] },
        { title: "Similarity between C++ & Java", videos: [{ title: "Lecture 2", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture02.mp4" }] },
        { title: "C++ Libraries - Standard Libraries", videos: [{ title: "Lecture 3", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture03.mp4" }] },
        { title: "C++ Console I/O", videos: [{ title: "Lecture 4", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture04.mp4" }] },
        { title: "Client Use of Templates", videos: [{ title: "Lecture 5", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture05.mp4" }] },
        { title: "More Containers", videos: [{ title: "Lecture 6", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture06.mp4" }] },
        { title: "Seeing Functions as Data", videos: [{ title: "Lecture 7", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture07.mp4" }] },
        { title: "Common Mistakes Stumbled Upon", videos: [{ title: "Lecture 8", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture08.mp4" }] },
        { title: "Thinking Recursively", videos: [{ title: "Lecture 9", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture09.mp4" }] },
        { title: "Refresh: Permute Code", videos: [{ title: "Lecture 10", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture10.mp4" }] },
        { title: "Backtracking Pseudocode", videos: [{ title: "Lecture 11", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture11.mp4" }] },
        { title: "Pointer Movie", videos: [{ title: "Lecture 12", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture12.mp4" }] },
        { title: "Coding with Linked List", videos: [{ title: "Lecture 13", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture13.mp4" }] },
        { title: "Algorithm Analysis", videos: [{ title: "Lecture 14", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture14.mp4" }] },
        { title: "Selection Sort", videos: [{ title: "Lecture 15", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture15.mp4" }] },
        { title: "Partitioning for Quicksort", videos: [{ title: "Lecture 16", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture16.mp4" }] },
        { title: "Sort Template with Callback", videos: [{ title: "Lecture 17", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture17.mp4" }] },
        { title: "Abstract Data Types", videos: [{ title: "Lecture 18", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture18.mp4" }] },
        { title: "Rules of Template Implementation", videos: [{ title: "Lecture 19", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture19.mp4" }] },
        { title: "Live Coding: Recap of Vector-based Implementation for Stack", videos: [{ title: "Lecture 20", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture20.mp4" }] },
        { title: "Buffer: Vector vs Stack", videos: [{ title: "Lecture 21", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture21.mp4" }] },
        { title: "Map as Vector", videos: [{ title: "Lecture 22", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture22.mp4" }] },
        { title: "Pathfinder Demo", videos: [{ title: "Lecture 23", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture23.mp4" }] },
        { title: "Compare Map Implementations", videos: [{ title: "Lecture 24", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture24.mp4" }] },
        { title: "Lexicon Case Study", videos: [{ title: "Lecture 25", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture25.mp4" }] },
        { title: "Final Showdown", videos: [{ title: "Lecture 26", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture26.mp4" }] },
        { title: "Guest Lecturer: Keith Schwarz", videos: [{ title: "Lecture 27", videoUrl: "http://html5.stanford.edu/videos/courses/see/CS106B/CS106B-lecture27.mp4" }] },
    ];

    const cs106xMultiVideoLectures = [
        { title: "Introduction", videos: [{ title: "Lecture 1", bilibiliId: "BV1PK411A7S4", page: 1 }] },
        { title: "Functions", videos: [{ title: "Lecture 2", bilibiliId: "BV1PK411A7S4", page: 2 }] },
        { title: "Strings, Streams, Grid", videos: [{ title: "Lecture 3", bilibiliId: "BV1PK411A7S4", page: 3 }] },
        { title: "Vector, Big-Oh", videos: [{ title: "Lecture 4", bilibiliId: "BV1PK411A7S4", page: 4 }] },
        { title: "Stacks and Queues", videos: [{ title: "Lecture 5", bilibiliId: "BV1PK411A7S4", page: 5 }] },
        { title: "Sets and Maps", videos: [{ title: "Lecture 6", bilibiliId: "BV1PK411A7S4", page: 6 }] },
        { title: "Recursion", videos: [{ title: "Lecture 7", bilibiliId: "BV1PK411A7S4", page: 7 }] },
        { title: "Recursion 2", videos: [{ title: "Lecture 8", bilibiliId: "BV1PK411A7S4", page: 8 }] },
        { title: "Recursion 3, Fractals", videos: [{ title: "Lecture 9", bilibiliId: "BV1PK411A7S4", page: 9 }] },
        { title: "Exhaustive Search", videos: [{ title: "Lecture 10", bilibiliId: "BV1PK411A7S4", page: 10 }] },
        { title: "Backtracking", videos: [{ title: "Lecture 11", bilibiliId: "BV1PK411A7S4", page: 11 }] },
        { title: "Backtracking 2", videos: [{ title: "Lecture 12", bilibiliId: "BV1PK411A7S4", page: 12 }] },
        { title: "Pointers and Nodes", videos: [{ title: "Lecture 13", bilibiliId: "BV1PK411A7S4", page: 13 }] },
        { title: "Linked Lists", videos: [{ title: "Lecture 14", bilibiliId: "BV1PK411A7S4", page: 14 }] },
        { title: "Linked Lists 2", videos: [{ title: "Lecture 15", bilibiliId: "BV1PK411A7S4", page: 15 }] },
        { title: "Classes", videos: [{ title: "Lecture 16", bilibiliId: "BV1PK411A7S4", page: 16 }] },
        { title: "Classes 2; Skip Lists", videos: [{ title: "Lecture 17", bilibiliId: "BV1PK411A7S4", page: 17 }] },
        { title: "Arrays", videos: [{ title: "Lecture 18", bilibiliId: "BV1PK411A7S4", page: 18 }] },
        { title: "Recursion 4, Memoization", videos: [{ title: "Lecture 19", bilibiliId: "BV1PK411A7S4", page: 19 }] },
        { title: "Recursion 5, Sudoku", videos: [{ title: "Lecture 20", bilibiliId: "BV1PK411A7S4", page: 20 }] },
        { title: "Implementing Map", videos: [{ title: "Lecture 21", bilibiliId: "BV1PK411A7S4", page: 21 }] },
        { title: "Graphs 1, DFS", videos: [{ title: "Lecture 22", bilibiliId: "BV1PK411A7S4", page: 22 }] },
        { title: "Graphs 2, BFS, Dijkstra", videos: [{ title: "Lecture 23", bilibiliId: "BV1PK411A7S4", page: 23 }] },
        { title: "Graphs 3 - A*, Kruskal", videos: [{ title: "Lecture 24", bilibiliId: "BV1PK411A7S4", page: 24 }] },
        { title: "Graphs 4 - Topological Sort", videos: [{ title: "Lecture 25", bilibiliId: "BV1PK411A7S4", page: 25 }] },
        { title: "Inheritance, Hashing", videos: [{ title: "Lecture 26", bilibiliId: "BV1PK411A7S4", page: 26 }] },
        { title: "Hashing 2, Inheritance 2", videos: [{ title: "Lecture 27", bilibiliId: "BV1PK411A7S4", page: 27 }] },
        { title: "Sorting", videos: [{ title: "Lecture 28", bilibiliId: "BV1PK411A7S4", page: 28 }] },
        { title: "Templates, STL", videos: [{ title: "Lecture 29", bilibiliId: "BV1PK411A7S4", page: 29 }] },
        { title: "What's Next", videos: [{ title: "Lecture 30", bilibiliId: "BV1PK411A7S4", page: 30 }] },
    ];

    const math18MultiVideoLectures = [
        { title: "Introduction to Calculus", videos: [{ title: "Lecture 1", youtubeId: "fYyARMqiaag" }] },
        { title: "Functions and Their Properties", videos: [{ title: "Lecture 2", youtubeId: "1EGFSefe5II" }] },
        { title: "Linear Functions and Rates of Change", videos: [{ title: "Lecture 3", youtubeId: "SzLF-wLZF_I" }] },
        { title: "Polynomial and Rational Functions", videos: [{ title: "Lecture 4", youtubeId: "f-_UsIP5jyA" }] },
        { title: "Exponential and Logarithmic Functions", videos: [{ title: "Lecture 5", youtubeId: "VSqOZNULRjQ" }] },
        { title: "Trigonometric Functions", videos: [{ title: "Lecture 6", youtubeId: "OEE5-M4aY4k" }] },
        { title: "Limits and Continuity", videos: [{ title: "Lecture 7", youtubeId: "PqQ5v94_NGM" }] },
        { title: "Introduction to Derivatives", videos: [{ title: "Lecture 8", youtubeId: "962lLfW-8Jo" }] },
        { title: "Differentiation Rules", videos: [{ title: "Lecture 9", youtubeId: "EY6FHX6asU0" }] },
        { title: "Chain Rule and Implicit Differentiation", videos: [{ title: "Lecture 10", youtubeId: "AvCQQ3X4Nuc" }] },
        { title: "Derivatives of Trigonometric Functions", videos: [{ title: "Lecture 11", youtubeId: "qr1WXiq3S3k" }] },
        { title: "Related Rates", videos: [{ title: "Lecture 12", youtubeId: "RJJSiNz5oto" }] },
        { title: "Applications of Derivatives", videos: [{ title: "Lecture 13", youtubeId: "8dr1dZjfhmc" }] },
        { title: "Curve Sketching", videos: [{ title: "Lecture 14", youtubeId: "RUS4mKo9tBk" }] },
        { title: "Optimization Problems", videos: [{ title: "Lecture 15", youtubeId: "43Qt6wc44To" }] },
        { title: "Introduction to Integration", videos: [{ title: "Lecture 16", youtubeId: "Mx39JbbzEAo" }] },
        { title: "Definite Integrals", videos: [{ title: "Lecture 17", youtubeId: "qW89xdGfSzw" }] },
        { title: "Fundamental Theorem of Calculus", videos: [{ title: "Lecture 18", youtubeId: "nQ6tOORDQ3I" }] },
        { title: "Integration Techniques", videos: [{ title: "Lecture 19", youtubeId: "29GbRaQxtzY" }] },
        { title: "Integration by Parts", videos: [{ title: "Lecture 20", youtubeId: "-PYebK8DKPc" }] },
        { title: "Trigonometric Integrals", videos: [{ title: "Lecture 21", youtubeId: "8u6woY05aL0" }] },
        { title: "Integration of Rational Functions", videos: [{ title: "Lecture 22", youtubeId: "SWZcq_biZLw" }] },
        { title: "Area Between Curves", videos: [{ title: "Lecture 23", youtubeId: "b2ZFpE_yrLg" }] },
        { title: "Volumes of Revolution", videos: [{ title: "Lecture 24", youtubeId: "aiBD9aI69C8" }] },
        { title: "Volumes Using Cross-Sections", videos: [{ title: "Lecture 25", youtubeId: "F0uuW-I6icY" }] },
        { title: "Arc Length", videos: [{ title: "Lecture 26", youtubeId: "K0ORDCt5Ig0" }] },
        { title: "Sequences and Series", videos: [{ title: "Lecture 27", youtubeId: "xjtEfS0vY2o" }] },
        { title: "Infinite Series Convergence", videos: [{ title: "Lecture 28", youtubeId: "c7wur9Lixb0" }] },
        { title: "Power Series", videos: [{ title: "Lecture 29", youtubeId: "GJOJl47l2_4" }] },
        { title: "Taylor and Maclaurin Series", videos: [{ title: "Lecture 30", youtubeId: "BDmlottZVd4" }] },
        { title: "Parametric Equations and Polar Coordinates", videos: [{ title: "Lecture 31", youtubeId: "5Yuw1jCBq-0" }] },
    ];

    const math19MultiVideoLectures = [
        { title: "Rate of Change", videos: [{ title: "Lecture 1", youtubeId: "7K1sB05pE0A" }] },
        { title: "Limits", videos: [{ title: "Lecture 2", youtubeId: "ryLdyDrBfvI" }] },
        { title: "Derivatives", videos: [{ title: "Lecture 3", youtubeId: "kCPVBl953eY" }] },
        { title: "Chain Rule", videos: [{ title: "Lecture 4", youtubeId: "4sTKcvYMNxk" }] },
        { title: "Implicit Differentiation", videos: [{ title: "Lecture 5", youtubeId: "5q_3FDOkVRQ" }] },
        { title: "Exponential and Log", videos: [{ title: "Lecture 6", youtubeId: "9v25gg2qJYE" }] },
        { title: "Exam 1 Review", videos: [{ title: "Lecture 7", youtubeId: "eHJuAByQf5A" }] },
        { title: "Linear and Quadratic Approximations", videos: [{ title: "Lecture 9", youtubeId: "BSAA0akmPEU" }] },
        { title: "Curve Sketching", videos: [{ title: "Lecture 10", youtubeId: "eRCN3daFCmU" }] },
        { title: "Max-min", videos: [{ title: "Lecture 11", youtubeId: "twzGBqPeW0M" }] },
        { title: "Related Rates", videos: [{ title: "Lecture 12", youtubeId: "YN7k_bXXggY" }] },
        { title: "Newton's Method", videos: [{ title: "Lecture 13", youtubeId: "sRIDVAcoG5A" }] },
        { title: "Mean Value Theorem", videos: [{ title: "Lecture 14", youtubeId: "4Q37iOyBq44" }] },
        { title: "Antiderivatives", videos: [{ title: "Lecture 15", youtubeId: "-MI0b4h3rS0" }] },
        { title: "Differential Equations", videos: [{ title: "Lecture 16", youtubeId: "60VGKnYBpbg" }] },
        { title: "Definite Integrals", videos: [{ title: "Lecture 18", youtubeId: "hjZhPczMkL4" }] },
        { title: "First Fundamental Theorem", videos: [{ title: "Lecture 19", youtubeId: "1RLctDS2hUQ" }] },
        { title: "Second Fundamental Theorem", videos: [{ title: "Lecture 20", youtubeId: "Pd2xP5zDsRw" }] },
        { title: "Applications to Logarithms", videos: [{ title: "Lecture 21", youtubeId: "_JXPe2J069c" }] },
        { title: "Volumes", videos: [{ title: "Lecture 22", youtubeId: "ShGBRUx2ub8" }] },
        { title: "Work, Probability", videos: [{ title: "Lecture 23", youtubeId: "R9a_NHXrBcg" }] },
        { title: "Numerical Integration", videos: [{ title: "Lecture 24", youtubeId: "jBkXbAgMj6s" }] },
        { title: "Exam 3 Review", videos: [{ title: "Lecture 25", youtubeId: "zUEuKrxgHws" }] },
        { title: "Trig Integrals", videos: [{ title: "Lecture 27", youtubeId: "Bv9kVDcj7yo" }] },
        { title: "Inverse Substitution", videos: [{ title: "Lecture 28", youtubeId: "CXKoCMVqM9s" }] },
        { title: "Partial Fractions", videos: [{ title: "Lecture 29", youtubeId: "HgEqXhsIq_g" }] },
        { title: "Integration by Parts", videos: [{ title: "Lecture 30", youtubeId: "aeXp1zC6Hls" }] },
        { title: "Parametric Equations", videos: [{ title: "Lecture 31", youtubeId: "TpWQlKHPyJ4" }] },
        { title: "Polar Coordinates", videos: [{ title: "Lecture 32", youtubeId: "XRkgBWbWvg4" }] },
        { title: "Exam 4 Review", videos: [{ title: "Lecture 33", youtubeId: "BGE3wb7H2PA" }] },
        { title: "Indeterminate Forms", videos: [{ title: "Lecture 35", youtubeId: "PNTnmH6jsRI" }] },
        { title: "Improper Integrals", videos: [{ title: "Lecture 36", youtubeId: "KhwQKE_tld0" }] },
        { title: "Infinite Series", videos: [{ title: "Lecture 37", youtubeId: "MK_0QHbUnIA" }] },
        { title: "Taylor's Series", videos: [{ title: "Lecture 38", youtubeId: "wOHrNt9ScYs" }] },
        { title: "Final Review", videos: [{ title: "Lecture 39", youtubeId: "--lPz7VFnKI" }] },
    ];

    const math20MultiVideoLectures = [
        { title: "The Natural Log Function", videos: [{ title: "Lecture 1", youtubeId: "H9eCT6f_Ftw" }] },
        { title: "Derivatives of Inverse Functions", videos: [{ title: "Lecture 2", youtubeId: "HnsUNWNYZ28" }] },
        { title: "Derivatives and Integrals of Exponential Functions", videos: [{ title: "Lecture 3", youtubeId: "5HlW7OnXUT4" }] },
        { title: "Derivatives and Integrals of General Exponential Functions", videos: [{ title: "Lecture 4", youtubeId: "rR8imSHCuFk" }] },
        { title: "Calculus of Inverse Trigonometric Functions", videos: [{ title: "Lecture 5", youtubeId: "ST3ORfqVYQw" }] },
        { title: "A Discussion of Hyperbolic Functions", videos: [{ title: "Lecture 6", youtubeId: "3kPg0gkJQgc" }] },
        { title: "Evaluating Limits of Indeterminate Forms", videos: [{ title: "Lecture 7", youtubeId: "Zd7wd24jeok" }] },
        { title: "Integration By Parts", videos: [{ title: "Lecture 8", youtubeId: "EOwjiFpDY_s" }] },
        { title: "Techniques For Trigonometric Integrals", videos: [{ title: "Lecture 9", youtubeId: "pLrUBjiEo-w" }] },
        { title: "Integrals By Trigonometric Substitution", videos: [{ title: "Lecture 10", youtubeId: "q6JwTGpG8b4" }] },
        { title: "Integration By Partial Fractions", videos: [{ title: "Lecture 11", youtubeId: "KJGp0pyPoVo" }] },
        { title: "Improper Integrals", videos: [{ title: "Lecture 12", youtubeId: "g-M8FHslgdk" }] },
        { title: "Differential Equations", videos: [{ title: "Lecture 13", youtubeId: "WxVaVzxsDb0" }] },
        { title: "Convergence and Divergence of Sequences", videos: [{ title: "Lecture 14", youtubeId: "FoNLQvf4NUs" }] },
        { title: "Series and Divergence Test", videos: [{ title: "Lecture 15", youtubeId: "DGcWMdW-72M" }] },
        { title: "Integral Test for Series", videos: [{ title: "Lecture 16", youtubeId: "8jPpNK4GIVs" }] },
        { title: "Comparison Test for Series", videos: [{ title: "Lecture 17", youtubeId: "ei8WKMAHky0" }] },
        { title: "Alternating Series Test", videos: [{ title: "Lecture 18", youtubeId: "BhYPrQHDrjk" }] },
        { title: "Absolute Convergence and Ratio Test", videos: [{ title: "Lecture 19", youtubeId: "g4iZJOwMkjU" }] },
        { title: "Power Series", videos: [{ title: "Lecture 20", youtubeId: "TGD-TP1c7i4" }] },
        { title: "Taylor and Maclaurin Series", videos: [{ title: "Lecture 21", youtubeId: "3VHol7eosLA" }] },
        { title: "Taylor Polynomials", videos: [{ title: "Lecture 22", youtubeId: "RbreIk02B3c" }] },
        { title: "Parametric Equations", videos: [{ title: "Lecture 23", youtubeId: "d4KADBFqpR0" }] },
        { title: "Calculus of Parametric Equations", videos: [{ title: "Lecture 24", youtubeId: "1H6HrfX_qCA" }] },
        { title: "Polar Coordinates", videos: [{ title: "Lecture 25", youtubeId: "sWUyFQQ5QeI" }] },
        { title: "Calculus of Polar Equations", videos: [{ title: "Lecture 26", youtubeId: "Kh265EC11OI" }] },
        { title: "Numerical Integration", videos: [{ title: "Lecture 27", youtubeId: "RTX-ik_8i-k" }] },
    ];

    const math21MultiVideoLectures = [
        { title: "An Introduction to Vectors", videos: [{ title: "Lecture 1", youtubeId: "tGVnBAHLApA" }] },
        { title: "Vectors in 3-D Coordinate System", videos: [{ title: "Lecture 2", youtubeId: "ZAv3bF2GznI" }] },
        { title: "Using the Dot Product", videos: [{ title: "Lecture 3", youtubeId: "TKlGMRghcDs" }] },
        { title: "The Cross Product", videos: [{ title: "Lecture 4", youtubeId: "qqfhgStQ-cA" }] },
        { title: "Lines and Planes in 3-D", videos: [{ title: "Lecture 5", youtubeId: "IB1-lrPQjCw" }] },
        { title: "Cylinders and Surfaces in 3-D", videos: [{ title: "Lecture 6", youtubeId: "aBlKxFsoMZw" }] },
        { title: "Using Cylindrical and Spherical Coordinates", videos: [{ title: "Lecture 7", youtubeId: "rDeo721ogtk" }] },
        { title: "An Introduction To Vector Functions", videos: [{ title: "Lecture 8", youtubeId: "YThPIdcwr78" }] },
        { title: "Derivatives and Integrals of Vector Functions", videos: [{ title: "Lecture 9", youtubeId: "v_o-allq8LQ" }] },
        { title: "Arc Length and Parameterization", videos: [{ title: "Lecture 10", youtubeId: "Hu72QVWsMlg" }] },
        { title: "TNB Frames, Curvature, Torsion", videos: [{ title: "Lecture 11", youtubeId: "l7eDxflL-e0" }] },
        { title: "Velocity and Acceleration", videos: [{ title: "Lecture 12", youtubeId: "yq4Cj1_bmnE" }] },
        { title: "Intro to Multivariable Functions", videos: [{ title: "Lecture 13", youtubeId: "nIJQPX5kxp4" }] },
        { title: "Limits and Continuity of Multivariable Functions", videos: [{ title: "Lecture 14", youtubeId: "MFF4mvyhAyA" }] },
        { title: "Partial Derivatives", videos: [{ title: "Lecture 15", youtubeId: "EkZGBdY0vlg" }] },
        { title: "Differentials of Multivariable Functions", videos: [{ title: "Lecture 16", youtubeId: "J72AKZtUpgY" }] },
        { title: "The Chain Rule for Multivariable Functions", videos: [{ title: "Lecture 17", youtubeId: "tXryaM-mTpY" }] },
        { title: "Directional Derivatives and Gradients", videos: [{ title: "Lecture 18", youtubeId: "tDPp5uWSIiU" }] },
        { title: "Tangent Planes and Normal Lines", videos: [{ title: "Lecture 19", youtubeId: "yLbqHfuWsr8" }] },
        { title: "Extrema of Functions of 2 Variables", videos: [{ title: "Lecture 20", youtubeId: "kPL28zgEFk8" }] },
        { title: "Constrained Optimization with LaGrange Multipliers", videos: [{ title: "Lecture 21", youtubeId: "nUfYR5FBGZc" }] },
        { title: "Introduction to Double Integrals", videos: [{ title: "Lecture 22", youtubeId: "lv_awaaT6gY" }] },
        { title: "Double/Repeated/Iterated Integrals", videos: [{ title: "Lecture 23", youtubeId: "HxRG_phgGUw" }] },
        { title: "Double Integrals over Polar Regions", videos: [{ title: "Lecture 24", youtubeId: "HA41kYxVYnw" }] },
        { title: "Center of Mass for Lamina in 2-D", videos: [{ title: "Lecture 25", youtubeId: "WNZ8vMgaPgg" }] },
        { title: "Triple Integrals", videos: [{ title: "Lecture 26", youtubeId: "uTLM_iEcVdA" }] },
        { title: "Triple Integrals with Cylindrical and Spherical Coordinates", videos: [{ title: "Lecture 27", youtubeId: "R4vnw-yPnZ8" }] },
        { title: "Change of Variables in Multiple Integrals", videos: [{ title: "Lecture 28", youtubeId: "VVPu5fWssPg" }] },
        { title: "Introduction to Vector Fields", videos: [{ title: "Lecture 29", youtubeId: "71Z1RVYZ8HY" }] },
        { title: "Divergence and Curl of Vector Fields", videos: [{ title: "Lecture 30", youtubeId: "TMWevkxtS9s" }] },
        { title: "Line Integrals Over Non-Conservative Fields", videos: [{ title: "Lecture 31", youtubeId: "t6vtOOAnqyU" }] },
        { title: "Line Integrals on Conservative Vector Fields", videos: [{ title: "Lecture 32", youtubeId: "HhopxDkW4L8" }] },
        { title: "Green's Theorem", videos: [{ title: "Lecture 33", youtubeId: "OnyCk62hEL4" }] },
        { title: "Surface and Flux Integrals", videos: [{ title: "Lecture 34", youtubeId: "sQ0BJ3H-cZ8" }] },
    ];

    const math51MultiVideoLectures = [
        { title: "1. The Geometry of Linear Equations", videos: [{ title: "Lecture 1", youtubeId: "J7DzL2_Na80" }] },
        { title: "2. Elimination with Matrices", videos: [{ title: "Lecture 2", youtubeId: "QVKj3LADCnA" }] },
        { title: "3. Multiplication and Inverse Matrices", videos: [{ title: "Lecture 3", youtubeId: "FX4C-JpTFgY" }] },
        { title: "4. Factorization into A = LU", videos: [{ title: "Lecture 4", youtubeId: "MsIvs_6vC38" }] },
        { title: "5. Transposes, Permutations, Spaces R^n", videos: [{ title: "Lecture 5", youtubeId: "JibVXBElKL0" }] },
        { title: "6. Column Space and Nullspace", videos: [{ title: "Lecture 6", youtubeId: "8o5Cmfpeo6g" }] },
        { title: "7. Solving Ax = 0", videos: [{ title: "Lecture 7", youtubeId: "VqP2tREMvt0" }] },
        { title: "8. Solving Ax = b", videos: [{ title: "Lecture 8", youtubeId: "9Q1q7s1jTzU" }] },
        { title: "9. Independence, Basis, and Dimension", videos: [{ title: "Lecture 9", youtubeId: "yjBerM5jWsc" }] },
        { title: "10. The Four Fundamental Subspaces", videos: [{ title: "Lecture 10", youtubeId: "nHlE7EgJFds" }] },
        { title: "11. Matrix Spaces", videos: [{ title: "Lecture 11", youtubeId: "2IdtqGM6KWU" }] },
        { title: "12. Graphs and Networks", videos: [{ title: "Lecture 12", youtubeId: "6-wh6yvk6uc" }] },
        { title: "13. Quiz 1 Review", videos: [{ title: "Lecture 13", youtubeId: "l88D4r74gtM" }] },
        { title: "14. Orthogonal Vectors and Subspaces", videos: [{ title: "Lecture 14", youtubeId: "YzZUIYRCE38" }] },
        { title: "15. Projections and Least Squares", videos: [{ title: "Lecture 15", youtubeId: "Y_Ac6KiQ1t0" }] },
        { title: "16. Projection Matrices and Least Squares", videos: [{ title: "Lecture 16", youtubeId: "osh80YCg_GM" }] },
        { title: "17. Orthogonal Matrices and Gram-Schmidt", videos: [{ title: "Lecture 17", youtubeId: "0MtwqhIwdrI" }] },
        { title: "18. Gram-Schmidt and A = QR", videos: [{ title: "Lecture 18", youtubeId: "srxexLishgY" }] },
        { title: "19. Determinants", videos: [{ title: "Lecture 19", youtubeId: "23LLB9mNJvc" }] },
        { title: "20. Determinant Properties and Volume", videos: [{ title: "Lecture 20", youtubeId: "QNpj-gOXW9M" }] },
        { title: "21. Eigenvalues and Eigenvectors", videos: [{ title: "Lecture 21", youtubeId: "cdZnhQjJu4I" }] },
        { title: "22. Diagonalization and Powers of A", videos: [{ title: "Lecture 22", youtubeId: "13r9QY6cmjc" }] },
        { title: "23. Differential Equations", videos: [{ title: "Lecture 23", youtubeId: "IZqwi0wJovM" }] },
        { title: "24. Complex Matrices", videos: [{ title: "Lecture 24", youtubeId: "lGGDIGizcQ0" }] },
        { title: "25. Similar Matrices and Jordan Form", videos: [{ title: "Lecture 25", youtubeId: "UCc9q_cAhho" }] },
        { title: "26. SVD", videos: [{ title: "Lecture 26", youtubeId: "M0Sa8fLOajA" }] },
        { title: "27. SVD Applications", videos: [{ title: "Lecture 27", youtubeId: "vF7eyJ2g3kU" }] },
        { title: "28. Quiz 2 Review", videos: [{ title: "Lecture 28", youtubeId: "TSdXJw83kyA" }] },
        { title: "29. Linear Transformations", videos: [{ title: "Lecture 29", youtubeId: "TX_vooSnhm8" }] },
        { title: "30. Change of Basis", videos: [{ title: "Lecture 30", youtubeId: "Ts3o2I8_Mxc" }] },
        { title: "31. Left Inverse and Right Inverse", videos: [{ title: "Lecture 31", youtubeId: "0h43aV4aH7I" }] },
        { title: "32. Final Course Review", videos: [{ title: "Lecture 32", youtubeId: "HgC1l_6ySkc" }] },
        { title: "33. Final Exam Review", videos: [{ title: "Lecture 33", youtubeId: "Go2aLo7ZOlU" }] },
        { title: "34. Summary of Linear Algebra", videos: [{ title: "Lecture 34", youtubeId: "RWvi4Vx4CDc" }] },
    ];

    const math52MultiVideoLectures = [
        { title: "The Geometrical View of y'=f(x,y): Direction Fields, Integral Curves",                                                                                                            videos: [{ title: "Lecture 1",  youtubeId: "XDhJ8lVGbl8" }] },
        { title: "Euler's Numerical Method for y'=f(x,y) and its Generalizations",                                                                                                                 videos: [{ title: "Lecture 2",  youtubeId: "LbKKzMag5Rc" }] },
        { title: "Solving First-order Linear ODE's; Steady-state and Transient Solutions",                                                                                                         videos: [{ title: "Lecture 3",  youtubeId: "tVzaX9u6YAE" }] },
        { title: "First-order Substitution Methods: Bernouilli and Homogeneous ODE's",                                                                                                             videos: [{ title: "Lecture 4",  youtubeId: "WBJ_iXudb-s" }] },
        { title: "First-order Autonomous ODE's: Qualitative Methods, Applications",                                                                                                                videos: [{ title: "Lecture 5",  youtubeId: "te6Mplq3DCU" }] },
        { title: "Complex Numbers and Complex Exponentials",                                                                                                                                       videos: [{ title: "Lecture 6",  youtubeId: "EQJBp6Ym-6A" }] },
        { title: "First-order Linear with Constant Coefficients: Behavior of Solutions, Use of Complex Methods",                                                                                   videos: [{ title: "Lecture 7",  youtubeId: "SioXozu-Loo" }] },
        { title: "Continuation: Applications to Temperature, Mixing, RC-circuit, Decay, and Growth Models",                                                                                       videos: [{ title: "Lecture 8",  youtubeId: "MdzfsfBNJIw" }] },
        { title: "Solving Second-order Linear ODE's with Constant Coefficients: The Three Cases",                                                                                                  videos: [{ title: "Lecture 9",  youtubeId: "vP-oRQqmeg4" }] },
        { title: "Continuation: Complex Characteristic Roots; Undamped and Damped Oscillations",                                                                                                  videos: [{ title: "Lecture 10", youtubeId: "YQ7HEE8-OfA" }] },
        { title: "Theory of General Second-order Linear Homogeneous ODE's: Superposition, Uniqueness, Wronskians",                                                                                 videos: [{ title: "Lecture 11", youtubeId: "rZ3-nFV6l8w" }] },
        { title: "Continuation: General Theory for Inhomogeneous ODE's. Stability Criteria for the Constant-coefficient ODE's",                                                                   videos: [{ title: "Lecture 12", youtubeId: "eyNm7XGJr4s" }] },
        { title: "Finding Particular Solutions to Inhomogeneous ODE's: Operator and Solution Formulas Involving Exponentials",                                                                     videos: [{ title: "Lecture 13", youtubeId: "9KbpbBMThTE" }] },
        { title: "Interpretation of the Exceptional Case: Resonance",                                                                                                                             videos: [{ title: "Lecture 14", youtubeId: "Y9_zrupnz0Q" }] },
        { title: "Introduction to Fourier Series; Basic Formulas for Period 2π",                                                                                                                  videos: [{ title: "Lecture 15", youtubeId: "EWWw0jryj1A" }] },
        { title: "Continuation: More General Periods; Even and Odd Functions; Periodic Extension",                                                                                                 videos: [{ title: "Lecture 16", youtubeId: "xWa5_OXI6VM" }] },
        { title: "Finding Particular Solutions via Fourier Series; Resonant Terms; Hearing Musical Sounds",                                                                                        videos: [{ title: "Lecture 17", youtubeId: "yD0_EQLxHcw" }] },
        { title: "Engineering Applications (Guest Lecture by Prof. Miller & Vandiver)",                                                                                                            videos: [{ title: "Lecture 18", youtubeId: "pRIEYR5JHQA" }] },
        { title: "Introduction to the Laplace Transform; Basic Formulas",                                                                                                                         videos: [{ title: "Lecture 19", youtubeId: "sZ2qulI6GEk" }] },
        { title: "Derivative Formulas; Using the Laplace Transform to Solve Linear ODE's",                                                                                                        videos: [{ title: "Lecture 20", youtubeId: "qZHseRxAWZ8" }] },
        { title: "Convolution Formula: Proof, Connection with Laplace Transform, Application to Physical Problems",                                                                                videos: [{ title: "Lecture 21", youtubeId: "3ejfkMHr_DE" }] },
        { title: "Using Laplace Transform to Solve ODE's with Discontinuous Inputs",                                                                                                              videos: [{ title: "Lecture 22", youtubeId: "_YVcjNmjHik" }] },
        { title: "Use with Impulse Inputs; Dirac Delta Function, Weight and Transfer Functions",                                                                                                   videos: [{ title: "Lecture 23", youtubeId: "peYvLk_HZdw" }] },
        { title: "Introduction to First-order Systems of ODE's; Solution by Elimination, Geometric Interpretation of a System",                                                                   videos: [{ title: "Lecture 24", youtubeId: "MCrDzhpu3-s" }] },
        { title: "Homogeneous Linear Systems with Constant Coefficients: Solution via Matrix Eigenvalues (Real and Distinct Case)",                                                                videos: [{ title: "Lecture 25", youtubeId: "heBvViSi9xQ" }] },
        { title: "Continuation: Repeated Real Eigenvalues, Complex Eigenvalues",                                                                                                                  videos: [{ title: "Lecture 26", youtubeId: "hEtWqTPPXuc" }] },
        { title: "Sketching Solutions of 2x2 Homogeneous Linear System with Constant Coefficients",                                                                                               videos: [{ title: "Lecture 27", youtubeId: "e3FfmXtkppM" }] },
        { title: "Matrix Methods for Inhomogeneous Systems: Theory, Fundamental Matrix, Variation of Parameters",                                                                                  videos: [{ title: "Lecture 28", youtubeId: "2SuTN8rpe4I" }] },
        { title: "Matrix Exponentials; Application to Solving Systems",                                                                                                                           videos: [{ title: "Lecture 29", youtubeId: "zreI4HllD80" }] },
        { title: "Decoupling Linear Systems with Constant Coefficients",                                                                                                                          videos: [{ title: "Lecture 30", youtubeId: "uNOyxQwIV8o" }] },
        { title: "Non-linear Autonomous Systems: Finding the Critical Points and Sketching Trajectories; the Non-linear Pendulum",                                                                 videos: [{ title: "Lecture 31", youtubeId: "UJG0f0BSX14" }] },
        { title: "Limit Cycles: Existence and Non-existence Criteria",                                                                                                                            videos: [{ title: "Lecture 32", youtubeId: "z-meBrqcy_I" }] },
        { title: "Relation Between Non-linear Systems and First-order ODE's; Structural Stability of a System, Borderline Sketching Cases; Illustrations Using Volterra's Equation and Principle", videos: [{ title: "Lecture 33", youtubeId: "kRR9EVzr4lc" }] },
    ];

    const math53MultiVideoLectures = [
        { title: "Dot Product", videos: [{ title: "Lecture 1", youtubeId: "PxCxlsl_YwY" }] },
        { title: "Lecture 2", videos: [{ title: "Lecture 2", youtubeId: "9FLItlbBUPY" }] },
        { title: "Lecture 3", videos: [{ title: "Lecture 3", youtubeId: "bHdzkFrgRcA" }] },
        { title: "Lecture 4", videos: [{ title: "Lecture 4", youtubeId: "YBajUR3EFSM" }] },
        { title: "Lecture 5", videos: [{ title: "Lecture 5", youtubeId: "57jzPlxf4fk" }] },
        { title: "Lecture 6", videos: [{ title: "Lecture 6", youtubeId: "0D4BbCa4gHo" }] },
        { title: "Lecture 7", videos: [{ title: "Lecture 7", youtubeId: "U1EcnfTKXJ0" }] },
        { title: "Lecture 8", videos: [{ title: "Lecture 8", youtubeId: "dK3NEf13nPc" }] },
        { title: "Lecture 9", videos: [{ title: "Lecture 9", youtubeId: "UYe98CcxPbs" }] },
        { title: "Lecture 10", videos: [{ title: "Lecture 10", youtubeId: "3_goGnJm5sA" }] },
        { title: "Lecture 11", videos: [{ title: "Lecture 11", youtubeId: "7eZVshlT33Q" }] },
        { title: "Lecture 12", videos: [{ title: "Lecture 12", youtubeId: "2XraaWefBd8" }] },
        { title: "Lecture 13", videos: [{ title: "Lecture 13", youtubeId: "15HVevXRsBA" }] },
        { title: "Lecture 14", videos: [{ title: "Lecture 14", youtubeId: "23xbkrpQuAo" }] },
        { title: "Lecture 15", videos: [{ title: "Lecture 15", youtubeId: "ChiM2-MV-qM" }] },
        { title: "Lecture 16", videos: [{ title: "Lecture 16", youtubeId: "YP_B0AapU0c" }] },
        { title: "Lecture 17", videos: [{ title: "Lecture 17", youtubeId: "60e4hdCi1D4" }] },
        { title: "Lecture 18", videos: [{ title: "Lecture 18", youtubeId: "UZb9hZIAvL4" }] },
        { title: "Lecture 19", videos: [{ title: "Lecture 19", youtubeId: "xrypSZU8cBE" }] },
        { title: "Lecture 20", videos: [{ title: "Lecture 20", youtubeId: "o7UCBjGsRTE" }] },
        { title: "Lecture 21", videos: [{ title: "Lecture 21", youtubeId: "z5TPjZrsp2k" }] },
        { title: "Lecture 22", videos: [{ title: "Lecture 22", youtubeId: "tYdoS0tkAHA" }] },
        { title: "Lecture 23", videos: [{ title: "Lecture 23", youtubeId: "_CdoRiNSrqI" }] },
        { title: "Lecture 24", videos: [{ title: "Lecture 24", youtubeId: "PnPIqh7Frlw" }] },
        { title: "Lecture 25", videos: [{ title: "Lecture 25", youtubeId: "44R5HgbrUmc" }] },
        { title: "Lecture 26", videos: [{ title: "Lecture 26", youtubeId: "RMBGQtwkoyU" }] },
        { title: "Lecture 27", videos: [{ title: "Lecture 27", youtubeId: "phk05iSMezA" }] },
        { title: "Lecture 28", videos: [{ title: "Lecture 28", youtubeId: "WfEQabCGAqI" }] },
        { title: "Lecture 29", videos: [{ title: "Lecture 29", youtubeId: "wu8kXZSAp20" }] },
        { title: "Lecture 30", videos: [{ title: "Lecture 30", youtubeId: "seO7-TwXH_I" }] },
        { title: "Lecture 31", videos: [{ title: "Lecture 31", youtubeId: "tzoYhe3H5dM" }] },
        { title: "Lecture 32", videos: [{ title: "Lecture 32", youtubeId: "sr7kCpzAuYw" }] },
        { title: "Lecture 33", videos: [{ title: "Lecture 33", youtubeId: "BChhAS1sFvA" }] },
        { title: "Lecture 34", videos: [{ title: "Lecture 34", youtubeId: "ZwpwmGP5ITM" }] },
        { title: "Lecture 35", videos: [{ title: "Lecture 35", youtubeId: "24v9onS9Kcg" }] },
    ];

    const cs103MultiVideoLectures = [
        { title: "Introduction and Proofs",                          videos: [{ title: "Lecture 1",  youtubeId: "L3LMbpZIKhQ" }] },
        { title: "Induction",                                        videos: [{ title: "Lecture 2",  youtubeId: "z8HKWUWS-lA" }] },
        { title: "Strong Induction",                                 videos: [{ title: "Lecture 3",  youtubeId: "NuGDkmwEObM" }] },
        { title: "Number Theory I",                                  videos: [{ title: "Lecture 4",  youtubeId: "NuY7szYSXSw" }] },
        { title: "Number Theory II",                                 videos: [{ title: "Lecture 5",  youtubeId: "XX7ePR21Ook" }] },
        { title: "Graph Theory and Coloring",                        videos: [{ title: "Lecture 6",  youtubeId: "h9wxtqoa1jY" }] },
        { title: "Matching Problems",                                videos: [{ title: "Lecture 7",  youtubeId: "5RSMLgy06Ew" }] },
        { title: "Graph Theory II: Minimum Spanning Trees",          videos: [{ title: "Lecture 8",  youtubeId: "GJpt_3ie4WU" }] },
        { title: "Communication Networks",                           videos: [{ title: "Lecture 9",  youtubeId: "bTyxpoi2dmM" }] },
        { title: "Graph Theory III",                                 videos: [{ title: "Lecture 10", youtubeId: "DOIp5D7VMS4" }] },
        { title: "Relations, Partial Orders, and Scheduling",        videos: [{ title: "Lecture 11", youtubeId: "1nScXLQAQ9A" }] },
        { title: "Sums",                                             videos: [{ title: "Lecture 12", youtubeId: "fAeShezAGLE" }] },
        { title: "Sums and Asymptotics",                             videos: [{ title: "Lecture 13", youtubeId: "X9eErxRjQEI" }] },
        { title: "Divide and Conquer Recurrences",                   videos: [{ title: "Lecture 14", youtubeId: "Kqf0uO0oV6s" }] },
        { title: "Linear Recurrences",                               videos: [{ title: "Lecture 15", youtubeId: "TWBB-JlmYUc" }] },
        { title: "Counting Rules I",                                 videos: [{ title: "Lecture 16", youtubeId: "pNt5Ll6hGqo" }] },
        { title: "Counting Rules II",                                videos: [{ title: "Lecture 17", youtubeId: "09yIb3VHhMI" }] },
        { title: "Probability Introduction",                         videos: [{ title: "Lecture 18", youtubeId: "SmFwFdESMHI" }] },
        { title: "Conditional Probability",                          videos: [{ title: "Lecture 19", youtubeId: "E6FbvM-FGZ8" }] },
        { title: "Independence",                                     videos: [{ title: "Lecture 20", youtubeId: "l1BCv3qqW4A" }] },
        { title: "Random Variables",                                 videos: [{ title: "Lecture 21", youtubeId: "MOfhhFaQdjw" }] },
        { title: "Expectation I",                                    videos: [{ title: "Lecture 22", youtubeId: "gGlMSe7uEkA" }] },
        { title: "Expectation II",                                   videos: [{ title: "Lecture 23", youtubeId: "oI9fMUqgfxY" }] },
        { title: "Large Deviations",                                 videos: [{ title: "Lecture 24", youtubeId: "q4mwO2qS2z4" }] },
        { title: "Random Walks",                                     videos: [{ title: "Lecture 25", youtubeId: "56iFMY8QW2k" }] },
    ];

    const cs107MultiVideoLectures = [
        { title: "Course Introduction", videos: [{ title: "Lecture 1", videoId: "ucberkeley_webcast_gJJeUFyuvvg" }] },
        { title: "Intro to the C Programming Language, Part I", videos: [{ title: "Lecture 2", videoId: "ucberkeley_webcast_mZgoX-yLqxM" }] },
        { title: "Intro to the C Programming Language, Part II", videos: [{ title: "Lecture 3", videoId: "ucberkeley_webcast_DJa1tBk6gPM" }] },
        { title: "Intro to the C Programming Language, Part III", videos: [{ title: "Lecture 4", videoId: "ucberkeley_webcast_7WTass69OYM" }] },
        { title: "Intro to Assembly Language, MIPS Intro", videos: [{ title: "Lecture 5", videoId: "ucberkeley_webcast_zUYCZYKaUrk" }] },
        { title: "MIPS, MIPS Functions", videos: [{ title: "Lecture 6", videoId: "ucberkeley_webcast_DEqOkfYhDS4" }] },
        { title: "MIPS Instruction Formats", videos: [{ title: "Lecture 7", videoId: "ucberkeley_webcast_tjjWdaDiXio" }] },
        { title: "Running a Program (Compiling, Assembling, Linking, Loading)", videos: [{ title: "Lecture 8", videoId: "ucberkeley_webcast_Z4r9AWu8D18" }] },
        { title: "Synchronous Digital Systems", videos: [{ title: "Lecture 9", videoId: "ucberkeley_webcast_SstCrz0xUzw" }] },
        { title: "Finite State Machines, Functional Units", videos: [{ title: "Lecture 10", videoId: "ucberkeley_webcast__MOzj6gXrU0" }] },
        { title: "Single-Cycle CPU Datapath & Control, Part 1", videos: [{ title: "Lecture 11", videoId: "ucberkeley_webcast_OOBwKAXZjlk" }] },
        { title: "Single-Cycle CPU Datapath & Control, Part 2", videos: [{ title: "Lecture 12", videoId: "ucberkeley_webcast_ZnxKHKVvQl4" }] },
        { title: "Pipelining", videos: [{ title: "Lecture 13", videoId: "ucberkeley_webcast_oIawE3IseRA" }] },
        { title: "Caches Part 1", videos: [{ title: "Lecture 14", videoId: "ucberkeley_webcast_XeOftiVV49o" }] },
        { title: "Caches Part 2", videos: [{ title: "Lecture 15", videoId: "ucberkeley_webcast_ERtmeRRES5U" }] },
        { title: "Caches Part 3", videos: [{ title: "Lecture 16", videoId: "ucberkeley_webcast_N4bfyyVEPRc" }] },
        { title: "Performance and Floating Point Arithmetic", videos: [{ title: "Lecture 17", videoId: "ucberkeley_webcast_z8rFDWFDj8c" }] },
        { title: "Amdahl's Law and Data-Level Parallelism", videos: [{ title: "Lecture 18", videoId: "ucberkeley_webcast_xNJyfcv7YsQ" }] },
        { title: "Thread Level Parallelism (TLP) and OpenMP Intro", videos: [{ title: "Lecture 19", videoId: "ucberkeley_webcast_OrrIbXqfu4U" }] },
        { title: "Thread Level Parallelism (TLP) and OpenMP", videos: [{ title: "Lecture 20", videoId: "ucberkeley_webcast_1o6078uavdo" }] },
        { title: "Warehouse-Scale Computing, MapReduce, and Spark", videos: [{ title: "Lecture 21", videoId: "ucberkeley_webcast_BDdvnVOWkSE" }] },
        { title: "Operating Systems, Interrupts, Virtual Memory Intro", videos: [{ title: "Lecture 22", videoId: "ucberkeley_webcast_9X3Tioo3deA" }] },
        { title: "Virtual Memory, Intro to I/O", videos: [{ title: "Lecture 23", videoId: "ucberkeley_webcast__bW31WWiQbo" }] },
        { title: "More I/O: DMA, Disks, Networking", videos: [{ title: "Lecture 24", videoId: "ucberkeley_webcast_QhFnRQ2pJyw" }] },
        { title: "Dependability and RAID", videos: [{ title: "Lecture 25", videoId: "ucberkeley_webcast_2hAJwG9G9PE" }] },
        { title: "Course Summary", videos: [{ title: "Lecture 26", videoId: "ucberkeley_webcast_kpjywuTwpMc" }] },
    ];

    const cs110MultiVideoLectures = [
        { title: "Course Introduction", videos: [{ title: "Lecture 1", youtubeId: "_LFGjZ0Sc6I" }] },
        { title: "File Systems - Fundamentals", videos: [{ title: "Lecture 2", youtubeId: "Dbg2N7T6D_c" }] },
        { title: "Unix v6 Filesystem Architecture", videos: [{ title: "Lecture 3", youtubeId: "vUyKpzg6vYk" }] },
        { title: "Filesystem Data Structures, System Calls, Intro to Multiprocessing", videos: [{ title: "Lecture 4", youtubeId: "DSPc5LIVWHw" }] },
        { title: "execvp System Call - Introduction", videos: [{ title: "Lecture 5", youtubeId: "RDk_CY0HT_E" }] },
        { title: "execvp, pipe, dup2, and Signals", videos: [{ title: "Lecture 6", youtubeId: "Yf380zTr_ro" }] },
        { title: "Signals - Deep Dive", videos: [{ title: "Lecture 7", youtubeId: "d9Pou4L7j0s" }] },
        { title: "Race Conditions, Deadlock, and Data Integrity", videos: [{ title: "Lecture 8", youtubeId: "YE4MW01u7mg" }] },
        { title: "Introduction to Threads", videos: [{ title: "Lecture 9", youtubeId: "bw68rvYNG8k" }] },
        { title: "From C Threads to C++ Threads", videos: [{ title: "Lecture 10", youtubeId: "lyODXaZ2Zg8" }] },
        { title: "Multithreading, Condition Variables, and Semaphores", videos: [{ title: "Lecture 11", youtubeId: "7U3Eo0ynmHo" }] },
        { title: "Review: mutex, condition_variable_any, semaphore", videos: [{ title: "Lecture 12", youtubeId: "l4PrC3mCPJY" }] },
        { title: "Ice Cream Shop Simulation - Concurrency Patterns", videos: [{ title: "Lecture 13", youtubeId: "rA4iG8eYzi4" }] },
        { title: "Introduction to Networking", videos: [{ title: "Lecture 14", youtubeId: "oLvSC6TCqdI" }] },
        { title: "Networks and Clients - Socket Programming", videos: [{ title: "Lecture 15", youtubeId: "akQOgmL2a-8" }] },
        { title: "Network System Calls", videos: [{ title: "Lecture 16", youtubeId: "eTKrkFAg6WI" }] },
        { title: "Web Proxy Implementation", videos: [{ title: "Lecture 17", youtubeId: "wqI_BRyB2tM" }] },
        { title: "MapReduce - Distributed Computing Fundamentals", videos: [{ title: "Lecture 18", youtubeId: "y-MDGT5-OAY" }] },
        { title: "Principles of System Design", videos: [{ title: "Lecture 19", youtubeId: "L3w6NE3_sCA" }] },
        { title: "Course Wrap-up and Advanced Topics", videos: [{ title: "Lecture 20", youtubeId: "y5xvYX0m61E" }] },
    ];

    const cs294MultiVideoLectures = [
        { title: "August 23, 2017", videos: [{ title: "Lecture 1", youtubeId: "Q4kF8sfggoI" }] },
        { title: "August 28, 2017", videos: [{ title: "Lecture 2", youtubeId: "C_LGsoe36I8" }] },
        { title: "August 30, 2017", videos: [{ title: "Lecture 3", youtubeId: "PTbxa6GsTWc" }] },
        { title: "September 6, 2017", videos: [{ title: "Lecture 4", youtubeId: "tWNpiNzWuO8" }] },
        { title: "September 11, 2017", videos: [{ title: "Lecture 5", youtubeId: "PpVhtJn-iZI" }] },
        { title: "September 13, 2017", videos: [{ title: "Lecture 6", youtubeId: "k1vNh4rNYec" }] },
        { title: "September 18, 2017", videos: [{ title: "Lecture 7", youtubeId: "nZXC5OdDfs4" }] },
        { title: "September 20, 2017", videos: [{ title: "Lecture 8", youtubeId: "EfgC7v5V608" }] },
        { title: "September 25, 2017", videos: [{ title: "Lecture 9", youtubeId: "yap_g0d7iBQ" }] },
        { title: "September 27, 2017", videos: [{ title: "Lecture 10", youtubeId: "AwdauFLan7M" }] },
        { title: "October 2, 2017", videos: [{ title: "Lecture 11", youtubeId: "vRkIwM4GktE" }] },
        { title: "October 4, 2017", videos: [{ title: "Lecture 12", youtubeId: "iOYiPhu5GEk" }] },
        { title: "October 9, 2017", videos: [{ title: "Lecture 13", youtubeId: "-3BcZwgmZLk" }] },
        { title: "October 11, 2017", videos: [{ title: "Lecture 14", youtubeId: "ycCtmp4hcUs" }] },
        { title: "October 16, 2017", videos: [{ title: "Lecture 15", youtubeId: "npi6B4VQ-7s" }] },
        { title: "October 18, 2017", videos: [{ title: "Lecture 16", youtubeId: "0WbVUvKJpg4" }] },
        { title: "October 23, 2017", videos: [{ title: "Lecture 17", youtubeId: "UqSx23W9RYE" }] },
        { title: "October 25, 2017", videos: [{ title: "Lecture 18", youtubeId: "Xe9bktyYB34" }] },
        { title: "October 30, 2017", videos: [{ title: "Lecture 19", youtubeId: "mc-DtbhhiKA" }] },
        { title: "November 1, 2017", videos: [{ title: "Lecture 20", youtubeId: "j9QI21xtqV4" }] },
        { title: "November 6, 2017", videos: [{ title: "Lecture 21", youtubeId: "QJpc_T65QRY" }] },
        { title: "November 8, 2017", videos: [{ title: "Lecture 22", youtubeId: "CHKSBEx_k54" }] },
        { title: "November 15, 2017", videos: [{ title: "Lecture 23", youtubeId: "ixtEeS6aCKU" }] },
        { title: "November 20, 2017", videos: [{ title: "Lecture 24", youtubeId: "gqX8J38tESw" }] },
    ];

    const cs161PlaylistA_BlackboardLectures = [
        {
            title: "Introduction & Asymptotic Analysis",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 1 - Introduction", youtubeId: "yRM3sc57q0c" },
                { title: "Lecture 2 - Big-O Notation", youtubeId: "QfRSeibcugw" },
                { title: "Lecture 3 - Asymptotic Analysis Examples", youtubeId: "5rZCkblZFZM" },
            ],
        },
        {
            title: "Divide and Conquer",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 4 - MergeSort: Motivation and Example", youtubeId: "kiyRJ7GVWro" },
                { title: "Lecture 5 - MergeSort: Pseudocode", youtubeId: "rBd5w0rQaFo" },
                { title: "Lecture 6 - MergeSort: Analysis", youtubeId: "8ArtRiTkYEw" },
                { title: "Lecture 7 - Karatsuba Multiplication", youtubeId: "JCbZayFr9RE" },
            ],
        },
        {
            title: "Master Method & Recurrences",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 8 - Master Method: Motivation", youtubeId: "6dGDcszz2DM" },
                { title: "Lecture 9 - Master Method: Formal Statement", youtubeId: "rXiojCN9nIs" },
                { title: "Lecture 10 - Master Method: Six Examples", youtubeId: "4l1MvY7iGhs" },
                { title: "Lecture 11 - Proof of the Master Method", youtubeId: "6BVNhKm0vpE" },
            ],
        },
        {
            title: "Sorting & QuickSort",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 12 - QuickSort: Overview", youtubeId: "ETo1cpLN7kk" },
                { title: "Lecture 13 - Partitioning Around a Pivot", youtubeId: "LYzdRN5iFdA" },
                { title: "Lecture 14 - Choosing a Good Pivot", youtubeId: "kqO46FOUTbI" },
                { title: "Lecture 15 - QuickSort Analysis", youtubeId: "sToWtKSYlMw" },
                { title: "Lecture 16 - Sorting Lower Bound", youtubeId: "aFveIyII5D4" },
            ],
        },
        {
            title: "Randomized Algorithms & Linear-Time Selection",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 17 - Randomized Linear-Time Selection", youtubeId: "nFw6x7DoYbs" },
                { title: "Lecture 18 - Randomized Selection: Analysis", youtubeId: "rX2u2CnpveQ" },
                { title: "Lecture 19 - Deterministic Linear-Time Selection", youtubeId: "L5-4cPW5HoU" },
                { title: "Lecture 20 - Deterministic Selection: Analysis", youtubeId: "6ntwpZmHN-g" },
            ],
        },
        {
            title: "Graphs & Graph Search",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 21 - Graphs: The Basics", youtubeId: "4Ih3UhVuEtw" },
                { title: "Lecture 22 - Graph Representations", youtubeId: "b-Mfu8dPv9U" },
                { title: "Lecture 23 - Graph Search Overview", youtubeId: "SW6jwg7WS48" },
                { title: "Lecture 24 - Breadth-First Search", youtubeId: "73qCvXsYkfk" },
                { title: "Lecture 25 - Depth-First Search", youtubeId: "_9_VUNrWGUs" },
                { title: "Lecture 26 - Topological Sort", youtubeId: "ozso3xxkVGU" },
            ],
        },
        {
            title: "Strongly Connected Components",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 27 - Computing SCCs (Part 1)", youtubeId: "O98hLTYVN3c" },
                { title: "Lecture 28 - Computing SCCs (Part 2)", youtubeId: "gbs3UNRJIYk" },
                { title: "Lecture 29 - Structure of the Web", youtubeId: "7YodysGShlo" },
            ],
        },
        {
            title: "Shortest Paths & Dijkstra's Algorithm",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 30 - Shortest Paths & Dijkstra's Algorithm", youtubeId: "jRlNVmRjdRk" },
                { title: "Lecture 31 - Dijkstra's Algorithm: Examples", youtubeId: "ahYhIzLklYo" },
                { title: "Lecture 32 - Correctness of Dijkstra's Algorithm", youtubeId: "sb7j3EW055M" },
                { title: "Lecture 33 - Implementation with Heaps", youtubeId: "00LtSn_PQjc" },
            ],
        },
        {
            title: "Data Structures: Heaps, BSTs & Hash Tables",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 34 - Heaps: Operations and Applications", youtubeId: "mNYHDv7SbDI" },
                { title: "Lecture 35 - Heaps: Implementation Details", youtubeId: "6VI5kJu8Mv4" },
                { title: "Lecture 36 - Balanced Search Trees", youtubeId: "IbNZ-x1I2IM" },
                { title: "Lecture 37 - Rotations", youtubeId: "CZkBqasoH8c" },
                { title: "Lecture 38 - Hash Tables: Operations & Applications", youtubeId: "Qu183GFHbZQ" },
                { title: "Lecture 39 - Hash Tables: Implementation", youtubeId: "j5KkC-wjlK4" },
                { title: "Lecture 40 - Bloom Filters", youtubeId: "zYlxP7F3Z3c" },
            ],
        },
        {
            title: "Greedy Algorithms & Minimum Spanning Trees",
            source: "Stanford Blackboard Lectures",
            videos: [
                { title: "Lecture 41 - Introduction to Greedy Algorithms", youtubeId: "NTFmxA3qgoo" },
                { title: "Lecture 42 - Minimum Spanning Trees: Problem Definition", youtubeId: "tDj9BkaQDO8" },
                { title: "Lecture 43 - Prim's MST Algorithm", youtubeId: "jsvOPssDVJA" },
                { title: "Lecture 44 - Kruskal's MST Algorithm", youtubeId: "SZuCspj5AJc" },
                { title: "Lecture 45 - Huffman Codes", youtubeId: "NM6FZB7IfS8" },
                { title: "Lecture 46 - Single-Link Clustering", youtubeId: "MSSzOs1X4K8" },
            ],
        },
    ];

    const cs109MultiVideoLectures = [
        { title: "Counting", videos: [{ title: "Lecture 1", youtubeId: "2MuDZIAzBMY" }] },
        { title: "Combinatorics", videos: [{ title: "Lecture 2", youtubeId: "ag4Ei15CG0c" }] },
        { title: "What is Probability?", videos: [{ title: "Lecture 3", youtubeId: "EGgMCE2AgyU" }] },
        { title: "Conditional Probability and Bayes", videos: [{ title: "Lecture 4", youtubeId: "NHRoXvPaZqY" }] },
        { title: "Independence", videos: [{ title: "Lecture 5", youtubeId: "zTJDZ2wmaRU" }] },
        { title: "Random Variables and Expectation", videos: [{ title: "Lecture 6", youtubeId: "8QCg2ur-3fo" }] },
        { title: "Variance, Bernoulli, Binomial", videos: [{ title: "Lecture 7", youtubeId: "I2UBspTNAG0" }] },
        { title: "Poisson", videos: [{ title: "Lecture 8", youtubeId: "QV3IRiG6dVs" }] },
        { title: "Continuous Random Variables", videos: [{ title: "Lecture 9", youtubeId: "OFgBn4rQkqc" }] },
        { title: "Normal Distribution", videos: [{ title: "Lecture 10", youtubeId: "rpB_NNXiWlM" }] },
        { title: "Joint Distributions", videos: [{ title: "Lecture 11", youtubeId: "8Il2M7kbQSc" }] },
        { title: "Inference I", videos: [{ title: "Lecture 12", youtubeId: "d0ImA7m4BEg" }] },
        { title: "Inference II", videos: [{ title: "Lecture 13", youtubeId: "d0ImA7m4BEg" }] },
        { title: "Modelling", videos: [{ title: "Lecture 14", youtubeId: "q9lk8l8P-E4" }] },
        { title: "General Inference", videos: [{ title: "Lecture 15", youtubeId: "c0QGjtu9GZg" }] },
        { title: "Beta", videos: [{ title: "Lecture 16", youtubeId: "aOhk9mFrHdU" }] },
        { title: "Adding Random Variables", videos: [{ title: "Lecture 17", youtubeId: "UEyHbI9FRtM" }] },
        { title: "Central Limit Theorem", videos: [{ title: "Lecture 18", youtubeId: "6Q9wT6JGMMM" }] },
        { title: "Bootstrapping and P-Values", videos: [{ title: "Lecture 19", youtubeId: "NXJwyPT1vsc" }] },
        { title: "Algorithmic Analysis", videos: [{ title: "Lecture 20", youtubeId: "Ht9yUPtppwY" }] },
        { title: "M.L.E.", videos: [{ title: "Lecture 21", youtubeId: "utFEufMXHgw" }] },
        { title: "M.A.P.", videos: [{ title: "Lecture 22", youtubeId: "sL1zOr-P4xc" }] },
        { title: "Naive Bayes", videos: [{ title: "Lecture 23", youtubeId: "yqF3DvDVpvw" }] },
        { title: "Logistic Regression", videos: [{ title: "Lecture 24", youtubeId: "ILqZWvDWKEc" }] },
        { title: "Deep Learning", videos: [{ title: "Lecture 25", youtubeId: "MSfI6TTgyl4" }] },
        { title: "Fairness", videos: [{ title: "Lecture 26", youtubeId: "cbzwbr5H_LA" }] },
        { title: "Advanced Probability", videos: [{ title: "Lecture 27", youtubeId: "BquE8Z9htws" }] },
        { title: "Future of Probability", videos: [{ title: "Lecture 28", youtubeId: "SoXygq5LtiM" }] },
        { title: "Counting (Review)", videos: [{ title: "Lecture 29", youtubeId: "yyKSsjRt42o" }] },
    ];

    const phys41MultiVideoLectures = [
        { title: "Lecture 1", videos: [{ title: "Lecture 1", youtubeId: "5ucfHd8FWKw" }] },
        { title: "Lecture 2", videos: [{ title: "Lecture 2", youtubeId: "i4u7SZjoAs4" }] },
        { title: "Lecture 3", videos: [{ title: "Lecture 3", youtubeId: "ErlP_SBcA1s" }] },
        { title: "Lecture 4", videos: [{ title: "Lecture 4", youtubeId: "xZn4l1TSvPQ" }] },
        { title: "Lecture 5", videos: [{ title: "Lecture 5", youtubeId: "Q3v_2znHCvg" }] },
        { title: "Lecture 6", videos: [{ title: "Lecture 6", youtubeId: "5zXYEVWSIsg" }] },
        { title: "Lecture 7", videos: [{ title: "Lecture 7", youtubeId: "yLb_a1EE888" }] },
        { title: "Lecture 8", videos: [{ title: "Lecture 8", youtubeId: "89SjJv30kGU" }] },
        { title: "Lecture 9", videos: [{ title: "Lecture 9", youtubeId: "NiCMMn12CIs" }] },
        { title: "Lecture 10", videos: [{ title: "Lecture 10", youtubeId: "IV9NhNIrrDw" }] },
        { title: "Lecture 11", videos: [{ title: "Lecture 11", youtubeId: "RBaBEjzMr4E" }] },
        { title: "Lecture 12", videos: [{ title: "Lecture 12", youtubeId: "sffRo1-_D8E" }] },
        { title: "Lecture 13", videos: [{ title: "Lecture 13", youtubeId: "7WDiK3flILc" }] },
        { title: "Lecture 14", videos: [{ title: "Lecture 14", youtubeId: "dlJtUvRaGdE" }] },
        { title: "Lecture 15", videos: [{ title: "Lecture 15", youtubeId: "uo86ir31pn0" }] },
        { title: "Lecture 16", videos: [{ title: "Lecture 16", youtubeId: "emrHcqEvXpw" }] },
        { title: "Lecture 17", videos: [{ title: "Lecture 17", youtubeId: "_0PrwAbgoMA" }] },
        { title: "Lecture 18", videos: [{ title: "Lecture 18", youtubeId: "tniGFmPQc0E" }] },
        { title: "Lecture 19", videos: [{ title: "Lecture 19", youtubeId: "gEX7MjWwocE" }] },
        { title: "Lecture 20", videos: [{ title: "Lecture 20", youtubeId: "bX4liSWB4Gk" }] },
        { title: "Lecture 21", videos: [{ title: "Lecture 21", youtubeId: "vkWY73HnNYA" }] },
        { title: "Lecture 22", videos: [{ title: "Lecture 22", youtubeId: "0mGd0JUmgm8" }] },
        { title: "Lecture 23", videos: [{ title: "Lecture 23", youtubeId: "FNOfxJxceIM" }] },
        { title: "Lecture 24", videos: [{ title: "Lecture 24", youtubeId: "9NS0JcjNdp4" }] },
        { title: "Lecture 25", videos: [{ title: "Lecture 25", youtubeId: "30Ww1HsRblM" }] },
        { title: "Lecture 26", videos: [{ title: "Lecture 26", youtubeId: "n1cXiw3s72k" }] },
        { title: "Lecture 27", videos: [{ title: "Lecture 27", youtubeId: "1GvCIlHihEA" }] },
        { title: "Lecture 28", videos: [{ title: "Lecture 28", youtubeId: "Vg8t8_IOHDg" }] },
        { title: "Lecture 29", videos: [{ title: "Lecture 29", youtubeId: "ol1COj0LACs" }] },
        { title: "Lecture 30", videos: [{ title: "Lecture 30", youtubeId: "D2lW7o32fzk" }] },
        { title: "Lecture 31", videos: [{ title: "Lecture 31", youtubeId: "sN-m5WkbMyI" }] },
        { title: "Lecture 32", videos: [{ title: "Lecture 32", youtubeId: "YGR5_Hf9dDg" }] },
        { title: "Lecture 33", videos: [{ title: "Lecture 33", youtubeId: "dvWKCH0ocu8" }] },
        { title: "Lecture 34", videos: [{ title: "Lecture 34", youtubeId: "7Kq8BINVDiw" }] },
        { title: "Lecture 35", videos: [{ title: "Lecture 35", youtubeId: "bHocXJ4rv5g" }] },
        { title: "Lecture 36", videos: [{ title: "Lecture 36", youtubeId: "0qEIs6ie2q8" }] },
        { title: "Lecture 37", videos: [{ title: "Lecture 37", youtubeId: "efpiHD_2O8E" }] },
        { title: "Lecture 38", videos: [{ title: "Lecture 38", youtubeId: "2TZa151GC-0" }] },
        { title: "Lecture 39", videos: [{ title: "Lecture 39", youtubeId: "fLuyZ7ayDog" }] },
        { title: "Lecture 40", videos: [{ title: "Lecture 40", youtubeId: "Lpd_TddOSZY" }] },
        { title: "Lecture 41", videos: [{ title: "Lecture 41", youtubeId: "EX0uHJbIw68" }] },
        { title: "Lecture 42", videos: [{ title: "Lecture 42", youtubeId: "nCDOa63Jd6M" }] },
        { title: "Lecture 43", videos: [{ title: "Lecture 43", youtubeId: "z5JfWSocZUQ" }] },
        { title: "Lecture 44", videos: [{ title: "Lecture 44", youtubeId: "EHCACV8rdig" }] },
        { title: "Lecture 45", videos: [{ title: "Lecture 45", youtubeId: "MoRip5VVdkI" }] },
        { title: "Lecture 46", videos: [{ title: "Lecture 46", youtubeId: "YLDRzy8Dcgo" }] },
        { title: "Lecture 47", videos: [{ title: "Lecture 47", youtubeId: "6-7BOpZ2k04" }] },
        { title: "Lecture 48", videos: [{ title: "Lecture 48", youtubeId: "-M8swpL-Ij8" }] },
        { title: "Lecture 49", videos: [{ title: "Lecture 49", youtubeId: "efH7pq9YVQw" }] },
        { title: "Lecture 50", videos: [{ title: "Lecture 50", youtubeId: "0QF_uCgZW4Y" }] },
        { title: "Lecture 51", videos: [{ title: "Lecture 51", youtubeId: "X9K8LT7SCZ0" }] },
        { title: "Lecture 52", videos: [{ title: "Lecture 52", youtubeId: "O_M8asN10oQ" }] },
        { title: "Lecture 53", videos: [{ title: "Lecture 53", youtubeId: "IWD-Aue6aIk" }] },
        { title: "Lecture 54", videos: [{ title: "Lecture 54", youtubeId: "6h3T3qIkxqw" }] },
        { title: "Lecture 55", videos: [{ title: "Lecture 55", youtubeId: "Idx3VgOpUDk" }] },
        { title: "Lecture 56", videos: [{ title: "Lecture 56", youtubeId: "mHVnpuhfpvI" }] },
        { title: "Lecture 57", videos: [{ title: "Lecture 57", youtubeId: "DSk8HTcB7x0" }] },
        { title: "Lecture 58", videos: [{ title: "Lecture 58", youtubeId: "EhgF2OViDDs" }] },
        { title: "Lecture 59", videos: [{ title: "Lecture 59", youtubeId: "oILq3xz_XtU" }] },
        { title: "Lecture 60", videos: [{ title: "Lecture 60", youtubeId: "hxa6jAYA980" }] },
        { title: "Lecture 61", videos: [{ title: "Lecture 61", youtubeId: "ZMa-xKcM2L8" }] },
        { title: "Lecture 62", videos: [{ title: "Lecture 62", youtubeId: "ThP6wQkf5ec" }] },
    ];

    const phys43MultiVideoLectures = [
        { title: "Introduction", videos: [{ title: "Introduction", youtubeId: "rtlJoXxlSFE" }] },
        { title: "Electric Charges and Forces - Coulomb's Law - Polarization", videos: [{ title: "Lecture 1", youtubeId: "x1-SibwIPM4" }] },
        { title: "Electric Field Lines, Superposition, Inductive Charging, Dipoles", videos: [{ title: "Lecture 2", youtubeId: "Pd9HY8iLiCA" }] },
        { title: "Electric Flux, Gauss' Law, Examples", videos: [{ title: "Lecture 3", youtubeId: "Zu2gomaDqnM" }] },
        { title: "Electrostatic Potential, Electric Energy, Equipotential Surfaces", videos: [{ title: "Lecture 4", youtubeId: "QpVxj3XrLgk" }] },
        { title: "E = -grad V, Conductors, Electrostatic Shielding (Faraday Cage)", videos: [{ title: "Lecture 5", youtubeId: "JhV-GOS4y8g" }] },
        { title: "High-voltage Breakdown, Lightning, Sparks, St. Elmo's Fire", videos: [{ title: "Lecture 6", youtubeId: "ww0XJUqFHXU" }] },
        { title: "Capacitance, Electric Field Energy", videos: [{ title: "Lecture 7", youtubeId: "qyP1xZCB62E" }] },
        { title: "Polarization, Dielectrics, Van de Graaff Generator, Capacitors", videos: [{ title: "Lecture 8", youtubeId: "GAtAG938AQc" }] },
        { title: "Electric Currents, Resistivity, Conductivity, Ohm's Law", videos: [{ title: "Lecture 9", youtubeId: "PJqOaHBgr30" }] },
        { title: "Batteries, Power, Kirchhoff's Rules, Circuits, Kelvin Water Dropper", videos: [{ title: "Lecture 10", youtubeId: "ViwSDL657L4" }] },
        { title: "Magnetic Fields, Lorentz Force, Torques, Electric Motors (DC)", videos: [{ title: "Lecture 11", youtubeId: "0y9x7CS5Vrk" }] },
        { title: "First Exam Review", videos: [{ title: "Lecture 12", youtubeId: "08WJDvgr2Zc" }] },
        { title: "Moving Charges in B-fields, Cyclotrons, Mass Spectrometers, LHC", videos: [{ title: "Lecture 13", youtubeId: "sDnG1JhZ2N4" }] },
        { title: "Biot-Savart, div B = 0, High-voltage Power Lines, Leyden Jar", videos: [{ title: "Lecture 14", youtubeId: "By2ogrSwgVo" }] },
        { title: "Ampere's Law, Solenoids, Kelvin Water Dropper (revisited)", videos: [{ title: "Lecture 15", youtubeId: "MXuZ1SRjpqk" }] },
        { title: "Electromagnetic Induction, Faraday's Law, Lenz Law, SUPER DEMO", videos: [{ title: "Lecture 16", youtubeId: "nGQbA2jwkWI" }] },
        { title: "Motional EMF, Dynamos, Eddy Currents, Magnetic Breaking", videos: [{ title: "Lecture 17", youtubeId: "MzAPu_p2wI4" }] },
        { title: "Displacement Current, Synchronous Motors, Explanation Secret Top", videos: [{ title: "Lecture 18", youtubeId: "3sP9kh4xtKo" }] },
        { title: "Magnetic Levitation, Human Heart, Superconductivity, Aurora Borealis", videos: [{ title: "Lecture 19", youtubeId: "rLZLa-fyt1w" }] },
        { title: "Inductance, RL Circuits, Magnetic Field Energy", videos: [{ title: "Lecture 20", youtubeId: "t2micky_3uI" }] },
        { title: "Magnetic Materials, Dia- Para- & Ferromagnetism", videos: [{ title: "Lecture 21", youtubeId: "1xFRtdN5IJA" }] },
        { title: "Maxwell's Equations - 600 Daffodil Ceremony", videos: [{ title: "Lecture 22", youtubeId: "ckUyN5XNG0Y" }] },
        { title: "Second Exam Review", videos: [{ title: "Lecture 23", youtubeId: "KrXbnIohemY" }] },
        { title: "Transformers, Car Coils, RC Circuits", videos: [{ title: "Lecture 24", youtubeId: "6w3SzI_s5Sg" }] },
        { title: "Driven LRC Circuits, Metal Detectors", videos: [{ title: "Lecture 25", youtubeId: "FWMhk6x785Q" }] },
        { title: "Traveling Waves, Standing Waves, Musical Instruments", videos: [{ title: "Lecture 26", youtubeId: "D_RIzl1uCxY" }] },
        { title: "Destructive Resonance, Electromagnetic Waves, Speed of Light", videos: [{ title: "Lecture 27", youtubeId: "D3tnZzhSISo" }] },
        { title: "Poynting Vector, Oscillating Charges, Polarization, Radiation Pressure", videos: [{ title: "Lecture 28", youtubeId: "6lb040GCs2M" }] },
        { title: "Snell's Law, Index of Refraction, Huygen's Principle, Color", videos: [{ title: "Lecture 29", youtubeId: "irpjwXpa4xU" }] },
        { title: "Polarizers, Malus' Law, Light Scattering, Blue Skies, Red Sunsets", videos: [{ title: "Lecture 30", youtubeId: "ESAPg7w3wm8" }] },
        { title: "Rainbows, Fog Bows, Haloes, Glories, Sun Dogs", videos: [{ title: "Lecture 31", youtubeId: "pj0wXRLXai8" }] },
        { title: "Third Exam Review", videos: [{ title: "Lecture 32", youtubeId: "94dV7ucEEkY" }] },
        { title: "Double-slit Interference, Interferometers", videos: [{ title: "Lecture 33", youtubeId: "1rYF72PXVks" }] },
        { title: "Diffraction, Gratings, Resolving Power, Angular Resolution", videos: [{ title: "Lecture 34", youtubeId: "sKO8n_-xtDc" }] },
        { title: "Doppler Effect, Big Bang, Cosmology", videos: [{ title: "Lecture 35", youtubeId: "tDC2UDhRGkA" }] },
        { title: "Farewell Special - My Early Days in Astrophysics, Huge Balloons", videos: [{ title: "Lecture 36", youtubeId: "lFTUtK6xBCU" }] },
        { title: "Kirchhoff's Loop Rule Is For The Birds", videos: [{ title: "Bonus", youtubeId: "LzT_YZ0xCFY" }] },
    ];

    const bioMultiVideoLectures = [
        { title: "Introduction", videos: [{ title: "Lecture 1", youtubeId: "lm8ywGl9AIQ" }] },
        { title: "Biochemistry I", videos: [{ title: "Lecture 2", youtubeId: "RJf9jRf-Ekw" }] },
        { title: "Biochemistry II", videos: [{ title: "Lecture 3", youtubeId: "3zJI3dYB7gc" }] },
        { title: "Biochemistry III", videos: [{ title: "Lecture 4", youtubeId: "6BPDK1b3jDg" }] },
        { title: "Biochemistry IV", videos: [{ title: "Lecture 5", youtubeId: "7aNYj3zyVkc" }] },
        { title: "Biochemistry V", videos: [{ title: "Lecture 6", youtubeId: "SGHx6jKvxr8" }] },
        { title: "Biochemistry VI", videos: [{ title: "Lecture 7", youtubeId: "R3DI6W9iKtU" }] },
        { title: "Biochemistry VI (cont.) - DNA as Genetic Material", videos: [{ title: "Lecture 8", youtubeId: "7ZlzvS7YoSM" }] },
        { title: "Molecular Biology I", videos: [{ title: "Lecture 9", youtubeId: "mJhgkUWLtX8" }] },
        { title: "Molecular Biology II - Process of Science", videos: [{ title: "Lecture 10", youtubeId: "Ncszdp4YQDY" }] },
        { title: "Molecular Biology III", videos: [{ title: "Lecture 11", youtubeId: "Uf7qNWklQkE" }] },
        { title: "Molecular Biology IV", videos: [{ title: "Lecture 12", youtubeId: "40Sum5KfG1Q" }] },
        { title: "Molecular Biology IV (cont.) - Gene Regulation I", videos: [{ title: "Lecture 13", youtubeId: "BhS5s1T1as8" }] },
        { title: "Gene Regulation II", videos: [{ title: "Lecture 14", youtubeId: "vES9nISxtjk" }] },
        { title: "Bacterial Genetics", videos: [{ title: "Lecture 15", youtubeId: "uQRTFmC5_GA" }] },
        { title: "The Biosphere", videos: [{ title: "Lecture 16", youtubeId: "gaHQ_1Sp5_s" }] },
        { title: "Carbon and Energy Metabolism", videos: [{ title: "Lecture 17", youtubeId: "5WqgNOSoD_M" }] },
        { title: "Productivity and Food Webs", videos: [{ title: "Lecture 18", youtubeId: "hWdAt9SzP0I" }] },
        { title: "Regulation of Productivity", videos: [{ title: "Lecture 19", youtubeId: "4owydSnRHuE" }] },
        { title: "Limiting Factors and Biogeochemical Cycles", videos: [{ title: "Lecture 20", youtubeId: "zIXGgyOwtUk" }] },
        { title: "Mendelian Genetics", videos: [{ title: "Lecture 21", youtubeId: "eiDX9dw866E" }] },
        { title: "Mitosis and Meiosis", videos: [{ title: "Lecture 22", youtubeId: "g6VEnimixRk" }] },
        { title: "Diploid Genetics", videos: [{ title: "Lecture 23", youtubeId: "fQKMD2iFe5w" }] },
        { title: "Recombinant DNA I", videos: [{ title: "Lecture 24", youtubeId: "l5x9qAVUK7s" }] },
        { title: "Recombinant DNA II", videos: [{ title: "Lecture 25", youtubeId: "EO9SMD6fIsI" }] },
        { title: "Recombinant DNA III", videos: [{ title: "Lecture 26", youtubeId: "5W4EnYzNRdA" }] },
        { title: "Recombinant DNA III (cont.) - Immunology I", videos: [{ title: "Lecture 27", youtubeId: "kAN_eTW_ig0" }] },
        { title: "Immunology II", videos: [{ title: "Lecture 28", youtubeId: "Y8eEMYqkwz0" }] },
        { title: "Population Growth I", videos: [{ title: "Lecture 29", youtubeId: "Yr-cZg9eqp4" }] },
        { title: "Population Growth II", videos: [{ title: "Lecture 30", youtubeId: "rKquepVheyM" }] },
        { title: "Population Genetics and Evolution", videos: [{ title: "Lecture 31", youtubeId: "LBR4pEC7kwU" }] },
        { title: "Molecular Evolution", videos: [{ title: "Lecture 32", youtubeId: "ONYokXoy04Q" }] },
        { title: "Communities I", videos: [{ title: "Lecture 33", youtubeId: "GAArnLLlFtQ" }] },
        { title: "Communities II", videos: [{ title: "Lecture 34", youtubeId: "5_QWoGFUPaI" }] },
    ];

    const chemMultiVideoLectures = [
        { title: "The Importance of Chemical Principles", videos: [{ title: "Lecture 1", youtubeId: "YkYeYhXUeEE" }] },
        { title: "Atomic Structure", videos: [{ title: "Lecture 2", youtubeId: "ustfXi-mpkI" }] },
        { title: "Wave-Particle Duality of Light", videos: [{ title: "Lecture 3", youtubeId: "_U6YamvF7BE" }] },
        { title: "Wave-Particle Duality of Matter; Schrödinger Equation", videos: [{ title: "Lecture 4", youtubeId: "Qg7pQ_CYaIQ" }] },
        { title: "Hydrogen Atom Energy Levels", videos: [{ title: "Lecture 5", youtubeId: "kO0VmaLkgj8" }] },
        { title: "Hydrogen Atom Wavefunctions (Orbitals)", videos: [{ title: "Lecture 6", youtubeId: "V-RPM3e8Ws0" }] },
        { title: "Multielectron Atoms", videos: [{ title: "Lecture 7", youtubeId: "-jJz5OMmuP0" }] },
        { title: "The Periodic Table and Periodic Trends", videos: [{ title: "Lecture 8", youtubeId: "LWmVdG0uj2g" }] },
        { title: "Periodic Table; Ionic and Covalent Bonds", videos: [{ title: "Lecture 9", youtubeId: "NIZFPnHtrBA" }] },
        { title: "Introduction to Lewis Structures", videos: [{ title: "Lecture 10", youtubeId: "ed_XR1BzuQs" }] },
        { title: "Lewis Structures: Breakdown of the Octet Rule", videos: [{ title: "Lecture 11", youtubeId: "Hc5ODj1Ml6c" }] },
        { title: "The Shapes of Molecules: VSEPR Theory", videos: [{ title: "Lecture 12", youtubeId: "Ja9eEQQzTic" }] },
        { title: "Molecular Orbital Theory", videos: [{ title: "Lecture 13", youtubeId: "O192jrR80oo" }] },
        { title: "Valence Bond Theory and Hybridization", videos: [{ title: "Lecture 14", youtubeId: "BBbuj0XpaiQ" }] },
        { title: "Thermodynamics: Bond and Reaction Enthalpies", videos: [{ title: "Lecture 15", youtubeId: "wS1MX-C2V9w" }] },
        { title: "Thermodynamics: Gibbs Free Energy and Entropy", videos: [{ title: "Lecture 16", youtubeId: "OjhZYx1FbhI" }] },
        { title: "Thermodynamics: Now What Happens When You Heat It Up?", videos: [{ title: "Lecture 17", youtubeId: "awdQqF9CFt0" }] },
        { title: "Introduction to Chemical Equilibrium", videos: [{ title: "Lecture 18", youtubeId: "f0udxGcoztE" }] },
        { title: "Chemical Equilibrium: Le Châtelier's Principle", videos: [{ title: "Lecture 19", youtubeId: "AVL5AwJrrEU" }] },
        { title: "Solubility and Acid-Base Equilibrium", videos: [{ title: "Lecture 20", youtubeId: "FJCVSswFXyE" }] },
        { title: "Acid-Base Equilibrium: Is MIT Water Safe to Drink?", videos: [{ title: "Lecture 21", youtubeId: "pJdUR2uak2s" }] },
        { title: "Acid-Base Equilibrium: Salt Solutions and Buffers", videos: [{ title: "Lecture 22", youtubeId: "caonmXHGB60" }] },
        { title: "Acid-Base Titrations Part I", videos: [{ title: "Lecture 23", youtubeId: "pIwp65fPyYU" }] },
        { title: "Acid-Base Titrations Part II", videos: [{ title: "Lecture 24", youtubeId: "Om_5b29d_9g" }] },
        { title: "Oxidation-Reduction and Electrochemical Cells", videos: [{ title: "Lecture 25", youtubeId: "BZzkyqe6KD8" }] },
        { title: "Chemical and Biological Oxidations", videos: [{ title: "Lecture 26", youtubeId: "f6Z99Gu6XEE" }] },
        { title: "Introduction to Transition Metals", videos: [{ title: "Lecture 27", youtubeId: "JBgbUI3pxV0" }] },
        { title: "Transition Metals: Crystal Field Theory Part I", videos: [{ title: "Lecture 28", youtubeId: "lLdPSLNxDqA" }] },
        { title: "Transition Metals: Crystal Field Theory Part II", videos: [{ title: "Lecture 29", youtubeId: "CFPnZ66nge4" }] },
        { title: "Kinetics: Rate Laws", videos: [{ title: "Lecture 30", youtubeId: "B7iFcW8USjQ" }] },
        { title: "Nuclear Chemistry and Chemical Kinetics", videos: [{ title: "Lecture 31", youtubeId: "XKeAd4xybjM" }] },
        { title: "Kinetics: Reaction Mechanisms", videos: [{ title: "Lecture 32", youtubeId: "4q0T9c7jotw" }] },
        { title: "Kinetics and Temperature", videos: [{ title: "Lecture 33", youtubeId: "KHkNrbSKFic" }] },
        { title: "Kinetics: Catalysts", videos: [{ title: "Lecture 34", youtubeId: "p8AAjZXr5dg" }] },
        { title: "Applying Chemical Principles", videos: [{ title: "Lecture 35", youtubeId: "pn1cxuBmhtI" }] },
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
            const isCompleted = false;
            const isOpen = lessonNumber <= Math.max(completedLessons + 1, 3);
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
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
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

    function buildCs106bLessons(meta, completedLessons) {
        return cs106bMultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${40 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "html5",
                html5: video.videoUrl || "",
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
                completed: isCompleted,
                locked: !isOpen,
                videoItems,
                activeVideoItemId: videoItems[0]?.id || "",
                videoSources: {
                    youtube: "",
                    html5: videoItems[0]?.html5 || "",
                },
                captions: { en: null },
            };
        });
    }

    function buildCs106xLessons(meta, completedLessons) {
        return cs106xMultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${45 + ((lectureIndex + videoIndex) % 10)}:00`,
                sourceType: "bilibili",
                bilibili: `https://player.bilibili.com/player.html?bvid=${video.bilibiliId}&page=${video.page}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
                completed: isCompleted,
                locked: !isOpen,
                videoItems,
                activeVideoItemId: videoItems[0]?.id || "",
                videoSources: {
                    youtube: "",
                    html5: "",
                    bilibili: videoItems[0]?.bilibili || "",
                },
                captions: { en: null },
            };
        });
    }

    function buildMath18Lessons(meta, completedLessons) {
        return math18MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${30 + ((lectureIndex + videoIndex) % 20)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath19Lessons(meta, completedLessons) {
        return math19MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${45 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath20Lessons(meta, completedLessons) {
        return math20MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${45 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath21Lessons(meta, completedLessons) {
        return math21MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${45 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath51Lessons(meta, completedLessons) {
        return math51MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${45 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath52Lessons(meta, completedLessons) {
        return math52MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${30 + ((lectureIndex + videoIndex) % 20)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildMath53Lessons(meta, completedLessons) {
        return math53MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${30 + ((lectureIndex + videoIndex) % 20)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildCs103Lessons(meta, completedLessons) {
        return cs103MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);
            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${30 + ((lectureIndex + videoIndex) % 20)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildCS107Lessons(meta, completedLessons) {
        return cs107MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => {
                const archiveId = video.videoId;
                const embedUrl = archiveId.startsWith('http') 
                    ? archiveId 
                    : `https://archive.org/embed/${archiveId}`;
                
                return {
                    id: `${lessonId}-video-${videoIndex + 1}`,
                    title: video.title,
                    duration: `${70 + ((lectureIndex + videoIndex) % 15)}:00`,
                    sourceType: "internet_archive",
                    youtube: embedUrl,
                };
            });

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildCS110Lessons(meta, completedLessons) {
        return cs110MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${65 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildCS294Lessons(meta, completedLessons) {
        return cs294MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${50 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildCS161LessonsPlaylistA(meta, completedLessons) {
        return cs161PlaylistA_BlackboardLectures.map((topic, topicIndex) => {
            const lessonNumber = topicIndex + 1;
            const lessonId = `${meta.id}-topic-${lessonNumber}`;
            const isCompleted = false;
            const isOpen = lessonNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = topic.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${12 + ((topicIndex + videoIndex) % 8)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: topic.title,
                subtitle: topic.source,
                duration: `${videoItems.length} video${videoItems.length > 1 ? "s" : ""}`,
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

    function buildCs109Lessons(meta, completedLessons) {
        return cs109MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${60 + ((lectureIndex + videoIndex) % 20)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildPhys41Lessons(meta, completedLessons) {
        return phys41MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${50 + ((lectureIndex + videoIndex) % 10)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildPhys43Lessons(meta, completedLessons) {
        return phys43MultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${50 + ((lectureIndex + videoIndex) % 10)}:00`,
                sourceType: "youtube",
                youtube: `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildBioLessons(meta, completedLessons) {
        return bioMultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${50 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: video.youtubeId.startsWith("PLACEHOLDER") 
                    ? "" 
                    : `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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

    function buildChemLessons(meta, completedLessons) {
        return chemMultiVideoLectures.map((lecture, lectureIndex) => {
            const lectureNumber = lectureIndex + 1;
            const lessonId = `${meta.id}-lecture-${lectureNumber}`;
            const isCompleted = false;
            const isOpen = lectureNumber <= Math.max(completedLessons + 1, 3);

            const videoItems = lecture.videos.map((video, videoIndex) => ({
                id: `${lessonId}-video-${videoIndex + 1}`,
                title: video.title,
                duration: `${50 + ((lectureIndex + videoIndex) % 15)}:00`,
                sourceType: "youtube",
                youtube: video.youtubeId.startsWith("PLACEHOLDER") 
                    ? "" 
                    : `https://www.youtube.com/embed/${video.youtubeId}`,
            }));

            return {
                id: lessonId,
                title: `Lecture ${lectureNumber}: ${lecture.title}`,
                duration: `${videoItems.length} video`,
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
        const lectureCountMap = {
            "cs106a-programming-methodology": cs106aMultiVideoLectures.length,
            "cs106b-programming-abstractions": cs106bMultiVideoLectures.length,
            "cs106x-programming-abstractions-accelerated": cs106xMultiVideoLectures.length,
            "math-18-foundations-for-calculus": math18MultiVideoLectures.length,
            "math-19-calculus-i": math19MultiVideoLectures.length,
            "math-20-calculus-ii": math20MultiVideoLectures.length,
            "math-21-calculus-iii-calculus-with-infinite-processes": math21MultiVideoLectures.length,
            "math-51-linear-algebra-multivariable-calculus-optimization": math51MultiVideoLectures.length,
            "math-52-multivariable-integration-ordinary-differential-equations": math52MultiVideoLectures.length,
            "math-53-differential-calculus-of-several-variables": math53MultiVideoLectures.length,
            "cs-103-mathematical-foundations-of-computing": cs103MultiVideoLectures.length,
            "cs-107-computer-organization-systems": cs107MultiVideoLectures.length,
            "cs-110-principles-of-computer-systems-operating-systems-principles": cs110MultiVideoLectures.length,
            "cs-161-design-analysis-of-algorithms": cs161PlaylistA_BlackboardLectures.length,
            "cs-294-research-project-in-computer-science": cs294MultiVideoLectures.length,
            "cs-109-probability-for-computer-scientists-theory-of-probability": cs109MultiVideoLectures.length,
            "phys-41-introductory-mechanics-course-classical-mechanics": phys41MultiVideoLectures.length,
            "phys-43-electricity-and-magnetism": phys43MultiVideoLectures.length,
            "bio-biology": bioMultiVideoLectures.length,
            "chem-chemistry": chemMultiVideoLectures.length,
        };
        const lectureCount = lectureCountMap[meta.id] || 8;
        const completedLectures = Math.max(1, Math.min(lectureCount, Math.round((progressPercent / 100) * lectureCount)));
        const completedAssignments = Math.max(1, Math.min(5, Math.round((progressPercent / 100) * 5)));
        const term = "Fall 2024";
        const currentWeek = Math.max(2, Math.min(8, 2 + index));
        const scoreBase = 60 + progressPercent * 0.35;
        const assignments = buildAssignments(meta, completedAssignments, index);
        const lessons = meta.id === "cs106a-programming-methodology"
            ? buildCs106aLessons(meta, completedLectures)
            : meta.id === "cs106b-programming-abstractions"
                ? buildCs106bLessons(meta, completedLectures)
                : meta.id === "cs106x-programming-abstractions-accelerated"
                    ? buildCs106xLessons(meta, completedLectures)
                    : meta.id === "math-18-foundations-for-calculus"
                        ? buildMath18Lessons(meta, completedLectures)
                        : meta.id === "math-19-calculus-i"
                            ? buildMath19Lessons(meta, completedLectures)
                            : meta.id === "math-20-calculus-ii"
                                ? buildMath20Lessons(meta, completedLectures)
                                : meta.id === "math-21-calculus-iii-calculus-with-infinite-processes"
                                    ? buildMath21Lessons(meta, completedLectures)
                                    : meta.id === "math-51-linear-algebra-multivariable-calculus-optimization"
                                        ? buildMath51Lessons(meta, completedLectures)
                                        : meta.id === "math-52-multivariable-integration-ordinary-differential-equations"
                                            ? buildMath52Lessons(meta, completedLectures)
                                            : meta.id === "math-53-differential-calculus-of-several-variables"
                                                ? buildMath53Lessons(meta, completedLectures)
                                                : meta.id === "cs-103-mathematical-foundations-of-computing"
                                                    ? buildCs103Lessons(meta, completedLectures)
                                                    : meta.id === "cs-107-computer-organization-systems"
                                                        ? buildCS107Lessons(meta, completedLectures)
                                                        : meta.id === "cs-110-principles-of-computer-systems-operating-systems-principles"
                                                            ? buildCS110Lessons(meta, completedLectures)
                                                            : meta.id === "cs-294-research-project-in-computer-science"
                                                                ? buildCS294Lessons(meta, completedLectures)
                                                            : meta.id === "cs-161-design-analysis-of-algorithms"
                                                                ? buildCS161LessonsPlaylistA(meta, completedLectures)
                                                                : meta.id === "cs-109-probability-for-computer-scientists-theory-of-probability"
                                                                    ? buildCs109Lessons(meta, completedLectures)
                                                                    : meta.id === "phys-41-introductory-mechanics-course-classical-mechanics"
                                                                        ? buildPhys41Lessons(meta, completedLectures)
                                                                        : meta.id === "phys-43-electricity-and-magnetism"
                                                                            ? buildPhys43Lessons(meta, completedLectures)
                                                                            : meta.id === "bio-biology"
                                                                                ? buildBioLessons(meta, completedLectures)
                                                                                : meta.id === "chem-chemistry"
                                                                                    ? buildChemLessons(meta, completedLectures)
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

    function unwrapApiData(payload) {
        if (payload == null) return null;
        if (typeof payload !== 'object') return payload;
        if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
        return payload;
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

    function getTrackingBaseUrl() {
        return (
            window.NibrasShared?.resolveServiceUrl?.("tracking") ||
            window.NibrasApi?.resolveServiceUrl?.("tracking") ||
            window.NibrasApiConfig?.getServiceUrl?.("tracking") ||
            window.NIBRAS_TRACKING_API_URL ||
            window.NIBRAS_API_URL ||
            (/^https?:/i.test(window.location?.origin || "") ? window.location.origin.replace(/\/+$/, "") : "")
        );
    }

    async function trackApiFetch(path) {
        const shared = window.NibrasShared;
        if (shared && typeof shared.apiFetch === "function") {
            return shared.apiFetch(path, { service: "tracking" });
        }

        const token =
            shared?.auth?.getToken?.() ||
            window.NibrasApi?.getToken?.() ||
            null;
        const headers = shared?.auth?.buildAuthHeaders
            ? shared.auth.buildAuthHeaders({ "Content-Type": "application/json" }, { token })
            : window.NibrasApi?.buildAuthHeaders?.({ "Content-Type": "application/json" }, { token }) || { "Content-Type": "application/json" };
        const response = await fetch(`${getTrackingBaseUrl()}${path}`, {
            headers,
        });

        const payload = await response.json();
        if (!response.ok) {
            const message = payload?.message || payload?.error || `Request failed (${response.status})`;
            throw new Error(message);
        }
        return payload;
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

        const processCourses = (remoteList) => {
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
        };

        // Use Nibras-Backend (Railway) instead of tracking service
        const backendCoursesService = window.NibrasServices?.backendCoursesService;

        if (backendCoursesService && typeof backendCoursesService.list === 'function') {
            console.log('[NibrasCourses] Loading courses from Nibras-Backend (Railway)');
            remoteCourseState.loadingPromise = backendCoursesService.list({ page: 1, limit: 100 })
                .then((payload) => {
                    const data = unwrapApiData(payload);
                    const remoteList = Array.isArray(data) ? data : (Array.isArray(data?.courses) ? data.courses : []);
                    return processCourses(remoteList);
                })
                .catch((error) => {
                    console.warn("[NibrasCourses] Failed to load from Nibras-Backend, falling back to tracking:", error?.message || error);
                    return trackApiFetch("/v1/tracking/courses?page=1&limit=100")
                        .then((payload) => processCourses(parseArrayPayload(payload)));
                })
                .finally(() => {
                    remoteCourseState.loadingPromise = null;
                });
        } else {
            console.warn('[NibrasCourses] backendCoursesService not available, using tracking service');
            remoteCourseState.loadingPromise = trackApiFetch("/v1/tracking/courses?page=1&limit=100")
                .then((payload) => processCourses(parseArrayPayload(payload)))
                .catch((error) => {
                    console.warn("[NibrasCourses] Failed to load remote courses:", error?.message || error);
                    remoteCourseState.byLocalId = {};
                    remoteCourseState.unresolved = [];
                    return remoteCourseState.byLocalId;
                })
                .finally(() => {
                    remoteCourseState.loadingPromise = null;
                });
        }

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
