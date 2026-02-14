document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => { 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const communityData = {
        // Added a "My Question" for the filter demo
        questions: [
            {
                id: 1,
                title: "How to implement a binary search tree efficiently?",
                body: "I'm struggling with the insertion and deletion operations in BST. Can someone explain the best approach considering time complexity?",
                author: "Alice Johnson", authorInitials: "AJ",
                votes: 12, answers: 3, views: 245, time: "2 hours ago",
                tags: ["data-structures", "trees", "algorithms"],
                course: "CS 281",
                replies: [],
                page: "../Community/QuestionID/question.html"
            },
            {
                id: 2,
                title: "Database normalization vs denormalization trade-offs",
                body: "When should I choose denormalization over normalization in database design?",
                author: "Bob Smith", authorInitials: "BS",
                votes: 8, answers: 5, views: 234, time: "4 hours ago",
                tags: ["database", "design", "performance"],
                course: "CS 301",
                replies: []
            },
            {
                id: 3,
                title: "React state management: best practices",
                body: "I understand the basics of React state but struggling to implement complex state management.",
                author: "Carol Davis", authorInitials: "CD",
                votes: 45, answers: 7, views: 342, time: "6 hours ago", // High votes for "Popular"
                tags: ["react", "javascript", "state"],
                course: "CS 315",
                replies: []
            },
            {
                id: 4,
                title: "Understanding Big O notation for recursive functions",
                body: "I get linear complexity, but how do I calculate it for recursive calls?",
                author: "Ziad Alaa", authorInitials: "ZA", // Matches current user
                votes: 2, answers: 0, views: 12, time: "Just now",
                tags: ["algorithms", "math"],
                course: "CS 201",
                replies: []
            }
        ],
        // ... (Tags, Contributors, Stats remain same as before) ...
        popularTags: [
            { name: "algorithms", count: 48, color: "t-purple" },
            { name: "data-structures", count: 35, color: "t-purple" },
            { name: "javascript", count: 32, color: "t-purple" },
            { name: "database", count: 28, color: "t-purple" },
            { name: "react", count: 24, color: "t-purple" }
        ],
        contributors: [
            { name: "Dr. Sarah Johnson", rep: "7247 rep", initials: "SJ", badge: "Expert", badgeColor: "bg-red" },
            { name: "Michael Chen", rep: "5891 rep", initials: "MC", badge: "Helper", badgeColor: "bg-orange" },
            { name: "Alex Aderman", rep: "4523 rep", initials: "AA", badge: "Rising Star", badgeColor: "bg-purple" },
            { name: "Bob Smith", rep: "3847 rep", initials: "BS", badge: "Contributor", badgeColor: "bg-blue" }
        ],
        stats: [
            { label: "Total Questions", val: "1,247" },
            { label: "Answered", val: "1,089" },
            { label: "Active Users", val: "456" },
            { label: "This Week", val: "92 questions" }
        ]
    };

    // --- 3. RENDER FEED LOGIC ---
    const feedContainer = document.getElementById('questions-container');
    const feedTabs = document.querySelectorAll('.feed-tab');

    // Initial Render (Recent)
    filterAndRender('Recent');

    // Tab Click Event
    feedTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update Active State
            feedTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Render Content
            filterAndRender(tab.textContent.trim());
        });
    });

    function filterAndRender(filterType) {
        let filteredData = [...communityData.questions];

        if (filterType === 'Popular') {
            // Sort by votes descending
            filteredData.sort((a, b) => b.votes - a.votes);
        } else if (filterType === 'Unanswered') {
            // Filter where answers == 0
            filteredData = filteredData.filter(q => q.answers === 0);
        } else if (filterType === 'My Questions') {
            // Filter by current user (Mock: Ziad Alaa)
            filteredData = filteredData.filter(q => q.author === "Ziad Alaa");
        } 
        // 'Recent' is default (as per array order or sort by time if data existed)

        renderQuestions(filteredData);
    }

    function renderQuestions(data) {
        feedContainer.innerHTML = '';
        
        if (data.length === 0) {
            feedContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No questions found.</div>`;
            return;
        }

        data.forEach(q => {
            let tagHtml = '';
            q.tags.forEach(t => {
                let color = 't-default';
                if(t.includes('data')) color = 't-purple'; // Fixed to match var
                else if(t.includes('algo')) color = 't-blue';
                tagHtml += `<span class="tag ${color}">${t}</span>`;
            });

            feedContainer.innerHTML += `
                <div class="question-card" data-id="${q.id}">
                    <div class="q-vote-box">
                        <i class="fa-solid fa-caret-up vote-arrow upvote-btn"></i>
                        <span class="vote-count">${q.votes}</span>
                        <i class="fa-solid fa-caret-down vote-arrow downvote-btn"></i>
                    </div>
                    <div class="q-content">
                        <div class="q-header">
                            <a href="${q.page}" class="q-title" data-id="${q.id}">${q.title}</a>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <i class="fa-regular fa-circle-check" style="color:var(--accent-blue)"></i>
                                <span class="q-course-badge">${q.course}</span>
                            </div>
                        </div>
                        <p class="q-preview">${q.body}</p>
                        <div class="q-tags">${tagHtml}</div>
                        <div class="q-meta">
                            <div class="author-av">${q.authorInitials}</div>
                            <span>${q.author}</span>
                            <span>•</span>
                            <span>${q.answers} answers</span>
                            <span>•</span>
                            <span>${q.views} views</span>
                            <span style="margin-left:auto">${q.time}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // --- 4. VOTING LOGIC (Event Delegation) ---
    feedContainer.addEventListener('click', (e) => {
        // Handle Upvote
        if (e.target.classList.contains('upvote-btn')) {
            handleVote(e.target, 'up');
        }
        // Handle Downvote
        else if (e.target.classList.contains('downvote-btn')) {
            handleVote(e.target, 'down');
        }
        // Handle Title Click (Detail View)
        else if (e.target.classList.contains('q-title')) {
            const id = parseInt(e.target.dataset.id);
            // Call your existing openDetailView(id) here
            // Note: Since I merged code, ensure openDetailView is defined in scope or global
            console.log("Open detail for", id); 
        }
    });

    function handleVote(btn, type) {
        const voteBox = btn.closest('.q-vote-box');
        const countSpan = voteBox.querySelector('.vote-count');
        const upBtn = voteBox.querySelector('.upvote-btn');
        const downBtn = voteBox.querySelector('.downvote-btn');
        
        let currentVotes = parseInt(countSpan.innerText);

        if (type === 'up') {
            if (upBtn.classList.contains('active-up')) {
                // Remove Upvote
                upBtn.classList.remove('active-up');
                currentVotes--;
            } else {
                // Add Upvote
                upBtn.classList.add('active-up');
                currentVotes++;
                // Remove Downvote if exists
                if (downBtn.classList.contains('active-down')) {
                    downBtn.classList.remove('active-down');
                    currentVotes++; // Recover the point lost by downvote
                }
            }
        } else {
            if (downBtn.classList.contains('active-down')) {
                // Remove Downvote
                downBtn.classList.remove('active-down');
                currentVotes++;
            } else {
                // Add Downvote
                downBtn.classList.add('active-down');
                currentVotes--;
                // Remove Upvote if exists
                if (upBtn.classList.contains('active-up')) {
                    upBtn.classList.remove('active-up');
                    currentVotes--; // Recover point gained by upvote
                }
            }
        }

        // Update UI
        countSpan.innerText = currentVotes;
        countSpan.classList.add('changed');
        setTimeout(() => countSpan.classList.remove('changed'), 300);
    }

    // --- 5. WIDGETS RENDER ---
    const tagsContainer = document.getElementById('tags-container');
    communityData.popularTags.forEach(t => {
        tagsContainer.innerHTML += `<div class="tag-row"><span class="tag ${t.color}">${t.name}</span><span class="tag-count">${t.count}</span></div>`;
    });

    const contribContainer = document.getElementById('contributors-container');
    communityData.contributors.forEach(c => {
        contribContainer.innerHTML += `
            <div class="contrib-row">
                <div class="contrib-av">${c.initials}</div>
                <div class="contrib-info"><h5>${c.name}</h5><span>${c.rep}</span></div>
                <div class="contrib-badge ${c.badgeColor}">${c.badge}</div>
            </div>
        `;
    });

    const comStatsContainer = document.getElementById('com-stats-container');
    communityData.stats.forEach(s => {
        comStatsContainer.innerHTML += `<div class="c-stat-row"><span>${s.label}</span><span class="c-stat-val">${s.val}</span></div>`;
    });

    // --- 6. MODAL & THEME LOGIC (Preserved from previous) ---
    const modal = document.getElementById('askModal');
    const openBtn = document.getElementById('openAskModalBtn');
    const closeBtn = document.getElementById('closeAskModal');
    const cancelBtn = document.getElementById('cancelAskBtn');

    openBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => {
        if(e.target === modal) modal.style.display = 'none';
    });

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '../assets/images/logo-light.png';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../assets/images/logo-light.png';
        }
    });

});