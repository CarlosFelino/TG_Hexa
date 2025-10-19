// Controle do menu toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
    // Lógica para abrir o menu lateral (será implementada posteriormente)
    console.log('Menu aberto!');
});

// Efeito hover no avatar
document.querySelector('.user-profile').addEventListener('mouseenter', () => {
    document.querySelector('.user-avatar').style.transform = 'scale(1.1)';
    document.querySelector('.user-avatar').style.borderColor = '#ff00e2';
});

document.querySelector('.user-profile').addEventListener('mouseleave', () => {
    document.querySelector('.user-avatar').style.transform = 'scale(1)';
    document.querySelector('.user-avatar').style.borderColor = '#7a04eb';
});
document.addEventListener('DOMContentLoaded', () => {
    // Efeitos de hover nos cards
    const cards = document.querySelectorAll('.dashboard-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.card-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.card-icon i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
    
    // Simulação de contagem de ordens pendentes (substituir por dados reais)
    const updatePendingOrders = () => {
        const badge = document.querySelector('.card-badge');
        if (badge) {
            // Simular atualização
            setTimeout(() => {
                badge.textContent = '5 pendentes';
                badge.style.background = '#7a04eb';
            }, 2000);
        }
    };
    
    updatePendingOrders();
});