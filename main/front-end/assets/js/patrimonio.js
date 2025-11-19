// ===============================================================
// Configurações iniciais
// ===============================================================
const API_URL = `https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev/api/patrimonios`;

const tableBody = document.getElementById("patrimonio-table-body");
const addBtn = document.getElementById("add-item-btn");

const searchInput = document.getElementById("search-patrimonio");
const filterStatus = document.getElementById("filter-status");
const resetFiltersBtn = document.getElementById("reset-filters");

let listaOriginal = [];

// ===============================================================
// Carregar lista de patrimônios
// ===============================================================
async function carregarPatrimonios() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Erro ao carregar patrimônios.");

        const dados = await res.json();
        listaOriginal = dados;
        renderTabela(dados);
        atualizarEstatisticas(dados);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados.</td></tr>`;
    }
}

// ===============================================================
// FILTRAR LISTA
// ===============================================================
function aplicarFiltros() {
    const busca = searchInput.value.toLowerCase();
    const statusFiltro = filterStatus.value;

    const filtrada = listaOriginal.filter(item => {
        const texto = `${item.descricao} ${item.patrimonio} ${item.local}`.toLowerCase();
        const matchBusca = texto.includes(busca);
        const matchStatus = statusFiltro === "" || item.status === statusFiltro;
        return matchBusca && matchStatus;
    });

    renderTabela(filtrada);
}

// ===============================================================
// Renderizar tabela
// ===============================================================
function renderTabela(lista) {
    tableBody.innerHTML = "";

    if (!lista.length) {
        tableBody.innerHTML = `<tr><td colspan="8">Nenhum patrimônio encontrado.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.patrimonio}</td>
            <td>${item.descricao}</td>
          
            <td>${item.local}</td>
            <td>${item.status}</td>
        
            <td>
                <button class="action-btn view" data-id="${item.id}">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${item.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete" data-id="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    // Eventos dos botões
    document.querySelectorAll(".view").forEach(btn => {
        btn.addEventListener("click", () => abrirDetalhes(btn.dataset.id));
    });

    document.querySelectorAll(".edit").forEach(btn => {
        btn.addEventListener("click", () => abrirFormulario("editar", btn.dataset.id));
    });

    document.querySelectorAll(".delete").forEach(btn => {
        btn.addEventListener("click", () => deletarPatrimonio(btn.dataset.id));
    });
}


// ===============================================================
// Estatísticas
// ===============================================================
function atualizarEstatisticas(lista) {
    document.getElementById("total-items").textContent = lista.length;
    document.getElementById("total-active").textContent =
        lista.filter(i => i.status === "Em Uso").length;

    document.getElementById("total-available").textContent =
        lista.filter(i => i.status === "Disponível").length;

    document.getElementById("total-maintenance").textContent =
        lista.filter(i => i.status === "Em Manutenção").length;
}


// ===============================================================
// Modal de detalhes
// ===============================================================
async function abrirDetalhes(id) {
    const modal = document.getElementById("item-details-modal");
    const body = document.getElementById("modal-item-details");

    try {
        const res = await fetch(`${API_URL}/${id}`);
        const item = await res.json();

        body.innerHTML = `
            <p><strong>ID:</strong> ${item.id}</p>
            <p><strong>Nº Patrimônio:</strong> ${item.patrimonio}</p>
            <p><strong>Descrição:</strong> ${item.descricao}</p>
           
            <p><strong>Local:</strong> ${item.local}</p>
            <p><strong>Status:</strong> ${item.status}</p>
          
        `;

        modal.style.display = "flex";

        document.getElementById("edit-item-btn").onclick = () => {
            modal.style.display = "none";
            abrirFormulario("editar", id);
        };

        document.querySelectorAll(".modal-close, .modal-close-btn")
            .forEach(btn => btn.onclick = () => modal.style.display = "none");

    } catch (err) {
        console.error("Erro ao abrir detalhes:", err);
    }
}


// ===============================================================
// Modal de adicionar/editar
// ===============================================================
function abrirFormulario(acao, id = null) {
    criarModalFormulario(); // cria o modal se ainda não existir

    const modal = document.getElementById("modal-form");
    const titulo = document.getElementById("modal-title");
    const submitBtn = document.getElementById("form-submit");

    modal.style.display = "flex";
    titulo.textContent = acao === "editar" ? "Editar Patrimônio" : "Novo Patrimônio";
    submitBtn.dataset.acao = acao;
    submitBtn.dataset.id = id || "";

    if (acao === "editar") {
        fetch(`${API_URL}/${id}`)
            .then(r => r.json())
            .then(item => {
                document.getElementById("form-patrimonio").value = item.patrimonio;
                document.getElementById("form-descricao").value = item.descricao;
                document.getElementById("form-local").value = item.local;
                document.getElementById("form-status").value = item.status;
            });
    } else {
        document.getElementById("form-patrimonio").value = "";
        document.getElementById("form-descricao").value = "";
        document.getElementById("form-local").value = "";
        document.getElementById("form-status").value = "Disponível";
    }
}


// ===============================================================
// Criar modal de formulário dinamicamente
// ===============================================================
function criarModalFormulario() {
    if (document.getElementById("modal-form")) return;

    const modal = document.createElement("div");
    modal.id = "modal-form";
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content form-modal">
            <h2 id="modal-title"></h2>

            <label>Nº Patrimônio</label>
            <input id="form-patrimonio" type="text">

            <label>Descrição</label>
            <input id="form-descricao" type="text">

            <label>Local</label>
            <input id="form-local" type="text">

            <label>Status</label>
            <select id="form-status">
                <option>Disponível</option>
                <option>Em Uso</option>
                <option>Em Manutenção</option>
                <option>Inativo</option>
            </select>

            <div class="modal-footer">
                <button class="btn btn-secondary" id="form-cancel">Cancelar</button>
                <button class="btn btn-primary" id="form-submit">Salvar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#form-cancel").onclick = () => modal.style.display = "none";

    modal.querySelector("#form-submit").onclick = salvarFormulario;
}


// ===============================================================
// Salvar item (adicionar ou editar)
// ===============================================================
async function salvarFormulario(e) {
    const acao = e.target.dataset.acao;
    const id = e.target.dataset.id;

    const patrimonio = document.getElementById("form-patrimonio").value;
    const descricao = document.getElementById("form-descricao").value;
    const local = document.getElementById("form-local").value;
    const status = document.getElementById("form-status").value;

    if (!patrimonio || !descricao || !local) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    const payload = { patrimonio, descricao, local, status };
    const metodo = acao === "editar" ? "PUT" : "POST";
    const url = acao === "editar" ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Erro ao salvar.");

        alert("Salvo com sucesso!");
        document.getElementById("modal-form").style.display = "none";
        carregarPatrimonios();

    } catch (err) {
        console.error(err);
        alert("Erro ao salvar dados.");
    }
}


// ===============================================================
// Excluir item
// ===============================================================
async function deletarPatrimonio(id) {
    if (!confirm("Deseja excluir este item?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao excluir");
        carregarPatrimonios();

    } catch (err) {
        console.error(err);
        alert("Erro ao excluir item.");
    }
}

// ===============================================================
// EVENTOS DE FILTRO
// ===============================================================
searchInput.addEventListener("input", aplicarFiltros);
filterStatus.addEventListener("change", aplicarFiltros);

resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterStatus.value = "";
    aplicarFiltros();
});

// ===============================================================
// Inicialização
// ===============================================================
addBtn.addEventListener("click", () => abrirFormulario("novo"));
carregarPatrimonios();
