document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("usuarios-tbody");
  const filterRole = document.getElementById("filter-role");
  const searchInput = document.getElementById("search-user");
  const backBtn = document.getElementById("back-btn");
  const addUserBtn = document.querySelector(".add-user");

  // Modal Edit
  const editModal = document.getElementById("edit-modal");
  const editClose = document.getElementById("edit-close");
  const editCancel = document.getElementById("edit-cancel");
  const editForm = document.getElementById("edit-form");
  const editId = document.getElementById("edit-id");
  const editNome = document.getElementById("edit-nome");
  const editEmail = document.getElementById("edit-email");
  const editRole = document.getElementById("edit-role");

  // Cache local
  let usuariosCache = [];

  // Rota do backend para usuários cadastrados
  const API_URL = "/api/admin/usuarios";

  // ----------------------------- MODAL AUTORIZAR MATRÍCULA -----------------------------
  const modalAdd = document.createElement("div");
  modalAdd.className = "modal";
  modalAdd.style.display = "none";
  modalAdd.innerHTML = `
    <div class="modal-content">
      <button class="close" id="add-close">&times;</button>
      <h2>Autorizar Matrícula</h2>

      <form id="add-form">
        <label for="add-matricula">Matrícula:</label>
        <input type="text" id="add-matricula" required>

        <label for="add-tipo">Tipo:</label>
        <select id="add-tipo" required>
          <option value="professor">Professor</option>
          <option value="suporte">Suporte</option>
        </select>

        <div class="modal-buttons">
          <button type="submit" id="add-save" class="btn-confirm">Salvar</button>
          <button type="button" id="add-cancel" class="btn-cancel">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modalAdd);

  const addClose = document.getElementById("add-close");
  const addCancel = document.getElementById("add-cancel");
  const addForm = document.getElementById("add-form");
  const addMatricula = document.getElementById("add-matricula");
  const addTipo = document.getElementById("add-tipo");

  // Abrir modal
  addUserBtn.addEventListener("click", () => {
    modalAdd.style.display = "flex";
  });

  // Fechar modal
  addClose.addEventListener("click", () => modalAdd.style.display = "none");
  addCancel.addEventListener("click", () => modalAdd.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === modalAdd) modalAdd.style.display = "none";
  });

  // Salvar nova matrícula autorizada
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bodyData = {
      matricula: addMatricula.value.trim(),
      role: addTipo.value
    };

    try {
      const res = await fetch("/api/admin/matriculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula: addMatricula.value.trim(),
          role: addTipo.value
        })
      });

      if (!res.ok) throw new Error("Erro ao autorizar matrícula");

      alert("Matrícula autorizada com sucesso!");
      modalAdd.style.display = "none";
      addForm.reset();

    } catch (err) {
      console.error(err);
      alert("Erro ao autorizar matrícula.");
    }
  });

  // ----------------------------- LISTAR USUÁRIOS -----------------------------
  async function carregarUsuarios() {
    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ${res.status}: ${text}`);
      }

      usuariosCache = await res.json();
      renderUsuarios(usuariosCache);

    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">
        Erro de conexão: Verifique se a rota <b>${API_URL}</b> existe no seu servidor Node.js.
      </td></tr>`;
    }
  }

  function renderUsuarios(lista) {
    tbody.innerHTML = "";

    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    lista.forEach(u => {
      const tr = document.createElement("tr");
      const roleExibida = u.role || u.cargo || "N/A";

      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email || "—"}</td>
        <td>${roleExibida}</td>
        <td>
          <button class="btn-edit" 
            data-id="${u.id}" 
            data-nome="${escapeHtml(u.nome)}" 
            data-email="${escapeHtml(u.email || '')}" 
            data-role="${roleExibida}" 
            title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="btn-delete" data-id="${u.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    document.querySelectorAll(".btn-edit").forEach(btn =>
      btn.addEventListener("click", () => abrirModalEdicao(btn))
    );

    document.querySelectorAll(".btn-delete").forEach(btn =>
      btn.addEventListener("click", () => confirmarExclusao(btn.dataset.id))
    );
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ----------------------------- EDITAR USUÁRIO -----------------------------
  function abrirModalEdicao(btn) {
    editId.value = btn.dataset.id;
    editNome.value = btn.dataset.nome || "";
    editEmail.value = btn.dataset.email || "";
    editRole.value = btn.dataset.role || "professor";

    editModal.style.display = "flex";
  }

  function fecharModalEdit() {
    editModal.style.display = "none";
    editForm.reset();
  }

  editClose.addEventListener("click", fecharModalEdit);
  editCancel.addEventListener("click", fecharModalEdit);

  window.addEventListener("click", (e) => {
    if (e.target === editModal) fecharModalEdit();
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = editId.value;

    const bodyData = {
      nome: editNome.value.trim(),
      email: editEmail.value.trim(),
      role: editRole.value
    };

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

      alert("Usuário atualizado!");
      fecharModalEdit();
      carregarUsuarios();

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar. Veja o console.");
    }
  });

  // ----------------------------- EXCLUIR USUÁRIO -----------------------------
  async function confirmarExclusao(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

      alert("Usuário excluído!");
      carregarUsuarios();

    } catch (err) {
      console.error(err);
      alert("Erro ao excluir. Veja o console.");
    }
  }

  // ----------------------------- FILTROS -----------------------------
  function aplicarFiltros() {
    const role = filterRole.value;
    const search = searchInput.value.trim().toLowerCase();

    const filtrados = usuariosCache.filter(u => {
      const uRole = (u.role || u.cargo || "").toLowerCase();
      const roleMatch = !role || uRole === role.toLowerCase();

      const uNome = (u.nome || "").toLowerCase();
      const uEmail = (u.email || "").toLowerCase();
      const searchMatch = !search || uNome.includes(search) || uEmail.includes(search);

      return roleMatch && searchMatch;
    });

    renderUsuarios(filtrados);
  }

  filterRole.addEventListener("change", aplicarFiltros);
  searchInput.addEventListener("input", aplicarFiltros);

  // Voltar
  if (backBtn)
    backBtn.addEventListener("click", () => {
      window.location.href = "painel-admin.html";
    });

  // Inicializar
  carregarUsuarios();
});
