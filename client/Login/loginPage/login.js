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
    const themeIcon = themeBtn?.querySelector('i');
    if (themeIcon) {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            themeIcon.className = 'fa-regular fa-sun';
        } else {
            themeIcon.className = 'fa-regular fa-moon';
        }
    }
    themeBtn?.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) themeIcon.className = 'fa-regular fa-sun';
            return;
        }
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        if (themeIcon) themeIcon.className = 'fa-regular fa-moon';
    });

    window.togglePassword = function () {
        const passwordInput = document.getElementById('passwordInput');
        const icon = document.querySelector('.toggle-password');
        if (!passwordInput || !icon) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            return;
        }
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    };

    window.selectRole = function (element) {
        document.querySelectorAll('.role-card').forEach((card) => card.classList.remove('active'));
        element.classList.add('active');
    };

    const loginNotice = document.getElementById('loginNotice');
    const loginForm = document.getElementById('loginForm');
    const otpVerifyForm = document.getElementById('otpVerifyForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const otpEmailInput = document.getElementById('otpEmailInput');
    const otpCodeInput = document.getElementById('otpCodeInput');
    const googleSignInContainer = document.getElementById('googleSignInContainer');
    const googleAuthStatus = document.getElementById('googleAuthStatus');
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    const resolveGoogleClientId = () => {
        return String(
            window.NibrasApiConfig?.googleClientId ||
            new URLSearchParams(window.location.search).get('googleClientId') ||
            localStorage.getItem('nibras_google_client_id') ||
            window.NIBRAS_GOOGLE_CLIENT_ID ||
            ''
        ).trim();
    };

    const getSelectedRole = () => {
        const activeRoleCard = document.querySelector('.role-card.active');
        if (!activeRoleCard) return '';
        return String(activeRoleCard.querySelector('span')?.textContent || '').trim().toLowerCase();
    };

    const setNotice = (message, tone = 'info') => {
        if (!loginNotice) return;
        if (!message) {
            loginNotice.hidden = true;
            loginNotice.textContent = '';
            loginNotice.className = 'auth-notice';
            return;
        }
        loginNotice.hidden = false;
        loginNotice.textContent = String(message);
        loginNotice.className = tone === 'error'
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

    const shouldShowOtpAssist = (errorMessage, status) => {
        const message = String(errorMessage || '').toLowerCase();
        const unverifiedKeywords = ['not verified', 'verify your otp', 'otp', 'verification pending', 'pending verification'];
        const matches = unverifiedKeywords.some(keyword => message.includes(keyword));
        console.log('[LOGIN DEBUG] OTP check:', { status, message, matches });
        return (status === 403 || status === 400) && matches;
    };

    const applyAuthenticatedSession = (payload, selectedRole = '') => {
        const authData = shared.auth?.extractAuth ? shared.auth.extractAuth(payload) : extractAuthData(payload);
        const resolvedUser = authData.user || payload?.data || payload?.user || null;
        const resolvedRole = String(resolvedUser?.role?.name || resolvedUser?.role || '').toLowerCase();

        if (resolvedRole && selectedRole && resolvedRole !== selectedRole) {
            clearAuthData();
            throw new Error(`Role mismatch: you selected "${selectedRole}", but this account is "${resolvedRole}".`);
        }
        if (!authData.accessToken) {
            throw new Error('Authentication succeeded but no access token was returned.');
        }

        setAuthData({
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            user: resolvedUser,
        });
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setNotice('');

            const email = String(emailInput?.value || '').trim().toLowerCase();
            const password = String(passwordInput?.value || '');
            const selectedRole = getSelectedRole();

            if (!selectedRole) {
                setNotice('Please select a role before logging in.', 'error');
                return;
            }
            if (!gmailRegex.test(email)) {
                setNotice('Use a valid @gmail.com address. This backend only supports Gmail accounts.', 'error');
                return;
            }

            try {
                // Use the centralized authService
                const payload = await window.NibrasServices.authService.login(email, password);
                
                applyAuthenticatedSession(payload, selectedRole);
                setNotice('Login successful. Redirecting...', 'success');
                window.location.href = '../../Dashboard/dashboard.html';
            } catch (error) {
                const message = error?.payload?.message || error?.message || 'Login failed. Please try again.';
                const errorStatus = Number(error?.status || error?.payload?.statusCode || 0);
                console.log('[LOGIN DEBUG] Login error:', { message, errorStatus, error });
                
                if (shouldShowOtpAssist(message, errorStatus)) {
                    if (otpVerifyForm) {
                        otpVerifyForm.hidden = false;
                        setTimeout(() => {
                            otpVerifyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                    }
                    if (otpEmailInput && email) otpEmailInput.value = email;
                    setNotice('Your account requires OTP verification. Enter the 6-digit code sent to your email.', 'error');
                    setTimeout(() => {
                        if (otpCodeInput) otpCodeInput.focus();
                    }, 100);
                } else {
                    setNotice(message, 'error');
                }
            }
        });
    }

    if (otpVerifyForm) {
        otpVerifyForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setNotice('');

            const selectedRole = getSelectedRole();
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
                
                applyAuthenticatedSession(payload, selectedRole);
                setNotice('OTP verified successfully. Redirecting...', 'success');
                window.location.href = '../../Dashboard/dashboard.html';
            } catch (error) {
                const message = error?.payload?.message || error?.message || 'OTP verification failed. Check the code and try again.';
                setNotice(message, 'error');
                console.error('[LOGIN OTP ERROR]', error);
            }
        });
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
        const selectedRole = getSelectedRole();
        const idToken = String(credentialResponse?.credential || '').trim();
        if (!idToken) {
            setNotice('Google sign-in failed. Missing idToken.', 'error');
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
            applyAuthenticatedSession(payload, selectedRole);
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
