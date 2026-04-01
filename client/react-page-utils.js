(function () {
    const BACKEND_URL = window.NIBRAS_BACKEND_URL || 'http://localhost:5000';

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

    const getToken = () => localStorage.getItem('token');

    const getUser = () => {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (_) { return null; }
    };

    const setAuth = ({ token, user }) => {
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
    };

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const apiFetch = async (path, options = {}) => {
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        const token = getToken();
        if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${BACKEND_URL}${path}`, Object.assign({}, options, { headers }));
        let payload = null;
        try { payload = await response.json(); } catch (_) { payload = null; }

        if (!response.ok) {
            const message = (payload && (payload.message || payload.error)) || `Request failed (${response.status})`;
            const err = new Error(message);
            err.status = response.status;
            err.payload = payload;
            throw err;
        }

        return payload;
    };

    window.NibrasShared = {
        BACKEND_URL,
        onReady,
        theme: { getTheme, setTheme, toggleTheme },
        auth: { getToken, getUser, setAuth, clearAuth },
        apiFetch
    };
})();
