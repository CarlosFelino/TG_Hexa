const tableBody = document.querySelector('.orders-table tbody');
const addBtn = document.querySelector('.add-item');
const API_URL = `https://91e7ce5b-9594-4110-a347-c565d4b784e4-00-385ode3nw28mx.janeway.replit.dev/patrimonios`;

// -----------------------------------
// Carregar todos os patrimônios
// -----------------------------------
async function carregarPatrimonios() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar patrimônios");

    const patrimonios = await res.json();
    renderPatrimonios(patrimonios);
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar patrimônios.</td></tr>`;
  }
}

// -----------------------------------
// Renderiza tabela
// -----------------------------------
function renderPatrimonios(lista) {
  tableBody.innerHTML = "";

  if (!lista.length) {
    tableBody.innerHTML = `<tr><td colspan="6">Nenhum patrimônio cadastrado.</td></tr>`;
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.patrimonio}</td>
      <td>${item.descricao}</td>
      <td>${item.local}</td>
      <td>${item.status}</td>
      <td>
        <button class="edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => abrirFormulario('editar', btn.dataset.id));
  });

  document.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => deletarPatrimonio(btn.dataset.id));
  });
}


//
//Importar arquivo
//
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Selecione um arquivo CSV ou XLSX!");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/importar`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Erro ao importar arquivo!");
    const msg = await res.text();
    alert(msg);
    carregarPatrimonios();
  } catch (err) {
    console.error(err);
    alert("Falha ao enviar o arquivo.");
  }
});

// -----------------------------------
// Abrir modal
// -----------------------------------
function abrirFormulario(acao, id = null) {
  const modal = document.getElementById('modal-form');
  const titulo = document.getElementById('modal-title');
  const submitBtn = document.getElementById('form-submit');

  modal.style.display = 'flex';
  titulo.textContent = acao === 'editar' ? 'Editar Patrimônio' : 'Novo Patrimônio';
  submitBtn.textContent = acao === 'editar' ? 'Salvar Alterações' : 'Adicionar';
  submitBtn.dataset.acao = acao;
  submitBtn.dataset.id = id || '';

  if (acao === 'editar') {
    fetch(`${API_URL}/${id}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('patrimonio-id').value = data.id;
        document.getElementById('descricao').value = data.descricao;
        document.getElementById('local').value = data.local;
        document.getElementById('status').value = data.status;
      });
  } else {
    document.getElementById('patrimonio-id').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('local').value = '';
    document.getElementById('status').value = '';
  }
}

// -----------------------------------
// Salvar (adicionar ou editar) — CORRIGIDO
// -----------------------------------
document.getElementById('form-submit').addEventListener('click', async (e) => {
  const acao = e.target.dataset.acao;
  const id = e.target.dataset.id;

  const patrimonio = document.getElementById('patrimonio-id').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const local = document.getElementById('local').value.trim();
  const status = document.getElementById('status').value || 'Disponível';

  if (!patrimonio || !descricao || !local) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  const metodo = acao === 'editar' ? 'PUT' : 'POST';
  const url = acao === 'editar' ? `${API_URL}/${id}` : API_URL;

  const novoItem = { patrimonio, descricao, local, status };

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoItem)
    });

    if (res.ok) {
      alert(acao === 'editar' ? 'Patrimônio atualizado!' : 'Patrimônio adicionado!');
      fecharModal();
      carregarPatrimonios();
    } else {
      console.error('Erro ao salvar patrimônio:', await res.text());
      alert('Erro ao salvar patrimônio.');
    }
  } catch (error) {
    console.error('Erro ao enviar dados:', error);
    alert('Erro de conexão com o servidor.');
  }
});




// -----------------------------------
// Deletar
// -----------------------------------
async function deletarPatrimonio(id) {
  if (!confirm('Deseja realmente excluir este patrimônio?')) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) carregarPatrimonios();
    else alert('Erro ao deletar patrimônio');
  } catch (err) {
    console.error(err);
  }
}

// -----------------------------------
// Fechar modal
// -----------------------------------
function fecharModal() {
  document.getElementById('modal-form').style.display = 'none';
}

// Inicializar
addBtn.addEventListener('click', () => abrirFormulario('novo'));
carregarPatrimonios();
