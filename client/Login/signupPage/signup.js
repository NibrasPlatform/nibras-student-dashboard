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
            const response = await fetch(`${adminApiBase}${path}`, {
                method: options.method || 'GET',
                headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
                body: options.body,
            });
            const payload = await response.json();
            if (!response.ok) {
                const error = new Error(payload?.message || `Request failed (${response.status})`);
                error.status = response.status;
                error.payload = payload;
                throw error;
            }
            return payload;
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

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn?.querySelector('i');
    if (themeIcon) {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
        }
    }
    themeBtn?.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
            return;
        }
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
    });

    window.togglePass = function (inputId, icon) {
        const input = document.getElementById(inputId);
        if (!input || !icon) return;
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            return;
        }
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    };

    const signupNotice = document.getElementById('signupNotice');
    const signupForm = document.getElementById('signupForm');
    const otpForm = document.getElementById('otpForm');
    const otpBackBtn = document.getElementById('otpBackBtn');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const passInput = document.getElementById('passInput');
    const confPassInput = document.getElementById('confPassInput');
    const otpEmailInput = document.getElementById('otpEmailInput');
    const otpCodeInput = document.getElementById('otpCodeInput');
    const otpEmailLabel = document.getElementById('otpEmailLabel');
    const googleSignInContainer = document.getElementById('googleSignInContainer');
    const googleAuthStatus = document.getElementById('googleAuthStatus');
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    const setNotice = (message, tone = 'info') => {
        if (!signupNotice) return;
        if (!message) {
            signupNotice.hidden = true;
            signupNotice.textContent = '';
            signupNotice.className = 'auth-notice';
            return;
        }
        signupNotice.hidden = false;
        signupNotice.textContent = String(message);
        signupNotice.className = tone === 'error'
            ? 'auth-notice error'
            : tone === 'success'
                ? 'auth-notice success'
                : 'auth-notice';
    };

    const setGoogleStatus = (message, tone = 'info') => {
        if (!googleAuthStatus) return;
        if (!message) {
            googleAuthStatus.hidden = true;
            googleAuthStatus.textContent = '';
            googleAuthStatus.style.color = '';
            return;
        }
        googleAuthStatus.hidden = false;
        googleAuthStatus.textContent = String(message);
        if (tone === 'error') {
            googleAuthStatus.style.color = '#ef4444';
            return;
        }
        if (tone === 'success') {
            googleAuthStatus.style.color = '#10b981';
            return;
        }
        googleAuthStatus.style.color = '';
    };

    const applyAuthenticatedSession = (payload) => {
        const authData = shared.auth?.extractAuth ? shared.auth.extractAuth(payload) : extractAuthData(payload);
        const resolvedUser = authData.user || payload?.data || payload?.user || null;
        if (!authData.accessToken) {
            throw new Error('Authentication succeeded but no access token was returned.');
        }
        setAuthData({
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            user: resolvedUser,
        });
    };

    const setOtpMode = (enabled, email = '') => {
        if (signupForm) signupForm.hidden = enabled;
        if (otpForm) otpForm.hidden = !enabled;
        if (!enabled) return;

        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (otpEmailInput) otpEmailInput.value = normalizedEmail;
        if (otpEmailLabel) otpEmailLabel.textContent = normalizedEmail || 'your email';
        if (normalizedEmail) localStorage.setItem('pendingVerificationEmail', normalizedEmail);
    };

    const resolveGoogleClientId = () => {
        return String(
            window.NibrasApiConfig?.googleClientId ||
            new URLSearchParams(window.location.search).get('googleClientId') ||
            localStorage.getItem('nibras_google_client_id') ||
            window.NIBRAS_GOOGLE_CLIENT_ID ||
            ''
        ).trim();
    };

    const resolveUserRole = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('signupinstructor')) return 'instructor';
        return 'student';
    };

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setNotice('');

            const name = String(nameInput?.value || '').trim();
            const email = String(emailInput?.value || '').trim().toLowerCase();
            const password = String(passInput?.value || '');
            const confirmPassword = String(confPassInput?.value || '');
            const role = resolveUserRole();

            if (!name) {
                setNotice('Please enter your name.', 'error');
                return;
            }
            if (!email) {
                setNotice('Please enter your email.', 'error');
                return;
            }
            if (!gmailRegex.test(email)) {
                setNotice('Use a valid @gmail.com address. OTP email verification is Gmail-only in this backend.', 'error');
                return;
            }
            if (password.length < 6) {
                setNotice('Password must be at least 6 characters.', 'error');
                return;
            }
            if (password !== confirmPassword) {
                setNotice('Passwords do not match.', 'error');
                return;
            }

            try {
                // Use the centralized authService
                const payload = await window.NibrasServices.authService.register({ 
                    name, 
                    email, 
                    password,
                    role 
                });
                
                setOtpMode(true, email);
                setNotice(
                    (payload?.message || 'Registration successful. Enter the OTP sent to your email.')
                    + ' If you do not see it, check Spam/Promotions.',
                    'success'
                );
            } catch (error) {
                const message = error?.payload?.message || error?.message || 'Registration failed. Please try again.';
                setNotice(message, 'error');
                console.error('[SIGNUP ERROR]', error);
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setNotice('');

            const email = String(otpEmailInput?.value || '').trim().toLowerCase();
            const otp = String(otpCodeInput?.value || '').trim();
            if (!email || !otp) {
                setNotice('Please provide both email and OTP code.', 'error');
                return;
            }
            if (!gmailRegex.test(email)) {
                setNotice('OTP verification requires a valid @gmail.com address.', 'error');
                return;
            }

            try {
                // Use the centralized authService
                const payload = await window.NibrasServices.authService.verifyOtp(email, otp);
                
                applyAuthenticatedSession(payload);
                localStorage.removeItem('pendingVerificationEmail');
                setNotice('OTP verified successfully. Redirecting...', 'success');
                window.location.href = '../../Dashboard/dashboard.html';
            } catch (error) {
                const message = error?.payload?.message || error?.message || 'OTP verification failed. Check the code and try again.';
                setNotice(message, 'error');
                console.error('[OTP ERROR]', error);
            }
        });
    }

    otpBackBtn?.addEventListener('click', () => {
        setOtpMode(false);
        setNotice('');
        localStorage.removeItem('pendingVerificationEmail');
    });

    const pendingEmail = String(localStorage.getItem('pendingVerificationEmail') || '').trim().toLowerCase();
    if (pendingEmail) {
        setOtpMode(true, pendingEmail);
        setNotice('Complete OTP verification to activate your account.', 'info');
    }

    let googleScriptPromise = null;
    const ensureGoogleScriptLoaded = () => {
        if (window.google?.accounts?.id) return Promise.resolve();
        if (googleScriptPromise) return googleScriptPromise;
        googleScriptPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-google-gsi="true"]');
            if (existingScript) {
                existingScript.addEventListener('load', resolve, { once: true });
                existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.dataset.googleGsi = 'true';
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), { once: true });
            document.head.appendChild(script);
        });
        return googleScriptPromise;
    };

    const handleGoogleCredential = async (credentialResponse) => {
        const idToken = String(credentialResponse?.credential || '').trim();
        if (!idToken) {
            setNotice('Google sign-up failed. Missing idToken.', 'error');
            return;
        }

        try {
            const payload = await requestJson('/auth/google', {
                method: 'POST',
                service: 'admin',
                auth: false,
                retryAuth: false,
                body: JSON.stringify({ idToken }),
            });
            applyAuthenticatedSession(payload);
            setNotice('Google sign-in successful. Redirecting...', 'success');
            window.location.href = '../../Dashboard/dashboard.html';
        } catch (error) {
            const message = error?.payload?.message || error?.message || 'Google sign-in failed.';
            setNotice(message, 'error');
        }
    };

    const initializeGoogleAuth = async () => {
        if (!googleSignInContainer) return;
        const googleClientId = resolveGoogleClientId();
        if (!googleClientId) {
            googleSignInContainer.hidden = true;
            setGoogleStatus('Google sign-in is unavailable: missing Google Client ID runtime configuration.', 'error');
            return;
        }

        try {
            await ensureGoogleScriptLoaded();
            if (!window.google?.accounts?.id) {
                throw new Error('Google Identity API is unavailable.');
            }
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential,
            });
            window.google.accounts.id.renderButton(googleSignInContainer, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: Math.min(360, googleSignInContainer.clientWidth || 320),
            });
            setGoogleStatus('');
        } catch (error) {
            googleSignInContainer.hidden = true;
            setGoogleStatus(error?.message || 'Google sign-in failed to initialize.', 'error');
        }
    };

    void initializeGoogleAuth();
});
