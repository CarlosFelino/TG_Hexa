document.addEventListener("DOMContentLoaded", function () {
    // =========================
    // AUTENTICAÇÃO E DADOS
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    // =========================
    // ELEMENTOS DOM
    // =========================
    // Menu e Sidebar
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".overlay") || createOverlay(); // Cria se não existir

    // Perfil
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const profileAvatar = document.getElementById("userAvatar");
    const profileDropdown = document.querySelector(".dropdown-content");

    // Dashboard Cards
    const cardPendentes = document.getElementById("cardPendentes");
    const cardAndamento = document.getElementById("cardAndamento");
    const cardMinhas = document.getElementById("cardMinhas");
    const cardConcluidas = document.getElementById("cardConcluidas");
    const recentOrdersContainer = document.getElementById("recentOrders");

    // Modal
    const detalhesModal = document.getElementById("detalhesModal");
    const modalContent = document.getElementById("modalContent");
    const modalClose = document.getElementById("modalClose");

    // Cache de dados
    let ordensCache = [];

    // =========================
    // INICIALIZAÇÃO UI
    // =========================
    
    // Preencher Perfil
    if (user) {
        if(userNameEl) userNameEl.textContent = user.nome;
        if(userEmailEl) userEmailEl.textContent = user.email;
        if(welcomeNameEl) welcomeNameEl.textContent = user.nome;
    }

    // Criar overlay se não existir no HTML
    function createOverlay() {
        const div = document.createElement("div");
        div.className = "overlay";
        document.body.appendChild(div);
        return div;
    }

    // =========================
    // LOGICA DE MENU E SIDEBAR (Responsividade)
    // =========================

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
        });

        // Fechar ao clicar no fundo escuro
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }

    // =========================
    // LOGICA DO DROPDOWN (CORRIGIDA)
    // =========================
    if (profileAvatar && profileDropdown) {
        profileAvatar.addEventListener("click", (e) => {
            e.stopPropagation(); // Impede que o clique feche imediatamente
            profileDropdown.classList.toggle("active");
        });

        // Fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!profileDropdown.contains(e.target) && e.target !== profileAvatar) {
                profileDropdown.classList.remove("active");
            }
        });
    }

    // Logout
    document.getElementById("logout")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "../../index.html";
    });

    // =========================
    // CARREGAMENTO DE DADOS (API)
    // =========================
    async function loadDashboardData() {
        try {
            // Simulação de delay para ver loading (opcional)
            // await new Promise(r => setTimeout(r, 500));

            const res = await fetch("/api/ordens", {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("Erro ao buscar ordens");

            const text = await res.text();
            const ordens = JSON.parse(text);
            ordensCache = ordens;

            atualizarCards(ordens);
            renderRecentOrders(ordens);
            verificarAlertas(ordens);

        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            if(recentOrdersContainer) recentOrdersContainer.innerHTML = "<p class='error-msg'>Erro ao carregar dados.</p>";
        }
    }

    function atualizarCards(ordens) {
        // Contagens seguras (verificando se elemento existe)
        if(cardPendentes) cardPendentes.textContent = ordens.filter(o => o.status === "Pendente").length;
        if(cardAndamento) cardAndamento.textContent = ordens.filter(o => o.status === "Em Andamento").length;
        if(cardMinhas) cardMinhas.textContent = ordens.filter(o => o.responsavel_id === user.id).length;
        
        // Filtro de concluídas nos últimos 7 dias (exemplo de lógica mais refinada)
        if(cardConcluidas) {
            cardConcluidas.textContent = ordens.filter(o => o.status === "Concluída").length;
        }
    }

    function renderRecentOrders(ordens) {
        if (!recentOrdersContainer) return;
        recentOrdersContainer.innerHTML = "";

        if (ordens.length === 0) {
            recentOrdersContainer.innerHTML = "<p class='empty-msg'>Nenhuma ordem encontrada.</p>";
            return;
        }

        // Ordenar por data (mais recente primeiro) e pegar 6
        const ordensRecentes = ordens
            .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
            .slice(0, 6);

        ordensRecentes.forEach(order => {
            const orderCard = document.createElement("div");
            // Classe CSS baseada no status (tratamento de string)
            const statusClass = order.status.replace(/\s+/g, "-").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            orderCard.className = `order-card ${statusClass}`;
            orderCard.dataset.id = order.id;

            const responsavel = order.tecnico_nome || order.responsavel_nome || "Não atribuído";
            
            // Conteúdo dinâmico baseado no tipo
            let detalhe = "";
            if (order.tipo_solicitacao === "problema") {
                detalhe = `<p><strong>Equipamento:</strong> ${order.equipamento || "-"} <br> <strong>Problema:</strong> ${order.tipo_problema || "-"}</p>`;
            } else {
                detalhe = `<p><strong>Software:</strong> ${order.app_nome || "-"} <br> <strong>Link:</strong> ${order.app_link ? "Sim" : "Não"}</p>`;
            }

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">${order.codigo || `#${order.id}`}</span>
                    <span class="order-status">${getStatusHTML(order.status)}</span>
                </div>
                <div class="order-body">
                    <h3>${truncateText(order.descricao, 60) || "Sem descrição"}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${new Date(order.data_criacao).toLocaleDateString()}</p>
                    <p><i class="fas fa-user-cog"></i> Resp: ${responsavel}</p>
                    ${detalhe}
                </div>
                <div class="order-actions">
                    ${getButtonsHTML(order)}
                </div>
            `;
            recentOrdersContainer.appendChild(orderCard);
        });

        bindOrderButtons();
    }

    // =========================
    // UTILS DE HTML
    // =========================
    function getStatusHTML(status) {
        const iconMap = {
            "Pendente": "fa-clock",
            "Em Andamento": "fa-spinner fa-spin",
            "Concluída": "fa-check-circle",
            "Não Concluída": "fa-times-circle"
        };
        const icon = iconMap[status] || "fa-circle";
        return `<i class="fas ${icon}"></i> ${status}`;
    }

    function truncateText(text, length) {
        if(!text) return "";
        return text.length > length ? text.substring(0, length) + "..." : text;
    }

    function getButtonsHTML(order) {
        let buttons = "";
        // Botão Assumir (apenas se pendente e sem dono)
        if (order.status === "Pendente" && !order.responsavel_id) {
            buttons += `<button class="btn btn-assign"><i class="fas fa-hand-paper"></i> Assumir</button>`;
        }
        // Botão Concluir (apenas se eu sou o dono e está em andamento)
        if (order.status === "Em Andamento" && order.responsavel_id === user.id) {
            buttons += `<button class="btn btn-finalize"><i class="fas fa-check"></i> Concluir</button>`;
        }
        buttons += `<button class="btn btn-details"><i class="fas fa-eye"></i> Ver</button>`;
        return buttons;
    }

    // =========================
    // AÇÕES (Assumir, Concluir, Detalhes)
    // =========================
    function bindOrderButtons() {
        // Assumir
        document.querySelectorAll(".btn-assign").forEach(btn => {
            btn.addEventListener("click", async function() {
                const card = this.closest(".order-card");
                await updateOrderStatus(card.dataset.id, "accept", null, card);
            });
        });

        // Concluir
        document.querySelectorAll(".btn-finalize").forEach(btn => {
            btn.addEventListener("click", async function() {
                const card = this.closest(".order-card");
                await updateOrderStatus(card.dataset.id, "status", "Concluída", card);
            });
        });

        // Detalhes (Modal)
        document.querySelectorAll(".btn-details").forEach(btn => {
            btn.addEventListener("click", function() {
                const id = this.closest(".order-card").dataset.id;
                openModal(id);
            });
        });
    }

    async function updateOrderStatus(id, action, status, cardElement) {
        try {
            const url = action === "accept" 
                ? `/api/ordens/${id}/accept`
                : `/api/ordens/${id}/status`;
            
            const body = action === "accept" 
                ? { userId: user.id } 
                : { status: status };

            const res = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Falha na operação");

            // Recarregar dados para atualizar UI corretamente
            loadDashboardData();

        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar ordem.");
        }
    }

    // =========================
    // MODAL LÓGICA
    // =========================
    function openModal(id) {
        const order = ordensCache.find(o => o.id == id);
        if(!order) return;

        modalContent.innerHTML = `
            <span class="modal-close" id="modalClose">&times;</span>
            <h2>Detalhes da Ordem #${order.id}</h2>
            <div class="modal-grid">
                <p><strong>Solicitante:</strong> ${order.solicitante || "N/A"}</p>
                <p><strong>Local:</strong> ${order.local_tipo} ${order.local_detalhe}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Descrição Completa:</strong><br> ${order.descricao}</p>
            </div>
        `;
        
        detalhesModal.style.display = "block";

        // Re-bind close button inside dynamic content
        document.getElementById("modalClose").addEventListener("click", () => {
            detalhesModal.style.display = "none";
        });
    }

    // Fechar modal clicando fora
    window.addEventListener("click", (e) => {
        if (e.target === detalhesModal) detalhesModal.style.display = "none";
    });

    // =========================
    // ALERTAS FLUTUANTES
    // =========================
    function verificarAlertas(ordens) {
        const popupVenc = document.getElementById("alertPopupVencimento");
        const bodyVenc = document.getElementById("alertBodyVencimento");
        const closeVenc = document.getElementById("closeVencimento");

        const popupResp = document.getElementById("alertPopupSemResp");
        const bodyResp = document.getElementById("alertBodySemResp");
        const closeResp = document.getElementById("closeSemResp");

        if(!popupVenc || !popupResp) return;

        // Lógica de Vencimento (Exemplo: Ordens criadas há mais de 3 dias e não concluídas)
        const tresDiasAtras = new Date();
        tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

        const atrasadas = ordens.filter(o => 
            new Date(o.data_criacao) < tresDiasAtras && 
            o.status !== "Concluída" && 
            o.status !== "Não Concluída"
        );

        // Lógica de Sem Responsável
        const semResp = ordens.filter(o => !o.responsavel_id && o.status === "Pendente");

        // Mostrar Alerta de Atraso
        if (atrasadas.length > 0) {
            bodyVenc.innerHTML = `<p>Existem <strong>${atrasadas.length}</strong> ordens antigas pendentes.</p>`;
            popupVenc.classList.remove("hidden");
            setTimeout(() => popupVenc.classList.add("active"), 100);
        }

        // Mostrar Alerta de Sem Responsável
        if (semResp.length > 0) {
            bodyResp.innerHTML = `<p>Existem <strong>${semResp.length}</strong> ordens aguardando técnico.</p>`;
            popupResp.classList.remove("hidden");
            setTimeout(() => popupResp.classList.add("active"), 100);
        }

        // Fechar alertas
        closeVenc?.addEventListener("click", () => popupVenc.classList.remove("active"));
        closeResp?.addEventListener("click", () => popupResp.classList.remove("active"));
    }

    // Inicializar
    loadDashboardData();
});