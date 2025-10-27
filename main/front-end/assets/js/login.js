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

    // ================== INICIALIZAÇÃO ==================
    initializePasswordStrength();
    checkResetToken();

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
        resetForm.classList.remove('visible');
        modalSubtitle.textContent = "Digite seu email institucional para receber o link de recuperação";
        recoveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        recoveryEmailInput.focus();
    }

    function showResetModal() {
        recoveryForm.style.display = 'none';
        resetForm.style.display = 'block';
        resetForm.classList.add('visible');
        modalSubtitle.textContent = "Crie uma nova senha para sua conta";
        recoveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        newPasswordInput.focus();
    }

    // ================== VALIDAÇÃO DE EMAIL ==================
    if (emailInput) emailInput.addEventListener('input', () => validateEmailInput(emailInput));
    if (recoveryEmailInput) recoveryEmailInput.addEventListener('input', () => validateEmailInput(recoveryEmailInput));

    // ================== AUTOCOMPLETE DE DOMÍNIO ==================
    if (emailInput) {
        const DOMAIN_FATEC = "fatec.sp.gov.br";
        const DOMAIN_PROTON = "proton.me";

        emailInput.addEventListener('input', function() {
            let currentValue = this.value;
            const atIndex = currentValue.indexOf('@');

            if (atIndex === -1) return;

            const domainPart = currentValue.substring(atIndex + 1);

            if (domainPart === '') {
                this.value = currentValue + DOMAIN_FATEC;
                this.focus(); 
                return; 
            }

            const expectedFatecDomain = DOMAIN_FATEC; 
            if (domainPart !== expectedFatecDomain && domainPart !== DOMAIN_PROTON) {
                if (expectedFatecDomain.startsWith(domainPart) && domainPart.length < expectedFatecDomain.length) {
                    this.value = currentValue.substring(0, atIndex + 1) + DOMAIN_PROTON;
                    this.focus();
                    return;
                }
            }
        });
    }

    if (recoveryEmailInput) {
        const DOMAIN_PROTON = "proton.me";

        recoveryEmailInput.addEventListener('input', function() {
            let currentValue = this.value;
            if (currentValue.endsWith('@')) {
                this.value = currentValue + DOMAIN_PROTON;
                this.focus();
                return; 
            }
        });
    }

    // ================== LOGIN - COM MENSAGENS ESPECÍFICAS ==================
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isLoading) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!validateFatecEmail(email)) {
                showLoginError('Por favor, use seu email institucional (@fatec.sp.gov.br) ou o email especial autorizado');
                return;
            }
            
            if (password.length < 6) {
                showLoginError('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            setLoading(true);
            try {
                const data = await authenticateUser(email, password);
                const user = data.user;
                const token = data.token;

                localStorage.setItem('authToken', token);
                localStorage.setItem('currentUser', JSON.stringify(user));

                redirectUser(user.role);
            } catch (error) {
                // Mensagens de erro específicas e amigáveis
                if (error.message.includes('Senha incorreta') || error.message.includes('Credenciais inválidas')) {
                    showCustomAlert('error', 'Senha Incorreta', 
                        'A senha informada está incorreta. Verifique sua senha e tente novamente.');
                } else if (error.message.includes('não encontrado') || error.message.includes('Usuário não existe')) {
                    showCustomAlert('error', 'Usuário Não Encontrado', 
                        'Não encontramos uma conta com este email. Verifique o email ou <a href="cadastro.html" style="color: #ff6b9d; text-decoration: underline;">cadastre-se</a>.');
                } else {
                    showLoginError(error.message);
                }
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
            if (!validateFatecEmail(email)) {
                showRecoveryError('Por favor, use seu email institucional (@fatec.sp.gov.br) ou o email especial autorizado');
                return;
            }

            setLoading(true);
            try {
                await requestPasswordRecovery(email);
                showCustomAlert('success', 'Email Enviado!', 
                    `Enviamos um link de recuperação para: <strong>${email}</strong><br><br>
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.`);
                recoveryForm.reset();
                setTimeout(() => closeModal(), 3000);
            } catch (error) {
                if (error.message.includes('não encontrado') || error.message.includes('não existe')) {
                    showRecoveryError('Este email não está cadastrado no sistema. Verifique o email ou cadastre-se.');
                } else {
                    showRecoveryError(error.message);
                }
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== RESET DE SENHA VIA TOKEN ==================
    function checkResetToken() {
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
                    showResetError("A senha deve ter pelo menos 6 caracteres.");
                    return;
                }

                if (novaSenha !== confirmarSenha) {
                    showResetError("As senhas não coincidem.");
                    return;
                }

                setLoading(true);
                try {
                    await redefinirSenha(resetToken, novaSenha);
                    showResetSuccess("Senha redefinida com sucesso! Redirecionando para o login...");
                    resetForm.reset();
                    setTimeout(() => {
                        closeModal();
                        window.location.href = 'login.html';
                    }, 3000);
                } catch (err) {
                    showResetError(err.message);
                } finally {
                    setLoading(false);
                }
            });
        }
    }

    // ================== SISTEMA DE FORÇA DE SENHA ==================
    function initializePasswordStrength() {
        if (newPasswordInput) {
            const strengthBar = document.querySelector('#resetForm .strength-bar');
            const strengthText = document.querySelector('#resetForm .strength-text');
            const passwordStrength = document.querySelector('#resetForm .password-strength');

            newPasswordInput.addEventListener('input', function() {
                const password = this.value;
                
                if (password.length === 0) {
                    passwordStrength.classList.remove('visible');
                } else {
                    passwordStrength.classList.add('visible');
                    checkPasswordStrength(password, strengthBar, strengthText);
                }
                checkPasswordMatch();
            });

            confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        }
    }

    function checkPasswordStrength(password, strengthBar, strengthText) {
        const strength = calculatePasswordStrength(password);
        
        strengthBar.className = "strength-bar";
        strengthText.className = "strength-text";
        
        strengthBar.classList.add(strength.level);
        strengthText.classList.add(strength.level);
        strengthText.textContent = strength.text.charAt(0).toUpperCase() + strength.text.slice(1);
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (password.length >= 8) score += 2;
        else if (password.length >= 6) score += 1;

        if (hasLower && hasUpper) score += 2;
        else if (hasLower || hasUpper) score += 1;

        if (hasNumber) score += 1;
        if (hasSpecial) score += 2;

        if (score <= 3) return { level: "weak", text: "Fraca" };
        else if (score <= 6) return { level: "medium", text: "Média" };
        else return { level: "strong", text: "Forte" };
    }

    function checkPasswordMatch() {
        const feedback = document.querySelector('.password-match-feedback');
        if (!newPasswordInput.value || !confirmPasswordInput.value) {
            if (feedback) feedback.classList.remove('visible');
            return false;
        }

        if (newPasswordInput.value !== confirmPasswordInput.value) {
            if (feedback) {
                feedback.innerHTML = '<i class="fas fa-times"></i> As senhas não coincidem';
                feedback.className = "password-match-feedback visible no-match";
            }
            return false;
        } else {
            if (feedback) {
                feedback.innerHTML = '<i class="fas fa-check"></i> As senhas coincidem';
                feedback.className = "password-match-feedback visible match";
            }
            return true;
        }
    }

    // ================== FUNÇÕES DE API ==================
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

    // ================== FUNÇÕES AUXILIARES ==================
    function validateFatecEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@fatec\.sp\.gov\.br$/;
        return regex.test(email) || email === "conclusaovitoria@proton.me";
    }

    function validateEmailInput(input) {
        input.classList.toggle('invalid', input.value && !validateFatecEmail(input.value));
        recoveryFeedback.style.display = 'none';
    }

    // ================== SISTEMA DE ALERTAS MELHORADO ==================
    function showCustomAlert(type, title, message) {
        const alertOverlay = document.createElement('div');
        alertOverlay.className = `alert-overlay alert-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };

        alertOverlay.innerHTML = `
            <div class="alert-modal">
                <div class="alert-icon">
                    <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                </div>
                <h3 class="alert-title">${title}</h3>
                <div class="alert-message">${message}</div>
                <div class="alert-actions">
                    <button class="alert-btn alert-btn-primary" onclick="this.closest('.alert-overlay').remove()">
                        <i class="fas fa-check"></i> Entendi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alertOverlay);
        
        setTimeout(() => alertOverlay.classList.add('visible'), 10);
    }

    function showLoginError(msg) {
        let el = document.querySelector('.login-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'login-error';
            loginForm.insertBefore(el, loginForm.firstChild);
        }
        el.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 5000);
    }

    function showRecoveryError(msg) {
        recoveryFeedback.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        recoveryFeedback.className = 'error';
        recoveryFeedback.style.display = 'flex';
    }

    function showRecoverySuccess(msg) {
        recoveryFeedback.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
        recoveryFeedback.className = 'success';
        recoveryFeedback.style.display = 'flex';
    }

    function showResetError(msg) {
        resetFeedback.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        resetFeedback.className = 'error';
        resetFeedback.style.display = 'flex';
    }

    function showResetSuccess(msg) {
        resetFeedback.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
        resetFeedback.className = 'success';
        resetFeedback.style.display = 'flex';
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
        
        // Remove o token da URL se estiver presente
        if (window.location.search.includes('token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    function redirectUser(role) {
        const routes = {
            'professor': 'pages/professor/painel-professor.html',
            'suporte': 'pages/suporte/painel-suporte.html'
        };
        if (!routes[role]) {
            showCustomAlert('error', 'Erro de Redirecionamento', 'Tipo de usuário não reconhecido.');
            return;
        }
        window.location.href = routes[role];
    }

    function protegerRota() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    if (window.location.pathname.includes('pages/')) protegerRota();
});