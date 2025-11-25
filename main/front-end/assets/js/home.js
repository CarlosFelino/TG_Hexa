// Efeito de digitação no subtítulo
document.addEventListener('DOMContentLoaded', () => {
    const subtitle = document.querySelector('.subtitle');
    if (!subtitle) return;
    
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.borderRight = '2px solid var(--accent)';
    subtitle.style.display = 'inline-block';
    subtitle.style.minHeight = '1.5em';
    
    let i = 0;
    const typingEffect = setInterval(() => {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
            // Mantém o cursor piscando por mais 2 segundos depois de terminar
            setTimeout(() => {
                subtitle.style.borderRight = 'none';
            }, 2000);
        }
    }, 50);
});

// Garante que não há scroll
window.addEventListener('load', () => {
    document.body.style.overflow = 'hidden';
});