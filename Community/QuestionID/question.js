document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const communityData = {
        questions: [
            {
                id: 1,
                title: "How to implement a binary search tree efficiently?",
                body: "I'm struggling with the insertion and deletion operations in BST. Can someone explain the best approach considering time complexity?",
                author: "Alex Johnson", authorInitials: "AJ", authorRole: "student",
                votes: 8, answers: 3, views: "2 hours ago",
                tags: ["data-structures", "trees", "algorithms"],
                course: "CS 281",
                detailedBody: `I'm struggling with the insertion and deletion operations in BST. Can someone explain the best approach? I understand the basic concept but I'm having trouble with maintaining the BST property during complex operations. Specifically, I need help with:
                <ul>
                    <li>Proper node insertion while maintaining balance</li>
                    <li>Handling edge cases during deletion (nodes with 0, 1, or 2 children)</li>
                    <li>Optimizing search operations</li>
                    <li>Best practices for memory management</li>
                </ul>`,
                replies: [
                    { 
                        id: 101, votes: 12, author: "Dr. Sarah Johnson", role: "Expert", initials: "DSJ", time: "2 hours ago", rep: "7247 rep",
                        text: "The key to implementing an efficient BST is to maintain balance. I recommend looking into AVL trees or Red-Black trees. They guarantee O(log n) operations by automatically rebalancing after insertions and deletions."
                    },
                    { 
                        id: 102, votes: 8, author: "Michael Chen", role: "Helper", initials: "MC", time: "1 hour ago", rep: "5891 rep",
                        text: "Building on Sarah's answer, if you're implementing in JavaScript, you'll want to use a class-based approach. Start with the basic Node class, then implement insert, search, and delete methods. Don't forget to handle edge cases like empty trees and single-node trees."
                    },
                    { 
                        id: 103, votes: 5, author: "Alex Aderman", role: "Rising Star", initials: "AA", time: "45 minutes ago", rep: "4523 rep",
                        text: "Here's a quick tip: when implementing the search method, always compare values recursively. If the target value is less than the current node, go left; if greater, go right. This is the essence of BST efficiency!"
                    }
                ]
            },
            {
                id: 2,
                title: "Database normalization vs denormalization trade-offs",
                body: "When should I choose denormalization over normalization in database design? What are the performance implications?",
                author: "Bob Smith", authorInitials: "BS", authorRole: "student",
                votes: 8, answers: 5, views: "4 hours ago",
                tags: ["database", "design", "performance"],
                course: "CS 301",
                replies: []
            },
            {
                id: 3,
                title: "React state management: best practices",
                body: "I understand the basics of React state but struggling to implement complex state management. Can someone recommend best practices?",
                author: "Carol Davis", authorInitials: "CD", authorRole: "student",
                votes: 15, answers: 7, views: "6 hours ago",
                tags: ["react", "javascript", "state-management"],
                course: "CS 315",
                replies: []
            },
            {
                id: 4,
                title: "Dynamic programming approach for longest common subsequence",
                body: "I understand the recursive solution but struggling with the DP optimization. Can someone walk through the tabulation method?",
                author: "David Wilson", authorInitials: "DW", authorRole: "student",
                votes: 9, answers: 4, views: "1 day ago",
                tags: ["algorithms", "dynamic-programming", "interview-preparation"],
                course: "CS 412",
                replies: []
            },
            {
                id: 5,
                title: "Git merge conflicts resolution strategies",
                body: "What's the best way to handle complex merge conflicts in a team project? Any tools or workflow recommendations?",
                author: "Eve Martinez", authorInitials: "EM", authorRole: "student",
                votes: 6, answers: 2, views: "2 days ago",
                tags: ["git", "version-control", "collaboration"],
                course: "CS 108",
                replies: []
            }
        ],
        popularTags: [
            { name: "algorithms", count: 48, color: "t-purple" },
            { name: "data-structures", count: 35, color: "t-purple" },
            { name: "javascript", count: 32, color: "t-purple" },
            { name: "database", count: 28, color: "t-purple" },
            { name: "react", count: 24, color: "t-purple" }
        ],
        contributors: [
            { name: "Dr. Sarah Johnson", rep: "7247 rep", initials: "SJ", badge: "Expert", badgeColor: "bg-blue" },
            { name: "Michael Chen", rep: "5891 rep", initials: "MC", badge: "Helper", badgeColor: "bg-green" },
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

    // --- 3. RENDER FEED ---
    const feedContainer = document.getElementById('questions-container');
    feedContainer.innerHTML = '';
    
    communityData.questions.forEach(q => {
        let tagHtml = '';
        q.tags.forEach(t => {
            let color = 't-default';
            if(['data-structures','database','react'].includes(t)) color = 't-red'; // Approx red/brown
            if(['trees','design','javascript'].includes(t)) color = 't-purple';
            if(['algorithms','performance','state-management'].includes(t)) color = 't-blue';
            tagHtml += `<span class="tag ${color}">${t}</span>`;
        });

        feedContainer.innerHTML += `
            <div class="question-card">
                <div class="q-vote-box">
                    <i class="fa-solid fa-caret-up vote-arrow"></i>
                    <span class="vote-count">${q.votes}</span>
                    <i class="fa-solid fa-caret-down vote-arrow"></i>
                </div>
                <div class="q-content">
                    <div class="q-header">
                        <a href="#" class="q-title" data-id="${q.id}">${q.title}</a>
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
                        <span class="tag t-default" style="font-size:0.6rem; padding:1px 4px">${q.authorRole}</span>
                        <span>•</span>
                        <span>${q.answers} answers</span>
                        <span style="margin-left:auto; color:var(--text-tertiary)"><i class="fa-regular fa-clock"></i> ${q.views}</span>
                    </div>
                </div>
            </div>
        `;
    });

    // Render Widgets
    const tagsContainer = document.getElementById('tags-container');
    communityData.popularTags.forEach(t => tagsContainer.innerHTML += `<div class="tag-row"><span class="tag ${t.color}">${t.name}</span><span class="tag-count">${t.count}</span></div>`);

    const contribContainer = document.getElementById('contributors-container');
    communityData.contributors.forEach(c => contribContainer.innerHTML += `<div class="contrib-row"><div class="contrib-av">${c.initials}</div><div class="contrib-info"><h5>${c.name}</h5><span>${c.rep}</span></div><div class="contrib-badge ${c.badgeColor}">${c.badge}</div></div>`);

    const statsContainer = document.getElementById('com-stats-container');
    communityData.stats.forEach(s => statsContainer.innerHTML += `<div class="c-stat-row"><span>${s.label}</span><span class="c-stat-val">${s.val}</span></div>`);


    // --- 4. VIEW LOGIC (CLICK TITLE -> DETAIL) ---
    const feedView = document.getElementById('feed-view');
    const detailView = document.getElementById('detail-view');
    const backBtn = document.getElementById('backToFeedBtn');

    document.querySelectorAll('.q-title').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(e.target.dataset.id);
            openDetailView(id);
        });
    });

    backBtn.addEventListener('click', () => {
        detailView.classList.add('hidden');
        feedView.classList.remove('hidden');
    });

    function openDetailView(id) {
        const q = communityData.questions.find(item => item.id === id);
        if(!q) return;

        // 1. Render Main Question
        let tagHtml = '';
        q.tags.forEach(t => {
            let color = 't-default';
            // Simple mapping for demo colors
            if(['data-structures','database','react'].includes(t)) color = 't-red';
            if(['trees','design','javascript'].includes(t)) color = 't-purple';
            if(['algorithms','performance','state-management'].includes(t)) color = 't-blue';
            tagHtml += `<span class="tag ${color}">${t}</span>`;
        });

        const detailMain = document.getElementById('q-main-content');
        detailMain.innerHTML = `
            <div class="q-vote-box">
                <i class="fa-solid fa-chevron-up vote-arrow up"></i>
                <span class="vote-count">${q.votes}</span>
                <i class="fa-solid fa-chevron-down vote-arrow down"></i>
            </div>
            <div class="detail-content">
                <h1 class="detail-title">${q.title}</h1>
                <div class="detail-body">${q.detailedBody || q.body}</div>
                <div class="detail-tags">${tagHtml}</div>
                <div class="detail-footer">
                    <div class="detail-actions">
                        <span>${q.views || 'Asked 2 hours ago'}</span>
                        <i class="fa-solid fa-share-nodes"></i>
                        <i class="fa-regular fa-bookmark"></i>
                    </div>
                    <div class="detail-author-box">
                        <div class="author-av" style="width:36px; height:36px;">${q.authorInitials}</div>
                        <div class="detail-author-info">
                            <span class="detail-author-name">${q.author}</span>
                            <span class="detail-author-meta">2847 rep</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 2. Render Answers
        document.getElementById('answers-count-header').textContent = `${q.replies.length} Answers`;
        const ansContainer = document.getElementById('answers-container');
        ansContainer.innerHTML = '';

        q.replies.forEach(ans => {
            // Determine badge color for reply author
            let roleBadge = '';
            if(ans.role) {
                let color = 'bg-blue';
                if(ans.role === 'Helper') color = 'bg-green';
                if(ans.role === 'Rising Star') color = 'bg-purple';
                roleBadge = `<span class="contrib-badge ${color}" style="margin-left:8px; font-size:0.7rem">${ans.role}</span>`;
            }

            ansContainer.innerHTML += `
                <div class="answer-card">
                    <div class="q-vote-box">
                        <i class="fa-solid fa-chevron-up vote-arrow up"></i>
                        <span class="vote-count">${ans.votes}</span>
                        <i class="fa-solid fa-chevron-down vote-arrow down"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-body" style="margin-bottom:1.5rem">${ans.text}</div>
                        <div class="detail-footer">
                            <div class="detail-actions">
                                <span>${ans.time}</span>
                            </div>
                            <div class="detail-author-box">
                                <div class="author-av" style="width:36px; height:36px;">${ans.initials}</div>
                                <div class="detail-author-info">
                                    <div style="display:flex; align-items:center">
                                        <span class="detail-author-name">${ans.author}</span>
                                        ${roleBadge}
                                    </div>
                                    <span class="detail-author-meta">${ans.rep}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Switch
        feedView.classList.add('hidden');
        detailView.classList.remove('hidden');
        window.scrollTo(0,0);
    }

    // --- 5. MODAL LOGIC ---
    const modal = document.getElementById('askModal');
    document.getElementById('openAskModalBtn').addEventListener('click', () => modal.style.display = 'flex');
    document.getElementById('closeAskModal').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancelAskBtn').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if(e.target === modal) modal.style.display = 'none'; });

    // --- 6. THEME TOGGLE ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });
    // --- GLOBAL VOTING LOGIC (Handles Feed, Question Detail, and Answers) ---
    document.body.addEventListener('click', (e) => {
        
        // Check if the clicked element is a vote arrow
        if (e.target.classList.contains('vote-arrow')) {
            const btn = e.target;
            const voteBox = btn.closest('.q-vote-box');
            const countSpan = voteBox.querySelector('.vote-count');
            const upBtn = voteBox.querySelector('.up'); // or .fa-caret-up depending on icon used
            const downBtn = voteBox.querySelector('.down'); // or .fa-caret-down

            // Note: In Feed we used fa-caret-up, in Detail we used fa-chevron-up/down with classes 'up'/'down'
            // Let's normalize logic to handle the class names used in Detail View:
            
            let currentVotes = parseInt(countSpan.innerText);
            
            // 1. Handle UPVOTE
            if (btn.classList.contains('up') || btn.classList.contains('fa-caret-up')) {
                // If already active, remove it (undo vote)
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    currentVotes--;
                } else {
                    // Activate Up, Deactivate Down
                    btn.classList.add('active');
                    currentVotes++;
                    
                    // If down was active, remove it and add another point back
                    const siblingDown = voteBox.querySelector('.down, .fa-caret-down');
                    if (siblingDown && siblingDown.classList.contains('active')) {
                        siblingDown.classList.remove('active');
                        currentVotes++; 
                    }
                }
            }

            // 2. Handle DOWNVOTE
            else if (btn.classList.contains('down') || btn.classList.contains('fa-caret-down')) {
                // If already active, remove it (undo vote)
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    currentVotes++;
                } else {
                    // Activate Down, Deactivate Up
                    btn.classList.add('active');
                    currentVotes--;

                    // If up was active, remove it and subtract another point
                    const siblingUp = voteBox.querySelector('.up, .fa-caret-up');
                    if (siblingUp && siblingUp.classList.contains('active')) {
                        siblingUp.classList.remove('active');
                        currentVotes--;
                    }
                }
            }

            // Update the number with animation
            countSpan.style.transform = "scale(1.2)";
            countSpan.style.transition = "transform 0.2s";
            setTimeout(() => countSpan.style.transform = "scale(1)", 200);
            
            countSpan.innerText = currentVotes;
        }
    });


});