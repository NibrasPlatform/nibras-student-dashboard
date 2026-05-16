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
    let authEnabled = Boolean(token);

    const statsContainer = document.getElementById('stats-container');
    const liveContainer = document.getElementById('live-container');
    const upcomingContainer = document.getElementById('upcoming-container');
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const remindersContainer = document.getElementById('reminders-container');
    const contentWrapper = document.querySelector('.content-wrapper');
    const feedbackNotice = document.createElement('div');
    feedbackNotice.hidden = true;
    feedbackNotice.style.marginBottom = '14px';
    if (contentWrapper) contentWrapper.insertBefore(feedbackNotice, contentWrapper.children[2] || null);

    let runningContests = [];
    let upcomingContests = [];
    let bookmarkedContestIds = new Set();
    let reminderContestIds = new Set();
    let bookmarkedContests = [];
    let reminderContests = [];
    const isAuthError = (error) => Number(error?.status || 0) === 401 || Number(error?.status || 0) === 403;

    const showFeedback = (message, tone = 'info') => {
        if (!message) {
            feedbackNotice.hidden = true;
            feedbackNotice.textContent = '';
            return;
        }
        feedbackNotice.hidden = false;
        if (uiStates?.render) {
            uiStates.render(feedbackNotice, { mode: 'notice', state: tone, message });
            return;
        }
        feedbackNotice.textContent = message;
    };

    const formatDateTime = (isoValue) => {
        if (!isoValue) return 'TBD';
        const date = new Date(isoValue);
        if (Number.isNaN(date.getTime())) return 'TBD';
        return date.toLocaleString();
    };

    const formatDuration = (minutes) => {
        const value = Number(minutes || 0);
        if (!value) return 'N/A';
        if (value < 60) return `${value} min`;
        const hours = Math.floor(value / 60);
        const rem = value % 60;
        return rem ? `${hours}h ${rem}m` : `${hours}h`;
    };

    const timeLeftText = (startTime) => {
        const date = new Date(startTime);
        if (Number.isNaN(date.getTime())) return 'Live now';
        const ms = date.getTime() - Date.now();
        if (ms <= 0) return 'Started';
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m left`;
    };

    const contestIdFromEntry = (entry) => {
        if (!entry || typeof entry !== 'object') return null;
        if (entry.contestId && typeof entry.contestId === 'string') return entry.contestId;
        if (entry.contestId && typeof entry.contestId === 'object') {
            return entry.contestId._id || entry.contestId.id || null;
        }
        return entry._id || entry.id || null;
    };

    const refreshStats = () => {
        if (!statsContainer) return;
        const stats = [
            { label: 'Running Contests', value: String(runningContests.length), icon: 'fa-solid fa-bolt', color: 'yellow', action: null },
            { label: 'Upcoming Contests', value: String(upcomingContests.length), icon: 'fa-solid fa-calendar-days', color: 'green', action: null },
            { label: 'Bookmarked', value: String(bookmarkedContestIds.size), icon: 'fa-regular fa-bookmark', color: 'blue', action: null },
            { label: 'Reminders', value: String(reminderContestIds.size), icon: 'fa-regular fa-bell', color: 'purple', action: null },
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
                <div class="stat-card" ${stat.action ? `style="cursor:pointer" data-action="${stat.action}"` : ''}>
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

    const showBookmarksModal = async () => {
        if (!competitionsService) return;
        if (!authEnabled) {
            showFeedback('Sign in to view bookmarked contests.', 'unauthorized');
            return;
        }
        try {
            const result = await competitionsService.listBookmarks({ page: 1, limit: 100 });
            const bookmarkedContests = result?.contests || [];
            if (bookmarkedContests.length === 0) {
                showFeedback('No bookmarked contests yet.', 'info');
                return;
            }
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:500px;max-height:80vh;overflow-y:auto;background:var(--bg-card);padding:20px;border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <h3 style="margin:0;">Bookmarked Contests</h3>
                        <button class="modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
                    </div>
                    <div class="bookmarks-list">
                        ${bookmarkedContests.map(c => `
                            <div style="padding:12px;border-bottom:1px solid var(--border-color);">
                                <h4 style="margin:0 0 8px 0;">${c.title || 'Untitled Contest'}</h4>
                                <div style="font-size:12px;color:var(--text-secondary);">
                                    <span>${c.platform || ''}</span> | 
                                    <span>${formatDateTime(c.startTime)}</span> | 
                                    <span>${formatDuration(c.duration)}</span>
                                </div>
                                <button class="btn-register-full" data-action="unbookmark" data-id="${c._id || c.id}" style="margin-top:8px;">
                                    <i class="fa-solid fa-bookmark"></i> Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            modal.querySelectorAll('[data-action="unbookmark"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('[data-id]').dataset.id;
                    await handleContestAction('bookmark', id);
                    modal.remove();
                });
            });
        } catch (error) {
            showFeedback('Failed to load bookmarks.', 'error');
        }
    };

    const renderRunning = () => {
        if (!liveContainer) return;
        if (!runningContests.length) {
            if (uiStates?.render) {
                uiStates.render(liveContainer, { state: 'empty', message: 'No running contests right now.' });
            } else {
                liveContainer.innerHTML = '<p>No running contests right now.</p>';
            }
            return;
        }

        liveContainer.innerHTML = '';
        runningContests.forEach((contest) => {
            const contestId = contest._id || contest.id || '';
            const platformBadge = contest.platform ? `<span class="badge bg-blue">${contest.platform}</span>` : '';
            liveContainer.innerHTML += `
                <div class="contest-card">
                    <div class="cc-header">
                        <div>
                            <h4>${contest.title || 'Untitled Contest'}</h4>
                            <p>${contest.contestIdOnPlatform || ''}</p>
                        </div>
                        <div class="cc-badges">
                            <span class="badge bg-green">LIVE</span>
                            ${platformBadge}
                        </div>
                    </div>
                    <div class="cc-meta">
                        <span><i class="fa-regular fa-clock"></i> ${timeLeftText(contest.startTime)}</span>
                        <span><i class="fa-regular fa-file-lines"></i> ${formatDuration(contest.duration)}</span>
                    </div>
                    <button class="btn-continue" data-action="open" data-id="${contestId}">Open Contest</button>
                </div>
            `;
        });
    };

    const renderUpcoming = () => {
        if (!upcomingContainer) return;
        if (!upcomingContests.length) {
            if (uiStates?.render) {
                uiStates.render(upcomingContainer, { state: 'empty', message: 'No upcoming contests available.' });
            } else {
                upcomingContainer.innerHTML = '<p>No upcoming contests available.</p>';
            }
            return;
        }

        upcomingContainer.innerHTML = '';
        upcomingContests.forEach((contest) => {
            const contestId = contest._id || contest.id || '';
            const isBookmarked = bookmarkedContestIds.has(contestId);
            const hasReminder = reminderContestIds.has(contestId);
            const badge = contest.platform
                ? `<span class="badge ${contest.platform === 'leetcode' ? 'bg-blue' : 'bg-green'}">${contest.platform}</span>`
                : '';
            upcomingContainer.innerHTML += `
                <div class="upcoming-card">
                    <div class="uc-top">
                        <div class="uc-info">
                            <h4>${contest.title || 'Untitled Contest'} ${badge}</h4>
                            <p class="uc-desc">${contest.contestIdOnPlatform || ''}</p>
                            <div class="uc-meta-row">
                                <span><i class="fa-regular fa-clock"></i> ${formatDuration(contest.duration)}</span>
                                <span><i class="fa-regular fa-calendar"></i> ${formatDateTime(contest.startTime)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="uc-meta-row" style="margin-top: 10px; gap: 8px;">
                        <button class="btn-register-full" data-action="join" data-id="${contestId}">Join</button>
                        <button class="btn-register-full" data-action="bookmark" data-id="${contestId}">
                            ${isBookmarked ? '<i class="fa-solid fa-bookmark"></i> Bookmarked' : '<i class="fa-regular fa-bookmark"></i> Bookmark'}
                        </button>
                        <button class="btn-register-full" data-action="reminder" data-id="${contestId}">
                            ${hasReminder ? '<i class="fa-solid fa-bell"></i> Remove' : '<i class="fa-regular fa-bell"></i> Set Reminder'}
                        </button>
                        <button class="btn-register-full" data-action="open" data-id="${contestId}" ${contest.status === 'upcoming' ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>Open</button>
                    </div>
                </div>
            `;
        });
    };

    const refreshContestViews = () => {
        refreshStats();
        renderRunning();
        renderUpcoming();
        renderBookmarks();
        renderReminders();
    };

    const renderBookmarks = () => {
        if (!bookmarksContainer) return;
        
        if (!authEnabled) {
            bookmarksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bookmark"></i>
                    <p>Sign in to view your bookmarked contests</p>
                </div>
            `;
            return;
        }

        if (!bookmarkedContests.length) {
            bookmarksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bookmark"></i>
                    <p>No bookmarked contests yet</p>
                </div>
            `;
            return;
        }

        bookmarksContainer.innerHTML = '';
        bookmarkedContests.forEach((contest) => {
            const contestId = contest._id || contest.id || '';
            const hasReminder = reminderContestIds.has(contestId);
            const badge = contest.platform
                ? `<span class="saved-platform">${contest.platform}</span>`
                : '';

            bookmarksContainer.innerHTML += `
                <div class="saved-card">
                    <div class="saved-info">
                        <h4>${contest.title || 'Untitled Contest'} ${badge}</h4>
                        <div class="saved-meta">
                            <span><i class="fa-regular fa-clock"></i> ${formatDuration(contest.duration)}</span>
                            <span><i class="fa-regular fa-calendar"></i> ${formatDateTime(contest.startTime)}</span>
                            ${contest.status ? `<span class="badge ${contest.status === 'running' ? 'bg-green' : 'bg-blue'}">${contest.status}</span>` : ''}
                        </div>
                    </div>
                    <div class="saved-actions">
                        <button class="btn-icon remove" data-action="bookmark" data-id="${contestId}" title="Remove bookmark">
                            <i class="fa-solid fa-bookmark"></i>
                        </button>
                        <button class="btn-icon ${hasReminder ? 'active' : ''}" data-action="reminder" data-id="${contestId}" title="${hasReminder ? 'Remove reminder' : 'Set reminder'}">
                            <i class="fa-${hasReminder ? 'solid' : 'regular'} fa-bell"></i>
                        </button>
                        <button class="btn-icon" data-action="open" data-id="${contestId}" title="Open contest">
                            <i class="fa-solid fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    };

    const renderReminders = () => {
        if (!remindersContainer) return;
        
        if (!authEnabled) {
            remindersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bell"></i>
                    <p>Sign in to view your reminders</p>
                </div>
            `;
            return;
        }

        if (!reminderContests.length) {
            remindersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bell"></i>
                    <p>No reminders set</p>
                </div>
            `;
            return;
        }

        remindersContainer.innerHTML = '';
        reminderContests.forEach((contest) => {
            const contestId = contest._id || contest.id || '';
            const isBookmarked = bookmarkedContestIds.has(contestId);
            const badge = contest.platform
                ? `<span class="saved-platform">${contest.platform}</span>`
                : '';

            remindersContainer.innerHTML += `
                <div class="saved-card">
                    <div class="saved-info">
                        <h4>${contest.title || 'Untitled Contest'} ${badge}</h4>
                        <div class="saved-meta">
                            <span><i class="fa-regular fa-clock"></i> ${formatDuration(contest.duration)}</span>
                            <span><i class="fa-regular fa-calendar"></i> ${formatDateTime(contest.startTime)}</span>
                            ${contest.status ? `<span class="badge ${contest.status === 'running' ? 'bg-green' : 'bg-blue'}">${contest.status}</span>` : ''}
                        </div>
                    </div>
                    <div class="saved-actions">
                        <button class="btn-icon ${isBookmarked ? 'active' : ''}" data-action="bookmark" data-id="${contestId}" title="${isBookmarked ? 'Remove bookmark' : 'Bookmark'}">
                            <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
                        </button>
                        <button class="btn-icon remove" data-action="reminder" data-id="${contestId}" title="Remove reminder">
                            <i class="fa-solid fa-bell"></i>
                        </button>
                        <button class="btn-icon" data-action="open" data-id="${contestId}" title="Open contest">
                            <i class="fa-solid fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    };

    const findContestById = (id) => {
        const all = runningContests.concat(upcomingContests);
        return all.find((entry) => (entry._id || entry.id) === id) || null;
    };

    const ensureAuth = () => {
        if (!authEnabled) {
            showFeedback('Sign in to use bookmarks, reminders, and participation actions.', 'unauthorized');
            return false;
        }
        return true;
    };

    const handleContestAction = async (action, contestId) => {
        if (!contestId || !competitionsService) return;
        const contest = findContestById(contestId);
        if (action === 'open') {
            if (contest?.status === 'upcoming') {
                showFeedback('This contest has not started yet. You can join when it begins.', 'info');
                return;
            }
            if (contest?.url) {
                window.open(contest.url, '_blank', 'noopener,noreferrer');
            } else {
                showFeedback('Contest URL is not available yet.', 'info');
            }
            return;
        }

        if (!ensureAuth()) return;
        try {
            if (action === 'join') {
                const contest = findContestById(contestId);
                console.log('Join contest debug:', JSON.stringify(contest));
                
                let targetUrl = contest?.joinUrl;
                
                // Build platform-specific registration URL if not provided
                if (!targetUrl && contest?.contestIdOnPlatform) {
                    if (contest.platform === 'codeforces') {
                        // Codeforces: use contestIdOnPlatform for registration
                        targetUrl = `https://codeforces.com/contestRegistration/${contest.contestIdOnPlatform}`;
                    } else if (contest.platform === 'leetcode') {
                        targetUrl = `https://leetcode.com/contest/${contest.contestIdOnPlatform}`;
                    } else if (contest.platform === 'atcoder') {
                        targetUrl = `https://atcoder.jp/contests/${contest.contestIdOnPlatform}`;
                    }
                }
                
                console.log('Final targetUrl:', targetUrl);
                if (targetUrl) {
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                } else {
                    await competitionsService.joinContest(contestId);
                    showFeedback('Contest joined successfully.', 'info');
                }
            } else if (action === 'bookmark') {
                if (bookmarkedContestIds.has(contestId)) {
                    await competitionsService.removeBookmark(contestId);
                    bookmarkedContestIds.delete(contestId);
                    bookmarkedContests = bookmarkedContests.filter((c) => (c._id || c.id) !== contestId);
                    showFeedback('Bookmark removed.', 'info');
                } else {
                    await competitionsService.bookmarkContest(contestId);
                    bookmarkedContestIds.add(contestId);
                    const contest = findContestById(contestId);
                    if (contest && !bookmarkedContests.some((c) => (c._id || c.id) === contestId)) {
                        bookmarkedContests.push(contest);
                    } else if (!contest) {
                        const result = await competitionsService.listBookmarks({ page: 1, limit: 100 });
                        bookmarkedContests = (result?.contests || []).map((entry) => {
                            if (entry.contestId && typeof entry.contestId === 'object') return entry.contestId;
                            return entry;
                        }).filter(Boolean);
                    }
                    showFeedback('Contest bookmarked.', 'info');
                }
            } else if (action === 'reminder') {
                if (reminderContestIds.has(contestId)) {
                    await competitionsService.removeReminder(contestId);
                    reminderContestIds.delete(contestId);
                    reminderContests = reminderContests.filter((c) => (c._id || c.id) !== contestId);
                    showFeedback('Reminder removed.', 'info');
                } else {
                    await competitionsService.setReminder(contestId);
                    reminderContestIds.add(contestId);
                    const contest = findContestById(contestId);
                    if (contest && !reminderContests.some((c) => (c._id || c.id) === contestId)) {
                        reminderContests.push(contest);
                    } else if (!contest) {
                        const result = await competitionsService.listReminders({ page: 1, limit: 100 });
                        reminderContests = (result?.contests || []).map((entry) => {
                            if (entry.contestId && typeof entry.contestId === 'object') return entry.contestId;
                            return entry;
                        }).filter(Boolean);
                    }
                    showFeedback('Reminder set.', 'info');
                }
            }
            refreshContestViews();
        } catch (error) {
            if (isAuthError(error)) {
                authEnabled = false;
                showFeedback('Your current session is not authorized for competitions actions. Public contests are still available.', 'unauthorized');
                refreshContestViews();
                return;
            }
            const stateInfo = uiStates?.fromError ? uiStates.fromError(error, 'Action failed.') : { state: 'error', message: error?.message || 'Action failed.' };
            showFeedback(stateInfo.message, stateInfo.state);
        }
    };

    const loadContestData = async () => {
        if (!competitionsService) {
            showFeedback('Competitions service is unavailable on this page.', 'error');
            return;
        }

        if (uiStates?.render) {
            uiStates.render(liveContainer, { state: 'loading', message: 'Loading running contests...' });
            uiStates.render(upcomingContainer, { state: 'loading', message: 'Loading upcoming contests...' });
        }

        try {
            const [runningResult, upcomingResult] = await Promise.all([
                competitionsService.listContests({ status: 'running', limit: 20, page: 1, sortBy: 'startTime', order: 'asc' }),
                competitionsService.listContests({ status: 'upcoming', limit: 20, page: 1, sortBy: 'startTime', order: 'asc' }),
            ]);

            runningContests = Array.isArray(runningResult?.contests) ? runningResult.contests : [];
            upcomingContests = Array.isArray(upcomingResult?.contests) ? upcomingResult.contests : [];

            bookmarkedContestIds = new Set();
            reminderContestIds = new Set();
            bookmarkedContests = [];
            reminderContests = [];
            if (authEnabled) {
                const [bookmarkResult, reminderResult] = await Promise.allSettled([
                    competitionsService.listBookmarks({ page: 1, limit: 100 }),
                    competitionsService.listReminders({ page: 1, limit: 100 }),
                ]);
                if (bookmarkResult.status === 'fulfilled') {
                    const bookmarkContests = bookmarkResult.value?.contests || [];
                    bookmarkedContests = bookmarkContests.map((entry) => {
                        if (entry.contestId && typeof entry.contestId === 'object') {
                            return entry.contestId;
                        }
                        return entry;
                    }).filter(Boolean);
                    bookmarkedContestIds = new Set(bookmarkContests.map(contestIdFromEntry).filter(Boolean));
                } else if (isAuthError(bookmarkResult.reason)) {
                    authEnabled = false;
                }
                if (reminderResult.status === 'fulfilled') {
                    const reminderContestList = reminderResult.value?.contests || [];
                    reminderContests = reminderContestList.map((entry) => {
                        if (entry.contestId && typeof entry.contestId === 'object') {
                            return entry.contestId;
                        }
                        return entry;
                    }).filter(Boolean);
                    reminderContestIds = new Set(reminderContestList.map(contestIdFromEntry).filter(Boolean));
                } else if (isAuthError(reminderResult.reason)) {
                    authEnabled = false;
                }
            }
            showFeedback('');
            if (!authEnabled) {
                showFeedback('Public contests loaded. Competitions account authorization is required for bookmarks/reminders.', 'unauthorized');
            }
            refreshContestViews();
        } catch (error) {
            const stateInfo = uiStates?.fromError ? uiStates.fromError(error, 'Could not load contests right now.') : { state: 'error', message: error?.message || 'Could not load contests.' };
            showFeedback(stateInfo.message, stateInfo.state);
            if (uiStates?.render) {
                uiStates.render(liveContainer, { state: stateInfo.state, message: stateInfo.message });
                uiStates.render(upcomingContainer, { state: stateInfo.state, message: stateInfo.message });
            }
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

    liveContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;
        handleContestAction(button.dataset.action, button.dataset.id);
    });

    upcomingContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;
        handleContestAction(button.dataset.action, button.dataset.id);
    });

    bookmarksContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;
        handleContestAction(button.dataset.action, button.dataset.id);
    });

    remindersContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;
        handleContestAction(button.dataset.action, button.dataset.id);
    });

    statsContainer?.addEventListener('click', (event) => {
        const statCard = event.target.closest('.stat-card');
        if (!statCard) return;
        const action = statCard.dataset.action;
        if (action === 'view-bookmarks') {
            showBookmarksModal();
        }
    });

    refreshStats();
    void loadContestData();
});
