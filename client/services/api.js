/**
 * Centralized API Service Layer
 *
 * Provides typed service methods for all remote backend endpoints.
 * Uses the existing NibrasShared.apiFetch infrastructure for auth, token refresh, and error handling.
 *
 * Services:
 * - authService: Login, register, get current user (admin service)
 * - communityAuthService: Get current user (community service)
 * - questionService: CRUD for questions (legacy community service)
 * - answerService: CRUD for answers/comments (legacy community service)
 * - voteService: Cast/get votes (legacy community service)
 * - communityVoteService: Cast/get votes for threads/posts (community service)
 * - communityCourseService: Course discovery and enrollment (community service)
 * - threadService: Course discussion thread APIs (community service)
 * - postService: Thread post/reply APIs (community service)
 * - notificationService: User notifications (tracking service)
 * - programService: Student program planning and petitions (tracking service)
 * - competitionsService: Competitions contests/problems/accounts flows (competitions service)
 * - tagService: Get/create/update tags (legacy community service)
 * - chatbotService: AI chat ask/publish (legacy community service)
 *
 * Usage:
 *   const user = await window.NibrasServices.authService.getMe();
 *   const questions = await window.NibrasServices.questionService.list();
 */
(function () {
    'use strict';

    // Keep services available even if shared utilities initialize slightly later.
    const apiFetch = (...args) => {
        const fn = window.NibrasShared?.apiFetch || window.NibrasApi?.request;
        if (typeof fn !== 'function') {
            return Promise.reject(new Error('Nibras API utilities are not available. Ensure react-page-utils.js is loaded.'));
        }
        return fn(...args);
    };

    const toQueryString = (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach((key) => {
            const value = filters[key];
            if (value != null && value !== '') {
                params.append(key, value);
            }
        });
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    const unwrapApiData = (payload) => {
        if (payload == null) return null;
        if (typeof payload !== 'object') return payload;
        if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
        return payload;
    };

    const buildQueryString = (paramsObject = {}) => {
        const params = new URLSearchParams();
        Object.keys(paramsObject).forEach((key) => {
            const value = paramsObject[key];
            if (value == null || value === '') return;
            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    if (entry != null && entry !== '') params.append(key, String(entry));
                });
                return;
            }
            params.append(key, String(value));
        });
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    // ============================================================
    // Auth Service (admin)
    // ============================================================
    const authService = {
        /**
         * Login with email and password
         * @param {string} email
         * @param {string} password
         * @returns {Promise<{token: string, user: object}>}
         */
        async login(email, password) {
            return apiFetch('/auth/login', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: { email, password },
            });
        },

        /**
         * Register a new user
         * @param {object} data - { name, email, password, role? }
         * @returns {Promise<{token: string, user: object}>}
         */
        async register(data) {
            return apiFetch('/auth/register', {
                service: 'admin',
                method: 'POST',
                auth: false,
                retryAuth: false,
                body: data,
            });
        },

        /**
         * Get the currently authenticated user profile
         * @returns {Promise<{user: object}>}
         */
        async getMe() {
            return apiFetch('/auth/me', {
                service: 'admin',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Auth Service (community)
    // ============================================================
    const communityAuthService = {
        /**
         * Get the current community user profile
         * @returns {Promise<{user: object}>}
         */
        async getMe() {
            return apiFetch('/auth/me', {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Question Service (legacy community)
    // ============================================================
    const questionService = {
        /**
         * List all questions (with optional filters)
         * @param {object} filters - { search, title, tag, course }
         * @returns {Promise<Array>}
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key] != null && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });
            const query = params.toString();
            return apiFetch(`/questions${query ? '?' + query : ''}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get a single question by ID with its answers
         * @param {string} id - Question MongoDB ObjectId
         * @returns {Promise<{question: object, answers: Array}>}
         */
        async getById(id) {
            return apiFetch(`/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Create a new question
         * @param {object} data - { title, body, tags?, course? }
         * @returns {Promise<object>}
         */
        async create(data) {
            return apiFetch('/questions', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update a question (owner only)
         * @param {string} id - Question MongoDB ObjectId
         * @param {object} data - Fields to update { title?, body?, tags?, course? }
         * @returns {Promise<object>}
         */
        async update(id, data) {
            return apiFetch(`/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete a question (owner or admin)
         * @param {string} id - Question MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async delete(id) {
            return apiFetch(`/questions/${id}`, {
                service: 'legacyCommunity',
                method: 'DELETE',
                auth: true,
            });
        },
    };

    // ============================================================
    // Answer Service (legacy community)
    // ============================================================
    const answerService = {
        /**
         * Get all answers for a question
         * @param {string} questionId - Question MongoDB ObjectId
         * @returns {Promise<Array>}
         */
        async listByQuestion(questionId) {
            return apiFetch(`/answers/question/${questionId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get an answer by ID
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async getById(questionId, answerId) {
            return apiFetch(`/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Create an answer
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {object} data - { body, isFromAI? }
         * @returns {Promise<object>}
         */
        async create(questionId, data) {
            return apiFetch(`/answers/${questionId}`, {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update an answer (owner only)
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @param {object} data - { body }
         * @returns {Promise<object>}
         */
        async update(questionId, answerId, data) {
            return apiFetch(`/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete an answer (owner or admin)
         * @param {string} questionId - Question MongoDB ObjectId
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async delete(questionId, answerId) {
            return apiFetch(`/answers/${questionId}/${answerId}`, {
                service: 'legacyCommunity',
                method: 'DELETE',
                auth: true,
            });
        },

        /**
         * Accept an answer (question author only)
         * @param {string} answerId - Answer MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async accept(answerId) {
            return apiFetch(`/answers/${answerId}/accept`, {
                service: 'legacyCommunity',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Vote Service (legacy community)
    // ============================================================
    const voteService = {
        /**
         * Cast or toggle a vote
         * @param {object} data - { targetType: 'question'|'answer', targetId: string, value: 1|-1 }
         * @returns {Promise<{message: string, action: string, voteValue: number, votesCount: number}>}
         */
        async cast(data) {
            return apiFetch('/votes', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Get the current user's vote on a target
         * @param {object} params - { targetType: 'question'|'answer', targetId: string }
         * @returns {Promise<{value: number}>} 1, -1, or 0
         */
        async getMyVote(params) {
            return apiFetch(`/votes/${params.targetType}/${params.targetId}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Vote Service (course-thread community)
    // ============================================================
    const communityVoteService = {
        /**
         * Cast or toggle a vote for thread/post targets
         * @param {object} data - { targetType: 'thread'|'post', targetId: string, value: 1|-1 }
         * @returns {Promise<{message: string, action: string, voteValue: number, votesCount: number}>}
         */
        async cast(data) {
            return apiFetch('/votes', {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Get the current user's vote on a thread/post target
         * @param {object} params - { targetType: 'thread'|'post', targetId: string }
         * @returns {Promise<{value: number}>}
         */
        async getMyVote(params) {
            return apiFetch(`/votes/${params.targetType}/${params.targetId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },
    };

    // ============================================================
    // Tag Service (legacy community)
    // ============================================================
    const tagService = {
        /**
         * Get all tags
         * @returns {Promise<Array>}
         */
        async list() {
            return apiFetch('/tags', {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get popular tags
         * @param {number} limit - Max number of tags to return
         * @returns {Promise<Array>}
         */
        async popular(limit = 5) {
            return apiFetch(`/tags/popular?limit=${limit}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get a tag by ID
         * @param {string} id - Tag MongoDB ObjectId
         * @returns {Promise<object>}
         */
        async getById(id) {
            return apiFetch(`/tags/${id}`, {
                service: 'legacyCommunity',
                method: 'GET',
                auth: false,
            });
        },
    };

    // ============================================================
    // Chatbot Service (legacy community)
    // ============================================================
    const chatbotService = {
        /**
         * Ask the AI chatbot a question
         * @param {string} question - The question text (10-500 chars)
         * @returns {Promise<{question: string, hints: Array, tags: Array, finalAnswer: string}>}
         */
        async ask(question) {
            return apiFetch('/api/chatbot/ask', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: { question },
            });
        },

        /**
         * Publish a chatbot answer as a community question
         * @param {object} data - { title, question, finalAnswer, tags? }
         * @returns {Promise<object>}
         */
        async publish(data) {
            return apiFetch('/api/chatbot/publish', {
                service: 'legacyCommunity',
                method: 'POST',
                auth: true,
                body: data,
            });
        },
    };

    // ============================================================
    // Community Courses Service (course-thread backend)
    // ============================================================
    const communityCourseService = {
        /**
         * List community courses
         * @param {object} filters - { search, isActive, instructor }
         * @returns {Promise<{courses: Array}>}
         */
        async list(filters = {}) {
            return apiFetch(`/courses${toQueryString(filters)}`, {
                service: 'community',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Get a community course by ID
         * @param {string} id
         * @returns {Promise<{course: object}>}
         */
        async getById(id) {
            return apiFetch(`/courses/${id}`, {
                service: 'community',
                method: 'GET',
                auth: false,
            });
        },

        /**
         * Enroll current user in a course
         * @param {string} courseId
         * @returns {Promise<{course: object}>}
         */
        async enroll(courseId) {
            return apiFetch(`/courses/${courseId}/enroll`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * Unenroll current user from a course
         * @param {string} courseId
         * @returns {Promise<{course: object}>}
         */
        async unenroll(courseId) {
            return apiFetch(`/courses/${courseId}/enroll`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },
    };

    // ============================================================
    // Thread Service (course-thread backend)
    // ============================================================
    const threadService = {
        /**
         * List threads by course
         * @param {string} courseId
         * @param {object} filters - { search, status, tag }
         * @returns {Promise<{threads: Array}>}
         */
        async listByCourse(courseId, filters = {}) {
            return apiFetch(`/threads/course/${courseId}${toQueryString(filters)}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get thread by ID
         * @param {string} threadId
         * @returns {Promise<{thread: object}>}
         */
        async getById(threadId) {
            return apiFetch(`/threads/${threadId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create thread in a course
         * @param {string} courseId
         * @param {object} data - { title, body, tags? }
         * @returns {Promise<{thread: object}>}
         */
        async create(courseId, data) {
            return apiFetch(`/threads/${courseId}`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update thread
         * @param {string} threadId
         * @param {object} data
         * @returns {Promise<{thread: object}>}
         */
        async update(threadId, data) {
            return apiFetch(`/threads/${threadId}`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete thread
         * @param {string} threadId
         * @returns {Promise<{message: string}>}
         */
        async delete(threadId) {
            return apiFetch(`/threads/${threadId}`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },

        async pin(threadId) {
            return apiFetch(`/threads/${threadId}/pin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async unpin(threadId) {
            return apiFetch(`/threads/${threadId}/unpin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async close(threadId) {
            return apiFetch(`/threads/${threadId}/close`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async open(threadId) {
            return apiFetch(`/threads/${threadId}/open`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Post Service (course-thread backend)
    // ============================================================
    const postService = {
        /**
         * List posts by thread
         * @param {string} threadId
         * @returns {Promise<{posts: Array}>}
         */
        async listByThread(threadId) {
            return apiFetch(`/posts/thread/${threadId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get post by ID
         * @param {string} postId
         * @returns {Promise<{post: object}>}
         */
        async getById(postId) {
            return apiFetch(`/posts/${postId}`, {
                service: 'community',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create a post in a thread
         * @param {string} threadId
         * @param {object} data - { body }
         * @returns {Promise<{post: object}>}
         */
        async create(threadId, data) {
            return apiFetch(`/posts/${threadId}`, {
                service: 'community',
                method: 'POST',
                auth: true,
                body: data,
            });
        },

        /**
         * Update post
         * @param {string} postId
         * @param {object} data
         * @returns {Promise<{post: object}>}
         */
        async update(postId, data) {
            return apiFetch(`/posts/${postId}`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: data,
            });
        },

        /**
         * Delete post
         * @param {string} postId
         * @returns {Promise<{message: string}>}
         */
        async delete(postId) {
            return apiFetch(`/posts/${postId}`, {
                service: 'community',
                method: 'DELETE',
                auth: true,
            });
        },

        async pin(postId) {
            return apiFetch(`/posts/${postId}/pin`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },

        async accept(postId) {
            return apiFetch(`/posts/${postId}/accept`, {
                service: 'community',
                method: 'PATCH',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Notification Service (tracking backend)
    // ============================================================
    const notificationService = {
        /**
         * List current user notifications
         * @returns {Promise<{notifications: Array}>}
         */
        async list() {
            return apiFetch('/v1/notifications', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Get unread notifications count
         * @returns {Promise<{count: number}>}
         */
        async count() {
            return apiFetch('/v1/notifications/count', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Mark all notifications as read
         * @returns {Promise<{ok: boolean}>}
         */
        async markAllRead() {
            return apiFetch('/v1/notifications/read-all', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },
    };

    // ============================================================
    // Program Service (tracking backend)
    // ============================================================
    const programService = {
        /**
         * List all available programs
         * @returns {Promise<Array>}
         */
        async listPrograms() {
            return apiFetch('/v1/programs', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Enroll current student in a program
         * @param {string} programId
         * @returns {Promise<object>}
         */
        async enroll(programId) {
            return apiFetch(`/v1/programs/${encodeURIComponent(String(programId || ''))}/enroll`, {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * Get current student's program plan
         * @returns {Promise<object>}
         */
        async getMyPlan() {
            return apiFetch('/v1/programs/student/me', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Select specialization track
         * @param {string} trackId
         * @returns {Promise<object>}
         */
        async selectTrack(trackId) {
            return apiFetch('/v1/programs/student/me/select-track', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: { trackId: String(trackId || '') },
            });
        },

        /**
         * Update student planned courses
         * @param {Array} plannedCourses
         * @returns {Promise<object>}
         */
        async updatePlan(plannedCourses) {
            return apiFetch('/v1/programs/student/me/plan', {
                service: 'tracking',
                method: 'PATCH',
                auth: true,
                body: { plannedCourses: Array.isArray(plannedCourses) ? plannedCourses : [] },
            });
        },

        /**
         * Get student sheet view
         * @returns {Promise<object>}
         */
        async getSheet() {
            return apiFetch('/v1/programs/student/me/sheet', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Generate and snapshot sheet
         * @returns {Promise<object>}
         */
        async generateSheet() {
            return apiFetch('/v1/programs/student/me/generate-sheet', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: {},
            });
        },

        /**
         * List student petitions
         * @returns {Promise<Array>}
         */
        async listPetitions() {
            return apiFetch('/v1/programs/student/me/petitions', {
                service: 'tracking',
                method: 'GET',
                auth: true,
            });
        },

        /**
         * Create a new student petition
         * @param {object} payload
         * @returns {Promise<object>}
         */
        async createPetition(payload) {
            return apiFetch('/v1/programs/student/me/petitions', {
                service: 'tracking',
                method: 'POST',
                auth: true,
                body: payload || {},
            });
        },
    };

    // ============================================================
    // Competitions Service (competitions backend)
    // ============================================================
    const competitionsService = {
        async getMe() {
            const payload = await apiFetch('/auth/me', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return payload?.user || unwrapApiData(payload);
        },

        async listContests(filters = {}) {
            const query = buildQueryString({
                platform: filters.platform,
                status: filters.status,
                bookmarked: filters.bookmarked,
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                order: filters.order,
            });
            const payload = await apiFetch(`/contests${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: false,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async getContestById(id) {
            const payload = await apiFetch(`/contests/${encodeURIComponent(String(id || ''))}`, {
                service: 'competitions',
                method: 'GET',
                auth: false,
            });
            return unwrapApiData(payload);
        },

        async bookmarkContest(id) {
            const payload = await apiFetch(`/user/contests/${encodeURIComponent(String(id || ''))}/bookmark`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Contest bookmarked successfully',
                data: unwrapApiData(payload),
            };
        },

        async removeBookmark(id) {
            const payload = await apiFetch(`/user/contests/${encodeURIComponent(String(id || ''))}/bookmark`, {
                service: 'competitions',
                method: 'DELETE',
                auth: true,
            });
            return {
                message: payload?.message || 'Bookmark removed successfully',
                data: unwrapApiData(payload),
            };
        },

        async listBookmarks(filters = {}) {
            const query = buildQueryString({ page: filters.page, limit: filters.limit });
            const payload = await apiFetch(`/user/contests/bookmarks${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async setReminder(id) {
            const payload = await apiFetch(`/user/contests/${encodeURIComponent(String(id || ''))}/reminder`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Reminder set successfully',
                data: unwrapApiData(payload),
            };
        },

        async removeReminder(id) {
            const payload = await apiFetch(`/user/contests/${encodeURIComponent(String(id || ''))}/reminder`, {
                service: 'competitions',
                method: 'DELETE',
                auth: true,
            });
            return {
                message: payload?.message || 'Reminder removed successfully',
                data: unwrapApiData(payload),
            };
        },

        async listReminders(filters = {}) {
            const query = buildQueryString({ page: filters.page, limit: filters.limit });
            const payload = await apiFetch(`/user/contests/reminders${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload) || {};
            return {
                contests: Array.isArray(data.contests) ? data.contests : [],
                pagination: data.pagination || payload?.pagination || null,
            };
        },

        async joinContest(id) {
            const payload = await apiFetch(`/user/contests/${encodeURIComponent(String(id || ''))}/join`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return {
                message: payload?.message || 'Contest joined successfully',
                data: unwrapApiData(payload),
            };
        },

        async listHistory(filters = {}) {
            const query = buildQueryString({
                platform: filters.platform,
                from: filters.from,
                to: filters.to,
                page: filters.page,
                limit: filters.limit,
            });
            const payload = await apiFetch(`/user/contests/history${query}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return {
                items: Array.isArray(payload?.data) ? payload.data : Array.isArray(unwrapApiData(payload)) ? unwrapApiData(payload) : [],
                pagination: payload?.pagination || unwrapApiData(payload)?.pagination || null,
            };
        },

        async linkAccounts(accounts) {
            const payload = await apiFetch('/accounts/link', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: accounts || {},
            });
            return {
                message: payload?.message || 'Accounts linked successfully',
                data: unwrapApiData(payload),
            };
        },

        async startVerification(platform) {
            const payload = await apiFetch('/accounts/verify/start', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: { platform },
            });
            return {
                message: payload?.message || 'Verification started',
                data: unwrapApiData(payload),
            };
        },

        async checkVerification(platform) {
            const payload = await apiFetch('/accounts/verify/check', {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: { platform },
            });
            return {
                message: payload?.message || '',
                data: unwrapApiData(payload),
            };
        },

        async getAggregatedProfile(userId) {
            const payload = await apiFetch(`/accounts/profile/${encodeURIComponent(String(userId || ''))}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload);
        },

        async syncProfile(options = {}) {
            const force = options.force === true;
            const payload = await apiFetch(`/accounts/profile/sync${force ? '?force=true' : ''}`, {
                service: 'competitions',
                method: 'POST',
                auth: true,
                body: {},
            });
            return unwrapApiData(payload);
        },

        async listProblems(filters = {}) {
            const queryFilters = {};
            if (filters.difficulty) queryFilters.difficulty = filters.difficulty;
            if (Array.isArray(filters.tags)) queryFilters.tags = filters.tags.join(',');
            else if (filters.tags) queryFilters.tags = filters.tags;
            const payload = await apiFetch(`/problems${buildQueryString(queryFilters)}`, {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            const data = unwrapApiData(payload);
            return Array.isArray(data) ? data : [];
        },

        async getRoadmap() {
            const payload = await apiFetch('/problems/roadmap', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload) || {};
        },

        async getProgress() {
            const payload = await apiFetch('/problems/progress', {
                service: 'competitions',
                method: 'GET',
                auth: true,
            });
            return unwrapApiData(payload) || {};
        },
    };

    // ============================================================
    // Expose on window
    // ============================================================
    window.NibrasServices = Object.freeze({
        authService,
        communityAuthService,
        questionService,
        answerService,
        voteService,
        communityVoteService,
        communityCourseService,
        threadService,
        postService,
        notificationService,
        programService,
        competitionsService,
        tagService,
        chatbotService,
    });

    console.log('[NibrasServices] Initialized. Available as window.NibrasServices');
})();
