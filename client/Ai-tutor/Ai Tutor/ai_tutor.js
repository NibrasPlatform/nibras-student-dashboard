window.NibrasReact.run(() => {
    const escapeHtml = (value) =>
        String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

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
            <button type="button" class="topic-card" data-topic-title="${escapeHtml(t.title)}" aria-label="Try topic: ${escapeHtml(t.title)}">
                <div class="topic-icon" style="${style}">
                    <i class="${t.icon}"></i>
                </div>
                <div class="topic-info">
                    <h4>${t.title}</h4>
                    <span>${t.sub}</span>
                </div>
            </button>
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
        popContainer.innerHTML += `<button type="button" class="pop-link" data-pop-topic="${escapeHtml(p)}">${p}</button>`;
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
    const sharedAuth = window.NibrasShared?.auth || null;
    const sharedUiStates = window.NibrasShared?.uiStates || null;

    const normalizeHint = (h) => {
        if (h == null) return '';
        if (typeof h === 'string') return h;
        return String(h);
    };

    const getAuthToken = () =>
        sharedAuth?.getToken?.() || window.NibrasApi?.getToken?.() || null;

    const resolveUiStateFromError = (error, fallbackMessage) => {
        if (sharedUiStates?.fromError) {
            return sharedUiStates.fromError(error, fallbackMessage);
        }
        return {
            state: 'error',
            message: error?.message || fallbackMessage || 'Request failed',
        };
    };

    const ensureTutorNotice = () => {
        let notice = document.getElementById('ai-tutor-state-notice');
        if (notice) return notice;

        notice = document.createElement('div');
        notice.id = 'ai-tutor-state-notice';
        notice.hidden = true;

        const initialActions = document.getElementById('initial-actions');
        if (initialActions?.parentNode) {
            initialActions.parentNode.insertBefore(notice, initialActions);
        } else {
            const inputCard = document.querySelector('.input-card');
            if (inputCard) inputCard.appendChild(notice);
        }
        return notice;
    };

    const setTutorNotice = (state, message) => {
        const notice = ensureTutorNotice();
        if (!notice) return;
        notice.setAttribute('role', state === 'error' || state === 'unauthorized' || state === 'forbidden' ? 'alert' : 'status');
        notice.setAttribute('aria-live', state === 'error' || state === 'unauthorized' || state === 'forbidden' ? 'assertive' : 'polite');
        if (sharedUiStates?.render) {
            sharedUiStates.render(notice, { state, message, mode: 'notice' });
            return;
        }
        if (!message) {
            notice.hidden = true;
            notice.textContent = '';
            return;
        }
        notice.hidden = false;
        notice.textContent = message;
        const isErrorTone = state === 'error' || state === 'unauthorized' || state === 'forbidden';
        const isSuccessTone = state === 'success';
        notice.style.marginTop = '12px';
        notice.style.padding = '10px 12px';
        notice.style.borderRadius = '10px';
        notice.style.border = '1px solid';
        notice.style.fontSize = '13px';
        notice.style.color = isErrorTone ? '#ef4444' : (isSuccessTone ? '#10b981' : 'var(--text-secondary)');
        notice.style.borderColor = isErrorTone ? 'rgba(239, 68, 68, 0.35)' : (isSuccessTone ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)');
        notice.style.backgroundColor = isErrorTone ? 'rgba(239, 68, 68, 0.08)' : (isSuccessTone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)');
    };

    const buildAuthHeaders = (headers = {}, options = {}) => {
        if (sharedAuth?.buildAuthHeaders) {
            return sharedAuth.buildAuthHeaders(headers, options);
        }
        if (window.NibrasApi?.buildAuthHeaders) {
            return window.NibrasApi.buildAuthHeaders(headers, options);
        }

        return Object.assign({}, headers);
    };

    const resolveLegacyApiBase = () => {
        const shared = window.NibrasShared;
        return (
            shared?.resolveServiceUrl?.('legacyCommunity') ||
            window.NibrasApi?.resolveServiceUrl?.('legacyCommunity') ||
            window.NibrasApiConfig?.getServiceUrl?.('legacyCommunity') ||
            window.NIBRAS_LEGACY_API_URL ||
            window.NIBRAS_API_URL ||
            shared?.BACKEND_URL ||
            window.NIBRAS_BACKEND_URL ||
            (/^https?:/i.test(window.location?.origin || '') ? window.location.origin.replace(/\/+$/, '') : '')
        );
    };

    const postJson = (path, body) => {
        const shared = window.NibrasShared;
        if (shared && typeof shared.apiFetch === 'function') {
            return shared.apiFetch(path, {
                method: 'POST',
                service: 'legacyCommunity',
                body,
            });
        }
        const BACKEND_URL = resolveLegacyApiBase();
        return fetch(`${BACKEND_URL}${path}`, {
            method: 'POST',
            headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
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
                err.code = response.status === 401 ? 'UNAUTHORIZED' : (response.status === 403 ? 'FORBIDDEN' : 'REQUEST_FAILED');
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

    const extractPayloadData = (payload) => {
        if (payload == null || typeof payload !== 'object') return null;
        return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    };

    const extractQuestionEntity = (payload) => {
        const data = extractPayloadData(payload);
        const candidates = [payload?.question, data?.question, data];
        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
            if (!candidate || typeof candidate !== 'object') continue;
            if (candidate._id || candidate.id) return candidate;
        }
        return null;
    };

    const AI_PUBLISHED_QUESTIONS_KEY = 'nibras_ai_published_questions_v1';
    const normalizeAnswerFingerprint = (value) =>
        String(value || '')
            .replace(/<!--\s*NIBRAS_AI_TUTOR\s*-->/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

    const rememberAiPublishedQuestion = (questionId, answerText) => {
        if (!questionId) return;
        const answerFingerprint = normalizeAnswerFingerprint(answerText);
        if (!answerFingerprint) return;
        try {
            const parsed = JSON.parse(localStorage.getItem(AI_PUBLISHED_QUESTIONS_KEY) || '{}');
            parsed[String(questionId)] = {
                answerFingerprint,
                updatedAt: Date.now(),
            };
            localStorage.setItem(AI_PUBLISHED_QUESTIONS_KEY, JSON.stringify(parsed));
        } catch (_) {
            // no-op when storage is unavailable
        }
    };

    const setAskLoading = (loading) => {
        if (!askAiBtn) return;
        if (!askAiBtn.dataset.defaultHtml) {
            askAiBtn.dataset.defaultHtml = askAiBtn.innerHTML;
        }
        askAiBtn.disabled = loading;
        askAiBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (loading) {
            askAiBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';
        } else {
            askAiBtn.innerHTML = askAiBtn.dataset.defaultHtml;
        }
    };

    const modalTagsDisplay = document.getElementById('modal-tags-display');

    let sessionHints = [];
    let sessionFinalAnswer = '';
    let sessionQuestion = '';
    let sessionTags =[]; // <-- ADDED
    let currentHintIndex = 0;
    let modalReturnFocus = null;

    topicContainer?.addEventListener('click', (event) => {
        const topicButton = event.target.closest('.topic-card[data-topic-title]');
        if (!topicButton || !questionInput) return;
        const topicTitle = topicButton.getAttribute('data-topic-title');
        questionInput.value = `Can you explain ${topicTitle} with an example?`;
        questionInput.focus();
        setTutorNotice('info', `Drafted a starter question for "${topicTitle}".`);
    });

    popContainer?.addEventListener('click', (event) => {
        const popButton = event.target.closest('[data-pop-topic]');
        if (!popButton || !questionInput) return;
        const topic = popButton.getAttribute('data-pop-topic');
        questionInput.value = `I need help with ${topic}. Where should I start?`;
        questionInput.focus();
        setTutorNotice('info', `Added "${topic}" to your question draft.`);
    });

    const resetSession = () => {
        sessionHints = [];
        sessionFinalAnswer = '';
        sessionQuestion = '';
        sessionTags =[]; // <-- ADDED
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
                setTutorNotice('error', 'Please enter a question first.');
                return;
            }
            if (trimmed.length < ASK_MIN) {
                setTutorNotice('error', `Your question must be at least ${ASK_MIN} characters.`);
                return;
            }
            if (trimmed.length > ASK_MAX) {
                setTutorNotice('error', `Your question cannot exceed ${ASK_MAX} characters.`);
                return;
            }
            if (!getAuthToken()) {
                setTutorNotice('unauthorized', 'Please sign in to use the AI Tutor.');
                return;
            }

            setAskLoading(true);
            questionInput.disabled = true;
            setTutorNotice('loading', 'Generating your AI Tutor response...');
            try {
                const chatbotService = window.NibrasServices?.chatbotService || null;
                const payload = chatbotService?.ask
                    ? await chatbotService.ask(trimmed)
                    : await postJson('/community/chatbot/ask', { question: trimmed });
                const data = extractPayloadData(payload);
                if (!data) {
                    throw new Error('Unexpected response from server.');
                }
                sessionQuestion = trimmed;
                sessionFinalAnswer = String(data.finalAnswer != null ? data.finalAnswer : '').trim();
                sessionTags = Array.isArray(data.tags) ? data.tags :[];
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
                setTutorNotice('info', '');

                if (sessionHints.length > 0) {
                    getHintBtn.style.display = 'inline-block';
                } else {
                    getHintBtn.style.display = 'none';
                }
            } catch (err) {
                setAskLoading(false);
                questionInput.disabled = false;
                const msg = getErrorMessage(err);
                const uiState = resolveUiStateFromError(err, msg);
                setTutorNotice(uiState.state, uiState.message);
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
            setTutorNotice('info', '');
        });
    }

    if (pushCommunityBtn) {
        pushCommunityBtn.addEventListener('click', () => {
            if (!sessionQuestion || !sessionFinalAnswer) {
                setTutorNotice('empty', 'Ask the AI Tutor and view the full answer before posting to the community.');
                return;
            }
            modalQuestionDisplay.textContent = sessionQuestion;
            modalAnswerDisplay.textContent = sessionFinalAnswer;
            modalTitleInput.value = '';
                        if (modalTagsDisplay) {
                modalTagsDisplay.innerHTML = '';
                if (sessionTags && sessionTags.length > 0) {
                    sessionTags.forEach(tag => {
                        modalTagsDisplay.innerHTML += `<span style="background: var(--tag-bg, #f3f4f6); color: var(--accent-blue, #2563eb); border: 1px solid var(--accent-blue, #2563eb); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${tag}</span>`;
                    });
                } else {
                    modalTagsDisplay.innerHTML = `<span style="color: #9ca3af; font-size: 0.9rem;">No tags generated</span>`;
                }
            }
            modalReturnFocus = document.activeElement;
            communityModal.style.display = 'flex';
            communityModal.setAttribute('aria-hidden', 'false');
            setTimeout(() => modalTitleInput?.focus(), 40);
        });
    }

    const closeModal = () => {
        communityModal.style.display = 'none';
        communityModal.setAttribute('aria-hidden', 'true');
        if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
            modalReturnFocus.focus();
        }
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (confirmPushBtn) {
        confirmPushBtn.addEventListener('click', async () => {
            const title = modalTitleInput.value.trim();
            if (!title) {
                setTutorNotice('error', 'Please enter a title for your community post.');
                return;
            }
            if (!getAuthToken()) {
                setTutorNotice('unauthorized', 'Please sign in to publish to the community.');
                return;
            }
            if (!sessionQuestion || !sessionFinalAnswer) {
                setTutorNotice('error', 'Missing question or answer. Start over and try again.');
                return;
            }

            const defaultLabel = confirmPushBtn.innerHTML;
            confirmPushBtn.disabled = true;
            confirmPushBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
            setTutorNotice('loading', 'Publishing your AI answer to the community...');
            try {
                const chatbotService = window.NibrasServices?.chatbotService || null;
                const payload = chatbotService?.publish
                    ? await chatbotService.publish({
                        title,
                        question: sessionQuestion,
                        finalAnswer: sessionFinalAnswer,
                        tags: sessionTags,
                    })
                    : await postJson('/community/chatbot/publish', {
                    title,
                    question: sessionQuestion,
                    finalAnswer: sessionFinalAnswer,
                    tags: sessionTags,
                });
                const q = extractQuestionEntity(payload);
                const id = q && (q._id || q.id);
                rememberAiPublishedQuestion(id, sessionFinalAnswer);
                closeModal();
                if (id) {
                    const go = confirm(
                        'Published to the community. Open the new question now?',
                    );
                    if (go) {
                        window.location.href = `../../Community/QuestionID/question.html?id=${encodeURIComponent(id)}`;
                    } else {
                        setTutorNotice('success', 'Published successfully. You can find the new post in Community.');
                    }
                } else {
                    setTutorNotice('success', 'Published to the community successfully.');
                }
            } catch (err) {
                const msg = getErrorMessage(err);
                const uiState = resolveUiStateFromError(err, msg);
                setTutorNotice(uiState.state, uiState.message);
            } finally {
                confirmPushBtn.disabled = false;
                confirmPushBtn.innerHTML = defaultLabel;
            }
        });
    }

    document.addEventListener('click', (event) => {
        if (event.target === communityModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && communityModal?.style.display === 'flex') {
            closeModal();
        }
    });
});
