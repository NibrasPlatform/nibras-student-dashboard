(function () {
    'use strict';

    var S = window.NibrasServices;
    var courseId = null;
    var courseData = null;
    var projects = [];
    var submissions = [];

    function getInitials(name) {
        if (!name) return 'U';
        return name.split(/\s+/).filter(Boolean).map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; }
    }

    function getRoleLabel(role) {
        if (!role) return 'Instructor';
        if (typeof role === 'object') return role.name || 'Instructor';
        if (typeof role === 'string') return role.charAt(0).toUpperCase() + role.slice(1);
        return 'Instructor';
    }

    function updateUserUI(user) {
        var initials = getInitials(user.name);
        var name = user.name || 'Instructor';
        var role = getRoleLabel(user.role);
        var sidebarAvatar = document.querySelector('.sidebar .avatar-circle');
        var sidebarName = document.querySelector('.sidebar .user-info h4');
        var sidebarRole = document.querySelector('.sidebar .user-info span');
        if (sidebarAvatar) sidebarAvatar.textContent = initials;
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarRole) sidebarRole.textContent = role;
        var headerAvatars = document.querySelectorAll('.header-actions .avatar-circle');
        if (headerAvatars.length) {
            headerAvatars[headerAvatars.length - 1].textContent = initials;
        }
    }

    function formatTimeAgo(dateStr) {
        if (!dateStr) return '';
        try {
            var diff = Date.now() - new Date(dateStr).getTime();
            var minutes = Math.floor(diff / 60000);
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return minutes + ' min ago';
            var hours = Math.floor(minutes / 60);
            if (hours < 24) return hours + 'h ago';
            var days = Math.floor(hours / 24);
            return days + 'd ago';
        } catch (_) { return dateStr; }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (_) { return dateStr; }
    }

    function getStatusClass(status) {
        var s = (status || '').toLowerCase();
        if (s === 'published' || s === 'approved' || s === 'active') return 'status-published';
        if (s === 'draft') return 'status-draft';
        if (s === 'archived') return 'status-archived';
        if (s === 'pending') return 'status-pending';
        if (s === 'needs_changes') return 'status-needs-changes';
        return 'status-draft';
    }

    function getCourseId() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('courseId');
        if (id) {
            localStorage.setItem('selectedCourseId', id);
            return id;
        }
        return localStorage.getItem('selectedCourseId');
    }

    async function loadData() {
        courseId = getCourseId();
        if (!courseId) {
            document.getElementById('detail-course-title').textContent = 'No course selected';
            document.getElementById('crumb-course-name').textContent = 'No course';
            document.getElementById('project-list').innerHTML = '<div class="detail-empty"><i class="fa-solid fa-circle-exclamation"></i><p>No course selected. Go back to Courses.</p></div>';
            document.getElementById('review-list').innerHTML = '';
            return;
        }

        try {
            courseData = await S.backendCoursesService.getById(courseId);
            var data = courseData && (courseData.data || courseData);
            if (data) {
                var title = data.title || data.name || 'Course';
                var code = data.courseCode || data.code || '';
                document.getElementById('detail-course-title').textContent = title;
                document.getElementById('crumb-course-name').textContent = title;
                document.getElementById('detail-course-meta').textContent = code ? code + ' — ' + (data.level || '') : 'Loading...';
            }
        } catch (_) {
            document.getElementById('detail-course-title').textContent = 'Course';
            document.getElementById('crumb-course-name').textContent = 'Course';
        }

        await Promise.all([loadProjects(), loadSubmissions()]);
        updateStats();
    }

    async function loadProjects() {
        var listEl = document.getElementById('project-list');
        try {
            var resp = await S.backendCoursesService.getAssignments(courseId);
            var raw = resp && (resp.data || resp);
            projects = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.items) ? raw.items : []);
            renderProjects();
        } catch (err) {
            listEl.innerHTML = '<div class="detail-empty"><i class="fa-solid fa-diagram-project"></i><p>Could not load projects. ' + (err.message || '') + '</p></div>';
        }
    }

    async function loadSubmissions() {
        var listEl = document.getElementById('review-list');
        try {
            var resp = await S.instructorDashboardService.getRecentSubmissions({ courseId: courseId, limit: 20 });
            var raw = resp && (resp.data || resp);
            submissions = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.items) ? raw.items : []);
        } catch (_) {
            submissions = [];
        }
        renderReviewQueue();
        renderSubmissionsTable();
    }

    function renderProjects() {
        var listEl = document.getElementById('project-list');
        var countEl = document.getElementById('project-count');

        if (!projects.length) {
            listEl.innerHTML = '<div class="detail-empty"><i class="fa-solid fa-diagram-project"></i><p>No projects yet. Create your first project!</p></div>';
            if (countEl) countEl.textContent = '0 total';
            return;
        }

        if (countEl) countEl.textContent = projects.length + ' total';

        listEl.innerHTML = projects.map(function (p) {
            var pid = p._id || p.id || '';
            var ptitle = p.title || 'Untitled';
            var pstatus = (p.status || 'draft').toLowerCase();
            var dueDate = p.dueDate ? formatDate(p.dueDate) : 'No due date';
            var maxScore = p.maxScore || p.maxScore || 100;
            var deliveryMode = p.deliveryMode || 'individual';
            var statusClass = getStatusClass(pstatus);

            return '<div class="project-row" data-id="' + pid + '">'
                + '<span class="project-status-badge ' + statusClass + '">' + pstatus + '</span>'
                + '<div class="project-info">'
                + '<strong>' + ptitle + '</strong>'
                + '<div class="project-meta">'
                + '<span><i class="fa-regular fa-calendar"></i> ' + dueDate + '</span>'
                + '<span><i class="fa-solid fa-star"></i> ' + maxScore + ' pts</span>'
                + '<span><i class="fa-solid fa-user"></i> ' + deliveryMode + '</span>'
                + '</div></div>'
                + '<div class="project-actions">'
                + '<button class="project-action-btn" data-action="edit" data-id="' + pid + '" title="Edit project"><i class="fa-solid fa-pen"></i></button>'
                + '<button class="project-action-btn danger" data-action="delete" data-id="' + pid + '" title="Delete project"><i class="fa-solid fa-trash-can"></i></button>'
                + '</div></div>';
        }).join('');
    }

    function renderReviewQueue() {
        var listEl = document.getElementById('review-list');
        var pending = submissions.filter(function (s) {
            var st = (s.status || '').toLowerCase();
            return st === 'pending' || st === 'submitted' || st === 'needs_review';
        });

        if (!pending.length) {
            listEl.innerHTML = '<div class="review-empty"><i class="fa-regular fa-circle-check"></i><p style="margin-top:0.5rem;">No pending submissions!</p></div>';
            return;
        }

        listEl.innerHTML = pending.slice(0, 10).map(function (s) {
            var sid = s._id || s.id || '';
            var sname = s.studentName || s.name || s.student?.name || 'Student';
            var ptitle = s.projectTitle || s.assignmentTitle || s.title || 'Project';
            var stime = formatTimeAgo(s.submittedAt || s.createdAt || s.submissionDate);
            return '<div class="review-item" data-id="' + sid + '">'
                + '<div class="review-item-info">'
                + '<strong>' + sname + '</strong>'
                + '<div class="review-item-meta"><span>' + ptitle + '</span><span>' + stime + '</span></div>'
                + '</div>'
                + '<button class="review-btn" data-action="review" data-id="' + sid + '">Review</button>'
                + '</div>';
        }).join('');
    }

    function renderSubmissionsTable() {
        var tbody = document.getElementById('submissions-tbody');
        if (!submissions.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary);">No submissions yet.</td></tr>';
            return;
        }

        tbody.innerHTML = submissions.map(function (s) {
            var sid = s._id || s.id || '';
            var sname = s.studentName || s.name || s.student?.name || 'Student';
            var ptitle = s.projectTitle || s.assignmentTitle || s.title || 'Project';
            var sstatus = (s.status || 'pending').toLowerCase();
            var grade = s.grade != null ? s.grade + '/100' : '—';
            var stime = formatTimeAgo(s.submittedAt || s.createdAt || s.submissionDate);
            var statusClass = getStatusClass(sstatus);

            return '<tr data-id="' + sid + '">'
                + '<td class="sub-student">' + sname + '</td>'
                + '<td>' + ptitle + '</td>'
                + '<td><span class="project-status-badge ' + statusClass + '">' + sstatus.replace('_', ' ') + '</span></td>'
                + '<td>' + grade + '</td>'
                + '<td class="sub-mono">' + stime + '</td>'
                + '<td><button class="review-btn" data-action="review" data-id="' + sid + '">Review</button></td>'
                + '</tr>';
        }).join('');
    }

    function updateStats() {
        var total = projects.length;
        var pending = submissions.filter(function (s) {
            var st = (s.status || '').toLowerCase();
            return st === 'pending' || st === 'submitted' || st === 'needs_review';
        }).length;
        var approved = submissions.filter(function (s) {
            var st = (s.status || '').toLowerCase();
            return st === 'approved' || st === 'graded';
        }).length;
        var studentSet = {};
        submissions.forEach(function (s) {
            var uid = s.userId || s.studentId || s.student?._id || s.student?.id;
            if (uid) studentSet[uid] = true;
        });
        var studentCount = Object.keys(studentSet).length || '—';

        document.getElementById('stat-projects').textContent = total;
        document.getElementById('stat-students').textContent = studentCount;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-approved').textContent = approved;
    }

    /* ── Create Project Modal ──────────────────────────── */

    function openCreateModal() {
        document.getElementById('create-project-modal').style.display = 'flex';
        document.getElementById('create-project-error').style.display = 'none';
    }

    function closeCreateModal() {
        document.getElementById('create-project-modal').style.display = 'none';
        document.getElementById('create-project-form').reset();
        resetDynamicRows('milestones-container');
        resetDynamicRows('rubric-container');
        resetDynamicRows('resources-container');
    }

    function resetDynamicRows(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
    }

    function addMilestoneRow() {
        var container = document.getElementById('milestones-container');
        if (!container) return;
        var idx = container.children.length;
        var div = document.createElement('div');
        div.className = 'dynamic-row';
        div.dataset.index = idx;
        div.innerHTML = '<input type="text" class="milestone-title" placeholder="Milestone title" style="flex:2;">'
            + '<input type="date" class="milestone-due" style="flex:1;">'
            + '<label class="milestone-final-label"><input type="checkbox" class="milestone-final"> Final</label>'
            + '<button type="button" class="btn-remove-row" title="Remove milestone">&times;</button>';
        container.appendChild(div);
    }

    function addRubricRow() {
        var container = document.getElementById('rubric-container');
        if (!container) return;
        var div = document.createElement('div');
        div.className = 'dynamic-row';
        div.innerHTML = '<input type="text" class="rubric-criterion" placeholder="Criterion description" style="flex:2;">'
            + '<input type="number" class="rubric-score" placeholder="Max score" value="10" min="0" style="flex:0 0 100px;">'
            + '<span class="dynamic-row-unit">pts</span>'
            + '<button type="button" class="btn-remove-row" title="Remove criterion">&times;</button>';
        container.appendChild(div);
    }

    function addResourceRow() {
        var container = document.getElementById('resources-container');
        if (!container) return;
        var div = document.createElement('div');
        div.className = 'dynamic-row';
        div.innerHTML = '<input type="text" class="resource-label" placeholder="Label" style="flex:1;">'
            + '<input type="url" class="resource-url" placeholder="https://..." style="flex:2;">'
            + '<button type="button" class="btn-remove-row" title="Remove resource">&times;</button>';
        container.appendChild(div);
    }

    async function handleCreateProject() {
        var title = document.getElementById('project-title').value.trim();
        var description = document.getElementById('project-description').value.trim();
        var dueDate = document.getElementById('project-due').value;
        var maxScore = parseInt(document.getElementById('project-max-score').value) || 100;
        var deliveryMode = document.getElementById('project-delivery').value;
        var errorEl = document.getElementById('create-project-error');

        if (!title) {
            errorEl.textContent = 'Project title is required.';
            errorEl.style.display = '';
            return;
        }

        var milestoneTitles = document.querySelectorAll('.milestone-title');
        var milestoneDues = document.querySelectorAll('.milestone-due');
        var milestoneFinals = document.querySelectorAll('.milestone-final');
        var milestones = [];
        for (var i = 0; i < milestoneTitles.length; i++) {
            var mt = milestoneTitles[i].value.trim();
            if (mt) {
                milestones.push({
                    title: mt,
                    dueAt: milestoneDues[i] ? milestoneDues[i].value || null : null,
                    isFinal: milestoneFinals[i] ? milestoneFinals[i].checked : false,
                });
            }
        }

        var rubricCriteria = document.querySelectorAll('.rubric-criterion');
        var rubricScores = document.querySelectorAll('.rubric-score');
        var rubric = [];
        for (var j = 0; j < rubricCriteria.length; j++) {
            var rc = rubricCriteria[j].value.trim();
            if (rc) {
                rubric.push({
                    criterion: rc,
                    maxScore: parseInt(rubricScores[j]?.value) || 10,
                });
            }
        }

        var resourceLabels = document.querySelectorAll('.resource-label');
        var resourceUrls = document.querySelectorAll('.resource-url');
        var resources = [];
        for (var k = 0; k < resourceLabels.length; k++) {
            var rl = resourceLabels[k].value.trim();
            var ru = resourceUrls[k]?.value.trim();
            if (rl && ru) {
                resources.push({ label: rl, url: ru });
            }
        }

        var submitBtn = document.getElementById('submit-create-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        errorEl.style.display = 'none';

        try {
            var body = {
                title: title,
                courseId: courseId,
                description: description || undefined,
                dueDate: dueDate || undefined,
                maxScore: maxScore,
                sectionId: null,
            };

            var resp = await apiFetch('/assignments', {
                service: 'admin',
                method: 'POST',
                auth: true,
                body: body,
            });

            closeCreateModal();
            await loadProjects();
        } catch (err) {
            errorEl.textContent = err.message || 'Failed to create project.';
            errorEl.style.display = '';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Project';
        }
    }

    /* ── Delete Project ────────────────────────────────── */

    async function handleDeleteProject(projectId) {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        try {
            await apiFetch('/assignments/' + encodeURIComponent(projectId), {
                service: 'admin',
                method: 'DELETE',
                auth: true,
            });
            await loadProjects();
        } catch (err) {
            alert('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    }

    /* ── Review Modal ───────────────────────────────────── */

    var activeReviewSubmission = null;

    function openReviewModal(submissionId) {
        var s = findSubmission(submissionId);
        if (!s) return;

        activeReviewSubmission = s;

        document.getElementById('review-student-name').textContent = s.studentName || s.name || s.student?.name || 'Student';
        document.getElementById('review-project-name').textContent = s.projectTitle || s.assignmentTitle || s.title || 'Project';
        document.getElementById('review-submitted-at').textContent = formatDate(s.submittedAt || s.createdAt || s.submissionDate);
        var githubLink = s.githubLink || s.repoUrl || s.githubUrl || '';
        var githubEl = document.getElementById('review-github-link');
        if (githubLink) {
            githubEl.href = githubLink;
            githubEl.textContent = githubLink;
            githubEl.style.display = '';
        } else {
            githubEl.textContent = 'Not provided';
            githubEl.href = '#';
        }

        document.getElementById('review-grade').value = s.grade || '';
        var statusRadios = document.querySelectorAll('input[name="review-status"]');
        var currentStatus = (s.status || 'pending').toLowerCase();
        for (var i = 0; i < statusRadios.length; i++) {
            if (statusRadios[i].value === currentStatus) {
                statusRadios[i].checked = true;
            }
        }

        document.getElementById('review-feedback').value = s.feedback || s.instructorNotes || '';
        document.getElementById('review-error').style.display = 'none';
        document.getElementById('review-modal').style.display = 'flex';
    }

    function closeReviewModal() {
        document.getElementById('review-modal').style.display = 'none';
        activeReviewSubmission = null;
    }

    function findSubmission(id) {
        for (var i = 0; i < submissions.length; i++) {
            if ((submissions[i]._id || submissions[i].id) === id) return submissions[i];
        }
        return null;
    }

    async function handleReviewSubmit() {
        if (!activeReviewSubmission) return;
        var sid = activeReviewSubmission._id || activeReviewSubmission.id;
        var grade = parseInt(document.getElementById('review-grade').value);
        var statusEl = document.querySelector('input[name="review-status"]:checked');
        var status = statusEl ? statusEl.value : 'approved';
        var feedback = document.getElementById('review-feedback').value.trim();
        var errorEl = document.getElementById('review-error');

        var submitBtn = document.getElementById('submit-review-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        errorEl.style.display = 'none';

        try {
            await apiFetch('/submissions/' + encodeURIComponent(sid) + '/status', {
                service: 'admin',
                method: 'PATCH',
                auth: true,
                body: {
                    status: status,
                    grade: isNaN(grade) ? undefined : grade,
                    feedback: feedback || undefined,
                },
            });

            closeReviewModal();
            await loadSubmissions();
        } catch (err) {
            errorEl.textContent = err.message || 'Failed to submit review.';
            errorEl.style.display = '';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }

    /* ── apiFetch helper (for direct calls) ────────────── */

    function apiFetch(path, options) {
        options = options || {};
        var service = options.service || 'admin';
        var method = options.method || 'GET';
        var auth = options.auth !== false;

        var baseUrl = (window.NibrasApiConfig && window.NibrasApiConfig.getServiceUrl)
            ? window.NibrasApiConfig.getServiceUrl(service)
            : window.NIBRAS_API_URL || 'https://nibras-backend.up.railway.app/api';
        baseUrl = String(baseUrl).replace(/\/+$/, '');
        var url = baseUrl + path;

        var headers = { 'Content-Type': 'application/json' };
        if (auth) {
            var token = window.localStorage.getItem('token');
            if (token) headers['Authorization'] = 'Bearer ' + token;
        }

        var fetchOptions = {
            method: method,
            headers: headers,
        };
        if (options.body) {
            fetchOptions.body = JSON.stringify(options.body);
        }

        return fetch(url, fetchOptions).then(async function (response) {
            if (!response.ok) {
                var body = null;
                try { body = await response.json(); } catch (_) {}
                var err = new Error((body && (body.message || body.error)) || 'Request failed (' + response.status + ')');
                err.status = response.status;
                err.payload = body;
                throw err;
            }
            return response.json();
        });
    }

    /* ── Event Delegation ───────────────────────────────── */

    function setupEvents() {
        document.addEventListener('click', function (e) {
            /* Create project */
            if (e.target.closest('#btn-new-project')) {
                openCreateModal();
                return;
            }

            /* Close modals */
            if (e.target.closest('#close-create-modal') || e.target.closest('#cancel-create-btn')) {
                closeCreateModal();
                return;
            }
            if (e.target.closest('#close-review-modal') || e.target.closest('#cancel-review-btn')) {
                closeReviewModal();
                return;
            }

            /* Click overlay to close */
            if (e.target.classList.contains('modal-overlay')) {
                if (e.target.id === 'create-project-modal') closeCreateModal();
                if (e.target.id === 'review-modal') closeReviewModal();
                return;
            }

            /* Project actions */
            var actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                var action = actionBtn.getAttribute('data-action');
                var id = actionBtn.getAttribute('data-id');
                if (action === 'edit') {
                    alert('Edit functionality coming soon. You can delete and recreate for now.');
                    return;
                }
                if (action === 'delete' && id) {
                    handleDeleteProject(id);
                    return;
                }
                if (action === 'review' && id) {
                    openReviewModal(id);
                    return;
                }
            }

            /* Dynamic row add */
            if (e.target.closest('#add-milestone-row')) {
                e.preventDefault();
                addMilestoneRow();
                return;
            }
            if (e.target.closest('#add-rubric-row')) {
                e.preventDefault();
                addRubricRow();
                return;
            }
            if (e.target.closest('#add-resource-row')) {
                e.preventDefault();
                addResourceRow();
                return;
            }

            /* Remove dynamic row */
            if (e.target.closest('.btn-remove-row')) {
                var row = e.target.closest('.dynamic-row');
                if (row) row.remove();
                return;
            }

            /* Create submit */
            if (e.target.closest('#submit-create-btn')) {
                handleCreateProject();
                return;
            }

            /* Review submit */
            if (e.target.closest('#submit-review-btn')) {
                handleReviewSubmit();
                return;
            }

            /* View all submissions toggle */
            if (e.target.closest('#btn-view-all-submissions')) {
                var panel = document.getElementById('panel-submissions');
                panel.style.display = panel.style.display === 'none' ? '' : 'none';
                return;
            }

            /* Submission filter buttons */
            var sfilterBtn = e.target.closest('[data-sfilter]');
            if (sfilterBtn) {
                var filter = sfilterBtn.getAttribute('data-sfilter');
                document.querySelectorAll('[data-sfilter]').forEach(function (b) { b.classList.remove('inst-filter-active'); });
                sfilterBtn.classList.add('inst-filter-active');
                filterSubmissionsTable(filter);
                return;
            }

            /* Manage buttons */
            if (e.target.closest('#btn-manage-templates')) {
                alert('Templates page coming soon.');
                return;
            }
            if (e.target.closest('#btn-manage-members')) {
                alert('Members page coming soon.');
                return;
            }
        });
    }

    function filterSubmissionsTable(filter) {
        var rows = document.querySelectorAll('#submissions-tbody tr');
        var rowData = submissions;
        for (var i = 0; i < rows.length; i++) {
            var sid = rows[i].getAttribute('data-id');
            var s = findSubmission(sid);
            if (!s) continue;
            var st = (s.status || '').toLowerCase();
            if (filter === 'all' || st === filter) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }

    /* ── Init ───────────────────────────────────────────── */

    async function init() {
        var user = getUser();
        if (user.name) updateUserUI(user);

        try {
            var meData = await S.authService.getMe();
            var freshUser = meData && (meData.user || (meData.data && meData.data.user) || meData.data || meData);
            if (freshUser && freshUser.name) {
                localStorage.setItem('user', JSON.stringify(freshUser));
                updateUserUI(freshUser);
            }
        } catch (_) {}

        setupEvents();
        seedDefaultRows();
        await loadData();
    }

    function seedDefaultRows() {
        var milestones = document.getElementById('milestones-container');
        if (milestones && !milestones.children.length) {
            var div = document.createElement('div');
            div.className = 'dynamic-row';
            div.dataset.index = 0;
            div.innerHTML = '<input type="text" class="milestone-title" placeholder="Milestone title" style="flex:2;">'
                + '<input type="date" class="milestone-due" style="flex:1;">'
                + '<label class="milestone-final-label"><input type="checkbox" class="milestone-final"> Final</label>'
                + '<button type="button" class="btn-remove-row" title="Remove milestone">&times;</button>';
            milestones.appendChild(div);
        }
        var rubric = document.getElementById('rubric-container');
        if (rubric && !rubric.children.length) {
            var div2 = document.createElement('div');
            div2.className = 'dynamic-row';
            div2.dataset.index = 0;
            div2.innerHTML = '<input type="text" class="rubric-criterion" placeholder="Criterion description" style="flex:2;">'
                + '<input type="number" class="rubric-score" placeholder="Max score" value="10" min="0" style="flex:0 0 100px;">'
                + '<span class="dynamic-row-unit">pts</span>'
                + '<button type="button" class="btn-remove-row" title="Remove criterion">&times;</button>';
            rubric.appendChild(div2);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
