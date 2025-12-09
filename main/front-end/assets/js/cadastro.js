document.addEventListener("DOMContentLoaded", function () {
    // 🔗 URL do backend
    const API_URL = "https://59474a86-d1ec-4d8b-be95-f13d54b8921d-00-2dfvvk3i4x3oc.riker.replit.dev";


    // Elementos do DOM
    const registerForm = document.getElementById("registerForm");
    const showPasswordBtns = document.querySelectorAll(".show-password");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordMatchFeedback = document.querySelector(".password-match-feedback");
    const passwordStrength = document.querySelector(".password-strength");
    const strengthBar = document.querySelector(".strength-bar");
    const strengthText = document.querySelector(".strength-text");
    const submitBtn = document.querySelector(".btn-submit");
    const emailInput = document.getElementById("email");

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

    // ================== MOSTRAR/OCULTAR SENHA ==================
    showPasswordBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            const input = this.parentElement.querySelector("input");
            const icon = this.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    });

    // ================== VERIFICAÇÃO DE SENHAS ==================
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", checkPasswordMatch);
    }

    // ================== MEDIDOR DE FORÇA DA SENHA - MELHORADO ==================
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            const password = this.value;

            if (password.length === 0) {
                // Esconde o medidor quando não há senha
                passwordStrength.classList.remove("visible");
            } else {
                // Mostra o medidor quando começa a digitar
                passwordStrength.classList.add("visible");
                checkPasswordStrength(password);
            }
            checkPasswordMatch();
        });

        // Esconde o medidor quando perde o foco e está vazio
        passwordInput.addEventListener("blur", function() {
            if (this.value.length === 0) {
                passwordStrength.classList.remove("visible");
            }
        });
    }

    // ================== VALIDAÇÃO DO FORMULÁRIO ==================
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (validateForm()) {
                submitForm();
            }
        });
    }

    // ================== FUNÇÕES AUXILIARES ==================

    function checkPasswordMatch() {
        if (!passwordInput.value || !confirmPasswordInput.value) {
            passwordMatchFeedback.classList.remove("visible");
            return false;
        }

        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordMatchFeedback.innerHTML = '<i class="fas fa-times"></i> As senhas não coincidem';
            passwordMatchFeedback.className = "password-match-feedback visible no-match";
            return false;
        } else {
            passwordMatchFeedback.innerHTML = '<i class="fas fa-check"></i> As senhas coincidem';
            passwordMatchFeedback.className = "password-match-feedback visible match";
            return true;
        }
    }

    function checkPasswordStrength(password) {
        const strength = calculatePasswordStrength(password);

        // Remove todas as classes anteriores
        strengthBar.className = "strength-bar";
        strengthText.className = "strength-text";

        // Aplica as novas classes
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

        // Pontuação baseada em critérios
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

    function validateForm() {
        let isValid = true;
        const emailValue = emailInput.value;

        // Validação de email
        if (!(emailValue.endsWith("@fatec.sp.gov.br") || emailValue === "conclusaovitoria@proton.me")) {
            showAlert("error", "Email Inválido", "Por favor, use seu email institucional (@fatec.sp.gov.br) ou o email de teste autorizado.");
            isValid = false;
        }

        // Validação de senha
        if (!checkPasswordMatch()) {
            isValid = false;
        }

        // Validação de tamanho mínimo da senha
        if (passwordInput.value.length < 6) {
            showAlert("error", "Senha Muito Curta", "A senha deve ter no mínimo 6 caracteres.");
            isValid = false;
        }

        return isValid;
    }

    function submitForm() {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

        const formData = {
            nome: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("password").value,
            matricula: document.getElementById("employeeId").value
        };

        fetch(`${API_URL}/api/cadastro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })
        .then(async (response) => {
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.erro || "Erro no servidor");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Cadastro realizado:", data);
            showSuccessMessage();
        })
        .catch((error) => {
            console.error("Erro no cadastro:", error);
            
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Cadastrar Usuário';

            // Verifica se é erro de email/matrícula já cadastrado
            if (error.message.includes("já cadastrado") || error.message.includes("já existe")) {
                showAlert("error", "Cadastro Existente", 
                    "Este email ou matrícula já está cadastrado no sistema. " +
                    "Por favor, use credenciais diferentes ou recupere sua conta.");
            } else {
                showAlert("error", "Erro no Cadastro", 
                    error.message || "Ocorreu um erro no cadastro. Por favor, tente novamente.");
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Cadastrar Usuário';
        });
    }

    // ================== SISTEMA DE ALERTAS MELHORADO ==================

    function showAlert(type, title, message) {
        // Remove alertas existentes
        const existingAlert = document.querySelector('.alert-overlay');
        if (existingAlert) existingAlert.remove();

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
                <p class="alert-message">${message}</p>
                <div class="alert-actions">
                    <button class="alert-btn alert-btn-primary" onclick="this.closest('.alert-overlay').remove()">
                        <i class="fas fa-check"></i> Entendi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alertOverlay);

        // Animação de entrada
        setTimeout(() => alertOverlay.classList.add('visible'), 10);
    }

    function showSuccessMessage() {
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';

        successOverlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="success-title">Cadastro Realizado!</h2>
                <p class="success-message">Usuário cadastrado com sucesso. Redirecionando para o login...</p>
            </div>
        `;

        document.body.appendChild(successOverlay);

        // Animação de entrada
        setTimeout(() => successOverlay.classList.add('visible'), 10);

        // Redirecionamento após 3 segundos
        setTimeout(() => {
            window.location.href = "login.html";
        }, 3000);
    }

    // ================== MENSAGEM DE SUCESSO APÓS REDIRECIONAMENTO ==================
    if (localStorage.getItem("showRegistrationSuccess") === "true") {
        showAlert("success", "Cadastro Realizado!", "Usuário cadastrado com sucesso! Agora você pode fazer login no sistema.");
        localStorage.removeItem("showRegistrationSuccess");
    }
    // Função para ajustar o comportamento do logo em mobile
    function adjustLogoForMobile() {
        const logoText = document.querySelector('.logo-text');
        const logoContainer = document.querySelector('.logo-container');

        if (window.innerWidth <= 576) {
            // Remove efeitos hover que não funcionam bem em mobile
            if (logoContainer) {
                logoContainer.style.transition = 'none';
            }

            // Ajusta o tamanho da logo se necessário
            const logo = document.querySelector('.logo');
            if (logo) {
                logo.style.height = '35px';
            }
        } else {
            // Restaura efeitos em desktop
            if (logoContainer) {
                logoContainer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        }
    }

    // Executa ao carregar e redimensionar
    window.addEventListener('load', adjustLogoForMobile);
    window.addEventListener('resize', adjustLogoForMobile);

    // Otimização para touch devices
    document.addEventListener('DOMContentLoaded', function() {
        // Melhora a experiência em dispositivos touch
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('touchstart', function() {
                this.style.fontSize = '16px'; // Previne zoom no iOS
            });
        });

        // Log de carregamento
        console.log('Página de cadastro carregada com responsividade otimizada');
    });

    // Previne envio duplo do formulário em mobile
    let isSubmitting = false;

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            if (isSubmitting) {
                e.preventDefault();
                return;
            }

            if (window.innerWidth <= 576) {
                // Em mobile, adiciona um pequeno delay para evitar toques acidentais
                isSubmitting = true;
                setTimeout(() => {
                    isSubmitting = false;
                }, 2000);
            }
        });
    }
});