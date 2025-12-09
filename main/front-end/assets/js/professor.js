document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // 1. Inicialização e Validação
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    // =========================
    // 2. Menu Hambúrguer e Sidebar
    // =========================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    let overlay = document.querySelector('.overlay');

    // Cria overlay se não existir
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // =========================
    // 3. Dropdown do Perfil (Corrigido)
    // =========================
    const profileAvatar = document.querySelector('.profile-avatar');
    const dropdown = document.querySelector('.dropdown-content');

    if (profileAvatar && dropdown) {
        // Alternar ao clicar na foto
        profileAvatar.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique feche o menu imediatamente
            dropdown.classList.toggle('active');
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== profileAvatar) {
                dropdown.classList.remove('active');
            }
        });
    }

    // =========================
    // 4. Preencher Dados do Usuário
    // =========================
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");

    if (user) {
        if(userNameEl) userNameEl.textContent = user.nome;
        if(userEmailEl) userEmailEl.textContent = user.email;
        if(welcomeNameEl) welcomeNameEl.textContent = user.nome;
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
    // 5. Carregar Ordens (Dashboard)
    // =========================
    const recentOrdersEl = document.getElementById("recentOrders");
    const badgePendentesEl = document.getElementById("badgePendentes");

    async function fetchOrdens() {
        if (!recentOrdersEl) return;
        
        try {
            const res = await fetch("/api/minhas-ordens", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) throw new Error("Erro ao buscar dados");

            const ordens = await res.json();
            renderOrdens(ordens);
        } catch (err) {
            console.error(err);
            recentOrdersEl.innerHTML = "<p>Erro ao carregar ordens recentes.</p>";
        }
    }

    function renderOrdens(ordens) {
        if (!recentOrdersEl) return;
        recentOrdersEl.innerHTML = "";

        // Atualiza Badge
        const pendentes = ordens.filter(o => o.status === "Pendente").length;
        if (badgePendentesEl) badgePendentesEl.textContent = pendentes;

        // Pega as 3 últimas
        const ultimas = ordens.slice(0, 3);

        if (ultimas.length === 0) {
            recentOrdersEl.innerHTML = "<p>Nenhuma ordem encontrada.</p>";
            return;
        }

        ultimas.forEach(o => {
            const div = document.createElement("div");
            let statusClass = "";
            
            switch(o.status) {
                case "Pendente": statusClass = "pendente"; break;
                case "Em Andamento": statusClass = "em-andamento"; break;
                case "Concluída": statusClass = "concluida"; break;
                default: statusClass = "";
            }

            const titulo = o.titulo || `${o.tipo_solicitacao} - ${o.local_detalhe || 'Local'}`;
            const descricao = o.descricao || "Sem descrição";

            div.className = `order-card ${statusClass}`;
            div.innerHTML = `
                <h3>${titulo}</h3>
                <p>${descricao}</p>
                <span class="status">${o.status}</span>
                <span class="date">${new Date(o.data_criacao).toLocaleDateString('pt-BR')}</span>
            `;
            recentOrdersEl.appendChild(div);
        });
    }

    fetchOrdens();
});