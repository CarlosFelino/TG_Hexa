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

    const pendingOrdersEl = document.getElementById('pendingOrders');
    const inProgressOrdersEl = document.getElementById('inProgressOrders');

    // ===================================
    // 🛑 CORREÇÃO ESSENCIAL: DEFINIÇÃO DE VARIÁVEIS
    // ===================================
    const API_URL = "https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev/";
    const token = localStorage.getItem("authToken");

    function loadUserProfile() {
        const user = JSON.parse(localStorage.getItem("currentUser")) || {};

        const userNameEl = document.getElementById("userName");
        const userEmailEl = document.getElementById("userEmail");

        if (userNameEl) {
            // 🛑 CORREÇÃO: Mudar de user.name para user.nome
            userNameEl.textContent = user.nome || "Professor"; 
        }
        if (userEmailEl) {
            // Manter user.email
            userEmailEl.textContent = user.email || "";
        }
    }

    // =========================
    // Mapeamento de status
    // =========================
    const statusMap = {
        'pending': 'Pendente',
        'in-progress': 'Em Andamento',
        'completed': 'Concluída',
    };

    let activeFilters = { status: 'all', search: '', dateFrom: null, dateTo: null };
    let ordersData = [];

    // =========================
    // Buscar ordens do backend
    // =========================
    // =========================
    // Buscar ordens do backend
    // =========================
    async function fetchUserOrders() {
        ordersList.innerHTML = `<p class="loading-message">Carregando ordens...</p>`;

        // 🛑 CORREÇÃO: Usar API_URL
        const endpoint = `${API_URL}/api/minhas-ordens`;
        console.log("🔍 Buscando ordens em:", endpoint);

        try {
            const res = await fetch(endpoint, {
                headers: {
                    // O token deve ser verificado, mas o fetch continua se não existir (para testar o 401)
                    "Authorization": `Bearer ${token}`, 
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                // Se a falha for 401 (Não Autorizado), logamos explicitamente
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Falha de Autorização (${res.status}). O token pode ser inválido ou expirou.`);
                }
                throw new Error(`Falha ao carregar ordens. Status: ${res.status} ${res.statusText}`);
            }

            // ... (Resto do código de tratamento de texto e JSON, que está robusto) ...
            const text = await res.text();

            if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
                throw new Error("O servidor retornou HTML em vez de JSON. Verifique se a URL da API está correta ou se o token expirou.");
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                console.error("❌ Erro ao converter JSON:", parseErr);
                ordersList.innerHTML = `<p>Erro ao processar dados da resposta do servidor.</p>`;
                return;
            }

            const ordens = Array.isArray(data) ? data : data.ordens;

            if (!Array.isArray(ordens)) {
                console.error("⚠️ Estrutura inesperada de resposta:", data);
                ordersList.innerHTML = `<p>Resposta inesperada do servidor. Nenhuma ordem encontrada.</p>`;
                return;
            }

            // Mapeia os dados das ordens (mantido)
            ordersData = ordens.map(o => ({
                id: o.id,
                codigo: o.codigo,
                date: o.data_criacao || o.data || "",
                room: o.local_detalhe || o.local || "",
                equipment: o.equipamento || "",
                // 🛑 CORREÇÃO: Mapear o status do backend para o português aqui (se necessário)
                // Usando o status diretamente do backend para evitar inconsistências, mas vamos mapear
                status: statusMap[o.status] || o.status || "Desconhecido", // Usa o mapeamento
                title: o.titulo || `${o.tipo_solicitacao || "Solicitação"} - ${o.local_detalhe || "Local não informado"}`,
                description: o.descricao || o.app_nome || "Sem descrição",
                type: o.tipo_problema || (o.tipo_solicitacao === "instalacao" ? "Instalação" : "N/A"),
                technician: o.tecnico_nome || "Não atribuído",
                evaluation: o.avaliacao ?? null
            }));

            console.log("✅ Ordens carregadas:", ordersData.length);
            updateBadges();
            applyFilters();

        } catch (err) {
            console.error("❌ Erro ao buscar ordens:", err.message); // Logamos a mensagem
            ordersList.innerHTML = `
                <p>Erro ao carregar ordens. Verifique o console para mais detalhes.</p>
                <p><small>Detalhe: ${err.message}</small></p>
            `;
        }
    }

    // =========================
    // Atualizar stats (Badges)
    // =========================
    function updateBadges() {
        const total = ordersData.length;
        const pendentes = ordersData.filter(o => o.status === 'Pendente').length;
        const andamento = ordersData.filter(o => o.status === 'Em Andamento').length;
        const concluidas = ordersData.filter(o => o.status === 'Concluída').length;

        if (document.getElementById('totalOrders')) document.getElementById('totalOrders').textContent = total;
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendentes;
        if (inProgressOrdersEl) inProgressOrdersEl.textContent = andamento;
        if (document.getElementById('completedOrders')) document.getElementById('completedOrders').textContent = concluidas;
    }

    // =========================
    // Inicialização
    // =========================
    // =========================
    // Inicialização
    // =========================
    async function init() {
        // 🛑 ADICIONE ESTA LINHA:
        loadUserProfile(); 

        // O restante do código de inicialização
        await fetchUserOrders();
        setupEventListeners();
    }

    // ...
    init();

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
          btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
          });
        });

        // Permite fechar clicando fora do conteúdo
        document.querySelectorAll('.modal').forEach(m => {
          m.addEventListener('click', e => {
            if (e.target === m) m.classList.remove('active');
          });
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
            const requiredStatus = statusMap[activeFilters.status];
            if (requiredStatus) {
                filteredOrders = filteredOrders.filter(o => o.status === requiredStatus);
            }
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
            orderCard.className = `order-card ${order.status.replace(/\s+/g, '-').toLowerCase()}`;
            orderCard.dataset.id = order.id;

            let statusText = '', statusIcon = '';
            switch(order.status){
                case 'Pendente': statusText='Pendente'; statusIcon='fa-clock'; break;
                case 'Em Andamento': statusText='Em Andamento'; statusIcon='fa-spinner'; break;
                case 'Concluída': statusText='Concluída'; statusIcon='fa-check-circle'; break;
                case 'Não Concluída': statusText='Não Concluída'; statusIcon='fa-times-circle'; break;
                default: statusText='Desconhecido'; statusIcon='fa-question-circle'; break;
            }

            const formattedDate = new Date(order.date).toLocaleDateString('pt-BR');
            const evaluationBadge = order.evaluation !== null ? `<span><i class="fas fa-star"></i> Avaliação: ${order.evaluation}/5</span>` : '';

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.codigo}</span>
                    <span class="order-date">${formattedDate}</span>
                    <span class="order-status ${order.status.replace(/\s+/g, '-').toLowerCase()}"><i class="fas ${statusIcon}"></i> ${statusText}</span>
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
                    ${order.status === 'Em Andamento' ? '<button class="btn btn-small btn-msg"><i class="fas fa-comment"></i> Mensagem</button>' : ''}
                    ${order.status === 'Concluída' && !order.evaluation ? '<button class="btn btn-small btn-feedback"><i class="fas fa-star"></i> Avaliar</button>' : ''}
                    ${order.status === 'Não Concluída' ? '<button class="btn btn-small btn-reopen"><i class="fas fa-redo"></i> Reabrir</button>' : ''}
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
        const order = ordersData.find(o => o.id == orderId);
        if (!order) return;

        const formattedDate = new Date(order.date).toLocaleDateString('pt-BR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        let statusClass='', statusText='';
        switch(order.status){
            case 'Pendente': statusClass='pendente'; statusText='Pendente'; break;
            case 'Em Andamento': statusClass='em-andamento'; statusText='Em Andamento'; break;
            case 'Concluída': statusClass='concluida'; statusText='Concluída'; break;
            case 'Não Concluída': statusClass='nao-concluida'; statusText='Não Concluída'; break;
            default: statusClass='desconhecido'; statusText='Desconhecido'; break;
        }

        document.getElementById('modal-order-details').innerHTML = `
            <div class="detail-row"><span class="detail-label">Número da Ordem:</span><span class="detail-value">#${order.codigo}</span></div>
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
    // Modal de Avaliação
    // =========================
    const feedbackModal = document.getElementById('feedback-modal');
    const stars = feedbackModal.querySelectorAll('.fa-star');
    const submitFeedbackBtn = document.getElementById('submit-feedback');
    let selectedRating = 0;
    let currentOrderId = null;

    // Abrir modal de avaliação
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-feedback')) {
            const orderCard = e.target.closest('.order-card');
            currentOrderId = orderCard.dataset.id;
            selectedRating = 0;
            stars.forEach(star => star.classList.remove('selected'));
            feedbackModal.classList.add('active');
        }
    });

    // Selecionar estrelas corretamente (pintar da esquerda pra direita)
    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const hoverValue = parseInt(star.dataset.value);
        stars.forEach(s => {
          s.classList.toggle('hovered', parseInt(s.dataset.value) <= hoverValue);
        });
      });

      star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('hovered'));
      });

      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= selectedRating));
      });
    });


    // Enviar avaliação
    submitFeedbackBtn.addEventListener('click', async () => {
        if (!selectedRating) {
            alert("Por favor, selecione uma nota antes de enviar.");
            return;
        }

        try {
                const res = await fetch(`${API_URL}/api/ordens/${currentOrderId}/avaliar`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ avaliacao: selectedRating })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.erro || 'Erro ao enviar avaliação.');

            alert('Avaliação enviada com sucesso!');
            feedbackModal.classList.remove('active');
            await fetchUserOrders(); // recarrega as ordens
        } catch (err) {
            alert('Falha ao enviar avaliação: ' + err.message);
        }
    });

    


    // =========================
    // Inicializar app
    // =========================
    init();
});
