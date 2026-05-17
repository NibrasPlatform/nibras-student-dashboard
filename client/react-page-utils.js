(function () {
    const MONOLITH_FALLBACK_URL = 'https://nibras-backend.up.railway.app/api';
    const FALLBACK_ADMIN_URL = window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_LEGACY_URL = window.NIBRAS_LEGACY_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_COMMUNITY_URL = window.NIBRAS_COMMUNITY_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_TRACKING_URL = window.NIBRAS_TRACKING_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_COMPETITIONS_URL = window.NIBRAS_COMPETITIONS_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;
    const FALLBACK_COURSES_URL = window.NIBRAS_COURSES_API_URL || window.NIBRAS_API_URL || window.NIBRAS_BACKEND_URL || MONOLITH_FALLBACK_URL;

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
        if (service === 'courses') return FALLBACK_COURSES_URL;
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

    const REFRESH_ELIGIBLE_SERVICES = new Set(['admin', 'legacyCommunity', 'community', 'tracking', 'competitions', 'courses']);
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

            setupProfileDropdowns(user, initials, displayName, displayRole);

            return { user, initials, displayName, displayRole };
        } catch (_) {
            return null;
        }
    };

    function setupProfileDropdowns(user, initials, displayName, displayRole) {
        var avatars = document.querySelectorAll('.profile-circle-small');
        if (!avatars.length) return;

        var displayEmail = user?.email || '';

        function closeAll() {
            document.querySelectorAll('.profile-dropdown-menu.show, .notif-dropdown-menu.show').forEach(function (m) { m.classList.remove('show'); });
        }

        avatars.forEach(function (avatar) {
            if (avatar.getAttribute('data-dd')) return;
            avatar.setAttribute('data-dd', '1');
            avatar.style.cursor = 'pointer';

            var parent = avatar.parentElement;
            if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

            var curTheme = localStorage.getItem('theme') || 'light';
            var tIcon = curTheme === 'dark' ? '🌙' : '☀️';
            var tLabel = curTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

            var dd = document.createElement('div');
            dd.className = 'profile-dropdown-menu';
            dd.innerHTML = [
                '<div class="dd-header">',
                '  <div class="dd-avatar-circle">' + initials + '</div>',
                '  <div class="dd-info">',
                '    <div class="dd-name">' + (displayName) + '</div>',
                '    <div class="dd-role">' + (displayRole) + '</div>',
                (displayEmail ? '    <div class="dd-email">' + (displayEmail) + '</div>' : ''),
                '  </div>',
                '</div>',
                '<div class="dd-divider"></div>',
                '<a class="dd-item" data-href="/Dashboard/dashboard.html"><span>📊</span> Dashboard</a>',
                '<a class="dd-item" data-href="/Courses/courses.html"><span>📚</span> My Courses</a>',
                '<a class="dd-item" data-href="/Achievements/Achievements/achievements.html"><span>🏆</span> Achievements</a>',
                '<div class="dd-divider"></div>',
                '<a class="dd-item" data-href="/Settings/settings.html"><span>⚙️</span> Settings</a>',
                '<div class="dd-divider"></div>',
                '<a class="dd-item dd-action" data-action="theme"><span>' + tIcon + '</span> ' + tLabel + '</a>',
                '<a class="dd-item dd-signout" data-action="logout"><span>🚪</span> Sign Out</a>',
            ].join('');

            parent.appendChild(dd);

            avatar.addEventListener('click', function (e) {
                e.stopPropagation();
                closeAll();
                dd.classList.toggle('show');
            });

            dd.addEventListener('click', function (e) {
                var item = e.target.closest('.dd-item');
                if (!item) return;
                var href = item.getAttribute('data-href');
                var action = item.getAttribute('data-action');
                if (href) {
                    closeAll();
                    window.location.href = href;
                } else if (action === 'theme') {
                    var theme = window.NibrasShared?.theme;
                    var html = document.documentElement;
                    var cur = html.getAttribute('data-theme') || 'light';
                    var next = cur === 'dark' ? 'light' : 'dark';
                    html.setAttribute('data-theme', next);
                    localStorage.setItem('theme', next);
                    item.innerHTML = '<span>' + (next === 'dark' ? '🌙' : '☀️') + '</span> ' + (next === 'dark' ? 'Light Mode' : 'Dark Mode');
                    var logo = document.getElementById('app-logo');
                    if (logo) logo.src = next === 'dark' ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
                    closeAll();
                } else if (action === 'logout') {
                    closeAll();
                    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); } catch (_) {}
                    window.location.href = '/Login/loginPage/login.html';
                }
            });
        });

        document.addEventListener('click', closeAll);
    }

    const requireAuth = (redirectUrl = '/Login/loginPage/login.html') => {
        const token = getToken();
        if (!token) {
            // Check for new session-based auth
            const sessionToken = safeStorageGet(window.localStorage, 'nibras_session_token');
            if (!sessionToken) {
                window.location.href = redirectUrl;
                return false;
            }
            return true;
        }
        return true;
    };

    /**
     * Get current user from new tracking API session
     * @returns {Promise<object|null>}
     */
    const fetchTrackingSession = async () => {
        const trackingApi = resolveServiceUrl('tracking');
        try {
            const response = await fetch(`${trackingApi}/v1/web/session`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const userData = await response.json();
                return userData;
            }
            return null;
        } catch (err) {
            console.error('[NibrasShared] Failed to fetch tracking session:', err);
            return null;
        }
    };

    // --- Inject dropdown styles ---
    (function () {
        var id = 'nibras-profile-dropdown-styles';
        if (document.getElementById(id)) return;
        var style = document.createElement('style');
        style.id = id;
        style.textContent = [
            '.profile-dropdown-menu { position:absolute; top:calc(100% + 8px); right:0; min-width:220px; background:var(--bg-body,#fff); border:1px solid var(--border-color,#e2e8f0); border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.15); z-index:9999; display:none; overflow:hidden; }',
            '.profile-dropdown-menu.show { display:block; }',
            '.dd-header { display:flex; align-items:center; gap:12px; padding:16px; }',
            '.dd-avatar-circle { width:40px; height:40px; border-radius:50%; background:var(--accent-blue,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.9rem; flex-shrink:0; }',
            '.dd-info { min-width:0; }',
            '.dd-name { font-weight:600; font-size:0.9rem; color:var(--text-primary,#1e293b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
            '.dd-role { font-size:0.75rem; color:var(--text-secondary,#64748b); text-transform:capitalize; }',
            '.dd-email { font-size:0.75rem; color:var(--text-secondary,#64748b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
            '.dd-divider { height:1px; background:var(--border-color,#e2e8f0); margin:0; }',
            '.dd-item { display:flex; align-items:center; gap:10px; padding:10px 16px; font-size:0.85rem; color:var(--text-primary,#1e293b); text-decoration:none; cursor:pointer; transition:background 0.15s; }',
            '.dd-item:hover { background:var(--bg-secondary,#f1f5f9); }',
            '.dd-item span { font-size:1rem; }',
            '.dd-signout { color:var(--tag-red-text,#dc2626) !important; }',
            '.dd-signout:hover { background:rgba(220,38,38,0.08) !important; }',
            '.notif-dropdown-menu { position:absolute; top:calc(100% + 8px); right:0; min-width:240px; background:var(--bg-body,#fff); border:1px solid var(--border-color,#e2e8f0); border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.15); z-index:9999; display:none; overflow:hidden; }',
            '.notif-dropdown-menu.show { display:block; }',
            '.notif-header { padding:16px 16px 8px; font-weight:600; font-size:0.95rem; color:var(--text-primary,#1e293b); }',
            '.notif-empty { display:flex; flex-direction:column; align-items:center; gap:6px; padding:28px 16px; color:var(--text-secondary,#64748b); }',
            '.notif-empty-icon { font-size:1.8rem; }',
            '.notif-empty-text { font-size:0.9rem; }',
            '.notif-list { max-height:320px; overflow-y:auto; }',
            '.notif-item { display:flex; gap:10px; padding:10px 16px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid var(--border-color,#e2e8f0); }',
            '.notif-item:hover { background:var(--bg-secondary,#f1f5f9); }',
            '.notif-item.unread { background:rgba(37,99,235,0.04); }',
            '.notif-icon { font-size:1.1rem; flex-shrink:0; margin-top:2px; }',
            '.notif-body { min-width:0; flex:1; }',
            '.notif-title { font-size:0.82rem; font-weight:500; color:var(--text-primary,#1e293b); line-height:1.3; }',
            '.notif-msg { font-size:0.75rem; color:var(--text-secondary,#64748b); margin-top:1px; line-height:1.3; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }',
            '.notif-time { font-size:0.7rem; color:var(--text-secondary,#64748b); margin-top:3px; }',
        ].join('');
        document.head.appendChild(style);
    })();

    function setupNotificationDropdown() {
        var bellBtn = document.querySelector('.icon-btn .fa-bell, .icon-btn .fa-regular.fa-bell');
        if (!bellBtn) return;
        bellBtn = bellBtn.closest('button');
        if (!bellBtn || bellBtn.getAttribute('data-ndd')) return;
        bellBtn.setAttribute('data-ndd', '1');
        bellBtn.style.cursor = 'pointer';
        bellBtn.style.position = 'relative';

        var wrap = document.createElement('span');
        wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center';
        bellBtn.parentNode.insertBefore(wrap, bellBtn);
        wrap.appendChild(bellBtn);

        var badge = document.createElement('span');
        badge.className = 'notif-badge';
        badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#dc2626;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;display:none';
        wrap.appendChild(badge);

        var dd = document.createElement('div');
        dd.className = 'notif-dropdown-menu';
        dd.innerHTML = '<div class="notif-header">Notifications</div><div class="dd-divider"></div><div class="notif-loading" style="padding:24px;text-align:center;color:var(--text-secondary,#64748b);font-size:0.85rem">Loading...</div>';
        wrap.appendChild(dd);

        (function () {
            var s = window.NibrasServices?.adminNotificationService;
            if (s && s.count) {
                s.count().then(function (res) {
                    var data = res?.data || res || {};
                    var c = Number(data.count || 0);
                    if (c > 0) { badge.textContent = c > 99 ? '99+' : c; badge.style.display = 'flex'; }
                }).catch(function () {});
            }
        })();

        function refreshBadge() {
            var s = window.NibrasServices?.adminNotificationService;
            if (s && s.count) {
                s.count().then(function (res) {
                    var data = res?.data || res || {};
                    var c = Number(data.count || 0);
                    if (c > 0) { badge.textContent = c > 99 ? '99+' : c; badge.style.display = 'flex'; }
                    else badge.style.display = 'none';
                }).catch(function () {});
            }
        }
        setInterval(refreshBadge, 30000);

        function getSvc() { return window.NibrasServices?.adminNotificationService; }

        function renderNotifications() {
            dd.innerHTML = '<div class="notif-header">Notifications</div><div class="dd-divider"></div><div class="notif-loading" style="padding:24px;text-align:center;color:var(--text-secondary,#64748b);font-size:0.85rem">Loading...</div>';
            var svc = getSvc();
            if (!svc || !svc.list) { dd.innerHTML = '<div class="notif-header">Notifications</div><div class="dd-divider"></div><div class="notif-empty"><div class="notif-empty-icon">ℹ️</div><div class="notif-empty-text">Service unavailable</div></div>'; return; }
            svc.list(1, 20).then(function (res) {
                var data = res?.data || res || {};
                var items = data.notifications || [];
                if (!items.length) {
                    dd.innerHTML = '<div class="notif-header">Notifications</div><div class="dd-divider"></div><div class="notif-empty"><div class="notif-empty-icon">✅</div><div class="notif-empty-text">All caught up 🎉</div></div>';
                    return;
                }
                var html = '<div class="notif-header">' + (data.pagination?.total || items.length) + ' Notifications</div><div class="dd-divider"></div><div class="notif-list">';
                items.forEach(function (n) {
                    var icon = '📌';
                    if (n.type === 'contest_reminder') icon = '🏆';
                    else if (n.type === 'question_answered') icon = '💬';
                    else if (n.type === 'question_vote' || n.type === 'answer_vote' || n.type === 'comment_vote') icon = '⬆️';
                    var time = '';
                    if (n.createdAt) {
                        var diff = Date.now() - new Date(n.createdAt).getTime();
                        var mins = Math.floor(diff / 60000);
                        if (mins < 1) time = 'just now';
                        else if (mins < 60) time = mins + 'm ago';
                        else if (mins < 1440) time = Math.floor(mins / 60) + 'h ago';
                        else time = Math.floor(mins / 1440) + 'd ago';
                    }
                    var relatedId = n._id || n.id || '';
                    html += '<div class="notif-item' + (n.isRead ? '' : ' unread') + '" data-id="' + relatedId + '" data-type="' + (n.type || '') + '" data-related="' + (n.relatedId || '') + '"><div class="notif-icon">' + icon + '</div><div class="notif-body"><div class="notif-title">' + (n.title || '') + '</div><div class="notif-msg">' + (n.message || '') + '</div><div class="notif-time">' + time + '</div></div></div>';
                });
                html += '</div><div class="dd-divider"></div><div class="notif-footer" style="padding:8px 16px;text-align:center"><button class="notif-mark-read-btn" style="background:none;border:none;color:var(--accent-blue,#2563eb);cursor:pointer;font-size:0.8rem;padding:4px 8px">Mark all as read</button></div>';
                dd.innerHTML = html;

                var markBtn = dd.querySelector('.notif-mark-read-btn');
                if (markBtn) {
                    markBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (svc && svc.markAllRead) svc.markAllRead().catch(function () {});
                        badge.style.display = 'none';
                        renderNotifications();
                    });
                }

                var listEl = dd.querySelector('.notif-list');
                if (listEl) {
                    listEl.addEventListener('click', function (e) {
                        var item = e.target.closest('.notif-item');
                        if (!item) return;
                        var type = item.getAttribute('data-type') || '';
                        var related = item.getAttribute('data-related') || '';
                        var url = '';
                        if (type === 'contest_reminder') url = '/Competitions/Contests/contest.html';
                        else if (type === 'question_vote' || type === 'question_answered') url = related ? '/Community/QuestionID/question.html?questionId=' + encodeURIComponent(related) : '';
                        else if (type === 'answer_vote') url = related ? '/Community/QuestionID/question.html?questionId=' + encodeURIComponent(related) : '';
                        else if (type === 'comment_vote') url = '/Community/CourseDiscussions/discussions.html';
                        if (url) { dd.classList.remove('show'); window.location.href = url; }
                    });
                }
            }).catch(function () {
                dd.innerHTML = '<div class="notif-header">Notifications</div><div class="dd-divider"></div><div class="notif-empty"><div class="notif-empty-icon">❌</div><div class="notif-empty-text">Could not load notifications</div></div>';
            });
        }

        bellBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelectorAll('.profile-dropdown-menu.show, .notif-dropdown-menu.show').forEach(function (m) { m.classList.remove('show'); });
            dd.classList.toggle('show');
            if (dd.classList.contains('show')) renderNotifications();
        });
    }

    // --- Auto-init dropdown on all pages ---
    (function () {
        try {
            var u = JSON.parse(localStorage.getItem('user') || '{}');
            var init = u?.name ? u.name.split(' ').map(function (n) { return n[0]; }).join('').substring(0, 2).toUpperCase() : 'US';
            var nm = u?.name || 'User';
            var rl = u?.role?.name || u?.role || 'student';
            setupProfileDropdowns(u, init, nm, rl);
            setupNotificationDropdown();
        } catch (_) {}
    })();

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
            fetchTrackingSession,
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
