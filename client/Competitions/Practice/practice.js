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

    const tbody = document.getElementById('practice-tbody');
    const titleEl = document.getElementById('practice-title');
    const statsLine = document.getElementById('stats-line');
    const pagination = document.getElementById('pagination');

    let allProblems = [];
    let selectedPlatform = 'all';
    let solvedFilter = 'all';
    let searchTerm = '';
    let tagsFilter = '';
    let minRating = '';
    let maxRating = '';
    let currentPage = 1;
    let pageSize = 50;

    const normalizeProblem = (problem) => {
        const tags = Array.isArray(problem?.tags) ? problem.tags : [];
        return {
            id: problem?._id || problem?.id || '',
            title: problem?.title || 'Untitled Problem',
            tags,
            rating: problem?.rating != null ? Number(problem.rating) : null,
            status: problem?.isSolved ? 'solved' : 'unsolved',
            url: problem?.url || '',
            platform: (problem?.platform || '').toLowerCase(),
        };
    };

    const getStatusIcon = (status) => {
        if (status === 'solved') return '<span class="status-cell status-solved"><i class="fa-regular fa-circle-check"></i> Solved</span>';
        if (status === 'unsolved') return '<span class="status-cell status-unsolved"><i class="fa-regular fa-circle"></i> Unsolved</span>';
        return '<span class="status-cell status-na">—</span>';
    };

    const getProblemIdFromUrl = (url) => {
        if (!url) return '';
        const m = url.match(/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);
        if (m) return `${m[1]}${m[2]}`;
        return '';
    };

    const filterProblems = () => {
        let list = allProblems;

        if (selectedPlatform !== 'all') {
            list = list.filter((p) => p.platform === selectedPlatform);
        }

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter((p) => p.title.toLowerCase().includes(q));
        }

        if (tagsFilter) {
            const required = tagsFilter.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);
            if (required.length) {
                list = list.filter((p) =>
                    required.every((tag) => p.tags.some((t) => t.toLowerCase().includes(tag)))
                );
            }
        }

        if (minRating !== '') {
            const mr = Number(minRating);
            if (!Number.isNaN(mr)) list = list.filter((p) => p.rating != null && p.rating >= mr);
        }
        if (maxRating !== '') {
            const mr = Number(maxRating);
            if (!Number.isNaN(mr)) list = list.filter((p) => p.rating != null && p.rating <= mr);
        }

        if (solvedFilter === 'solved') list = list.filter((p) => p.status === 'solved');
        else if (solvedFilter === 'unsolved') list = list.filter((p) => p.status === 'unsolved');

        return list;
    };

    const renderTable = () => {
        if (!tbody) return;
        const filtered = filterProblems();
        const totalSolved = allProblems.filter((p) => p.status === 'solved').length;

        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const page = filtered.slice(start, start + pageSize);

        if (!page.length) {
            const msg = allProblems.length === 0
                ? 'Sign in to view practice problems.'
                : 'No problems match your filters.';
            tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);font-size:0.9rem;">${msg}</td></tr>`;
        } else {
            tbody.innerHTML = page.map((p) => {
                const pid = getProblemIdFromUrl(p.url) || p.id;
                const tagHtml = p.tags.length
                    ? `<div class="tag-list">${p.tags.map((t) => `<span class="tag-chip">${t}</span>`).join('')}</div>`
                    : '<span style="color:var(--text-tertiary);font-size:0.75rem;">—</span>';
                return `<tr>
                    <td><div><a href="${p.url || '#'}" target="_blank" rel="noopener noreferrer" class="problem-link">${p.title}</a></div></td>
                    <td><span class="problem-rating">${p.rating != null ? p.rating : '—'}</span></td>
                    <td>${tagHtml}</td>
                    <td>${getStatusIcon(p.status)}</td>
                </tr>`;
            }).join('');
        }

        if (statsLine) {
            statsLine.textContent = `${filtered.length} matching · ${totalSolved} solved overall`;
        }
    };

    const renderPagination = () => {
        if (!pagination) return;
        const filtered = filterProblems();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        pagination.innerHTML = `
            <button class="pagination-btn" id="prev-page" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
            <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
            <button class="pagination-btn" id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
        `;
        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; refreshView(); }
        });
        document.getElementById('next-page')?.addEventListener('click', () => {
            const total = Math.ceil(filterProblems().length / pageSize);
            if (currentPage < total) { currentPage++; refreshView(); }
        });
    };

    const refreshView = () => {
        renderTable();
        renderPagination();
    };

    const updateTitle = () => {
        if (!titleEl) return;
        const names = { all: 'Practice', codeforces: 'Codeforces Practice', leetcode: 'LeetCode Practice', atcoder: 'AtCoder Practice' };
        titleEl.textContent = names[selectedPlatform] || 'Practice';
    };

    const setPlatform = (platform) => {
        selectedPlatform = platform;
        currentPage = 1;
        document.querySelectorAll('.filter-chip').forEach((chip) => {
            chip.classList.toggle('active', chip.dataset.platform === platform);
        });
        updateTitle();
        refreshView();
    };

    const setSolvedFilter = (filter) => {
        solvedFilter = filter;
        currentPage = 1;
        document.querySelectorAll('.solve-chip').forEach((chip) => {
            chip.classList.toggle('active', chip.dataset.solved === filter);
        });
        refreshView();
    };

    const loadPracticeData = async () => {
        if (!competitionsService) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);">Competitions service is unavailable.</td></tr>`;
            return;
        }

        if (!token) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);">Sign in to view practice problems.</td></tr>`;
            return;
        }

        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);">Loading problems...</td></tr>`;

        try {
            const [problems] = await Promise.all([
                competitionsService.listProblems({}),
            ]);
            allProblems = (Array.isArray(problems) ? problems : []).map(normalizeProblem);
            refreshView();
        } catch (error) {
            const msg = error?.message || 'Could not load practice data.';
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);">${msg}</td></tr>`;
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
        if (appLogo) appLogo.src = isDark ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
    };
    applyThemeAssets();
    themeBtn?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (_) {}
        applyThemeAssets();
    });

    const mainTabs = document.querySelectorAll('.tab-btn');
    mainTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            mainTabs.forEach((entry) => entry.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    document.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => setPlatform(chip.dataset.platform));
    });

    document.querySelectorAll('.solve-chip').forEach((chip) => {
        chip.addEventListener('click', () => setSolvedFilter(chip.dataset.solved));
    });

    document.getElementById('filter-search')?.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1;
        refreshView();
    });

    document.getElementById('filter-tags')?.addEventListener('input', (e) => {
        tagsFilter = e.target.value;
        currentPage = 1;
        refreshView();
    });

    document.getElementById('filter-min-rating')?.addEventListener('input', (e) => {
        minRating = e.target.value;
        currentPage = 1;
        refreshView();
    });

    document.getElementById('filter-max-rating')?.addEventListener('input', (e) => {
        maxRating = e.target.value;
        currentPage = 1;
        refreshView();
    });

    updateTitle();
    void loadPracticeData();
});