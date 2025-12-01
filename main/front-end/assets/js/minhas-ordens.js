document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Elementos do DOM
    // =========================
    const ordersBody = document.getElementById('ordersBody');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-orders');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const applyDatesBtn = document.getElementById('apply-dates');

    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const inProgressOrdersEl = document.getElementById('inProgressOrders');
    const completedOrdersEl = document.getElementById('completedOrders');
    const notCompletedOrdersEl = document.getElementById('notCompletedOrders');

    // ===================================
    // DEFINIÇÃO DE VARIÁVEIS
    // ===================================
    const API_URL = "https://59474a86-d1ec-4d8b-be95-f13d54b8921d-00-2dfvvk3i4x3oc.riker.replit.dev";
    const token = localStorage.getItem("authToken");

    function loadUserProfile() {
        const user = JSON.parse(localStorage.getItem("currentUser")) || {};

        const userNameEl = document.getElementById("userName");
        const userEmailEl = document.getElementById("userEmail");

        if (userNameEl) {
            userNameEl.textContent = user.nome || "Suporte"; 
        }
        if (userEmailEl) {
            userEmailEl.textContent = user.email || "suporte@fatec.sp.gov.br";
        }
    }

    // =========================
    // Mapeamento de status
    // =========================
    const statusMap = {
        'pending': 'Pendente',
        'in-progress': 'Em Andamento',
        'completed': 'Concluída',
        'not-completed': 'Não Concluída',
    };

    let activeFilters = { status: 'all', search: '', dateFrom: null, dateTo: null };
    let ordersData = [];
    let currentOrderId = null;
    let selectedRating = 0;

    // =========================
    // Sistema de Notificação - CORRIGIDO
    // =========================

    function showCustomConfirm(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const messageEl = document.getElementById('confirm-message');
            const cancelBtn = document.getElementById('confirm-cancel');
            const okBtn = document.getElementById('confirm-ok');

            messageEl.textContent = message;
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onOk);
                document.removeEventListener('keydown', handleEscKey);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onOk = () => {
                cleanup();
                resolve(true);
            };

            const handleEscKey = (e) => {
                if (e.key === 'Escape') {
                    onCancel();
                }
            };

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);
            document.addEventListener('keydown', handleEscKey);

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    onCancel();
                }
            });
        });
    }

    function showNotification(message, type = 'success') {
        return new Promise((resolve) => {
            const modal = document.getElementById('notification-modal');
            const messageEl = document.getElementById('notification-message');
            const header = modal.querySelector('.modal-header h3');
            const closeBtns = modal.querySelectorAll('.modal-close, .modal-close-btn');

            messageEl.textContent = message;

            // Configurar estilo baseado no tipo
            if (type === 'success') {
                header.innerHTML = '<i class="fas fa-check-circle"></i> Sucesso';
                modal.querySelector('.modal-header').style.background = '#d4edda';
                header.style.color = '#155724';
                modal.querySelector('.modal-content').classList.remove('error');
            } else if (type === 'error') {
                header.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro';
                modal.querySelector('.modal-header').style.background = '#f8d7da';
                header.style.color = '#721c24';
                modal.querySelector('.modal-content').classList.add('error');
            }

            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                closeBtns.forEach(btn => {
                    btn.removeEventListener('click', onClose);
                });
                document.removeEventListener('keydown', handleEscKey);
            };

            const onClose = () => {
                cleanup();
                resolve();
            };

            const handleEscKey = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            closeBtns.forEach(btn => {
                btn.addEventListener('click', onClose);
            });

            document.addEventListener('keydown', handleEscKey);

            // Fechar automaticamente após 3 segundos para sucesso
            if (type === 'success') {
                setTimeout(onClose, 3000);
            }

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    onClose();
                }
            });
        });
    }

    // =========================
    // Sistema de Modais - CORRIGIDO
    // =========================

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Remover a classe 'active' para evitar conflito
            modal.classList.remove('active');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    }

    function closeAllModals() {
        // Fechar todos os modais que usam classe 'hidden'
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        });
    }

    // =========================
    // Buscar ordens do backend
    // =========================
    async function fetchUserOrders() {
        ordersBody.innerHTML = `<tr><td colspan="8" class="loading-message">Carregando ordens...</td></tr>`;

        const endpoint = `${API_URL}/api/minhas-ordens`;
        console.log("🔍 Buscando ordens em:", endpoint);

        try {
            const res = await fetch(endpoint, {
                headers: {
                    "Authorization": `Bearer ${token}`, 
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Falha de Autorização (${res.status}). O token pode ser inválido ou expirou.`);
                }
                throw new Error(`Falha ao carregar ordens. Status: ${res.status} ${res.statusText}`);
            }

            const text = await res.text();

            if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
                throw new Error("O servidor retornou HTML em vez de JSON. Verifique se a URL da API está correta ou se o token expirou.");
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                console.error("❌ Erro ao converter JSON:", parseErr);
                ordersBody.innerHTML = `<tr><td colspan="8">Erro ao processar dados da resposta do servidor.</td></tr>`;
                return;
            }

            const ordens = Array.isArray(data) ? data : data.ordens;

            if (!Array.isArray(ordens)) {
                console.error("⚠️ Estrutura inesperada de resposta:", data);
                ordersBody.innerHTML = `<tr><td colspan="8">Resposta inesperada do servidor. Nenhuma ordem encontrada.</td></tr>`;
                return;
            }

            ordersData = ordens.map(o => ({
                id: o.id,
                codigo: o.codigo,
                date: o.data_criacao || o.data || "",
                room: o.local_detalhe || o.local || "",
                equipment: o.equipamento || "",
                status: statusMap[o.status] || o.status || "Desconhecido",
                title: o.titulo || `${o.tipo_solicitacao || "Solicitação"} - ${o.local_detalhe || "Local não informado"}`,
                description: o.descricao || o.app_nome || "Sem descrição",
                type: o.tipo_problema || (o.tipo_solicitacao === "instalacao" ? "Instalação" : "N/A"),
                technician: o.tecnico_nome || "Não atribuído",
                evaluation: o.avaliacao ?? null,
                total_anexos: o.total_anexos || 0,
                solicitante: o.solicitante_nome || "Desconhecido"
            }));

            console.log("✅ Ordens carregadas:", ordersData.length);
            updateBadges();
            applyFilters();

        } catch (err) {
            console.error("❌ Erro ao buscar ordens:", err.message);
            ordersBody.innerHTML = `
                <tr><td colspan="8">
                    Erro ao carregar ordens. Verifique o console para mais detalhes.<br>
                    <small>Detalhe: ${err.message}</small>
                </td></tr>
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
        const naoConcluidas = ordersData.filter(o => o.status === 'Não Concluída').length;

        if (totalOrdersEl) totalOrdersEl.textContent = total;
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendentes;
        if (inProgressOrdersEl) inProgressOrdersEl.textContent = andamento;
        if (completedOrdersEl) completedOrdersEl.textContent = concluidas;
        if (notCompletedOrdersEl) notCompletedOrdersEl.textContent = naoConcluidas;
    }

    // =========================
    // Inicialização
    // =========================
    async function init() {
        loadUserProfile(); 
        await fetchUserOrders();
        setupEventListeners();
        setupFeedbackModal();
        setupModalEvents();
    }

    init();

    // =========================
    // Configurar event listeners - CORRIGIDO
    // =========================
    function setupEventListeners() {
        // Filtros
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
    }

    // =========================
    // Configurar eventos dos modais - NOVO
    // =========================
    function setupModalEvents() {
        // Fechar modais ao clicar no X ou botão fechar
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });

        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllModals();
            }
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

        renderOrdersTable(filteredOrders);
    }

    // =========================
    // Renderizar tabela de ordens
    // =========================
    function renderOrdersTable(orders) {
        ordersBody.innerHTML = '';

        if (orders.length === 0) {
            ordersBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: #6b7280;">
                        <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #d1d5db;"></i>
                        Nenhuma ordem encontrada com os filtros atuais
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');

            const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
            const formattedDate = new Date(order.date).toLocaleDateString('pt-BR');

            // Determinar ações disponíveis
            let actionsHTML = `
                <button class="btn-view" data-order-id="${order.id}">
                    <i class="fas fa-eye"></i> Detalhes
                </button>
            `;

            // Apenas mostrar botão de avaliar para ordens concluídas sem avaliação
            if (order.status === 'Concluída' && !order.evaluation) {
                actionsHTML += `
                    <button class="btn-feedback" data-order-id="${order.id}">
                        <i class="fas fa-star"></i> Avaliar
                    </button>
                `;
            }

            tr.innerHTML = `
                <td>${order.codigo ? order.codigo : `#${order.id}`}</td>
                <td>${formattedDate}</td>
                <td>${order.title}</td>
                <td>${order.type}</td>
                <td>${order.room}</td>
                <td><span class="status ${statusClass}">${order.status}</span></td>
                <td>${order.solicitante}</td>
                <td class="actions">${actionsHTML}</td>
            `;

            ordersBody.appendChild(tr);
        });

        // Adicionar event listeners aos botões
        setupTableButtons();
    }

    // =========================
    // Configurar botões da tabela - CORRIGIDO
    // =========================
    function setupTableButtons() {
        // Botão Detalhes
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const orderId = this.dataset.orderId;
                console.log('Abrindo detalhes da ordem:', orderId);
                showOrderDetails(orderId);
            });
        });

        // Botão Avaliar
        document.querySelectorAll('.btn-feedback').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                currentOrderId = this.dataset.orderId;
                selectedRating = 0;
                resetStars();
                console.log('🎯 Botão Avaliar clicado - Order ID:', currentOrderId);
                openFeedbackModal();
            });
        });
    }

    // ===================================
    // Buscar anexos da ordem
    // ===================================
    async function buscarAnexosOrdem(ordemId) {
        try {
            const res = await fetch(`${API_URL}/api/ordens/${ordemId}/anexos`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                console.error("Erro ao buscar anexos:", res.status);
                return [];
            }

            const anexos = await res.json();
            return anexos;
        } catch (err) {
            console.error("Erro ao buscar anexos:", err);
            return [];
        }
    }

    // =========================
    // Mostrar detalhes no modal - CORRIGIDO
    // =========================
    async function showOrderDetails(orderId) {
        console.log('🔍 Buscando detalhes da ordem:', orderId);

        const order = ordersData.find(o => o.id == orderId);
        if (!order) {
            console.error('❌ Ordem não encontrada:', orderId);
            showNotification('Ordem não encontrada!', 'error');
            return;
        }

        const formattedDate = new Date(order.date).toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let statusClass = '', statusText = '';
        switch(order.status){
            case 'Pendente': 
                statusClass = 'status-pending'; 
                statusText = 'Pendente'; 
                break;
            case 'Em Andamento': 
                statusClass = 'status-in-progress'; 
                statusText = 'Em Andamento'; 
                break;
            case 'Concluída': 
                statusClass = 'status-completed'; 
                statusText = 'Concluída'; 
                break;
            case 'Não Concluída': 
                statusClass = 'status-not-completed'; 
                statusText = 'Não Concluída'; 
                break;
            default: 
                statusClass = 'status-unknown'; 
                statusText = 'Desconhecido'; 
                break;
        }

        // Buscar anexos
        const anexos = await buscarAnexosOrdem(orderId);
        let anexosHTML = '';

        if (anexos && anexos.length > 0) {
            anexosHTML = `
                <tr>
                    <td class="detail-label"><i class="fas fa-paperclip"></i> Anexos</td>
                    <td class="detail-value">
                        <div class="anexos-list">
                            ${anexos.map(anexo => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(anexo.nome);
                                const fullUrl = `${API_URL}${anexo.url}`;

                                if (isImage) {
                                    return `
                                        <div class="anexo-item">
                                            <img src="${fullUrl}" 
                                                 alt="${anexo.nome}" 
                                                 class="anexo-thumbnail"
                                                 onclick="window.open('${fullUrl}', '_blank')" />
                                            <a href="${fullUrl}" 
                                               target="_blank" 
                                               class="anexo-link"
                                               download="${anexo.nome}">
                                                <i class="fas fa-download"></i> ${anexo.nome}
                                            </a>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="anexo-item">
                                            <i class="fas fa-file fa-2x" style="color: #7c05eb; margin-right: 10px;"></i>
                                            <a href="${fullUrl}" 
                                               target="_blank" 
                                               class="anexo-link"
                                               download="${anexo.nome}">
                                                <i class="fas fa-download"></i> ${anexo.nome}
                                            </a>
                                        </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                    </td>
                </tr>
            `;
        } else {
            anexosHTML = `
                <tr>
                    <td class="detail-label"><i class="fas fa-paperclip"></i> Anexos</td>
                    <td class="detail-value" style="color: #9ca3af;">
                        <i class="fas fa-times-circle"></i> Nenhum anexo encontrado
                    </td>
                </tr>
            `;
        }

        const evaluationHTML = order.evaluation !== null ? `
            <tr>
                <td class="detail-label"><i class="fas fa-star"></i> Avaliação</td>
                <td class="detail-value">
                    <div class="rating-display">
                        ${Array.from({length: 5}, (_, i) => 
                            `<i class="fas fa-star ${i < order.evaluation ? 'filled' : ''}"></i>`
                        ).join('')}
                        <span style="margin-left: 8px; font-weight: 600; color: #374151;">
                            (${order.evaluation}/5)
                        </span>
                    </div>
                </td>
            </tr>
        ` : `
            <tr>
                <td class="detail-label"><i class="fas fa-star"></i> Avaliação</td>
                <td class="detail-value" style="color: #9ca3af;">
                    <i class="fas fa-clock"></i> Aguardando avaliação
                </td>
            </tr>
        `;

        // Montar o conteúdo do modal
        const modalContent = `
            <table class="details-table">
                <tr>
                    <td class="detail-label"><i class="fas fa-hashtag"></i> Número</td>
                    <td class="detail-value"><strong>#${order.codigo || order.id}</strong></td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-user"></i> Solicitante</td>
                    <td class="detail-value">${order.solicitante || 'Não informado'}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-calendar"></i> Data</td>
                    <td class="detail-value">${formattedDate}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-info-circle"></i> Status</td>
                    <td class="detail-value">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-map-marker-alt"></i> Local</td>
                    <td class="detail-value">${order.room || 'Não informado'}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-desktop"></i> Equipamento</td>
                    <td class="detail-value">${order.equipment || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-tag"></i> Tipo</td>
                    <td class="detail-value">${order.type || 'Não especificado'}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-user-cog"></i> Técnico</td>
                    <td class="detail-value">${order.technician}</td>
                </tr>
                <tr>
                    <td class="detail-label"><i class="fas fa-file-alt"></i> Descrição</td>
                    <td class="detail-value" style="max-width: 300px;">${order.description}</td>
                </tr>
                ${anexosHTML}
                ${evaluationHTML}
            </table>
        `;

        // Atualizar o modal
        const modalBody = document.getElementById('modal-order-details');
        if (modalBody) {
            modalBody.innerHTML = modalContent;
            openModal('order-details-modal');
            console.log('✅ Modal de detalhes aberto com sucesso');
        } else {
            console.error('❌ Elemento modal-order-details não encontrado');
        }
    }

    // =========================
    // Modal de Avaliação - CORRIGIDO
    // =========================
    function openFeedbackModal() {
        openModal('feedback-modal');
        console.log('✅ Modal de avaliação aberto para ordem:', currentOrderId);
    }

    function resetStars() {
        const stars = document.querySelectorAll('#feedback-modal .fa-star');
        stars.forEach(star => {
            star.classList.remove('selected', 'hovered');
        });
        selectedRating = 0;
    }

    function setupFeedbackModal() {
        const feedbackModal = document.getElementById('feedback-modal');
        const stars = feedbackModal.querySelectorAll('.fa-star');
        const submitFeedbackBtn = document.getElementById('submit-feedback');
        const cancelFeedbackBtn = document.getElementById('cancel-feedback');

        // Eventos das estrelas
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
                stars.forEach(s => {
                    s.classList.toggle('selected', parseInt(s.dataset.value) <= selectedRating);
                });
                console.log('⭐ Avaliação selecionada:', selectedRating);
            });
        });

        // Enviar avaliação - CORRIGIDO
        submitFeedbackBtn.addEventListener('click', async () => {
            if (!selectedRating) {
                await showNotification('Por favor, selecione uma nota antes de enviar.', 'error');
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

                // Fechar modal de avaliação
                closeModal('feedback-modal');

                // Mostrar notificação no padrão do sistema
                await showNotification('Avaliação enviada com sucesso!', 'success');

                // Recarregar ordens para atualizar a interface
                await fetchUserOrders();

            } catch (err) {
                await showNotification(`Erro ao enviar avaliação: ${err.message}`, 'error');
            }
        });

        // Cancelar avaliação
        cancelFeedbackBtn.addEventListener('click', () => {
            closeModal('feedback-modal');
        });
    }
});