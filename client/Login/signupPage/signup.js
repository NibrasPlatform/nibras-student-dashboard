window.NibrasReact.run(() => {

    // --- 1. THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // Check local storage or default
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Set initial icon
    if(currentTheme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun'; 
    } else {
        themeIcon.className = 'fa-solid fa-moon'; 
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-solid fa-moon';
        }
    });

    // --- 2. PASSWORD VISIBILITY ---
    window.togglePass = function(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // --- 3. FORM SUBMIT (Backend Integration) ---
    const BACKEND_URL = 'http://localhost:5000';

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('nameInput').value.trim();
        const email = document.getElementById('emailInput').value.trim();
        const password = document.getElementById('passInput').value;
        const confirmPassword = document.getElementById('confPassInput').value;

        // Validation
        if (!name) {
            alert('Please enter your name');
            return;
        }
        if (!email) {
            alert('Please enter your email');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (res.ok && data.data?.token) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                alert('Account created successfully!');
                window.location.href = '/';
            } else {
                alert(data.error || data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Signup error:', err);
            alert('Registration failed. Please try again.');
        }
    });
});
