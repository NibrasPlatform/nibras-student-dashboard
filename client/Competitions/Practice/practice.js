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
    const listContainer = document.getElementById('problem-list-container');
    const searchInput = document.getElementById('problem-search');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let allProblems = [];
    let selectedFilter = 'All';
    let searchTerm = '';
    let currentProgress = {};
    let historyTotal = 0;

    const normalizeDifficulty = (rawDifficulty) => {
        const value = String(rawDifficulty || '').toLowerCase();
        if (value === 'beginner' || value === 'newbie' || value === 'easy') return 'Easy';
        if (value === 'intermediate' || value === 'medium') return 'Medium';
        return 'Hard';
    };

    const normalizeProblem = (problem) => {
        const tags = Array.isArray(problem?.tags) ? problem.tags : [];
        const mappedDifficulty = normalizeDifficulty(problem?.difficulty);
        return {
            id: problem?._id || problem?.id || '',
            title: problem?.title || 'Untitled Problem',
            difficulty: mappedDifficulty,
            tags,
            rating: problem?.rating || null,
            status: problem?.isSolved ? 'solved' : 'unsolved',
            action: problem?.isSolved ? 'Review' : 'Solve',
            url: problem?.url || '',
            platform: problem?.platform || '',
        };
    };

    const getOverallStats = () => {
        const buckets = ['beginner', 'newbie', 'intermediate', 'advanced'];
        let total = 0;
        let solved = 0;
        buckets.forEach((key) => {
            const chunk = currentProgress?.[key];
            total += Number(chunk?.total || 0);
            solved += Number(chunk?.solved || 0);
        });
        return { total, solved };
    };

    const renderStats = () => {
        if (!statsContainer) return;
        const overall = getOverallStats();
        const percentage = overall.total ? Math.round((overall.solved / overall.total) * 100) : 0;
        const stats = [
            { label: 'Solved Problems', value: String(overall.solved), icon: 'fa-solid fa-bullseye', color: 'green' },
            { label: 'Available Problems', value: String(overall.total), icon: 'fa-solid fa-file-code', color: 'blue' },
            { label: 'Completion', value: `${percentage}%`, icon: 'fa-solid fa-chart-simple', color: 'yellow' },
            { label: 'Contests Joined', value: String(historyTotal), icon: 'fa-solid fa-users', color: 'purple' },
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

    const filteredProblems = () => allProblems.filter((problem) => {
        const matchesFilter = selectedFilter === 'All' || problem.difficulty === selectedFilter;
        const matchesSearch = !searchTerm || problem.title.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const renderProblems = () => {
        if (!listContainer) return;
        const rows = filteredProblems();
        if (!rows.length) {
            if (uiStates?.render) {
                uiStates.render(listContainer, { state: 'empty', message: 'No problems match this filter.' });
            } else {
                listContainer.innerHTML = '<p>No problems match this filter.</p>';
            }
            return;
        }

        listContainer.innerHTML = '';
        rows.forEach((problem) => {
            const statusIconClass = problem.status === 'solved' ? 'fa-circle-check status-solved' : 'fa-circle-xmark status-unsolved';
            let diffClass = '';
            if (problem.difficulty === 'Easy') diffClass = 'tag-easy';
            if (problem.difficulty === 'Medium') diffClass = 'tag-medium';
            if (problem.difficulty === 'Hard') diffClass = 'tag-hard';
            const tagsHtml = [
                `<span class="prob-tag ${diffClass}">${problem.difficulty}</span>`,
                ...problem.tags.map((tag) => `<span class="prob-tag">${tag}</span>`),
            ].join('');
            const actionClass = problem.action === 'Review' ? 'btn-review' : 'btn-solve';
            listContainer.innerHTML += `
                <div class="problem-card">
                    <div class="prob-left">
                        <div class="status-icon"><i class="fa-regular ${statusIconClass}"></i></div>
                        <div class="prob-content">
                            <h4>${problem.title}</h4>
                            <div class="prob-tags">${tagsHtml}</div>
                            <div class="prob-meta">
                                Platform: ${problem.platform || 'N/A'} ${problem.rating ? `&nbsp; Rating: ${problem.rating}` : ''}
                            </div>
                        </div>
                    </div>
                    <button class="action-btn ${actionClass}" data-url="${problem.url}">${problem.action}</button>
                </div>
            `;
        });
    };

    const loadPracticeData = async () => {
        if (!competitionsService) {
            if (uiStates?.render) uiStates.render(listContainer, { state: 'error', message: 'Competitions service is unavailable.' });
            return;
        }
        if (!token) {
            if (uiStates?.render) uiStates.render(listContainer, { state: 'unauthorized', message: 'Sign in to view your practice problems.' });
            return;
        }

        if (uiStates?.render) uiStates.render(listContainer, { state: 'loading', message: 'Loading practice problems...' });

        try {
            const [problems, progress, history] = await Promise.all([
                competitionsService.listProblems({}),
                competitionsService.getProgress(),
                competitionsService.listHistory({ page: 1, limit: 1 }),
            ]);
            allProblems = (Array.isArray(problems) ? problems : []).map(normalizeProblem);
            currentProgress = progress || {};
            historyTotal = Number(history?.pagination?.total || 0);
            renderStats();
            renderProblems();
        } catch (error) {
            const stateInfo = uiStates?.fromError ? uiStates.fromError(error, 'Could not load practice data.') : { state: 'error', message: error?.message || 'Could not load practice data.' };
            if (Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403) {
                stateInfo.state = 'unauthorized';
                stateInfo.message = 'Your current session is not authorized for Competitions. Please sign in with a competitions account.';
            }
            if (uiStates?.render) uiStates.render(listContainer, { state: stateInfo.state, message: stateInfo.message });
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

    filterBtns.forEach((button) => {
        button.addEventListener('click', () => {
            filterBtns.forEach((entry) => entry.classList.remove('active'));
            button.classList.add('active');
            selectedFilter = button.dataset.filter || 'All';
            renderProblems();
        });
    });

    searchInput?.addEventListener('input', (event) => {
        searchTerm = String(event.target?.value || '').trim().toLowerCase();
        renderProblems();
    });

    listContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-url]');
        if (!button) return;
        const url = button.dataset.url;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    });

    const mainTabs = document.querySelectorAll('.tab-btn');
    mainTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            mainTabs.forEach((entry) => entry.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    renderStats();
    void loadPracticeData();
});
