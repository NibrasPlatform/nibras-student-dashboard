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

            const submitBtn = resetForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent || 'Continue';

            if (submitBtn) {
                submitBtn.textContent = 'Sending OTP...';
                submitBtn.style.opacity = '0.7';
                submitBtn.disabled = true;
            }

            try {
                const res = await fetch('https://nibras-backend.up.railway.app/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (!res.ok) {
                    alert(data.message || 'Failed to send reset OTP.');
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = '';
                    submitBtn.disabled = false;
                    return;
                }

                localStorage.setItem('resetEmail', email);
                window.location.href = '../Confirm%20Password/confirm.html';
            } catch (error) {
                console.error('[FORGOT PASSWORD ERROR]', error);
                alert('Network error. Please try again.');
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = '';
                    submitBtn.disabled = false;
                }
            }
        });
    }
});
