(function () {
    'use strict';

    var S = window.NibrasServices;
    var courseId = localStorage.getItem('selectedCourseId');
    var selectedCourse = null;
    var projects = [];
    var editingId = null;
    var milestoneIdCounter = 0;

    function getCourseData() {
        if (window.NibrasCourses && typeof window.NibrasCourses.getSelectedCourse === 'function') {
            return window.NibrasCourses.getSelectedCourse();
        }
        return null;
    }

    function init() {
        selectedCourse = getCourseData();
        if (!selectedCourse && courseId) {
            var fallback = window.NibrasCourses && typeof window.NibrasCourses.getCourseById === 'function'
                ? window.NibrasCourses.getCourseById(courseId) : null;
            if (fallback) {
                selectedCourse = fallback;
                if (window.NibrasCourses && typeof window.NibrasCourses.setSelectedCourseId === 'function') {
                    window.NibrasCourses.setSelectedCourseId(courseId);
                }
            }
        }

        if (!selectedCourse) {
            document.getElementById('course-subtitle').textContent = 'Course: ' + (courseId || 'Unknown');
            document.getElementById('sidebar-course-code').textContent = courseId || 'Course';
            document.getElementById('sidebar-term').textContent = 'Instructor View';
            loadProjects();
            setupUI();
            return;
        }

        document.getElementById('sidebar-course-code').textContent = selectedCourse.code + ': ' + selectedCourse.title;
        document.getElementById('sidebar-term').textContent = (selectedCourse.overview?.term || '') + ' • Week ' + (selectedCourse.overview?.currentWeek || '');
        document.getElementById('course-subtitle').textContent = selectedCourse.code + ': ' + selectedCourse.title;
        loadProjects();
        setupUI();

        var navLinkCourses = document.querySelector('[data-nav-link="courseContent"]');
        if (navLinkCourses && courseId) {
            navLinkCourses.href = '../../Courses/Course%20Description/courseContent.html?courseId=' + encodeURIComponent(courseId);
        }
    }

    function setupUI() {
        document.getElementById('btn-create-project').addEventListener('click', function () { openCreateModal(); });
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('btn-cancel').addEventListener('click', closeModal);
        document.getElementById('btn-save').addEventListener('click', saveProject);
        document.getElementById('btn-add-milestone').addEventListener('click', function () { addMilestoneRow(); });

        var themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            var themeIcon = themeBtn.querySelector('i');
            var themeText = themeBtn.querySelector('span');
            var curTheme = document.documentElement.getAttribute('data-theme') || 'light';
            if (curTheme === 'dark') { themeIcon.className = 'fa-solid fa-sun'; themeText.textContent = 'Light Mode'; }
            themeBtn.addEventListener('click', function () {
                var html = document.documentElement;
                var current = html.getAttribute('data-theme');
                var newTheme = current === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                if (newTheme === 'dark') { themeIcon.className = 'fa-solid fa-sun'; themeText.textContent = 'Light Mode'; }
                else { themeIcon.className = 'fa-solid fa-moon'; themeText.textContent = 'Dark Mode'; }
            });
        }

        document.getElementById('project-modal').addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    function loadProjects() {
        var container = document.getElementById('project-list');
        if (!S || !S.projectService) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>Project service unavailable.</p></div>';
            return;
        }

        var backendId = selectedCourse?.adminCourseId || selectedCourse?.backendCourseId || courseId;
        if (!backendId) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>No course ID available. Select a course first.</p></div>';
            return;
        }

        S.projectService.listByCourse(backendId).then(function (res) {
            var items = res?.data || [];
            if (!Array.isArray(items)) items = [];
            projects = items;
            renderProjects();
        }).catch(function () {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-database"></i><p>No projects yet. Create your first one!</p></div>';
        });
    }

    function renderProjects() {
        var container = document.getElementById('project-list');
        if (!projects.length) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-diagram-project"></i><p>No projects yet. Click "Create Project" to get started.</p></div>';
            return;
        }

        container.innerHTML = projects.map(function (p) {
            var due = p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';
            var teamSize = p.teamSize || 'Individual';
            var milestoneCount = (p.milestones || []).length;
            return '<div class="project-card" data-id="' + (p._id || p.id) + '">'
                + '<div class="card-top">'
                + '<div class="card-icon"><i class="fa-solid fa-diagram-project"></i></div>'
                + '<div class="card-info">'
                + '<h3>' + escapeHtml(p.title || 'Untitled') + '</h3>'
                + '<p>' + escapeHtml(p.description || '') + '</p>'
                + '</div>'
                + '<div class="card-points">' + (p.points || '—') + ' pts</div>'
                + '</div>'
                + '<div class="card-meta">'
                + '<span><i class="fa-regular fa-calendar"></i> ' + due + '</span>'
                + '<span><i class="fa-solid fa-users"></i> Team: ' + teamSize + '</span>'
                + '<span><i class="fa-solid fa-flag-checkered"></i> ' + milestoneCount + ' milestones</span>'
                + '</div>'
                + '<div class="card-actions">'
                + '<button class="action-btn edit-btn" data-id="' + (p._id || p.id) + '"><i class="fa-regular fa-pen-to-square"></i> Edit</button>'
                + '<button class="action-btn delete-btn" data-id="' + (p._id || p.id) + '"><i class="fa-regular fa-trash-can"></i> Delete</button>'
                + '</div>'
                + '</div>';
        }).join('');

        container.querySelectorAll('.edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                openEditModal(id);
            });
        });
        container.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                if (confirm('Delete this project? This cannot be undone.')) deleteProject(id);
            });
        });
    }

    function openCreateModal() {
        editingId = null;
        document.getElementById('modal-title').textContent = 'Create Project';
        document.getElementById('btn-save').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Project';
        resetForm();
        document.getElementById('project-modal').style.display = 'flex';
    }

    function openEditModal(id) {
        var p = projects.find(function (x) { return (x._id || x.id) === id; });
        if (!p) return;
        editingId = id;
        document.getElementById('modal-title').textContent = 'Edit Project';
        document.getElementById('btn-save').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Project';

        resetForm();
        document.getElementById('edit-project-id').value = id;
        document.getElementById('field-title').value = p.title || '';
        document.getElementById('field-desc').value = p.description || '';
        if (p.dueDate) {
            var d = new Date(p.dueDate);
            document.getElementById('field-due-date').value = d.toISOString().slice(0, 10);
            document.getElementById('field-due-time').value = d.toTimeString().slice(0, 5);
        }
        document.getElementById('field-points').value = p.points || 100;
        document.getElementById('field-repo').value = p.githubRepo || '';
        document.getElementById('field-team-size').value = p.teamSize || 3;

        renderMilestones(p.milestones || []);

        document.getElementById('project-modal').style.display = 'flex';
    }

    function resetForm() {
        document.getElementById('edit-project-id').value = '';
        document.getElementById('field-title').value = '';
        document.getElementById('field-desc').value = '';
        document.getElementById('field-due-date').value = '';
        document.getElementById('field-due-time').value = '';
        document.getElementById('field-points').value = 100;
        document.getElementById('field-repo').value = '';
        document.getElementById('field-team-size').value = 3;
        document.getElementById('form-status').textContent = '';
        document.getElementById('form-status').className = 'form-status';
        renderMilestones([]);
    }

    function closeModal() {
        document.getElementById('project-modal').style.display = 'none';
    }

    function collectFormData() {
        var data = {
            title: document.getElementById('field-title').value.trim(),
            description: document.getElementById('field-desc').value.trim(),
            dueDate: buildDueDateISO(),
            points: parseInt(document.getElementById('field-points').value) || 100,
            githubRepo: document.getElementById('field-repo').value.trim(),
            teamSize: parseInt(document.getElementById('field-team-size').value) || 0,
            milestones: collectMilestones(),
        };
        if (!data.title) throw new Error('Title is required.');
        return data;
    }

    function buildDueDateISO() {
        var dateVal = document.getElementById('field-due-date').value;
        var timeVal = document.getElementById('field-due-time').value;
        if (!dateVal) return null;
        return dateVal + 'T' + (timeVal || '23:59') + ':00.000Z';
    }

    function collectMilestones() {
        var rows = document.querySelectorAll('.milestone-row');
        var milestones = [];
        var totalWeight = 0;
        rows.forEach(function (row) {
            var name = row.querySelector('.ms-name')?.value || '';
            var desc = row.querySelector('.ms-desc')?.value || '';
            var weight = parseFloat(row.querySelector('.ms-weight')?.value) || 0;
            var dueDate = row.querySelector('.ms-due')?.value || '';
            if (name) {
                milestones.push({ name: name, description: desc, weight: weight, dueDate: dueDate ? dueDate + 'T23:59:00.000Z' : null });
                totalWeight += weight;
            }
        });
        return milestones;
    }

    function saveProject() {
        var statusEl = document.getElementById('form-status');
        statusEl.textContent = '';
        statusEl.className = 'form-status';

        var data;
        try {
            data = collectFormData();
        } catch (err) {
            statusEl.textContent = err.message;
            statusEl.className = 'form-status form-status-error';
            return;
        }

        var backendId = selectedCourse?.adminCourseId || selectedCourse?.backendCourseId || courseId;
        data.courseId = backendId;

        var service = S.projectService;
        var promise;
        if (editingId) {
            promise = service.update(editingId, data);
        } else {
            promise = service.create(data);
        }

        statusEl.textContent = 'Saving...';
        statusEl.className = 'form-status form-status-info';

        promise.then(function () {
            statusEl.textContent = 'Saved successfully!';
            statusEl.className = 'form-status form-status-success';
            closeModal();
            loadProjects();
        }).catch(function (err) {
            statusEl.textContent = 'Save failed: ' + (err?.message || 'Unknown error');
            statusEl.className = 'form-status form-status-error';
        });
    }

    function deleteProject(id) {
        var service = S.projectService;
        if (!service) return;
        service.delete(id).then(function () {
            loadProjects();
        }).catch(function (err) {
            alert('Delete failed: ' + (err?.message || 'Unknown error'));
        });
    }

    // --- Milestone Rows ---
    function addMilestoneRow(ms) {
        var container = document.getElementById('milestones-container');
        var id = 'ms-' + (++milestoneIdCounter);
        var div = document.createElement('div');
        div.className = 'milestone-row';
        div.id = id;
        div.innerHTML = '<div class="ms-fields">'
            + '<div class="ms-field ms-field-wide"><label class="label-sm">Name</label><input type="text" class="form-input-sm ms-name" placeholder="e.g. Proposal" value="' + escapeHtml(ms?.name || '') + '"></div>'
            + '<div class="ms-field"><label class="label-sm">Weight (%)</label><input type="number" class="form-input-sm ms-weight" value="' + (ms?.weight || 0) + '" min="0" max="100" step="5"></div>'
            + '<div class="ms-field"><label class="label-sm">Due Date</label><input type="date" class="form-input-sm ms-due" value="' + (ms?.dueDate ? new Date(ms.dueDate).toISOString().slice(0, 10) : '') + '"></div>'
            + '<button class="ms-remove" title="Remove milestone"><i class="fa-solid fa-xmark"></i></button>'
            + '</div>'
            + '<div class="ms-field"><label class="label-sm">Description</label><input type="text" class="form-input-sm ms-desc" placeholder="What students need to submit" value="' + escapeHtml(ms?.description || '') + '"></div>';
        container.appendChild(div);
        div.querySelector('.ms-remove').addEventListener('click', function () { div.remove(); });
    }

    function renderMilestones(milestones) {
        var container = document.getElementById('milestones-container');
        container.innerHTML = '';
        milestoneIdCounter = 0;
        if (!milestones || !milestones.length) {
            container.innerHTML = '<p class="empty-hint">No milestones yet. Add one above.</p>';
            return;
        }
        milestones.forEach(function (ms) { addMilestoneRow(ms); });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
