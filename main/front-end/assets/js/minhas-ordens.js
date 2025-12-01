// minhas-ordens.js - com sistema de modais padronizado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Minhas Ordens - Inicializando...');

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
    // Sistema de Notificação - PADRONIZADO
    // =========================

    function showCustomConfirm(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const messageEl = document.getElementById('confirm-message');
            const cancelBtn = document.getElementById('confirm-cancel');
            const okBtn = document.getElementById('confirm-ok');

            if (!modal || !messageEl || !cancelBtn || !okBtn) {
                console.error('❌ Elementos do modal de confirmação não encontrados');
                resolve(false);
                return;
            }

            messageEl.textContent = message;
            modal.classList.remove('hidden');
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onOk);

                // Remover listener do ESC
                document.removeEventListener('keydown', escHandler);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onOk = () => {
                cleanup();
                resolve(true);
            };

            const escHandler = (e) => {
                if (e.key === 'Escape') onCancel();
            };

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);

            // Fechar clicando fora do modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) onCancel();
            });

            // Fechar com ESC
            document.addEventListener('keydown', escHandler);
        });
    }

    function showNotification(message, type = 'success') {
        return new Promise((resolve) => {
            const modal = document.getElementById('notification-modal');
            const messageEl = document.getElementById('notification-message');
            const header = modal.querySelector('.modal-header h3');

            if (!modal || !messageEl || !header) {
                console.error('❌ Elementos do modal de notificação não encontrados');
                resolve();
                return;
            }

            messageEl.textContent = message;

            // Configurar cores baseadas no tipo
            if (type === 'success') {
                header.innerHTML = '<i class="fas fa-check-circle"></i> Sucesso';
                modal.querySelector('.modal-header').style.background = '#d4edda';
                header.style.color = '#155724';
                modal.classList.remove('error');
            } else if (type === 'error') {
                header.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro';
                modal.querySelector('.modal-header').style.background = '#f8d7da';
                header.style.color = '#721c24';
                modal.classList.add('error');
            }

            // Mostrar modal
            modal.classList.remove('hidden');
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');

                // Remover event listeners
                modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
                    btn.removeEventListener('click', onClose);
                });

                // Remover listener do ESC
                document.removeEventListener('keydown', escHandler);
            };

            const onClose = () => {
                cleanup();
                resolve();
            };

            const escHandler = (e) => {
                if (e.key === 'Escape') onClose();
            };

            // Configurar eventos de fechamento
            modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
                btn.addEventListener('click', onClose);
            });

            // Fechar clicando fora do modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) onClose();
            });

            // Fechar com ESC
            document.addEventListener('keydown', escHandler);

            // Auto-fechar após 3 segundos apenas para sucesso
            if (type === 'success') {
                setTimeout(onClose, 3000);
            }
        });
    }

    // =========================
    // Sistema de Modais - PADRONIZADO
    // =========================

    function openModal(modalId) {
        console.log(`🔓 Abrindo modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            // Remover display: none se existir
            modal.style.display = '';
            modal.classList.remove('hidden');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            console.log(`✅ Modal ${modalId} aberto com sucesso`);
        } else {
            console.error(`❌ Modal não encontrado: ${modalId}`);
        }
    }

    function closeModal(modalId) {
        console.log(`🔒 Fechando modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
            document.body.style.overflow = '';

            console.log(`✅ Modal ${modalId} fechado com sucesso`);
        }
    }

    function closeAllModals() {
        console.log('🔒 Fechando todos os modais');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
    }

    // =========================
    // Configurar eventos de fechamento para todos os modais
    // =========================
    function setupModalCloseListeners() {
        console.log('🔧 Configurando listeners de fechamento de modais...');

        // Delegar eventos para fechar modais
        document.addEventListener('click', function(e) {
            // Botão X (modal-close)
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            }

            // Botão "Cancelar" ou "Fechar" (modal-close-btn)
            if (e.target.classList.contains('modal-close-btn') || 
                e.target.closest('.modal-close-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            }

            // Botão "Cancelar" específico do feedback
            if (e.target.id === 'cancel-feedback' || 
                e.target.closest('#cancel-feedback')) {
                e.preventDefault();
                e.stopPropagation();
                closeModal('feedback-modal');
            }

            // Clicar fora do modal
            if (e.target.classList.contains('modal')) {
                closeModal(e.target.id);
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });

        console.log('✅ Listeners de fechamento configurados');
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
            // Usar a nova função de notificação
            await showNotification(`Erro ao carregar ordens: ${err.message}`, 'error');
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
        console.log('🚀 Inicializando Minhas Ordens...');

        loadUserProfile(); 
        await fetchUserOrders();
        setupGlobalEventListeners();
        setupModalCloseListeners();
        setupFeedbackModal();

        console.log('✅ Minhas Ordens inicializado com sucesso!');
    }

    init();

    // =========================
    // Configurar event listeners GLOBAIS
    // =========================
    function setupGlobalEventListeners() {
        console.log('🔧 Configurando event listeners...');

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

        // DELEGAÇÃO DE EVENTOS PARA BOTÕES DA TABELA
        document.addEventListener('click', function(e) {
            // Botão Ver Detalhes
            if (e.target.classList.contains('btn-view') || 
                e.target.closest('.btn-view')) {
                e.preventDefault();
                e.stopPropagation();

                const btn = e.target.classList.contains('btn-view') ? e.target : e.target.closest('.btn-view');
                const orderId = btn.dataset.orderId;
                console.log('📋 Abrindo detalhes da ordem:', orderId);
                showOrderDetails(orderId);
            }

            // Botão Avaliar
            if (e.target.classList.contains('btn-feedback') || 
                e.target.closest('.btn-feedback')) {
                e.preventDefault();
                e.stopPropagation();

                const btn = e.target.classList.contains('btn-feedback') ? e.target : e.target.closest('.btn-feedback');
                currentOrderId = btn.dataset.orderId;
                selectedRating = 0;
                resetStars();
                console.log('⭐ Botão Avaliar clicado - Order ID:', currentOrderId);
                openModal('feedback-modal');
            }
        });

        console.log('✅ Event listeners configurados');
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
                <td class="actions">${actionsHTML}</td>
            `;

            ordersBody.appendChild(tr);
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
    // Mostrar detalhes no modal
    // =========================
    async function showOrderDetails(orderId) {
        console.log('🔍 Buscando detalhes da ordem:', orderId);

        const order = ordersData.find(o => o.id == orderId);
        if (!order) {
            console.error('❌ Ordem não encontrada:', orderId);
            await showNotification('Ordem não encontrada!', 'error');
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
            <div class="details-container">
                <!-- Coluna 1: Informações Básicas -->
                <div class="details-section">
                    <h4><i class="fas fa-info-circle"></i> Informações da Ordem</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-hashtag"></i> Número</div>
                            <div class="detail-value"><strong>#${order.codigo || order.id}</strong></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-calendar"></i> Data</div>
                            <div class="detail-value">${formattedDate}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-info-circle"></i> Status</div>
                            <div class="detail-value">
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coluna 2: Local e Equipamento -->
                <div class="details-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Localização</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-map-marker-alt"></i> Local</div>
                            <div class="detail-value">${order.room || 'Não informado'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-desktop"></i> Equipamento</div>
                            <div class="detail-value">${order.equipment || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-tag"></i> Tipo</div>
                            <div class="detail-value">${order.type || 'Não especificado'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label"><i class="fas fa-user-cog"></i> Técnico</div>
                            <div class="detail-value">${order.technician}</div>
                        </div>
                    </div>
                </div>

                <!-- Descrição (largura total) -->
                <div class="details-section full-width">
                    <h4><i class="fas fa-file-alt"></i> Descrição</h4>
                    <div class="detail-item">
                        <div class="detail-value" style="line-height: 1.6; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                            ${order.description || 'Sem descrição'}
                        </div>
                    </div>
                </div>

                <!-- Avaliação -->
                <div class="details-section">
                    <h4><i class="fas fa-star"></i> Avaliação</h4>
                    <div class="detail-item">
                        ${order.evaluation !== null ? `
                            <div class="rating-display">
                                ${Array.from({length: 5}, (_, i) => 
                                    `<i class="fas fa-star ${i < order.evaluation ? 'filled' : ''}"></i>`
                                ).join('')}
                                <span>(${order.evaluation}/5)</span>
                            </div>
                        ` : `
                            <div class="detail-value" style="color: #9ca3af;">
                                <i class="fas fa-clock"></i> Aguardando avaliação
                            </div>
                        `}
                    </div>
                </div>

                <!-- Anexos -->
                ${anexosHTML ? `
                <div class="details-section full-width">
                    <h4><i class="fas fa-paperclip"></i> Anexos</h4>
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
                </div>
                ` : ''}
            </div>
        `;

        // Atualizar o modal
        const modalBody = document.getElementById('modal-order-details');
        if (modalBody) {
            modalBody.innerHTML = modalContent;
            openModal('order-details-modal');
            console.log('✅ Modal de detalhes aberto com sucesso');
        } else {
            console.error('❌ Elemento modal-order-details não encontrado');
            await showNotification('Erro ao abrir detalhes da ordem', 'error');
        }
    }

    // =========================
    // Modal de Avaliação
    // =========================
    function resetStars() {
        const stars = document.querySelectorAll('#feedback-modal .fa-star');
        stars.forEach(star => {
            star.classList.remove('selected', 'hovered');
        });
        selectedRating = 0;
        console.log('✨ Estrelas resetadas');
    }

    function setupFeedbackModal() {
        console.log('🔧 Configurando modal de feedback...');

        const feedbackModal = document.getElementById('feedback-modal');
        if (!feedbackModal) {
            console.error('❌ Modal de feedback não encontrado!');
            return;
        }

        const stars = feedbackModal.querySelectorAll('.fa-star');
        const submitFeedbackBtn = document.getElementById('submit-feedback');
        const cancelFeedbackBtn = document.getElementById('cancel-feedback');

        if (!submitFeedbackBtn) {
            console.error('❌ Botão submit-feedback não encontrado!');
            return;
        }

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

        // Enviar avaliação
        submitFeedbackBtn.addEventListener('click', async () => {
            console.log('📤 Enviando avaliação...');

            if (!selectedRating) {
                console.log('⚠️ Nenhuma nota selecionada');
                await showNotification('Por favor, selecione uma nota antes de enviar.', 'error');
                return;
            }

            if (!currentOrderId) {
                console.error('❌ ID da ordem não definido!');
                await showNotification('Erro: ID da ordem não encontrado.', 'error');
                return;
            }

            // Usar confirmação personalizada (igual ao listar-ordens)
            const confirmed = await showCustomConfirm(`Deseja realmente enviar a avaliação de ${selectedRating} estrelas?`);
            if (!confirmed) {
                console.log('❌ Avaliação cancelada pelo usuário');
                return;
            }

            try {
                console.log(`📡 Enviando avaliação ${selectedRating} para ordem ${currentOrderId}`);

                const res = await fetch(`${API_URL}/api/ordens/${currentOrderId}/avaliar`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ avaliacao: selectedRating })
                });

                console.log(`📡 Resposta recebida: ${res.status} ${res.statusText}`);

                if (!res.ok) {
                    let errorMessage = 'Erro ao enviar avaliação.';
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.erro || errorMessage;
                    } catch (e) {
                        errorMessage = `Erro HTTP: ${res.status} ${res.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                const data = await res.json();
                console.log('✅ Avaliação enviada com sucesso:', data);

                // Fechar modal de avaliação
                closeModal('feedback-modal');

                // Mostrar notificação de sucesso (nova função)
                await showNotification('Avaliação enviada com sucesso!', 'success');

                // Recarregar ordens para atualizar a interface
                console.log('🔄 Recarregando ordens...');
                await fetchUserOrders();

            } catch (err) {
                console.error('❌ Erro ao enviar avaliação:', err.message);
                await showNotification(`Erro ao enviar avaliação: ${err.message}`, 'error');
            }
        });

        console.log('✅ Modal de feedback configurado');
    }
});