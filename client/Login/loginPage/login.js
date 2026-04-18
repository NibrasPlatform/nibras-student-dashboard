window.NibrasReact.run(() => {

    const shared = window.NibrasShared || {};
    const adminApiBase =
        (typeof shared.resolveServiceUrl === 'function' ? shared.resolveServiceUrl('admin') : null) ||
        window.NibrasApi?.resolveServiceUrl?.('admin') ||
        window.NibrasApiConfig?.getServiceUrl?.('admin') ||
        window.NIBRAS_API_URL ||
        window.NIBRAS_BACKEND_URL ||
        (/^https?:/i.test(window.location?.origin || '') ? window.location.origin.replace(/\/+$/, '') : '');
    const requestJson = shared.apiFetch
        ? shared.apiFetch.bind(shared)
        : async (path, options = {}) => {
            const res = await fetch(`${adminApiBase}${path}`, {
                method: options.method || 'GET',
                headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
                body: options.body,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
            return data;
        };
    const extractAuthData = (payload) => {
        const data = payload?.data || payload || {};
        const tokens = payload?.tokens || data?.tokens || {};
        const accessToken =
            data?.token ||
            data?.accessToken ||
            payload?.token ||
            payload?.accessToken ||
            tokens?.access?.token ||
            tokens?.accessToken ||
            null;
        const refreshToken =
            data?.refreshToken ||
            payload?.refreshToken ||
            tokens?.refresh?.token ||
            tokens?.refreshToken ||
            null;
        const user =
            data?.user ||
            payload?.user ||
            (data && data._id ? data : null) ||
            (payload && payload._id ? payload : null) ||
            null;
        return { accessToken, refreshToken, user };
    };
    const setAuthData = ({ accessToken, refreshToken, user }) => {
        if (shared.auth?.setAuth) {
            shared.auth.setAuth({ accessToken, refreshToken, user });
            return;
        }
        if (accessToken) localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));
    };
    const clearAuthData = () => {
        if (shared.auth?.clearAuth) {
            shared.auth.clearAuth();
            return;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // --- 1. THEME TOGGLE ---
    // Initial State Check
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
    } else {
        themeIcon.className = 'fa-regular fa-moon';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
        }
    });

    // --- 2. PASSWORD TOGGLE ---
    window.togglePassword = function() {
        const passwordInput = document.getElementById('passwordInput');
        const icon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // --- 3. ROLE SELECTION ---
    window.selectRole = function(element) {
        // Remove active class from all cards
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to clicked card
        element.classList.add('active');
        
        console.log("Selected Role:", element.querySelector('span').textContent);
    };

    // --- 4. FORM SUBMIT (Backend Integration) ---
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.querySelector('input[type="email"]').value;
        const password = document.getElementById('passwordInput').value;
        // Replace your existing role extraction with this:
        const activeRoleCard = document.querySelector('.role-card.active');

        if (!activeRoleCard) {
            alert('Please select a role before logging in.');
            return; // Stops the function from proceeding
        }

        const selectedRole = activeRoleCard.querySelector('span').textContent.toLowerCase();

        try {
            console.log('[LOGIN DEBUG] Attempting login:', { email, selectedRole, backend: adminApiBase });

            const payload = await requestJson('/auth/login', {
                method: 'POST',
                service: 'admin',
                auth: false,
                retryAuth: false,
                body: JSON.stringify({ email, password })
            });
            const authData = shared.auth?.extractAuth ? shared.auth.extractAuth(payload) : extractAuthData(payload);
            const resolvedUser = authData.user || payload?.data || payload?.user || null;
            const resolvedRole = String(resolvedUser?.role?.name || resolvedUser?.role || '').toLowerCase();

            if (resolvedRole && selectedRole && resolvedRole !== selectedRole) {
                clearAuthData();
                alert(`Role mismatch: you selected "${selectedRole}", but this account is "${resolvedRole}".`);
                return;
            }

            if (!authData.accessToken) {
                throw new Error('Login succeeded but no access token was returned.');
            }

            setAuthData({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: resolvedUser,
            });
            window.location.href = '../../Dashboard/dashboard.html';
        } catch (err) {
            console.error('[LOGIN DEBUG] Network or parse error:', err);
            const message = err?.payload?.message || err?.message || 'Login failed. Please check your connection and try again.';
            alert(message);
        }
    });
});
