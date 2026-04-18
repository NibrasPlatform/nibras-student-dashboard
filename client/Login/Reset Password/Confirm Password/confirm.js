window.NibrasReact.run(() => {

    // --- THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');

    // Initial Check
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
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

    // --- NEW PASSWORD FORM ---
    const newPasswordForm = document.getElementById('newPasswordForm');
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('newPass')?.value;
            const confPass = document.getElementById('confPass')?.value;

            if (!newPass || newPass.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }
            if (newPass !== confPass) {
                alert('Passwords do not match.');
                return;
            }

            // Password reset endpoint not yet available on backend
            const resetBtn = newPasswordForm.querySelector('button[type="submit"]');
            const originalText = resetBtn?.textContent || 'Reset';

            if (resetBtn) {
                resetBtn.textContent = 'Password reset not yet available';
                resetBtn.style.opacity = '0.7';
                resetBtn.disabled = true;

                setTimeout(() => {
                    resetBtn.textContent = originalText;
                    resetBtn.style.opacity = '';
                    resetBtn.disabled = false;
                }, 3000);
            }

            const resetEmail = localStorage.getItem('resetEmail');
            console.log('[PASSWORD RESET] New password requested for:', resetEmail);
            console.log('[PASSWORD RESET] Backend does not yet support password reset.');

            // Navigate to message page
            window.location.href = '../Message/message.html';
        });
    }
});
