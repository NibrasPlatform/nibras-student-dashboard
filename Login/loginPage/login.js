document.addEventListener('DOMContentLoaded', () => {

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // --- 1. THEME TOGGLE ---
    // Initial State Check
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
    } else {
        themeIcon.className = 'fa-regular fa-moon';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
        } else {
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
        }
    });

    // --- 2. PASSWORD TOGGLE ---
    window.togglePassword = function() {
        const passwordInput = document.getElementById('passwordInput');
        const icon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // --- 3. ROLE SELECTION ---
    window.selectRole = function(element) {
        // Remove active class from all cards
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to clicked card
        element.classList.add('active');
        
        console.log("Selected Role:", element.querySelector('span').textContent);
    };

    // --- 4. FORM SUBMIT (Mock) ---
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // Backend Integration Point: 
        // const email = ...
        // const password = ...
        // fetch('/api/login', ...)
        console.log("Login clicked");
    });

});