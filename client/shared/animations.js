/**
 * Nibras Platform - Shared Animations & Interactions
 * Modern scroll reveal animations using IntersectionObserver
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupScrollReveal();
        setupHeroAnimations();
        setupStaggeredAnimations();
        setupSmoothHoverEffects();
        setupIconAnimations();
    }

    /**
     * Scroll Reveal - Elements animate in when they enter viewport
     */
    function setupScrollReveal() {
        const revealElements = document.querySelectorAll(
            '.card, .stat-card, .course-card, .activity-item, .prog-item, ' +
            '.deadline-item, .achieve-item, .milestone-item, .video-card, ' +
            '.widget-card, .settings-card, .question-card'
        );

        if (!revealElements.length) return;

        // Add initial hidden state
        revealElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.transitionDelay = `${Math.min(index * 0.05, 0.3)}s`;
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    /**
     * Hero/Welcome Section Animations
     */
    function setupHeroAnimations() {
        const heroElements = document.querySelectorAll(
            '.welcome-section h1, .welcome-section p, ' +
            '.page-title-section h1, .page-title-section p, ' +
            '.brand-text h1'
        );

        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }

    /**
     * Staggered Grid Animations
     */
    function setupStaggeredAnimations() {
        const grids = document.querySelectorAll('.stats-grid, .courses-grid, .videos-grid');
        
        grids.forEach(grid => {
            const items = grid.children;
            
            Array.from(items).forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px) scale(0.98)';
                
                setTimeout(() => {
                    item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0) scale(1)';
                }, 200 + (index * 80));
            });
        });
    }

    /**
     * Smooth Hover Effects
     */
    function setupSmoothHoverEffects() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll(
            '.btn-primary, .btn-continue, .btn-login, .btn-save, ' +
            '.btn-secondary, .btn-outline, .btn-cancel'
        );

        buttons.forEach(button => {
            button.addEventListener('mouseenter', function(e) {
                this.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', function(e) {
                this.style.transform = 'translateY(0)';
            });
        });

        // Card tilt effect on hover (subtle)
        const cards = document.querySelectorAll('.course-card, .stat-card, .video-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    /**
     * Icon Animations (Lucide compatibility)
     */
    function setupIconAnimations() {
        // Initialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Add hover animation to icon buttons
        const iconButtons = document.querySelectorAll('.icon-btn');
        
        iconButtons.forEach(btn => {
            const icon = btn.querySelector('i, svg');
            if (icon) {
                btn.addEventListener('mouseenter', () => {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.transition = 'transform 0.2s ease';
                });
                
                btn.addEventListener('mouseleave', () => {
                    icon.style.transform = 'scale(1)';
                });
            }
        });
    }

    /**
     * Counter Animation - Animate numbers counting up
     */
    window.animateCounter = function(element, target, duration = 1000) {
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
            }
        }
        
        requestAnimationFrame(update);
    };

    /**
     * Progress Bar Animation
     */
    window.animateProgress = function(element, targetPercent, duration = 800) {
        element.style.width = '0%';
        
        setTimeout(() => {
            element.style.transition = `width ${duration}ms ease-out`;
            element.style.width = targetPercent + '%';
        }, 100);
    };

    /**
     * Utility: Add reveal class to dynamically added elements
     */
    window.revealElement = function(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    };

})();
