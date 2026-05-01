window.NibrasReact.run(() => {

    // --- CONFIGURATION ---
    const DEFAULT_LEGACY_COMMUNITY_URL = 'https://nibras-backend.up.railway.app/api';
    const BACKEND_URL =
        window.NibrasShared?.resolveServiceUrl?.('legacyCommunity') ||
        window.NibrasApi?.resolveServiceUrl?.('legacyCommunity') ||
        window.NibrasApiConfig?.getServiceUrl?.('legacyCommunity') ||
        window.NIBRAS_LEGACY_API_URL ||
        window.NIBRAS_API_URL ||
        window.NIBRAS_BACKEND_URL ||
        DEFAULT_LEGACY_COMMUNITY_URL;
    const sharedAuth = window.NibrasShared?.auth || null;
    const sharedApiFetch = window.NibrasShared?.apiFetch || null;
    const sharedUiStates = window.NibrasShared?.uiStates || null;

    // --- STATE ---
    let currentQuestionData = null;
    let currentQuestionId = null;
    let currentUserId = null;
    let currentUserRole = null;
    const AI_TUTOR_MARKER = '<!--NIBRAS_AI_TUTOR-->';
    const AI_PUBLISHED_QUESTIONS_KEY = 'nibras_ai_published_questions_v1';


    // --- SOCKET.IO SETUP ---
    let socket = null;
    let socketIoPromise = null;
    const voteValueCache = new Map();
    const voteValueInFlight = new Map();

    function normalizeBaseUrl(url) {
        return String(url || '').trim().replace(/\/+$/, '');
    }

    function dedupeList(values) {
        return Array.from(new Set(values.filter(Boolean)));
    }

    function normalizePath(path) {
        if (!path) return '/';
        return String(path).startsWith('/') ? String(path) : `/${String(path)}`;
    }

    function buildCommunityBaseCandidates() {
        const seeds = [
            BACKEND_URL,
            window.NibrasShared?.resolveServiceUrl?.('legacyCommunity'),
            window.NibrasApi?.resolveServiceUrl?.('legacyCommunity'),
            window.NibrasApiConfig?.getServiceUrl?.('legacyCommunity'),
            window.NIBRAS_LEGACY_API_URL,
            DEFAULT_LEGACY_COMMUNITY_URL,
        ];

        const bases = [];
        seeds.forEach((seed) => {
            const normalized = normalizeBaseUrl(seed);
            if (!normalized) return;
            bases.push(normalized);
            if (/\/api$/i.test(normalized)) {
                bases.push(normalized.replace(/\/api$/i, ''));
            } else {
                bases.push(`${normalized}/api`);
            }
        });

        return dedupeList(bases);
    }

    function buildPathCandidates(path) {
        const normalized = normalizePath(path);
        const isAuthPath = /^\/(?:api\/)?auth(?:\/|$)/i.test(normalized);
        const isCommunityPath = /^\/(?:api\/)?community(?:\/|$)/i.test(normalized);

        if (isAuthPath) {
            return dedupeList([
                normalized.startsWith('/api/') ? normalized.replace(/^\/api/i, '') || '/' : normalized,
                normalized.startsWith('/api/') ? normalized : `/api${normalized}`,
            ]);
        }

        const communityPath = isCommunityPath
            ? (normalized.startsWith('/api/') ? normalized.replace(/^\/api/i, '') : normalized)
            : `/community${normalized}`;

        return dedupeList([
            communityPath,
            `/api${communityPath}`,
            normalized.startsWith('/api/') ? normalized.replace(/^\/api/i, '') || '/' : normalized,
            normalized.startsWith('/api/') ? normalized : `/api${normalized}`,
        ]);
    }

    let activeCommunityBaseUrl = normalizeBaseUrl(BACKEND_URL) || DEFAULT_LEGACY_COMMUNITY_URL;

    function toSocketBaseUrl(url) {
        const normalized = normalizeBaseUrl(url);
        if (!normalized) return '';
        return normalized.replace(/\/api(?:\/community)?$/i, '');
    }

    function getSocketBaseUrl() {
        return toSocketBaseUrl(activeCommunityBaseUrl) || toSocketBaseUrl(BACKEND_URL) || 'https://nibras-backend.up.railway.app';
    }

    function ensureSocketIoLoaded() {
        if (typeof io !== 'undefined') {
            return Promise.resolve(true);
        }
        if (socketIoPromise) {
            return socketIoPromise;
        }

        const socketScriptUrl = `${getSocketBaseUrl()}/socket.io/socket.io.js`;
        socketIoPromise = new Promise((resolve) => {
            const existingScript = Array.from(document.scripts).find((script) => script.src === socketScriptUrl);
            if (existingScript) {
                if (typeof io !== 'undefined') {
                    resolve(true);
                    return;
                }
                existingScript.addEventListener('load', () => resolve(typeof io !== 'undefined'), { once: true });
                existingScript.addEventListener('error', () => resolve(false), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = socketScriptUrl;
            script.async = true;
            script.addEventListener('load', () => resolve(typeof io !== 'undefined'), { once: true });
            script.addEventListener('error', () => resolve(false), { once: true });
            document.head.appendChild(script);
        });

        return socketIoPromise;
    }

    function initSocket(questionId) {
        if (typeof io === 'undefined') {
            console.log('Socket.io not available');
            return;
        }
        socket = io(getSocketBaseUrl());
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('question:join', questionId);
        });
        socket.on('answer:created', (data) => {
            console.log('New answer received:', data);
            loadQuestion(questionId);
        });
        socket.on('vote:updated', (data) => {
            console.log('Vote updated:', data);
            const voteBox = document.querySelector(`.q-vote-box[data-type="${data.targetType === 'question' ? 'question' : 'comment'}"][data-id="${data.targetId}"]`);
            if (voteBox) {
                const countSpan = voteBox.querySelector('.vote-count');
                if (countSpan) {
                    countSpan.innerText = data.votesCount;
                }
            }
        });
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    function disconnectSocket() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }

    let answerEditor = null;
    let editEditor = null;

    function renderMarkdown(text) {
        if (!text) return "";
        return DOMPurify.sanitize(marked.parse(text));
    }

    // --- HELPER FUNCTIONS ---
    function getToken() {
        return sharedAuth?.getToken?.() || window.NibrasApi?.getToken?.() || localStorage.getItem('token') || null;
    }

    function buildAuthHeaders(headers = {}, options = {}) {
        if (sharedAuth?.buildAuthHeaders) {
            return sharedAuth.buildAuthHeaders(headers, options);
        }
        if (window.NibrasApi?.buildAuthHeaders) {
            return window.NibrasApi.buildAuthHeaders(headers, options);
        }

        return Object.assign({}, headers);
    }

    function resolveUiStateFromError(error, fallbackMessage) {
        if (sharedUiStates?.fromError) {
            return sharedUiStates.fromError(error, fallbackMessage);
        }
        return {
            state: 'error',
            message: error?.message || fallbackMessage || 'Request failed',
        };
    }

    async function requestLegacyApi(path, options = {}) {
        const method = String(options.method || 'GET').toUpperCase();
        const authEnabled = options.auth !== false;
        const headers = Object.assign({}, options.headers || {});
        const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
        const hasBody = Object.prototype.hasOwnProperty.call(options, 'body') && options.body != null;
        const isJsonBody = hasBody && typeof options.body === 'object' && !(options.body instanceof FormData);
        const baseCandidates = buildCommunityBaseCandidates();
        const pathCandidates = buildPathCandidates(path);

        if (authEnabled) {
            Object.assign(headers, buildAuthHeaders(headers));
        }
        if (isJsonBody && !hasContentType) {
            headers['Content-Type'] = 'application/json';
        }

        let lastError = null;
        for (const baseUrl of baseCandidates) {
            for (const candidatePath of pathCandidates) {
                if (typeof sharedApiFetch === 'function') {
                    try {
                        const data = await sharedApiFetch(candidatePath, Object.assign({}, options, {
                            service: 'legacyCommunity',
                            baseUrl,
                            headers,
                        }));
                        activeCommunityBaseUrl = normalizeBaseUrl(baseUrl) || activeCommunityBaseUrl;
                        return data;
                    } catch (error) {
                        lastError = error;
                        const status = Number(error?.status || 0);
                        if (status === 401 || status === 403) throw error;
                        if (status !== 404 && status !== 0) throw error;
                        continue;
                    }
                }

                const response = await fetch(`${baseUrl}${candidatePath}`, {
                    method,
                    headers,
                    body: isJsonBody ? JSON.stringify(options.body) : options.body,
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (_) {
                    payload = null;
                }

                if (!response.ok) {
                    const err = new Error(
                        payload?.message ||
                        payload?.error ||
                        `Request failed (${response.status})`
                    );
                    err.status = response.status;
                    err.code = response.status === 401 ? 'UNAUTHORIZED' : (response.status === 403 ? 'FORBIDDEN' : 'REQUEST_FAILED');
                    err.payload = payload;
                    lastError = err;
                    if (response.status === 401 || response.status === 403) throw err;
                    if (response.status !== 404) throw err;
                    continue;
                }

                activeCommunityBaseUrl = normalizeBaseUrl(baseUrl) || activeCommunityBaseUrl;
                return payload;
            }
        }

        if (lastError) throw lastError;
        throw new Error('Request failed');
    }

    function getQuestionIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function extractEntityId(entity) {
        if (entity == null) return null;
        if (typeof entity === 'object') {
            return entity._id || entity.id || entity.userId || null;
        }
        return entity;
    }

    function normalizeRole(roleValue) {
        if (roleValue == null) return '';
        if (typeof roleValue === 'object') {
            const nestedRole = roleValue.name || roleValue.slug || roleValue.title || roleValue.role || '';
            return String(nestedRole).trim().toLowerCase();
        }
        return String(roleValue).trim().toLowerCase();
    }

    function formatRoleLabel(roleValue, fallback = 'student') {
        const normalized = normalizeRole(roleValue) || fallback;
        return normalized
            .split(/[\s_-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    function isAdminRole(roleValue) {
        const role = normalizeRole(roleValue);
        return role === 'admin' || role === 'super admin' || role === 'super_admin' || role === 'super-admin';
    }

    function isOwner(authorId) {
        return Boolean(currentUserId && authorId && String(authorId) === String(currentUserId));
    }

    function canEditQuestion(questionData) {
        return isOwner(questionData?.authorId);
    }

    function canDeleteQuestion(questionData) {
        return canEditQuestion(questionData) || isAdminRole(currentUserRole);
    }

    function canEditAnswer(answerData) {
        if (answerData?.isFromAI) return false;
        return isOwner(answerData?.authorId);
    }

    function canDeleteAnswer(answerData) {
        if (answerData?.isFromAI) return false;
        return canEditAnswer(answerData) || isAdminRole(currentUserRole);
    }

    function extractAuthUser(payload) {
        if (payload == null || typeof payload !== 'object') return null;
        const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
        const user = data.user || payload.user || null;
        if (user && typeof user === 'object') return user;
        if (data && typeof data === 'object' && (data._id || data.id)) return data;
        return null;
    }

    function stripAiTutorMarker(text) {
        return String(text || '').replace(/<!--\s*NIBRAS_AI_TUTOR\s*-->/gi, '').trim();
    }

    function hasAiTutorMarker(text) {
        return /<!--\s*NIBRAS_AI_TUTOR\s*-->/i.test(String(text || ''));
    }

    function normalizeAnswerFingerprint(value) {
        return stripAiTutorMarker(value)
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function readAiPublishedQuestionMeta(questionId) {
        if (!questionId) return null;
        try {
            const parsed = JSON.parse(localStorage.getItem(AI_PUBLISHED_QUESTIONS_KEY) || '{}');
            return parsed[String(questionId)] || null;
        } catch (_) {
            return null;
        }
    }

    function isBackendMarkedAi(comment) {
        return Boolean(
            comment?.isFromAI ||
            comment?.isFromAi ||
            comment?.aiGenerated ||
            comment?.isAI ||
            comment?.isAi ||
            comment?.metadata?.isFromAI ||
            comment?.meta?.isFromAI ||
            normalizeRole(comment?.source) === 'ai_tutor' ||
            normalizeRole(comment?.origin) === 'ai_tutor'
        );
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

    function setAnswerComposerVisibility(isVisible) {
        const answerHeader = document.getElementById('answers-count-header');
        const answerSection = document.querySelector('.your-answer-section');
        if (answerHeader) {
            answerHeader.style.display = isVisible ? '' : 'none';
        }
        if (answerSection) {
            answerSection.style.display = isVisible ? '' : 'none';
            answerSection.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
        }
    }

    function showError(message, state = 'error') {
        const detailMain = document.getElementById('q-main-content');
        if (!detailMain) return;
        if (sharedUiStates?.render) {
            sharedUiStates.render(detailMain, { state, message });
        } else {
            detailMain.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--tag-red-text, #dc2626);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; margin-bottom:1rem;"></i>
                    <h2>Error</h2>
                    <p>${message}</p>
                </div>
            `;
        }
        const backLink = document.createElement('a');
        backLink.href = '../community.html';
        backLink.className = 'btn-back';
        backLink.style.marginTop = '1rem';
        backLink.style.display = 'inline-block';
        backLink.style.fontWeight = '600';
        backLink.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Back to Community';
        detailMain.appendChild(backLink);
        setAnswerComposerVisibility(false);
    }

    function showLoading() {
        const detailMain = document.getElementById('q-main-content');
        if (!detailMain) return;
        if (sharedUiStates?.render) {
            sharedUiStates.render(detailMain, { state: 'loading', message: 'Loading question...' });
        } else {
            detailMain.innerHTML = `
                <div style="text-align:center; padding:2rem;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-blue);"></i>
                    <p style="margin-top:1rem;">Loading question...</p>
                </div>
            `;
        }
        setAnswerComposerVisibility(true);
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
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
        toast.style.color = '#ffffff';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        toast.style.transition = 'opacity 250ms ease, transform 250ms ease';
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            setTimeout(() => toast.remove(), 250);
        }, 2500);
    }

    // --- SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- AUTH FETCH ---
    async function loadCurrentUser() {
        const token = getToken();
        if (!token) return;
        try {
            const data = await requestLegacyApi('/auth/me');
            const user = extractAuthUser(data);
            if (user) {
                currentUserId = extractEntityId(user);
                currentUserRole = normalizeRole(user.role);
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    // --- DATA FETCHING ---
    async function loadQuestion(questionId) {
        currentQuestionId = questionId;
        
        // Only show loading state if we don't already have the data
        if (!currentQuestionData) showLoading();

        try {
            const data = await requestLegacyApi(`/questions/${questionId}`, { auth: false });
            const payload = data?.data && typeof data.data === 'object' ? data.data : data;
            const question = payload?.question || data?.question;
            const comments = payload?.answers || payload?.comments || data?.answers || data?.comments || [];
            const localAiMeta = readAiPublishedQuestionMeta(questionId);

            if (!question) {
                showError('Question not found.', 'empty');
                return;
            }

            currentQuestionData = {
                id: question._id,
                title: question.title,
                body: question.body,
                authorId: extractEntityId(question.author),
                author: question.author?.name || 'Unknown',
                authorInitials: getInitials(question.author?.name),
                votes: question.votesCount || 0,
                views: question.views || 0,
                createdAt: question.createdAt,
                time: formatTimeAgo(question.createdAt),
                tags: question.tags ||[],
                authorRole: normalizeRole(question.author?.role) || 'student',
                authorRep: question.author?.reputation || 0,
                replies: comments.map(comment => {
                    const rawBody = String(comment.body || '');
                    const normalizedBody = stripAiTutorMarker(rawBody);
                    const markedByBackend = isBackendMarkedAi(comment);
                    const markedByMarker = hasAiTutorMarker(rawBody);
                    const markedByLocalMeta =
                        Boolean(localAiMeta?.answerFingerprint) &&
                        normalizeAnswerFingerprint(normalizedBody) === String(localAiMeta.answerFingerprint || '');
                    const isFromAI = Boolean(markedByBackend || markedByMarker || markedByLocalMeta);

                    return {
                    id: comment._id,
                    authorId: isFromAI ? '__ai_tutor__' : extractEntityId(comment.author),
                    votes: comment.votesCount || 0,
                    author: isFromAI ? 'AI Tutor' : (comment.author?.name || 'Unknown'),
                    authorRole: isFromAI ? 'ai_tutor' : (normalizeRole(comment.author?.role) || 'student'),
                    authorRep: comment.author?.reputation || 0,
                    initials: isFromAI ? 'AI' : getInitials(comment.author?.name),
                    time: formatTimeAgo(comment.createdAt),
                    createdAt: comment.createdAt,
                    text: normalizedBody,
                    isPinned: comment.isPinned,
                    isFromAI,
                };
                })
            };

            renderDetailView(currentQuestionData);
            if (!socket) {
                ensureSocketIoLoaded().then((isSocketReady) => {
                    if (isSocketReady && !socket) {
                        initSocket(questionId);
                    }
                });
            }

        } catch (error) {
            console.error('Error loading question:', error);
            const stateInfo = resolveUiStateFromError(error, 'Failed to load question. Please try again.');
            showError(stateInfo.message, stateInfo.state);
        }
    }

    // --- RENDER FUNCTION ---
    function renderDetailView(q) {
        const isAdmin = isAdminRole(currentUserRole);
        setAnswerComposerVisibility(true);

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

        // Question Setting Menu
        let actionMenuHtml = '';
        const isQuestionAuthor = canEditQuestion(q);

        if (canDeleteQuestion(q)) {
            actionMenuHtml = `
                <div class="q-settings-dropdown" style="position: relative; display: inline-block;">
                    <button type="button" class="fa-solid fa-ellipsis-vertical action-menu-btn" style="background:none; border:none; cursor: pointer; padding: 4px 10px; font-size: 1.15rem; color: var(--text-secondary);" title="More options" aria-label="Open question actions"></button>
                    
                    <div class="action-menu-content" style="display: none; position: absolute; top: 100%; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 0; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.15); min-width: 150px; margin-top: 5px;">
                        
                        ${isQuestionAuthor ? `
                        <button type="button" class="menu-item edit-q-btn" style="width:100%; text-align:left; background:none; border:none; padding: 10px 16px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: 0.2s;">
                            <i class="fa-solid fa-pen" style="font-size: 0.85rem;"></i> Edit Question
                        </button>
                        ` : ''}

                        <button type="button" class="menu-item delete-q-btn" style="width:100%; text-align:left; background:none; border:none; padding: 10px 16px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; color: #ef4444; transition: 0.2s;">
                            <i class="fa-solid fa-trash" style="font-size: 0.85rem;"></i> Delete
                        </button>

                    </div>
                </div>
            `;
        }

        // B. Render Main Question
        const detailMain = document.getElementById('q-main-content');
        detailMain.innerHTML = `
            <div class="q-vote-box" data-type="question" data-id="${q.id}">
                <button type="button" class="fa-solid fa-chevron-up vote-arrow up" data-type="question" data-id="${q.id}" aria-label="Upvote question" aria-pressed="false"></button>
                <span class="vote-count">${q.votes}</span>
                <button type="button" class="fa-solid fa-chevron-down vote-arrow down" data-type="question" data-id="${q.id}" aria-label="Downvote question" aria-pressed="false"></button>
            </div>
            <div class="detail-content">
                <h1 class="detail-title">${q.title}</h1>
                <div class="detail-body markdown-body">${renderMarkdown(q.body)}</div>
                <div class="detail-tags">${tagHtml}</div>
                <div class="detail-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="detail-actions" style="display: flex; align-items: center; gap: 14px;">
                        <span>Asked ${q.time}</span>
                        <span style="margin: 0 -4px;">•</span>
                        <span>${q.views} views</span>
                        <button type="button" class="fa-solid fa-share-nodes share-q-btn" title="Copy link" aria-label="Copy question link" style="background:none; border:none; cursor: pointer; font-size: 1.15rem; color: var(--accent-blue); transition: 0.2s;"></button>
                        ${actionMenuHtml}
                    </div>
                    <div class="detail-author-box">
                        <div class="author-av" style="width:36px; height:36px;">${q.authorInitials}</div>
                        <div class="detail-author-info">
                            <span class="detail-author-name">${q.author}</span>
                            <span class="detail-author-meta">${q.authorRep} rep • ${formatRoleLabel(q.authorRole)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // C. Render Answers
        document.getElementById('answers-count-header').textContent = `${q.replies.length} Answer${q.replies.length !== 1 ? 's' : ''}`;
        const ansContainer = document.getElementById('answers-container');
        let answersHtml = '';

        q.replies.forEach(ans => {
            let roleBadge = '';
            let roleColor = 'bg-blue';
            if (ans.isFromAI) {
                roleColor = 'bg-purple';
                roleBadge = `<span class="contrib-badge ${roleColor}">AI Tutor</span>`;
            } else if (ans.authorRole === 'instructor') {
                roleColor = 'bg-blue';
                roleBadge = `<span class="contrib-badge ${roleColor}">Instructor</span>`;
            } else if (ans.authorRole === 'admin') {
                roleColor = 'bg-purple';
                roleBadge = `<span class="contrib-badge ${roleColor}">Admin</span>`;
            }

            const pinnedBadge = ans.isPinned ? `<span class="contrib-badge bg-green" style="margin-left:8px;"><i class="fa-solid fa-thumbtack"></i> Pinned</span>` : '';

            // --- COMMENT ACTION MENU LOGIC ---
            const isCommentAuthor = canEditAnswer(ans);
            const canDeleteComment = canDeleteAnswer(ans);
            let commentActionMenuHtml = '';

            if (canDeleteComment) {
                commentActionMenuHtml = `
                    <div class="q-settings-dropdown" style="position: relative; display: inline-block;">
                        <button type="button" class="fa-solid fa-ellipsis-vertical action-menu-btn" style="background:none; border:none; cursor: pointer; padding: 4px 10px; font-size: 1.15rem; color: var(--text-secondary);" title="More options" aria-label="Open answer actions"></button>
                        
                        <div class="action-menu-content" style="display: none; position: absolute; top: 100%; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 0; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.15); min-width: 150px; margin-top: 5px;">
                            
                            ${isCommentAuthor ? `
                            <button type="button" class="menu-item edit-comment-btn" style="width:100%; text-align:left; background:none; border:none; padding: 10px 16px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: 0.2s;">
                                <i class="fa-solid fa-pen" style="font-size: 0.85rem;"></i> Edit Answer
                            </button>
                            ` : ''}

                            ${canDeleteComment ? `
                            <button type="button" class="menu-item delete-comment-btn" style="width:100%; text-align:left; background:none; border:none; padding: 10px 16px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; color: #ef4444; transition: 0.2s;">
                                <i class="fa-solid fa-trash" style="font-size: 0.85rem;"></i> Delete
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            answersHtml += `
                <div class="answer-card" data-comment-id="${ans.id}">
                    <div class="q-vote-box" data-type="comment" data-id="${ans.id}">
                        <button type="button" class="fa-solid fa-chevron-up vote-arrow up" data-type="comment" data-id="${ans.id}" aria-label="Upvote answer" aria-pressed="false"></button>
                        <span class="vote-count">${ans.votes}</span>
                        <button type="button" class="fa-solid fa-chevron-down vote-arrow down" data-type="comment" data-id="${ans.id}" aria-label="Downvote answer" aria-pressed="false"></button>
                    </div>
                    <div class="detail-content">
                        <div class="detail-body markdown-body" style="margin-bottom:1.5rem">${renderMarkdown(ans.text)}</div>
                        <div class="detail-footer" style="display:flex; justify-content:space-between; align-items:center;">
                            <div class="detail-actions" style="display:flex; align-items:center; gap:14px;">
                                <span>${ans.time}</span>
                                ${commentActionMenuHtml}
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
        ansContainer.innerHTML = answersHtml || `
            <div style="text-align:center; padding:1.25rem; border:1px dashed var(--border-color); border-radius:8px; color:var(--text-secondary);">
                No answers yet. Be the first to help by posting a clear explanation.
            </div>
        `;

        loadUserVotes();

        setTimeout(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }, 10);
    }

    // --- GLOBAL CLICK LISTENER FOR MENU & ACTIONS ---
    document.body.addEventListener('click', async (e) => {
        // 1. Handle Share Link Click
        const shareButton = e.target.closest('.share-q-btn');
        if (shareButton) {
            const shareUrl = new URL(window.location.href);
            shareUrl.searchParams.set('id', currentQuestionId);
            shareUrl.hash = '';
            navigator.clipboard.writeText(shareUrl.toString())
                .then(() => showToast('Link copied to clipboard!'))
                .catch(() => showToast('Unable to copy link right now.', 'error'));
            return;
        }

        // 2. Handle 3-Dot Dropdown Toggling
        const menuButton = e.target.closest('.action-menu-btn');
        const menus = document.querySelectorAll('.action-menu-content');
        
        if (menuButton) {
            const menu = menuButton.nextElementSibling;
            const isCurrentlyVisible = menu.style.display === 'block';
            menus.forEach(m => m.style.display = 'none'); // Close others
            if (!isCurrentlyVisible) menu.style.display = 'block';
            return;
        } else {
            // Close dropdowns if clicked outside
            menus.forEach(m => m.style.display = 'none');
        }

        // ------------------------------------
        // EDIT & DELETE: QUESTIONS
        // ------------------------------------
        const editBtn = e.target.closest('.edit-q-btn');
        if (editBtn) {
            if (!canEditQuestion(currentQuestionData)) {
                showToast('You can only edit your own question.', 'error');
                return;
            }
            modalInvoker = editBtn;
            document.querySelector('#editModal h2').innerText = 'Edit Question';
            document.getElementById('edit-question-title').parentElement.style.display = 'block'; // Show title
            document.getElementById('edit-question-title').value = currentQuestionData.title;
            document.getElementById('edit-question-body').value = currentQuestionData.body;
            
            document.getElementById('saveEditBtn').dataset.editType = 'question';
            document.getElementById('editModal').style.display = 'flex';
            document.getElementById('editModal').setAttribute('aria-hidden', 'false');
            initEditEditor(currentQuestionData.body);
            setTimeout(() => document.getElementById('edit-question-title')?.focus(), 30);
            return;
        }

        const deleteBtn = e.target.closest('.delete-q-btn');
        if (deleteBtn) {
            if (!canDeleteQuestion(currentQuestionData)) {
                showToast('You do not have permission to delete this question.', 'error');
                return;
            }
            if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
                try {
                    await requestLegacyApi(`/questions/${currentQuestionId}`, {
                        method: 'DELETE',
                    });
                    showToast('Question deleted successfully!');
                    setTimeout(() => { window.location.href = '../community.html'; }, 1000);
                } catch (error) {
                    console.error("Deletion error:", error);
                    showToast(error.message || 'An error occurred while deleting the question.', 'error');
                }
            }
            return;
        }

        // ------------------------------------
        // EDIT & DELETE: COMMENTS (ANSWERS)
        // ------------------------------------
        const editCommentBtn = e.target.closest('.edit-comment-btn');
        if (editCommentBtn) {
            modalInvoker = editCommentBtn;
            const commentCard = e.target.closest('.answer-card');
            const commentId = commentCard.dataset.commentId;
            const commentData = currentQuestionData.replies.find(r => r.id === commentId);
            if (commentData?.isFromAI) {
                showToast('AI Tutor answers are locked and cannot be edited.', 'error');
                return;
            }
            if (!canEditAnswer(commentData)) {
                showToast('You can only edit your own answer.', 'error');
                return;
            }
            
            document.querySelector('#editModal h2').innerText = 'Edit Answer';
            document.getElementById('edit-question-title').parentElement.style.display = 'none'; // Hide title input!
            document.getElementById('edit-question-body').value = commentData.text;
            
            document.getElementById('saveEditBtn').dataset.editType = 'comment';
            document.getElementById('saveEditBtn').dataset.editId = commentId;
            document.getElementById('editModal').style.display = 'flex';
            document.getElementById('editModal').setAttribute('aria-hidden', 'false');
            initEditEditor(commentData.text)
            setTimeout(() => editEditor?.codemirror?.focus?.(), 30);
            return;
        }

        // HELPER TO INIT EDIT EDITOR
        function initEditEditor(initialValue) {
            if (!editEditor) {
                editEditor = new EasyMDE({
                    element: document.getElementById('edit-question-body'),
                    spellChecker: false
                });
            }
            editEditor.value(initialValue);
            setTimeout(() => editEditor.codemirror.refresh(), 50); 
        }

        const deleteCommentBtn = e.target.closest('.delete-comment-btn');
        if (deleteCommentBtn) {
            const commentCard = e.target.closest('.answer-card');
            const commentId = commentCard?.dataset?.commentId;
            const commentData = currentQuestionData.replies.find(r => String(r.id) === String(commentId));
            if (commentData?.isFromAI) {
                showToast('AI Tutor answers are locked and cannot be deleted.', 'error');
                return;
            }
            if (!canDeleteAnswer(commentData)) {
                showToast('You do not have permission to delete this answer.', 'error');
                return;
            }
            if (confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
                try {
                    await requestLegacyApi(`/answers/${currentQuestionId}/${commentId}`, {
                        method: 'DELETE',
                    });
                    showToast('Answer deleted successfully!');
                    await loadQuestion(currentQuestionId); // Refresh Data
                } catch (error) {
                    console.error("Deletion error:", error);
                    showToast(error.message || 'An error occurred while deleting the answer.', 'error');
                }
            }
            return;
        }
    });

    // --- DYNAMIC MODAL SAVE LOGIC ---
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    let modalInvoker = null;

    const closeModalFunc = () => {
        if (editModal) {
            editModal.style.display = 'none';
            editModal.setAttribute('aria-hidden', 'true');
        }
        if (modalInvoker && typeof modalInvoker.focus === 'function') {
            modalInvoker.focus();
        }
    };

    if (closeEditModal) closeEditModal.addEventListener('click', closeModalFunc);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeModalFunc);
    document.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeModalFunc();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && editModal?.style.display === 'flex') {
            closeModalFunc();
        }
    });

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', async () => {
            const editType = saveEditBtn.dataset.editType;
            const newBody = editEditor ? editEditor.value().trim() : document.getElementById('edit-question-body').value.trim();
            
            saveEditBtn.disabled = true;
            const origText = saveEditBtn.innerHTML;
            saveEditBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                let endpointPath, method, payload;

                if (editType === 'question') {
                    if (!canEditQuestion(currentQuestionData)) {
                        throw new Error('You can only edit your own question.');
                    }
                    const newTitle = document.getElementById('edit-question-title').value.trim();
                    if (!newTitle || !newBody) throw new Error('Title and details cannot be empty.');
                    
                    endpointPath = `/questions/${currentQuestionId}`;
                    method = 'PATCH';
                    payload = { title: newTitle, body: newBody };

                } else if (editType === 'comment') {
                    const commentId = saveEditBtn.dataset.editId;
                    const commentData = currentQuestionData.replies.find(r => String(r.id) === String(commentId));
                    if (commentData?.isFromAI) {
                        throw new Error('AI Tutor answers are locked and cannot be edited.');
                    }
                    if (!canEditAnswer(commentData)) {
                        throw new Error('You can only edit your own answer.');
                    }
                    if (!newBody) throw new Error('Answer cannot be empty.');

                    endpointPath = `/answers/${currentQuestionId}/${commentId}`;
                    method = 'PATCH';
                    payload = { body: newBody };
                }

                await requestLegacyApi(endpointPath, {
                    method: method,
                    body: payload,
                });
                closeModalFunc();
                showToast(`${editType === 'question' ? 'Question' : 'Answer'} updated successfully!`);
                await loadQuestion(currentQuestionId); // Refresh Data
            } catch (error) {
                console.error("Update error:", error);
                showToast(error.message || 'An error occurred while saving.', 'error');
            } finally {
                saveEditBtn.disabled = false;
                saveEditBtn.innerHTML = origText;
            }
        });
    }

    // --- VOTING LOGIC ---
    async function fetchVoteValue(targetType, targetId) {
        const cacheKey = `${targetType}:${targetId}`;
        if (voteValueCache.has(cacheKey)) {
            return voteValueCache.get(cacheKey);
        }
        if (voteValueInFlight.has(cacheKey)) {
            return voteValueInFlight.get(cacheKey);
        }

        const requestPromise = requestLegacyApi(`/votes/${targetType}/${targetId}`)
            .then((data) => {
                const voteValue = Number(data.vote?.value || 0);
                voteValueCache.set(cacheKey, voteValue);
                return voteValue;
            })
            .catch(() => null)
            .finally(() => {
                voteValueInFlight.delete(cacheKey);
            });

        voteValueInFlight.set(cacheKey, requestPromise);
        return requestPromise;
    }

    async function loadUserVotes() {
        const token = getToken();
        if (!token || !currentQuestionData) return;

        try {
            const voteTargets = [
                { type: 'question', apiType: 'question', id: currentQuestionData.id },
                ...currentQuestionData.replies.map((reply) => ({
                    type: 'comment',
                    apiType: 'answer',
                    id: reply.id,
                })),
            ];

            const pendingTargets = [];
            voteTargets.forEach((target) => {
                const cacheKey = `${target.apiType}:${target.id}`;
                if (voteValueCache.has(cacheKey)) {
                    updateVoteUI(target.type, target.id, Number(voteValueCache.get(cacheKey) ?? 0));
                    return;
                }
                pendingTargets.push(target);
            });

            if (pendingTargets.length === 0) return;

            await Promise.all(pendingTargets.map(async (target) => {
                const voteValue = await fetchVoteValue(target.apiType, target.id);
                if (voteValue == null) return;
                updateVoteUI(target.type, target.id, voteValue);
            }));
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
        upBtn?.setAttribute('aria-pressed', value === 1 ? 'true' : 'false');
        downBtn?.setAttribute('aria-pressed', value === -1 ? 'true' : 'false');
    }

    const pageVotes = new Map(); 

    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('vote-arrow')) {
            const btn = e.target;
            const type = btn.dataset.type;
            const targetId = btn.dataset.id;
            const voteBox = btn.closest('.q-vote-box');
            const countSpan = voteBox.querySelector('.vote-count');
            const currentVotes = parseInt(countSpan.innerText);

            const token = getToken();
            if (!token) {
                showToast('Please sign in to vote on this post.', 'error');
                return;
            }

            const upBtn = voteBox.querySelector('.up');
            const downBtn = voteBox.querySelector('.down');
            const wasUpvoted = upBtn.classList.contains('active');
            const wasDownvoted = downBtn.classList.contains('active');
            const currentUserVote = wasUpvoted ? 1 : (wasDownvoted ? -1 : 0);

            let voteValue;
            let newActiveState;

            if (btn.classList.contains('up')) {
                if (wasUpvoted) { voteValue = 0; newActiveState = 0; } 
                else { voteValue = 1; newActiveState = 1; }
            } else {
                if (wasDownvoted) { voteValue = 0; newActiveState = 0; } 
                else { voteValue = -1; newActiveState = -1; }
            }

            updateVoteUI(type, targetId, newActiveState);

            let expectedVotes = currentVotes;
            if (currentUserVote === 0 && voteValue !== 0) { expectedVotes += voteValue; } 
            else if (currentUserVote !== 0 && voteValue === 0) { expectedVotes -= currentUserVote; } 
            else if (currentUserVote !== voteValue) { expectedVotes += voteValue - currentUserVote; }
            countSpan.innerText = expectedVotes;

            try {
                const targetType = type === 'question' ? 'question' : 'answer';
                const data = await requestLegacyApi('/votes', {
                    method: 'POST',
                    body: {
                        targetType: targetType,
                        targetId: targetId,
                        value: voteValue
                    },
                });

                if (data.votesCount !== undefined) {
                    countSpan.innerText = data.votesCount;
                }

                pageVotes.set(targetId, { type, value: data.voteValue || voteValue });
                voteValueCache.set(`${targetType}:${targetId}`, Number(data.voteValue || voteValue));

            } catch (error) {
                console.error('Voting error:', error);
                updateVoteUI(type, targetId, currentUserVote);
                countSpan.innerText = currentVotes;
                const targetType = type === 'question' ? 'question' : 'answer';
                voteValueCache.set(`${targetType}:${targetId}`, currentUserVote);
            }
        }
    });

    // --- COMMENT SUBMISSION ---
    async function postComment() {
        const token = getToken();
        if (!token) {
            showToast('Please sign in to post an answer.', 'error');
            return;
        }

        if (!currentQuestionId) {
            showToast('Question ID not found.', 'error');
            return;
        }
        
        const textarea = document.querySelector('.answer-textarea');
        const body = answerEditor ? answerEditor.value().trim() : document.querySelector('.answer-textarea').value.trim();

        if (!body) {
            showToast('Please enter your answer before posting.', 'error');
            answerEditor?.codemirror?.focus?.();
            textarea?.focus();
            return;
        }

        const postBtn = document.getElementById('post-answer-btn');
        postBtn.disabled = true;
        postBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

        try {
            await requestLegacyApi(`/answers/${currentQuestionId}`, {
                method: 'POST',
                body: { body },
            });

            if (answerEditor) answerEditor.value('');

            textarea.value = '';
            showToast('Answer posted successfully!');
            await loadQuestion(currentQuestionId);

        } catch (error) {
            console.error('Error posting comment:', error);
            showToast(error.message || 'Failed to post answer. Please try again.', 'error');
        } finally {
            postBtn.disabled = false;
            postBtn.innerText = 'Post Answer';
        }
    }

    document.getElementById('post-answer-btn')?.addEventListener('click', postComment);

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
    async function initPage() {
        await loadCurrentUser(); 
        
        const questionId = getQuestionIdFromUrl();
        if (questionId) {
            loadQuestion(questionId);
        } else {
            showError('No question ID provided. Please select a question from the community page.', 'empty');
        }

        // INIT ANSWER BOX EDITOR
        answerEditor = new EasyMDE({
            element: document.querySelector('.answer-textarea'),
            spellChecker: false,
            placeholder: "Type your answer here... (Markdown, code, and images supported)"
        });
    }

    initPage();
});
