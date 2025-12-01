document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  const defaultAvatarPath = "/assets/images/default-avatar.png"; // ← MUDANÇA AQUI
  const avatars = document.querySelectorAll(".profile-avatar");

  if (!token) {
    avatars.forEach((img) => (img.src = defaultAvatarPath));
    return;
  }

  try {
    const response = await fetch("/api/perfil/foto", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      avatars.forEach((img) => (img.src = defaultAvatarPath));
      return;
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    avatars.forEach((img) => (img.src = imageUrl));
  } catch {
    avatars.forEach((img) => (img.src = defaultAvatarPath));
  }
});