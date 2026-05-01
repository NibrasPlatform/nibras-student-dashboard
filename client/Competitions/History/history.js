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
    const historyContainer = document.getElementById('history-list-container');

    const state = {
        items: [],
        pagination: null,
    };

    const renderStats = () => {
        if (!statsContainer) return;
        const total = Number(state.pagination?.total || state.items.length || 0);
        const codeforcesCount = state.items.filter((item) => String(item.platform || '').toLowerCase() === 'codeforces').length;
        const leetcodeCount = state.items.filter((item) => String(item.platform || '').toLowerCase() === 'leetcode').length;
        const latestSource = state.items[0]?.source || 'N/A';
        const stats = [
            { label: 'Total Participations', value: String(total), icon: 'fa-solid fa-users', color: 'blue' },
            { label: 'Codeforces Entries', value: String(codeforcesCount), icon: 'fa-solid fa-code', color: 'green' },
            { label: 'LeetCode Entries', value: String(leetcodeCount), icon: 'fa-solid fa-laptop-code', color: 'yellow' },
            { label: 'Latest Source', value: String(latestSource), icon: 'fa-solid fa-clock-rotate-left', color: 'purple' },
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

    const renderHistory = () => {
        if (!historyContainer) return;
        if (!state.items.length) {
            if (uiStates?.render) {
                uiStates.render(historyContainer, { state: 'empty', message: 'No contest history yet.' });
            } else {
                historyContainer.innerHTML = '<p>No contest history yet.</p>';
            }
            return;
        }

        historyContainer.innerHTML = '';
        state.items.forEach((item) => {
            const platform = String(item.platform || '').toLowerCase();
            const source = item.source || 'manual';
            const name = item.contestName || 'Contest';
            const contestId = item.contestId || 'N/A';
            const isCodeforces = platform === 'codeforces';
            const platformClass = isCodeforces ? 'success' : 'fail';
            const platformIcon = isCodeforces ? 'fa-code' : 'fa-laptop-code';

            historyContainer.innerHTML += `
                <div class="history-card">
                    <div class="hc-header">
                        <div class="hc-title">
                            <h4>${name}</h4>
                        </div>
                        <div class="hc-rank">
                            <div><i class="fa-solid ${platformIcon}"></i> ${platform || 'unknown'}</div>
                            <div>Source: <span class="rating-change">${source}</span></div>
                        </div>
                    </div>
                    <div class="prob-grid">
                        <div class="prob-box ${platformClass}">
                            <div class="box-header"><i class="fa-regular fa-circle-check"></i> Contest ID</div>
                            <div class="box-meta">
                                <span>${contestId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    };

    const loadHistory = async () => {
        if (!competitionsService) {
            if (uiStates?.render) uiStates.render(historyContainer, { state: 'error', message: 'Competitions service is unavailable.' });
            return;
        }
        if (!token) {
            if (uiStates?.render) uiStates.render(historyContainer, { state: 'unauthorized', message: 'Sign in to view your contest history.' });
            return;
        }

        if (uiStates?.render) uiStates.render(historyContainer, { state: 'loading', message: 'Loading history...' });
        try {
            const response = await competitionsService.listHistory({ page: 1, limit: 20 });
            state.items = Array.isArray(response?.items) ? response.items : [];
            state.pagination = response?.pagination || null;
            renderStats();
            renderHistory();
        } catch (error) {
            const stateInfo = uiStates?.fromError ? uiStates.fromError(error, 'Could not load contest history.') : { state: 'error', message: error?.message || 'Could not load contest history.' };
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                stateInfo.state = 'unauthorized';
                stateInfo.message = 'Your current session is not authorized for Competitions. Please sign in with a competitions account.';
            }
            if (uiStates?.render) uiStates.render(historyContainer, { state: stateInfo.state, message: stateInfo.message });
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

    renderStats();
    void loadHistory();
});
