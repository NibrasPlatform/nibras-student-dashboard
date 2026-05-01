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
        const rows = [
            { label: 'Codeforces Handle', value: linkedAccounts.codeforces || 'Not linked' },
            { label: 'LeetCode Username', value: linkedAccounts.leetcode || 'Not linked' },
            { label: 'Codeforces Verification', value: verification.codeforces?.status || 'unverified' },
            { label: 'LeetCode Verification', value: verification.leetcode?.status || 'unverified' },
            { label: 'Successful Sync Platforms', value: String(syncSuccessCount()) },
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
        if (!rateContainer) return;
        const totals = getProgressTotals();
        const percent = totals.total ? Math.round((totals.solved / totals.total) * 100) : 0;
        const linked = state.profile?.linkedAccounts || {};
        const linkedCount = Object.values(linked).filter(Boolean).length;

        rateContainer.innerHTML = `
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
        if (!competitionsService) {
            if (uiStates?.render) uiStates.render(rateContainer, { state: 'error', message: 'Competitions service is unavailable.' });
            return;
        }
        if (!token) {
            if (uiStates?.render) {
                uiStates.render(rankContainer, { state: 'unauthorized', message: 'Sign in to view ranking data.' });
                uiStates.render(rateContainer, { state: 'unauthorized', message: 'Sign in to link and sync accounts.' });
            }
            return;
        }

        if (uiStates?.render) uiStates.render(rateContainer, { state: 'loading', message: 'Loading ranking data...' });
        try {
            const me = await competitionsService.getMe();
            state.me = me;

            const [profile, progress, history] = await Promise.all([
                me?._id || me?.id ? competitionsService.getAggregatedProfile(me._id || me.id) : Promise.resolve(null),
                competitionsService.getProgress(),
                competitionsService.listHistory({ page: 1, limit: 1 }),
            ]);

            state.profile = profile || {};
            state.progress = progress || {};
            state.history = history || null;
            renderStats();
            renderRankings();
            renderProgress('');
        } catch (error) {
            const stateInfo = uiStates?.fromError ? uiStates.fromError(error, 'Could not load ranking data.') : { state: 'error', message: error?.message || 'Could not load ranking data.' };
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                stateInfo.state = 'unauthorized';
                stateInfo.message = 'Your current session is not authorized for Competitions. Please sign in with a competitions account.';
            }
            if (uiStates?.render) uiStates.render(rateContainer, { state: stateInfo.state, message: stateInfo.message });
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
        try {
            await competitionsService.linkAccounts(payload);
            renderProgress('Accounts linked successfully. Reloading profile...');
            await loadRankingData();
        } catch (error) {
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
        try {
            const result = await competitionsService.startVerification(platform);
            const tokenValue = result?.data?.token ? ` Token: ${result.data.token}` : '';
            renderProgress(`Verification started for ${platform}.${tokenValue}`);
        } catch (error) {
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
    renderProgress('');
    void loadRankingData();
});
