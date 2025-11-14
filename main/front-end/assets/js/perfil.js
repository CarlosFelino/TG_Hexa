// perfil.js - VERSÃO MELHORADA (Universal para todos os usuários)
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Elementos do DOM
    // =========================
    const photoInput = document.getElementById('photo-input');
    const profilePreview = document.getElementById('profile-preview');
    const removePhotoBtn = document.getElementById('remove-photo');
    const personalDataForm = document.getElementById('personal-data-form');
    const passwordForm = document.getElementById('password-form');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // =========================
    // Configuração Inicial
    // =========================
    function init() {
        setupEventListeners();
        loadUserData();
        setupPhoneMask();
    }

    function setupEventListeners() {
        // Foto de Perfil
        photoInput.addEventListener('change', handlePhotoUpload);
        removePhotoBtn.addEventListener('click', handleRemovePhoto);
        
        // Mostrar/Esconder Senha
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', togglePasswordVisibility);
        });
        
        // Formulários
        personalDataForm.addEventListener('submit', handlePersonalDataSubmit);
        passwordForm.addEventListener('submit', handlePasswordSubmit);
        
        // Configurações (apenas admin)
        const settingsSwitches = document.querySelectorAll('.switch input');
        settingsSwitches.forEach(switchEl => {
            switchEl.addEventListener('change', handleSettingChange);
        });
    }

    // =========================
    // Foto de Perfil
    // =========================
    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validações
        if (!file.type.startsWith('image/')) {
            showAlert('error', 'Por favor, selecione uma imagem válida.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showAlert('error', 'A imagem deve ter no máximo 2MB.');
            return;
        }

        // Preview da imagem
        const reader = new FileReader();
        reader.onload = function(event) {
            profilePreview.src = event.target.result;
            updateNavbarProfile();
            showAlert('success', 'Foto alterada com sucesso!');
            
            // Aqui você pode adicionar código para salvar a imagem no servidor
            // saveProfilePhoto(file);
        };
        reader.readAsDataURL(file);
    }

    function handleRemovePhoto() {
        const defaultAvatar = '../../assets/images/default-avatar.png';
        profilePreview.src = defaultAvatar;
        photoInput.value = '';
        updateNavbarProfile();
        showAlert('success', 'Foto removida com sucesso!');
        
        // Aqui você pode adicionar código para remover a imagem no servidor
        // removeProfilePhoto();
    }

    // =========================
    // Senha
    // =========================
    function togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // =========================
    // Formulário de Dados Pessoais
    // =========================
    async function handlePersonalDataSubmit(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Validações
        if (!validatePersonalData()) {
            return;
        }

        try {
            // Estado de loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            submitBtn.disabled = true;

            // Simular requisição (substituir por API real)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const formData = {
                registration: document.getElementById('registration').value,
                fullname: document.getElementById('fullname').value,
                email: document.getElementById('email').value,
                birthdate: document.getElementById('birthdate').value,
                phone: document.getElementById('phone').value,
                department: document.getElementById('department')?.value // Apenas admin
            };

            console.log('Dados pessoais atualizados:', formData);
            
            // Atualizar navbar
            updateUserInfo(formData);
            
            showAlert('success', 'Dados pessoais atualizados com sucesso!');

        } catch (error) {
            showAlert('error', 'Erro ao salvar dados. Tente novamente.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function validatePersonalData() {
        const phone = document.getElementById('phone');
        const email = document.getElementById('email');
        
        if (!phone.validity.valid) {
            showAlert('error', 'Por favor, insira um número de telefone válido no formato (XX) XXXXX-XXXX');
            phone.focus();
            return false;
        }

        if (!email.validity.valid) {
            showAlert('error', 'Por favor, insira um email institucional válido.');
            email.focus();
            return false;
        }

        return true;
    }

    // =========================
    // Formulário de Senha
    // =========================
    async function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Validações
        if (!validatePassword()) {
            return;
        }

        try {
            // Estado de loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Alterando...';
            submitBtn.disabled = true;

            // Simular requisição (substituir por API real)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const formData = {
                currentPassword: document.getElementById('current-password').value,
                newPassword: document.getElementById('new-password').value
            };

            console.log('Senha alterada para:', formData.newPassword);
            
            // Feedback visual
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Senha alterada!';
            
            // Resetar formulário após 2 segundos
            setTimeout(() => {
                this.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Esconder senhas novamente
                document.querySelectorAll('.password-field input').forEach(input => {
                    input.type = 'password';
                });
                document.querySelectorAll('.toggle-password i').forEach(icon => {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                });
            }, 2000);

        } catch (error) {
            showAlert('error', 'Erro ao alterar senha. Tente novamente.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function validatePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword.length < 6) {
            showAlert('error', 'A nova senha deve ter no mínimo 6 caracteres.');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('error', 'As senhas não coincidem.');
            return false;
        }

        // Simulação de verificação (substituir por API real)
        if (currentPassword !== "senha_atual_secreta") {
            showAlert('error', 'Senha atual incorreta.');
            return false;
        }

        return true;
    }

    // =========================
    // Configurações (Apenas Admin)
    // =========================
    function handleSettingChange(e) {
        const settingId = e.target.id;
        const isEnabled = e.target.checked;
        
        console.log(`Configuração ${settingId} ${isEnabled ? 'ativada' : 'desativada'}`);
        
        // Aqui você pode adicionar código para salvar a configuração no servidor
        // saveSetting(settingId, isEnabled);
        
        showAlert('success', `Configuração ${isEnabled ? 'ativada' : 'desativada'} com sucesso!`);
    }

    // =========================
    // Utilitários
    // =========================
    function loadUserData() {
        // Determinar tipo de usuário baseado na URL ou classe do body
        const isAdmin = document.body.classList.contains('admin-dashboard');
        const isProfessor = document.body.classList.contains('professor-dashboard');
        
        let userData;
        
        if (isAdmin) {
            userData = {
                registration: 'ADM001',
                fullname: 'Administrador do Sistema',
                email: 'admin@fatec.sp.gov.br',
                birthdate: '1985-03-15',
                phone: '(11) 91234-5678',
                department: 'Tecnologia da Informação',
                photo: '../../assets/images/default-avatar.png'
            };
        } else if (isProfessor) {
            userData = {
                registration: '12345',
                fullname: 'Carlos Alexandre Andrade De Sousa',
                email: 'carlos.sousa25@fatec.sp.gov.br',
                birthdate: '2007-06-04',
                phone: '(11) 98765-4321',
                photo: '../../assets/images/default-avatar.png'
            };
        } else {
            // Suporte (caso exista)
            userData = {
                registration: 'SUP001',
                fullname: 'Técnico de Suporte',
                email: 'suporte@fatec.sp.gov.br',
                birthdate: '1990-01-01',
                phone: '(11) 94567-8901',
                department: 'Suporte Técnico',
                photo: '../../assets/images/default-avatar.png'
            };
        }

        // Preencher formulário
        document.getElementById('registration').value = userData.registration;
        document.getElementById('fullname').value = userData.fullname;
        document.getElementById('email').value = userData.email;
        document.getElementById('birthdate').value = userData.birthdate;
        document.getElementById('phone').value = userData.phone;
        
        if (userData.department) {
            const departmentField = document.getElementById('department');
            if (departmentField) departmentField.value = userData.department;
        }
        
        profilePreview.src = userData.photo;
        updateNavbarProfile();
        updateUserInfo(userData);
    }

    function setupPhoneMask() {
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', function(e) {
            const value = this.value.replace(/\D/g, '');
            if (value.length > 0) {
                this.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
            }
        });
    }

    function updateNavbarProfile() {
        const navProfileImg = document.querySelector('.profile-dropdown .profile-avatar');
        if (navProfileImg) {
            navProfileImg.src = profilePreview.src;
        }
    }

    function updateUserInfo(userData) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        if (userName) userName.textContent = userData.fullname;
        if (userEmail) userEmail.textContent = userData.email;
    }

    function showAlert(type, message) {
        // Usar o sistema de alertas padronizado se disponível
        if (typeof showCustomAlert === 'function') {
            showCustomAlert(type, type === 'error' ? 'Erro' : 'Sucesso', message);
        } else {
            // Fallback simples
            alert(message);
        }
    }

    // =========================
    // Inicialização
    // =========================
    init();
    console.log('✅ Perfil - Sistema inicializado com sucesso!');
});