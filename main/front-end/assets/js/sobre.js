document.addEventListener('DOMContentLoaded', () => {
    // Configuração do observador com performance otimizada
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay escalonado para melhor performance
                const delay = entry.target.classList.contains('slide-in') ? 
                    Math.min(index * 100, 600) : 0;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                // Para de observar após a animação
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar todos os elementos animados
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in, .advisor-card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Efeito parallax suave (opcional)
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        let ticking = false;
        
        const updateParallax = () => {
            const scrollPosition = window.pageYOffset;
            const parallaxValue = scrollPosition * 0.3;
            heroSection.style.transform = `translateY(${parallaxValue}px)`;
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Fallback para imagens que não carregam
    const handleImageError = (img) => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'image-fallback';
        fallback.innerHTML = `
            <div style="background: var(--gradient); width: 100%; height: 100%; 
                       display: flex; align-items: center; justify-content: center; 
                       color: white; font-size: 0.9rem; border-radius: 8px;">
                Imagem<br>Indisponível
            </div>
        `;
        img.parentNode.insertBefore(fallback, img);
    };

    // Aplicar fallback a todas as imagens
    document.querySelectorAll('.card-image img, .advisor-image img').forEach(img => {
        img.onerror = () => handleImageError(img);


        // =========================
        // 5. POP-UPS DE ALERTAS
        // =========================

        // Elementos dos pop-ups
        const alertPopupVencimento = document.getElementById("alertPopupVencimento");
        const alertBodyVencimento = document.getElementById("alertBodyVencimento");
        const closeVencimento = document.getElementById("closeVencimento");

        const alertPopupSemResp = document.getElementById("alertPopupSemResp");
        const alertBodySemResp = document.getElementById("alertBodySemResp");
        const closeSemResp = document.getElementById("closeSemResp");

        // Botões de fechar
        if (closeVencimento) {
            closeVencimento.addEventListener("click", () => {
                alertPopupVencimento.classList.add("hidden");
                alertPopupVencimento.classList.remove("active");
            });
        }

        if (closeSemResp) {
            closeSemResp.addEventListener("click", () => {
                alertPopupSemResp.classList.add("hidden");
                alertPopupSemResp.classList.remove("active");
            });
        }

        // Ajuste para responsividade do logo
        function checkLogoResponsive() {
            const logoText = document.querySelector('.logo-text');
            const logoContainer = document.querySelector('.logo-container');

            if (window.innerWidth <= 576) {
                // Remove efeitos hover em mobile
                if (logoContainer) {
                    logoContainer.style.transition = 'none';
                }
            } else {
                // Restaura efeitos hover em desktop
                if (logoContainer) {
                    logoContainer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            }
        }

        // Executa ao carregar e ao redimensionar
        window.addEventListener('load', checkLogoResponsive);
        window.addEventListener('resize', checkLogoResponsive);

        // ✅ FUNÇÃO PRINCIPAL: Carregar e exibir alertas
        async function carregarAlertas() {
            try {
                const res = await fetch("/api/ordens/alertas/ativos", {
                    headers: { Authorization: "Bearer " + token }
                });

                if (!res.ok) {
                    console.error("Erro ao buscar alertas:", res.status);
                    return;
                }

                const alertas = await res.json();
                console.log("📢 Alertas recebidos:", alertas);

                // ============================================
                // POP-UP 1: Ordens próximas do vencimento
                // ============================================
                if (alertas.prazo && alertas.prazo.length > 0) {
                    alertBodyVencimento.innerHTML = alertas.prazo.map(ordem => `
                        <div class="alert-item priority-${ordem.prioridade}">
                            <div class="alert-icon-wrap">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="alert-content">
                                <strong>${ordem.codigo}</strong>
                                <p>${ordem.titulo}</p>
                                <small>Vence em: ${formatarData(ordem.data_limite)}</small>
                                <span class="badge priority-${ordem.prioridade}">Prioridade ${ordem.prioridade}</span>
                            </div>
                            <a href="ordens/listar-ordens.html?id=${ordem.id}" class="alert-action">
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    `).join('');

                    alertPopupVencimento.classList.remove("hidden");
                    setTimeout(() => alertPopupVencimento.classList.add("active"), 100);
                } else {
                    alertPopupVencimento.classList.add("hidden");
                    alertPopupVencimento.classList.remove("active");
                }

                // ============================================
                // POP-UP 2: Ordens sem responsável (>2 dias)
                // ============================================
                if (alertas.sem_responsavel && alertas.sem_responsavel.length > 0) {
                    alertBodySemResp.innerHTML = alertas.sem_responsavel.map(ordem => `
                        <div class="alert-item priority-${ordem.prioridade}">
                            <div class="alert-icon-wrap">
                                <i class="fas fa-user-times"></i>
                            </div>
                            <div class="alert-content">
                                <strong>${ordem.codigo}</strong>
                                <p>${ordem.titulo}</p>
                                <small>Status: ${ordem.status}</small>
                                <span class="badge priority-${ordem.prioridade}">Prioridade ${ordem.prioridade}</span>
                            </div>
                            <a href="ordens/listar-ordens.html?id=${ordem.id}" class="alert-action">
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    `).join('');

                    alertPopupSemResp.classList.remove("hidden");
                    setTimeout(() => alertPopupSemResp.classList.add("active"), 100);
                } else {
                    alertPopupSemResp.classList.add("hidden");
                    alertPopupSemResp.classList.remove("active");
                }

            } catch (err) {
                console.error("Erro ao carregar alertas:", err);
            }
        }

        // ✅ Função auxiliar: Formatar data
        function formatarData(data) {
            if (!data) return "N/A";
            const d = new Date(data);
            return d.toLocaleDateString("pt-BR");
        }

        // ✅ Carregar alertas ao abrir a página (apenas para suporte)
        if (user && user.role === "suporte" && alertPopupVencimento && alertPopupSemResp) {
            carregarAlertas();

            // ✅ Recarregar alertas a cada 30 segundos (atualização automática)
            setInterval(carregarAlertas, 30000);
        }
    });
});