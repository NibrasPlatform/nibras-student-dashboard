window.NibrasReact.run(() => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const apiFetch = window.NibrasShared?.apiFetch;
    const resolveServiceUrl = window.NibrasApiConfig?.getServiceUrl?.bind(window.NibrasApiConfig)
        || window.NibrasShared?.resolveServiceUrl
        || (() => null);

    const adminApiBase = String(resolveServiceUrl('admin') || 'https://nibras-backend.up.railway.app/api').replace(/\/+$/, '');
    const trackingApiBase = String(resolveServiceUrl('tracking') || 'https://nibras-backend.up.railway.app/api').replace(/\/+$/, '');
    const githubServiceCandidates = ['tracking', 'admin'];
    const githubDisconnectPathCandidates = ['/v1/github/oauth/disconnect', '/v1/github/disconnect'];

    const btnConnectGitHub = document.getElementById('btn-connect-github');
    const btnInstallGitHubApp = document.getElementById('btn-install-github-app');
    const btnDisconnectGitHub = document.getElementById('btn-disconnect-github');

    function getBaseForService(service) {
        if (service === 'tracking') return trackingApiBase;
        return adminApiBase;
    }

    function isCompatibilityStatus(status) {
        return status === 404 || status === 405 || status === 501;
    }

    function buildGithubServiceCandidates() {
        const unique = [];
        githubServiceCandidates.forEach((service) => {
            const base = getBaseForService(service);
            if (!base) return;
            const duplicate = unique.some((entry) => entry.base === base);
            if (!duplicate) {
                unique.push({ service, base });
            }
        });
        return unique;
    }

    async function githubApiRequestWithFallback(path, options = {}, fallbackStatuses = [404, 405, 501]) {
        if (!apiFetch) {
            throw new Error('API fetch utility is unavailable.');
        }
        let lastError = null;
        const candidates = buildGithubServiceCandidates();
        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
            try {
                return await apiFetch(path, Object.assign({}, options, {
                    service: candidate.service,
                    auth: options.auth !== false,
                }));
            } catch (error) {
                const status = Number(error?.status || 0);
                const isLastCandidate = i === candidates.length - 1;
                const shouldFallback = fallbackStatuses.includes(status);
                lastError = error;
                if (!shouldFallback || isLastCandidate) {
                    throw error;
                }
            }
        }
        throw lastError || new Error(`No compatible endpoint found for ${path}`);
    }

    async function resolveGitHubConnectTarget() {
        if (typeof fetch !== 'function') {
            return { base: adminApiBase, path: '/v1/github/oauth/login' };
        }

        const candidates = buildGithubServiceCandidates();
        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
            try {
                const response = await fetch(`${candidate.base}/v1/github/config`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });
                if (response.status !== 404) {
                    return { base: candidate.base, path: '/v1/github/oauth/start' };
                }
            } catch (_) {
                // Probe failed, continue fallback chain.
            }
        }

        return { base: adminApiBase, path: '/v1/github/oauth/login' };
    }

    async function callFirstAvailableGithubDisconnectPath() {
        let lastError = null;
        const serviceCandidates = buildGithubServiceCandidates();
        for (let s = 0; s < serviceCandidates.length; s += 1) {
            const candidateService = serviceCandidates[s];
            for (let p = 0; p < githubDisconnectPathCandidates.length; p += 1) {
                const path = githubDisconnectPathCandidates[p];
                try {
                    await apiFetch(path, {
                        service: candidateService.service,
                        method: 'POST',
                        auth: true,
                    });
                    return;
                } catch (error) {
                    const status = Number(error?.status || 0);
                    lastError = error;
                    if (!isCompatibilityStatus(status)) {
                        throw error;
                    }
                }
            }
        }
        throw lastError || new Error('Failed to disconnect GitHub account.');
    }

    async function startGitHubAppInstallFlow() {
        const payload = await githubApiRequestWithFallback('/v1/github/install-url', {
            method: 'GET',
            auth: true,
        });
        const installUrl = String(payload?.installUrl || '').trim();
        if (!installUrl) {
            throw new Error('Install URL is missing from backend response.');
        }
        window.location.href = installUrl;
    }

    function setGitHubStatusMessage(message, tone = 'neutral') {
        const statusText = document.getElementById('github-status-text');
        if (!statusText) return;
        statusText.textContent = String(message || '');
        if (tone === 'error') {
            statusText.style.color = 'var(--tag-red-text, #dc2626)';
            return;
        }
        if (tone === 'success') {
            statusText.style.color = 'var(--accent-blue, #2563eb)';
            return;
        }
        statusText.style.color = '';
    }

    async function handleGitHubSetupCompletionFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const installationId = params.get('installation_id');
        if (!installationId) return;

        const stateToken = params.get('state') || undefined;
        try {
            await githubApiRequestWithFallback('/v1/github/setup/complete', {
                method: 'POST',
                auth: true,
                body: {
                    installationId,
                    state: stateToken,
                },
            });
            setGitHubStatusMessage('GitHub App installation linked successfully.', 'success');
        } catch (error) {
            setGitHubStatusMessage(error?.message || 'Could not complete GitHub App setup.', 'error');
        } finally {
            params.delete('installation_id');
            params.delete('state');
            params.delete('setup_action');
            const nextQuery = params.toString();
            const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
            window.history.replaceState({}, document.title, nextUrl);
        }
    }

    // --- GITHUB BUTTON ACTIONS ---
    if (btnConnectGitHub) {
        btnConnectGitHub.addEventListener('click', async () => {
            const originalText = btnConnectGitHub.innerHTML;
            btnConnectGitHub.disabled = true;
            btnConnectGitHub.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';

            try {
                const target = await resolveGitHubConnectTarget();
                if (target.path === '/v1/github/oauth/start') {
                    const returnTo = window.location.href;
                    window.location.href = `${target.base}${target.path}?return_to=${encodeURIComponent(returnTo)}`;
                    return;
                }
                window.location.href = `${target.base}${target.path}`;
            } catch (err) {
                alert('Could not start GitHub connection: ' + (err?.message || 'Unknown error'));
                btnConnectGitHub.disabled = false;
                btnConnectGitHub.innerHTML = originalText;
            }
        });
    }

    if (btnInstallGitHubApp) {
        btnInstallGitHubApp.addEventListener('click', async () => {
            const originalText = btnInstallGitHubApp.innerHTML;
            btnInstallGitHubApp.disabled = true;
            btnInstallGitHubApp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Opening...';
            try {
                await startGitHubAppInstallFlow();
            } catch (error) {
                alert('Could not start GitHub App installation: ' + (error?.message || 'Unknown error'));
                btnInstallGitHubApp.disabled = false;
                btnInstallGitHubApp.innerHTML = originalText;
            }
        });
    }

    if (btnDisconnectGitHub) {
        btnDisconnectGitHub.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to disconnect your GitHub account? Automated grading will be disabled.')) return;
            if (!apiFetch) {
                alert('Disconnect is unavailable because API utilities are not loaded on this page.');
                return;
            }
            try {
                await callFirstAvailableGithubDisconnectPath();
                location.reload();
            } catch (err) {
                if (Number(err?.status || 0) === 404) {
                    alert('Disconnect is not supported by the active backend integration.');
                    return;
                }
                alert('Failed to disconnect: ' + (err?.message || 'Unknown error'));
            }
        });
    }

    // --- 2. FETCH USER PROFILE FROM API ---
    async function loadUserProfile() {
        try {
            const cachedUser = JSON.parse(localStorage.getItem('user'));
            if (cachedUser && (cachedUser.name || cachedUser.username || cachedUser.email)) {
                applyProfileToUI(cachedUser);
            }
        } catch (_) {}

        try {
            const token = localStorage.getItem('token');
            if (!token || !apiFetch) return;

            const data = await fetchProfileWithFallback();
            const user = data?.user || data;
            if (user && (user.name || user.username || user.email)) {
                localStorage.setItem('user', JSON.stringify(user));
                applyProfileToUI(user);
            }
        } catch (err) {
            console.warn('[SETTINGS.JS] Could not fetch user profile:', err.message);
        }
    }

    async function fetchProfileWithFallback() {
        const profileCandidates = [
            { service: 'admin', path: '/auth/me' },
            { service: 'admin', path: '/v1/web/session' },
            { service: 'tracking', path: '/v1/web/session' },
            { service: 'admin', path: '/v1/me' },
            { service: 'tracking', path: '/v1/me' },
        ];
        let lastError = null;
        for (let index = 0; index < profileCandidates.length; index += 1) {
            const candidate = profileCandidates[index];
            try {
                return await apiFetch(candidate.path, {
                    service: candidate.service,
                    method: 'GET',
                    auth: true,
                });
            } catch (error) {
                const status = Number(error?.status || 0);
                const shouldTryFallback = isCompatibilityStatus(status);
                const isLastCandidate = index === profileCandidates.length - 1;
                lastError = error;
                if (!shouldTryFallback || isLastCandidate) {
                    throw error;
                }
            }
        }
        throw lastError || new Error('Unable to load profile from the active backend.');
    }

    function applyProfileToUI(user) {
        const nameInput = document.getElementById('input-name');
        const emailInput = document.getElementById('input-email');
        const idInput = document.getElementById('input-id');

        if (nameInput && (user.name || user.username)) nameInput.value = user.name || user.username;
        if (emailInput && user.email) emailInput.value = user.email;
        if (idInput && user.studentId) idInput.value = user.studentId;
        else if (idInput && user._id) idInput.value = user._id;
        else if (idInput && user.id) idInput.value = user.id;

        const btnConnect = document.getElementById('btn-connect-github');
        const btnInstall = document.getElementById('btn-install-github-app');
        const profileInfo = document.getElementById('github-profile-info');
        const statusText = document.getElementById('github-status-text');
        const usernameNode = document.getElementById('github-username');
        const avatarNode = document.getElementById('github-avatar');
        if (statusText) statusText.style.color = '';

        const githubUsername = user.githubUsername || user.githubLogin || '';
        const hasGithubLink = Boolean(user.githubId || githubUsername || user.githubLinked || user.githubAppInstalled);
        const hasAppInstall = Boolean(user.githubAppInstalled);

        if (hasGithubLink) {
            if (btnConnect) btnConnect.style.display = 'none';
            if (profileInfo) profileInfo.style.display = 'flex';
            if (usernameNode) usernameNode.textContent = githubUsername || 'Connected';
            if (avatarNode && user.githubAvatarUrl) avatarNode.src = user.githubAvatarUrl;

            if (hasAppInstall) {
                if (btnInstall) btnInstall.style.display = 'none';
                if (statusText) statusText.textContent = 'Connected and Synced';
            } else {
                if (btnInstall) btnInstall.style.display = '';
                if (statusText) statusText.textContent = 'Connected. Install GitHub App to enable automated grading.';
            }
        } else {
            if (btnConnect) btnConnect.style.display = '';
            if (btnInstall) btnInstall.style.display = 'none';
            if (profileInfo) profileInfo.style.display = 'none';
            if (statusText) statusText.textContent = 'Not connected';
        }
    }

    // Load setup completion first (if redirected from install), then profile.
    void handleGitHubSetupCompletionFromUrl().finally(() => {
        void loadUserProfile();
    });

    // --- 3. BACKEND DATA (fallback defaults) ---
    const settingsData = {
        profile: {
            name: "",
            email: "",
            studentId: "",
            avatar: ""
        },
        notifications: [
            { id: "notif-assign", title: "Assignment Deadlines", desc: "Get notified about upcoming assignment due dates", checked: true },
            { id: "notif-grade", title: "Grade Updates", desc: "Receive notifications when new grades are posted", checked: true },
            { id: "notif-course", title: "Course Announcements", desc: "Stay updated with course announcements from instructors", checked: true },
            { id: "notif-achieve", title: "Achievement Unlocked", desc: "Get notified when you earn new badges and achievements", checked: true },
            { id: "notif-email", title: "Email Notifications", desc: "Send notifications to your email address", checked: false }
        ],
        preferences: {
            language: "English",
            timezone: "Cairo",
            level: "Level 3"
        },
        privacy: [
            { id: "priv-public", title: "Public Profile", desc: "Make your profile visible to other students", checked: true },
            { id: "priv-progress", title: "Show Learning Progress", desc: "Display your course progress on your profile", checked: true },
            { id: "priv-achieve", title: "Show Achievements", desc: "Display your badges and achievements publicly", checked: true }
        ],
        theme: "light"
    };

    // --- 4. RENDER UI ---
    document.getElementById('input-name').value = settingsData.profile.name;
    document.getElementById('input-email').value = settingsData.profile.email;
    document.getElementById('input-id').value = settingsData.profile.studentId;

    const notifContainer = document.getElementById('notification-container');
    notifContainer.innerHTML = '';
    settingsData.notifications.forEach(n => {
        const isChecked = n.checked ? 'checked' : '';
        notifContainer.innerHTML += `
            <div class="toggle-row">
                <div class="toggle-info">
                    <h4>${n.title}</h4>
                    <p>${n.desc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="${n.id}" ${isChecked}>
                    <span class="slider round"></span>
                </label>
            </div>
        `;
    });

    document.getElementById('pref-lang').value = settingsData.preferences.language;
    document.getElementById('pref-timezone').value = settingsData.preferences.timezone;
    document.getElementById('pref-level').value = settingsData.preferences.level;

    const privContainer = document.getElementById('privacy-container');
    privContainer.innerHTML = '';
    settingsData.privacy.forEach(p => {
        const isChecked = p.checked ? 'checked' : '';
        privContainer.innerHTML += `
            <div class="toggle-row">
                <div class="toggle-info">
                    <h4>${p.title}</h4>
                    <p>${p.desc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="${p.id}" ${isChecked}>
                    <span class="slider round"></span>
                </label>
            </div>
        `;
    });

    // --- 5. THEME TOGGLE & SYNC ---
    const appLogo = document.getElementById('app-logo');
    const themeSelector = document.getElementById('theme-selector');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeUI(currentTheme);

    themeSelector.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('theme', selectedTheme);
        updateThemeUI(selectedTheme);
    });

    function updateThemeUI(theme) {
        if (appLogo) {
            appLogo.src = theme === 'dark' ? '../assets/images/logo-dark.png' : '../assets/images/logo-light.png';
        }
        if (themeSelector) {
            themeSelector.value = theme;
        }
    }

    // --- 6. SAVE (profile update endpoint not yet available) ---
    document.querySelector('.btn-save').addEventListener('click', () => {
        const btn = document.querySelector('.btn-save');
        const originalText = btn.textContent;
        btn.textContent = "Saving...";
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = "Profile update not yet available";
            btn.style.backgroundColor = "var(--tag-red-text, #dc2626)";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = "";
                btn.disabled = false;
            }, 2500);
        }, 800);
    });
});
