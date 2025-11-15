// ===============================
// profile.js (versão final revisada)
// ===============================

// 1️⃣ Inicialização e validação
const token = localStorage.getItem("authToken");
const user = JSON.parse(localStorage.getItem("currentUser"));

if (!token || !user) {
  alert("Token de autenticação não encontrado. Faça login novamente.");
  window.location.href = "../../login.html";
}

// Debug opcional
console.log("🔑 Token JWT:", token);
console.log("👤 Usuário atual:", user);

document.addEventListener("DOMContentLoaded", () => {
  carregarFotoPerfil();

  // ===============================
  // 📸  Pré-visualização e upload da foto
  // ===============================
  const photoInput = document.getElementById("photo-input");
  const profilePreview = document.getElementById("profile-preview");
  const removePhotoBtn = document.getElementById("remove-photo");

  if (photoInput && profilePreview) {
    photoInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Verifica tamanho (máx. 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB.");
        photoInput.value = "";
        return;
      }

      // Mostra preview local
      const reader = new FileReader();
      reader.onload = (event) => {
        profilePreview.src = event.target.result;
      };
      reader.readAsDataURL(file);

      // Envia pro servidor
      const formData = new FormData();
      formData.append("foto", file);

      try {
        const response = await fetch("/api/perfil/upload-foto", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await response.json();
        console.log("📤 Resposta do servidor:", data);

        if (data.success) {
          alert("✅ Foto de perfil atualizada com sucesso!");
          const novaUrl = data.fotoUrl.startsWith("http")
            ? data.fotoUrl
            : `${window.location.origin}${data.fotoUrl}`;

          // Atualiza preview e navbar
          profilePreview.src = novaUrl;
          const navbarAvatar = document.querySelector(".profile-avatar");
          if (navbarAvatar) navbarAvatar.src = novaUrl;
        } else {
          alert("❌ Falha ao atualizar foto: " + data.message);
        }
      } catch (error) {
        console.error("Erro ao enviar foto:", error);
        alert("Erro ao enviar a foto de perfil.");
      }
    });
  }

  // ===============================
  // 🗑️ Remover foto (no servidor e no front)
  // ===============================
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;

      try {
        const response = await fetch("/api/perfil/remover-foto", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert("✅ Foto removida com sucesso!");

          // volta pra imagem padrão
          const defaultAvatar = "../../assets/images/default-avatar.png";
          profilePreview.src = defaultAvatar;

          // atualiza a navbar também
          const navbarAvatar = document.querySelector(".profile-avatar");
          if (navbarAvatar) navbarAvatar.src = defaultAvatar;
        } else {
          alert("❌ Falha ao remover foto: " + (data.message || "Erro desconhecido"));
        }
      } catch (err) {
        console.error("Erro ao remover foto:", err);
        alert("Erro ao remover a foto de perfil.");
      }
    });
  }


  // ===============================
  // 👁️ Mostrar / Ocultar senha
  // ===============================
  const toggleBtns = document.querySelectorAll(".toggle-password");
  toggleBtns.forEach((btn) => {
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
  // 🔐 Alterar senha (funcional agora)
  // ===============================
  const passwordForm = document.getElementById("password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("current-password").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();
      const confirmPassword = document.getElementById("confirm-password").value.trim();

      if (newPassword.length < 6) {
        alert("A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
      }

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
          alert("✅ Senha alterada com sucesso!");
          passwordForm.reset();
        } else {
          alert("❌ " + (data.message || "Erro ao alterar senha."));
        }
      } catch (error) {
        console.error("Erro ao alterar senha:", error);
        alert("Erro ao tentar alterar a senha.");
      }
    });
  }


// ===============================
// 🧠 Buscar e exibir foto atual do usuário
// ===============================
async function carregarFotoPerfil() {
  try { 
    const response = await fetch("/api/perfil/foto", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erro ao buscar foto");

    // o servidor responde com a imagem diretamente (não JSON)
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    document.getElementById("profile-preview").src = imageUrl;
    const navbarAvatar = document.querySelector(".profile-avatar");
    if (navbarAvatar) navbarAvatar.src = imageUrl;
  } catch (err) {
    console.error("Erro ao carregar foto:", err);
  }
}
  });