document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("users-table-body");
  const filterRole = document.getElementById("filter-role");
  const filterStatus = document.getElementById("filter-status");
  const searchInput = document.getElementById("search-users");
  const addUserBtn = document.getElementById("add-user-btn");
  const resetFiltersBtn = document.getElementById("reset-filters");

  // Modal Formulário
  const userFormModal = document.getElementById("user-form-modal");
  const userFormTitle = document.getElementById("user-form-title");
  const userForm = document.getElementById("user-form");
  const saveUserBtn = document.getElementById("save-user-btn");

  // Campos do formulário
  const userMatricula = document.getElementById("user-matricula");
  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");
  const userRole = document.getElementById("user-role");
  const userStatus = document.getElementById("user-status");
  const userPassword = document.getElementById("user-password");
  const passwordField = document.getElementById("password-field");

  // Modal Detalhes
  const userDetailsModal = document.getElementById("user-details-modal");
  const modalUserDetails = document.getElementById("modal-user-details");
  const editUserBtn = document.getElementById("edit-user-btn");

  // Cache local
  let usuariosCache = [];
  let usuarioEditando = null;

  // Rota do backend
  const API_URL = "https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev/api/admin/usuarios";

  // ===========================
  // FUNÇÕES DE CONVERSÃO STATUS
  // ===========================
  function statusToBackend(status) {
    // Converte 'active' -> 'ativa', 'inactive' -> 'inativa'
    return status === 'active' ? 'ativa' : status === 'inactive' ? 'inativa' : status;
  }

  function statusToFrontend(status) {
    // Converte 'ativa' -> 'active', 'inativa' -> 'inactive'
    return status === 'ativa' ? 'active' : status === 'inativa' ? 'inactive' : status;
  }

  function statusDisplay(status) {
    // Para exibição: 'ativa'/'active' -> 'Ativo'
    const normalized = statusToBackend(status);
    return normalized === 'ativa' ? 'Ativo' : 'Inativo';
  }

  // ===========================
  // FECHAR MODAIS
  // ===========================
  document.querySelectorAll(".modal-close, .modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      userFormModal.style.display = "none";
      userDetailsModal.style.display = "none";
      userForm.reset();
      usuarioEditando = null;
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === userFormModal) {
      userFormModal.style.display = "none";
      userForm.reset();
      usuarioEditando = null;
    }
    if (e.target === userDetailsModal) {
      userDetailsModal.style.display = "none";
    }
  });

  // ===========================
  // LISTAR USUÁRIOS
  // ===========================
  async function carregarUsuarios() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      usuariosCache = await res.json();
      renderUsuarios(usuariosCache);
      atualizarEstatisticas(usuariosCache);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">
        ❌ Erro de conexão com o servidor: ${err.message}
        <br><small>Verifique se o backend está rodando e se o CORS está configurado</small>
      </td></tr>`;
    }
  }

  function renderUsuarios(lista) {
    tbody.innerHTML = "";

    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    lista.forEach(u => {
      const tr = document.createElement("tr");

      // Normaliza o status para comparação
      const statusNorm = statusToBackend(u.status);
      const statusClass = statusNorm === 'ativa' ? 'status-active' : 'status-inactive';
      const statusText = statusDisplay(u.status);

      tr.innerHTML = `
        <td>${u.matricula}</td>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email || "—")}</td>
        <td><span class="badge badge-${u.role}">${traduzirRole(u.role)}</span></td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>${formatarData(u.criado_em)}</td>
        <td>
          <button class="btn-icon btn-view" data-id="${u.id}" title="Ver detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-edit" data-id="${u.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" data-id="${u.id}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Event listeners para botões
    document.querySelectorAll(".btn-view").forEach(btn => {
      btn.addEventListener("click", () => abrirDetalhes(btn.dataset.id));
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => abrirEdicao(btn.dataset.id));
    });

    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => confirmarExclusao(btn.dataset.id));
    });
  }

  // ===========================
  // ESTATÍSTICAS
  // ===========================
  function atualizarEstatisticas(lista) {
    const total = lista.length;
    const professores = lista.filter(u => u.role === 'professor').length;
    const suporte = lista.filter(u => u.role === 'suporte').length;
    const admins = lista.filter(u => u.role === 'admin').length;

    document.getElementById("total-users").textContent = total;
    document.getElementById("total-professors").textContent = professores;
    document.getElementById("total-support").textContent = suporte;
    document.getElementById("total-admins").textContent = admins;
  }

  // ===========================
  // ADICIONAR USUÁRIO
  // ===========================
  addUserBtn.addEventListener("click", () => {
    usuarioEditando = null;
    userFormTitle.textContent = "Adicionar Novo Usuário";
    userForm.reset();
    passwordField.style.display = "block";
    userPassword.required = true;
    userMatricula.disabled = false;
    userFormModal.style.display = "flex";
  });

  // ===========================
  // SALVAR USUÁRIO (CRIAR/ATUALIZAR)
  // ===========================
  saveUserBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!userForm.checkValidity()) {
      userForm.reportValidity();
      return;
    }

    // Converte status do frontend para backend
    const bodyData = {
      matricula: userMatricula.value.trim(),
      nome: userName.value.trim(),
      email: userEmail.value.trim(),
      role: userRole.value,
      status: statusToBackend(userStatus.value), // ✅ CONVERSÃO
    };

    if (!usuarioEditando) {
      // Criar novo
      bodyData.senha = userPassword.value;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Erro ao criar usuário");
        }

        alert("✅ Usuário criado com sucesso!");
        userFormModal.style.display = "none";
        userForm.reset();
        carregarUsuarios();
      } catch (err) {
        console.error(err);
        alert(`❌ Erro ao criar usuário: ${err.message}`);
      }
    } else {
      // Atualizar existente
      try {
        const res = await fetch(`${API_URL}/${usuarioEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Erro ao atualizar usuário");
        }

        alert("✅ Usuário atualizado com sucesso!");
        userFormModal.style.display = "none";
        userForm.reset();
        usuarioEditando = null;
        carregarUsuarios();
      } catch (err) {
        console.error(err);
        alert(`❌ Erro ao atualizar: ${err.message}`);
      }
    }
  });

  // ===========================
  // VER DETALHES
  // ===========================
  function abrirDetalhes(id) {
    const usuario = usuariosCache.find(u => u.id == id);
    if (!usuario) return;

    const statusNorm = statusToBackend(usuario.status);
    const statusClass = statusNorm === 'ativa' ? 'status-active' : 'status-inactive';
    const statusText = statusDisplay(usuario.status);

    modalUserDetails.innerHTML = `
      <div class="user-details-grid">
        <div class="detail-item">
          <strong>Matrícula:</strong>
          <span>${usuario.matricula || usuario.id}</span>
        </div>
        <div class="detail-item">
          <strong>Nome:</strong>
          <span>${escapeHtml(usuario.nome)}</span>
        </div>
        <div class="detail-item">
          <strong>Email:</strong>
          <span>${escapeHtml(usuario.email)}</span>
        </div>
        <div class="detail-item">
          <strong>Cargo:</strong>
          <span class="badge badge-${usuario.role}">${traduzirRole(usuario.role)}</span>
        </div>
        <div class="detail-item">
          <strong>Status:</strong>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <div class="detail-item">
          <strong>Data de Cadastro:</strong>
          <span>${formatarData(usuario.criado_em)}</span>
        </div>
      </div>
    `;

    editUserBtn.onclick = () => {
      userDetailsModal.style.display = "none";
      abrirEdicao(id);
    };

    userDetailsModal.style.display = "flex";
  }

  // ===========================
  // EDITAR USUÁRIO
  // ===========================
  function abrirEdicao(id) {
    const usuario = usuariosCache.find(u => u.id == id);
    if (!usuario) return;

    usuarioEditando = id;
    userFormTitle.textContent = "Editar Usuário";

    userMatricula.value = usuario.matricula || usuario.id;
    userMatricula.disabled = true;
    userName.value = usuario.nome;
    userEmail.value = usuario.email;
    userRole.value = usuario.role;

    // Converte status do backend para frontend
    userStatus.value = statusToFrontend(usuario.status || 'ativa');

    passwordField.style.display = "none";
    userPassword.required = false;

    userFormModal.style.display = "flex";
  }

  // ===========================
  // EXCLUIR USUÁRIO
  // ===========================
  async function confirmarExclusao(id) {
    if (!confirm("⚠️ Tem certeza que deseja excluir este usuário?\nEsta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao excluir usuário");
      }

      alert("✅ Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      alert(`❌ Erro ao excluir: ${err.message}`);
    }
  }

  // ===========================
  // FILTROS
  // ===========================
  function aplicarFiltros() {
    const role = filterRole.value.toLowerCase();
    const statusFilter = filterStatus.value; // 'active' ou 'inactive'
    const search = searchInput.value.trim().toLowerCase();

    const filtrados = usuariosCache.filter(u => {
      const roleMatch = !role || (u.role || "").toLowerCase() === role;

      // Normaliza ambos os status para comparar
      const userStatusNorm = statusToBackend(u.status);
      const filterStatusNorm = statusToBackend(statusFilter);
      const statusMatch = !statusFilter || userStatusNorm === filterStatusNorm;

      const searchMatch = !search || 
        (u.nome || "").toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search) ||
        (u.matricula || "").toString().includes(search);

      return roleMatch && statusMatch && searchMatch;
    });

    renderUsuarios(filtrados);
  }

  filterRole.addEventListener("change", aplicarFiltros);
  filterStatus.addEventListener("change", aplicarFiltros);
  searchInput.addEventListener("input", aplicarFiltros);

  resetFiltersBtn.addEventListener("click", () => {
    filterRole.value = "";
    filterStatus.value = "";
    searchInput.value = "";
    renderUsuarios(usuariosCache); // Mostra todos
  });

  // ===========================
  // FUNÇÕES AUXILIARES
  // ===========================
  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function traduzirRole(role) {
    const roles = {
      'professor': 'Professor',
      'suporte': 'Suporte',
      'admin': 'Administrador'
    };
    return roles[role] || role;
  }

  function formatarData(data) {
    if (!data) return "—";
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ===========================
  // INICIALIZAR
  // ===========================
  carregarUsuarios();
});