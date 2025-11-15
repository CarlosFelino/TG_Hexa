// assets/js/authCheck.js

(function () {
  const token = localStorage.getItem("authToken");

  // Se não houver token, redireciona pro login
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  // Opcional: validar expiração do token JWT
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    if (Date.now() > exp) {
      localStorage.removeItem("authToken");
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "/pages/login.html";
    }
  } catch (err) {
    console.error("Token inválido:", err);
    localStorage.removeItem("authToken");
    window.location.href = "/pages/login.html";
  }
})();

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("authToken");
  window.location.href = "/pages/login.html";
});