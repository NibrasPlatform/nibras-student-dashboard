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

    // --- PASSWORD RESET EMAIL FORM ---
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = resetForm.querySelector('input[type="email"]');
            const email = emailInput?.value?.trim();

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            // Password reset endpoint not yet available on backend
            // Show user-friendly feedback instead of doing nothing
            const submitBtn = resetForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent || 'Continue';

            if (submitBtn) {
                submitBtn.textContent = 'Password reset not yet available';
                submitBtn.style.opacity = '0.7';
                submitBtn.disabled = true;

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = '';
                    submitBtn.disabled = false;
                }, 3000);
            }

            console.log('[PASSWORD RESET] Forgot password requested for:', email);
            console.log('[PASSWORD RESET] Backend does not yet support password reset.');

            // Store email for the next step and navigate
            localStorage.setItem('resetEmail', email);
            window.location.href = '../Confirm%20Password/confirm.html';
        });
    }
});
