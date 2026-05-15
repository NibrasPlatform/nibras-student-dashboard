(function () {
    'use strict';

    var script = document.currentScript;
    var loginPage = script.getAttribute('data-login') || '../../Login/loginPage/login.html';
    var apiBase = script.getAttribute('data-api') || 'https://nibras-backend.up.railway.app/api';

    // Step 1: Inject CSS to hide body + show loading overlay
    var style = document.createElement('style');
    style.textContent = [
        'body { visibility: hidden !important; }',
        '#nibras-auth-loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 99999; font-family: "Inter", sans-serif; }',
        '[data-theme="dark"] #nibras-auth-loading { background: #0f172a; }',
        '.nibras-auth-spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: nibras-spin 0.8s linear infinite; margin-bottom: 16px; }',
        '@keyframes nibras-spin { to { transform: rotate(360deg); } }',
        '#nibras-auth-loading p { color: #6b7280; font-size: 14px; margin: 0; }',
        '.nibras-auth-loaded body { visibility: visible !important; }',
        '.nibras-auth-loaded #nibras-auth-loading { display: none !important; }',
    ].join('');
    document.head.appendChild(style);

    // Step 2: Append loading overlay
    var loading = document.createElement('div');
    loading.id = 'nibras-auth-loading';
    loading.innerHTML = '<div class="nibras-auth-spinner"></div><p>Verifying session...</p>';
    document.documentElement.appendChild(loading);

    // Step 3: Auth check
    function redirectToLogin() {
        window.location.replace(loginPage);
    }

    function clearAuth() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
        } catch (_) {}
    }

    function onAuthSuccess(userData) {
        if (userData) {
            try { localStorage.setItem('user', JSON.stringify(userData)); } catch (_) {}
        }
        document.documentElement.classList.add('nibras-auth-loaded');
    }

    function validateToken(token) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiBase.replace(/\/+$/, '') + '/auth/me', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.timeout = 10000;

        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var payload = JSON.parse(xhr.responseText);
                    var user = payload?.user || payload?.data?.user || payload?.data || null;
                    onAuthSuccess(user);
                } catch (_) {
                    onAuthSuccess(null);
                }
            } else if (xhr.status === 401) {
                clearAuth();
                redirectToLogin();
            } else {
                // Other errors: let user in (might be network/CORS)
                onAuthSuccess(null);
            }
        };

        xhr.onerror = function () {
            // Network error — allow access (offline fallback)
            onAuthSuccess(null);
        };

        xhr.ontimeout = function () {
            // Timeout — allow access
            onAuthSuccess(null);
        };

        xhr.send();
    }

    // Step 4: Get token and validate
    function getToken() {
        try {
            var candidates = [
                localStorage.getItem('token'),
                localStorage.getItem('accessToken'),
                localStorage.getItem('authToken'),
                localStorage.getItem('nibras.webSession'),
                sessionStorage.getItem('token'),
            ];
            for (var i = 0; i < candidates.length; i++) {
                var t = candidates[i];
                if (t && typeof t === 'string' && t.trim()) {
                    var cleaned = t.trim().replace(/^bearer\s+/i, '');
                    if (cleaned) return cleaned;
                }
            }
        } catch (_) {}
        return null;
    }

    var token = getToken();

    if (!token) {
        redirectToLogin();
    } else {
        validateToken(token);
    }
})();
