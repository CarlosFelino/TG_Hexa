document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ suporte.js carregado - Versão Atualizada");

    // =========================
    // 1. AUTENTICAÇÃO
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    // Se não estiver logado, manda pro login
    if (!token || !user) {
        if (!window.location.pathname.includes("login.html")) {
            console.warn("Usuário não autenticado.");
            // window.location.href = "../../login.html"; // Descomente em produção
        }
    }

    // =========================
    // 2. MENU LATERAL (HAMBÚRGUER) - Estilo Professor
    // =========================
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    let overlay = document.querySelector(".overlay");

    // Cria overlay se não existir
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "overlay";
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
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
    // 3. MENU DE PERFIL (DROPDOWN) - Estilo Professor
    // =========================
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const profileAvatar = document.getElementById("userAvatar") || document.querySelector(".profile-avatar");
    const profileDropdown = document.querySelector(".profile-dropdown .dropdown-content") || document.querySelector(".dropdown-content");

    // Preencher dados do usuário
    if (user) {
        if(userNameEl) userNameEl.textContent = user.nome;
        if(userEmailEl) userEmailEl.textContent = user.email;
        if(welcomeNameEl) welcomeNameEl.textContent = user.nome;
    }

    if (profileAvatar && profileDropdown) {
        profileAvatar.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("active");
            console.log("👤 Perfil clicado");
        });

        // Fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!profileDropdown.contains(e.target) && e.target !== profileAvatar) {
                profileDropdown.classList.remove("active");
            }
        });
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
    // 4. DASHBOARD - Estilo Professor
    // =========================
    const badgePendentes = document.getElementById("badgePendentes");
    const badgeMinhas = document.getElementById("badgeMinhas");

    // Só roda a lógica de dashboard se estivermos na página do dashboard
    if (badgePendentes) {
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

            // Atualiza badges nos cards de ação
            if(badgePendentes) {
                badgePendentes.textContent = ordens.filter(o => o.status === "Pendente").length;
            }

            if(badgeMinhas) {
                badgeMinhas.textContent = ordens.filter(o => o.responsavel_id === user.id).length;
            }

            // Atualiza lista recente
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

        // Ordena por data e pega as 3 mais recentes
        const ordensRecentes = ordens
            .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
            .slice(0, 3);

        if (ordensRecentes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #d1d5db;"></i>
                    <p>Nenhuma ordem recente encontrada</p>
                </div>
            `;
            return;
        }

        ordensRecentes.forEach(order => {
            const card = document.createElement("div");

            let statusClass = "";
            switch(order.status) {
                case "Pendente": statusClass = "pendente"; break;
                case "Em Andamento": statusClass = "em-andamento"; break;
                case "Concluída": statusClass = "concluida"; break;
                default: statusClass = "";
            }

            const titulo = order.titulo || `${order.tipo_solicitacao} - ${order.local_detalhe || 'Local'}`;
            const descricao = order.descricao || "Sem descrição";

            card.className = `order-card ${statusClass}`;
            card.innerHTML = `
                <h3>${titulo}</h3>
                <p>${descricao}</p>
                <span class="status">${order.status}</span>
                <span class="date">${new Date(order.data_criacao).toLocaleDateString('pt-BR')}</span>
            `;
            container.appendChild(card);
        });
    }

    // =========================
    // 5. MODAL DE DETALHES - Compatibilidade
    // =========================
    const modal = document.getElementById("detalhesModal");
    const modalClose = document.getElementById("modalClose");

    if (modal && modalClose) {
        modalClose.addEventListener("click", () => {
            modal.classList.remove("active");
        });

        // Fechar modal clicando fora
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });
    }


    // =========================
    // 5. POP-UPS DE ALERTAS
    // =========================

    // Elementos dos pop-ups
    const alertPopupVencimento = document.getElementById("alertPopupVencimento");
    const alertBodyVencimento = document.getElementById("alertBodyVencimento");
    const closeVencimento = document.getElementById("closeVencimento");

    const alertPopupSemResp = document.getElementById("alertPopupSemResp");
    const alertBodySemResp = document.getElementById("alertBodySemResp");
    const closeSemResp = document.getElementById("closeSemResp");

    // Botões de fechar
    if (closeVencimento) {
        closeVencimento.addEventListener("click", () => {
            alertPopupVencimento.classList.add("hidden");
            alertPopupVencimento.classList.remove("active");
        });
    }

    if (closeSemResp) {
        closeSemResp.addEventListener("click", () => {
            alertPopupSemResp.classList.add("hidden");
            alertPopupSemResp.classList.remove("active");
        });
    }

    // ✅ FUNÇÃO PRINCIPAL: Carregar e exibir alertas
    async function carregarAlertas() {
        try {
            const res = await fetch("/api/ordens/alertas/ativos", {
                headers: { Authorization: "Bearer " + token }
            });

            if (!res.ok) {
                console.error("Erro ao buscar alertas:", res.status);
                return;
            }

            const alertas = await res.json();
            console.log("📢 Alertas recebidos:", alertas);

            // ============================================
            // POP-UP 1: Ordens próximas do vencimento
            // ============================================
            if (alertas.prazo && alertas.prazo.length > 0) {
                alertBodyVencimento.innerHTML = alertas.prazo.map(ordem => `
                    <div class="alert-item priority-${ordem.prioridade}">
                        <div class="alert-icon-wrap">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="alert-content">
                            <strong>${ordem.codigo}</strong>
                            <p>${ordem.titulo}</p>
                            <small>Vence em: ${formatarData(ordem.data_limite)}</small>
                            <span class="badge priority-${ordem.prioridade}">Prioridade ${ordem.prioridade}</span>
                        </div>
                        <a href="ordens/listar-ordens.html?id=${ordem.id}" class="alert-action">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                `).join('');

                alertPopupVencimento.classList.remove("hidden");
                setTimeout(() => alertPopupVencimento.classList.add("active"), 100);
            } else {
                alertPopupVencimento.classList.add("hidden");
                alertPopupVencimento.classList.remove("active");
            }

            // ============================================
            // POP-UP 2: Ordens sem responsável (>2 dias)
            // ============================================
            if (alertas.sem_responsavel && alertas.sem_responsavel.length > 0) {
                alertBodySemResp.innerHTML = alertas.sem_responsavel.map(ordem => `
                    <div class="alert-item priority-${ordem.prioridade}">
                        <div class="alert-icon-wrap">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <div class="alert-content">
                            <strong>${ordem.codigo}</strong>
                            <p>${ordem.titulo}</p>
                            <small>Status: ${ordem.status}</small>
                            <span class="badge priority-${ordem.prioridade}">Prioridade ${ordem.prioridade}</span>
                        </div>
                        <a href="ordens/listar-ordens.html?id=${ordem.id}" class="alert-action">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                `).join('');

                alertPopupSemResp.classList.remove("hidden");
                setTimeout(() => alertPopupSemResp.classList.add("active"), 100);
            } else {
                alertPopupSemResp.classList.add("hidden");
                alertPopupSemResp.classList.remove("active");
            }

        } catch (err) {
            console.error("Erro ao carregar alertas:", err);
        }
    }

    // ✅ Função auxiliar: Formatar data
    function formatarData(data) {
        if (!data) return "N/A";
        const d = new Date(data);
        return d.toLocaleDateString("pt-BR");
    }

    // ✅ Carregar alertas ao abrir a página (apenas para suporte)
    if (user && user.role === "suporte" && alertPopupVencimento && alertPopupSemResp) {
        carregarAlertas();

        // ✅ Recarregar alertas a cada 30 segundos (atualização automática)
        setInterval(carregarAlertas, 30000);
    }
});