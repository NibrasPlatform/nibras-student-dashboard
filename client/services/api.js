/**
 * Centralized API Service Layer
 *
 * Provides typed service methods for all remote backend endpoints.
 * Uses the existing NibrasShared.apiFetch infrastructure for auth, token refresh, and error handling.
 *
 * Services:
 * - authService: Login, register, get current user (admin service)
 * - communityAuthService: Get current user (community service)
 * - questionService: CRUD for questions (legacy community service)
 * - answerService: CRUD for answers/comments (legacy community service)
 * - voteService: Cast/get votes (legacy community service)
 * - communityVoteService: Cast/get votes for threads/posts (community service)
 * - communityCourseService: Course discovery and enrollment (community service)
 * - threadService: Course discussion thread APIs (community service)
 * - postService: Thread post/reply APIs (community service)
 * - notificationService: User notifications (tracking service)
 * - programService: Student program planning and petitions (tracking service)
 * - competitionsService: Competitions contests/problems/accounts flows (competitions service)
 * - tagService: Get/create/update tags (legacy community service)
 * - chatbotService: AI chat ask/publish (legacy community service)
 *
 * Usage:
 *   const user = await window.NibrasServices.authService.getMe();
 *   const questions = await window.NibrasServices.questionService.list();
 */
(function () {
    'use strict';

    // Keep services available even if shared utilities initialize slightly later.

    const isAuthErrorStatus = (status) => status === 401 || status === 403;

    const toQueryString = (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach((key) => {
            const value = filters[key];
            if (value != null && value !== '') {
                params.append(key, value);
            }
        });
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    const unwrapApiData = (payload) => {
        if (payload == null) return null;
        if (typeof payload !== 'object') return payload;
        if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
        return payload;
    };

    const buildQueryString = (paramsObject = {}) => {
        const params = new URLSearchParams();
        Object.keys(paramsObject).forEach((key) => {
            const value = paramsObject[key];
            if (value == null || value === '') return;
            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    if (entry != null && entry !== '') params.append(key, String(entry));
                });
                return;
            }
            params.append(key, String(value));
        });
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    // ============================================================
    // Internal Helpers
    // ============================================================
    const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

    const joinUrl = (baseUrl, path) => {
        const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');
        const normalizedPath = String(path || '');
        if (!normalizedPath) return normalizedBase;
        if (isAbsoluteUrl(normalizedPath)) return normalizedPath;
        if (!normalizedBase) return normalizedPath;
        if (normalizedPath.startsWith('/')) return `${normalizedBase}${normalizedPath}`;
        return `${normalizedBase}/${normalizedPath}`;
    };

    const toPlainHeaders = (headers) => {
        if (!headers) return {};
        if (typeof Headers !== 'undefined' && headers instanceof Headers) {
            const result = {};
            headers.forEach((value, key) => {
                result[key] = value;
            });
            return result;
        }
        return Object.assign({}, headers);
    };

    const hasHeader = (headers, key) =>
        Object.keys(headers || {}).some((headerKey) => headerKey.toLowerCase() === String(key || '').toLowerCase());

    const normalizeToken = (token) => {
        if (typeof token !== 'string') return null;
        const trimmed = token.trim();
        if (!trimmed) return null;
        if (/^bearer\s+/i.test(trimmed)) return trimmed.replace(/^bearer\s+/i, '').trim() || null;
        return trimmed;
    };

    const tryParseJson = (value) => {
        if (typeof value !== 'string') return { ok: false, value: null };
        try {
            return { ok: true, value: JSON.parse(value) };
        } catch (_) {
            return { ok: false, value: null };
        }
    };

    const pickTokenCandidate = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
            const parsed = tryParseJson(value);
            if (parsed.ok) return pickTokenCandidate(parsed.value);
            return normalizeToken(value);
        }
        if (typeof value === 'object') {
            const candidates = [
                value.token,
                value.accessToken,
                value.authToken,
                value.jwt,
                value?.tokens?.access?.token,
                value?.tokens?.accessToken,
            ];
            for (let i = 0; i < candidates.length; i += 1) {
                const token = pickTokenCandidate(candidates[i]);
                if (token) return token;
            }
        }
        return null;
    };

    const getTokenFromStorage = (storage) => {
        const keys = ['token', 'nibras.webSession', 'accessToken', 'authToken', 'jwt'];
        for (let i = 0; i < keys.length; i += 1) {
            const token = pickTokenCandidate(safeStorageGet(storage, keys[i]));
            if (token) return token;
        }
        return null;
    };

    const getToken = () => getTokenFromStorage(window.localStorage) || getTokenFromStorage(window.sessionStorage);

    const getRefreshToken = () =>
        safeStorageGet(window.localStorage, 'refreshToken') || safeStorageGet(window.sessionStorage, 'refreshToken');

    const getUser = () => {
        const raw = safeStorageGet(window.localStorage, 'user');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    };

    const safeStorageGet = (storage, key) => {
        if (!storage || !key) return null;
        try {
            return storage.getItem(key);
        } catch (_) {
            return null;
        }
    };

    const extractAuth = (payload) => {
        const data = payload && payload.data ? payload.data : payload || {};
        const tokens = payload && payload.tokens ? payload.tokens : data.tokens || {};
        const user = data.user || payload?.user || data;
        const accessToken = data.token || payload?.token || tokens?.access?.token || null;
        const refreshToken = data.refreshToken || payload?.refreshToken || tokens?.refresh?.token || null;
        return {
            accessToken,
            refreshToken,
            user: user && user._id ? user : payload?.data || null,
        };
    };

    const setAuth = ({ token, accessToken, refreshToken, user }) => {
        const finalAccess = accessToken || token || null;
        if (finalAccess) window.localStorage.setItem('token', finalAccess);
        if (refreshToken) window.localStorage.setItem('refreshToken', refreshToken);
        if (user) window.localStorage.setItem('user', JSON.stringify(user));
    };

    const clearAuth = () => {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('refreshToken');
        window.localStorage.removeItem('user');
    };

    const safeParseResponse = async (response) => {
        let rawText = '';
        try {
            rawText = await response.text();
        } catch (_) {
            return { payload: null, rawText: '', isJson: false };
        }

        if (!rawText) {
            return { payload: null, rawText: '', isJson: false };
        }

        const parsed = tryParseJson(rawText);
        if (parsed.ok) {
            return { payload: parsed.value, rawText, isJson: true };
        }

        return { payload: null, rawText, isJson: false };
    };

    const getErrorMessage = (payload, status, statusText, rawText) => {
        if (status === 401) {
            return 'Authentication required. Please sign in to continue.';
        }
        if (status === 403) {
            return 'You do not have permission to perform this action.';
        }

        const candidates = [
            payload?.message,
            payload?.error?.message,
            typeof payload?.error === 'string' ? payload.error : null,
            Array.isArray(payload?.errors) && payload.errors.length
                ? payload.errors.map((entry) => entry?.message || entry?.msg).filter(Boolean).join(' ')
                : null,
            rawText || null,
            status ? `Request failed (${status}${statusText ? ` ${statusText}` : ''})` : null,
            'Request failed',
        ];

        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
            if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        }
        return 'Request failed';
    };

    const getErrorCode = (status, explicitCode = null) => explicitCode || AUTH_ERROR_CODES[status] || 'REQUEST_FAILED';
    const AUTH_ERROR_CODES = Object.freeze({
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
    });
    const COMPETITIONS_REQUEST_TIMEOUT_MS = 15000;

    const isCompetitionsFallbackCandidate = (error) => {
        if (!error || typeof error !== 'object') return false;
        const status = Number(error.status || 0);
        const code = String(error.code || '').toUpperCase();
        if (code === 'TIMEOUT' || code === 'NETWORK_ERROR') return true;
        return status === 0 || status === 404 || status === 502 || status === 503 || status === 504;
    };

    const normalizeError = ({ status = 0, statusText = '', payload = null, rawText = '', service = 'admin', url = '', code = null }) => {
        const message = getErrorMessage(payload, status, statusText, rawText);
        return {
            message,
            status,
            statusText,
            code: getErrorCode(status, code),
            isAuthError: isAuthErrorStatus(status),
            payload,
            rawText: rawText || '',
            service,
            url,
        };
    };

    const toError = (normalizedError) => {
        const err = new Error(normalizedError?.message || 'Request failed');
        err.status = normalizedError?.status || 0;
        err.statusText = normalizedError?.statusText || '';
        err.code = normalizedError?.code || 'REQUEST_FAILED';
        err.isAuthError = Boolean(normalizedError?.isAuthError);
        err.payload = normalizedError?.payload || null;
        err.service = normalizedError?.service || 'admin';
        err.url = normalizedError?.url || '';
        err.rawText = normalizedError?.rawText || '';
        return err;
    };

    const buildAuthHeaders = (headers, options = {}) => {
        const result = toPlainHeaders(headers);
        const authEnabled = options.auth !== false;
        if (!authEnabled) return result;

        const replaceAuthorization = options.replaceAuthorization === true;
        if (replaceAuthorization) {
            Object.keys(result).forEach((key) => {
                if (String(key).toLowerCase() === 'authorization') {
                    delete result[key];
                }
            });
        }

        if (hasHeader(result, 'Authorization')) return result;

        const token = normalizeToken(options.token || getToken());
        if (token) result.Authorization = `Bearer ${token}`;
        return result;
    };

    const resolveServiceUrl = (service = 'admin') => {
        if (window.NibrasApiConfig && typeof window.NibrasApiConfig.getServiceUrl === 'function') {
            return window.NibrasApiConfig.getServiceUrl(service);
        }
        // Use fallback values from window if config is missing
        const fallbacks = {
            admin: window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL,
            legacyCommunity: window.NIBRAS_LEGACY_API_URL || window.NIBRAS_API_URL,
            community: window.NIBRAS_COMMUNITY_API_URL || window.NIBRAS_API_URL,
            tracking: window.NIBRAS_TRACKING_API_URL || window.NIBRAS_API_URL,
            competitions: window.NIBRAS_COMPETITIONS_API_URL || window.NIBRAS_API_URL,
        };
        return fallbacks[service] || fallbacks.admin;
    };

    // ============================================================
    // Core Request Logic (with Retry & Token Refresh)
    // ============================================================
    const emitAuthError = (normalizedError) => {
        if (!normalizedError || !isAuthErrorStatus(normalizedError.status)) return;
        if (typeof window?.dispatchEvent !== 'function' || typeof window?.CustomEvent !== 'function') return;
        try {
            window.dispatchEvent(new window.CustomEvent(AUTH_ERROR_EVENT, {
                detail: {
                    status: normalizedError.status,
                    code: normalizedError.code,
                    message: normalizedError.message,
                    service: normalizedError.service,
                    url: normalizedError.url,
                },
            }));
        } catch (_) {
            // ignore custom event dispatch failures
        }
    };

    const request = async (path, options = {}) => {
        const settings = Object.assign({}, options);
        const service = settings.service || 'admin';
        const authEnabled = settings.auth !== false;
        const throwOnError = settings.throwOnError === true;
        const timeoutMs = Number(settings.timeoutMs || settings.timeout || 0);
        const method = (settings.method || 'GET').toUpperCase();
        const explicitBaseUrl = settings.baseUrl || settings.serviceUrl || settings.url || null;

        delete settings.service;
        delete settings.auth;
        delete settings.throwOnError;
        delete settings.timeout;
        delete settings.timeoutMs;
        delete settings.baseUrl;
        delete settings.serviceUrl;
        delete settings.url;

        const headers = buildAuthHeaders(settings.headers, { auth: authEnabled });
        delete settings.headers;

        const hasBody = Object.prototype.hasOwnProperty.call(settings, 'body') && settings.body != null;
        const isJsonBody =
            hasBody &&
            typeof settings.body === 'object' &&
            !(settings.body instanceof FormData) &&
            !(typeof URLSearchParams !== 'undefined' && settings.body instanceof URLSearchParams) &&
            !(typeof Blob !== 'undefined' && settings.body instanceof Blob) &&
            !(typeof ArrayBuffer !== 'undefined' && settings.body instanceof ArrayBuffer);
        if (isJsonBody) {
            if (!hasHeader(headers, 'Content-Type')) headers['Content-Type'] = 'application/json';
            settings.body = JSON.stringify(settings.body);
        }
        const baseUrl = explicitBaseUrl || resolveServiceUrl(service);
        const requestUrl = joinUrl(baseUrl, path);

        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = timeoutMs > 0 && controller
            ? window.setTimeout(() => controller.abort(), timeoutMs)
            : null;

        try {
            const response = await fetch(requestUrl, Object.assign({}, settings, {
                method,
                headers,
                signal: controller ? controller.signal : settings.signal,
            }));
            const parsed = await safeParseResponse(response);
            const payload = parsed.payload;
            const data = parsed.isJson ? payload : (parsed.rawText || null);

            const result = {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                service,
                url: requestUrl,
                data: response.ok ? data : null,
                payload,
                rawText: parsed.rawText || '',
                error: null,
                response,
            };

            if (!response.ok) {
                result.error = normalizeError({
                    status: response.status,
                    statusText: response.statusText,
                    payload,
                    rawText: parsed.rawText,
                    service,
                    url: requestUrl,
                });
                if (throwOnError) throw toError(result.error);
            }

            return result;
        } catch (error) {
            if (throwOnError && error && typeof error.status === 'number' && error.status > 0) {
                throw error;
            }
            const isAbort = error && (error.name === 'AbortError' || /aborted|timeout/i.test(String(error.message || '')));
            const normalizedError = normalizeError({
                status: 0,
                payload: null,
                rawText: '',
                service,
                url: requestUrl,
                code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
            });
            normalizedError.message = isAbort
                ? `Request timeout after ${timeoutMs}ms`
                : (error?.message || normalizedError.message);

            if (throwOnError) throw toError(normalizedError);

            return {
                ok: false,
                status: 0,
                statusText: '',
                service,
                url: requestUrl,
                data: null,
                payload: null,
                rawText: '',
                error: normalizedError,
                response: null,
            };
        } finally {
            if (timeoutId) window.clearTimeout(timeoutId);
        }
    };

    const REFRESH_ELIGIBLE_SERVICES = new Set(['admin', 'legacyCommunity', 'community', 'tracking', 'competitions']);
    let refreshPromise = null;

    const refreshAccessToken = async () => {
        if (refreshPromise) return refreshPromise;

        const refreshToken = getRefreshToken();
        if (!refreshToken) return null;

        refreshPromise = request('/auth/refresh-tokens', {
            service: 'admin',
            method: 'POST',
            auth: false,
            throwOnError: true,
            body: { refreshToken },
        })
            .then((result) => {
                const nextAuth = extractAuth(result?.data || {});
                if (!nextAuth.accessToken) return null;
                setAuth(nextAuth);
                return nextAuth.accessToken;
            })
            .catch(() => {
                clearAuth();
                return null;
            })
            .finally(() => {
                refreshPromise = null;
            });

        return refreshPromise;
    };

    const apiFetch = async (path, options = {}) => {
        const service = options.service || 'admin';
        const authEnabled = options.auth !== false;
        const retryAuth = options.retryAuth !== false;
        const requestedTimeout = Number(options.timeoutMs || options.timeout || 0);
        const timeoutMs = requestedTimeout > 0
            ? requestedTimeout
            : (service === 'competitions' ? COMPETITIONS_REQUEST_TIMEOUT_MS : 0);
        const requestOptions = Object.assign({}, options, {
            service,
            auth: authEnabled,
            throwOnError: false,
            timeoutMs,
        });
        delete requestOptions.retryAuth;

        const headers = Object.assign({ 'Content-Type': 'application/json' }, toPlainHeaders(requestOptions.headers));
        if (requestOptions.body instanceof FormData && !hasHeader(toPlainHeaders(options.headers), 'Content-Type')) {
            delete headers['Content-Type'];
        }
        requestOptions.headers = headers;

        let result = await request(path, requestOptions);

        if (!result.ok && service === 'competitions' && isCompetitionsFallbackCandidate(result.error)) {
            result = await request(path, Object.assign({}, requestOptions, {
                service: 'admin',
            }));
        }

        const shouldRetryWithRefresh =
            REFRESH_ELIGIBLE_SERVICES.has(service) &&
            authEnabled &&
            retryAuth &&
            result.status === 401 &&
            path !== '/auth/login' &&
            path !== '/auth/register' &&
            path !== '/auth/refresh-tokens';

        if (shouldRetryWithRefresh) {
            const nextAccessToken = await refreshAccessToken();
            if (nextAccessToken) {
                const retryHeaders = buildAuthHeaders(headers, {
                    token: nextAccessToken,
                    replaceAuthorization: true,
                });
                result = await request(path, Object.assign({}, requestOptions, { headers: retryHeaders }));
            }
        }

        if (authEnabled && isAuthErrorStatus(result.status)) {
            emitAuthError(result.error || normalizeError({ status: result.status, service, url: result.url }));
        }

        if (!result.ok) {
            throw toError(result.error || normalizeError({ status: result.status, service, url: result.url }));
        }

        return result.data;
    };

    let logoutRequestPromise = null;


    // ============================================================
    // Auth Service (admin)
    // ============================================================
    const authService = {
        /**
         * Login with email and password
         * @param {string} email
         * @param {string} password
         * @returns {Promise<object>}
         */
        async login(email, password) {
            return apiFetch('/auth/login', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: { email, password },
            });
        },

        /**
         * Register a new user
         * @param {object} data - { name, email, password, role? }
         * @returns {Promise<object>}
         */
        async register(data) {
            return apiFetch('/auth/register', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: data,
            });
        },

        /**
         * Verify email OTP for manual registration
         * @param {string} email
         * @param {string} otp
         * @returns {Promise<object>}
         */
        async verifyOtp(email, otp) {
            return apiFetch('/auth/verify-otp', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: { email, otp },
            });
        },

        /**
         * Login or register with Google idToken
         * @param {string} idToken
         * @returns {Promise<object>}
         */
        async loginWithGoogle(idToken) {
            return apiFetch('/auth/google', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: { idToken },
            });
        },

        /**
         * Get the currently authenticated user profile
         * @returns {Promise<{user: object}>}
         */
        async getMe() {
            return apiFetch('/auth/me', {
                service: 'admin',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Revoke current refresh token session
         * @param {string} refreshToken
         * @returns {Promise<object>}
         */
        async logout(refreshToken) {
            return apiFetch('/auth/logout', {
                service: 'admin',
                method: 'POST',
                auth: true,
                retryAuth: false,
                body: { refreshToken },
            });
        },
    };

    // ============================================================
    // Auth Service (community)
    // ============================================================
    const communityAuthService = {
        /**
         * Get the current community user profile
         * @returns {Promise<{user: object}>}
         */
        async getMe() {
            return apiFetch('/auth/me', {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Question Service (legacy community)
    // ============================================================
    const questionService = {
        /**
         * List all questions (with optional filters)
         * @param {object} filters - { search, title, tag, course }
         * @returns {Promise<Array>}
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key] != null && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });
            const query = params.toString();
            return apiFetch(`/community/questions${query ? '?' + query : ''}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get a single question by ID with its answers
         * @param {string} id - Question MongoDB ObjectId
         * @returns {Promise<{question: object, answers: Array}>}
         */
        async getById(id) {
            return apiFetch(`/community/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Create a new question
         * @param {object} data - { title, body, tags?, course? }
         * @returns {Promise<object>}
         */
        async create(data) {
            return apiFetch('/community/questions', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update a question (owner only)
         * @param {string} id - Question MongoDB ObjectId
         * @param {object} data - Fields to update { title?, body?, tags?, course? }
         * @returns {Promise<object>}
         */
        async update(id, data) {
            return apiFetch(`/community/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete a question (owner or admin)
         * @param {string} id - Question MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async delete(id) {
            return apiFetch(`/community/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'DELETE',
                auth: true,
            });
        },
    };

    // ============================================================
    // Answer Service (legacy community)
    // ============================================================
    const answerService = {
        /**
         * Get all answers for a question
         * @param {string} questionId - Question MongoDB ObjectId
         * @returns {Promise<Array>}
         */
        async listByQuestion(questionId) {
            return apiFetch(`/community/answers/question/${questionId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get an answer by ID
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async getById(questionId, answerId) {
            return apiFetch(`/community/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Create an answer
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {object} data - { body, isFromAI? }
         * @returns {Promise<object>}
         */
        async create(questionId, data) {
            return apiFetch(`/community/answers/${questionId}`, {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update an answer (owner only)
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @param {object} data - { body }
         * @returns {Promise<object>}
         */
        async update(questionId, answerId, data) {
            return apiFetch(`/community/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete an answer (owner or admin)
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async delete(questionId, answerId) {
            return apiFetch(`/community/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'DELETE',
                auth: true,
            });
        },

        /**
         * Accept an answer (question author only)
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async accept(answerId) {
            return apiFetch(`/community/answers/${answerId}/accept`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Vote Service (legacy community)
    // ============================================================
    const voteService = {
        /**
         * Cast or toggle a vote
         * @param {object} data - { targetType: 'question'|'answer', targetId: string, value: 1|-1 }
         * @returns {Promise<{message: string, action: string, voteValue: number, votesCount: number}>}
         */
        async cast(data) {
            return apiFetch('/community/votes', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Get the current user's vote on a target
         * @param {object} params - { targetType: 'question'|'answer', targetId: string }
         * @returns {Promise<{value: number}>} 1, -1, or 0
         */
        async getMyVote(params) {
            const targetType = params.targetType === 'question' ? 'question' : 'answer';
            return apiFetch(`/community/votes/${targetType}/${params.targetId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Vote Service (course-thread community)
    // ============================================================
    const communityVoteService = {
        /**
         * Cast or toggle a vote for thread/post targets
         * @param {object} data - { targetType: 'thread'|'post', targetId: string, value: 1|-1 }
         * @returns {Promise<{message: string, action: string, voteValue: number, votesCount: number}>}
         */
        async cast(data) {
            return apiFetch('/community/votes', {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Get the current user's vote on a thread/post target
         * @param {object} params - { targetType: 'thread'|'post', targetId: string }
         * @returns {Promise<{value: number}>}
         */
        async getMyVote(params) {
            const targetType = params.targetType === 'thread' ? 'thread' : 'post';
            return apiFetch(`/community/votes/${targetType}/${params.targetId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Tag Service (legacy community)
    // ============================================================
    const tagService = {
        /**
         * Get all tags
         * @returns {Promise<Array>}
         */
        async list() {
            return apiFetch('/community/tags', {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get popular tags
         * @param {number} limit - Max number of tags to return
         * @returns {Promise<Array>}
         */
        async popular(limit = 5) {
            return apiFetch(`/community/tags/popular?limit=${limit}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get a tag by ID
         * @param {string} id - Tag MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async getById(id) {
            return apiFetch(`/community/tags/${id}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },
    };

    // ============================================================
    // Chatbot Service (legacy community)
    // ============================================================
    const extractQuestionEntity = (payload) => {
        const data = unwrapApiData(payload);
        const candidates = [
            payload?.data?.question,
            payload?.question,
            data?.question,
            data,
        ];

        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
            if (!candidate || typeof candidate !== 'object') continue;
            if (candidate._id || candidate.id) return candidate;
        }

        return null;
    };

    const extractQuestionId = (payload) => {
        const question = extractQuestionEntity(payload);
        if (question) return question._id || question.id || null;

        const data = unwrapApiData(payload);
        return (
            payload?.data?.questionId ||
            payload?.questionId ||
            data?.questionId ||
            null
        );
    };

    const isRoleObjectIdCastError = (error) => {
        const msg = String(error?.message || error?.payload?.message || '');
        return /Cast to ObjectId failed/i.test(msg) && /path\s+"?role"?/i.test(msg);
    };

    const AI_TUTOR_MARKER = '<!--NIBRAS_AI_TUTOR-->';
    const withAiTutorMarker = (answerText) => {
        const normalized = String(answerText || '').trim();
        if (!normalized) return normalized;
        if (normalized.includes(AI_TUTOR_MARKER)) return normalized;
        return `${normalized}\n\n${AI_TUTOR_MARKER}`;
    };

    const normalizePublishPayload = (data = {}) => {
        const title = String(data?.title || '').trim();
        const question = String(data?.question || '').trim();
        const finalAnswer = withAiTutorMarker(String(data?.finalAnswer || '').trim());
        const tags = Array.from(new Set(
            (Array.isArray(data?.tags) ? data.tags : [])
                .map((tag) => String(tag || '').trim())
                .filter(Boolean)
        ));

        return { title, question, finalAnswer, tags };
    };

    const chatbotService = {
        /**
         * Ask the AI chatbot a question
         * @param {string} question - The question text (10-500 chars)
         * @returns {Promise<{question: string, hints: Array, tags: Array, finalAnswer: string}>}
         */
        async ask(question) {
            return apiFetch('/community/chatbot/ask', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: { question },
            });
        },

        /**
         * Publish a chatbot answer as a community question
         * @param {object} data - { title, question, finalAnswer, tags? }
         * @returns {Promise<object>}
         */
        async publish(data) {
            const payload = normalizePublishPayload(data);
            try {
                return await apiFetch('/community/chatbot/publish', {
                    service: 'legacyCommunity',
                    method: 'POST',
                    auth: true,
                    body: payload,
                });
            } catch (error) {
                if (!isRoleObjectIdCastError(error)) throw error;

                const questionPayload = await questionService.create({
                    title: payload.title,
                    body: payload.question,
                    tags: payload.tags,
                });
                const questionId = extractQuestionId(questionPayload);
                if (!questionId) throw error;

                const answerPayload = await answerService.create(questionId, {
                    body: payload.finalAnswer,
                    isFromAI: true,
                });

                return {
                    data: {
                        question: extractQuestionEntity(questionPayload) || { _id: questionId, id: questionId },
                        answer: unwrapApiData(answerPayload),
                        source: 'community-route-fallback',
                    },
                };
            }
        },
    };

    // ============================================================
    // Community Courses Service (course-thread backend)
    // ============================================================
    const communityCourseService = {
        /**
         * List community courses
         * @param {object} filters - { search, isActive, instructor }
         * @returns {Promise<{courses: Array}>}
         */
        async list(filters = {}) {
            return apiFetch(`/courses${toQueryString(filters)}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get a community course by ID
         * @param {string} id
         * @returns {Promise<{course: object}>}
         */
        async getById(id) {
            return apiFetch(`/courses/${id}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Enroll current user in a course
         * @param {string} courseId
         * @returns {Promise<{course: object}>}
         */
        async enroll(courseId) {
            return apiFetch(`/courses/${courseId}/enroll`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * Unenroll current user from a course
         * @param {string} courseId
         * @returns {Promise<{course: object}>}
         */
        async unenroll(courseId) {
            return apiFetch(`/courses/${courseId}/enroll`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },
    };

    // ============================================================
    // Thread Service (course-thread backend)
    // ============================================================
    const threadService = {
        /**
         * List threads by course
         * @param {string} courseId
         * @param {object} filters - { search, status, tag }
         * @returns {Promise<{threads: Array}>}
         */
        async listByCourse(courseId, filters = {}) {
            return apiFetch(`/community/threads/course/${courseId}${toQueryString(filters)}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get thread by ID
         * @param {string} threadId
         * @returns {Promise<{thread: object}>}
         */
        async getById(threadId) {
            return apiFetch(`/community/threads/${threadId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create thread in a course
         * @param {string} courseId
         * @param {object} data - { title, body, tags? }
         * @returns {Promise<{thread: object}>}
         */
        async create(courseId, data) {
            return apiFetch(`/community/threads/${courseId}`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update thread
         * @param {string} threadId
         * @param {object} data
         * @returns {Promise<{thread: object}>}
         */
        async update(threadId, data) {
            return apiFetch(`/community/threads/${threadId}`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete thread
         * @param {string} threadId
         * @returns {Promise<{message: string}>}
         */
        async delete(threadId) {
            return apiFetch(`/community/threads/${threadId}`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },

        async pin(threadId) {
            return apiFetch(`/community/threads/${threadId}/pin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async unpin(threadId) {
            return apiFetch(`/community/threads/${threadId}/unpin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async close(threadId) {
            return apiFetch(`/community/threads/${threadId}/close`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async open(threadId) {
            return apiFetch(`/community/threads/${threadId}/open`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Post Service (course-thread backend)
    // ============================================================
    const postService = {
        /**
         * List posts by thread
         * @param {string} threadId
         * @returns {Promise<{posts: Array}>}
         */
        async listByThread(threadId) {
            return apiFetch(`/community/posts/thread/${threadId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get post by ID
         * @param {string} postId
         * @returns {Promise<{post: object}>}
         */
        async getById(postId) {
            return apiFetch(`/community/posts/${postId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create a post in a thread
         * @param {string} threadId
         * @param {object} data - { body }
         * @returns {Promise<{post: object}>}
         */
        async create(threadId, data) {
            return apiFetch(`/community/posts/${threadId}`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update post
         * @param {string} postId
         * @param {object} data
         * @returns {Promise<{post: object}>}
         */
        async update(postId, data) {
            return apiFetch(`/community/posts/${postId}`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete post
         * @param {string} postId
         * @returns {Promise<{message: string}>}
         */
        async delete(postId) {
            return apiFetch(`/community/posts/${postId}`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },

        async pin(postId) {
            return apiFetch(`/community/posts/${postId}/pin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async accept(postId) {
            return apiFetch(`/community/posts/${postId}/accept`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Notification Service (tracking backend)
    // ============================================================
    const notificationService = {
        /**
         * List current user notifications
         * @returns {Promise<{notifications: Array}>}
         */
        async list() {
            return apiFetch('/v1/notifications', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get unread notifications count
         * @returns {Promise<{count: number}>}
         */
        async count() {
            return apiFetch('/v1/notifications/count', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Mark all notifications as read
         * @returns {Promise<{ok: boolean}>}
         */
        async markAllRead() {
            return apiFetch('/v1/notifications/read-all', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Program Service (tracking backend)
    // ============================================================
    const programService = {
        /**
         * List all available programs
         * @returns {Promise<Array>}
         */
        async listPrograms() {
            return apiFetch('/v1/programs', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Enroll current student in a program
         * @param {string} programId
         * @returns {Promise<object>}
         */
        async enroll(programId) {
            return apiFetch(`/v1/programs/${encodeURIComponent(String(programId || ''))}/enroll`, {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * Get current student's program plan
         * @returns {Promise<object>}
         */
        async getMyPlan() {
            return apiFetch('/v1/programs/student/me', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Select specialization track
         * @param {string} trackId
         * @returns {Promise<object>}
         */
        async selectTrack(trackId) {
            return apiFetch('/v1/programs/student/me/select-track', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: { trackId: String(trackId || '') },
            });
        },

        /**
         * Update student planned courses
         * @param {Array} plannedCourses
         * @returns {Promise<object>}
         */
        async updatePlan(plannedCourses) {
            return apiFetch('/v1/programs/student/me/plan', {
                service: 'tracking',
                method: 'PATCH',
                auth: true,
                body: { plannedCourses: Array.isArray(plannedCourses) ? plannedCourses : [] },
            });
        },

        /**
         * Get student sheet view
         * @returns {Promise<object>}
         */
        async getSheet() {
            return apiFetch('/v1/programs/student/me/sheet', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Generate and snapshot sheet
         * @returns {Promise<object>}
         */
        async generateSheet() {
            return apiFetch('/v1/programs/student/me/generate-sheet', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * List student petitions
         * @returns {Promise<Array>}
         */
        async listPetitions() {
            return apiFetch('/v1/programs/student/me/petitions', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create a new student petition
         * @param {object} payload
         * @returns {Promise<object>}
         */
        async createPetition(payload) {
            return apiFetch('/v1/programs/student/me/petitions', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: payload || {},
            });
        },
    };

    // ============================================================
    // Competitions Service (competitions backend)
    // ============================================================
    const competitionsService = {
        async getMe() {
            const payload = await apiFetch('/auth/me', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return payload?.user || unwrapApiData(payload);
        },

        async listContests(filters = {}) {
            const query = buildQueryString({
                platform: filters.platform,
                status: filters.status,
                bookmarked: filters.bookmarked,
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                order: filters.order,
            });
            const payload = await apiFetch(`/contests${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: false,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async getContestById(id) {
            const payload = await apiFetch(`/contests/${encodeURIComponent(String(id || ''))}`, {
                service: 'competitions',
                method: 'GET',
                auth: false,
            });
            return unwrapApiData(payload);
        },

        async bookmarkContest(id) {
            const payload = await apiFetch(`/contests/user-contests/${encodeURIComponent(String(id || ''))}/bookmark`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Contest bookmarked successfully',
                data: unwrapApiData(payload),
            };
        },

        async removeBookmark(id) {
            const payload = await apiFetch(`/contests/user-contests/${encodeURIComponent(String(id || ''))}/bookmark`, {
                service: 'competitions',
                method: 'DELETE',
                auth: true,
            });
            return {
                message: payload?.message || 'Bookmark removed successfully',
                data: unwrapApiData(payload),
            };
        },

        async listBookmarks(filters = {}) {
            const query = buildQueryString({ page: filters.page, limit: filters.limit });
            const payload = await apiFetch(`/contests/user-contests/bookmarks${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async setReminder(id) {
            const payload = await apiFetch(`/contests/user-contests/${encodeURIComponent(String(id || ''))}/reminder`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Reminder set successfully',
                data: unwrapApiData(payload),
            };
        },

        async removeReminder(id) {
            const payload = await apiFetch(`/contests/user-contests/${encodeURIComponent(String(id || ''))}/reminder`, {
                service: 'competitions',
                method: 'DELETE',
                auth: true,
            });
            return {
                message: payload?.message || 'Reminder removed successfully',
                data: unwrapApiData(payload),
            };
        },

        async listReminders(filters = {}) {
            const query = buildQueryString({ page: filters.page, limit: filters.limit });
            const payload = await apiFetch(`/contests/user-contests/reminders${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async joinContest(id) {
            const payload = await apiFetch(`/contests/user-contests/${encodeURIComponent(String(id || ''))}/join`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Contest joined successfully',
                data: unwrapApiData(payload),
            };
        },

        async listHistory(filters = {}) {
            const query = buildQueryString({
                platform: filters.platform,
                from: filters.from,
                to: filters.to,
                page: filters.page,
                limit: filters.limit,
            });
            const payload = await apiFetch(`/contests/user-contests/history${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return {
                items: Array.isArray(payload?.data) ? payload.data : Array.isArray(unwrapApiData(payload)) ? unwrapApiData(payload) : [],
                pagination: payload?.pagination || unwrapApiData(payload)?.pagination || null,
            };
        },

        async linkAccounts(accounts) {
            const payload = await apiFetch('/contests/accounts/link', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: accounts || {},
            });
            return {
                message: payload?.message || 'Accounts linked successfully',
                data: unwrapApiData(payload),
            };
        },

        async startVerification(platform) {
            const payload = await apiFetch('/contests/accounts/verify/start', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: { platform },
            });
            return {
                message: payload?.message || 'Verification started',
                data: unwrapApiData(payload),
            };
        },

        async checkVerification(platform) {
            const payload = await apiFetch('/contests/accounts/verify/check', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: { platform },
            });
            return {
                message: payload?.message || '',
                data: unwrapApiData(payload),
            };
        },

        async getAggregatedProfile(userId) {
            const payload = await apiFetch(`/contests/accounts/profile/${encodeURIComponent(String(userId || ''))}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload);
        },

        async syncProfile(options = {}) {
            const force = options.force === true;
            const payload = await apiFetch(`/contests/accounts/profile/sync${force ? '?force=true' : ''}`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return unwrapApiData(payload);
        },

        async listProblems(filters = {}) {
            const queryFilters = {};
            if (filters.difficulty) queryFilters.difficulty = filters.difficulty;
            if (Array.isArray(filters.tags)) queryFilters.tags = filters.tags.join(',');
            else if (filters.tags) queryFilters.tags = filters.tags;
            const payload = await apiFetch(`/problems${buildQueryString(queryFilters)}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload);
            return Array.isArray(data) ? data : [];
        },

        async getRoadmap() {
            const payload = await apiFetch('/problems/roadmap', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload) || {};
        },

        async getProgress() {
            const payload = await apiFetch('/problems/progress', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload) || {};
        },
    };

    // ============================================================
    // Expose on window
    // ============================================================
    window.NibrasServices = Object.freeze({
        authService,
        communityAuthService,
        questionService,
        answerService,
        voteService,
        communityVoteService,
        communityCourseService,
        threadService,
        postService,
        notificationService,
        programService,
        competitionsService,
        tagService,
        chatbotService,
    });

    console.log('[NibrasServices] Initialized. Available as window.NibrasServices');
})();
