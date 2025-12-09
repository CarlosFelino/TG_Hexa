document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('filter-status');
    const ordersList = document.getElementById('orders-list');
    const allOrderCards = document.querySelectorAll('.order-card');

    filterSelect.addEventListener('change', () => {
        const status = filterSelect.value;
        
        allOrderCards.forEach(card => {
            if (status === 'all' || card.classList.contains(status)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

class ModalOrdem {
  constructor() {
    this.template = document.getElementById('modal-ordem-template');
  }
  
  abrir(ordemId) {
    // Carrega dados via fetch e exibe
  }
}
