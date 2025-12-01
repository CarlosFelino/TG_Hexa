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
            if (badgeMinhas || document.getElementById("recentOrders")) {
                const resMinhas = await fetch("/api/minhas-ordens", {
                    headers: { Authorization: "Bearer " + token },
                });

                if (resMinhas.ok) {
                    const minhasOrdens = await resMinhas.json();
                    const ordensArray = Array.isArray(minhasOrdens) ? minhasOrdens : minhasOrdens.ordens || [];

                    console.log("📦 Dados recebidos da API:", minhasOrdens);
                    console.log("📊 Total de ordens recebidas:", ordensArray.length);
                    console.log("👤 Usuário logado:", user);

                    // Debug: Mostrar estrutura das primeiras ordens
                    if (ordensArray.length > 0) {
                        console.log("🔍 Estrutura da primeira ordem:", ordensArray[0]);
                        console.log("🔍 Campos disponíveis:", Object.keys(ordensArray[0]));
                    }

                    // ✅ FILTRO: Apenas ordens PENDENTES criadas pelo usuário
                    const ordensPendentes = ordensArray.filter(ordem => {
                        // Verifica múltiplos campos possíveis para identificar o criador
                        const isCriador = 
                            ordem.solicitante_id === user.id || 
                            ordem.criado_por === user.id ||
                            ordem.usuario_id === user.id ||
                            ordem.solicitante_id === user.usuario_id ||
                            ordem.criado_por === user.usuario_id;

                        const isPendente = ordem.status === "Pendente";

                        // Debug individual
                        if (ordem.status === "Pendente") {
                            console.log(`🔍 Ordem ${ordem.id || ordem.codigo}:`, {
                                status: ordem.status,
                                solicitante_id: ordem.solicitante_id,
                                criado_por: ordem.criado_por,
                                usuario_id: ordem.usuario_id,
                                user_id_logado: user.id,
                                user_usuario_id: user.usuario_id,
                                isCriador: isCriador
                            });
                        }

                        return isCriador && isPendente;
                    });

                    console.log(`⏳ Ordens pendentes criadas pelo usuário: ${ordensPendentes.length}`);

                    // Atualiza badge com total de ordens PENDENTES criadas pelo usuário
                    if (badgeMinhas) {
                        badgeMinhas.textContent = ordensPendentes.length;
                    }

                    // Atualiza ordens recentes (também filtra apenas as PENDENTES)
                    const recentOrdersContainer = document.getElementById("recentOrders");
                    if (recentOrdersContainer) {
                        renderRecentOrders(ordensPendentes, recentOrdersContainer);
                    }
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
    // 6. POP-UPS DE ALERTAS (COM LÓGICA DE PRIORIDADE DINÂMICA)
    // =========================

    // Elementos dos pop-ups
    const alertPopupVencimento = document.getElementById("alertPopupVencimento");
    const alertBodyVencimento = document.getElementById("alertBodyVencimento");
    const closeVencimento = document.getElementById("closeVencimento");

    const alertPopupSemResp = document.getElementById("alertPopupSemResp");
    const alertBodySemResp = document.getElementById("alertBodySemResp");
    const closeSemResp = document.getElementById("closeSemResp");

    // Variável para controlar se já carregou os alertas
    let alertasCarregados = false;

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

    // ✅ FUNÇÃO: Calcular prioridade baseada na data de vencimento
    function calcularPrioridadePorData(dataLimite) {
        if (!dataLimite) return 2; // Prioridade média se não tiver data

        const hoje = new Date();
        const dataVencimento = new Date(dataLimite);

        // Resetar horas para comparar apenas datas
        hoje.setHours(0, 0, 0, 0);
        dataVencimento.setHours(0, 0, 0, 0);

        // Calcular diferença em dias
        const diferencaMs = dataVencimento - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

        console.log(`📅 Data vencimento: ${dataVencimento.toLocaleDateString()}, Hoje: ${hoje.toLocaleDateString()}, Diferença: ${diferencaDias} dias`);

        // Lógica de prioridade:
        if (diferencaDias < 0) {
            return 4; // Vencido (prioridade máxima - cor diferente)
        } else if (diferencaDias <= 1) {
            return 3; // Alta - vence hoje ou amanhã
        } else if (diferencaDias <= 3) {
            return 2; // Média - vence em 2-3 dias
        } else if (diferencaDias <= 7) {
            return 1; // Baixa - vence em 4-7 dias
        } else {
            return 0; // Muito baixa - mais de 7 dias (não aparece no alerta)
        }
    }

    // ✅ FUNÇÃO: Obter texto da prioridade
    function getTextoPrioridade(nivel) {
        switch(nivel) {
            case 4: return "Vencido";
            case 3: return "Alta";
            case 2: return "Média";
            case 1: return "Baixa";
            default: return "Normal";
        }
    }

    // ✅ FUNÇÃO: Obter ícone da prioridade
    function getIconePrioridade(nivel) {
        switch(nivel) {
            case 4: return "fas fa-exclamation-circle"; // Vencido
            case 3: return "fas fa-exclamation-triangle"; // Alta
            case 2: return "fas fa-info-circle"; // Média
            case 1: return "fas fa-clock"; // Baixa
            default: return "fas fa-info-circle";
        }
    }

    // ✅ FUNÇÃO: Formatar mensagem de vencimento
    function formatarMensagemVencimento(dataLimite) {
        if (!dataLimite) return "Sem data limite";

        const hoje = new Date();
        const dataVencimento = new Date(dataLimite);

        // Resetar horas para comparar apenas datas
        hoje.setHours(0, 0, 0, 0);
        dataVencimento.setHours(0, 0, 0, 0);

        const diferencaMs = dataVencimento - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

        if (diferencaDias < 0) {
            const diasAtraso = Math.abs(diferencaDias);
            return `Vencido há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`;
        } else if (diferencaDias === 0) {
            return "Vence hoje!";
        } else if (diferencaDias === 1) {
            return "Vence amanhã";
        } else {
            return `Vence em ${diferencaDias} dias`;
        }
    }

    // ✅ FUNÇÃO PRINCIPAL: Carregar e exibir alertas (APENAS UMA VEZ)
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

            // ============================================
            // POP-UP 1: Ordens próximas do vencimento (COM PRIORIDADE DINÂMICA)
            // ============================================
            if (alertas.prazo && alertas.prazo.length > 0) {
                // Filtrar apenas ordens que vencem em até 7 dias ou já venceram
                const ordensFiltradas = alertas.prazo.filter(ordem => {
                    if (!ordem.data_limite) return false;
                    const prioridade = calcularPrioridadePorData(ordem.data_limite);
                    return prioridade > 0; // Mostrar apenas prioridade 1-4 (exclui "Muito baixa")
                });

                // Ordenar por prioridade (vencidos primeiro, depois por data mais próxima)
                ordensFiltradas.sort((a, b) => {
                    const prioridadeA = calcularPrioridadePorData(a.data_limite);
                    const prioridadeB = calcularPrioridadePorData(b.data_limite);

                    // Ordenar por prioridade (maior primeiro)
                    if (prioridadeB !== prioridadeA) {
                        return prioridadeB - prioridadeA;
                    }

                    // Se mesma prioridade, ordenar por data mais próxima
                    const dataA = a.data_limite ? new Date(a.data_limite) : new Date(9999, 11, 31);
                    const dataB = b.data_limite ? new Date(b.data_limite) : new Date(9999, 11, 31);
                    return dataA - dataB;
                });

                if (ordensFiltradas.length > 0) {
                    alertBodyVencimento.innerHTML = ordensFiltradas.map(ordem => {
                        // Calcular prioridade dinamicamente
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

                    console.log(`📊 Mostrando ${ordensFiltradas.length} ordens com vencimento próximo`);

                    // Mostrar pop-up com delay para melhor UX
                    alertPopupVencimento.classList.remove("hidden");
                    setTimeout(() => {
                        alertPopupVencimento.classList.add("active");
                    }, 500);
                } else {
                    alertBodyVencimento.innerHTML = `
                        <div class="alert-empty">
                            <i class="fas fa-check-circle"></i>
                            <p>Nenhuma ordem com vencimento crítico</p>
                            <small style="font-size: 0.75rem; margin-top: 0.5rem;">
                                Ordens com mais de 7 dias não são mostradas
                            </small>
                        </div>
                    `;
                    alertPopupVencimento.classList.add("hidden");
                    alertPopupVencimento.classList.remove("active");
                }
            } else {
                alertBodyVencimento.innerHTML = `
                    <div class="alert-empty">
                        <i class="fas fa-check-circle"></i>
                        <p>Nenhuma ordem com vencimento crítico</p>
                    </div>
                `;
                alertPopupVencimento.classList.add("hidden");
                alertPopupVencimento.classList.remove("active");
            }

            // ============================================
            // POP-UP 2: Ordens sem responsável
            // ============================================
            if (alertas.sem_responsavel && alertas.sem_responsavel.length > 0) {
                // Ordenar por data de criação (mais antigas primeiro)
                const ordensOrdenadas = [...alertas.sem_responsavel].sort((a, b) => {
                    const dataA = a.data_criacao ? new Date(a.data_criacao) : new Date(0);
                    const dataB = b.data_criacao ? new Date(b.data_criacao) : new Date(0);
                    return dataA - dataB;
                });

                alertBodySemResp.innerHTML = ordensOrdenadas.map(ordem => {
                    // Para ordens sem responsável, usar prioridade média como padrão
                    const prioridade = 2; // Média
                    const textoPrioridade = "Sem responsável";

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
                                Criada: ${formatarData(ordem.data_criacao)}
                            </small>
                            <span class="badge">
                                ${textoPrioridade}
                            </span>
                        </div>
                    </div>
                `}).join('');

                // Mostrar pop-up com delay para melhor UX
                alertPopupSemResp.classList.remove("hidden");
                setTimeout(() => {
                    alertPopupSemResp.classList.add("active");
                }, 800); // Delay maior para o segundo pop-up
            } else {
                alertBodySemResp.innerHTML = `
                    <div class="alert-empty">
                        <i class="fas fa-user-check"></i>
                        <p>Todas as ordens têm responsável</p>
                    </div>
                `;
                alertPopupSemResp.classList.add("hidden");
                alertPopupSemResp.classList.remove("active");
            }

        } catch (err) {
            console.error("Erro ao carregar alertas:", err);
            // Resetar flag em caso de erro para tentar novamente
            alertasCarregados = false;
        }
    }

    // ✅ Função auxiliar: Formatar data simples
    function formatarData(data) {
        if (!data) return "N/A";
        const d = new Date(data);
        return d.toLocaleDateString("pt-BR");
    }

    // ✅ Carregar alertas ao abrir a página (apenas para suporte - UMA VEZ)
    if (user && user.role === "suporte" && alertPopupVencimento && alertPopupSemResp) {
        // Aguardar 1 segundo antes de mostrar os alertas para a página carregar completamente
        setTimeout(carregarAlertas, 1000);

        console.log("🔔 Alertas configurados para aparecer apenas uma vez");
    }
});