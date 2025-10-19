document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Elementos do DOM
    // =========================
    const ordersList = document.getElementById('orders-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-orders');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const applyDatesBtn = document.getElementById('apply-dates');
    const modal = document.getElementById('order-details-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');

    const badgePendentesEl = document.getElementById('badgePendentes');
    const badgeAndamentoEl = document.getElementById('badgeAndamento');

    const token = localStorage.getItem("authToken");
    if (!token) {
        window.location.href = "../../login.html";
        return;
    }

    // Filtros ativos
    let activeFilters = { status: 'all', search: '', dateFrom: null, dateTo: null };
    let ordersData = [];

    // =========================
    // Buscar ordens do backend
    // =========================
    async function fetchUserOrders() {
        try {
            const res = await fetch("/api/minhas-ordens", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao carregar ordens");
            const ordens = await res.json();

            // Mapear campos para o frontend
            ordersData = ordens.map(o => ({
                id: o.codigo,
                date: o.data_criacao,
                room: o.local_detalhe,
                equipment: o.equipamento,
                status: o.status,
                title: `${o.tipo_solicitacao} - ${o.local_detalhe}`,
                description: o.descricao || o.app_nome || '',
                type: o.tipo_problema || 'N/A',
                technician: o.tecnico_nome || 'Não atribuído',
                evaluation: o.avaliacao || null
            }));

            updateBadges();
            renderOrders(ordersData);

        } catch (err) {
            console.error(err);
            ordersList.innerHTML = `<p>Erro ao carregar ordens.</p>`;
        }
    }

    // =========================
    // Atualizar badges Pendentes / Em Andamento
    // =========================
    function updateBadges() {
        const pendentes = ordersData.filter(o => o.status === 'pending').length;
        const andamento = ordersData.filter(o => o.status === 'in-progress').length;

        if (badgePendentesEl) badgePendentesEl.textContent = pendentes;
        if (badgeAndamentoEl) badgeAndamentoEl.textContent = andamento;
    }

    // =========================
    // Inicialização
    // =========================
    async function init() {
        await fetchUserOrders();
        setupEventListeners();
    }

    // =========================
    // Configurar event listeners
    // =========================
    function setupEventListeners() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters.status = btn.dataset.status;
                applyFilters();
            });
        });

        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });

        applyDatesBtn.addEventListener('click', () => {
            activeFilters.dateFrom = dateFromInput.value;
            activeFilters.dateTo = dateToInput.value;
            applyFilters();
        });

        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => modal.classList.remove('active'));
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // =========================
    // Aplicar filtros
    // =========================
    function applyFilters() {
        let filteredOrders = [...ordersData];

        if (activeFilters.status !== 'all') {
            filteredOrders = filteredOrders.filter(o => o.status === activeFilters.status);
        }

        if (activeFilters.search) {
            filteredOrders = filteredOrders.filter(o =>
                o.title.toLowerCase().includes(activeFilters.search) ||
                o.description.toLowerCase().includes(activeFilters.search) ||
                o.room.toLowerCase().includes(activeFilters.search) ||
                o.type.toLowerCase().includes(activeFilters.search)
            );
        }

        if (activeFilters.dateFrom) {
            filteredOrders = filteredOrders.filter(o => new Date(o.date) >= new Date(activeFilters.dateFrom));
        }
        if (activeFilters.dateTo) {
            filteredOrders = filteredOrders.filter(o => new Date(o.date) <= new Date(activeFilters.dateTo + 'T23:59:59'));
        }

        renderOrders(filteredOrders);
    }

    // =========================
    // Renderizar ordens
    // =========================
    function renderOrders(orders) {
        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhuma ordem encontrada com os filtros atuais</p>
                </div>
            `;
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card ${order.status}`;
            orderCard.dataset.id = order.id;

            let statusText = '', statusIcon = '';
            switch(order.status){
                case 'pending': statusText='Pendente'; statusIcon='fa-clock'; break;
                case 'in-progress': statusText='Em Andamento'; statusIcon='fa-spinner'; break;
                case 'completed': statusText='Concluída'; statusIcon='fa-check-circle'; break;
                case 'not-completed': statusText='Não Concluída'; statusIcon='fa-times-circle'; break;
            }

            const formattedDate = new Date(order.date).toLocaleDateString('pt-BR');
            const evaluationBadge = order.evaluation !== null ? `<span><i class="fas fa-star"></i> Avaliação: ${order.evaluation}/5</span>` : '';

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${formattedDate}</span>
                    <span class="order-status ${order.status}"><i class="fas ${statusIcon}"></i> ${statusText}</span>
                </div>
                <div class="order-content">
                    <h3>${order.title}</h3>
                    <p class="order-description">${order.description}</p>
                    <div class="order-meta">
                        <span><i class="fas fa-tag"></i> ${order.type}</span>
                        <span><i class="fas fa-user-cog"></i> Técnico: ${order.technician}</span>
                        ${evaluationBadge}
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-small btn-view"><i class="fas fa-eye"></i> Detalhes</button>
                    ${order.status === 'in-progress' ? '<button class="btn btn-small btn-msg"><i class="fas fa-comment"></i> Mensagem</button>' : ''}
                    ${order.status === 'completed' && !order.evaluation ? '<button class="btn btn-small btn-feedback"><i class="fas fa-star"></i> Avaliar</button>' : ''}
                    ${order.status === 'not-completed' ? '<button class="btn btn-small btn-reopen"><i class="fas fa-redo"></i> Reabrir</button>' : ''}
                </div>
            `;
            ordersList.appendChild(orderCard);
        });

        // Botões de detalhes
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('.order-card').dataset.id;
                showOrderDetails(orderId);
            });
        });
    }

    // =========================
    // Mostrar detalhes no modal
    // =========================
    function showOrderDetails(orderId) {
        const order = ordersData.find(o => o.id === orderId);
        if (!order) return;

        const formattedDate = new Date(order.date).toLocaleDateString('pt-BR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        let statusClass='', statusText='';
        switch(order.status){
            case 'pending': statusClass='pending'; statusText='Pendente'; break;
            case 'in-progress': statusClass='in-progress'; statusText='Em Andamento'; break;
            case 'completed': statusClass='completed'; statusText='Concluída'; break;
            case 'not-completed': statusClass='not-completed'; statusText='Não Concluída'; break;
        }

        document.getElementById('modal-order-details').innerHTML = `
            <div class="detail-row"><span class="detail-label">Número da Ordem:</span><span class="detail-value">${order.id}</span></div>
            <div class="detail-row"><span class="detail-label">Data:</span><span class="detail-value">${formattedDate}</span></div>
            <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value status-badge ${statusClass}">${statusText}</span></div>
            <div class="detail-row"><span class="detail-label">Local:</span><span class="detail-value">${order.title}</span></div>
            <div class="detail-row"><span class="detail-label">Tipo:</span><span class="detail-value">${order.type}</span></div>
            <div class="detail-row"><span class="detail-label">Técnico Responsável:</span><span class="detail-value">${order.technician}</span></div>
            <div class="detail-row full-width"><span class="detail-label">Descrição:</span><p class="detail-value">${order.description}</p></div>
            ${order.evaluation ? `<div class="detail-row"><span class="detail-label">Avaliação:</span><span class="detail-value">${Array.from({length:5},(_,i)=>`<i class="fas fa-star ${i<order.evaluation?'filled':''}"></i>`).join('')}</span></div>` : ''}
        `;

        modal.classList.add('active');
    }

    // =========================
    // Inicializar app
    // =========================
    init();
});
