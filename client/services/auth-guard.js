(function () {
    'use strict';

    var script = document.currentScript;
    var loginPage = script.getAttribute('data-login') || '../../Login/loginPage/login.html';
    var apiBase = script.getAttribute('data-api') || 'https://nibras-backend.up.railway.app/api';

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

    function getToken() {
        try {
            var keys = ['token', 'accessToken', 'authToken', 'nibras.webSession'];
            for (var i = 0; i < keys.length; i++) {
                var t = localStorage.getItem(keys[i]);
                if (t && typeof t === 'string' && t.trim()) return t.trim().replace(/^bearer\s+/i, '');
            }
            var s = sessionStorage.getItem('token');
            if (s && typeof s === 'string' && s.trim()) return s.trim().replace(/^bearer\s+/i, '');
        } catch (_) {}
        return null;
    }

    var token = getToken();

    if (!token) {
        redirectToLogin();
        return;
    }

    // Background validation — page renders immediately, redirects only if 401
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
                if (user) localStorage.setItem('user', JSON.stringify(user));
            } catch (_) {}
        } else if (xhr.status === 401) {
            clearAuth();
            redirectToLogin();
        }
    };

    xhr.onerror = xhr.ontimeout = function () {};

    xhr.send();
})();
