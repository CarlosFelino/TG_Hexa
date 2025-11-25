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
// Sistema de Notificações Toast
// ===============================================================
function showToast(type, title, message, duration = 5000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    
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

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 100);

    // Event listeners
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });

    // Auto-remover após duração
    if (duration > 0) {
        setTimeout(() => hideToast(toast), duration);
    }

    return toast;
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function hideToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// ===============================================================
// Validação de Formulário Melhorada
// ===============================================================
function validateForm() {
    const patrimonio = document.getElementById("form-patrimonio").value.trim();
    const descricao = document.getElementById("form-descricao").value.trim();
    const local = document.getElementById("form-local").value.trim();
    
    let isValid = true;
    
    // Limpar erros anteriores
    document.querySelectorAll('.field-error').forEach(error => {
        error.classList.remove('show');
    });
    
    // Validar campos
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
    let field = document.getElementById(fieldId);
    let errorElement = field.parentNode.querySelector('.field-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Destacar campo com erro
    field.style.borderColor = '#F44336';
    field.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
    
    // Focar no campo com erro
    field.focus();
}

// ===============================================================
// Modal de Confirmação Melhorado
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
        
        // Event listeners
        modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        
        modal.querySelector('.confirm-btn-confirm').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
        
        // Fechar com ESC
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
// Função Salvar Atualizada com Feedback
// ===============================================================
async function salvarFormulario(e) {
    const acao = e.target.dataset.acao;
    const id = e.target.dataset.id;

    // Validar formulário
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

    // Mostrar loading no botão
    const submitBtn = e.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

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

        // Sucesso
        document.getElementById("modal-form").style.display = "none";
        
        showToast('success', 
            acao === "editar" ? 'Item Atualizado!' : 'Item Criado!',
            acao === "editar" 
                ? `O patrimônio ${patrimonio} foi atualizado com sucesso.`
                : `Novo item de patrimônio criado com sucesso.`,
            4000
        );

        // Recarregar lista
        setTimeout(() => carregarPatrimonios(), 1000);

    } catch (err) {
        console.error('Erro ao salvar patrimônio:', err);
        showToast('error', 'Erro ao Salvar', err.message || 'Não foi possível salvar o item.', 5000);
    } finally {
        // Restaurar botão
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===============================================================
// Função Deletar Atualizada com Confirmação
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
        
        // Atualizar lista
        carregarPatrimonios();

    } catch (err) {
        console.error('Erro ao excluir:', err);
        showToast('error', 'Erro ao Excluir', err.message || 'Não foi possível excluir o item.', 5000);
    }
}

// ===============================================================
// Modal de adicionar/editar (CORRIGIDO)
// ===============================================================
function abrirFormulario(acao, id = null) {
    // 1. Garante que o modal existe (cria se não houver)
    criarModalFormulario();

    const modal = document.getElementById("modal-form");
    const titulo = document.getElementById("modal-title");
    const submitBtn = document.getElementById("form-submit");
    const cancelBtn = document.getElementById("form-cancel");

    // 2. Configura os eventos de FECHAR aqui para garantir que funcionem
    // Usamos .onclick para evitar múltiplos listeners acumulados
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = "none";
            // Limpa erros ao fechar
            document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
        };
    }

    // Fechar clicando fora (Overlay)
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    // Fechar com ESC
    document.onkeydown = (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    };

    // 3. Configura o estado do formulário
    modal.style.display = "flex";
    // Adiciona animação se estiver usando o novo CSS
    modal.classList.add('active'); 
    
    // Verifica se os elementos existem antes de tentar alterar
    if(titulo) titulo.innerHTML = acao === "editar" ? `<i class="fas fa-edit"></i> Editar Patrimônio` : `<i class="fas fa-plus"></i> Novo Patrimônio`;
    
    if(submitBtn) {
        submitBtn.dataset.acao = acao;
        submitBtn.dataset.id = id || "";
        submitBtn.onclick = salvarFormulario; // Garante que o salvar também está vinculado
    }

    // 4. Preenche ou limpa os campos
    if (acao === "editar") {
        fetch(`${API_URL}/${id}`)
            .then(r => r.json())
            .then(item => {
                if(document.getElementById("form-patrimonio")) document.getElementById("form-patrimonio").value = item.patrimonio;
                if(document.getElementById("form-descricao")) document.getElementById("form-descricao").value = item.descricao;
                if(document.getElementById("form-local")) document.getElementById("form-local").value = item.local;
                if(document.getElementById("form-status")) document.getElementById("form-status").value = item.status;
            })
            .catch(err => console.error("Erro ao buscar item:", err));
    } else {
        if(document.getElementById("form-patrimonio")) document.getElementById("form-patrimonio").value = "";
        if(document.getElementById("form-descricao")) document.getElementById("form-descricao").value = "";
        if(document.getElementById("form-local")) document.getElementById("form-local").value = "";
        if(document.getElementById("form-status")) document.getElementById("form-status").value = "Disponível";
    }
}


// ===============================================================
// Criar modal de formulário dinamicamente
// ===============================================================
function criarModalFormulario() {
    // Se o modal já existe no HTML, não faz nada (mas a abrirFormulario vai configurar os botões)
    if (document.getElementById("modal-form")) return;

    const modal = document.createElement("div");
    modal.id = "modal-form";
    modal.className = "modal";

    // Estrutura atualizada para bater com seu CSS novo
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
// Salvar item (adicionar ou editar) - ATUALIZADO
// ===============================================================
async function salvarFormulario(e) {
    const btn = e.target; // O botão que foi clicado
    const acao = btn.dataset.acao;
    const id = btn.dataset.id;
    const originalText = btn.innerHTML; // Guarda o texto original do botão

    // Pegar valores
    const patrimonio = document.getElementById("form-patrimonio").value;
    const descricao = document.getElementById("form-descricao").value;
    const local = document.getElementById("form-local").value;
    const status = document.getElementById("form-status").value;

    // Validação Simples
    if (!patrimonio || !descricao || !local) {
        showToast('warning', 'Campos Vazios', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Configuração da Requisição
    const payload = { patrimonio, descricao, local, status };
    const metodo = acao === "editar" ? "PUT" : "POST";
    const url = acao === "editar" ? `${API_URL}/${id}` : API_URL;

    // Efeito de Loading no Botão
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.innerHTML = ''; // Limpa o texto para mostrar o spinner do CSS

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Falha na comunicação com o servidor.");

        // Sucesso!
        showToast('success', 'Sucesso!', `O item foi ${acao === 'editar' ? 'atualizado' : 'criado'} corretamente.`);
        
        document.getElementById("modal-form").style.display = "none";
        carregarPatrimonios(); // Recarrega a tabela

    } catch (err) {
        console.error(err);
        showToast('error', 'Erro ao Salvar', 'Não foi possível salvar os dados. Tente novamente.');
    } finally {
        // Restaura o botão ao estado normal
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Função para mostrar toast
function showToast(type, title, message, duration = 5000) {
    // Criar container se não existir
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Criar toast
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

    // Mostrar toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Fechar toast
    const closeToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    };
    
    // Event listeners
    toast.querySelector('.toast-close').addEventListener('click', closeToast);
    if (duration > 0) setTimeout(closeToast, duration);
    
    return toast;
}

// ===============================================================
// Sistema de Notificações (Toasts)
// ===============================================================
function showToast(type, title, message) {
    // 1. Cria o container se não existir
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 2. Define ícones baseados no tipo
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    // 3. Cria o elemento HTML da notificação
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // 4. Adiciona ao container
    container.appendChild(toast);

    // 5. Animação de entrada (precisa de um pequeno delay para o CSS transition funcionar)
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 6. Remove automaticamente após 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        // Remove do DOM após a animação de saída
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    }, 4000);
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
