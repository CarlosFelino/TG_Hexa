document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("currentUser")) || {};
    const token = localStorage.getItem("authToken");

    // Atualiza cabeçalho
    document.getElementById("userName").textContent = user.name || "João Luis Souza";
    document.getElementById("userEmail").textContent = user.email || "user@example.com";

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

            return Array.isArray(data) ? data : (data.ordens || []);
        } catch (err) {
            console.error("Erro ao buscar ordens:", err);
            return [];
        }
    }

    async function assumirOrdem(id) {
        if (!confirm("Deseja realmente assumir esta ordem?")) return;
        try {
            const res = await fetch(`/api/ordens/${id}/assumir`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                throw new Error(erro.erro || "Erro ao assumir ordem.");
            }

            alert("✅ Ordem assumida com sucesso!");
            loadOrders();
        } catch (err) {
            alert(err.message);
        }
    }

    async function finalizarOrdem(id) {
        if (!confirm("Deseja marcar esta ordem como concluída?")) return;
        try {
            const res = await fetch(`/api/ordens/${id}/concluir`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ solucao: "Ordem concluída pelo técnico." })
            });

            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                throw new Error(erro.erro || "Erro ao finalizar ordem.");
            }

            alert("✅ Ordem finalizada com sucesso!");
            loadOrders();
        } catch (err) {
            alert(err.message);
        }
    }

    // ============================
    // Renderização da tabela
    // ============================
    function renderTable(orders) {
        const tbody = document.getElementById("ordersBody");
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading">Nenhuma ordem encontrada.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement("tr");
            const statusClass = order.status.toLowerCase().replace(/\s/g, "-");

            const criador = order.criador_nome || "—";
            const responsavel = order.responsavel_nome || "Não atribuído";
            const isMinha = order.responsavel_id === user.id;
            const tipo = order.tipo_solicitacao === "problema" ? "Problema" : "Instalação";
            const local = `${order.local_tipo === "laboratorio" ? "Lab" : "Sala"} ${order.local_detalhe}`;
            const dataCriacao = new Date(order.data_criacao).toLocaleDateString("pt-BR");
            const titulo = order.titulo || "(sem título)";

            // Determina botões de ação
            let actionsHTML = `<button class="view-btn" data-action="view" data-id="${order.id}">
                <i class="fas fa-eye"></i>
            </button>`;

            if (!order.responsavel_nome) {
                actionsHTML += `<button class="btn-assumir" data-action="assumir" data-id="${order.id}">
                    <i class="fas fa-hand"></i> Assumir
                </button>`;
            } else if (isMinha && order.status !== "Concluída") {
                actionsHTML += `<button class="btn-encerrar" data-action="finalizar" data-id="${order.id}">
                    <i class="fas fa-check"></i> Finalizar
                </button>`;
            } else if (!isMinha && order.responsavel_nome) {
                actionsHTML += `<span class="disabled"><i class="fas fa-user-lock"></i> Outro técnico</span>`;
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
    function openDetails(order) {
        const modal = document.getElementById("order-details-modal");
        const body = document.getElementById("modal-order-details");

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
        `;

        modal.style.display = "flex";
    }

    // ============================
    // Eventos da tabela
    // ============================
    document.getElementById("ordersTable").addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;

        const orders = await fetchOrders();
        const order = orders.find(o => o.id == id);

        if (!order) return;

        if (action === "assumir") await assumirOrdem(id);
        else if (action === "encerrar") {
            ordemEncerrando = id;
            document.getElementById("popup-encerrar").classList.remove("hidden");
        }
        else if (action === "view") openDetails(order);

    });

    // ============================
    // Fechar modal
    // ============================
    document.querySelectorAll(".modal-close").forEach(btn =>
        btn.addEventListener("click", () => {
            document.getElementById("order-details-modal").style.display = "none";
        })
    );

    // ============================
    // Inicialização
    // ============================
    async function loadOrders() {
        const orders = await fetchOrders();
        renderTable(orders);
    }

    //modal finalizar ordem
    let ordemEncerrando = null;

    document.addEventListener("click", async (e) => {
      const target = e.target;

      // Abrir pop-up
      if (target.classList.contains("btn-encerrar")) {
        ordemEncerrando = target.dataset.id;
        document.getElementById("popup-encerrar").classList.remove("hidden");
      }

      // Cancelar
      if (target.id === "cancelar-encerrar") {
        document.getElementById("popup-encerrar").classList.add("hidden");
        ordemEncerrando = null;
      }

      // Confirmar encerramento
      if (target.id === "confirmar-encerrar" && ordemEncerrando) {
        const texto = document.getElementById("solucao-texto").value.trim();
        if (!texto) {
          alert("Por favor, descreva como o problema foi resolvido.");
          return;
        }

        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(`/api/ordens/${ordemEncerrando}/concluir`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ solucao: texto })
          });

          if (!res.ok) throw new Error("Erro ao encerrar a ordem");

          alert("Ordem encerrada com sucesso!");
          document.getElementById("popup-encerrar").classList.add("hidden");
          ordemEncerrando = null;
          location.reload();
        } catch (err) {
          alert("Falha ao encerrar ordem: " + err.message);
        }
      }
    });


    loadOrders();
});
