document.addEventListener('DOMContentLoaded', () => {
    // Preview da foto
    const photoInput = document.getElementById('photo-input');
    const profilePreview = document.getElementById('profile-preview');
    
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Mostrar/ocultar senha
    const showPasswordBtns = document.querySelectorAll('.show-password');
    showPasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Validação do formulário
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword.length < 8) {
                alert('A nova senha deve ter no mínimo 8 caracteres');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('As senhas não coincidem');
                return;
            }
            
            // Simular envio (substituir por AJAX)
            alert('Senha alterada com sucesso!');
            passwordForm.reset();
        });
    }
});