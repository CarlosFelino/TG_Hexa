// Efeito de digitação no subtítulo
document.addEventListener('DOMContentLoaded', () => {
    const subtitle = document.querySelector('.subtitle');
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.borderRight = '2px solid var(--accent)';
    
    let i = 0;
    const typingEffect = setInterval(() => {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
            subtitle.style.borderRight = 'none';
        }
    }, 50);
});