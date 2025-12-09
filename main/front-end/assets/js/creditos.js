document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de Créditos carregada com sucesso');

    // Função para ajustar responsividade do logo
    function adjustLogoResponsive() {
        const logoText = document.querySelector('.logo-text');
        const logoContainer = document.querySelector('.logo-container');
        const closeBtn = document.querySelector('.close-btn');

        if (window.innerWidth <= 576) {
            // Remove efeitos hover em mobile
            if (logoContainer) {
                logoContainer.style.transition = 'none';
            }

            // Otimiza botão fechar para touch
            if (closeBtn) {
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.touchAction = 'manipulation';
            }
        } else {
            // Restaura efeitos em desktop
            if (logoContainer) {
                logoContainer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        }
    }

    // Executa ao carregar e redimensionar
    window.addEventListener('load', adjustLogoResponsive);
    window.addEventListener('resize', adjustLogoResponsive);

    // Log de performance
    const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                     window.performance.timing.navigationStart;
    console.log(`Página carregada em ${loadTime}ms`);

    // Preload de imagens para melhor experiência
    const images = document.querySelectorAll('.credito-image img');
    images.forEach(img => {
        if (img.complete) {
            console.log(`Imagem pré-carregada: ${img.alt}`);
        }
    });
});