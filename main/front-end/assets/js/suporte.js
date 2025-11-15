document.addEventListener("DOMContentLoaded", function () {
    // =========================
    // AUTENTICAÇÃO
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user) {
        window.location.href = "../../login.html";
        return;
    }

    // =========================
    // ELEMENTOS DOM
    // =========================
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);

    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const cardPendentes = document.getElementById("cardPendentes");
    const cardAndamento = document.getElementById("cardAndamento");
    const cardMinhas = document.getElementById("cardMinhas");
    const cardConcluidas = document.getElementById("cardConcluidas");
    const recentOrdersContainer = document.getElementById("recentOrders");

    // Filtros
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroBusca = document.getElementById("filtroBusca");
    const filtroData = document.getElementById("filtroData");

    // Modal
    const detalhesModal = document.getElementById("detalhesModal");
    const modalContent = document.getElementById("modalContent");
    const modalClose = document.getElementById("modalClose");

    // =========================
    // MENU LATERAL
    // =========================
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });

    // =========================
    // PERFIL DO USUÁRIO
    // =========================
    userNameEl.textContent = user.nome;
    userEmailEl.textContent = user.email;
    welcomeNameEl.textContent = user.nome;

    const profileDropdown = document.querySelector(".profile-dropdown .dropdown-content");
    const profileAvatar = document.getElementById("userAvatar");
    let dropdownVisible = false;

    profileAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownVisible = !dropdownVisible;
        profileDropdown.style.display = dropdownVisible ? "block" : "none";
    });

    document.addEventListener("click", () => {
        if (dropdownVisible) {
            profileDropdown.style.display = "none";
            dropdownVisible = false;
        }
    });

    // Logout
    document.getElementById("logout")?.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
    });



    // =========================
    // DASHBOARD
    // =========================
    let ordensCache = [];

    async function loadDashboardData() {
        try {
            const res = await fetch("/api/ordens", {
                headers: { Authorization: "Bearer " + token },
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
        cardPendentes.textContent = ordens.filter(o => o.status === "Pendente").length;
        cardAndamento.textContent = ordens.filter(o => o.status === "Em Andamento").length;
        cardMinhas.textContent = ordens.filter(o => o.responsavel_id === user.id).length;
        cardConcluidas.textContent = ordens.filter(o => o.status === "Concluída").length;
    }

    // =========================
    // RENDERIZAR ORDENS RECENTES
    // =========================
    function renderRecentOrders(ordens) {
        if (!recentOrdersContainer) return;
        recentOrdersContainer.innerHTML = "";

        if (ordens.length === 0) {
            recentOrdersContainer.innerHTML = "<p>Nenhuma ordem encontrada.</p>";
            return;
        }

        const ordensRecentes = ordens
            .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
            .slice(0, 3);

        ordensRecentes.forEach(order => {
            const orderCard = document.createElement("div");
            const statusClass = order.status.replace(/\s/g, "-").toLowerCase();
            orderCard.className = `order-card ${statusClass}`;
            orderCard.dataset.id = order.id;

            const responsavel = order.tecnico_nome || order.responsavel_nome;
            const assignedInfo = order.responsavel_id
                ? `<span><i class="fas fa-user-cog"></i> Responsável: ${responsavel || "Suporte"}</span>`
                : "";

            const detalheProblema =
                order.tipo_solicitacao === "problema"
                    ? `<p><strong>Equipamento:</strong> ${order.equipamento || "-"} | <strong>Problema:</strong> ${order.tipo_problema || "-"}</p>`
                    : "";

            const detalheInstalacao =
                order.tipo_solicitacao === "instalacao"
                    ? `<p><strong>App:</strong> ${order.app_nome || "-"} | <strong>Versão:</strong> ${order.app_versao || "-"} | <strong>Link:</strong> ${order.app_link || "-"}</p>`
                    : "";

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">${order.codigo || `#${order.id}`}</span>
                    <span class="order-status ${statusClass}">${getStatusHTML(order.status)}</span>
                </div>
                <div class="order-body">
                    <h3>${order.descricao || "Sem descrição"}</h3>
                    <p>Data: ${new Date(order.data_criacao).toLocaleString()}</p>
                    ${assignedInfo}
                    ${detalheProblema}
                    ${detalheInstalacao}
                </div>
                
            `;
            recentOrdersContainer.appendChild(orderCard);
        });

        bindOrderButtons();
    }

    // =========================
    // STATUS / BOTÕES
    // =========================
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
                return '<i class="fas fa-question-circle"></i> Desconhecido';
        }
    }

    function getButtonsHTML(order) {
        let buttons = "";

        if (order.status === "Pendente" && !order.responsavel_id) {
            buttons += `<button class="btn btn-assign"><i class="fas fa-user-plus"></i> Assumir</button>`;
        }

        if (order.status === "Em Andamento" && order.responsavel_id === user.id) {
            buttons += `<button class="btn btn-finalize"><i class="fas fa-check"></i> Concluir</button>`;
        }

        buttons += `<button class="btn btn-details"><i class="fas fa-eye"></i> Detalhes</button>`;
        return buttons;
    }

    // =========================
    // AÇÕES DE BOTÕES
    // =========================
    function bindOrderButtons() {
        // --- ASSUMIR ---
        document.querySelectorAll(".btn-assign").forEach(btn => {
            btn.addEventListener("click", async function () {
                const orderCard = this.closest(".order-card");
                const orderId = orderCard.dataset.id;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

                try {
                    const res = await fetch(`/api/ordens/${orderId}/accept`, {
                        method: "PATCH",
                        headers: {
                            Authorization: "Bearer " + token,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ userId: user.id }),
                    });

                    const data = await res.json();
                    console.log("Assumir ordem:", data);

                    if (!res.ok) throw new Error(data.erro || "Falha ao assumir ordem");

                    orderCard.classList.remove("pendente");
                    orderCard.classList.add("em-andamento");
                    orderCard.querySelector(".order-status").innerHTML = getStatusHTML("Em Andamento");
                    this.remove();
                } catch (err) {
                    console.error(err);
                    alert("Não foi possível assumir a ordem.");
                    this.innerHTML = '<i class="fas fa-user-plus"></i> Assumir';
                }
            });
        });

        // --- CONCLUIR ---
        document.querySelectorAll(".btn-finalize").forEach(btn => {
            btn.addEventListener("click", async function () {
                const orderCard = this.closest(".order-card");
                const orderId = orderCard.dataset.id;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';

                try {
                    const res = await fetch(`/api/ordens/${orderId}/status`, {
                        method: "PATCH",
                        headers: {
                            Authorization: "Bearer " + token,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "Concluída" }),
                    });

                    const data = await res.json();
                    console.log("Concluir ordem:", data);

                    if (!res.ok) throw new Error(data.erro || "Falha ao concluir ordem");

                    orderCard.classList.remove("em-andamento");
                    orderCard.classList.add("concluida");
                    orderCard.querySelector(".order-status").innerHTML = getStatusHTML("Concluída");
                    this.remove();
                } catch (err) {
                    console.error(err);
                    alert("Não foi possível concluir a ordem.");
                    this.innerHTML = '<i class="fas fa-check"></i> Concluir';
                }
            });
        });

        // --- DETALHES ---
        document.querySelectorAll(".btn-details").forEach(btn => {
            btn.addEventListener("click", function () {
                const orderId = this.closest(".order-card").dataset.id;
                const order = ordensCache.find(o => o.id == orderId);
                if (!order) return;

                modalContent.innerHTML = `
                    <h3>Ordem ${order.codigo || `#${order.id}`}</h3>
                    <p><strong>Descrição:</strong> ${order.descricao || "-"}</p>
                    <p><strong>Status:</strong> ${getStatusHTML(order.status)}</p>
                    <p><strong>Tipo:</strong> ${order.tipo_solicitacao}</p>
                    <p><strong>Local:</strong> ${order.local_tipo} - ${order.local_detalhe || "-"}</p>
                    <p><strong>Responsável:</strong> ${order.tecnico_nome || order.responsavel_nome || "-"}</p>
                    ${
                        order.tipo_solicitacao === "problema"
                            ? `<p><strong>Equipamento:</strong> ${order.equipamento || "-"} | <strong>Problema:</strong> ${order.tipo_problema || "-"}</p>`
                            : ""
                    }
                    ${
                        order.tipo_solicitacao === "instalacao"
                            ? `<p><strong>App:</strong> ${order.app_nome || "-"} | <strong>Versão:</strong> ${order.app_versao || "-"} | <strong>Link:</strong> ${order.app_link || "-"}</p>`
                            : ""
                    }
                `;
                detalhesModal.style.display = "block";
            });
        });
    }

    // =========================
    // MODAL
    // =========================
    modalClose?.addEventListener("click", () => {
        detalhesModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === detalhesModal) {
            detalhesModal.style.display = "none";
        }
    });

    // =========================
    // FILTROS
    // =========================
    filtroStatus?.addEventListener("change", aplicarFiltros);
    filtroBusca?.addEventListener("input", aplicarFiltros);
    filtroData?.addEventListener("change", aplicarFiltros);

    function aplicarFiltros() {
        let filtered = [...ordensCache];
        const status = filtroStatus?.value;
        const busca = filtroBusca?.value.toLowerCase();
        const data = filtroData?.value;

        if (status && status !== "Todos")
            filtered = filtered.filter(o => o.status === status);
        if (busca)
            filtered = filtered.filter(o => o.descricao.toLowerCase().includes(busca));
        if (data)
            filtered = filtered.filter(
                o => new Date(o.data_criacao).toISOString().slice(0, 10) === data
            );

        renderRecentOrders(filtered);
    }

    // =========================
    // alertas
    // =========================

    function verificarAlertas(ordens) {
      // Ordens urgentes: prioridade alta e não concluídas
      const urgentes = ordens.filter(o => 
        o.prioridade >= 3 && 
        o.status !== "Concluída" && 
        o.status !== "Não Concluída"
      );

      // Ordens sem responsável
      const semResponsavel = ordens.filter(o => 
        !o.responsavel_id && 
        o.status === "Pendente"
      );

      let mensagens = [];

      if (urgentes.length > 0) {
        const codigosUrgentes = urgentes.map(o => `#${o.codigo}`).join(", ");
        mensagens.push(`⚠️ Ordens próximas do vencimento: <strong>${codigosUrgentes}</strong>`);
      }

      if (semResponsavel.length > 0) {
        const codigosSemResp = semResponsavel.map(o => `#${o.codigo}`).join(", ");
        mensagens.push(`👤 Ordens sem responsável: <strong>${codigosSemResp}</strong>`);
      }

      if (mensagens.length > 0) {
        const alertPopup = document.getElementById("alertPopup");
        const alertBody = document.getElementById("alertBody");
        const closeAlert = document.getElementById("closeAlert");

        alertBody.innerHTML = mensagens.map(m => `<p>${m}</p>`).join("");
        alertPopup.classList.add("active");

        closeAlert.addEventListener("click", () => {
          alertPopup.classList.remove("active");
        });
      }
    }

    // Chamar após carregar as ordens:
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/ordens", {
          headers: { Authorization: "Bearer " + token },
        });

        const text = await res.text();
        const ordens = JSON.parse(text);
        ordensCache = ordens;

        atualizarCards(ordens);
        renderRecentOrders(ordens);
        verificarAlertas(ordens); // 👈 ADICIONA ESTA LINHA
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      }
        function mostrarAlertas(ordens) {
          const popupVenc = document.getElementById("alertPopupVencimento");
          const bodyVenc = document.getElementById("alertBodyVencimento");
          const closeVenc = document.getElementById("closeVencimento");

          const popupResp = document.getElementById("alertPopupSemResp");
          const bodyResp = document.getElementById("alertBodySemResp");
          const closeResp = document.getElementById("closeSemResp");

          const hoje = new Date();
          const tresDias = 3 * 24 * 60 * 60 * 1000;

          // Filtra ordens próximas do vencimento
          const proximas = ordens.filter(o => {
            if (!o.data_limite) return false;
            const limite = new Date(o.data_limite);
            return limite - hoje <= tresDias && limite > hoje && o.status !== "Concluída";
          });

          // Filtra ordens sem responsável
          const semResp = ordens.filter(o => !o.responsavel_id && o.status === "Pendente");

          // Atualiza corpo dos alertas
          if (proximas.length > 0) {
            bodyVenc.innerHTML = proximas.map(o => `
              <p>⚠️ <strong>${o.codigo || "#"+o.id}</strong> vence em breve (${new Date(o.data_limite).toLocaleDateString()}).</p>
            `).join("");
            popupVenc.classList.add("active");
          }

          if (semResp.length > 0) {
            bodyResp.innerHTML = semResp.map(o => `
              <p>👤 <strong>${o.codigo || "#"+o.id}</strong> ainda não possui responsável.</p>
            `).join("");
            popupResp.classList.add("active");
          }

          // Botões fechar
          closeVenc.addEventListener("click", () => popupVenc.classList.add("fade-out"));
          closeResp.addEventListener("click", () => popupResp.classList.add("fade-out"));
        }

    }
    // =========================
    // INICIALIZAÇÃO
    // =========================
    loadDashboardData();
});
