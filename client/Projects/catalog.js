var roleState = { step: 1, cardData: null, projectId: '' };

window.NibrasReact.run(function () {
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        var htmlEl = document.documentElement;
        var themeIcon = themeToggle.querySelector('i');
        var saved = localStorage.getItem('theme') || 'light';
        htmlEl.setAttribute('data-theme', saved);
        updateUI(themeIcon, saved);
        themeToggle.addEventListener('click', function () {
            var cur = htmlEl.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateUI(themeIcon, next);
        });
    }
    function updateUI(el, theme) {
        if (!el) return; el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        var logo = document.querySelector('.sidebar-logo');
        if (logo) logo.src = theme === 'dark' ? '../Assets/images/logo-dark.png' : '../Assets/images/logo-light.png';
    }

    loadCatalog();
});

function loadCatalog() {
    var grid = document.getElementById('projects-grid');
    var services = window.NibrasServices;
    if (!services || !services.trackingProjectService) {
        if (grid) grid.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Service unavailable</p>';
        return;
    }

    services.trackingProjectService.getCatalog().then(function (res) {
        var templates = Array.isArray(res) ? res : (res?.data || res?.templates || []);
        if (!templates.length) {
            if (grid) grid.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">No project templates found.</p>';
            return;
        }
        renderCards(templates);
        buildTagCloud(templates);
        setupFilters(templates);
    }).catch(function () {
        if (grid) grid.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load catalog.</p>';
    });
}

function renderCards(templates) {
    var grid = document.getElementById('projects-grid');
    grid.innerHTML = '';
    document.getElementById('results-count').textContent = templates.length;

    templates.forEach(function (t) {
        var delivery = t.deliveryMode || 'individual';
        var diff = t.difficulty || '';
        var diffClass = diff ? 'diff-pill ' + diff : '';
        var teamBadge = delivery === 'team' ? '<span class="team-pill"><i class="fas fa-users"></i> Team</span>' : '';
        var diffBadge = diff ? '<span class="diff-pill ' + diff + '">' + diff + '</span>' : '';
        var rolesHtml = '';
        var openRoles = t.openRoles || t.roles || [];
        if (openRoles.length) {
            rolesHtml = '<div class="open-roles"><label>OPEN ROLES</label><div class="role-pills">';
            openRoles.forEach(function (r) {
                var title = r.title || r.name || 'Role';
                var slots = r.slots || r.count || 1;
                rolesHtml += '<span class="role-pill">' + title + ' <span class="slot">' + slots + '</span></span>';
            });
            rolesHtml += '</div></div>';
        }

        var tagsHtml = '';
        var tags = t.tags || [];
        if (tags.length) {
            tagsHtml = '<div class="tech-tags">';
            tags.forEach(function (tag) { tagsHtml += '<span class="tech-tag">' + tag + '</span>'; });
            tagsHtml += '</div>';
        }

        var metaHtml = '';
        if (t.duration) metaHtml += '<span><i class="far fa-clock"></i> ' + t.duration + '</span>';
        if (t.teamSize) metaHtml += '<span><i class="fas fa-users"></i> ' + t.teamSize + ' members</span>';
        var milestones = t.milestones || t.milestoneCount || 0;
        if (milestones) metaHtml += '<span><i class="fas fa-layer-group"></i> ' + milestones + ' milestones</span>';

        var canApply = openRoles.length > 0;
        var btnHtml = canApply
            ? '<button class="btn-apply" data-project-id="' + (t.id || '') + '" data-project-title="' + esc(t.title || '') + '" data-roles=\'' + JSON.stringify(openRoles) + '\'>Apply for Roles <i class="fas fa-arrow-right"></i></button>'
            : '<button class="btn-disabled" disabled>No Open Roles</button>';

        grid.innerHTML += [
            '<div class="catalog-card" data-delivery="' + delivery + '" data-difficulty="' + diff + '">',
            '<div class="card-top">',
            '<span class="course-pill">' + esc(t.courseCode || '') + '</span>',
            teamBadge,
            diffBadge,
            '</div>',
            '<h3>' + esc(t.title || 'Project') + '</h3>',
            '<p class="card-desc">' + esc(t.description || '') + '</p>',
            t.courseName ? '<p class="course-subtext">' + esc(t.courseName) + '</p>' : '',
            metaHtml ? '<div class="card-meta">' + metaHtml + '</div>' : '',
            rolesHtml,
            tagsHtml,
            btnHtml,
            '</div>',
        ].join('');
    });

    document.querySelectorAll('.btn-apply').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var projectId = this.getAttribute('data-project-id');
            var title = this.getAttribute('data-project-title');
            var roles = [];
            try { roles = JSON.parse(this.getAttribute('data-roles')); } catch (_) {}
            openRoleModal(projectId, title, roles);
        });
    });
}

function buildTagCloud(templates) {
    var cloud = document.querySelector('.tag-cloud');
    if (!cloud) return;
    var allTags = {};
    templates.forEach(function (t) { (t.tags || []).forEach(function (tag) { allTags[tag] = (allTags[tag] || 0) + 1; }); });
    var sorted = Object.keys(allTags).sort();
    cloud.innerHTML = sorted.map(function (tag) { return '<span class="cloud-tag">' + tag + '</span>'; }).join('');
    cloud.querySelectorAll('.cloud-tag').forEach(function (el) {
        el.addEventListener('click', function () {
            var input = document.querySelector('.search-input-wrapper input');
            if (input) input.value = this.textContent;
        });
    });
}

function setupFilters(templates) {
    var deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    var diffCheckboxes = document.querySelectorAll('[id^="diff-"]');
    var cards = function () { return document.querySelectorAll('.catalog-card'); };
    var countEl = document.getElementById('results-count');

    function apply() {
        var delivery = 'all';
        deliveryRadios.forEach(function (r) { if (r.checked) delivery = r.value; });
        var checkedDiffs = [];
        diffCheckboxes.forEach(function (c) { if (c.checked) checkedDiffs.push(c.value); });
        var visible = 0;
        cards().forEach(function (card) {
            var cardDelivery = card.getAttribute('data-delivery') || '';
            var cardDiff = card.getAttribute('data-difficulty') || '';
            var matchDelivery = delivery === 'all' || cardDelivery === delivery;
            var matchDiff = checkedDiffs.length === 0 || checkedDiffs.indexOf(cardDiff) !== -1;
            if (matchDelivery && matchDiff) { card.style.display = ''; visible++; }
            else card.style.display = 'none';
        });
        if (countEl) countEl.textContent = visible;
    }

    deliveryRadios.forEach(function (r) { r.addEventListener('change', apply); });
    diffCheckboxes.forEach(function (c) { c.addEventListener('change', apply); });
}

function openRoleModal(projectId, title, roles) {
    roleState.projectId = projectId;
    roleState.step = 1;
    roleState.cardData = { title: title, roles: roles };
    document.getElementById('role-modal-subtitle').textContent = title || 'Project';

    var roleNames = roles.map(function (r) { return r.title || r.name || 'Role'; });
    if (roleNames.length === 0) roleNames = ['Developer', 'Designer', 'Tester'];
    if (roleNames.length > 3) roleNames = roleNames.slice(0, 3);
    while (roleNames.length < 3) roleNames.push(roleNames[0] || 'Role');

    for (var i = 1; i <= 3; i++) {
        var sel = document.getElementById('role-choice-' + i);
        if (!sel) continue;
        sel.innerHTML = '<option value="">Select a role...</option>';
        roleNames.forEach(function (r) { sel.innerHTML += '<option value="' + r + '">' + r + '</option>'; });
    }

    document.getElementById('role-modal-title').textContent = 'Apply for Roles';
    document.getElementById('role-step-1').style.display = '';
    document.getElementById('role-step-2').style.display = 'none';
    document.getElementById('role-step-3').style.display = 'none';
    document.getElementById('role-btn-back').style.display = 'none';
    document.getElementById('role-btn-next').style.display = '';
    document.getElementById('role-btn-submit').style.display = 'none';
    document.getElementById('role-motivation').value = '';
    document.getElementById('role-availability').value = '';
    document.getElementById('motivation-count').textContent = '0';
    document.getElementById('availability-count').textContent = '0';

    updateStepDots(1);
    var modal = document.getElementById('roleModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeRoleModal() {
    var modal = document.getElementById('roleModal');
    if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
}

function updateStepDots(step) {
    document.querySelectorAll('.step-dot').forEach(function (d) {
        var s = parseInt(d.getAttribute('data-step'));
        d.classList.toggle('active', s === step);
        d.classList.toggle('done', s < step);
    });
    document.querySelectorAll('.step-line').forEach(function (l, i) {
        l.classList.toggle('done', i < step - 1);
    });
}

function roleStep(dir) {
    if (dir === 'next' && roleState.step === 1) {
        if (!document.getElementById('role-choice-1').value) { alert('Please select your first choice role.'); return; }
    }
    roleState.step += dir === 'next' ? 1 : -1;
    roleState.step = Math.max(1, Math.min(3, roleState.step));

    document.getElementById('role-step-1').style.display = roleState.step === 1 ? '' : 'none';
    document.getElementById('role-step-2').style.display = roleState.step === 2 ? '' : 'none';
    document.getElementById('role-step-3').style.display = roleState.step === 3 ? '' : 'none';
    document.getElementById('role-btn-back').style.display = roleState.step > 1 ? '' : 'none';
    document.getElementById('role-btn-next').style.display = roleState.step < 3 ? '' : 'none';
    document.getElementById('role-btn-submit').style.display = roleState.step === 3 ? '' : 'none';
    if (roleState.step === 3) buildReview();
    updateStepDots(roleState.step);
}

function buildReview() {
    var list = document.getElementById('role-review-list');
    list.innerHTML = '';
    var labels = ['#1', '#2', '#3'];
    for (var i = 1; i <= 3; i++) {
        var sel = document.getElementById('role-choice-' + i);
        var val = sel ? sel.value : '';
        if (!val) continue;
        list.innerHTML += '<div class="review-row"><div class="review-rank">' + labels[i - 1] + '</div><div class="review-name">' + val + '</div></div>';
    }
}

function submitRoleApplication() {
    if (!confirm('Submit your application? You cannot edit it later.')) return;
    var services = window.NibrasServices;
    if (!services || !services.trackingProjectService || !roleState.projectId) {
        alert('Application submitted!'); closeRoleModal(); return;
    }
    var data = {
        rolePreferences: [
            document.getElementById('role-choice-1').value,
            document.getElementById('role-choice-2').value,
            document.getElementById('role-choice-3').value,
        ].filter(Boolean),
        motivation: document.getElementById('role-motivation').value,
        availability: document.getElementById('role-availability').value,
    };
    services.trackingProjectService.submitApplication(roleState.projectId, data).then(function () {
        alert('Application submitted successfully!');
        closeRoleModal();
    }).catch(function (err) {
        alert('Error: ' + (err?.message || 'Submission failed'));
    });
}

function esc(str) { if (!str) return ''; var d = document.createElement('div'); d.appendChild(document.createTextNode(String(str))); return d.innerHTML; }

document.getElementById('role-motivation')?.addEventListener('input', function () { document.getElementById('motivation-count').textContent = this.value.length; });
document.getElementById('role-availability')?.addEventListener('input', function () { document.getElementById('availability-count').textContent = this.value.length; });

document.addEventListener('click', function (event) {
    var modal = document.getElementById('roleModal');
    if (modal && modal.classList.contains('active') && event.target === modal) closeRoleModal();
});
