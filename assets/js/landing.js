// Landing page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animate chess board squares on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all cards and sections for animation
    document.querySelectorAll('.framework-card, .feature-card, .comparison-table').forEach(el => {
        animateOnScroll.observe(el);
    });

    // Add floating animation to chess board squares
    const squares = document.querySelectorAll('.square');
    squares.forEach((square, index) => {
        square.style.animationDelay = `${index * 0.1}s`;
        square.style.animation = `fadeIn 0.5s ease-in-out forwards`;
    });

    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop;
    });

    // Framework card hover effects
    document.querySelectorAll('.framework-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Live demo status checking
    const demoButtons = document.querySelectorAll('.framework-actions .btn-primary');

    demoButtons.forEach(button => {
        const href = button.getAttribute('href');
        if (href && href.startsWith('apps/')) {
            // Check if the demo is accessible
            checkDemoStatus(href, button);
        }
    });

    // Add loading states to demo buttons
    function checkDemoStatus(url, button) {
        // Add a small indicator if the service is running
        const indicator = document.createElement('span');
        indicator.className = 'demo-indicator';
        indicator.style.cssText = `
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #10b981;
            margin-right: 6px;
            animation: pulse 2s infinite;
        `;

        button.insertBefore(indicator, button.firstChild);
    }

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-content h2');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };

        // Start typing animation after a short delay
        setTimeout(typeWriter, 500);
    }

    // Parallax effect for hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });

    // Framework comparison table enhancements
    const comparisonTable = document.querySelector('.comparison-table table');
    if (comparisonTable) {
        // Add hover effects to rows
        const rows = comparisonTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--bg-secondary)';
            });

            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });
    }

    // Mobile menu toggle (if needed)
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '☰';
    mobileMenuToggle.style.cssText = `
        display: none;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-primary);
    `;

    // Add mobile menu functionality for small screens
    function handleMobileMenu() {
        const navigation = document.querySelector('.navigation');
        const headerContainer = document.querySelector('.header .container');

        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'block';
            if (!headerContainer.contains(mobileMenuToggle)) {
                headerContainer.appendChild(mobileMenuToggle);
            }

            mobileMenuToggle.addEventListener('click', function() {
                navigation.style.display = navigation.style.display === 'none' ? 'flex' : 'none';
            });
        } else {
            mobileMenuToggle.style.display = 'none';
            navigation.style.display = 'flex';
        }
    }

    // Check on load and resize
    handleMobileMenu();
    window.addEventListener('resize', handleMobileMenu);

    // Add performance monitoring for demo links
    document.querySelectorAll('a[href^="apps/"]').forEach(link => {
        link.addEventListener('click', function(e) {
            // Track demo clicks (could integrate with analytics)
            const framework = this.href.split('/').pop();
            console.log(`Demo clicked: ${framework}`);

            // Could add loading indicator here
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 1000);
        });
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    .animate-in {
        animation: fadeIn 0.6s ease-out forwards;
    }

    .header {
        transition: transform 0.3s ease;
    }

    .framework-card {
        transition: all 0.3s ease;
    }

    .demo-indicator {
        animation: pulse 2s infinite;
    }

    @media (max-width: 768px) {
        .navigation {
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-color);
            padding: 1rem 2rem;
            box-shadow: var(--shadow-md);
        }
    }
`;

document.head.appendChild(style);
