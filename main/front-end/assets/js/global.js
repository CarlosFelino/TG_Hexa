// JavaScript para funcionalidades globais (ex: menu, modals)

document.addEventListener('DOMContentLoaded', () => {
    // Exemplo: Lógica para um menu hamburguer (se aplicável)
    const menuToggle = document.querySelector('.menu-toggle'); // Supondo que você tenha um botão com essa classe
    const navLinks = document.querySelector('.nav-links'); // Supondo que você tenha uma lista de links com essa classe

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Outras lógicas globais podem ser adicionadas aqui
    console.log('Global JS carregado.');
});
