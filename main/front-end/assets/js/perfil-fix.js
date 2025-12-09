// perfil-fix.js - Correção para dropdown do perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔧 perfil-fix.js carregado");

    const profileAvatar = document.querySelector(".profile-avatar");
    const dropdown = document.querySelector(".dropdown-content");

    if (profileAvatar && dropdown) {
        // Remove todos os event listeners existentes
        const newAvatar = profileAvatar.cloneNode(true);
        profileAvatar.parentNode.replaceChild(newAvatar, profileAvatar);

        // Adiciona um listener simples
        newAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target) && e.target !== newAvatar) {
                dropdown.style.display = 'none';
            }
        });

        console.log("✅ Dropdown do perfil corrigido");
    }
});