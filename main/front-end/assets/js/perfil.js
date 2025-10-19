document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const photoInput = document.getElementById('photo-input');
    const profilePreview = document.getElementById('profile-preview');
    const removePhotoBtn = document.getElementById('remove-photo');
    const personalDataForm = document.getElementById('personal-data-form');
    const passwordForm = document.getElementById('password-form');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // Foto de Perfil
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                profilePreview.src = event.target.result;
                // Aqui você pode adicionar código para salvar a imagem no servidor
            };
            reader.readAsDataURL(file);
        }
    });
    
    removePhotoBtn.addEventListener('click', function() {
        profilePreview.src = '../../assets/images/default-avatar.png';
        photoInput.value = '';
        // Aqui você pode adicionar código para remover a imagem no servidor
    });
    
    // Mostrar/Esconder Senha
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Formulário de Dados Pessoais
    personalDataForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validação do telefone
        const phone = document.getElementById('phone');
        if (!phone.validity.valid) {
            alert('Por favor, insira um número de telefone válido no formato (XX) XXXXX-XXXX');
            return;
        }
        
        // Aqui você pode adicionar código para salvar os dados no servidor
        console.log('Dados pessoais atualizados:', {
            registration: document.getElementById('registration').value,
            fullname: document.getElementById('fullname').value,
            email: document.getElementById('email').value,
            birthdate: document.getElementById('birthdate').value,
            phone: document.getElementById('phone').value
        });
        
        alert('Dados pessoais atualizados com sucesso!');
    });
    
    // Formulário de Senha
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validações
        if (newPassword.length < 6) {
            alert('A nova senha deve ter no mínimo 6 caracteres');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem');
            return;
        }
        
        // Simulação de verificação da senha atual (substituir por chamada real à API)
        if (currentPassword !== "senha_atual_secreta") { // Isso é apenas para demonstração
            alert('Senha atual incorreta');
            return;
        }

        // Simulação de atualização da senha (substituir por chamada real à API)
        console.log('Senha alterada para:', newPassword);
        
        // Feedback visual
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Senha alterada!';
        submitBtn.disabled = true;
        
        // Resetar formulário e botão após 3 segundos
        setTimeout(() => {
            passwordForm.reset();
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
        }, 3000);
    });

    // Máscara para telefone
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        const value = this.value.replace(/\D/g, '');
        if (value.length > 0) {
            this.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
        }
    });

    // Carregar dados do usuário (simulação)
    function loadUserData() {
        // Em uma aplicação real, isso viria de uma API
        const userData = {
            registration: '12345',
            fullname: 'Carlos Alexandre Andrade De Sousa',
            email: 'carlos.sousa25@fatec.sp.gov.br',
            birthdate: '2007-06-04',
            phone: '(11) 98765-4321',
            photo: '../../assets/images/default-avatar.png'
        };

        // Preencher formulário
        document.getElementById('registration').value = userData.registration;
        document.getElementById('fullname').value = userData.fullname;
        document.getElementById('email').value = userData.email;
        document.getElementById('birthdate').value = userData.birthdate;
        document.getElementById('phone').value = userData.phone;
        profilePreview.src = userData.photo;
    }

    // Atualizar navbar com foto do perfil
    function updateNavbarProfile() {
        const navProfileImg = document.querySelector('.profile-dropdown .profile-avatar');
        navProfileImg.src = profilePreview.src;
    }

    // Inicialização
    loadUserData();

    // Observar mudanças na foto para atualizar navbar
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'src') {
                updateNavbarProfile();
            }
        });
    });

    observer.observe(profilePreview, {
        attributes: true
    });
});