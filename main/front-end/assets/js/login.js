document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const recoveryForm = document.getElementById('recoveryForm');
    const resetForm = document.getElementById('resetForm');
    const recoveryModal = document.getElementById('recoveryModal');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const modalClose = document.querySelector('.modal-close');
    const typeButtons = document.querySelectorAll('.type-btn');
    const showPasswordBtn = document.querySelector('.show-password');
    const passwordInput = document.getElementById('password');
    const recoveryFeedback = document.getElementById('recoveryFeedback');
    const resetFeedback = document.getElementById('resetFeedback');
    const emailInput = document.getElementById('email');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const modalSubtitle = document.getElementById('modalSubtitle');

    let isLoading = false;

    // ================== TOGGLE DE TIPO ==================
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isLoading) return;
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ================== SHOW/HIDE SENHA ==================
    if (showPasswordBtn && passwordInput) {
        showPasswordBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // ================== MODAL DE RECUPERAÇÃO ==================
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (isLoading) return;
        showRecoveryModal();
    });

    modalClose.addEventListener('click', closeModal);
    recoveryModal.addEventListener('click', function(e) {
        if (e.target === recoveryModal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && recoveryModal.classList.contains('active')) closeModal();
    });

    function showRecoveryModal() {
        recoveryForm.style.display = 'block';
        resetForm.style.display = 'none';
        modalSubtitle.textContent = "Digite seu email institucional para receber o link de recuperação";
        recoveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        recoveryEmailInput.focus();
    }

    function showResetModal() {
        recoveryForm.style.display = 'none';
        resetForm.style.display = 'block';
        modalSubtitle.textContent = "Digite sua nova senha abaixo";
        recoveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        newPasswordInput.focus();
    }

    // ================== VALIDAÇÃO DE EMAIL ==================
    if (emailInput) emailInput.addEventListener('input', () => validateEmailInput(emailInput));
    if (recoveryEmailInput) recoveryEmailInput.addEventListener('input', () => validateEmailInput(recoveryEmailInput));

    // mudança feita por vitoria
    // ================== AUTOCOMPLETE DE DOMÍNIO ==================
    // 💡 IMPORTANTE: A lógica de autocompletar vai AQUI DENTRO do único DOMContentLoaded

    if (emailInput) { // Verifica se o elemento existe antes de adicionar o listener
        const DOMAIN_FATEC = "fatec.sp.gov.br";
        const DOMAIN_PROTON = "proton.me";

        emailInput.addEventListener('input', function() {
            let currentValue = this.value;

            // Encontra a posição do '@'
            const atIndex = currentValue.indexOf('@');

            // Se não houver '@', não faz nada
            if (atIndex === -1) {
                return;
            }

            const domainPart = currentValue.substring(atIndex + 1);

            // --- 1. Lógica: Digitar "@" (domínio vazio) -> Completa com FATEC ---
            if (domainPart === '') {
                this.value = currentValue + DOMAIN_FATEC;
                this.focus(); 
                return; 
            }

            // --- 2. Lógica: Apagou/Quebrou o FATEC -> Completa com PROTON ---
            const expectedFatecDomain = DOMAIN_FATEC; 

            // Se o domínio atual NÃO é o FATEC COMPLETO
            if (domainPart !== expectedFatecDomain) {

                // Se o domínio atual NÃO é o PROTON COMPLETO (para não criar um loop)
                if (domainPart !== DOMAIN_PROTON) {

                    // Condição: Se a parte digitada APÓS o @ começa com as letras do FATEC,
                    // mas não é o Fatec completo (indicando que foi parcialmente apagado)
                    if (expectedFatecDomain.startsWith(domainPart) && domainPart.length < expectedFatecDomain.length) {

                        // Substitui a parte do domínio pelo PROTON
                        this.value = currentValue.substring(0, atIndex + 1) + DOMAIN_PROTON;
                        this.focus();
                        return;
                    }
                }
            }
        });
    }

    // ================== AUTOCOMPLETE PARA E-MAIL DE RECUPERAÇÃO ==================
    if (recoveryEmailInput) { // Verifica se o elemento de recuperação existe
        const DOMAIN_PROTON = "proton.me";

        recoveryEmailInput.addEventListener('input', function() {
            let currentValue = this.value;

            // Verifica se o valor atual termina com '@'
            if (currentValue.endsWith('@')) {
                // Se sim, completa com o domínio PROTON
                this.value = currentValue + DOMAIN_PROTON;

                // Move o cursor para o final para que a pessoa possa continuar
                this.focus();
                return; 
            }
        });
    }

    // fim da mudança feita por vitoria

    // ================== LOGIN ==================
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isLoading) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!validateFatecEmail(email)) return showError('Por favor, use seu email institucional (@fatec.sp.gov.br) ou o email especial autorizado');
            if (password.length < 6) return showError('A senha deve ter pelo menos 6 caracteres');

            setLoading(true);
            try {
                const data = await authenticateUser(email, password);
                const user = data.user;
                const token = data.token;

                localStorage.setItem('authToken', token);
                localStorage.setItem('currentUser', JSON.stringify(user));

                redirectUser(user.role);
            } catch (error) {
                showError(error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== RECUPERAÇÃO DE SENHA ==================
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isLoading) return;

            const email = recoveryEmailInput.value.trim();
            if (!validateFatecEmail(email)) return showRecoveryError('Por favor, use seu email institucional (@fatec.sp.gov.br) ou o email especial autorizado');

            setLoading(true);
            try {
                await requestPasswordRecovery(email);
                showRecoverySuccess(`Link de recuperação enviado para: ${email}`);
                recoveryForm.reset();
                setTimeout(() => closeModal(), 3000);
            } catch (error) {
                showRecoveryError(error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== RESET DE SENHA VIA TOKEN ==================
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken && resetForm) {
        showResetModal();

        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            resetFeedback.style.display = 'none';

            const novaSenha = newPasswordInput.value.trim();
            const confirmarSenha = confirmPasswordInput.value.trim();

            if (novaSenha.length < 6) {
                resetFeedback.textContent = "A senha deve ter pelo menos 6 caracteres.";
                resetFeedback.className = 'error';
                resetFeedback.style.display = 'block';
                return;
            }

            if (novaSenha !== confirmarSenha) {
                resetFeedback.textContent = "As senhas não coincidem.";
                resetFeedback.className = 'error';
                resetFeedback.style.display = 'block';
                return;
            }

            setLoading(true);
            try {
                await redefinirSenha(resetToken, novaSenha);
                resetFeedback.textContent = "Senha redefinida com sucesso!";
                resetFeedback.className = 'success';
                resetFeedback.style.display = 'block';
                resetForm.reset();
                setTimeout(() => closeModal(), 3000);
            } catch (err) {
                resetFeedback.textContent = err.message;
                resetFeedback.className = 'error';
                resetFeedback.style.display = 'block';
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== FUNÇÕES AUXILIARES ==================
    async function authenticateUser(email, senha) {
        const resp = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Falha no login');
        }
        return await resp.json();
    }

    async function requestPasswordRecovery(email) {
        const resp = await fetch('/api/recuperar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Erro ao solicitar recuperação');
        }
        return true;
    }

    async function redefinirSenha(token, novaSenha) {
        const resp = await fetch('/api/redefinir-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, novaSenha })
        });
        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Falha ao redefinir senha');
        }
        return true;
    }

    function validateFatecEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@fatec\.sp\.gov\.br$/;
        return regex.test(email) || email === "conclusaovitoria@proton.me";
    }

    function validateEmailInput(input) {
        input.classList.toggle('invalid', input.value && !validateFatecEmail(input.value));
        recoveryFeedback.style.display = 'none';
    }

    function showError(msg) {
        let el = document.querySelector('.login-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'login-error';
            loginForm.insertBefore(el, loginForm.firstChild);
        }
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 5000);
    }

    function showRecoveryError(msg) {
        recoveryFeedback.textContent = msg;
        recoveryFeedback.className = 'error';
        recoveryFeedback.style.display = 'block';
    }

    function showRecoverySuccess(msg) {
        recoveryFeedback.textContent = msg;
        recoveryFeedback.className = 'success';
        recoveryFeedback.style.display = 'block';
    }

    function setLoading(loading) {
        isLoading = loading;
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(btn => {
            if (loading) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            } else {
                btn.disabled = false;
                if (btn === loginForm?.querySelector('button[type="submit"]')) {
                    btn.innerHTML = '<span>Entrar</span><i class="fas fa-arrow-right"></i>';
                } else if (btn === recoveryForm?.querySelector('button[type="submit"]')) {
                    btn.innerHTML = '<span>Enviar Link</span><i class="fas fa-paper-plane"></i>';
                } else if (btn === resetForm?.querySelector('button[type="submit"]')) {
                    btn.innerHTML = '<span>Redefinir Senha</span>';
                }
            }
        });
    }

    function closeModal() {
        recoveryModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        recoveryFeedback.style.display = 'none';
        resetFeedback.style.display = 'none';
        recoveryForm.reset();
        resetForm.reset();
    }

    function redirectUser(role) {
        const routes = {
            'professor': 'pages/professor/painel-professor.html',
            'suporte': 'pages/suporte/painel-suporte.html'
        };
        if (!routes[role]) return showError('Role de usuário desconhecido');
        window.location.href = routes[role];
    }

    function protegerRota() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    if (window.location.pathname.includes('pages/')) protegerRota();
});
