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

    // --- 1. THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // Check local storage or default
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Set initial icon
    if(currentTheme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun'; 
    } else {
        themeIcon.className = 'fa-solid fa-moon'; 
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-solid fa-moon';
        }
    });

    // --- 2. PASSWORD VISIBILITY ---
    window.togglePass = function(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // --- 3. FORM SUBMIT (Backend Integration) ---
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('nameInput').value.trim();
        const email = document.getElementById('emailInput').value.trim();
        const password = document.getElementById('passInput').value;
        const confirmPassword = document.getElementById('confPassInput').value;

        // Validation
        if (!name) {
            alert('Please enter your name');
            return;
        }
        if (!email) {
            alert('Please enter your email');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            console.log('[SIGNUP DEBUG] Attempting registration:', { name, email, backend: adminApiBase });

            const payload = await requestJson('/auth/register', {
                method: 'POST',
                service: 'admin',
                auth: false,
                retryAuth: false,
                body: JSON.stringify({ name, email, password })
            });
            const authData = shared.auth?.extractAuth ? shared.auth.extractAuth(payload) : extractAuthData(payload);
            const resolvedUser = authData.user || payload?.data || payload?.user || null;

            if (!authData.accessToken) {
                throw new Error('Registration succeeded but no access token was returned.');
            }

            setAuthData({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: resolvedUser,
            });
            alert('Account created successfully!');
            window.location.href = '../../Dashboard/dashboard.html';
        } catch (err) {
            console.error('[SIGNUP DEBUG] Network or parse error:', err);
            const message = err?.payload?.message || err?.message || 'Registration failed. Please try again.';
            alert(message);
        }
    });
});
