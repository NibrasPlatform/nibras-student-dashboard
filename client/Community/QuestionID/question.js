document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const BACKEND_URL = 'http://localhost:5000';

    // --- HELPER FUNCTIONS ---
    function getToken() {
        return localStorage.getItem('token');
    }

    function getQuestionIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }

    function showError(message) {
        const detailMain = document.getElementById('q-main-content');
        detailMain.innerHTML = `
            <div style="text-align:center; padding:2rem; color:var(--accent-red);">
                <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; margin-bottom:1rem;"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="../community.html" class="btn-back" style="margin-top:1rem; display:inline-block;">
                    <i class="fa-solid fa-chevron-left"></i> Back to Community
                </a>
            </div>
        `;
        document.getElementById('answers-count-header').style.display = 'none';
        document.querySelector('.your-answer-section').style.display = 'none';
    }

    function showLoading() {
        const detailMain = document.getElementById('q-main-content');
        detailMain.innerHTML = `
            <div style="text-align:center; padding:2rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-blue);"></i>
                <p style="margin-top:1rem;">Loading question...</p>
            </div>
        `;
    }

    // --- SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- DATA FETCHING ---
    let currentQuestionData = null;
    let currentQuestionId = null;

    async function loadQuestion(questionId) {
        currentQuestionId = questionId;
        showLoading();

        try {
            const response = await fetch(`${BACKEND_URL}/questions/${questionId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Question not found');
                }
                throw new Error('Failed to load question');
            }

            const data = await response.json();

            // Transform backend data to match render structure
            const question = data.question;
            const comments = data.comments || [];

            currentQuestionData = {
                id: question._id,
                title: question.title,
                body: question.body,
                author: question.author?.name || 'Unknown',
                authorInitials: getInitials(question.author?.name),
                votes: question.votesCount || 0,
                views: question.views || 0,
                createdAt: question.createdAt,
                time: formatTimeAgo(question.createdAt),
                tags: question.tags || [],
                authorRole: question.author?.role || 'student',
                authorRep: question.author?.reputation || 0,
                replies: comments.map(comment => ({
                    id: comment._id,
                    votes: comment.votesCount || 0,
                    author: comment.author?.name || 'Unknown',
                    authorRole: comment.author?.role || 'student',
                    authorRep: comment.author?.reputation || 0,
                    initials: getInitials(comment.author?.name),
                    time: formatTimeAgo(comment.createdAt),
                    createdAt: comment.createdAt,
                    text: comment.body,
                    isPinned: comment.isPinned
                }))
            };

            renderDetailView(currentQuestionData);

        } catch (error) {
            console.error('Error loading question:', error);
            showError(error.message || 'Failed to load question. Please try again.');
        }
    }

    // --- RENDER FUNCTION ---
    function renderDetailView(q) {

        // A. Render Tags
        let tagHtml = '';
        q.tags.forEach(t => {
            let color = 't-default';
            if(['data-structures', 'javascript', 'python', 'java'].includes(t)) color = 't-red';
            if(['trees', 'arrays', 'strings'].includes(t)) color = 't-purple';
            if(['algorithms', 'sorting', 'searching'].includes(t)) color = 't-blue';
            if(['database', 'sql', 'mongodb'].includes(t)) color = 't-green';
            tagHtml += `<span class="tag ${color}">${t}</span>`;
        });

        // B. Render Main Question
        const detailMain = document.getElementById('q-main-content');
        detailMain.innerHTML = `
            <div class="q-vote-box" data-type="question" data-id="${q.id}">
                <i class="fa-solid fa-chevron-up vote-arrow up" data-type="question" data-id="${q.id}"></i>
                <span class="vote-count">${q.votes}</span>
                <i class="fa-solid fa-chevron-down vote-arrow down" data-type="question" data-id="${q.id}"></i>
            </div>
            <div class="detail-content">
                <h1 class="detail-title">${q.title}</h1>
                <div class="detail-body">${q.body}</div>
                <div class="detail-tags">${tagHtml}</div>
                <div class="detail-footer">
                    <div class="detail-actions">
                        <span>Asked ${q.time}</span>
                        <span>•</span>
                        <span>${q.views} views</span>
                        <i class="fa-solid fa-share-nodes"></i>
                        <i class="fa-regular fa-bookmark"></i>
                    </div>
                    <div class="detail-author-box">
                        <div class="author-av" style="width:36px; height:36px;">${q.authorInitials}</div>
                        <div class="detail-author-info">
                            <span class="detail-author-name">${q.author}</span>
                            <span class="detail-author-meta">${q.authorRep} rep • ${q.authorRole}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // C. Render Answers
        document.getElementById('answers-count-header').textContent = `${q.replies.length} Answer${q.replies.length !== 1 ? 's' : ''}`;
        const ansContainer = document.getElementById('answers-container');
        ansContainer.innerHTML = '';

        q.replies.forEach(ans => {
            // Role Badge Logic
            let roleBadge = '';
            let roleColor = 'bg-blue';
            if (ans.authorRole === 'instructor') {
                roleColor = 'bg-blue';
                roleBadge = `<span class="contrib-badge ${roleColor}">Instructor</span>`;
            } else if (ans.authorRole === 'admin') {
                roleColor = 'bg-purple';
                roleBadge = `<span class="contrib-badge ${roleColor}">Admin</span>`;
            }

            const pinnedBadge = ans.isPinned ? `<span class="contrib-badge bg-green" style="margin-left:8px;"><i class="fa-solid fa-thumbtack"></i> Pinned</span>` : '';

            ansContainer.innerHTML += `
                <div class="answer-card" data-comment-id="${ans.id}">
                    <div class="q-vote-box" data-type="comment" data-id="${ans.id}">
                        <i class="fa-solid fa-chevron-up vote-arrow up" data-type="comment" data-id="${ans.id}"></i>
                        <span class="vote-count">${ans.votes}</span>
                        <i class="fa-solid fa-chevron-down vote-arrow down" data-type="comment" data-id="${ans.id}"></i>
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
                                        ${roleBadge}${pinnedBadge}
                                    </div>
                                    <span class="detail-author-meta">${ans.authorRep} rep</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Load user's existing votes
        loadUserVotes();
    }

    // --- VOTING LOGIC ---
    async function loadUserVotes() {
        const token = getToken();
        if (!token || !currentQuestionData) return;

        try {
            // Get user's vote on the question
            const qResponse = await fetch(`${BACKEND_URL}/votes/Question/${currentQuestionData.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (qResponse.ok) {
                const qData = await qResponse.json();
                updateVoteUI('question', currentQuestionData.id, qData.vote?.value || 0);
            }

            // Get user's votes on comments
            for (const reply of currentQuestionData.replies) {
                const cResponse = await fetch(`${BACKEND_URL}/votes/Comment/${reply.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (cResponse.ok) {
                    const cData = await cResponse.json();
                    updateVoteUI('comment', reply.id, cData.vote?.value || 0);
                }
            }
        } catch (error) {
            console.error('Error loading votes:', error);
        }
    }

    function updateVoteUI(type, id, value) {
        const voteBox = document.querySelector(`.q-vote-box[data-type="${type}"][data-id="${id}"]`);
        if (!voteBox) return;

        const upBtn = voteBox.querySelector('.up');
        const downBtn = voteBox.querySelector('.down');

        upBtn.classList.remove('active');
        downBtn.classList.remove('active');

        if (value === 1) upBtn.classList.add('active');
        if (value === -1) downBtn.classList.add('active');
    }

    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('vote-arrow')) {
            const btn = e.target;
            const type = btn.dataset.type;
            const targetId = btn.dataset.id;
            const voteBox = btn.closest('.q-vote-box');
            const countSpan = voteBox.querySelector('.vote-count');
            const originalVotes = parseInt(countSpan.innerText);

            // Check authentication
            const token = getToken();
            if (!token) {
                alert('You must be logged in to vote!');
                return;
            }

            let voteValue = 0;

            // Handle UP
            if (btn.classList.contains('up')) {
                if (btn.classList.contains('active')) {
                    voteValue = 0; // Remove vote
                } else {
                    voteValue = 1; // Upvote
                }
            }
            // Handle DOWN
            else if (btn.classList.contains('down')) {
                if (btn.classList.contains('active')) {
                    voteValue = 0; // Remove vote
                } else {
                    voteValue = -1; // Downvote
                }
            }

            // Optimistic UI update
            let newVotes = originalVotes;
            const wasUpvoted = voteBox.querySelector('.up').classList.contains('active');
            const wasDownvoted = voteBox.querySelector('.down').classList.contains('active');

            if (btn.classList.contains('up')) {
                if (wasUpvoted) {
                    newVotes--;
                } else {
                    newVotes++;
                    if (wasDownvoted) newVotes++;
                }
            } else {
                if (wasDownvoted) {
                    newVotes++;
                } else {
                    newVotes--;
                    if (wasUpvoted) newVotes--;
                }
            }
            countSpan.innerText = newVotes;

            // Update UI immediately
            updateVoteUI(type, targetId, voteValue);

            // Send to backend
            try {
                const targetType = type === 'question' ? 'Question' : 'Comment';
                const response = await fetch(`${BACKEND_URL}/votes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        targetType: targetType,
                        targetId: targetId,
                        value: voteValue
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to vote');
                }

                const data = await response.json();
                // Update with actual vote count from server
                if (data.target && data.target.votesCount !== undefined) {
                    countSpan.innerText = data.target.votesCount;
                }

            } catch (error) {
                console.error('Voting error:', error);
                alert(error.message);
                // Revert UI
                countSpan.innerText = originalVotes;
                updateVoteUI(type, targetId, wasUpvoted ? 1 : (wasDownvoted ? -1 : 0));
            }
        }
    });

    // --- COMMENT SUBMISSION ---
    async function postComment() {
        const token = getToken();
        if (!token) {
            alert('You must be logged in to post an answer!');
            return;
        }

        if (!currentQuestionId) {
            alert('Question ID not found');
            return;
        }

        const textarea = document.querySelector('.answer-textarea');
        const body = textarea.value.trim();

        if (!body) {
            alert('Please enter an answer');
            return;
        }

        const postBtn = document.querySelector('.btn-primary');
        postBtn.disabled = true;
        postBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

        try {
            const response = await fetch(`${BACKEND_URL}/comments/${currentQuestionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ body })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to post answer');
            }

            // Clear textarea and reload question
            textarea.value = '';
            await loadQuestion(currentQuestionId);

        } catch (error) {
            console.error('Error posting comment:', error);
            alert(error.message || 'Failed to post answer. Please try again.');
        } finally {
            postBtn.disabled = false;
            postBtn.innerText = 'Post Answer';
        }
    }

    // Attach event listener to post button
    document.querySelector('.btn-primary')?.addEventListener('click', postComment);

    // --- THEME TOGGLE ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn?.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        if (themeIcon) themeIcon.className = 'fa-regular fa-sun';
        if (appLogo) appLogo.src = '../../assets/images/logo-dark.png';
    } else {
        if (appLogo) appLogo.src = '../../assets/images/logo-light.png';
    }

    themeBtn?.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) themeIcon.className = 'fa-regular fa-sun';
            if (appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            if (themeIcon) themeIcon.className = 'fa-regular fa-moon';
            if (appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });

    // --- INITIALIZATION ---
    const questionId = getQuestionIdFromUrl();
    if (questionId) {
        loadQuestion(questionId);
    } else {
        showError('No question ID provided. Please select a question from the community page.');
    }

});
