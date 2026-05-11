window.NibrasReact.run(() => {
    // Handle Google OAuth redirect callback
    (function handleGoogleCallback() {
        const params = new URLSearchParams(window.location.search);
        const googleAuth = params.get('google_auth');
        if (googleAuth === 'success') {
            const accessToken = sessionStorage.getItem('google_access_token');
            if (accessToken) {
                sessionStorage.removeItem('google_access_token');
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
                    window.location.href = 'signup.html?error=google_auth_failed';
                    return;
                })();
            } else {
                window.location.href = 'signup.html?error=google_auth_failed';
            }
            return;
        } else if (googleAuth === 'error') {
            const message = params.get('message') || 'Google sign-in failed';
            sessionStorage.setItem('google_auth_error', message);
            window.location.href = 'signup.html';
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
            try {
                const payload = await requestJson('/auth/google', {
                    method: 'POST',
                    service: 'admin',
                    auth: false,
                    retryAuth: false,
                    body: JSON.stringify({ access_token: response.access_token }),
                });
                applyAuthenticatedSession(payload);
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
        try {
            const payload = await requestJson('/auth/google', {
                method: 'POST',
                service: 'admin',
                auth: false,
                retryAuth: false,
                body: JSON.stringify({ access_token: accessToken }),
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

                try {
                    const payload = await requestJson('/auth/google', {
                        method: 'POST',
                        service: 'admin',
                        auth: false,
                        retryAuth: false,
                        body: JSON.stringify({ access_token: tokenResponse.access_token }),
                    });
                    applyAuthenticatedSession(payload);
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

        console.log('Google button rendered successfully');
        setGoogleStatus('');
    };

    void initializeGoogleAuth();
});
