document.addEventListener('DOMContentLoaded', function() {
    // Apenas para debug, remova na produção
    console.log("SE ESTE LOG APARECER, O ARQUIVO JS ESTÁ FUNCIONANDO CORRETAMENTE.");
    // --------------------------------------------------------------------------

    // =========================
    // 1. Inicialização e Validação
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user) {
        window.location.href = "../../login.html";
        return;
    }
    console.log("T1: TOKEN E USUÁRIO LIDOS COM SUCESSO.");

    // =========================
    // 2. Elementos do DOM
    // =========================
    // Funções de Interface são definidas ANTES de serem usadas na inicialização das variáveis

    // Funções auxiliares (definidas no topo do escopo para serem acessíveis)
    function createOverlay() {
        // Verifica se o overlay já existe para evitar duplicidade
        let overlayElement = document.querySelector('.overlay');
        if (overlayElement) return overlayElement; 

        overlayElement = document.createElement('div');
        overlayElement.className = 'overlay';

        // Garante que o body existe antes de anexar
        if (document.body) {
            document.body.appendChild(overlayElement);
        } else {
            // Este console.error deve aparecer se o body não estiver pronto (improvável com DOMContentLoaded)
            console.error("Erro fatal: document.body não está disponível para adicionar o overlay.");
        }
        return overlayElement;
    }

    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = createOverlay(); // Chamada para a função corrigida
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const logoutBtn = document.getElementById("logout");
    const recentOrdersEl = document.getElementById("recentOrders");
    const badgePendentesEl = document.getElementById("badgePendentes");
    const badgeAndamentoEl = document.getElementById("badgeAndamento");

    console.log("T2: VARIÁVEIS DOM INICIALIZADAS.");
    // --------------------------------------------------------------------------

    // =========================
    // 3. Funções de Interface
    // =========================

    // Funções que dependem das variáveis DOM (sidebar, overlay, etc.)
    function toggleSidebar() {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    }

    function setupMenu() {
        menuToggle?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', closeSidebar);
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
        logoutBtn?.addEventListener("click", () => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
        });
    }

    function fillUserInfo() {
        userNameEl.textContent = user.nome; // Removi o '?' aqui, se o elemento existe e o usuário é válido, deve ser setado
        userEmailEl.textContent = user.email; // Removi o '?'
        welcomeNameEl.textContent = user.nome; // Removi o '?'
    }

    // =========================
    // 4. Funções de Dados (Chamadas pelo fluxo principal)
    // =========================

    async function fetchOrdens() {
        if (!recentOrdersEl) return;
        try {
            const res = await fetch("/api/minhas-ordens", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Resposta do servidor não OK:", res.status, errorText);
                throw new Error("Falha ao carregar ordens: " + res.status);
            }

            const ordens = await res.json();
            console.log("Ordens recebidas do servidor:", ordens); // Log para conferir as ordens
            renderOrdens(ordens);
        } catch (err) {
            console.error("Erro na requisição fetchOrdens:", err);
            recentOrdersEl.innerHTML = "<p>Erro ao carregar ordens.</p>";
        }
    }

    function renderOrdens(ordens) {
        if (!recentOrdersEl) return;

        recentOrdersEl.innerHTML = "";
        let pendentes = 0;
        let andamento = 0;

        // Corrigido: Apenas limita as ordens, confiando na ordenação DESC do backend.
        const ultimasOrdens = ordens.slice(0, 3);

        if (ultimasOrdens.length === 0) {
            recentOrdersEl.innerHTML = "<p>Nenhuma ordem recente encontrada.</p>";
            if (badgePendentesEl) badgePendentesEl.textContent = 0;
            if (badgeAndamentoEl) badgeAndamentoEl.textContent = 0;
            return;
        }

        ultimasOrdens.forEach(o => {
            const div = document.createElement("div");

            let statusClass = "";
            switch(o.status) {
                case "Pendente": statusClass = "pendente"; pendentes++; break;
                case "Em Andamento": statusClass = "em-andamento"; andamento++; break;
                case "Concluída": statusClass = "concluida"; break;
                case "Não Concluída": statusClass = "nao-concluida"; break;
                default: statusClass = "desconhecido"; break;
            }

            // Garante que a descrição não seja 'undefined' ou 'null' no front
            const descricao = o.descricao || (o.tipo_solicitacao === 'instalacao' && o.app_nome ? `Instalação: ${o.app_nome} ${o.app_versao || ''}` : 'Sem descrição detalhada');
            const detalhesProblema = o.equipamento ? `${o.equipamento} - ${o.tipo_problema}` : '';
            // Seu backend não retorna os anexos nesse GET. Se você precisar, deve incluir a query no backend.
            // Mantendo a lógica de anexos comentada se não houver dados no JSON.
            // const anexos = o.anexos ? o.anexos.map(a => `<li>${a.arquivo_nome}</li>`).join('') : ''; 

            div.className = `order-card ${statusClass}`;
            div.innerHTML = `
                <h3>${o.codigo || o.id} - ${o.local_detalhe || o.tipo_solicitacao.toUpperCase()}</h3>
                <p>Tipo: ${o.tipo_solicitacao.toUpperCase()}</p>
                <p>${descricao}</p>
                ${detalhesProblema ? `<p>Equipamento: ${detalhesProblema}</p>` : ''}

                <span class="status ${statusClass}">${o.status}</span>
                <span class="date">${new Date(o.data_criacao).toLocaleString('pt-BR')}</span>
            `;

            recentOrdersEl.appendChild(div);
        });

        // Atualizar badges
        if (badgePendentesEl) badgePendentesEl.textContent = pendentes;
        if (badgeAndamentoEl) badgeAndamentoEl.textContent = andamento;
    }

    // =========================
    // 5. Inicializar tudo (Fluxo principal)
    // =========================
    console.log("T3: CHAMANDO FUNÇÕES DE INICIALIZAÇÃO.");
    setupMenu();
    setupProfileDropdown();
    setupLogout();
    fillUserInfo();
    fetchOrdens(); 
    console.log("T4: INICIALIZAÇÃO COMPLETA. VERIFIQUE A ABA NETWORK.");
});