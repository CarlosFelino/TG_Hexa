document.addEventListener('DOMContentLoaded', function() {
    // ===================================
    // FUNÇÕES GLOBAIS DE PERFIL E NAVEGAÇÃO
    // ===================================

    // Função para carregar e exibir o nome/email do usuário logado
    function loadUserProfile() {
        const user = JSON.parse(localStorage.getItem("currentUser")) || {};

        const userNameEl = document.getElementById("userName");
        const userEmailEl = document.getElementById("userEmail");

        if (userNameEl) {
             // Usa 'user.nome' conforme confirmado anteriormente
             userNameEl.textContent = user.nome || "Professor";
        }
        if (userEmailEl) {
             userEmailEl.textContent = user.email || "";
        }
        console.log("👤 Perfil do usuário carregado (global).");
    }

    // Função de Logout
    function setupLogout() {
        const logoutBtn = document.getElementById("logout");
        logoutBtn?.addEventListener("click", () => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
            // Redireciona após o logout
            window.location.href = "../../index.html"; 
        });
    }

    // Função de validação de login (Opcional, mas útil)
    function checkAuth() {
        const token = localStorage.getItem("authToken");
        const user = localStorage.getItem("currentUser");

        if (!token || !user) {
            console.warn("Usuário não autenticado. Redirecionando para login.");
            window.location.href = "../../login.html";
            return false;
        }
        return true;
    }

    // ===================================
    // INICIALIZAÇÃO GLOBAL
    // ===================================

    // 1. Validar se o usuário está logado
    if (checkAuth()) {
        // 2. Carregar dados do perfil na barra superior
        loadUserProfile();
        // 3. Configurar o botão de logout
        setupLogout();
    }

    // Observação: Lógica do menu lateral (toggleSidebar) e do dropdown do avatar
    // também podem ser incluídas aqui para serem globais se forem as mesmas em todas as páginas.
});