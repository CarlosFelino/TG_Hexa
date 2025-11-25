document.addEventListener('DOMContentLoaded', () => {
    // Configuração do observador com performance otimizada
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay escalonado para melhor performance
                const delay = entry.target.classList.contains('slide-in') ? 
                    Math.min(index * 100, 600) : 0;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                // Para de observar após a animação
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar todos os elementos animados
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in, .advisor-card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Efeito parallax suave (opcional)
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        let ticking = false;
        
        const updateParallax = () => {
            const scrollPosition = window.pageYOffset;
            const parallaxValue = scrollPosition * 0.3;
            heroSection.style.transform = `translateY(${parallaxValue}px)`;
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Fallback para imagens que não carregam
    const handleImageError = (img) => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'image-fallback';
        fallback.innerHTML = `
            <div style="background: var(--gradient); width: 100%; height: 100%; 
                       display: flex; align-items: center; justify-content: center; 
                       color: white; font-size: 0.9rem; border-radius: 8px;">
                Imagem<br>Indisponível
            </div>
        `;
        img.parentNode.insertBefore(fallback, img);
    };

    // Aplicar fallback a todas as imagens
    document.querySelectorAll('.card-image img, .advisor-image img').forEach(img => {
        img.onerror = () => handleImageError(img);
    });
});