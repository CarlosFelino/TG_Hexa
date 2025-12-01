document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("currentUser")) || {};
    const token = localStorage.getItem("authToken");
    const API_URL = window.location.origin;

    // Atualiza cabeçalho
    document.getElementById("userName").textContent = user.nome || user.name || "Suporte";
    document.getElementById("userEmail").textContent = user.email || "suporte@fatec.sp.gov.br";

    // ============================
    // Variáveis globais
    // ============================
    let ordemEncerrando = null;
    let allOrders = [];

    // ============================
    // FUNÇÃO DE ORDENAÇÃO UNIVERSAL
    // ============================
    function ordenarPorDataDecrescente(orders) {
        return [...orders].sort((a, b) => {
            const timeA = new Date(a.data_criacao).getTime();
            const timeB = new Date(b.data_criacao).getTime();
            return timeB - timeA; // Mais recente primeiro
        });
    }

    // ============================
    // Sistema de Confirmação Personalizado
    // ============================
    function showCustomConfirm(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const messageEl = document.getElementById('confirm-message');
            const cancelBtn = document.getElementById('confirm-cancel');
            const okBtn = document.getElementById('confirm-ok');

            messageEl.textContent = message;
            modal.classList.remove('hidden');
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onOk);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onOk = () => {
                cleanup();
                resolve(true);
            };

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) onCancel();
            });

            document.querySelectorAll('#custom-confirm-modal .modal-close').forEach(btn => {
                btn.addEventListener('click', onCancel);
            });
        });
    }

    function showNotification(message, type = 'success') {
        return new Promise((resolve) => {
            const modal = document.getElementById('notification-modal');
            const messageEl = document.getElementById('notification-message');
            const header = modal.querySelector('.modal-header h3');

            messageEl.textContent = message;

            if (type === 'success') {
                header.innerHTML = '<i class="fas fa-check-circle"></i> Sucesso';
                modal.querySelector('.modal-header').style.background = '#d4edda';
                header.style.color = '#155724';
            } else if (type === 'error') {
                header.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro';
                modal.querySelector('.modal-header').style.background = '#f8d7da';
                header.style.color = '#721c24';
            }

            modal.classList.remove('hidden');
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');
                document.querySelectorAll('#notification-modal .modal-close, #notification-modal .modal-close-btn').forEach(btn => {
                    btn.removeEventListener('click', onClose);
                });
            };

            const onClose = () => {
                cleanup();
                resolve();
            };

            document.querySelectorAll('#notification-modal .modal-close, #notification-modal .modal-close-btn').forEach(btn => {
                btn.addEventListener('click', onClose);
            });

            setTimeout(onClose, 3000);
        });
    }

    // ============================
    // Funções principais da API
    // ============================
    async function fetchOrders() {
        try {
            const res = await fetch("/api/ordens-detalhadas", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
            const data = await res.json();

            let orders = Array.isArray(data) ? data : (data.ordens || []);

            // ✅ ORDENAR IMEDIATAMENTE
            orders = ordenarPorDataDecrescente(orders);

            console.log("📋 Ordens carregadas e ordenadas (5 primeiras):");
            orders.slice(0, 5).forEach((o, i) => {
                console.log(`${i + 1}. ${o.codigo} - ${new Date(o.data_criacao).toLocaleString('pt-BR')}`);
            });

            return orders;
        } catch (err) {
            console.error("Erro ao buscar ordens:", err);
            await showNotification("Erro ao carregar ordens", "error");
            return [];
        }
    }

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

            return await res.json();
        } catch (err) {
            console.error("Erro ao buscar anexos:", err);
            return [];
        }
    }

    async function assumirOrdem(id) {
        const confirmed = await showCustomConfirm("Deseja realmente assumir esta ordem?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/ordens/${id}/assumir`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                throw new Error(erro.erro || "Erro ao assumir ordem.");
            }

            await showNotification("✅ Ordem assumida com sucesso!");
            await loadOrders();
        } catch (err) {
            await showNotification(`❌ ${err.message}`, "error");
        }
    }

    async function finalizarOrdem(id, solucao) {
        try {
            const res = await fetch(`/api/ordens/${id}/concluir`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ solucao })
            });

            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                throw new Error(erro.erro || "Erro ao finalizar ordem.");
            }

            await showNotification("✅ Ordem finalizada com sucesso!");
            await loadOrders();
        } catch (err) {
            await showNotification(`❌ ${err.message}`, "error");
        }
    }

    // ============================
    // Sistema de Filtros
    // ============================
    function applyFilters() {
        const searchTerm = document.getElementById("search-orders").value.toLowerCase();
        const statusFilter = document.getElementById("filter-status").value;
        const typeFilter = document.getElementById("filter-type").value;

        let filtered = allOrders.filter(order => {
            const matchesSearch = !searchTerm || 
                (order.titulo && order.titulo.toLowerCase().includes(searchTerm)) ||
                (order.codigo && order.codigo.toLowerCase().includes(searchTerm)) ||
                (order.responsavel_nome && order.responsavel_nome.toLowerCase().includes(searchTerm));

            const statusMap = {
                'pending': 'Pendente',
                'in-progress': 'Em Andamento',
                'completed': 'Concluída',
                'not-completed': 'Não Concluída'
            };
            const matchesStatus = !statusFilter || order.status === statusMap[statusFilter];
            const matchesType = !typeFilter || order.tipo_solicitacao === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });

        // ✅ ORDENAR SEMPRE APÓS FILTRAR
        filtered = ordenarPorDataDecrescente(filtered);

        renderTable(filtered);
    }

    // ============================
    // Renderização da tabela
    // ============================
    function renderTable(orders) {
        const tbody = document.getElementById("ordersBody");
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="loading">Nenhuma ordem encontrada.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement("tr");
            const statusClass = order.status.toLowerCase().replace(/\s/g, "-");

            const responsavel = order.responsavel_nome || "Não atribuído";
            const isMinha = order.responsavel_id === user.id;
            const tipo = order.tipo_solicitacao === "problema" ? "Problema" : "Instalação";
            const local = `${order.local_tipo === "laboratorio" ? "Lab" : "Sala"} ${order.local_detalhe}`;
            const dataCriacao = new Date(order.data_criacao).toLocaleDateString("pt-BR");
            const titulo = order.titulo || "(sem título)";

            let actionsHTML = `<button class="view-btn" data-action="view" data-id="${order.id}">
                <i class="fas fa-eye"></i> Detalhes
            </button>`;

            if (!order.responsavel_nome && order.status === "Pendente") {
                actionsHTML += `<button class="btn-assumir" data-action="assumir" data-id="${order.id}">
                    <i class="fas fa-hand"></i> Assumir
                </button>`;
            } else if (isMinha && order.status === "Em Andamento") {
                actionsHTML += `<button class="btn-encerrar" data-action="encerrar" data-id="${order.id}">
                    <i class="fas fa-check"></i> Finalizar
                </button>`;
            } else if (!isMinha && order.responsavel_nome) {
                actionsHTML += `<span class="disabled">
                    <i class="fas fa-user-lock"></i> Outro técnico
                </span>`;
            } else if (order.status === "Concluída" || order.status === "Não Concluída") {
                actionsHTML += `<span class="disabled">
                    <i class="fas fa-ban"></i> ${order.status}
                </span>`;
            }

            tr.innerHTML = `
                <td>${order.codigo ? order.codigo : `#${order.id}`}</td>
                <td>${dataCriacao}</td>
                <td>${titulo}</td>
                <td>${tipo}</td>
                <td>${local}</td>
                <td><span class="status ${statusClass}">${order.status}</span></td>
                <td>${responsavel}</td>
                <td class="actions">${actionsHTML}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ============================
    // Modal de detalhes
    // ============================
    async function openDetails(order) {
        const modal = document.getElementById("order-details-modal");
        const body = document.getElementById("modal-order-details");

        const anexos = await buscarAnexosOrdem(order.id);
        let anexosHTML = '';

        if (anexos && anexos.length > 0) {
            anexosHTML = `
                <div class="detail-section">
                    <strong>Anexos:</strong>
                    <div class="anexos-container">
                        ${anexos.map(anexo => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(anexo.nome);
                            const fullUrl = `${API_URL}${anexo.url}`;

                            if (isImage) {
                                return `
                                    <div class="anexo-item">
                                        <img src="${fullUrl}" 
                                             alt="${anexo.nome}" 
                                             class="anexo-imagem"
                                             onclick="window.open('${fullUrl}', '_blank')" />
                                        <a href="${fullUrl}" target="_blank" class="anexo-link" download="${anexo.nome}">
                                            <i class="fas fa-download"></i> ${anexo.nome}
                                        </a>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div class="anexo-item">
                                        <a href="${fullUrl}" target="_blank" class="anexo-link" download="${anexo.nome}">
                                            <i class="fas fa-file"></i> ${anexo.nome}
                                        </a>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        }

        body.innerHTML = `
            <p><strong>Código:</strong> ${order.codigo || `#${order.id}`}</p>
            <p><strong>Título:</strong> ${order.titulo}</p>
            <p><strong>Tipo:</strong> ${order.tipo_solicitacao}</p>
            <p><strong>Local:</strong> ${order.local_tipo} ${order.local_detalhe}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Responsável:</strong> ${order.responsavel_nome || "Não atribuído"}</p>
            <p><strong>Descrição:</strong> ${order.descricao || "Sem descrição"}</p>
            ${order.solucao ? `<p><strong>Solução:</strong> ${order.solucao}</p>` : ""}
            ${order.observacoes ? `<p><strong>Observações:</strong> ${order.observacoes}</p>` : ""}
            ${order.avaliacao ? `<p><strong>Avaliação:</strong> ${order.avaliacao}/5</p>` : ""}
            ${anexosHTML}
        `;

        modal.classList.remove('hidden');
        modal.classList.add('active');
    }

    // ============================
    // Event Listeners
    // ============================
    document.getElementById("ordersTable").addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;

        // ✅ CORREÇÃO: Buscar da lista local ao invés de fazer nova requisição
        const order = allOrders.find(o => o.id == id);

        if (!order) {
            console.error(`Ordem ${id} não encontrada em allOrders`);
            return;
        }

        if (action === "assumir") {
            await assumirOrdem(id);
        } else if (action === "encerrar") {
            ordemEncerrando = id;
            document.getElementById("popup-encerrar").classList.remove("hidden");
            document.getElementById("popup-encerrar").classList.add("active");
        } else if (action === "view") {
            await openDetails(order);
        }
    });

    // Fechar modais
    document.querySelectorAll(".modal-close, .modal-close-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const modal = this.closest('.modal') || this.closest('.popup');
            modal.classList.remove("active");
            modal.classList.add("hidden");
        });
    });

    // Fechar modal clicando fora
    document.querySelectorAll('.modal, .popup').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.classList.add('hidden');
            }
        });
    });

    // Modal de encerrar ordem
    document.addEventListener("click", async (e) => {
        const target = e.target;

        if (target.id === "cancelar-encerrar") {
            document.getElementById("popup-encerrar").classList.remove("active");
            document.getElementById("popup-encerrar").classList.add("hidden");
            document.getElementById("solucao-texto").value = "";
            ordemEncerrando = null;
        }

        if (target.id === "confirmar-encerrar" && ordemEncerrando) {
            const texto = document.getElementById("solucao-texto").value.trim();
            if (!texto) {
                await showNotification("Por favor, descreva como o problema foi resolvido.", "error");
                return;
            }

            try {
                document.getElementById("popup-encerrar").classList.remove("active");
                document.getElementById("popup-encerrar").classList.add("hidden");

                await finalizarOrdem(ordemEncerrando, texto);

                document.getElementById("solucao-texto").value = "";
                ordemEncerrando = null;
            } catch (err) {
                await showNotification("Falha ao encerrar ordem: " + err.message, "error");
            }
        }
    });

    // Event listeners para filtros
    document.getElementById("search-orders").addEventListener("input", applyFilters);
    document.getElementById("filter-status").addEventListener("change", applyFilters);
    document.getElementById("filter-type").addEventListener("change", applyFilters);

    document.getElementById("reset-filters").addEventListener("click", () => {
        document.getElementById("search-orders").value = "";
        document.getElementById("filter-status").value = "";
        document.getElementById("filter-type").value = "";
        applyFilters();
    });

    // ============================
    // Inicialização
    // ============================
    async function loadOrders() {
        allOrders = await fetchOrders();
        renderTable(allOrders);
    }

    loadOrders();
});