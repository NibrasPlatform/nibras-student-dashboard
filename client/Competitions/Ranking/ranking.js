(window.NibrasReact && typeof window.NibrasReact.run === 'function'
    ? window.NibrasReact.run.bind(window.NibrasReact)
    : (initializer) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializer, { once: true });
        } else {
            initializer();
        }
    })(() => {
    const shared = window.NibrasShared || {};
    const uiStates = shared.uiStates;
    const competitionsService = window.NibrasServices?.competitionsService;
    const token = (() => {
        try {
            if (typeof shared.auth?.getToken === 'function') return shared.auth.getToken();
        } catch (_) {}
        return localStorage.getItem('token') || null;
    })();

    const statsContainer = document.getElementById('stats-container');
    const rankContainer = document.getElementById('ranking-list-container');
    const rateContainer = document.getElementById('rating-content-container');

    const state = {
        me: null,
        profile: null,
        progress: null,
        history: null,
    };

    const getProgressTotals = () => {
        const keys = ['beginner', 'newbie', 'intermediate', 'advanced'];
        let solved = 0;
        let total = 0;
        keys.forEach((key) => {
            solved += Number(state.progress?.[key]?.solved || 0);
            total += Number(state.progress?.[key]?.total || 0);
        });
        return { solved, total };
    };

    const verifiedCount = () => {
        const verification = state.profile?.verification || {};
        return Object.values(verification).filter((entry) => String(entry?.status || '').toLowerCase() === 'verified').length;
    };

    const syncSuccessCount = () => {
        const sync = state.profile?.sync || {};
        return Object.values(sync).filter((entry) => String(entry?.syncStatus || '').toLowerCase() === 'success').length;
    };

    const renderStats = () => {
        if (!statsContainer) return;
        const totals = getProgressTotals();
        const completion = totals.total ? Math.round((totals.solved / totals.total) * 100) : 0;
        const participations = Number(state.history?.pagination?.total || 0);
        const stats = [
            { label: 'Problems Solved', value: String(totals.solved), icon: 'fa-solid fa-bullseye', color: 'green' },
            { label: 'Completion', value: `${completion}%`, icon: 'fa-solid fa-chart-simple', color: 'yellow' },
            { label: 'Participations', value: String(participations), icon: 'fa-solid fa-users', color: 'blue' },
            { label: 'Verified Accounts', value: String(verifiedCount()), icon: 'fa-solid fa-shield-halved', color: 'purple' },
        ];

        statsContainer.innerHTML = '';
        stats.forEach((stat) => {
            let bgVar;
            let textVar;
            if (stat.color === 'yellow') { bgVar = 'var(--stat-yellow-bg)'; textVar = 'var(--stat-yellow-text)'; }
            if (stat.color === 'green') { bgVar = 'var(--stat-green-bg)'; textVar = 'var(--stat-green-text)'; }
            if (stat.color === 'blue') { bgVar = 'var(--stat-blue-bg)'; textVar = 'var(--stat-blue-text)'; }
            if (stat.color === 'purple') { bgVar = 'var(--stat-purple-bg)'; textVar = 'var(--stat-purple-text)'; }
            statsContainer.innerHTML += `
                <div class="stat-card">
                    <div class="stat-info">
                        <span>${stat.label}</span>
                        <h2>${stat.value}</h2>
                    </div>
                    <div class="stat-icon" style="background-color: ${bgVar}; color: ${textVar}">
                        <i class="${stat.icon}"></i>
                    </div>
                </div>
            `;
        });
    };

    const renderRankings = () => {
        if (!rankContainer) return;
        
        const platformsData = state.profile?.platforms || {};
        const cfHandle = platformsData.codeforces?.handle || null;
        const lcUsername = platformsData.leetcode?.username || null;
        
        // Get verification status
        const cfVerify = platformsData.codeforces?.verification?.status || 'unverified';
        const lcVerify = platformsData.leetcode?.verification?.status || 'unverified';
        
        const rows = [
            { label: 'Codeforces Handle', value: cfHandle || 'Not linked' },
            { label: 'LeetCode Username', value: lcUsername || 'Not linked' },
            { label: 'Codeforces Verification', value: cfVerify },
            { label: 'LeetCode Verification', value: lcVerify },
        ];
        rankContainer.innerHTML = '';
        rows.forEach((item) => {
            rankContainer.innerHTML += `
                <div class="rank-row">
                    <span>${item.label}</span>
                    <span class="rank-value">${item.value}</span>
                </div>
            `;
        });
    };

    const renderProgress = (message = '') => {
        let container = rateContainer || document.getElementById('rating-content-container');
        if (!container) return;
        
        const totals = getProgressTotals();
        const percent = totals.total ? Math.round((totals.solved / totals.total) * 100) : 0;
        
        const platformsData = state.profile?.platforms || {};
        const hasCf = !!(platformsData.codeforces?.handle);
        const hasLc = !!(platformsData.leetcode?.username);
        const linkedCount = [hasCf, hasLc].filter(Boolean).length;

        container.innerHTML = `
            <div class="rating-progress-row">
                <span class="rp-label">Solved / Total Problems</span>
                <span class="rp-val">${totals.solved} / ${totals.total}</span>
            </div>
            <div class="rating-progress-row">
                <span class="rp-sub">Linked Accounts: ${linkedCount}</span>
                <span class="rp-sub">${percent}%</span>
            </div>
            <div class="rating-bar-container">
                <div class="rating-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="rating-big-display">
                <div class="rating-number">${percent}%</div>
                <span class="rating-sub">Progress Completion</span>
                <div class="rating-badge">${linkedCount ? 'Connected' : 'Connect Accounts'}</div>
            </div>
            ${message ? `<p class="section-sub" style="margin-top: 12px;">${message}</p>` : ''}
            <div class="rating-progress-row" style="margin-top: 12px;">
                <button class="btn-register-full" id="btn-link-accounts">Link Accounts</button>
                <button class="btn-register-full" id="btn-sync-profile">Sync Profile</button>
                <button class="btn-register-full" id="btn-verify-account">Start Verification</button>
            </div>
        `;
    };

    const loadRankingData = async () => {
        try {
            const currentUser = await competitionsService.getMe();
            const userId = currentUser?._id || currentUser?.id;
            
            if (!userId) {
                renderProgress('Please login to view rankings');
                return;
            }
            
            const [profile, progress] = await Promise.all([
                competitionsService.getAggregatedProfile(userId).catch(() => ({})),
                competitionsService.getProgress().catch(() => ({}))
            ]);
            
            state.profile = profile || {};
            state.progress = progress || {};
            renderStats();
            renderRankings();
            renderProgress('');
        } catch (error) {
            renderProgress('Could not load data');
        }
    };

    const promptLinkAccounts = async () => {
        const codeforcesHandle = window.prompt('Codeforces handle (leave empty to skip):', '') || '';
        const leetcodeUsername = window.prompt('LeetCode username (leave empty to skip):', '') || '';
        const payload = {};
        if (codeforcesHandle.trim()) payload.codeforcesHandle = codeforcesHandle.trim();
        if (leetcodeUsername.trim()) payload.leetcodeUsername = leetcodeUsername.trim();
        if (!Object.keys(payload).length) {
            renderProgress('No account data provided.');
            return;
        }
        console.log('[linkAccounts] Payload:', payload);
        try {
            console.log('[linkAccounts] Calling service...');
            const result = await competitionsService.linkAccounts(payload);
            console.log('[linkAccounts] Result:', result);
            renderProgress('Accounts linked successfully. Reloading profile...');
            await loadRankingData();
        } catch (error) {
            console.error('[linkAccounts] Error:', error);
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                renderProgress('Your current session is not authorized for Competitions. Please sign in with a competitions account.');
                return;
            }
            renderProgress(error?.message || 'Failed to link accounts.');
        }
    };

    const triggerSync = async () => {
        try {
            renderProgress('Syncing profile...');
            const syncResult = await competitionsService.syncProfile({ force: true });
            const syncedCount = syncResult?.problemSync?.totalSynced || 0;
            renderProgress(`Profile synced. Updated solved problems: ${syncedCount}. Reloading...`);
            await loadRankingData();
        } catch (error) {
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                renderProgress('Your current session is not authorized for Competitions. Please sign in with a competitions account.');
                return;
            }
            renderProgress(error?.message || 'Failed to sync profile.');
        }
    };

    const startVerification = async () => {
        const platform = (window.prompt('Platform to verify (codeforces or leetcode):', 'codeforces') || '').trim().toLowerCase();
        if (platform !== 'codeforces' && platform !== 'leetcode') {
            renderProgress('Verification canceled. Platform must be codeforces or leetcode.');
            return;
        }
        console.log('[Verification] Starting for platform:', platform);
        try {
            if (competitionsService?.checkVerification) {
                try {
                    console.log('[Verification] Checking current status for:', platform);
                    const checkResult = await competitionsService.checkVerification(platform);
                    console.log('[Verification] Check result:', checkResult);
                    const currentStatus = checkResult?.data?.status?.toLowerCase();
                    if (currentStatus === 'verified') {
                        renderProgress(`${platform} account is already verified!`);
                        return;
                    }
                    if (currentStatus === 'pending') {
                        renderProgress(`${platform} verification is pending. Check again in a moment or complete the verification step.`);
                        return;
                    }
                } catch (checkError) {
                    console.log('[Verification] No pending session, proceeding to start:', checkError.message);
                }
            }
            console.log('[Verification] Starting verification for:', platform);
            const result = await competitionsService.startVerification(platform);
            console.log('[Verification] Start result:', result);
            const tokenValue = result?.data?.token ? ` Token: ${result.data.token}` : '';
            const platformName = platform === 'codeforces' ? 'Codeforces' : 'LeetCode';
            renderProgress(`${platformName} verification started.${tokenValue} Click the button again to check status.`);
            loadRankingData();
        } catch (error) {
            console.error('[Verification] Error:', error);
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                renderProgress('Your current session is not authorized for Competitions. Please sign in with a competitions account.');
                return;
            }
            renderProgress(error?.message || 'Failed to start verification.');
        }
    };

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.forEach((entry) => entry.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn?.querySelector('i');
    const appLogo = document.getElementById('app-logo');
    const applyThemeAssets = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (themeIcon) themeIcon.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
        if (appLogo) appLogo.src = isDark ? '../../Assets/images/logo-dark.png' : '../../Assets/images/logo-light.png';
    };
    applyThemeAssets();
    themeBtn?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        } catch (_) {
            // ignore storage write errors
        }
        applyThemeAssets();
    });

    const contentTabs = document.querySelectorAll('.tab-btn');
    contentTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            contentTabs.forEach((entry) => entry.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    rateContainer?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.id === 'btn-link-accounts') {
            void promptLinkAccounts();
        } else if (target.id === 'btn-sync-profile') {
            void triggerSync();
        } else if (target.id === 'btn-verify-account') {
            void startVerification();
        }
    });

    renderStats();
    renderRankings();
    renderProgress('Loading data...');
    loadRankingData();

    const accountLinksContainer = document.getElementById('account-links-container');
    const accountLinkStatus = document.getElementById('account-link-status');

    const linkAccountSimple = async (platform) => {
        const platformName = platform === 'codeforces' ? 'Codeforces' : 'LeetCode';
        const username = prompt(`Enter your ${platformName} username:`);
        if (!username || !username.trim()) {
            accountLinkStatus.innerHTML = '<span style="color:var(--status-error-text);">Username is required.</span>';
            return;
        }
        try {
            if (competitionsService?.linkAccounts) {
                const body = platform === 'codeforces' 
                    ? { codeforcesHandle: username.trim() }
                    : { leetcodeUsername: username.trim() };
                console.log('[Link Account] Sending request with body:', JSON.stringify(body));
                const result = await competitionsService.linkAccounts(body);
                console.log('[Link Account] Response:', result);
                accountLinkStatus.innerHTML = `<span style="color:var(--status-success-text);">${platformName} account linked! Reloading profile...</span>`;
                await loadRankingData();
                console.log('[Link Account] Profile after reload:', state.profile);
            } else {
                accountLinkStatus.innerHTML = '<span style="color:var(--status-error-text);">Link service not available.</span>';
            }
        } catch (error) {
            console.error('[Link Account] Error:', error);
            accountLinkStatus.innerHTML = `<span style="color:var(--status-error-text);">Failed to link: ${error?.message || 'Unknown error'}</span>`;
        }
    };

    accountLinksContainer?.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action="link-account"]');
        if (!target) return;
        const platform = target.dataset.platform;
        linkAccountSimple(platform);
    });
});
