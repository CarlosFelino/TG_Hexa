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
            // Badge 1: Total de ordens pendentes no sistema (para técnicos)
            if (badgePendentes) {
                const resAll = await fetch("/api/ordens", {
                    headers: { Authorization: "Bearer " + token },
                });

                if (resAll.ok) {
                    const todasOrdens = await resAll.json();
                    badgePendentes.textContent = todasOrdens.filter(o => o.status === "Pendente").length;
                }
            }

            // Badge 2: Minhas ordens CRIADAS e EM ABERTO (do usuário logado)
            if (badgeMinhas) {
                const resMinhas = await fetch("/api/minhas-ordens", {
                    headers: { Authorization: "Bearer " + token },
                });

                if (resMinhas.ok) {
                    const minhasOrdens = await resMinhas.json();
                    const ordensArray = Array.isArray(minhasOrdens) ? minhasOrdens : minhasOrdens.ordens || [];

                    console.log("📦 Minhas ordens recebidas:", minhasOrdens);
                    console.log("📊 Total de minhas ordens:", ordensArray.length);

                    // ✅ FILTRO: Apenas ordens PENDENTES criadas pelo usuário (para o badge)
                    const ordensPendentes = ordensArray.filter(ordem => {
                        const isCriador = 
                            ordem.solicitante_id === user.id || 
                            ordem.criado_por === user.id ||
                            ordem.usuario_id === user.id ||
                            ordem.solicitante_id === user.usuario_id ||
                            ordem.criado_por === user.usuario_id;

                        const isPendente = ordem.status === "Pendente";

                        return isCriador && isPendente;
                    });

                    console.log(`⏳ Minhas ordens pendentes: ${ordensPendentes.length}`);

                    // Atualiza badge com total de ordens PENDENTES criadas pelo usuário
                    badgeMinhas.textContent = ordensPendentes.length;
                }
            }

            // ✅ CORREÇÃO: Card de Ordens Recentes - Buscar TODAS as ordens do sistema
            const recentOrdersContainer = document.getElementById("recentOrders");
            if (recentOrdersContainer) {
                const resAll = await fetch("/api/ordens", {
                    headers: { Authorization: "Bearer " + token },
                });

                if (resAll.ok) {
                    const todasOrdens = await resAll.json();
                    console.log("📦 Todas as ordens do sistema:", todasOrdens.length);

                    // Filtrar apenas ordens pendentes
                    const ordensPendentes = todasOrdens.filter(o => o.status === "Pendente");
                    console.log(`⏳ Total de ordens pendentes no sistema: ${ordensPendentes.length}`);

                    renderRecentOrders(ordensPendentes, recentOrdersContainer);
                }
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
                    <p>Nenhuma ordem pendente encontrada</p>
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
    // 6. POP-UPS DE ALERTAS (APARECER UM DE CADA VEZ)
    // =========================

    // Elementos dos pop-ups
    const alertPopupVencimento = document.getElementById("alertPopupVencimento");
    const alertBodyVencimento = document.getElementById("alertBodyVencimento");
    const closeVencimento = document.getElementById("closeVencimento");

    const alertPopupSemResp = document.getElementById("alertPopupSemResp");
    const alertBodySemResp = document.getElementById("alertBodySemResp");
    const closeSemResp = document.getElementById("closeSemResp");

    // Variáveis para controlar os alertas
    let alertasCarregados = false;
    let alertasQueue = []; // Fila de alertas para mostrar
    let currentAlert = null; // Alerta atual sendo mostrado

    // Botões de fechar
    if (closeVencimento) {
        closeVencimento.addEventListener("click", () => {
            closeCurrentAlert();
        });
    }

    if (closeSemResp) {
        closeSemResp.addEventListener("click", () => {
            closeCurrentAlert();
        });
    }

    // ✅ FUNÇÃO: Fechar alerta atual e mostrar o próximo
    function closeCurrentAlert() {
        if (currentAlert) {
            // Adiciona classe de animação de saída
            currentAlert.classList.add('closing');

            // Remove as classes ativas após a animação
            setTimeout(() => {
                currentAlert.classList.remove('active', 'closing');
                currentAlert.classList.add('hidden');

                // Remove o alerta atual da fila
                const index = alertasQueue.indexOf(currentAlert);
                if (index > -1) {
                    alertasQueue.splice(index, 1);
                }

                // Mostra o próximo alerta da fila
                currentAlert = null;
                showNextAlert();
            }, 300);
        }
    }

    // ✅ FUNÇÃO: Mostrar próximo alerta da fila
    function showNextAlert() {
        if (alertasQueue.length > 0 && !currentAlert) {
            currentAlert = alertasQueue[0];

            // Remove o hidden e mostra com animação
            setTimeout(() => {
                currentAlert.classList.remove('hidden');
                setTimeout(() => {
                    currentAlert.classList.add('active');
                }, 10);
            }, 500); // Delay para transição suave
        }
    }

    // ✅ FUNÇÃO: Adicionar alerta à fila
    function addAlertToQueue(alertElement, hasContent) {
        if (hasContent) {
            alertasQueue.push(alertElement);
            console.log(`📋 Alerta adicionado à fila: ${alertElement.id}`);
        }
    }

    // ✅ FUNÇÃO: Formatar data para exibição (para ordens sem responsável)
    function formatarDataParaExibicao(dataString) {
        if (!dataString) return "Data não informada";

        try {
            const data = new Date(dataString);

            // Formatar como "DD/MM/YYYY"
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();

            return `${dia}/${mes}/${ano}`;
        } catch (err) {
            console.error("Erro ao formatar data:", err);
            return "Data inválida";
        }
    }

    // ✅ FUNÇÃO PRINCIPAL: Carregar e exibir alertas (UM DE CADA VEZ)
    async function carregarAlertas() {
        // Verifica se já carregou os alertas para não repetir
        if (alertasCarregados) {
            console.log("⏭️ Alertas já carregados, pulando...");
            return;
        }

        alertasCarregados = true;

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

            // Resetar fila
            alertasQueue = [];

            // ============================================
            // POP-UP 1: Ordens próximas do vencimento
            // ============================================
            let hasVencimentoContent = false;
            if (alertas.prazo && alertas.prazo.length > 0) {
                // Filtrar apenas ordens que vencem em até 7 dias ou já venceram
                const ordensFiltradas = alertas.prazo.filter(ordem => {
                    if (!ordem.data_limite) return false;
                    const prioridade = calcularPrioridadePorData(ordem.data_limite);
                    return prioridade > 0; // Mostrar apenas prioridade 1-4
                });

                // Ordenar por prioridade
                ordensFiltradas.sort((a, b) => {
                    const prioridadeA = calcularPrioridadePorData(a.data_limite);
                    const prioridadeB = calcularPrioridadePorData(b.data_limite);
                    if (prioridadeB !== prioridadeA) {
                        return prioridadeB - prioridadeA;
                    }
                    const dataA = a.data_limite ? new Date(a.data_limite) : new Date(9999, 11, 31);
                    const dataB = b.data_limite ? new Date(b.data_limite) : new Date(9999, 11, 31);
                    return dataA - dataB;
                });

                if (ordensFiltradas.length > 0) {
                    hasVencimentoContent = true;
                    alertBodyVencimento.innerHTML = ordensFiltradas.map(ordem => {
                        const prioridade = calcularPrioridadePorData(ordem.data_limite);
                        const textoPrioridade = getTextoPrioridade(prioridade);
                        const iconePrioridade = getIconePrioridade(prioridade);
                        const mensagemVencimento = formatarMensagemVencimento(ordem.data_limite);

                        return `
                        <div class="alert-item priority-${prioridade}">
                            <div class="alert-icon-wrap">
                                <i class="${iconePrioridade}"></i>
                            </div>
                            <div class="alert-content">
                                <strong>
                                    <span class="priority-indicator"></span>
                                    ${ordem.codigo || `#${ordem.id}`}
                                </strong>
                                <p>${ordem.titulo || 'Sem título'}</p>
                                <small>
                                    <i class="far fa-calendar"></i> 
                                    ${mensagemVencimento}
                                </small>
                                <span class="badge">
                                    ${textoPrioridade}
                                </span>
                            </div>
                        </div>
                    `}).join('');
                }
            }

            if (!hasVencimentoContent) {
                alertBodyVencimento.innerHTML = `
                    <div class="alert-empty">
                        <i class="fas fa-check-circle"></i>
                        <p>Nenhuma ordem com vencimento crítico</p>
                    </div>
                `;
            }

            // ============================================
            // POP-UP 2: Ordens sem responsável (COM DATA FORMATADA)
            // ============================================
            let hasSemRespContent = false;
            if (alertas.sem_responsavel && alertas.sem_responsavel.length > 0) {
                hasSemRespContent = true;
                // Ordenar por data de criação
                const ordensOrdenadas = [...alertas.sem_responsavel].sort((a, b) => {
                    const dataA = a.data_criacao ? new Date(a.data_criacao) : new Date(0);
                    const dataB = b.data_criacao ? new Date(b.data_criacao) : new Date(0);
                    return dataA - dataB;
                });

                alertBodySemResp.innerHTML = ordensOrdenadas.map(ordem => {
                    const prioridade = 2; // Média
                    const textoPrioridade = "Sem responsável";
                    const dataFormatada = formatarDataParaExibicao(ordem.data_criacao);

                    return `
                    <div class="alert-item priority-${prioridade}">
                        <div class="alert-icon-wrap">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <div class="alert-content">
                            <strong>
                                <span class="priority-indicator"></span>
                                ${ordem.codigo || `#${ordem.id}`}
                            </strong>
                            <p>${ordem.titulo || 'Sem título'}</p>
                            <small>
                                <i class="far fa-calendar"></i> 
                                ${dataFormatada}
                            </small>
                            <span class="badge">
                                ${textoPrioridade}
                            </span>
                        </div>
                    </div>
                `}).join('');
            } else {
                alertBodySemResp.innerHTML = `
                    <div class="alert-empty">
                        <i class="fas fa-user-check"></i>
                        <p>Todas as ordens têm responsável</p>
                    </div>
                `;
            }

            // Adicionar alertas à fila (apenas os que têm conteúdo)
            addAlertToQueue(alertPopupVencimento, hasVencimentoContent);
            addAlertToQueue(alertPopupSemResp, hasSemRespContent);

            // Começar a mostrar os alertas
            setTimeout(() => {
                showNextAlert();
            }, 1000);

        } catch (err) {
            console.error("Erro ao carregar alertas:", err);
            alertasCarregados = false;
        }
    }

    // ✅ Funções auxiliares (mantidas do código anterior)
    function calcularPrioridadePorData(dataLimite) {
        if (!dataLimite) return 2;
        const hoje = new Date();
        const data = new Date(dataLimite);
        hoje.setHours(0, 0, 0, 0);
        data.setHours(0, 0, 0, 0);
        const diferencaMs = data - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        if (diferencaDias < 0) return 4;
        if (diferencaDias <= 1) return 3;
        if (diferencaDias <= 3) return 2;
        if (diferencaDias <= 7) return 1;
        return 0;
    }

    function getTextoPrioridade(nivel) {
        switch(nivel) {
            case 4: return "Vencido"; case 3: return "Alta"; 
            case 2: return "Média"; case 1: return "Baixa";
            default: return "Normal";
        }
    }

    function getIconePrioridade(nivel) {
        switch(nivel) {
            case 4: return "fas fa-exclamation-circle";
            case 3: return "fas fa-exclamation-triangle";
            case 2: return "fas fa-info-circle";
            case 1: return "fas fa-clock";
            default: return "fas fa-info-circle";
        }
    }

    function formatarMensagemVencimento(dataLimite) {
        if (!dataLimite) return "Sem data limite";
        const hoje = new Date();
        const data = new Date(dataLimite);
        hoje.setHours(0, 0, 0, 0);
        data.setHours(0, 0, 0, 0);
        const diferencaMs = data - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        if (diferencaDias < 0) {
            const diasAtraso = Math.abs(diferencaDias);
            if (diasAtraso === 0) return "Venceu hoje";
            if (diasAtraso === 1) return "Venceu ontem";
            return `Venceu há ${diasAtraso} dias`;
        }
        if (diferencaDias === 0) return "Vence hoje";
        if (diferencaDias === 1) return "Vence amanhã";
        return `Vence em ${diferencaDias} dias`;
    }

    // ✅ Carregar alertas ao abrir a página
    if (user && user.role === "suporte" && alertPopupVencimento && alertPopupSemResp) {
        setTimeout(carregarAlertas, 1000);
        console.log("🔔 Alertas configurados para aparecer um de cada vez");
    }
});