// ===============================================================
// Configurações iniciais
// ===============================================================
const API_URL = `https://59474a86-d1ec-4d8b-be95-f13d54b8921d-00-2dfvvk3i4x3oc.riker.replit.dev/api/patrimonios`;

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
        tableBody.innerHTML = `<tr><td colspan="6">Nenhum patrimônio encontrado.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.patrimonio}</td>
            <td>${item.descricao}</td>
            <td>${item.local}</td>
            <td><span class="status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}">${item.status}</span></td>
            <td class="actions-cell">
                <button class="btn-table view" data-id="${item.id}" title="Ver detalhes">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-table edit" data-id="${item.id}" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-table delete" data-id="${item.id}" title="Excluir">
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
            <p><strong>Status:</strong> <span class="status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}">${item.status}</span></p>
        `;

        modal.style.display = "flex";
        modal.classList.add("active");

        document.getElementById("edit-item-btn").onclick = () => {
            modal.style.display = "none";
            modal.classList.remove("active");
            abrirFormulario("editar", id);
        };

        document.querySelectorAll(".modal-close, .modal-close-btn").forEach(btn => {
            btn.onclick = () => {
                modal.style.display = "none";
                modal.classList.remove("active");
            };
        });

    } catch (err) {
        console.error("Erro ao abrir detalhes:", err);
        showToast('error', 'Erro', 'Não foi possível carregar os detalhes do item.');
    }
}

// ===============================================================
// Sistema de Notificações Toast (ÚNICA VERSÃO)
// ===============================================================
function showToast(type, title, message, duration = 5000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    const closeToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);

    if (duration > 0) {
        setTimeout(closeToast, duration);
    }

    return toast;
}

// ===============================================================
// Validação de Formulário
// ===============================================================
function validateForm() {
    const patrimonio = document.getElementById("form-patrimonio").value.trim();
    const descricao = document.getElementById("form-descricao").value.trim();
    const local = document.getElementById("form-local").value.trim();

    let isValid = true;

    document.querySelectorAll('.field-error').forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });

    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
    });

    if (!patrimonio) {
        showFieldError('form-patrimonio', 'Número de patrimônio é obrigatório');
        isValid = false;
    }

    if (!descricao) {
        showFieldError('form-descricao', 'Descrição é obrigatória');
        isValid = false;
    }

    if (!local) {
        showFieldError('form-local', 'Local é obrigatório');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    let errorElement = field.parentNode.querySelector('.field-error');

    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        field.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.classList.add('show');

    field.style.borderColor = '#F44336';
    field.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
    field.focus();
}

// ===============================================================
// Modal de Confirmação
// ===============================================================
function showConfirmModal(type, title, message, confirmText, cancelText = 'Cancelar') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = `modal active confirm-modal ${type}`;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="confirm-icon">
                    <i class="fas ${type === 'delete' ? 'fa-trash' : 'fa-check'}"></i>
                </div>
                <h3 class="confirm-title">${title}</h3>
                <div class="confirm-message">${message}</div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-cancel">${cancelText}</button>
                    <button class="confirm-btn confirm-btn-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });

        modal.querySelector('.confirm-btn-confirm').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });

        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
                resolve(false);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    });
}

// ===============================================================
// Modal de adicionar/editar (VERSÃO FINAL)
// ===============================================================
function abrirFormulario(acao, id = null) {
    criarModalFormulario();

    const modal = document.getElementById("modal-form");
    const titulo = document.getElementById("modal-title");
    const submitBtn = document.getElementById("form-submit");
    const cancelBtn = document.getElementById("form-cancel");

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = "none";
            modal.classList.remove("active");
            limparErrosFormulario();
        };
    }

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            modal.classList.remove("active");
        }
    };

    document.onkeydown = (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    modal.style.display = "flex";
    modal.classList.add('active');

    if(titulo) {
        titulo.innerHTML = acao === "editar" 
            ? `<i class="fas fa-edit"></i> Editar Patrimônio` 
            : `<i class="fas fa-plus"></i> Novo Patrimônio`;
    }

    if(submitBtn) {
        submitBtn.dataset.acao = acao;
        submitBtn.dataset.id = id || "";
        submitBtn.onclick = salvarFormulario;
    }

    limparErrosFormulario();

    if (acao === "editar" && id) {
        fetch(`${API_URL}/${id}`)
            .then(r => r.json())
            .then(item => {
                document.getElementById("form-patrimonio").value = item.patrimonio || "";
                document.getElementById("form-descricao").value = item.descricao || "";
                document.getElementById("form-local").value = item.local || "";
                document.getElementById("form-status").value = item.status || "Disponível";
            })
            .catch(err => {
                console.error("Erro ao buscar item:", err);
                showToast('error', 'Erro', 'Não foi possível carregar os dados do item.');
            });
    } else {
        document.getElementById("form-patrimonio").value = "";
        document.getElementById("form-descricao").value = "";
        document.getElementById("form-local").value = "";
        document.getElementById("form-status").value = "Disponível";
    }
}

function limparErrosFormulario() {
    document.querySelectorAll('.field-error').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
    });
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
            <h2 id="modal-title"><i class="fas fa-plus"></i> Novo Patrimônio</h2>

            <div class="form-group">
                <label class="required-field">Nº Patrimônio</label>
                <input id="form-patrimonio" type="text" required>
                <div class="field-error"></div>
            </div>

            <div class="form-group">
                <label class="required-field">Descrição</label>
                <input id="form-descricao" type="text" required>
                <div class="field-error"></div>
            </div>

            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label class="required-field">Local</label>
                    <input id="form-local" type="text" required>
                    <div class="field-error"></div>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Status</label>
                    <select id="form-status">
                        <option>Disponível</option>
                        <option>Em Uso</option>
                        <option>Em Manutenção</option>
                        <option>Inativo</option>
                    </select>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" id="form-cancel">Cancelar</button>
                <button class="btn btn-primary" id="form-submit">Salvar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ===============================================================
// Salvar item (VERSÃO FINAL - SEM DUPLICAÇÃO)
// ===============================================================
async function salvarFormulario(e) {
    const acao = e.target.dataset.acao;
    const id = e.target.dataset.id;

    if (!validateForm()) {
        return;
    }

    const patrimonio = document.getElementById("form-patrimonio").value.trim();
    const descricao = document.getElementById("form-descricao").value.trim();
    const local = document.getElementById("form-local").value.trim();
    const status = document.getElementById("form-status").value;

    const payload = { patrimonio, descricao, local, status };
    const metodo = acao === "editar" ? "PUT" : "POST";
    const url = acao === "editar" ? `${API_URL}/${id}` : API_URL;

    const submitBtn = e.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Erro ao salvar patrimônio");
        }

        document.getElementById("modal-form").style.display = "none";
        document.getElementById("modal-form").classList.remove("active");

        showToast('success', 
            acao === "editar" ? 'Item Atualizado!' : 'Item Criado!',
            acao === "editar" 
                ? `O patrimônio ${patrimonio} foi atualizado com sucesso.`
                : `Novo item de patrimônio criado com sucesso.`,
            4000
        );

        setTimeout(() => carregarPatrimonios(), 500);

    } catch (err) {
        console.error('Erro ao salvar patrimônio:', err);
        showToast('error', 'Erro ao Salvar', err.message || 'Não foi possível salvar o item.', 5000);
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===============================================================
// Excluir item (VERSÃO FINAL - SEM DUPLICAÇÃO)
// ===============================================================
async function deletarPatrimonio(id) {
    const item = listaOriginal.find(i => i.id == id);
    if (!item) return;

    const confirmed = await showConfirmModal(
        'delete',
        'Excluir Item',
        `Tem certeza que deseja excluir o item <strong>"${item.descricao}"</strong> (${item.patrimonio})? Esta ação não pode ser desfeita.`,
        'Excluir',
        'Cancelar'
    );

    if (!confirmed) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Erro ao excluir item");
        }

        showToast('success', 'Item Excluído', `O patrimônio ${item.patrimonio} foi excluído com sucesso.`, 4000);

        carregarPatrimonios();

    } catch (err) {
        console.error('Erro ao excluir:', err);
        showToast('error', 'Erro ao Excluir', err.message || 'Não foi possível excluir o item.', 5000);
    }
}

// ===============================================================
// EVENTOS DE FILTRO
// ===============================================================
// Removidos daqui - agora estão dentro do DOMContentLoaded

// ===============================================================
// Inicialização
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (addBtn) {
        addBtn.addEventListener("click", () => abrirFormulario("novo"));
    }

    if (searchInput) {
        searchInput.addEventListener("input", aplicarFiltros);
    }

    if (filterStatus) {
        filterStatus.addEventListener("change", aplicarFiltros);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            searchInput.value = "";
            filterStatus.value = "";
            aplicarFiltros();
        });
    }

    // Carrega os patrimônios após garantir que o DOM está pronto
    carregarPatrimonios();
});