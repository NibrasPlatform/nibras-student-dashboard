(function () {
    const MONOLITH_FALLBACK_URL = 'https://nibras-backend.up.railway.app/api';
    const FALLBACK_ADMIN_URL = window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_LEGACY_URL = window.NIBRAS_LEGACY_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_COMMUNITY_URL = window.NIBRAS_COMMUNITY_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_TRACKING_URL = window.NIBRAS_TRACKING_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_COMPETITIONS_URL = window.NIBRAS_COMPETITIONS_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;

    const onReady = (cb) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', cb, { once: true });
        } else {
            cb();
        }
    };

    const getTheme = () => document.documentElement.getAttribute('data-theme') || 'light';

    const setTheme = (theme) => {
        const next = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        return next;
    };

    const toggleTheme = () => setTheme(getTheme() === 'light' ? 'dark' : 'light');

    const resolveServiceUrl = (service = 'admin') => {
        if (window.NibrasApiConfig && typeof window.NibrasApiConfig.getServiceUrl === 'function') {
            return window.NibrasApiConfig.getServiceUrl(service);
        }
        if (service === 'legacyCommunity') return FALLBACK_LEGACY_URL;
        if (service === 'community') return FALLBACK_COMMUNITY_URL;
        if (service === 'tracking') return FALLBACK_TRACKING_URL;
        if (service === 'competitions') return FALLBACK_COMPETITIONS_URL;
        return FALLBACK_ADMIN_URL;
    };

    const safeStorageGet = (storage, key) => {
        if (!storage || !key) return null;
        try {
            return storage.getItem(key);
        } catch (_) {
            return null;
        }
    };

    const tryParseJson = (value) => {
        if (typeof value !== 'string') {
            return { ok: false, value: null };
        }
        try {
            return { ok: true, value: JSON.parse(value) };
        } catch (_) {
            return { ok: false, value: null };
        }
    };

    const normalizeToken = (token) => {
        if (typeof token !== 'string') return null;
        const trimmed = token.trim();
        if (!trimmed) return null;
        if (/^bearer\s+/i.test(trimmed)) return trimmed.replace(/^bearer\s+/i, '').trim() || null;
        return trimmed;
    };

    const AUTH_ERROR_CODES = Object.freeze({
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
    });

    const AUTH_ERROR_EVENT = 'nibras:auth-error';

    const isAuthErrorStatus = (status) => status === 401 || status === 403;

    const getErrorCode = (status, explicitCode = null) => explicitCode || AUTH_ERROR_CODES[status] || 'REQUEST_FAILED';

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

    const hasHeader = (headers, key) =>
        Object.keys(headers || {}).some((headerKey) => headerKey.toLowerCase() === String(key || '').toLowerCase());

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

    const UI_STATE_MAP = Object.freeze({
        auth: 'unauthorized',
        'auth-required': 'unauthorized',
        unauthorized: 'unauthorized',
        forbidden: 'forbidden',
        loading: 'loading',
        empty: 'empty',
        error: 'error',
        info: 'info',
    });

    const UI_STATE_META = Object.freeze({
        loading: {
            icon: 'fa-solid fa-spinner fa-spin',
            fallbackMessage: 'Loading...',
        },
        empty: {
            icon: 'fa-regular fa-folder-open',
            fallbackMessage: 'No data available.',
        },
        error: {
            icon: 'fa-solid fa-circle-exclamation',
            fallbackMessage: 'Something went wrong.',
        },
        unauthorized: {
            icon: 'fa-solid fa-lock',
            fallbackMessage: 'Please sign in to continue.',
        },
        forbidden: {
            icon: 'fa-solid fa-ban',
            fallbackMessage: 'You do not have permission to view this.',
        },
        info: {
            icon: 'fa-solid fa-circle-info',
            fallbackMessage: '',
        },
    });

    const normalizeUiStateType = (state) => {
        const key = String(state || '').trim().toLowerCase();
        return UI_STATE_MAP[key] || 'info';
    };

    const resolveUiStateFromError = (error, fallbackMessage = 'Request failed') => {
        const status = Number(error?.status || 0);
        let state = 'error';
        if (status === 401 || String(error?.code || '').toUpperCase() === 'UNAUTHORIZED') {
            state = 'unauthorized';
        } else if (status === 403 || String(error?.code || '').toUpperCase() === 'FORBIDDEN') {
            state = 'forbidden';
        } else if (status === 404) {
            state = 'empty';
        }
        const message =
            (typeof error?.message === 'string' && error.message.trim()) ||
            fallbackMessage ||
            UI_STATE_META[state]?.fallbackMessage ||
            'Request failed';
        return { state, message };
    };

    const applyUiNoticeStyle = (target, state) => {
        const isErrorTone = state === 'error' || state === 'unauthorized' || state === 'forbidden';
        target.style.border = '1px solid';
        target.style.borderRadius = '10px';
        target.style.padding = '10px 12px';
        target.style.fontSize = '13px';
        target.style.margin = '12px 0 18px';
        target.style.color = isErrorTone ? '#ef4444' : 'var(--text-secondary)';
        target.style.borderColor = isErrorTone ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)';
        target.style.backgroundColor = isErrorTone ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)';
    };

    const renderUiState = (target, options = {}) => {
        if (!target) return;

        const state = normalizeUiStateType(options.state || options.type || 'info');
        const mode = String(options.mode || options.layout || 'block').toLowerCase();
        const hideWhenEmpty = options.hideWhenEmpty !== false;
        const configuredMessage = typeof options.message === 'string' ? options.message.trim() : '';
        const message = configuredMessage || UI_STATE_META[state]?.fallbackMessage || '';

        if (!message && hideWhenEmpty) {
            target.hidden = true;
            target.textContent = '';
            if (mode !== 'notice') target.innerHTML = '';
            return;
        }

        target.hidden = false;
        if (mode === 'notice') {
            applyUiNoticeStyle(target, state);
            target.textContent = message;
            return;
        }

        const iconClass = UI_STATE_META[state]?.icon || UI_STATE_META.info.icon;
        const isErrorTone = state === 'error' || state === 'unauthorized' || state === 'forbidden';
        target.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.padding = options.compact ? '1rem' : '2rem';
        wrapper.style.color = isErrorTone ? 'var(--tag-red-text, #dc2626)' : 'var(--text-secondary)';

        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.style.fontSize = options.compact ? '1.2rem' : '1.8rem';
        if (!isErrorTone) icon.style.color = 'var(--accent-blue)';

        const text = document.createElement('p');
        text.style.marginTop = '0.8rem';
        text.textContent = message;

        wrapper.appendChild(icon);
        wrapper.appendChild(text);
        target.appendChild(wrapper);
    };

    const clearUiState = (target) => {
        if (!target) return;
        target.hidden = true;
        target.textContent = '';
        target.innerHTML = '';
    };

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
        const requestOptions = Object.assign({}, options, {
            service,
            auth: authEnabled,
            throwOnError: false,
        });
        delete requestOptions.retryAuth;

        const headers = Object.assign({ 'Content-Type': 'application/json' }, toPlainHeaders(requestOptions.headers));
        if (requestOptions.body instanceof FormData && !hasHeader(toPlainHeaders(options.headers), 'Content-Type')) {
            delete headers['Content-Type'];
        }
        requestOptions.headers = headers;

        let result = await request(path, requestOptions);

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

    const normalizeLogoutRedirect = (href) => {
        const fallback = '/Login/loginPage/login.html';
        if (typeof href !== 'string') return fallback;
        const trimmed = href.trim();
        if (!trimmed || /^javascript:/i.test(trimmed)) return fallback;
        return trimmed;
    };

    const performLogout = async (redirectHref) => {
        if (logoutRequestPromise) return logoutRequestPromise;

        logoutRequestPromise = (async () => {
            const refreshToken = getRefreshToken();
            const targetHref = normalizeLogoutRedirect(redirectHref);

            if (refreshToken) {
                try {
                    await apiFetch('/auth/logout', {
                        service: 'admin',
                        method: 'POST',
                        auth: true,
                        retryAuth: false,
                        body: { refreshToken },
                    });
                } catch (error) {
                    console.warn('[NibrasAuth] Logout API request failed:', error?.message || error);
                }
            }

            clearAuth();
            window.location.href = targetHref;
        })().finally(() => {
            logoutRequestPromise = null;
        });

        return logoutRequestPromise;
    };

    const attachLogoutHandlers = () => {
        if (window.__NIBRAS_LOGOUT_HANDLER_ATTACHED__) return;
        window.__NIBRAS_LOGOUT_HANDLER_ATTACHED__ = true;

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return;
            const logoutLink = target.closest('a.logout-btn, a[data-auth-logout="true"]');
            if (!logoutLink) return;
            event.preventDefault();
            void performLogout(logoutLink.getAttribute('href'));
        });
    };

    onReady(() => {
        attachLogoutHandlers();
    });

    const nibrasApi = Object.freeze({
        resolveServiceUrl,
        getToken,
        buildAuthHeaders,
        request,
    });

    // ============================================================
    // Session/User Display Utilities
    // ============================================================
    const updateUserInfoDisplay = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const initials = user?.name
                ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'US';
            const displayName = user?.name || 'User';
            const displayRole = user?.role?.name || user?.role || 'student';

            // Update all avatar circles
            document.querySelectorAll('.avatar-circle, .profile-circle-small').forEach(el => {
                if (el.textContent.trim() === 'ZA' || el.textContent.trim() === '') {
                    el.textContent = initials;
                }
            });

            // Update user profile name in sidebar
            const sidebarUserNames = document.querySelectorAll('.user-profile h4');
            sidebarUserNames.forEach(el => {
                if (el.textContent.trim() === 'Ziad Alaa' || el.textContent.trim() === '') {
                    el.textContent = displayName;
                }
            });

            // Update user role in sidebar
            const sidebarUserRoles = document.querySelectorAll('.user-profile span');
            sidebarUserRoles.forEach(el => {
                if (el.textContent.trim() === 'student' || el.textContent.trim() === '') {
                    el.textContent = displayRole;
                }
            });

            // Update welcome messages
            const welcomeMsgs = document.querySelectorAll('#welcome-msg');
            welcomeMsgs.forEach(el => {
                const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
                el.textContent = `Welcome back, ${firstName}!`;
            });

            return { user, initials, displayName, displayRole };
        } catch (_) {
            return null;
        }
    };

    const requireAuth = (redirectUrl = '/Login/loginPage/login.html') => {
        const token = getToken();
        if (!token) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    };

    window.NibrasApi = nibrasApi;
    window.NibrasShared = {
        BACKEND_URL: resolveServiceUrl('admin'),
        resolveServiceUrl,
        onReady,
        theme: { getTheme, setTheme, toggleTheme },
        auth: { getToken, getRefreshToken, getUser, setAuth, clearAuth, extractAuth, refreshAccessToken, buildAuthHeaders },
        session: {
            updateUserInfoDisplay,
            requireAuth,
        },
        uiStates: {
            render: renderUiState,
            clear: clearUiState,
            fromError: resolveUiStateFromError,
            normalize: normalizeUiStateType,
        },
        api: nibrasApi,
        apiRequest: request,
        apiFetch,
    };
})();
