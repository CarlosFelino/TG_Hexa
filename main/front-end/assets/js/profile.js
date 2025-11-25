// ===============================
// profile.js (Admin, Suporte, Professor)
// ===============================

const token = localStorage.getItem("authToken");
const user = JSON.parse(localStorage.getItem("currentUser"));

document.addEventListener("DOMContentLoaded", () => {
  // Carrega a foto inicial
  carregarFotoPerfil();

  const photoInput = document.getElementById("photo-input");
  const profilePreview = document.getElementById("profile-preview");
  const removePhotoBtn = document.getElementById("remove-photo");
  const passwordForm = document.getElementById("password-form");

  // ===============================
  // 📸 Upload da foto
  // ===============================
  if (photoInput && profilePreview) {
    photoInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("warning", "Arquivo Grande", "A imagem deve ter no máximo 2MB.");
        photoInput.value = "";
        return;
      }

      // Preview imediato
      const reader = new FileReader();
      reader.onload = (event) => { profilePreview.src = event.target.result; };
      reader.readAsDataURL(file);

      // Envia ao servidor
      const formData = new FormData();
      formData.append("foto", file);

      try {
        // Feedback visual temporário (opcional)
        showToast("info", "Enviando...", "Fazendo upload da sua foto.");

        const response = await fetch("/api/perfil/upload-foto", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          showToast("success", "Sucesso", "Foto de perfil atualizada!");
          atualizarAvatares(data.fotoUrl);
        } else {
          showToast("error", "Erro", "Falha ao atualizar foto: " + data.message);
        }

      } catch (err) {
        console.error(err);
        showToast("error", "Erro", "Erro de conexão ao enviar a foto.");
      }
    });
  }

  // ===============================
  // 🗑️ Remover foto
  // ===============================
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", () => {
      showConfirmModal(
        "Remover Foto", 
        "Tem certeza que deseja remover sua foto de perfil? Ela voltará ao padrão.",
        async () => {
          try {
            const response = await fetch("/api/perfil/remover-foto", {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (response.ok && data.success) {
              showToast("success", "Foto Removida", "Sua foto foi removida com sucesso.");
              const defaultAvatar = "../../assets/images/default-avatar.png";
              atualizarAvatares(defaultAvatar);
            } else {
              showToast("error", "Erro", "Falha ao remover foto.");
            }
          } catch (err) {
            console.error(err);
            showToast("error", "Erro", "Erro de conexão ao remover foto.");
          }
        }
      );
    });
  }

  // ===============================
  // 🔐 Alterar senha
  // ===============================
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = passwordForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      const currentPassword = document.getElementById("current-password").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();
      const confirmPassword = document.getElementById("confirm-password").value.trim();

      if (newPassword.length < 6) {
        showToast("warning", "Senha Curta", "A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast("warning", "Erro", "As senhas não coincidem.");
        return;
      }

      // Estado de Loading
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '';

      try {
        const response = await fetch("/api/perfil/alterar-senha", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senhaAtual: currentPassword,
            novaSenha: newPassword,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast("success", "Senha Alterada", "Sua senha foi atualizada com sucesso!");
          passwordForm.reset();
        } else {
          showToast("error", "Erro", data.message || "Senha atual incorreta.");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Erro", "Erro ao tentar alterar a senha.");
      } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // ===============================
  // 👁️ Toggle Password Visibility
  // ===============================
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });

  // ===============================
  // Funções Auxiliares
  // ===============================

  async function carregarFotoPerfil() {
    try {
      const response = await fetch("/api/perfil/foto", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        atualizarAvatares(imageUrl);
      }
    } catch (err) {
      console.error("Erro ao carregar foto inicial:", err);
    }
  }

  function atualizarAvatares(url) {
    // Atualiza preview da página
    const profilePreview = document.getElementById("profile-preview");
    if (profilePreview) profilePreview.src = url;

    // Atualiza avatar da navbar (se existir)
    const navbarAvatar = document.querySelector(".profile-avatar");
    if (navbarAvatar) navbarAvatar.src = url;
  }

  // ---------------------------------------------------
  // Sistema de Notificações (Toast)
  // ---------------------------------------------------
  function showToast(type, title, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);
    // Força reflow para animação
    void toast.offsetWidth; 
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ---------------------------------------------------
  // Modal de Confirmação Customizado
  // ---------------------------------------------------
  function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal active';
    modal.innerHTML = `
      <div class="confirm-content">
        <div class="confirm-icon"><i class="fas fa-trash-alt"></i></div>
        <h3 class="confirm-title">${title}</h3>
        <p class="confirm-text">${message}</p>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn-cancel">Cancelar</button>
          <button class="confirm-btn confirm-btn-delete">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('.confirm-btn-cancel');
    const confirmBtn = modal.querySelector('.confirm-btn-delete');

    cancelBtn.onclick = () => modal.remove();
    confirmBtn.onclick = () => {
      modal.remove();
      onConfirm();
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }
});