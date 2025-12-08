// gerenciar-usuarios.js - VERSÃO COMPLETA CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = "../../login.html";
        return;
    }

    const usersTableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('search-users');
    const filterRole = document.getElementById('filter-role');
    const filterStatus = document.getElementById('filter-status');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addUserBtn = document.getElementById('add-user-btn');
    const exportBtn = document.getElementById('export-users');
    const userDetailsModal = document.getElementById('user-details-modal');
    const userFormModal = document.getElementById('user-form-modal');
    const userForm = document.getElementById('user-form');
    const userFormTitle = document.getElementById('user-form-title');
    const saveUserBtn = document.getElementById('save-user-btn');
    const editUserBtn = document.getElementById('edit-user-btn');
    const passwordField = document.getElementById('password-field');
    const totalUsersEl = document.getElementById('total-users');
    const totalProfessorsEl = document.getElementById('total-professors');
    const totalSupportEl = document.getElementById('total-support');
    const totalAdminsEl = document.getElementById('total-admins');

    let activeFilters = { search: '', role: '', status: '' };
    let usersData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentEditingUserId = null;
    const API_URL = "https://59474a86-d1ec-4d8b-be95-f13d54b8921d-00-2dfvvk3i4x3oc.riker.replit.dev";

    // =========================
    // 🔧 GERENCIADOR DE MODAIS (SIMPLIFICADO E CORRIGIDO)
    // =========================
    const modalManager = {
        // Para modais dinâmicos (alertas)
        activeModals: new Set(),

        // Cria e mostra modal dinâmico
        createAlert(type, title, message, buttons = []) {
            const alertOverlay = document.createElement('div');
            alertOverlay.className = 'alert-overlay';

            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };

            const buttonHTML = buttons.length > 0 ? 
                `<div class="alert-actions">
                    ${buttons.map((btn, i) => `
                        <button class="alert-btn alert-btn-${btn.action || 'secondary'}" data-index="${i}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>` : '';

            alertOverlay.innerHTML = `
                <div class="alert-modal">
                    <div class="alert-icon"><i class="fas ${icons[type] || 'fa-info-circle'}"></i></div>
                    <h3 class="alert-title">${title}</h3>
                    <div class="alert-message">${message}</div>
                    ${buttonHTML}
                </div>
            `;

            document.body.appendChild(alertOverlay);
            this.activeModals.add(alertOverlay);

            // Animar entrada
            setTimeout(() => {
                alertOverlay.classList.add('visible');
                alertOverlay.classList.add(`alert-${type}`);
            }, 10);

            // Configurar eventos
            this.setupAlertEvents(alertOverlay, buttons);

            // Auto-fechar se não tiver botões
            if (buttons.length === 0) {
                setTimeout(() => this.closeAlert(alertOverlay), 3000);
            }

            return alertOverlay;
        },

        // Configurar eventos para alertas
        setupAlertEvents(alertOverlay, buttons) {
            // Fechar ao clicar fora
            alertOverlay.addEventListener('click', (e) => {
                if (e.target === alertOverlay) {
                    this.closeAlert(alertOverlay);
                }
            });

            // Configurar botões
            alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    const buttonConfig = buttons[index];

                    this.closeAlert(alertOverlay);

                    if (buttonConfig?.callback) {
                        setTimeout(() => buttonConfig.callback(), 100);
                    }
                });
            });

            // ESC para fechar
            const escHandler = (e) => {
                if (e.key === 'Escape' && this.activeModals.has(alertOverlay)) {
                    this.closeAlert(alertOverlay);
                }
            };

            alertOverlay.dataset.escHandler = 'true';
            document.addEventListener('keydown', escHandler);

            // Limpar listener quando fechar
            alertOverlay.addEventListener('modal-closed', () => {
                document.removeEventListener('keydown', escHandler);
            });
        },

        // Fechar alerta
        closeAlert(alertOverlay) {
            if (!this.activeModals.has(alertOverlay)) return;

            alertOverlay.classList.remove('visible');

            setTimeout(() => {
                if (alertOverlay.parentNode) {
                    alertOverlay.parentNode.removeChild(alertOverlay);
                }
                this.activeModals.delete(alertOverlay);

                // Disparar evento de fechamento
                alertOverlay.dispatchEvent(new Event('modal-closed'));
            }, 300);
        },

        // Fechar todos os alertas
        closeAllAlerts() {
            this.activeModals.forEach(modal => this.closeAlert(modal));
        },

        // =========================
        // Para modais estáticos (user-details, user-form)
        // =========================

        // Abrir modal estático
        openStaticModal(modal) {
            if (!modal) return;

            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        },

        // Fechar modal estático
        closeStaticModal(modal) {
            if (!modal) return;

            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        },

        // Setup para modais estáticos (DELEGATION!)
        setupStaticModals() {
            console.log('🔧 Configurando modais estáticos...');

            // DELEGAÇÃO DE EVENTOS - Corrigido!
            document.addEventListener('click', (e) => {
                // Botão X (modal-close)
                if (e.target.classList.contains('modal-close') || 
                    e.target.closest('.modal-close')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const modal = e.target.closest('.modal');
                    console.log('❌ Fechando modal via X:', modal?.id);
                    if (modal) {
                        this.closeStaticModal(modal);
                    }
                }

                // Botões "Fechar" ou "Cancelar" (modal-close-btn)
                if (e.target.classList.contains('modal-close-btn') || 
                    e.target.closest('.modal-close-btn')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const modal = e.target.closest('.modal');
                    console.log('❌ Fechando modal via botão:', modal?.id);
                    if (modal) {
                        this.closeStaticModal(modal);
                    }
                }

                // Botão "Cancelar" específico no modal de formulário
                if (e.target.id === 'cancel-feedback' || 
                    e.target.closest('#cancel-feedback')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const modal = e.target.closest('.modal');
                    if (modal) {
                        this.closeStaticModal(modal);
                    }
                }
            });

            // Fechar clicando fora - CORRIGIDO!
            document.addEventListener('click', (e) => {
                // Verifica se o clique foi em um modal E se não foi em seu conteúdo
                if (e.target.classList.contains('modal')) {
                    console.log('🎯 Clicou fora do conteúdo do modal:', e.target.id);
                    this.closeStaticModal(e.target);
                }
            });

            // Fechar com ESC - CORRIGIDO!
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    console.log('⎋ ESC pressionado - Fechando modais');
                    const openModals = document.querySelectorAll('.modal.active');
                    openModals.forEach(modal => {
                        this.closeStaticModal(modal);
                    });

                    // Também fecha alertas abertos
                    this.closeAllAlerts();
                }
            });

            console.log('✅ Eventos de modal configurados via delegação');
        }
    };

    // =========================
    // 🔧 VALIDAÇÃO DE MATRÍCULA POR CARGO
    // =========================
    function setupMatriculaValidation() {
        const matriculaInput = document.getElementById('user-matricula');
        const roleSelect = document.getElementById('user-role');
        const matriculaError = document.createElement('small');

        matriculaError.style.color = '#F44336';
        matriculaError.style.fontSize = '0.85rem';
        matriculaError.style.marginTop = '0.25rem';
        matriculaError.style.display = 'none';

        if (matriculaInput && matriculaInput.parentNode) {
            matriculaInput.parentNode.appendChild(matriculaError);
        }

        function validateMatricula() {
            const matricula = matriculaInput.value.trim();
            const role = roleSelect.value;

            matriculaError.style.display = 'none';
            matriculaInput.style.borderColor = '';

            if (!matricula) return true;

            let isValid = false;
            let errorMsg = '';

            if (role === 'professor') {
                isValid = /^\d{5}$/.test(matricula);
                errorMsg = 'Matrícula de professor deve ter exatamente 5 dígitos';
            } else if (role === 'suporte') {
                isValid = /^\d{13}$/.test(matricula);
                errorMsg = 'Matrícula de suporte deve ter exatamente 13 dígitos';
            } else if (role === 'admin') {
                isValid = /^\d{5}$/.test(matricula) || /^\d{13}$/.test(matricula);
                errorMsg = 'Matrícula de admin deve ter 5 ou 13 dígitos';
            }

            if (!isValid && matricula) {
                matriculaError.textContent = errorMsg;
                matriculaError.style.display = 'block';
                matriculaInput.style.borderColor = '#F44336';
                return false;
            }

            return true;
        }

        if (matriculaInput && roleSelect) {
            matriculaInput.addEventListener('input', validateMatricula);
            roleSelect.addEventListener('change', validateMatricula);
        }

        return validateMatricula;
    }

    // =========================
    // 🔧 AUTOCOMPLETE DE EMAIL
    // =========================
    function setupEmailAutocomplete() {
        const emailInput = document.getElementById('user-email');
        if (!emailInput) return;

        const DOMAIN_FATEC = "fatec.sp.gov.br";
        const DOMAIN_PROTON = "proton.me";

        emailInput.addEventListener('input', function() {
            let currentValue = this.value;
            const atIndex = currentValue.indexOf('@');

            if (atIndex === -1) return;

            const domainPart = currentValue.substring(atIndex + 1);

            if (domainPart === '') {
                this.value = currentValue + DOMAIN_FATEC;
                this.setSelectionRange(this.value.length, this.value.length);
                return; 
            }

            const expectedFatecDomain = DOMAIN_FATEC; 

            if (domainPart !== expectedFatecDomain && domainPart !== DOMAIN_PROTON) {
                if (expectedFatecDomain.startsWith(domainPart) && domainPart.length < expectedFatecDomain.length) {
                    this.value = currentValue.substring(0, atIndex + 1) + DOMAIN_PROTON;
                    this.setSelectionRange(this.value.length, this.value.length);
                    return;
                }
            }
        });
    }

    // =========================
    // Buscar usuários
    // =========================
    async function fetchAllUsers() {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
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
            showCustomAlert('error', 'Erro', 'Não foi possível carregar os usuários.');
        }
    }

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

    function renderUsers() {
        let filteredUsers = [...usersData];

        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.matricula.toLowerCase().includes(searchTerm)
            );
        }

        if (activeFilters.role) filteredUsers = filteredUsers.filter(user => user.role === activeFilters.role);
        if (activeFilters.status) filteredUsers = filteredUsers.filter(user => user.status === activeFilters.status);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

        usersTableBody.innerHTML = '';

        if (paginatedUsers.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhum usuário encontrado
                    </td>
                </tr>
            `;
            return;
        }

        paginatedUsers.forEach(user => {
            const roleText = user.role === 'professor' ? 'Professor' : user.role === 'suporte' ? 'Suporte' : 'Administrador';
            const statusText = user.status === 'active' ? 'Ativo' : 'Inativo';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${user.matricula}</strong></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${roleText}</span></td>
                <td><span class="status-badge ${user.status}">${statusText}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table view" data-id="${user.id}"><i class="fas fa-eye"></i></button>
                        <button class="btn-table edit" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-table delete" data-id="${user.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        addTableEventListeners();
        renderPagination(filteredUsers.length);
    }

    function addTableEventListeners() {
        document.querySelectorAll('.btn-table.view').forEach(btn => {
            btn.addEventListener('click', (e) => showUserDetails(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-table.edit').forEach(btn => {
            btn.addEventListener('click', (e) => editUser(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-table.delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteUser(e.currentTarget.dataset.id));
        });
    }

    // =========================
    // Ações de usuário
    // =========================
    function showUserDetails(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        const roleText = user.role === 'professor' ? 'Professor' : user.role === 'suporte' ? 'Suporte' : 'Administrador';

        document.getElementById('modal-user-details').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><label>Matrícula:</label><span>${user.matricula}</span></div>
                <div class="detail-item"><label>Nome:</label><span>${user.name}</span></div>
                <div class="detail-item"><label>Email:</label><span>${user.email}</span></div>
                <div class="detail-item"><label>Cargo:</label><span class="role-badge ${user.role}">${roleText}</span></div>
                <div class="detail-item"><label>Status:</label><span class="status-badge ${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span></div>
                <div class="detail-item"><label>Data de Cadastro:</label><span>${formatDate(user.created_at)}</span></div>
            </div>
        `;

        currentEditingUserId = userId;
        modalManager.openStaticModal(userDetailsModal);
    }

    function editUser(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        currentEditingUserId = userId;
        userFormTitle.textContent = 'Editar Usuário';
        document.getElementById('user-matricula').value = user.matricula;
        document.getElementById('user-matricula').disabled = true;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;
        passwordField.style.display = 'none';
        document.getElementById('user-password').required = false;

        modalManager.openStaticModal(userFormModal);
    }

    function deleteUser(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        if (user.role === 'admin' || user.role === 'suporte') {
            showPasswordConfirmation(userId, user);
        } else {
            modalManager.createAlert('warning', 'Confirmar Exclusão', 
                `Tem certeza que deseja excluir <strong>${user.name}</strong>?`,
                [
                    { text: 'Cancelar', action: 'secondary' },
                    { text: 'Excluir', action: 'primary', callback: () => confirmDelete(userId, null) }
                ]
            );
        }
    }

    function showPasswordConfirmation(userId, user) {
        const alertOverlay = modalManager.createAlert('warning', 'Confirmação de Segurança', 
            `Excluindo <strong>${user.role === 'admin' ? 'Administrador' : 'Suporte'}</strong>: <strong>${user.name}</strong>`,
            []
        );

        // Adicionar campo de senha ao alerta
        const alertContent = alertOverlay.querySelector('.alert-message');
        alertContent.innerHTML = `
            <div style="margin-bottom: 1rem;">
                Excluindo <strong>${user.role === 'admin' ? 'Administrador' : 'Suporte'}</strong>: <strong>${user.name}</strong>
            </div>
            <div style="margin: 1rem 0;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Sua Senha:</label>
                <input type="password" id="confirm-password" placeholder="Digite sua senha" 
                    style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
            </div>
        `;

        // Adicionar botões personalizados
        const alertActions = document.createElement('div');
        alertActions.className = 'alert-actions';
        alertActions.innerHTML = `
            <button class="alert-btn alert-btn-secondary" id="cancel-delete-btn">Cancelar</button>
            <button class="alert-btn alert-btn-primary" id="confirm-delete-btn">
                <i class="fas fa-trash"></i> Confirmar
            </button>
        `;

        alertOverlay.querySelector('.alert-modal').appendChild(alertActions);

        // Configurar eventos
        const passwordInput = alertOverlay.querySelector('#confirm-password');
        setTimeout(() => passwordInput.focus(), 100);

        alertOverlay.querySelector('#cancel-delete-btn').addEventListener('click', () => {
            modalManager.closeAlert(alertOverlay);
        });

        alertOverlay.querySelector('#confirm-delete-btn').addEventListener('click', () => {
            const senha = passwordInput.value.trim();
            if (!senha) {
                passwordInput.style.borderColor = '#F44336';
                return;
            }
            modalManager.closeAlert(alertOverlay);
            confirmDelete(userId, senha);
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                alertOverlay.querySelector('#confirm-delete-btn').click();
            }
        });
    }

    // =========================
    // Modal de Reatribuição
    // =========================
    function showReassignmentModal(userId, data) {
        const alertOverlay = modalManager.createAlert('warning', 'Reatribuir Ordens', 
            `<p style="margin-bottom: 1.5rem;">${data.message}</p>`,
            []
        );

        const ordensHTML = data.ordens.map(ordem => `
            <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid #ddd;">
                <strong style="color: var(--secondary);">${ordem.codigo}</strong>
                <p style="margin: 0.25rem 0; font-size: 0.9rem;">${ordem.titulo}</p>
                <select class="select-responsavel" data-ordem-id="${ordem.id}" 
                    style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; margin-top: 0.5rem;">
                    <option value="">Selecione um técnico...</option>
                    ${data.suporteDisponiveis.map(s => `<option value="${s.id}">${s.nome} (${s.matricula})</option>`).join('')}
                </select>
            </div>
        `).join('');

        const alertContent = alertOverlay.querySelector('.alert-message');
        alertContent.innerHTML = `
            <p style="margin-bottom: 1.5rem;">${data.message}</p>
            <div style="max-height: 300px; overflow-y: auto;">${ordensHTML}</div>
        `;

        const alertActions = document.createElement('div');
        alertActions.className = 'alert-actions';
        alertActions.style.marginTop = '1.5rem';
        alertActions.innerHTML = `
            <button class="alert-btn alert-btn-secondary" id="cancel-reassign">Cancelar</button>
            <button class="alert-btn alert-btn-primary" id="confirm-reassign">
                <i class="fas fa-check"></i> Reatribuir e Excluir
            </button>
        `;

        alertOverlay.querySelector('.alert-modal').appendChild(alertActions);

        // Configurar eventos
        alertOverlay.querySelector('#cancel-reassign').addEventListener('click', () => {
            modalManager.closeAlert(alertOverlay);
        });

        alertOverlay.querySelector('#confirm-reassign').addEventListener('click', async () => {
            const selects = alertOverlay.querySelectorAll('.select-responsavel');
            const reatribuicoes = [];
            let valido = true;

            selects.forEach(select => {
                if (!select.value) {
                    valido = false;
                    select.style.borderColor = '#F44336';
                } else {
                    reatribuicoes.push({
                        ordemId: parseInt(select.dataset.ordemId),
                        novoResponsavelId: parseInt(select.value)
                    });
                }
            });

            if (!valido) {
                modalManager.createAlert('warning', 'Atenção', 'Selecione um técnico para todas as ordens.');
                return;
            }

            const confirmBtn = alertOverlay.querySelector('#confirm-reassign');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

            try {
                for (const { ordemId, novoResponsavelId } of reatribuicoes) {
                    const res = await fetch(`${API_URL}/api/ordens/${ordemId}/atribuir`, {
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ responsavel_id: novoResponsavelId })
                    });

                    if (!res.ok) throw new Error(`Erro ao reatribuir ordem ${ordemId}`);
                }

                modalManager.closeAlert(alertOverlay);
                const user = usersData.find(u => u.id == userId);
                showPasswordConfirmation(userId, user);

            } catch (error) {
                console.error('❌ [REASSIGN] Erro:', error);
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Reatribuir e Excluir';
                modalManager.createAlert('error', 'Erro', 'Falha ao reatribuir. Tente novamente.');
            }
        });
    }

    // =========================
    // Confirmar Delete
    // =========================
    async function confirmDelete(userId, senhaAdmin) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: 'DELETE',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(senhaAdmin ? { senhaAdmin } : {})
            });

            const data = await res.json();

            if (data.success) {
                modalManager.createAlert('success', 'Sucesso', data.message);
                await fetchAllUsers();
            } else if (data.requireReassignment) {
                showReassignmentModal(userId, data);
            } else {
                modalManager.createAlert('error', 'Erro', data.message);
            }

        } catch (error) {
            console.error('❌ [DELETE] Erro:', error);
            modalManager.createAlert('error', 'Erro', 'Falha ao excluir usuário.');
        }
    }

    // =========================
    // Criar/Atualizar Usuário
    // =========================
    async function createUser(userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const data = await res.json();
            modalManager.createAlert(data.success ? 'success' : 'error', 
                data.success ? 'Sucesso' : 'Erro', data.message);
            if (data.success) await fetchAllUsers();
        } catch (error) {
            modalManager.createAlert('error', 'Erro', 'Falha ao criar usuário.');
        }
    }

    async function updateUser(userId, userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const data = await res.json();
            modalManager.createAlert(data.success ? 'success' : 'error', 
                data.success ? 'Sucesso' : 'Erro', data.message);
            if (data.success) await fetchAllUsers();
        } catch (error) {
            modalManager.createAlert('error', 'Erro', 'Falha ao atualizar usuário.');
        }
    }

    // Função auxiliar (mantida para compatibilidade)
    function showCustomAlert(type, title, message, buttons = []) {
        return modalManager.createAlert(type, title, message, buttons);
    }

    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationEl = document.getElementById('pagination');

        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;

        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentPage = parseInt(e.currentTarget.dataset.page);
                renderUsers();
            });
        });
    }

    function formatDate(dateString) {
        return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
    }

    // =========================
    // Formulário
    // =========================
    let validateMatriculaFn;

    function setupFormHandlers() {
        validateMatriculaFn = setupMatriculaValidation();
        setupEmailAutocomplete();

        addUserBtn.addEventListener('click', () => {
            currentEditingUserId = null;
            userFormTitle.textContent = 'Adicionar Novo Usuário';
            userForm.reset();
            document.getElementById('user-matricula').disabled = false;
            passwordField.style.display = 'block';
            document.getElementById('user-password').required = true;
            modalManager.openStaticModal(userFormModal);
        });

        saveUserBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Validar matrícula antes de enviar
            if (!validateMatriculaFn()) {
                modalManager.createAlert('warning', 'Atenção', 'Corrija a matrícula antes de continuar.');
                return;
            }

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
            if (password?.trim()) formData.password = password;

            if (currentEditingUserId) {
                await updateUser(currentEditingUserId, formData);
            } else {
                await createUser(formData);
            }

            modalManager.closeStaticModal(userFormModal);
        });

        if (editUserBtn) {
            editUserBtn.addEventListener('click', () => {
                modalManager.closeStaticModal(userDetailsModal);
                if (currentEditingUserId) {
                    editUser(currentEditingUserId);
                }
            });
        }
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        modalManager.setupStaticModals();
        fetchAllUsers();
        setupFormHandlers();

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

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                modalManager.createAlert('info', 'Exportar', 'Funcionalidade em breve.');
            });
        }
    }

    init();
    console.log('✅ Gerenciar Usuários inicializado com todas as correções!');
});