// ========================
// CONFIGURAÇÃO BASE
// ========================
const BASE_URL = window.location.hostname.includes("replit.dev")
  ? "https://" + window.location.hostname
  : "http://localhost:3000"; // ajuste se necessário

const tabela = document.getElementById("matriculas-tbody");
const novaMatriculaBtn = document.getElementById("nova-matricula-btn");
const modal = document.getElementById("nova-matricula-modal");
const closeModal = document.getElementById("close-modal");
const form = document.getElementById("nova-matricula-form");
const importBtn = document.querySelector(".add-item");
const fileInput = document.getElementById("file-upload");

// ========================
// FUNÇÃO: CARREGAR MATRÍCULAS
// ========================
async function carregarMatriculas() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/matriculas`);
    const data = await res.json();

    tabela.innerHTML = ""; // limpa tabela

    data.forEach((mat) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${mat.id}</td>
        <td>${mat.nome_pre_cadastrado || "—"}</td>
        <td>${mat.matricula}</td>
        <td>${mat.role}</td>
        <td><span class="status ${mat.status === "ativa" ? "in-progress" : "pending"}">${mat.status}</span></td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar matrículas:", err);
  }
}

// ========================
// MODAL: ABRIR / FECHAR
// ========================
novaMatriculaBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ========================
// FORMULÁRIO: NOVA MATRÍCULA
// ========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const novaMatricula = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${BASE_URL}/api/admin/matriculas/nova`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaMatricula),
    });

    if (res.ok) {
      alert("Matrícula adicionada com sucesso!");
      form.reset();
      modal.style.display = "none";
      carregarMatriculas();
    } else {
      const erro = await res.text();
      alert("Erro ao salvar matrícula: " + erro);
    }
  } catch (err) {
    console.error("Erro ao salvar matrícula:", err);
    alert("Erro ao salvar matrícula. Verifique o console.");
  }
});

// ========================
// IMPORTAR CSV / EXCEL
// ========================
importBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Selecione um arquivo CSV ou Excel primeiro!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${BASE_URL}/api/admin/matriculas/importar`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Arquivo importado com sucesso!");
      carregarMatriculas();
    } else {
      const erro = await res.text();
      alert("Erro ao importar arquivo: " + erro);
    }
  } catch (err) {
    console.error("Erro ao importar:", err);
  }
});

// ========================
// AO CARREGAR A PÁGINA
// ========================
document.addEventListener("DOMContentLoaded", carregarMatriculas);
