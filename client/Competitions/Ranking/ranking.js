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
        
        const linkedAccounts = state.profile?.linkedAccounts || {};
        const verification = state.profile?.verification || {};
        
        const cfHandle = linkedAccounts.codeforces || null;
        const lcUsername = linkedAccounts.leetcode || null;
        
        // Get verification status
        const cfVerify = verification.codeforces?.status || 'unverified';
        const lcVerify = verification.leetcode?.status || 'unverified';
        
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
        
        const linkedAccounts = state.profile?.linkedAccounts || {};
        const hasCf = !!linkedAccounts.codeforces;
        const hasLc = !!linkedAccounts.leetcode;
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
            <div class="rating-progress-row" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
                <button class="btn-register-full" id="btn-link-accounts">Link Accounts</button>
                <button class="btn-register-full" id="btn-sync-profile">Sync Profile</button>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-register-full" data-action="verify-account" data-platform="codeforces" style="flex: 1;">Verify Codeforces</button>
                <button class="btn-register-full" data-action="check-verification" data-platform="codeforces" style="flex: 1;">Check Codeforces</button>
                <button class="btn-register-full" data-action="verify-account" data-platform="leetcode" style="flex: 1;">Verify LeetCode</button>
                <button class="btn-register-full" data-action="check-verification" data-platform="leetcode" style="flex: 1;">Check LeetCode</button>
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
            
            console.log('[loadRankingData] Profile:', profile);
            console.log('[loadRankingData] Progress:', progress);
            
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

    const startVerification = async (platformArg) => {
        let platform = platformArg;
        if (!platform) {
            platform = (window.prompt('Platform to verify (codeforces or leetcode):', 'codeforces') || '').trim().toLowerCase();
        }
        if (platform !== 'codeforces' && platform !== 'leetcode') {
            renderProgress('Verification canceled. Platform must be codeforces or leetcode.');
            return null;
        }
        console.log('[Verification] Starting for platform:', platform);
        try {
            console.log('[Verification] Starting verification for:', platform);
            const result = await competitionsService.startVerification(platform);
            console.log('[Verification] Start result:', result);
            const data = result?.data;
            const platformName = platform === 'codeforces' ? 'Codeforces' : 'LeetCode';
            
            if (data?.token) {
                renderVerificationStarted(platform, platformName, data);
                renderProgress('Verification started! Reloading profile...');
                await loadRankingData();
                return data;
            } else if (data?.verified) {
                renderVerificationResult(platform, platformName, data);
                return data;
            } else {
                renderProgress(`${platformName} verification started. Check again using the "Check Verification" button.`);
                return data;
            }
        } catch (error) {
            console.error('[Verification] Error:', error);
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                renderProgress('Your current session is not authorized for Competitions. Please sign in with a competitions account.');
                return null;
            }
            if (error?.code === 'TIMEOUT') {
                renderProgress('Verification request timed out. The backend took too long. Please try again.');
            } else {
                renderProgress(error?.message || 'Failed to start verification.');
            }
            return null;
        }
    };

    const checkVerification = async (platformArg) => {
        let platform = platformArg;
        if (!platform) {
            platform = (window.prompt('Platform to check (codeforces or leetcode):', 'codeforces') || '').trim().toLowerCase();
        }
        if (platform !== 'codeforces' && platform !== 'leetcode') {
            renderProgress('Check canceled. Platform must be codeforces or leetcode.');
            return;
        }
        console.log('[Verification] Checking for platform:', platform);
        try {
            const result = await competitionsService.checkVerification(platform);
            console.log('[Verification] Check result:', result);
            const data = result?.data;
            const platformName = platform === 'codeforces' ? 'Codeforces' : 'LeetCode';
            
            if (data?.verified) {
                renderVerificationResult(platform, platformName, data);
                renderProgress('Account verified! Reloading profile...');
                await loadRankingData();
            } else if (data?.status === 'pending' || data?.token) {
                renderVerificationPending(platform, platformName, data);
            } else {
                renderProgress(`${platformName} verification not started. Use "Start Verification" first.`);
            }
        } catch (error) {
            console.error('[Verification] Check error:', error);
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                renderProgress('Your current session is not authorized for Competitions. Please sign in with a competitions account.');
                return;
            }
            if (error?.code === 'TIMEOUT') {
                renderProgress('Verification check timed out. Please try again.');
            } else {
                renderProgress(error?.message || 'Failed to check verification.');
            }
        }
    };

    const renderVerificationStarted = (platform, platformName, data) => {
        const container = document.getElementById('rating-content-container') || rateContainer;
        if (!container) return;
        
        const expiresDate = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'N/A';
        
        container.innerHTML = `
            <div class="verification-info" style="background: var(--card-bg); padding: 20px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                <h4 style="margin: 0 0 16px 0; color: var(--primary-color);">
                    <i class="fa-solid fa-circle-check" style="color: var(--primary-color);"></i> 
                    ${platformName} Verification Started
                </h4>
                <div style="margin-bottom: 12px;">
                    <strong style="display: block; margin-bottom: 4px; color: var(--text-secondary);">Your Token:</strong>
                    <code style="background: var(--code-bg); padding: 8px 12px; border-radius: 4px; font-size: 16px; display: block; word-break: break-all; color: var(--accent-color);">${data.token || 'N/A'}</code>
                </div>
                <div style="margin-bottom: 12px;">
                    <strong style="display: block; margin-bottom: 4px; color: var(--text-secondary);">Expires At:</strong>
                    <span style="color: var(--text-primary);">${expiresDate}</span>
                </div>
                <div style="margin-bottom: 12px;">
                    <strong style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Instructions:</strong>
                    <p style="margin: 0; color: var(--text-primary); line-height: 1.5;">${data.instruction || 'Submit code and get a COMPILATION_ERROR verdict between start and expiry time.'}</p>
                </div>
                <p style="margin: 16px 0 0 0; padding: 12px; background: var(--warning-bg); border-radius: 6px; font-size: 13px; color: var(--warning-text);">
                    <i class="fa-solid fa-info-circle"></i> 
                    After completing the verification step, click "Check Verification" to verify your account.
                </p>
            </div>
            <div class="rating-progress-row" style="margin-top: 12px;">
                <button class="btn-register-full" data-action="check-verification" data-platform="${platform}">Check Verification</button>
                <button class="btn-register-full" data-action="restart-verification" data-platform="${platform}">Start New Verification</button>
            </div>
        `;
    };

    const renderVerificationResult = (platform, platformName, data) => {
        const container = document.getElementById('rating-content-container') || rateContainer;
        if (!container) return;
        
        const verifiedDate = data.verifiedAt ? new Date(data.verifiedAt).toLocaleString() : 'N/A';
        const expiresDate = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'N/A';
        const evidence = data.evidence || {};
        
        container.innerHTML = `
            <div class="verification-success" style="background: var(--success-bg); padding: 20px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--success-border);">
                <h4 style="margin: 0 0 16px 0; color: var(--success-text);">
                    <i class="fa-solid fa-shield-halved" style="color: var(--success-text);"></i> 
                    ${platformName} Account Verified!
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <strong style="display: block; margin-bottom: 4px; color: var(--text-secondary);">Verified At:</strong>
                        <span style="color: var(--text-primary);">${verifiedDate}</span>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 4px; color: var(--text-secondary);">Valid Until:</strong>
                        <span style="color: var(--text-primary);">${expiresDate}</span>
                    </div>
                </div>
                ${evidence.submissionId ? `
                <div style="background: var(--card-bg); padding: 12px; border-radius: 6px;">
                    <strong style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Verification Evidence:</strong>
                    <p style="margin: 4px 0; color: var(--text-primary); font-size: 14px;">
                        <strong>Problem:</strong> <a href="${evidence.problemUrl || '#'}" target="_blank" style="color: var(--primary-color);">${evidence.contestId}${evidence.problemIndex}</a>
                    </p>
                    <p style="margin: 4px 0; color: var(--text-primary); font-size: 14px;">
                        <strong>Verdict:</strong> <span style="color: var(--warning-text);">${evidence.verdict}</span>
                    </p>
                    <p style="margin: 4px 0; color: var(--text-primary); font-size: 14px;">
                        <strong>Rule:</strong> ${evidence.matchedRule}
                    </p>
                </div>
                ` : ''}
            </div>
            <div class="rating-progress-row" style="margin-top: 12px;">
                <button class="btn-register-full" data-action="check-verification" data-platform="${platform}">Re-check Verification</button>
                <button class="btn-register-full" data-action="restart-verification" data-platform="${platform}">Start New Verification</button>
            </div>
        `;
    };

    const renderVerificationPending = (platform, platformName, data) => {
        const container = document.getElementById('rating-content-container') || rateContainer;
        if (!container) return;
        
        const expiresDate = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'N/A';
        
        container.innerHTML = `
            <div class="verification-pending" style="background: var(--warning-bg); padding: 20px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--warning-border);">
                <h4 style="margin: 0 0 16px 0; color: var(--warning-text);">
                    <i class="fa-solid fa-clock" style="color: var(--warning-text);"></i> 
                    ${platformName} Verification Pending
                </h4>
                ${data.token ? `
                <div style="margin-bottom: 12px;">
                    <strong style="display: block; margin-bottom: 4px; color: var(--text-secondary);">Your Token:</strong>
                    <code style="background: var(--code-bg); padding: 8px 12px; border-radius: 4px; font-size: 16px; display: block; word-break: break-all; color: var(--accent-color);">${data.token}</code>
                </div>
                ` : ''}
                <p style="margin: 0; color: var(--warning-text);">
                    <i class="fa-solid fa-info-circle"></i> 
                    Verification still pending. Complete the verification step and check again.
                </p>
            </div>
            <div class="rating-progress-row" style="margin-top: 12px;">
                <button class="btn-register-full" data-action="check-verification" data-platform="${platform}">Check Verification</button>
                <button class="btn-register-full" data-action="restart-verification" data-platform="${platform}">Start New Verification</button>
            </div>
        `;
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
        
        console.log('[RateContainer] Clicked target:', target.id, target.dataset);
        
        if (target.id === 'btn-link-accounts') {
            void promptLinkAccounts();
        } else if (target.id === 'btn-sync-profile') {
            void triggerSync();
        } else {
            const actionBtn = target.closest('[data-action]');
            console.log('[RateContainer] ActionButton:', actionBtn);
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const platform = actionBtn.dataset.platform;
            console.log('[RateContainer] Action:', action, 'Platform:', platform);

            if (action === 'verify-account') {
                void startVerification(platform);
            } else if (action === 'check-verification') {
                void checkVerification(platform);
            } else if (action === 'restart-verification') {
                void startVerification(platform);
            }
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        
        const actionBtn = target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const platform = actionBtn.dataset.platform;
        console.log('[Document] Action:', action, 'Platform:', platform);

        if (action === 'check-verification') {
            void checkVerification(platform);
        } else if (action === 'restart-verification') {
            void startVerification(platform);
        } else if (action === 'verify-account') {
            void startVerification(platform);
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
