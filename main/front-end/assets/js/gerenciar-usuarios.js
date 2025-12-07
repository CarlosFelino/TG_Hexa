// gerenciar-usuarios.js - VERSÃO INTEGRADA COM BACKEND
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = "../../login.html";
        return;
    }

    // =========================
    // Elementos do DOM
    // =========================
    const usersTableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('search-users');
    const filterRole = document.getElementById('filter-role');
    const filterStatus = document.getElementById('filter-status');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addUserBtn = document.getElementById('add-user-btn');
    const exportBtn = document.getElementById('export-users');

    // Modais
    const userDetailsModal = document.getElementById('user-details-modal');
    const userFormModal = document.getElementById('user-form-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');

    // Elementos do formulário
    const userForm = document.getElementById('user-form');
    const userFormTitle = document.getElementById('user-form-title');
    const saveUserBtn = document.getElementById('save-user-btn');
    const editUserBtn = document.getElementById('edit-user-btn');
    const passwordField = document.getElementById('password-field');

    // Elementos de estatísticas
    const totalUsersEl = document.getElementById('total-users');
    const totalProfessorsEl = document.getElementById('total-professors');
    const totalSupportEl = document.getElementById('total-support');
    const totalAdminsEl = document.getElementById('total-admins');

    // Filtros ativos
    let activeFilters = {
        search: '',
        role: '',
        status: ''
    };

    let usersData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentEditingUserId = null;

    // =========================
    // Configuração da API
    // =========================
    const API_URL = "https://59474a86-d1ec-4d8b-be95-f13d54b8921d-00-2dfvvk3i4x3oc.riker.replit.dev";

    // =========================
    // Buscar usuários do backend
    // =========================
    async function fetchAllUsers() {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Erro HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                usersData = data.usuarios || [];
                updateStatistics();
                renderUsers();
            } else {
                throw new Error(data.message || "Erro ao carregar usuários");
            }

        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar os usuários. Tente novamente.');
        }
    }

    // =========================
    // Atualizar estatísticas
    // =========================
    function updateStatistics() {
        const total = usersData.length;
        const professors = usersData.filter(u => u.role === 'professor').length;
        const support = usersData.filter(u => u.role === 'suporte').length;
        const admins = usersData.filter(u => u.role === 'admin').length;

        if (totalUsersEl) totalUsersEl.textContent = total;
        if (totalProfessorsEl) totalProfessorsEl.textContent = professors;
        if (totalSupportEl) totalSupportEl.textContent = support;
        if (totalAdminsEl) totalAdminsEl.textContent = admins;
    }

    // =========================
    // Renderizar tabela
    // =========================
    function renderUsers() {
        let filteredUsers = [...usersData];

        // Aplicar filtros
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.matricula.toLowerCase().includes(searchTerm)
            );
        }

        if (activeFilters.role) {
            filteredUsers = filteredUsers.filter(user => user.role === activeFilters.role);
        }

        if (activeFilters.status) {
            filteredUsers = filteredUsers.filter(user => user.status === activeFilters.status);
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

        // Renderizar tabela
        usersTableBody.innerHTML = '';

        if (paginatedUsers.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhum usuário encontrado com os filtros atuais
                    </td>
                </tr>
            `;
            return;
        }

        paginatedUsers.forEach(user => {
            const row = document.createElement('tr');

            // Textos para badges
            const roleText = user.role === 'professor' ? 'Professor' : 
                           user.role === 'suporte' ? 'Suporte' : 'Administrador';

            const statusText = user.status === 'active' ? 'Ativo' : 'Inativo';

            row.innerHTML = `
                <td><strong>${user.matricula}</strong></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${roleText}</span></td>
                <td><span class="status-badge ${user.status}">${statusText}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table view" data-id="${user.id}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-table edit" data-id="${user.id}" title="Editar usuário">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table delete" data-id="${user.id}" title="Excluir usuário">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            usersTableBody.appendChild(row);
        });

        // Adicionar event listeners aos botões
        addTableEventListeners();
        renderPagination(filteredUsers.length);
    }

    // =========================
    // Event Listeners da Tabela
    // =========================
    function addTableEventListeners() {
        // Botão Ver
        document.querySelectorAll('.btn-table.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                showUserDetails(userId);
            });
        });

        // Botão Editar
        document.querySelectorAll('.btn-table.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                editUser(userId);
            });
        });

        // Botão Excluir
        document.querySelectorAll('.btn-table.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                deleteUser(userId);
            });
        });
    }

    // =========================
    // Funções de Ação
    // =========================
    function showUserDetails(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        const roleText = user.role === 'professor' ? 'Professor' : 
                       user.role === 'suporte' ? 'Suporte' : 'Administrador';

        document.getElementById('modal-user-details').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Matrícula:</label>
                    <span>${user.matricula}</span>
                </div>
                <div class="detail-item">
                    <label>Nome Completo:</label>
                    <span>${user.name}</span>
                </div>
                <div class="detail-item">
                    <label>Email:</label>
                    <span>${user.email}</span>
                </div>
                <div class="detail-item">
                    <label>Cargo:</label>
                    <span class="role-badge ${user.role}">${roleText}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div class="detail-item">
                    <label>Data de Cadastro:</label>
                    <span>${formatDate(user.created_at)}</span>
                </div>
                <div class="detail-item">
                    <label>Último Acesso:</label>
                    <span>${user.last_login ? formatDate(user.last_login) : 'Nunca acessou'}</span>
                </div>
            </div>
        `;

        userDetailsModal.classList.add('active');
    }

    function editUser(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        currentEditingUserId = userId;
        userFormTitle.textContent = 'Editar Usuário';

        // Preencher formulário
        document.getElementById('user-matricula').value = user.matricula;
        document.getElementById('user-matricula').disabled = true; // Matrícula não pode ser editada
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;

        // Ocultar campo de senha na edição
        passwordField.style.display = 'none';
        document.getElementById('user-password').required = false;

        userFormModal.classList.add('active');
    }

    // Substitua as funções deleteUser e confirmDelete no seu gerenciar-usuarios.js

    function deleteUser(userId) {
        console.log('🗑️ [DELETE] Função deleteUser chamada para ID:', userId);

        const user = usersData.find(u => u.id == userId);
        if (!user) {
            console.error('❌ [DELETE] Usuário não encontrado na lista local');
            return;
        }

        console.log('🗑️ [DELETE] Usuário encontrado:', user);

        // ✅ VERIFICAR SE É ADMIN/SUPORTE - exige senha
        if (user.role === 'admin' || user.role === 'suporte') {
            showPasswordConfirmation(userId, user);
        } else {
            // Professor - confirmação simples
            showCustomAlert('warning', 'Confirmar Exclusão', 
                `Tem certeza que deseja excluir o usuário <strong>${user.name}</strong> (${user.email})? Esta ação não pode ser desfeita.`,
                [
                    { 
                        text: 'Cancelar', 
                        action: 'secondary',
                        callback: () => console.log('🗑️ [DELETE] Exclusão cancelada')
                    },
                    { 
                        text: 'Excluir', 
                        action: 'primary', 
                        callback: () => confirmDelete(userId, null)
                    }
                ]
            );
        }
    }

    // Nova função para solicitar senha
    function showPasswordConfirmation(userId, user) {
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'alert-overlay alert-warning';

        alertOverlay.innerHTML = `
            <div class="alert-modal" style="max-width: 450px;">
                <div class="alert-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="alert-title">Confirmação de Segurança</h3>
                <div class="alert-message">
                    Você está excluindo um usuário <strong>${user.role === 'admin' ? 'Administrador' : 'Suporte'}</strong>.<br>
                    Por segurança, confirme sua senha de administrador:
                    <div style="margin-top: 1rem;">
                        <strong>${user.name}</strong> (${user.email})
                    </div>
                </div>
                <div class="form-group" style="margin: 1.5rem 0; text-align: left;">
                    <label for="confirm-password" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Sua Senha:</label>
                    <input 
                        type="password" 
                        id="confirm-password" 
                        placeholder="Digite sua senha de administrador"
                        style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem;"
                        autocomplete="current-password"
                    >
                    <small style="color: #666; font-size: 0.85rem; display: block; margin-top: 0.3rem;">
                        Esta ação será registrada no log de auditoria
                    </small>
                </div>
                <div class="alert-actions">
                    <button class="alert-btn alert-btn-secondary" id="cancel-delete-btn">
                        Cancelar
                    </button>
                    <button class="alert-btn alert-btn-primary" id="confirm-delete-btn">
                        <i class="fas fa-trash"></i> Confirmar Exclusão
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alertOverlay);

        const passwordInput = alertOverlay.querySelector('#confirm-password');
        const cancelBtn = alertOverlay.querySelector('#cancel-delete-btn');
        const confirmBtn = alertOverlay.querySelector('#confirm-delete-btn');

        // Focar no input
        setTimeout(() => {
            passwordInput.focus();
        }, 100);

        // Botão cancelar
        cancelBtn.addEventListener('click', () => {
            console.log('🗑️ [DELETE] Exclusão cancelada');
            alertOverlay.remove();
        });

        // Botão confirmar
        confirmBtn.addEventListener('click', () => {
            const senha = passwordInput.value.trim();

            if (!senha) {
                passwordInput.style.borderColor = '#F44336';
                passwordInput.focus();
                return;
            }

            console.log('🗑️ [DELETE] Senha fornecida, chamando confirmDelete...');
            alertOverlay.remove();
            confirmDelete(userId, senha);
        });

        // Enter no input
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

        // ESC para cancelar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                alertOverlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Mostrar com animação
        setTimeout(() => {
            alertOverlay.classList.add('visible');
        }, 10);
    }

    // Adicione esta função ANTES da função confirmDelete no gerenciar-usuarios.js

    function showReassignmentModal(userId, data) {
        console.log('📋 [REASSIGN] Mostrando modal de reatribuição:', data);

        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'alert-overlay alert-warning';

        const ordensHTML = data.ordens.map(ordem => `
            <div class="ordem-item" style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem;">
                <strong>${ordem.codigo}</strong> - ${ordem.titulo}
                <select class="select-responsavel" data-ordem-id="${ordem.id}" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione um técnico...</option>
                    ${data.suporteDisponiveis.map(s => `
                        <option value="${s.id}">${s.nome} (${s.matricula})</option>
                    `).join('')}
                </select>
            </div>
        `).join('');

        alertOverlay.innerHTML = `
            <div class="alert-modal" style="max-width: 600px;">
                <div class="alert-icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <h3 class="alert-title">Reatribuir Ordens em Andamento</h3>
                <div class="alert-message" style="text-align: left;">
                    <p style="text-align: center; margin-bottom: 1rem;">
                        ${data.message}
                    </p>
                    <div id="ordens-list" style="max-height: 300px; overflow-y: auto;">
                        ${ordensHTML}
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="alert-btn alert-btn-secondary" id="cancel-reassign-btn">
                        Cancelar
                    </button>
                    <button class="alert-btn alert-btn-primary" id="confirm-reassign-btn">
                        <i class="fas fa-check"></i> Confirmar Reatribuição
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alertOverlay);

        const cancelBtn = alertOverlay.querySelector('#cancel-reassign-btn');
        const confirmBtn = alertOverlay.querySelector('#confirm-reassign-btn');

        // Botão cancelar
        cancelBtn.addEventListener('click', () => {
            console.log('📋 [REASSIGN] Cancelado');
            alertOverlay.remove();
        });

        // Botão confirmar
        confirmBtn.addEventListener('click', async () => {
            const selects = alertOverlay.querySelectorAll('.select-responsavel');
            const reatribuicoes = [];
            let todosPreenchidos = true;

            selects.forEach(select => {
                const ordemId = select.dataset.ordemId;
                const novoResponsavelId = select.value;

                if (!novoResponsavelId) {
                    todosPreenchidos = false;
                    select.style.borderColor = '#F44336';
                } else {
                    select.style.borderColor = '#ddd';
                    reatribuicoes.push({
                        ordemId: parseInt(ordemId),
                        novoResponsavelId: parseInt(novoResponsavelId)
                    });
                }
            });

            if (!todosPreenchidos) {
                showCustomAlert('warning', 'Atenção', 'Por favor, selecione um técnico para todas as ordens.');
                return;
            }

            console.log('📋 [REASSIGN] Reatribuições:', reatribuicoes);

            try {
                // Reatribuir cada ordem
                for (const { ordemId, novoResponsavelId } of reatribuicoes) {
                    const res = await fetch(`${API_URL}/api/ordens/${ordemId}/atribuir`, {
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ responsavel_id: novoResponsavelId })
                    });

                    if (!res.ok) {
                        throw new Error(`Erro ao reatribuir ordem ${ordemId}`);
                    }
                }

                alertOverlay.remove();
                console.log('✅ [REASSIGN] Ordens reatribuídas, tentando deletar novamente...');

                // Agora tentar deletar o usuário novamente
                const user = usersData.find(u => u.id == userId);
                if (user.role === 'admin' || user.role === 'suporte') {
                    showPasswordConfirmation(userId, user);
                } else {
                    confirmDelete(userId, null);
                }

            } catch (error) {
                console.error('❌ [REASSIGN] Erro:', error);
                showCustomAlert('error', 'Erro', 'Erro ao reatribuir ordens. Tente novamente.');
            }
        });

        // ESC para cancelar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                alertOverlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Mostrar com animação
        setTimeout(() => {
            alertOverlay.classList.add('visible');
        }, 10);
    }

    // ====================================================
    // FUNÇÃO 1: Mostrar modal de reatribuição de ordens
    // ====================================================
    function showReassignmentModal(userId, data) {
        console.log('📋 [REASSIGN] Mostrando modal de reatribuição:', data);

        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'alert-overlay alert-warning visible'; // ← já adiciona visible

        const ordensHTML = data.ordens.map(ordem => `
            <div class="ordem-item" style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid #ddd;">
                <div style="margin-bottom: 0.5rem;">
                    <strong style="color: var(--secondary);">${ordem.codigo}</strong>
                    <p style="margin: 0.25rem 0; color: var(--text-medium); font-size: 0.9rem;">${ordem.titulo}</p>
                </div>
                <select class="select-responsavel" data-ordem-id="${ordem.id}" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; background: white;">
                    <option value="">Selecione um técnico...</option>
                    ${data.suporteDisponiveis.map(s => `
                        <option value="${s.id}">${s.nome} (Mat: ${s.matricula})</option>
                    `).join('')}
                </select>
            </div>
        `).join('');

        alertOverlay.innerHTML = `
            <div class="alert-modal" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="alert-icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <h3 class="alert-title">Reatribuir Ordens em Andamento</h3>
                <div class="alert-message" style="text-align: left;">
                    <p style="text-align: center; margin-bottom: 1.5rem; color: var(--text-medium);">
                        ${data.message}
                    </p>
                    <div id="ordens-list" style="max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">
                        ${ordensHTML}
                    </div>
                </div>
                <div class="alert-actions" style="margin-top: 1.5rem;">
                    <button class="alert-btn alert-btn-secondary" id="cancel-reassign-btn">
                        Cancelar
                    </button>
                    <button class="alert-btn alert-btn-primary" id="confirm-reassign-btn">
                        <i class="fas fa-check"></i> Reatribuir e Excluir
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alertOverlay);

        const cancelBtn = alertOverlay.querySelector('#cancel-reassign-btn');
        const confirmBtn = alertOverlay.querySelector('#confirm-reassign-btn');

        // Botão cancelar
        cancelBtn.addEventListener('click', () => {
            console.log('📋 [REASSIGN] Cancelado');
            alertOverlay.remove();
        });

        // Botão confirmar
        confirmBtn.addEventListener('click', async () => {
            const selects = alertOverlay.querySelectorAll('.select-responsavel');
            const reatribuicoes = [];
            let todosPreenchidos = true;

            selects.forEach(select => {
                const ordemId = select.dataset.ordemId;
                const novoResponsavelId = select.value;

                if (!novoResponsavelId) {
                    todosPreenchidos = false;
                    select.style.borderColor = '#F44336';
                    select.style.background = 'rgba(244, 67, 54, 0.05)';
                } else {
                    select.style.borderColor = '#4CAF50';
                    select.style.background = 'rgba(76, 175, 80, 0.05)';
                    reatribuicoes.push({
                        ordemId: parseInt(ordemId),
                        novoResponsavelId: parseInt(novoResponsavelId)
                    });
                }
            });

            if (!todosPreenchidos) {
                showCustomAlert('warning', 'Atenção', 'Por favor, selecione um técnico para todas as ordens.');
                return;
            }

            console.log('📋 [REASSIGN] Reatribuições:', reatribuicoes);

            // Desabilitar botão e mostrar loading
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reatribuindo...';

            try {
                // Reatribuir cada ordem
                for (const { ordemId, novoResponsavelId } of reatribuicoes) {
                    const res = await fetch(`${API_URL}/api/ordens/${ordemId}/atribuir`, {
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ responsavel_id: novoResponsavelId })
                    });

                    if (!res.ok) {
                        const error = await res.json();
                        throw new Error(error.message || `Erro ao reatribuir ordem ${ordemId}`);
                    }
                }

                alertOverlay.remove();
                console.log('✅ [REASSIGN] Ordens reatribuídas com sucesso!');

                // Agora tentar deletar o usuário novamente
                const user = usersData.find(u => u.id == userId);
                if (user.role === 'admin' || user.role === 'suporte') {
                    showPasswordConfirmation(userId, user);
                } else {
                    confirmDelete(userId, null);
                }

            } catch (error) {
                console.error('❌ [REASSIGN] Erro:', error);
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Reatribuir e Excluir';
                showCustomAlert('error', 'Erro', error.message || 'Erro ao reatribuir ordens. Tente novamente.');
            }
        });

        // ESC para cancelar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                alertOverlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // ====================================================
    // FUNÇÃO 2: Modificar confirmDelete para detectar reatribuição
    // ====================================================
    // SUBSTITUA a função confirmDelete existente por esta:

    async function confirmDelete(userId, senhaAdmin) {
        console.log('🗑️ [DELETE] Iniciando exclusão do usuário ID:', userId);

        try {
            const requestBody = {};

            if (senhaAdmin) {
                requestBody.senhaAdmin = senhaAdmin;
            }

            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: 'DELETE',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();

            if (data.success) {
                console.log('✅ [DELETE] Usuário deletado com sucesso!');
                showCustomAlert('success', 'Usuário Excluído', data.message);
                await fetchAllUsers();
            } else {
                // ✅ VERIFICAR SE PRECISA REATRIBUIR ORDENS
                if (data.requireReassignment) {
                    console.log('📋 [DELETE] Precisa reatribuir ordens');
                    showReassignmentModal(userId, data);
                } else if (data.message && data.message.includes('Senha incorreta')) {
                    showCustomAlert('error', 'Senha Incorreta', 'A senha fornecida está incorreta. Tente novamente.');
                } else {
                    showCustomAlert('error', 'Erro', data.message || 'Não foi possível excluir o usuário.');
                }
            }

        } catch (error) {
            console.error('❌ [DELETE] Erro ao excluir usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao excluir usuário. Tente novamente.');
        }
    }

    // Agora modifique a função confirmDelete para tratar o erro de reatribuição:

    async function confirmDelete(userId, senhaAdmin) {
        console.log('🗑️ [DELETE] Iniciando exclusão do usuário ID:', userId);

        try {
            const requestBody = {};

            if (senhaAdmin) {
                requestBody.senhaAdmin = senhaAdmin;
            }

            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: 'DELETE',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();

            if (data.success) {
                console.log('✅ [DELETE] Usuário deletado com sucesso!');
                showCustomAlert('success', 'Usuário Excluído', data.message);
                await fetchAllUsers();
            } else {
                // ✅ VERIFICAR SE PRECISA REATRIBUIR ORDENS
                if (data.requireReassignment) {
                    console.log('📋 [DELETE] Precisa reatribuir ordens');
                    showReassignmentModal(userId, data);
                } else if (data.message && data.message.includes('Senha incorreta')) {
                    showCustomAlert('error', 'Senha Incorreta', 'A senha fornecida está incorreta. Tente novamente.');
                } else {
                    showCustomAlert('error', 'Erro', data.message || 'Não foi possível excluir o usuário.');
                }
            }

        } catch (error) {
            console.error('❌ [DELETE] Erro ao excluir usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao excluir usuário. Tente novamente.');
        }
    }

    async function confirmDelete(userId, senhaAdmin) {
        console.log('🗑️ [DELETE] Iniciando exclusão do usuário ID:', userId);

        try {
            const requestBody = {};

            // Adicionar senha apenas se fornecida
            if (senhaAdmin) {
                requestBody.senhaAdmin = senhaAdmin;
            }

            console.log('🗑️ [DELETE] Body da requisição:', requestBody);

            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: 'DELETE',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody) // ← CORRIGIDO
            });

            console.log('🗑️ [DELETE] Status da resposta:', res.status);

            const data = await res.json();
            console.log('🗑️ [DELETE] Dados recebidos:', data);

            if (data.success) {
                console.log('✅ [DELETE] Usuário deletado com sucesso!');
                showCustomAlert('success', 'Usuário Excluído', data.message || 'O usuário foi excluído com sucesso.');
                await fetchAllUsers(); // Recarregar lista
            } else {
                console.log('❌ [DELETE] Falha ao deletar:', data.message);

                // Mensagem especial para senha incorreta
                if (data.message && data.message.includes('Senha incorreta')) {
                    showCustomAlert('error', 'Senha Incorreta', 'A senha fornecida está incorreta. Tente novamente.');
                } else {
                    showCustomAlert('error', 'Erro', data.message || 'Não foi possível excluir o usuário.');
                }
            }

        } catch (error) {
            console.error('❌ [DELETE] Erro ao excluir usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao excluir usuário. Tente novamente.');
        }
    }

    // =========================
    // Gerenciar Formulário
    // =========================
    function setupFormHandlers() {
        addUserBtn.addEventListener('click', () => {
            currentEditingUserId = null;
            userFormTitle.textContent = 'Adicionar Novo Usuário';
            userForm.reset();

            // Habilitar campo de matrícula
            document.getElementById('user-matricula').disabled = false;

            // Mostrar campo de senha para novo usuário
            passwordField.style.display = 'block';
            document.getElementById('user-password').required = true;

            userFormModal.classList.add('active');
        });

        saveUserBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!userForm.checkValidity()) {
                userForm.reportValidity();
                return;
            }

            const formData = {
                matricula: document.getElementById('user-matricula').value,
                name: document.getElementById('user-name').value,
                email: document.getElementById('user-email').value,
                role: document.getElementById('user-role').value,
                status: document.getElementById('user-status').value
            };

            const password = document.getElementById('user-password').value;
            if (password && password.trim() !== '') {
                formData.password = password;
            }

            try {
                if (currentEditingUserId) {
                    // Editar usuário existente
                    await updateUser(currentEditingUserId, formData);
                } else {
                    // Criar novo usuário
                    await createUser(formData);
                }

                userFormModal.classList.remove('active');
                await fetchAllUsers(); // Recarregar dados

            } catch (error) {
                console.error('Erro no formulário:', error);
            }
        });

        // Validação de email institucional
        document.getElementById('user-email').addEventListener('blur', function() {
            const email = this.value;
            if (email && !email.endsWith('@fatec.sp.gov.br')) {
                this.setCustomValidity('Por favor, use um email institucional da Fatec (@fatec.sp.gov.br)');
            } else {
                this.setCustomValidity('');
            }
        });

        // Validação de matrícula (5 ou 13 dígitos dependendo do cargo)
        const matriculaInput = document.getElementById('user-matricula');
        const roleSelect = document.getElementById('user-role');

        roleSelect.addEventListener('change', function() {
            const role = this.value;
            if (role === 'professor') {
                matriculaInput.maxLength = 5;
                matriculaInput.placeholder = '5 dígitos (professor)';
                matriculaInput.pattern = '[0-9]{5}';
            } else {
                matriculaInput.maxLength = 13;
                matriculaInput.placeholder = '13 dígitos (suporte/admin)';
                matriculaInput.pattern = '[0-9]{13}';
            }
        });

        matriculaInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, ''); // Apenas números

            const role = roleSelect.value;
            const maxLength = role === 'professor' ? 5 : 13;

            if (this.value.length > maxLength) {
                this.value = this.value.slice(0, maxLength);
            }
        });
    }

    async function createUser(userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (data.success) {
                showCustomAlert('success', 'Usuário Criado', data.message || 'O usuário foi criado com sucesso.');
            } else {
                showCustomAlert('error', 'Erro', data.message || 'Não foi possível criar o usuário.');
            }

        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao criar usuário. Tente novamente.');
        }
    }

    async function updateUser(userId, userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (data.success) {
                showCustomAlert('success', 'Usuário Atualizado', data.message || 'O usuário foi atualizado com sucesso.');
            } else {
                showCustomAlert('error', 'Erro', data.message || 'Não foi possível atualizar o usuário.');
            }

        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao atualizar usuário. Tente novamente.');
        }
    }

    // =========================
    // Sistema de Alertas Padronizado
    // =========================
    function showCustomAlert(type, title, message, buttons = []) {
        console.log('🔔 [ALERT] Criando alerta:', type, title);
        console.log('🔔 [ALERT] Botões:', buttons);

        const alertOverlay = document.createElement('div');
        alertOverlay.className = `alert-overlay alert-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const buttonHTML = buttons.length > 0 ? 
            `<div class="alert-actions">
                ${buttons.map((btn, index) => `
                    <button class="alert-btn alert-btn-${btn.action}" data-index="${index}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>` : '';

        alertOverlay.innerHTML = `
            <div class="alert-modal">
                <div class="alert-icon">
                    <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                </div>
                <h3 class="alert-title">${title}</h3>
                <div class="alert-message">${message}</div>
                ${buttonHTML}
            </div>
        `;

        document.body.appendChild(alertOverlay);
        console.log('🔔 [ALERT] Alerta adicionado ao DOM');

        // Event listeners para botões
        alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const index = parseInt(this.dataset.index);
                const buttonConfig = buttons[index];

                console.log('🔔 [ALERT] Botão clicado:', buttonConfig.text);
                console.log('🔔 [ALERT] Index:', index);
                console.log('🔔 [ALERT] Tem callback?', !!buttonConfig.callback);

                if (buttonConfig && buttonConfig.callback) {
                    console.log('🔔 [ALERT] Executando callback...');
                    buttonConfig.callback();
                }

                console.log('🔔 [ALERT] Removendo alerta...');
                alertOverlay.remove();
            });
        });

        // Fechar ao clicar fora ou pressionar ESC
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) {
                console.log('🔔 [ALERT] Fechado clicando fora');
                alertOverlay.remove();
            }
        });

        const escapeHandler = function(e) {
            if (e.key === 'Escape') {
                console.log('🔔 [ALERT] Fechado com ESC');
                alertOverlay.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);

        // Mostrar com animação
        setTimeout(() => {
            alertOverlay.classList.add('visible');
            console.log('🔔 [ALERT] Alerta visível');
        }, 10);
    }

    // =========================
    // Paginação
    // =========================
    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationEl = document.getElementById('pagination');

        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;

        // Event listeners da paginação
        paginationEl.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentPage = parseInt(e.currentTarget.dataset.page);
                renderUsers();
            });
        });
    }

    // =========================
    // Utilitários
    // =========================
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        fetchAllUsers();
        setupFormHandlers();

        // Event listeners dos filtros
        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        filterRole.addEventListener('change', (e) => {
            activeFilters.role = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        filterStatus.addEventListener('change', (e) => {
            activeFilters.status = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterRole.value = '';
            filterStatus.value = '';
            activeFilters = { search: '', role: '', status: '' };
            currentPage = 1;
            renderUsers();
        });

        exportBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Exportar Usuários', 'A funcionalidade de exportação será implementada em breve.');
        });

        // Event listeners dos modais
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                userDetailsModal.classList.remove('active');
                userFormModal.classList.remove('active');
            });
        });

        [userDetailsModal, userFormModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        editUserBtn.addEventListener('click', () => {
            const userId = currentEditingUserId;
            userDetailsModal.classList.remove('active');
            if (userId) {
                editUser(userId);
            }
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userDetailsModal.classList.remove('active');
                userFormModal.classList.remove('active');
            }
        });
    }

    // Iniciar aplicação
    init();

    console.log('✅ Gerenciar Usuários - Admin inicializado com sucesso!');
});