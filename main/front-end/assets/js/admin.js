const token = localStorage.getItem("authToken");
const user = JSON.parse(localStorage.getItem("currentUser"));
// admin.js
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user) {
        window.location.href = "../../login.html";
        return;
    }

    console.log("Usuário logado no ADMIN:", user);

    // =========================
    // Elementos do DOM
    // =========================
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('.overlay');
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const logoutBtn = document.getElementById("logout");

    // Elementos de estatísticas
    const badgeOrdensEl = document.getElementById("badgeOrdens");
    const badgeUsuariosEl = document.getElementById("badgeUsuarios");
    const badgePatrimonioEl = document.getElementById("badgePatrimonio");
    const totalOrdensEl = document.getElementById("totalOrdens");
    const totalUsuariosEl = document.getElementById("totalUsuarios");
    const ordensConcluidasEl = document.getElementById("ordensConcluidas");
    const ordensPendentesEl = document.getElementById("ordensPendentes");
    const recentActivityEl = document.getElementById("recentActivity");

    // =========================
    // Funções de Interface
    // =========================
    function toggleSidebar() {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
        document.body.style.overflow = sidebar?.classList.contains('active') ? 'hidden' : '';
    }

    function closeSidebar() {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    function setupMenu() {
        menuToggle?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', closeSidebar);

        // Fechar sidebar ao clicar em links
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', closeSidebar);
        });
    }

    function setupProfileDropdown() {
        const avatar = document.querySelector('.profile-avatar');
        const dropdown = document.querySelector('.dropdown-content');
        if (!avatar || !dropdown) return;

        let dropdownVisible = false;
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownVisible = !dropdownVisible;
            dropdown.style.display = dropdownVisible ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            if (dropdownVisible) {
                dropdown.style.display = 'none';
                dropdownVisible = false;
            }
        });
    }

    function setupLogout() {
        logoutBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
            window.location.href = "../../index.html";
        });
    }

    function fillUserInfo() {
        if (userNameEl) userNameEl.textContent = user.nome || 'Administrador';
        if (userEmailEl) userEmailEl.textContent = user.email || 'admin@fatec.sp.gov.br';
        if (welcomeNameEl) welcomeNameEl.textContent = user.nome || 'Administrador';
    }

    // =========================
    // Funções de Dados
    // =========================
    async function fetchDashboardData() {
        try {
            const res = await fetch("/api/admin/dashboard", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) throw new Error("Falha ao carregar dados do dashboard");

            const data = await res.json();
            updateDashboard(data);
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            // Dados mock para demonstração
            updateDashboard(getMockData());
        }
    }

    function updateDashboard(data) {
        // Atualizar badges
        if (badgeOrdensEl) badgeOrdensEl.textContent = data.ordensPendentes || '0';
        if (badgeUsuariosEl) badgeUsuariosEl.textContent = data.novosUsuarios || '0';
        if (badgePatrimonioEl) badgePatrimonioEl.textContent = data.equipamentosCadastrados || '0';

        // Atualizar estatísticas
        if (totalOrdensEl) totalOrdensEl.textContent = data.totalOrdens || '0';
        if (totalUsuariosEl) totalUsuariosEl.textContent = data.totalUsuarios || '0';
        if (ordensConcluidasEl) ordensConcluidasEl.textContent = data.ordensConcluidas || '0';
        if (ordensPendentesEl) ordensPendentesEl.textContent = data.ordensPendentes || '0';

        // Atualizar atividade recente
        renderRecentActivity(data.recentActivity || []);
    }

    function renderRecentActivity(activities) {
        if (!recentActivityEl) return;

        if (activities.length === 0) {
            recentActivityEl.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p>Nenhuma atividade recente</p>
                        <span class="activity-time">Sistema inicializado</span>
                    </div>
                </div>
            `;
            return;
        }

        recentActivityEl.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <span class="activity-time">${formatTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    function getActivityIcon(type) {
        const icons = {
            'user_created': 'fa-user-plus',
            'order_created': 'fa-file-invoice',
            'order_completed': 'fa-check-circle',
            'system_update': 'fa-cog',
            'warning': 'fa-exclamation-triangle',
            'patrimonio_added': 'fa-briefcase',
            'import_success': 'fa-file-arrow-up'
        };
        return icons[type] || 'fa-circle';
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours} h`;

        return date.toLocaleDateString('pt-BR');
    }

    // Dados mock para demonstração
    function getMockData() {
        return {
            totalOrdens: 156,
            totalUsuarios: 42,
            ordensConcluidas: 128,
            ordensPendentes: 12,
            novosUsuarios: 3,
            equipamentosCadastrados: 89,
            recentActivity: [
                {
                    type: 'user_created',
                    description: 'Novo usuário cadastrado: Prof. João Silva',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                },
                {
                    type: 'order_completed',
                    description: 'Ordem #ORD-2024-00123 concluída',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    type: 'order_created',
                    description: 'Nova ordem criada por Prof. Maria Santos',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
                },
                {
                    type: 'patrimonio_added',
                    description: 'Novo equipamento cadastrado no patrimônio',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
    }

    // =========================
    // Inicializar Tudo
    // =========================
    setupMenu();
    setupProfileDropdown();
    setupLogout();
    fillUserInfo();
    fetchDashboardData();

    console.log('✅ Painel Admin inicializado com sucesso!');
});
