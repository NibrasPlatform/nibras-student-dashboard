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
});
