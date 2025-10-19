document.addEventListener('DOMContentLoaded', () => {
    // Observador para animações de scroll
    const observerOptions = {
        threshold: 0.1
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 150);
            }
        });
    }, observerOptions);

    // Aplicar observadores aos elementos
    document.querySelectorAll('.fade-in').forEach(el => {
        fadeObserver.observe(el);
    });

    document.querySelectorAll('.slide-in').forEach(el => {
        slideObserver.observe(el);
    });

    // Efeito parallax no hero
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.pageYOffset;
            heroSection.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
        });
    }
});