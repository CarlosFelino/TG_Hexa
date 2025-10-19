document.addEventListener('DOMContentLoaded', function() {
    // -------------------
    // Autenticação
    // -------------------
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user) {
        window.location.href = "../../login.html";
        return;
    }

    // -------------------
    // Elementos DOM
    // -------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const cardPendentes = document.getElementById("cardPendentes");
    const cardAndamento = document.getElementById("cardAndamento");
    const cardMinhas = document.getElementById("cardMinhas");
    const cardConcluidas = document.getElementById("cardConcluidas");
    const recentOrdersContainer = document.getElementById('recentOrders');

    // Filtros
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroBusca = document.getElementById('filtroBusca');
    const filtroData = document.getElementById('filtroData');

    // Modal de detalhes
    const detalhesModal = document.getElementById('detalhesModal');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.getElementById('modalClose');

    // -------------------
    // Menu lateral
    // -------------------
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // -------------------
    // Preencher dados do usuário
    // -------------------
    userNameEl.textContent = user.nome;
    userEmailEl.textContent = user.email;
    welcomeNameEl.textContent = user.nome;

    // -------------------
    // Dropdown do perfil
    // -------------------
    let dropdownVisible = false;
    const profileDropdown = document.querySelector('.profile-dropdown .dropdown-content');
    const profileAvatar = document.getElementById("userAvatar");

    profileAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownVisible = !dropdownVisible;
        profileDropdown.style.display = dropdownVisible ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        if (dropdownVisible) {
            profileDropdown.style.display = 'none';
            dropdownVisible = false;
        }
    });

    // -------------------
    // Logout
    // -------------------
    document.getElementById("logout")?.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
    });

    // -------------------
    // Carregar dados do dashboard
    // -------------------
    let ordensCache = [];

    async function loadDashboardData() {
        try {
            const res = await fetch("/api/ordens/suporte", {
                headers: { "Authorization": "Bearer " + token }
            });

            const text = await res.text();
            console.log("=== Carregar Ordens ===");
            console.log("Status:", res.status);
            console.log("Resposta:", text);

            const ordens = JSON.parse(text);
            ordensCache = ordens;

            atualizarCards(ordens);
            renderRecentOrders(ordens);

        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
        }
    }

    function atualizarCards(ordens) {
        cardPendentes.textContent = ordens.filter(o => o.status === "Aberta").length;
        cardAndamento.textContent = ordens.filter(o => o.status === "Em Andamento").length;
        cardMinhas.textContent = ordens.filter(o => o.responsavel_id === user.id).length;
        cardConcluidas.textContent = ordens.filter(o => o.status === "Finalizada").length;
    }
 // mudança feita por vitoria
    function renderRecentOrders(ordens) {
        if (!recentOrdersContainer) return;
        recentOrdersContainer.innerHTML = "";

        if (ordens.length === 0) {
            recentOrdersContainer.innerHTML = "<p>Nenhuma ordem encontrada.</p>";
            return;
        }

        // Ordena as ordens pela data de criação mais recente e pega só 3
        const ordensRecentes = ordens
            .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
            .slice(0, 3);

        ordensRecentes.forEach(order => {
            const orderCard = document.createElement('div');
            const statusClass = order.status.replace(/\s/g, '-').toLowerCase();
            orderCard.className = `order-card ${statusClass}`;
            orderCard.dataset.id = order.id;

            const assignedInfo = order.responsavel_id 
                ? `<span><i class="fas fa-user-cog"></i> Responsável: ${order.responsavel_nome || 'Suporte'}</span>` 
                : '';

            const detalheProblema = order.tipo_solicitacao === 'problema' 
                ? `<p><strong>Equipamento:</strong> ${order.equipamento || '-'} | <strong>Problema:</strong> ${order.tipo_problema || '-'}</p>` 
                : '';

            const detalheInstalacao = order.tipo_solicitacao === 'instalacao' 
                ? `<p><strong>App:</strong> ${order.app_nome || '-'} | <strong>Versão:</strong> ${order.app_versao || '-'} | <strong>Link:</strong> ${order.app_link || '-'}</p>` 
                : '';

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-status ${statusClass}">${getStatusHTML(order.status)}</span>
                </div>
                <div class="order-body">
                    <h3>${order.descricao}</h3>
                    <p>Data: ${new Date(order.data_criacao).toLocaleString()}</p>
                    ${assignedInfo}
                    ${detalheProblema}
                    ${detalheInstalacao}
                </div>
                <div class="order-footer">
                    ${getButtonsHTML(order)}
                </div>
            `;
            recentOrdersContainer.appendChild(orderCard);
        });

        bindOrderButtons();
    }

 // fim da mudancça feita por vitoria
        });

        bindOrderButtons();
    }
 // mudança feita por vitoria
    function getStatusHTML(status) {
        switch (status) {
            case "Pendente": 
                return '<i class="fas fa-clock"></i> Pendente';
            case "Em Andamento": 
                return '<i class="fas fa-spinner"></i> Em Andamento';
            case "Concluída": 
                return '<i class="fas fa-check-circle"></i> Concluída';
            case "Não Concluída": 
                return '<i class="fas fa-times-circle"></i> Não Concluída';
            default: 
                return '<i class="fas fa-question"></i> Desconhecido';
        }
    }
// fim da mudança feita por vitoria


    function getButtonsHTML(order) {
        let buttons = "";

        if (order.status === "Aberta" && !order.responsavel_id) {
            buttons += `<button class="btn btn-assign"><i class="fas fa-user-plus"></i> Assumir</button>`;
        }

        if (order.status === "Em Andamento" && order.responsavel_id === user.id) {
            buttons += `<button class="btn btn-finalize"><i class="fas fa-check"></i> Finalizar</button>`;
        }

        buttons += `<button class="btn btn-details"><i class="fas fa-eye"></i> Detalhes</button>`;
        return buttons;
    }

    function bindOrderButtons() {
        // -------------------
        // Assumir ordem
        // -------------------
        document.querySelectorAll('.btn-assign').forEach(btn => {
            btn.addEventListener('click', async function() {
                const orderCard = this.closest('.order-card');
                const orderId = orderCard.dataset.id;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

                try {
                    const res = await fetch(`/api/ordens/${orderId}/accept`, {
                        method: 'PATCH',
                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId: user.id })
                    });

                    const data = await res.json();
                    console.log("=== Assumir Ordem ===");
                    console.log("Status:", res.status);
                    console.log("Resposta:", data);

                    if (!res.ok) throw new Error("Falha ao assumir ordem");

                    // Remove classes antigas e adiciona nova
                    orderCard.classList.remove("aberta", "em-andamento", "finalizada");
                    orderCard.classList.add("em-andamento");

                    const statusEl = orderCard.querySelector(".order-status");
                    if (statusEl) statusEl.innerHTML = getStatusHTML("Em Andamento");

                    // Responsável
                    const bodyEl = orderCard.querySelector(".order-body");
                    if (bodyEl) {
                        const span = document.createElement("span");
                        const icon = document.createElement("i");
                        icon.className = "fas fa-user-cog";
                        span.appendChild(icon);
                        span.appendChild(document.createTextNode(` Responsável: ${user.nome}`));
                        bodyEl.appendChild(span);
                    }

                    this.remove();

                } catch(err) {
                    console.error(err);
                    alert("Não foi possível assumir a ordem.");
                    this.innerHTML = '<i class="fas fa-user-plus"></i> Assumir';
                }
            });
        });

        // -------------------
        // Finalizar ordem
        // -------------------
        document.querySelectorAll('.btn-finalize').forEach(btn => {
            btn.addEventListener('click', async function() {
                const orderCard = this.closest('.order-card');
                const orderId = orderCard.dataset.id;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';

                try {
                    const res = await fetch(`/api/ordens/${orderId}/status`, {
                        method: 'PATCH',
                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ status: "Finalizada" })
                    });

                    const data = await res.json();
                    console.log("=== Finalizar Ordem ===");
                    console.log("Status:", res.status);
                    console.log("Resposta:", data);

                    if (!res.ok) throw new Error("Falha ao finalizar ordem");

                    orderCard.classList.remove("aberta", "em-andamento", "finalizada");
                    orderCard.classList.add("finalizada");

                    const statusEl = orderCard.querySelector(".order-status");
                    if (statusEl) statusEl.innerHTML = getStatusHTML("Finalizada");

                    this.remove();
                } catch(err) {
                    console.error(err);
                    alert("Não foi possível finalizar a ordem.");
                    this.innerHTML = '<i class="fas fa-check"></i> Finalizar';
                }
            });
        });

        // -------------------
        // Detalhes
        // -------------------
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.closest('.order-card').dataset.id;
                const order = ordensCache.find(o => o.id == orderId);
                if (!order) return;

                modalContent.innerHTML = `
                    <h3>Ordem #${order.id}</h3>
                    <p><strong>Descrição:</strong> ${order.descricao}</p>
                    <p><strong>Status:</strong> ${getStatusHTML(order.status)}</p>
                    <p><strong>Tipo:</strong> ${order.tipo_solicitacao}</p>
                    <p><strong>Local:</strong> ${order.local_tipo} - ${order.local_detalhe || '-'}</p>
                    <p><strong>Responsável:</strong> ${order.responsavel_nome || '-'}</p>
                    ${order.tipo_solicitacao === 'problema' ? `<p><strong>Equipamento:</strong> ${order.equipamento || '-'} | <strong>Problema:</strong> ${order.tipo_problema || '-'}</p>` : ''}
                    ${order.tipo_solicitacao === 'instalacao' ? `<p><strong>App:</strong> ${order.app_nome || '-'} | <strong>Versão:</strong> ${order.app_versao || '-'} | <strong>Link:</strong> ${order.app_link || '-'}</p>` : ''}
                `;
                detalhesModal.style.display = 'block';
            });
        });
    }

    // -------------------
    // Fechar modal
    // -------------------
    modalClose?.addEventListener('click', () => {
        detalhesModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === detalhesModal) {
            detalhesModal.style.display = 'none';
        }
    });

    // -------------------
    // Filtros
    // -------------------
    filtroStatus?.addEventListener('change', aplicarFiltros);
    filtroBusca?.addEventListener('input', aplicarFiltros);
    filtroData?.addEventListener('change', aplicarFiltros);

    function aplicarFiltros() {
        let filtered = [...ordensCache];
        const status = filtroStatus?.value;
        const busca = filtroBusca?.value.toLowerCase();
        const data = filtroData?.value;

        if (status && status !== 'Todos') filtered = filtered.filter(o => o.status === status);
        if (busca) filtered = filtered.filter(o => o.descricao.toLowerCase().includes(busca));
        if (data) filtered = filtered.filter(o => new Date(o.data_criacao).toISOString().slice(0,10) === data);

        renderRecentOrders(filtered);
    }
    // -------------------
    // Inicialização
    // -------------------
    loadDashboardData();
});
