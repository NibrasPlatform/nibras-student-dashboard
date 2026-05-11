window.NibrasReact.run(() => {
    // Handle Google OAuth redirect callback
    (function handleGoogleCallback() {
        const params = new URLSearchParams(window.location.search);
        const googleAuth = params.get('google_auth');
        if (googleAuth === 'success') {
            const accessToken = sessionStorage.getItem('google_access_token');
            if (accessToken) {
                sessionStorage.removeItem('google_access_token');
                // Proceed with the access token
                (async () => {
                    try {
                        const response = await fetch(`${window.NibrasApiConfig?.getServiceUrl?.('admin') || ''}/auth/google`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ access_token: accessToken }),
                        });
                        const payload = await response.json();
                        if (payload.tokens?.access?.token) {
                            localStorage.setItem('nibras_access_token', payload.tokens.access.token);
                            if (payload.tokens.refresh?.token) {
                                localStorage.setItem('nibras_refresh_token', payload.tokens.refresh.token);
                            }
                            localStorage.setItem('nibras_user', JSON.stringify(payload.data));
                            window.location.href = '../../Dashboard/dashboard.html';
                            return;
                        }
                    } catch (e) {
                        console.error('Google auth failed:', e);
                    }
                    window.location.href = 'login.html?error=google_auth_failed';
                    return;
                })();
            } else {
                window.location.href = 'login.html?error=google_auth_failed';
            }
            return;
        } else if (googleAuth === 'error') {
            const message = params.get('message') || 'Google sign-in failed';
            sessionStorage.setItem('google_auth_error', message);
            window.location.href = 'login.html';
            return;
        }
    })();

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

    const setGithubStatus = (message, tone = 'info') => {
        const githubAuthStatus = document.getElementById('githubAuthStatus');
        if (!githubAuthStatus) return;
        if (!message) {
            githubAuthStatus.hidden = true;
            githubAuthStatus.textContent = '';
            githubAuthStatus.style.color = '';
            return;
        }
        githubAuthStatus.hidden = false;
        githubAuthStatus.textContent = String(message);
        if (tone === 'error') {
            githubAuthStatus.style.color = '#ef4444';
            return;
        }
        if (tone === 'success') {
            githubAuthStatus.style.color = '#10b981';
            return;
        }
        githubAuthStatus.style.color = '';
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
        if (window.google?.accounts?.id || window.google?.accounts?.oauth2) return Promise.resolve();
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

const handleGoogleCredentialResponse = async (response) => {
        console.log('Google credential response:', response);

        if (response.access_token) {
            const selectedRole = getSelectedRole();
            try {
                const payload = await requestJson('/auth/google', {
                    method: 'POST',
                    service: 'admin',
                    auth: false,
                    retryAuth: false,
                    body: JSON.stringify({ access_token: response.access_token }),
                });
                applyAuthenticatedSession(payload, selectedRole);
                setNotice('Google sign-in successful. Redirecting...', 'success');
                window.location.href = '../../Dashboard/dashboard.html';
            } catch (error) {
                const message = error?.payload?.message || error?.message || 'Google sign-in failed.';
                setNotice(message, 'error');
            }
        } else if (response.error) {
            console.error('Google sign-in error:', response.error);
            setNotice('Google sign-in failed: ' + (response.error_description || response.error), 'error');
        }
    };

    const handleGoogleCredential = async (credentialResponse) => {
        // Legacy handler - not used with new library
    };

    const handleGoogleAccessToken = async (accessToken) => {
        const selectedRole = getSelectedRole();

        try {
            const payload = await requestJson('/auth/google', {
                method: 'POST',
                service: 'admin',
                auth: false,
                retryAuth: false,
                body: JSON.stringify({ access_token: accessToken }),
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
        console.log('Google Client ID:', googleClientId);

        if (!googleClientId) {
            googleSignInContainer.hidden = true;
            setGoogleStatus('Google sign-in is unavailable: missing Google Client ID runtime configuration.', 'error');
            return;
        }

        if (!window.google?.accounts?.oauth2) {
            setGoogleStatus('Loading Google sign-in...', 'info');
            await ensureGoogleScriptLoaded();
        }

        if (!window.google?.accounts?.oauth2) {
            googleSignInContainer.hidden = true;
            setGoogleStatus('Google sign-in is unavailable: failed to load Google Identity script.', 'error');
            return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Google token error:', tokenResponse.error);
                    setNotice('Google sign-in failed: ' + (tokenResponse.error_description || tokenResponse.error), 'error');
                    return;
                }

                const selectedRole = getSelectedRole();
                try {
                    const payload = await requestJson('/auth/google', {
                        method: 'POST',
                        service: 'admin',
                        auth: false,
                        retryAuth: false,
                        body: JSON.stringify({ access_token: tokenResponse.access_token }),
                    });
                    applyAuthenticatedSession(payload, selectedRole);
                    setNotice('Google sign-in successful. Redirecting...', 'success');
                    window.location.href = '../../Dashboard/dashboard.html';
                } catch (error) {
                    const message = error?.payload?.message || error?.message || 'Google sign-in failed.';
                    setNotice(message, 'error');
                }
            },
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        googleSignInContainer.appendChild(buttonContainer);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'google-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 24px;background:#fff;border:1px solid #dadce0;border-radius:4px;font-family:Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;color:#3c4043;cursor:pointer;width:100%;max-width:320px;transition:background .2s,box-shadow .2s;';
        btn.onmouseenter = () => btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        btn.onmouseleave = () => btn.style.boxShadow = 'none';
        btn.onclick = () => {
            const anchor = document.createElement('a');
            anchor.href = '#';
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            try {
                tokenClient.requestAccessToken();
            } catch (e) {
                setNotice('Google sign-in failed. Please allow popups for this site.', 'error');
            } finally {
                requestAnimationFrame(() => document.body.removeChild(anchor));
            }
        };
        buttonContainer.appendChild(btn);

        console.log('Google button rendered');
        setGoogleStatus('');
    };

    void initializeGoogleAuth();
});
