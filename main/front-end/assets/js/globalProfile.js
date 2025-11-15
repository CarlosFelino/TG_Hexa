// ===============================
// globalProfile.js
// Carrega a foto de perfil do usuário logado,
// ou usa o avatar padrão se não existir.
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  const defaultAvatarPath = "../../assets/images/default-avatar.png";
  const avatars = document.querySelectorAll(".profile-avatar");

  if (!token) {
    avatars.forEach((img) => (img.src = defaultAvatarPath));
    return;
  }

  try {
    const response = await fetch("/api/perfil/foto", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // se o backend não encontrar a imagem, usa a padrão
    if (!response.ok) {
      avatars.forEach((img) => (img.src = defaultAvatarPath));
      return;
    }

    // pega o blob da imagem e cria uma URL temporária
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    // aplica a imagem em todos os avatares
    avatars.forEach((img) => (img.src = imageUrl));
  } catch {
    avatars.forEach((img) => (img.src = defaultAvatarPath));
  }
});
