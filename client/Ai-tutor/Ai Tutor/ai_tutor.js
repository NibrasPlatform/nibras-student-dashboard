window.NibrasReact.run(() => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const aiData = {
        quickTopics:[
            { title: "Binary Search", sub: "Algorithms", icon: "fa-solid fa-magnifying-glass", iconColor: "text-primary", bg: "transparent" },
            { title: "Tree Traversal", sub: "Data Structures", icon: "fa-solid fa-network-wired", iconColor: "#16a34a", bg: "#dcfce7" },
            { title: "Dynamic Programming", sub: "Problem Solving", icon: "fa-solid fa-bolt", iconColor: "#ca8a04", bg: "#fef9c3" },
            { title: "Graph Algorithms", sub: "Algorithms", icon: "fa-solid fa-chart-simple", iconColor: "#2563eb", bg: "#dbeafe" },
            { title: "Linked Lists", sub: "Data Structures", icon: "fa-solid fa-link", iconColor: "#4b5563", bg: "#f3f4f6" },
            { title: "Greedy Algorithms", sub: "Problem Solving", icon: "fa-solid fa-bullseye", iconColor: "#dc2626", bg: "#fee2e2" }
        ],
        recent:[
            { title: "How does binary search work?", tag: "Algorithms", conf: "95% confidence", time: "2 hours ago" },
            { title: "Explain time complexity of merge sort", tag: "Data Structures", conf: "88% confidence", time: "1 day ago" },
            { title: "What is dynamic programming?", tag: "Problem Solving", conf: "92% confidence", time: "2 days ago" }
        ],
        stats:[
            { label: "Questions Asked", val: "47", pct: 47, color: "var(--stat-bar-blue)" },
            { label: "Avg. Confidence", val: "91%", pct: 91, color: "var(--stat-bar-green)" },
            { label: "Topics Covered", val: "12", pct: 40, color: "var(--stat-bar-purple)" }
        ],
        popular:[
            "Algorithms", "Data Structures", "Complexity Analysis", "Problem Solving", "Code Optimization"
        ]
    };

    // --- 3. RENDER UI ---
    
    // Quick Topics
    const topicContainer = document.getElementById('quick-topics-container');
    topicContainer.innerHTML = '';
    aiData.quickTopics.forEach(t => {
        let style = t.bg === 'transparent' ? '' : `background-color:${t.bg}; color:${t.iconColor};`;
        if(t.title === 'Binary Search') style = `background-color: var(--tag-bg); color: var(--text-primary);`;

        topicContainer.innerHTML += `
            <div class="topic-card">
                <div class="topic-icon" style="${style}">
                    <i class="${t.icon}"></i>
                </div>
                <div class="topic-info">
                    <h4>${t.title}</h4>
                    <span>${t.sub}</span>
                </div>
            </div>
        `;
    });

    // Recent Conversations
    const recentContainer = document.getElementById('recent-ai-container');
    recentContainer.innerHTML = '';
    aiData.recent.forEach(r => {
        recentContainer.innerHTML += `
            <div class="ai-conv-item">
                <h4>${r.title}</h4>
                <div class="ai-meta">
                    <span class="ai-tag tag-red">${r.tag}</span>
                    <span>${r.conf}</span>
                    <span>• <i class="fa-regular fa-clock"></i> ${r.time}</span>
                </div>
            </div>
        `;
    });

    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    aiData.stats.forEach(s => {
        statsContainer.innerHTML += `
            <div class="stat-row">
                <div class="stat-head">
                    <span>${s.label}</span>
                    <span class="stat-val">${s.val}</span>
                </div>
                <div class="stat-track">
                    <div class="stat-fill" style="width: ${s.pct}%; background-color: ${s.color};"></div>
                </div>
            </div>
        `;
    });

    // Popular Topics
    const popContainer = document.getElementById('pop-topics-container');
    popContainer.innerHTML = '';
    aiData.popular.forEach(p => {
        popContainer.innerHTML += `<a href="#" class="pop-link">${p}</a>`;
    });

    // --- 4. THEME TOGGLE & LOGO SWAP ---
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
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });

    // --- 5. TAB LOGIC ---
    const aiTabs = document.querySelectorAll('.ai-tab');
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

// --- 6. AI TUTOR INTERACTION LOGIC (backend: /api/chatbot) ---
    const askAiBtn = document.getElementById('ask-ai-btn');
    const questionInput = document.getElementById('ai-question-input');
    const interactionArea = document.getElementById('ai-interaction-area');
    const interactionTitle = document.getElementById('interaction-title');
    const choiceActions = document.getElementById('choice-actions');
    const viewAnswerBtn = document.getElementById('view-answer-btn');
    const getHintBtn = document.getElementById('get-hint-btn');
    const hintsContainer = document.getElementById('hints-container');
    const fullAnswerContainer = document.getElementById('full-answer-container');

    const postAnswerActions = document.getElementById('post-answer-actions');
    const resetChatBtn = document.getElementById('reset-chat-btn');
    const pushCommunityBtn = document.getElementById('push-community-btn');

    const communityModal = document.getElementById('community-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const confirmPushBtn = document.getElementById('confirm-push-btn');
    const modalQuestionDisplay = document.getElementById('modal-question-display');
    const modalAnswerDisplay = document.getElementById('modal-answer-display');
    const modalTitleInput = document.getElementById('modal-title-input');

    const ASK_MIN = 10;
    const ASK_MAX = 500;
    const LOGIN_PATH = '../../Login/loginPage/login.html';

    const normalizeHint = (h) => {
        if (h == null) return '';
        if (typeof h === 'string') return h;
        return String(h);
    };

    const postJson = (path, body) => {
        const shared = window.NibrasShared;
        if (shared && typeof shared.apiFetch === 'function') {
            return shared.apiFetch(path, {
                method: 'POST',
                body: JSON.stringify(body),
            });
        }
        const BACKEND_URL =
            (shared && shared.BACKEND_URL) ||
            window.NIBRAS_BACKEND_URL ||
            'http://localhost:5000';
        const token = localStorage.getItem('token');
        return fetch(`${BACKEND_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        }).then(async (response) => {
            let payload = null;
            try {
                payload = await response.json();
            } catch (_) {
                payload = null;
            }
            if (!response.ok) {
                const message =
                    (payload && (payload.message || payload.error)) ||
                    `Request failed (${response.status})`;
                const err = new Error(message);
                err.status = response.status;
                err.payload = payload;
                throw err;
            }
            return payload;
        });
    };

    const getErrorMessage = (err) => {
        const p = err.payload;
        if (p && Array.isArray(p.errors) && p.errors.length) {
            return p.errors.map((e) => e.message || e.msg).join(' ');
        }
        return err.message || 'Something went wrong.';
    };

    const setAskLoading = (loading) => {
        if (!askAiBtn) return;
        if (!askAiBtn.dataset.defaultHtml) {
            askAiBtn.dataset.defaultHtml = askAiBtn.innerHTML;
        }
        askAiBtn.disabled = loading;
        if (loading) {
            askAiBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';
        } else {
            askAiBtn.innerHTML = askAiBtn.dataset.defaultHtml;
        }
    };

    let sessionHints = [];
    let sessionFinalAnswer = '';
    let sessionQuestion = '';
    let currentHintIndex = 0;

    const resetSession = () => {
        sessionHints = [];
        sessionFinalAnswer = '';
        sessionQuestion = '';
        currentHintIndex = 0;
    };

    const renderFullAnswer = () => {
        fullAnswerContainer.innerHTML = '';
        const head = document.createElement('h4');
        head.style.marginBottom = '10px';
        head.innerHTML =
            '<i class="fa-solid fa-robot" style="color:#2563eb;"></i> AI Explanation:';
        const body = document.createElement('div');
        body.style.whiteSpace = 'pre-wrap';
        body.style.marginBottom = '10px';
        body.textContent = sessionFinalAnswer || '(No answer text.)';
        fullAnswerContainer.appendChild(head);
        fullAnswerContainer.appendChild(body);
    };

    if (askAiBtn) {
        askAiBtn.addEventListener('click', async () => {
            const trimmed = questionInput.value.trim();
            if (!trimmed) {
                alert('Please enter a question first.');
                return;
            }
            if (trimmed.length < ASK_MIN) {
                alert(
                    `Your question must be at least ${ASK_MIN} characters (required by the tutor).`,
                );
                return;
            }
            if (trimmed.length > ASK_MAX) {
                alert(
                    `Your question cannot exceed ${ASK_MAX} characters. Please shorten it.`,
                );
                return;
            }
            if (!localStorage.getItem('token')) {
                alert('Please log in to use the AI Tutor.');
                window.location.href = LOGIN_PATH;
                return;
            }

            setAskLoading(true);
            questionInput.disabled = true;
            try {
                const payload = await postJson('/api/chatbot/ask', {
                    question: trimmed,
                });
                const data = payload && payload.data;
                if (!data) {
                    throw new Error('Unexpected response from server.');
                }
                sessionQuestion = trimmed;
                sessionFinalAnswer = String(data.finalAnswer != null ? data.finalAnswer : '');
                const rawHints = Array.isArray(data.hints) ? data.hints : [];
                sessionHints = rawHints.map(normalizeHint).filter(Boolean);
                currentHintIndex = 0;

                askAiBtn.parentElement.style.display = 'none';
                interactionArea.style.display = 'block';
                choiceActions.style.display = 'flex';
                hintsContainer.innerHTML = '';
                fullAnswerContainer.style.display = 'none';
                postAnswerActions.style.display = 'none';
                interactionTitle.style.display = 'block';
                questionInput.disabled = true;
                setAskLoading(false);

                if (sessionHints.length > 0) {
                    getHintBtn.style.display = 'inline-block';
                } else {
                    getHintBtn.style.display = 'none';
                }
            } catch (err) {
                setAskLoading(false);
                questionInput.disabled = false;
                const msg = getErrorMessage(err);
                if (err.status === 401) {
                    alert(`${msg}\nPlease log in again.`);
                    window.location.href = LOGIN_PATH;
                    return;
                }
                alert(msg);
            }
        });
    }

    if (viewAnswerBtn) {
        viewAnswerBtn.addEventListener('click', () => {
            choiceActions.style.display = 'none';
            interactionTitle.style.display = 'none';
            renderFullAnswer();
            fullAnswerContainer.style.display = 'block';
            postAnswerActions.style.display = 'flex';
        });
    }

    if (getHintBtn) {
        getHintBtn.addEventListener('click', () => {
            if (currentHintIndex >= sessionHints.length) return;
            const hintEl = document.createElement('div');
            hintEl.style.padding = '12px 16px';
            hintEl.style.backgroundColor = 'rgba(202, 138, 4, 0.1)';
            hintEl.style.color = '#ca8a04';
            hintEl.style.borderRadius = '8px';
            hintEl.style.borderLeft = '4px solid #ca8a04';
            hintEl.style.fontSize = '0.95rem';
            const strong = document.createElement('strong');
            strong.innerHTML = '<i class="fa-regular fa-lightbulb"></i> ';
            const span = document.createElement('span');
            span.textContent = sessionHints[currentHintIndex];
            hintEl.appendChild(strong);
            hintEl.appendChild(span);
            hintsContainer.appendChild(hintEl);
            currentHintIndex += 1;
            if (currentHintIndex >= sessionHints.length) {
                getHintBtn.style.display = 'none';
            }
        });
    }

    if (resetChatBtn) {
        resetChatBtn.addEventListener('click', () => {
            questionInput.value = '';
            questionInput.disabled = false;
            askAiBtn.parentElement.style.display = 'flex';
            interactionArea.style.display = 'none';
            resetSession();
            setAskLoading(false);
        });
    }

    if (pushCommunityBtn) {
        pushCommunityBtn.addEventListener('click', () => {
            if (!sessionQuestion || !sessionFinalAnswer) {
                alert('Ask the AI Tutor and view the full answer before posting to the community.');
                return;
            }
            modalQuestionDisplay.textContent = sessionQuestion;
            modalAnswerDisplay.textContent = sessionFinalAnswer;
            modalTitleInput.value = '';
            communityModal.style.display = 'flex';
        });
    }

    const closeModal = () => {
        communityModal.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (confirmPushBtn) {
        confirmPushBtn.addEventListener('click', async () => {
            const title = modalTitleInput.value.trim();
            if (!title) {
                alert('Please enter a title for your community post.');
                return;
            }
            if (!localStorage.getItem('token')) {
                alert('Please log in to publish.');
                window.location.href = LOGIN_PATH;
                return;
            }
            if (!sessionQuestion || !sessionFinalAnswer) {
                alert('Missing question or answer. Start over and try again.');
                return;
            }

            const defaultLabel = confirmPushBtn.innerHTML;
            confirmPushBtn.disabled = true;
            confirmPushBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
            try {
                const payload = await postJson('/api/chatbot/publish', {
                    title,
                    question: sessionQuestion,
                    finalAnswer: sessionFinalAnswer,
                });
                const q = payload && payload.data && payload.data.question;
                const id = q && (q._id || q.id);
                closeModal();
                if (id) {
                    const go = confirm(
                        'Published to the community. Open the new question now?',
                    );
                    if (go) {
                        window.location.href = `../../Community/QuestionID/question.html?id=${encodeURIComponent(id)}`;
                    }
                } else {
                    alert('Published to the community successfully.');
                }
            } catch (err) {
                const msg = getErrorMessage(err);
                if (err.status === 401) {
                    alert(`${msg}\nPlease log in again.`);
                    window.location.href = LOGIN_PATH;
                    return;
                }
                alert(msg);
            } finally {
                confirmPushBtn.disabled = false;
                confirmPushBtn.innerHTML = defaultLabel;
            }
        });
    }
});
