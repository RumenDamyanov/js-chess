/**
 * Landing page JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add visual animations and interactions
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe framework cards for animation
    const frameworkCards = document.querySelectorAll('.framework-card');
    frameworkCards.forEach(card => {
        observer.observe(card);
    });

    // Observe feature cards for animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });

    // Add hover effects to framework icons
    const frameworkIcons = document.querySelectorAll('.framework-icon');
    frameworkIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
        });

        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Floating animation for hero icons
    const floatingIcons = document.querySelectorAll('.floating-icons .icon');
    floatingIcons.forEach((icon, index) => {
        // Add staggered floating animation
        icon.style.animationDelay = `${index * 0.5}s`;
        icon.classList.add('floating');
    });

    // Framework stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number');
    const animateCounter = (element, target) => {
        const increment = target / 50;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 30);
    };

    // Start counter animation when stats come into view
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.textContent);
                animateCounter(entry.target, target);
                statsObserver.unobserve(entry.target);
            }
        });
    });

    statNumbers.forEach(stat => {
        statsObserver.observe(stat);
    });

    // Add loading animation for demo buttons
    const demoButtons = document.querySelectorAll('.btn-primary');
    demoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;

            // Reset after a short delay (since it's just navigation)
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 1000);
        });
    });

    console.log('🏁 JS Chess Landing Page Loaded');
});
