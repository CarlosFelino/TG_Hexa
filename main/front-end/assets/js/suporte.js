document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ suporte.js carregado");

    // =========================
    // 1. AUTENTICAÇÃO
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    // Se não estiver logado, manda pro login
    if (!token || !user) {
        // Verificação para evitar loop de redirecionamento se já estiver no login
        if (!window.location.pathname.includes("login.html")) {
            console.warn("Usuário não autenticado.");
            // window.location.href = "../../login.html"; // Descomente em produção
        }
    }

    // =========================
    // 2. MENU LATERAL (HAMBÚRGUER)
    // =========================
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    let overlay = document.querySelector(".overlay");

    // Cria overlay se não existir (garantia para páginas internas)
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "overlay";
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebar) {
        // Remove event listeners antigos clonando o elemento (truque para limpar)
        const newMenuToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);

        newMenuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
            console.log("🍔 Menu toggle clicado");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }

    // =========================
    // 3. MENU DE PERFIL (DROPDOWN)
    // =========================
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const profileAvatar = document.getElementById("userAvatar") || document.querySelector(".profile-avatar");
    
    // Tenta encontrar o dropdown de várias formas para garantir
    const profileDropdown = document.querySelector(".profile-dropdown .dropdown-content") || document.querySelector(".dropdown-content");

    // Preencher dados do usuário na Navbar
    if (user) {
        if(userNameEl) userNameEl.textContent = user.nome;
        if(userEmailEl) userEmailEl.textContent = user.email;
    }

    if (profileAvatar && profileDropdown) {
        // Limpa eventos antigos
        const newAvatar = profileAvatar.cloneNode(true);
        profileAvatar.parentNode.replaceChild(newAvatar, profileAvatar);

        newAvatar.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("active");
            // Fallback caso o CSS use display:block em vez de .active
            profileDropdown.style.display = profileDropdown.classList.contains("active") ? "block" : "none";
            console.log("👤 Perfil clicado");
        });

        // Fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!profileDropdown.contains(e.target) && e.target !== newAvatar) {
                profileDropdown.classList.remove("active");
                profileDropdown.style.display = "none";
            }
        });
    } else {
        console.warn("⚠️ Elementos de perfil não encontrados nesta página.");
    }

    // Logout
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
            window.location.href = "../../index.html";
        });
    }

    // =========================
    // 4. DASHBOARD (Somente se existirem os cards)
    // =========================
    const cardPendentes = document.getElementById("cardPendentes");
    
    // Só roda a lógica de dashboard se encontrarmos um elemento chave (ex: cardPendentes)
    if (cardPendentes) {
        loadDashboardData();
    }

    async function loadDashboardData() {
        try {
            const res = await fetch("/api/ordens", {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("Erro ao buscar dados");

            const text = await res.text();
            const ordens = JSON.parse(text);

            // Atualiza cards
            if(cardPendentes) cardPendentes.textContent = ordens.filter(o => o.status === "Pendente").length;
            
            const cardAndamento = document.getElementById("cardAndamento");
            if(cardAndamento) cardAndamento.textContent = ordens.filter(o => o.status === "Em Andamento").length;
            
            const cardMinhas = document.getElementById("cardMinhas");
            if(cardMinhas) cardMinhas.textContent = ordens.filter(o => o.responsavel_id === user.id).length;
            
            const cardConcluidas = document.getElementById("cardConcluidas");
            if(cardConcluidas) cardConcluidas.textContent = ordens.filter(o => o.status === "Concluída").length;

            // Atualiza lista recente se existir
            const recentOrdersContainer = document.getElementById("recentOrders");
            if(recentOrdersContainer) {
                renderRecentOrders(ordens, recentOrdersContainer);
            }

        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
        }
    }

    function renderRecentOrders(ordens, container) {
        container.innerHTML = "";
        const ordensRecentes = ordens.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao)).slice(0, 3);

        if (ordensRecentes.length === 0) {
            container.innerHTML = "<p>Nenhuma ordem recente.</p>";
            return;
        }

        ordensRecentes.forEach(order => {
            // Lógica de renderização simplificada para não quebrar
            const card = document.createElement("div");
            card.className = "order-card";
            card.innerHTML = `
                <h3>#${order.codigo || order.id} - ${order.titulo || 'Sem título'}</h3>
                <p>${order.status}</p>
            `;
            container.appendChild(card);
        });
    }
});