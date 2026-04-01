window.NibrasReact.run(() => {

    // ==========================================
    // ⚙️ CONFIGURATION
    // ==========================================
    // If your app.js doesn't use "/api" in the route path, change this to just 'http://localhost:5000'
    const BACKEND_URL = 'http://localhost:5000'; 

    // Helper to get the logged-in user's token (assuming you save it when they log in)
    function getToken() {
        return localStorage.getItem('token'); 
    }

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => { 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. DATA STATE ---
    // Questions start empty, they will be filled from the database
    const communityData = {
        questions: [],
        
        // Keeping these hardcoded for now since you didn't provide routes for them yet
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

    const feedContainer = document.getElementById('questions-container');
    const feedTabs = document.querySelectorAll('.feed-tab');
    const searchInput = document.getElementById('question-search');
    let currentFilter = 'Recent';
    let currentUserId = null;
    let renderedQuestionIds = [];

    // Load current user on startup
    async function loadCurrentUser() {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${BACKEND_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    currentUserId = data.user._id;
                    localStorage.setItem('userId', currentUserId);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    await loadVotesForRenderedQuestions();
                }
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    function showToast(message, type = 'success') {
        const existingToast = document.getElementById('community-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'community-toast';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.right = '20px';
        toast.style.bottom = '20px';
        toast.style.zIndex = '9999';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
        toast.style.color = '#ffffff';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'opacity 180ms ease, transform 180ms ease';

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            setTimeout(() => toast.remove(), 180);
        }, 1800);
    }

    // ==========================================
    // 🚀 FETCH DATA FROM BACKEND
    // ==========================================
    async function loadQuestions() {
        try {
            // Shows a loading message while waiting for the backend
            if(feedContainer) feedContainer.innerHTML = `<div style="text-align:center; padding:2rem;">Loading questions from server...</div>`;

            // Calls your question.route.js (GET /)
            const response = await fetch(`${BACKEND_URL}/questions`);
            const data = await response.json();

            // Depending on how your controller sends the response, the array might be in data, data.data, or data.questions
            // Adjust this if your console logs an error about .forEach not being a function
            const questionsArray = data.data ? data.data : (data.questions ? data.questions : data);

            if (Array.isArray(questionsArray)) {
                communityData.questions = questionsArray;
            } else {
                console.error("Expected an array of questions, but got:", data);
                communityData.questions = [];
            }

            // Render the initial view
            filterAndRender('Recent');
            renderWidgets();

        } catch (error) {
            console.error("Failed to fetch questions:", error);
            if(feedContainer) {
                feedContainer.innerHTML = `
                    <div style="text-align:center; padding:2rem; color:red;">
                        Failed to connect to backend. Is the server running on port 5000? <br>
                        Check console for CORS or connection errors.
                    </div>`;
            }
        }
    }

    // --- 3. RENDER FEED LOGIC ---
    // Tab Click Event
    feedTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            feedTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAndRender(tab.textContent.trim());
        });
    });

    // Search Input Event
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndRender();
        });
    }

    async function filterAndRender(filterType) {
        let filteredData = [...communityData.questions];
        currentFilter = filterType || currentFilter;

        // Apply tab filtering
        if (currentFilter === 'Recent') {
            // Sort by createdAt descending (newest first)
            filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (currentFilter === 'Popular') {
            filteredData.sort((a, b) => (b.votesCount || b.votes || 0) - (a.votesCount || a.votes || 0));
        } else if (currentFilter === 'Unanswered') {
            filteredData = filteredData.filter(q => (q.commentsCount || q.answers || 0) === 0);
        } else if (currentFilter === 'My Questions') {
            const token = getToken();
            if (!token) {
                renderQuestions([]);
                if(feedContainer) {
                    feedContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">Please log in to view your questions.</div>`;
                }
                return;
            }
            // Filter by current user's ID
            const userId = currentUserId || localStorage.getItem('userId');
            if (userId) {
                filteredData = filteredData.filter(q => {
                    const authorId = q.author?._id || q.author;
                    return String(authorId) === String(userId);
                });
            } else {
                // If no user ID yet, try to load it
                await loadCurrentUser();
                if (currentUserId) {
                    filteredData = filteredData.filter(q => {
                        const authorId = q.author?._id || q.author;
                        return String(authorId) === String(currentUserId);
                    });
                }
            }
        }

        // Apply search filtering
        const searchQuery = searchInput?.value?.trim().toLowerCase();
        if (searchQuery) {
            filteredData = filteredData.filter(q => {
                const titleMatch = q.title?.toLowerCase().includes(searchQuery);
                const bodyMatch = q.body?.toLowerCase().includes(searchQuery);
                const tagsMatch = q.tags?.some(tag => tag.toLowerCase().includes(searchQuery));
                const authorMatch = q.author?.name?.toLowerCase().includes(searchQuery) ||
                                   (typeof q.author === 'string' && q.author.toLowerCase().includes(searchQuery));
                return titleMatch || bodyMatch || tagsMatch || authorMatch;
            });
        }

        renderQuestions(filteredData);
    }

    function renderQuestions(data) {
        if (!feedContainer) return;
        feedContainer.innerHTML = '';
        renderedQuestionIds = [];
        
        if (data.length === 0) {
            feedContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No questions found in the database.</div>`;
            return;
        }

        data.forEach(q => {
            let tagHtml = '';
            // Safe check for tags in case the database doesn't have them
            if (q.tags && Array.isArray(q.tags)) {
                q.tags.forEach(t => {
                    let color = 't-default';
                    if(t.toLowerCase().includes('data')) color = 't-purple';
                    else if(t.toLowerCase().includes('algo')) color = 't-blue';
                    tagHtml += `<span class="tag ${color}">${t}</span>`;
                });
            }

            // Fallbacks (||) are added in case your MongoDB schema names are slightly different
            const qId = q._id || q.id; 
            if (qId) renderedQuestionIds.push(String(qId));
            const authorName = q.author?.name || q.author || 'Anonymous';
            const authorInitials = authorName.substring(0, 2).toUpperCase();
            const answersCount = q.commentsCount ?? (Array.isArray(q.answers) ? q.answers.length : (q.answers || 0));
            const questionVotes = q.votesCount ?? q.votes ?? 0;

            feedContainer.innerHTML += `
                <div class="question-card" data-id="${qId}">
                    <div class="q-vote-box">
                        <i class="fa-solid fa-caret-up vote-arrow upvote-btn" data-id="${qId}"></i>
                        <span class="vote-count">${questionVotes}</span>
                        <i class="fa-solid fa-caret-down vote-arrow downvote-btn" data-id="${qId}"></i>
                    </div>
                    <div class="q-content">
                        <div class="q-header">
                            <a href="../Community/QuestionID/question.html?id=${qId}" class="q-title" data-id="${qId}">${q.title}</a>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <i class="fa-regular fa-circle-check" style="color:var(--accent-blue)"></i>
                                <span class="q-course-badge">${q.course || 'General'}</span>
                            </div>
                        </div>
                        <p class="q-preview">${q.body}</p>
                        <div class="q-tags">${tagHtml}</div>
                        <div class="q-meta">
                            <div class="author-av">${authorInitials}</div>
                            <span>${authorName}</span>
                            <span>•</span>
                            <span>${answersCount} answers</span>
                            <span>•</span>
                            <span>${q.views || 0} views</span>
                            <span style="margin-left:auto">${q.time || new Date(q.createdAt).toLocaleDateString() || 'Recently'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        loadVotesForRenderedQuestions();
    }

    // Track user's votes locally
    const userVotes = new Map(); // questionId -> voteValue (1, -1, or 0)

    function updateQuestionVoteUI(questionId, value) {
        const upBtn = feedContainer?.querySelector(`.upvote-btn[data-id="${questionId}"]`);
        const downBtn = feedContainer?.querySelector(`.downvote-btn[data-id="${questionId}"]`);
        if (!upBtn || !downBtn) return;

        upBtn.classList.toggle('active', value === 1);
        downBtn.classList.toggle('active', value === -1);
    }

    async function loadVotesForRenderedQuestions() {
        const token = getToken();
        if (!token || renderedQuestionIds.length === 0) return;

        try {
            for (const questionId of renderedQuestionIds) {
                if (!questionId || questionId === 'undefined') continue;

                const response = await fetch(`${BACKEND_URL}/votes/question/${questionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) continue;

                const data = await response.json();
                const value = Number(data.value ?? 0);
                userVotes.set(questionId, value);
                updateQuestionVoteUI(questionId, value);
            }
        } catch (error) {
            console.error('Error loading community votes:', error);
        }
    }

    // --- 4. VOTING LOGIC ---
    if(feedContainer) {
        feedContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('upvote-btn')) {
                handleVote(e.target, 'up');
            } else if (e.target.classList.contains('downvote-btn')) {
                handleVote(e.target, 'down');
            }
        });
    }

    // 🚀 Sending votes to your vote.route.js
    async function handleVote(btn, type) {
        const token = getToken();
        if (!token) {
            return;
        }

        const voteBox = btn.closest('.q-vote-box');
        const countSpan = voteBox.querySelector('.vote-count');
        const questionId = btn.getAttribute('data-id');
        const upBtn = voteBox.querySelector('.upvote-btn');
        const downBtn = voteBox.querySelector('.downvote-btn');

        const currentVotes = Number(countSpan.innerText) || 0;
        const currentUserVote = userVotes.get(questionId) || 0;

        // Determine what vote value to send based on current state
        let voteValue;
        let newActiveState = { up: false, down: false };

        if (type === 'up') {
            if (currentUserVote === 1) {
                // Backend vote endpoint accepts only 1 or -1; keep current state
                return;
            } else {
                // Not upvoted - add upvote
                voteValue = 1;
                newActiveState = { up: true, down: false };
            }
        } else {
            if (currentUserVote === -1) {
                // Backend vote endpoint accepts only 1 or -1; keep current state
                return;
            } else {
                // Not downvoted - add downvote
                voteValue = -1;
                newActiveState = { up: false, down: true };
            }
        }

        // Optimistic UI Update
        upBtn.classList.toggle('active', newActiveState.up);
        downBtn.classList.toggle('active', newActiveState.down);

        try {
            // Cast vote via POST /votes
            const response = await fetch(`${BACKEND_URL}/votes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetType: 'question',
                    targetId: questionId,
                    value: voteValue
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to vote");
            }

            const data = await response.json();

            // Update local tracking and vote count from backend
            userVotes.set(questionId, Number(data.voteValue ?? voteValue));
            if (data.votesCount !== undefined) {
                countSpan.innerText = data.votesCount;
            } else {
                // Calculate locally if backend doesn't return count
                const nextVote = Number(data.voteValue ?? voteValue);
                countSpan.innerText = currentVotes + (nextVote - currentUserVote);
            }

        } catch (error) {
            console.error("Voting error:", error);
            // Revert UI
            upBtn.classList.toggle('active', currentUserVote === 1);
            downBtn.classList.toggle('active', currentUserVote === -1);
            countSpan.innerText = currentVotes;
        }
    }

    // --- 5. WIDGETS RENDER ---
    function renderWidgets() {
        const tagsContainer = document.getElementById('tags-container');
        if(tagsContainer) {
            tagsContainer.innerHTML = '';
            communityData.popularTags.forEach(t => {
                tagsContainer.innerHTML += `<div class="tag-row"><span class="tag ${t.color}">${t.name}</span><span class="tag-count">${t.count}</span></div>`;
            });
        }

        const contribContainer = document.getElementById('contributors-container');
        if(contribContainer) {
            contribContainer.innerHTML = '';
            communityData.contributors.forEach(c => {
                contribContainer.innerHTML += `
                    <div class="contrib-row">
                        <div class="contrib-av">${c.initials}</div>
                        <div class="contrib-info"><h5>${c.name}</h5><span>${c.rep}</span></div>
                        <div class="contrib-badge ${c.badgeColor}">${c.badge}</div>
                    </div>
                `;
            });
        }

        const comStatsContainer = document.getElementById('com-stats-container');
        if(comStatsContainer) {
            comStatsContainer.innerHTML = '';
            communityData.stats.forEach(s => {
                comStatsContainer.innerHTML += `<div class="c-stat-row"><span>${s.label}</span><span class="c-stat-val">${s.val}</span></div>`;
            });
        }
    }

    // --- 6. QUESTION SUBMISSION ---
    async function submitQuestion() {
        const token = getToken();
        if (!token) {
            alert('You must be logged in to post a question!');
            return;
        }

        // Get form values
        const titleInput = document.getElementById('question-title');
        const bodyInput = document.getElementById('question-body');
        const courseInput = document.getElementById('question-course');
        const tagsInput = document.getElementById('question-tags');

        const title = titleInput?.value?.trim();
        const body = bodyInput?.value?.trim();
        const course = courseInput?.value;
        const tagsText = tagsInput?.value?.trim();

        // Validation
        if (!title) {
            alert('Please enter a question title');
            return;
        }
        if (!body) {
            alert('Please enter question details');
            return;
        }

        // Parse tags (comma or space separated)
        let tags = [];
        if (tagsText) {
            tags = tagsText.split(/[,\s]+/).filter(tag => tag.length > 0).slice(0, 5);
        }

        // Prepare payload
        // Note: course should be a Course ID (ObjectId), not a string name
        // For now, we don't send course since the dropdown returns names, not IDs
        const payload = { title, body };
        if (tags.length > 0) payload.tags = tags;

        // Show loading state
        const postBtn = document.getElementById('postQuestionBtn');
        const originalText = postBtn?.innerText;
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';
        }

        try {
            const response = await fetch(`${BACKEND_URL}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to post question');
            }

            const data = await response.json();

            // Success - close modal and clear form
            const modal = document.getElementById('askModal');
            if (modal) modal.style.display = 'none';

            // Clear form
            if (titleInput) titleInput.value = '';
            if (bodyInput) bodyInput.value = '';
            if (courseInput) courseInput.value = '';
            if (tagsInput) tagsInput.value = '';

            // Reload questions to show the new one
            await loadQuestions();
            // Non-blocking success feedback
            showToast('Question posted successfully');
            alert('Question posted successfully!');

        } catch (error) {
            console.error('Error posting question:', error);
            alert(error.message || 'Failed to post question. Please try again.');
        } finally {
            // Reset button
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.innerText = originalText;
            }
        }
    }

    // --- 7. MODAL & THEME LOGIC ---
    const modal = document.getElementById('askModal');
    const openBtn = document.getElementById('openAskModalBtn');
    const closeBtn = document.getElementById('closeAskModal');
    const cancelBtn = document.getElementById('cancelAskBtn');
    const postQuestionBtn = document.getElementById('postQuestionBtn');

    if(openBtn) openBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
    if(closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if(cancelBtn) cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if(postQuestionBtn) postQuestionBtn.addEventListener('click', submitQuestion);
    window.addEventListener('click', (e) => {
        if(e.target === modal) modal.style.display = 'none';
    });

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    const appLogo = document.getElementById('app-logo');

    if(themeBtn) {
        if(document.documentElement.getAttribute('data-theme') === 'dark') {
            if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
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
                if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
                if(appLogo) appLogo.src = '../assets/images/logo-dark.png';
            } else {
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(themeIcon) themeIcon.className = 'fa-regular fa-moon';
                if(appLogo) appLogo.src = '../assets/images/logo-light.png';
            }
        });
    }

    // 🚀 Start the whole process by calling the backend!
    loadQuestions();
    loadCurrentUser(); // Load current user info for "My Questions" tab
});
