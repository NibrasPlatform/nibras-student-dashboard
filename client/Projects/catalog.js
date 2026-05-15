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
        if (!el) return;
        el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        var logo = document.querySelector('.sidebar-logo');
        if (logo) logo.src = theme === 'dark' ? '../Assets/images/logo-dark.png' : '../Assets/images/logo-light.png';
    }

    var deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    var diffCheckboxes = document.querySelectorAll('[id^="diff-"]');
    var cards = document.querySelectorAll('.catalog-card');
    var countEl = document.getElementById('results-count');

    function applyFilters() {
        var delivery = 'all';
        deliveryRadios.forEach(function (r) { if (r.checked) delivery = r.value; });

        var checkedDiffs = [];
        diffCheckboxes.forEach(function (c) { if (c.checked) checkedDiffs.push(c.value); });

        var visible = 0;
        cards.forEach(function (card) {
            var cardDelivery = card.getAttribute('data-delivery') || '';
            var cardDiff = card.getAttribute('data-difficulty') || '';

            var matchDelivery = delivery === 'all' || cardDelivery === delivery;
            var matchDiff = checkedDiffs.length === 0 || checkedDiffs.indexOf(cardDiff) !== -1;

            if (matchDelivery && matchDiff) {
                card.style.display = '';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        if (countEl) countEl.textContent = visible;
    }

    deliveryRadios.forEach(function (r) { r.addEventListener('change', applyFilters); });
    diffCheckboxes.forEach(function (c) { c.addEventListener('change', applyFilters); });
});
