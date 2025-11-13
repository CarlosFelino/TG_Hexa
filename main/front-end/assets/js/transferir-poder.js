// ===========================
// Elementos do DOM
// ===========================
const selectUser = document.getElementById('select-user');
const radios = document.querySelectorAll('input[name="transfer-type"]');
const endDate = document.getElementById('end-date');
const confirmBtn = document.getElementById('confirm-btn');
const tableBody = document.querySelector('.orders-table tbody');

// ===========================
// ID do admin atual (você pode definir via backend ou sessão)
// ===========================
const CURRENT_ADMIN_ID = 1; // substituir pelo valor real do admin logado

// ===========================
// Mostrar campo de data para temporário
// ===========================
radios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'temporario' && radio.checked) {
      endDate.style.display = 'inline-block';
    } else {
      endDate.style.display = 'none';
    }
  });
});

// ===========================
// Carregar usuários do suporte
// ===========================
function loadSuporteUsers() {
  fetch('/api/users/suporte')
    .then(res => res.json())
    .then(users => {
      selectUser.innerHTML = '<option value="">Selecionar usuário do suporte</option>';
      users.forEach(u => {
        selectUser.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
      });
    })
    .catch(err => console.error('Erro ao carregar usuários do suporte:', err));
}

// ===========================
// Carregar tabela de transferências
// ===========================
function loadTransfers() {
  fetch('/api/roles/transfers')
    .then(res => res.json())
    .then(transfers => {
      tableBody.innerHTML = '';
      transfers.forEach(t => {
        const statusClass = t.concluido ? 'in-progress' : 'pending';
        const dataFim = t.data_fim ? new Date(t.data_fim).toLocaleDateString('pt-BR') : '-';
        tableBody.innerHTML += `
          <tr>
            <td>${t.id}</td>
            <td>${t.nome}</td>
            <td>${t.tipo}</td>
            <td>${dataFim}</td>
            <td><span class="status ${statusClass}">${t.concluido ? 'Concluído' : 'Pendente'}</span></td>
          </tr>
        `;
      });
    })
    .catch(err => console.error('Erro ao carregar transferências:', err));
}

// ===========================
// Confirmar transferência
// ===========================
confirmBtn.addEventListener('click', () => {
  const userId = selectUser.value;
  const tipo = document.querySelector('input[name="transfer-type"]:checked').value;
  const dataFimValue = endDate.value;

  if (!userId) return alert('Selecione um usuário do suporte');
  if (tipo === 'temporario' && !dataFimValue) return alert('Selecione a data de término');

  const url = tipo === 'permanente' ? '/api/roles/donate' : '/api/roles/temporary';
  const body = tipo === 'permanente'
    ? { from_user_id: CURRENT_ADMIN_ID, to_user_id: userId }
    : { user_id: userId, data_fim: dataFimValue };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Operação realizada com sucesso!');
        loadTransfers(); // Atualiza tabela
      } else {
        alert('Erro: ' + (data.error || 'Tente novamente.'));
      }
    })
    .catch(err => console.error('Erro ao enviar transferência:', err));
});

// ===========================
// Inicialização
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadSuporteUsers();
  loadTransfers();
});
