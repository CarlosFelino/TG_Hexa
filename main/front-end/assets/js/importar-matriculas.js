// importar-matriculas.js
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = "../../login.html";
        return;
    }

    // =========================
    // Elementos do DOM
    // =========================
    const uploadArea = document.getElementById('uploadArea');
    const fileUpload = document.getElementById('fileUpload');
    const importBtn = document.getElementById('importBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const progressFill = document.getElementById('progressFill');
    const statusDetails = document.getElementById('statusDetails');
    const previewSection = document.getElementById('previewSection');
    const previewTableBody = document.getElementById('previewTableBody');
    const previewTotal = document.getElementById('previewTotal');
    const previewValid = document.getElementById('previewValid');
    const previewInvalid = document.getElementById('previewInvalid');
    const cancelImport = document.getElementById('cancelImport');
    const confirmImport = document.getElementById('confirmImport');
    const downloadTemplate = document.getElementById('downloadTemplate');
    const historyList = document.getElementById('historyList');

    let currentFile = null;
    let previewData = [];

    // =========================
    // Configuração de Eventos
    // =========================
    function setupEventListeners() {
        // Upload Area
        uploadArea.addEventListener('click', () => fileUpload.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // File Input
        fileUpload.addEventListener('change', handleFileSelect);

        // Botões
        importBtn.addEventListener('click', processFile);
        cancelImport.addEventListener('click', resetUpload);
        confirmImport.addEventListener('click', confirmImportData);
        downloadTemplate.addEventListener('click', downloadTemplateFile);

        // Fechar preview com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewSection.style.display !== 'none') {
                resetUpload();
            }
        });
    }

    // =========================
    // Manipulação de Arquivos
    // =========================
    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validTypes.some(type => file.type.includes(type.replace('application/', '')))) {
            showCustomAlert('error', 'Formato Inválido', 'Por favor, selecione um arquivo CSV ou Excel.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showCustomAlert('error', 'Arquivo Muito Grande', 'O arquivo deve ter no máximo 10MB.');
            return;
        }

        currentFile = file;
        importBtn.disabled = false;
        
        // Atualizar área de upload
        uploadArea.innerHTML = `
            <i class="fas fa-file-check" style="color: #4CAF50;"></i>
            <p>${file.name}</p>
            <span class="file-types">${formatFileSize(file.size)} • Pronto para importar</span>
        `;

        showCustomAlert('success', 'Arquivo Carregado', 'Arquivo carregado com sucesso! Clique em "Importar Matrículas" para continuar.');
    }

    // =========================
    // Processamento do Arquivo
    // =========================
    async function processFile() {
        if (!currentFile) return;

        // Mostrar status
        uploadStatus.style.display = 'block';
        updateProgress(10, 'Lendo arquivo...');

        try {
            // Simular leitura do arquivo
            await simulateFileProcessing();
            
            // Gerar dados de preview (mock)
            generatePreviewData();
            
            // Mostrar preview
            showPreview();
            
        } catch (error) {
            showCustomAlert('error', 'Erro no Processamento', 'Ocorreu um erro ao processar o arquivo.');
            console.error('Erro:', error);
        }
    }

    async function simulateFileProcessing() {
        // Simular etapas de processamento
        const steps = [
            { progress: 30, message: 'Validando formato...' },
            { progress: 50, message: 'Lendo dados...' },
            { progress: 70, message: 'Validando matrículas...' },
            { progress: 90, message: 'Preparando preview...' },
            { progress: 100, message: 'Processamento concluído!' }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            updateProgress(step.progress, step.message);
        }
    }

    function generatePreviewData() {
        // Dados mock para demonstração
        previewData = [
            { matricula: '20241001', nome: 'João Silva', email: 'joao.silva@fatec.sp.gov.br', status: 'valid', observacao: '' },
            { matricula: '20241002', nome: 'Maria Oliveira', email: 'maria.oliveira@fatec.sp.gov.br', status: 'valid', observacao: '' },
            { matricula: '20241003', nome: 'Carlos Santos', email: 'carlos.santos@fatec.sp.gov.br', status: 'valid', observacao: '' },
            { matricula: '123', nome: 'Ana Costa', email: 'ana.costa@fatec.sp.gov.br', status: 'invalid', observacao: 'Matrícula inválida' },
            { matricula: '20241004', nome: 'Pedro Almeida', email: 'pedro.almeida@gmail.com', status: 'warning', observacao: 'Email não institucional' }
        ];
    }

    function showPreview() {
        // Atualizar estatísticas
        const total = previewData.length;
        const valid = previewData.filter(item => item.status === 'valid').length;
        const invalid = previewData.filter(item => item.status !== 'valid').length;

        previewTotal.textContent = total;
        previewValid.textContent = valid;
        previewInvalid.textContent = invalid;

        // Renderizar tabela
        previewTableBody.innerHTML = previewData.map(item => `
            <tr>
                <td><strong>${item.matricula}</strong></td>
                <td>${item.nome}</td>
                <td>${item.email}</td>
                <td>
                    <span class="status-badge ${item.status}">
                        ${item.status === 'valid' ? 'Válido' : item.status === 'invalid' ? 'Inválido' : 'Aviso'}
                    </span>
                </td>
                <td>${item.observacao || '-'}</td>
            </tr>
        `).join('');

        // Mostrar seção
        previewSection.style.display = 'block';
        uploadStatus.style.display = 'none';
    }

    // =========================
    // Confirmação de Importação
    // =========================
    async function confirmImportData() {
        updateProgress(0, 'Iniciando importação...');
        uploadStatus.style.display = 'block';

        try {
            // Simular importação
            const validData = previewData.filter(item => item.status === 'valid');
            
            for (let i = 0; i < validData.length; i++) {
                const progress = Math.floor((i / validData.length) * 100);
                updateProgress(progress, `Importando ${i + 1} de ${validData.length} registros...`);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            updateProgress(100, 'Importação concluída com sucesso!');
            
            // Adicionar ao histórico
            addToHistory(validData.length);
            
            // Mostrar resultado
            setTimeout(() => {
                showCustomAlert('success', 'Importação Concluída', 
                    `${validData.length} matrículas foram importadas com sucesso.`);
                resetUpload();
            }, 1000);

        } catch (error) {
            showCustomAlert('error', 'Erro na Importação', 'Ocorreu um erro durante a importação.');
        }
    }

    // =========================
    // Histórico
    // =========================
    function addToHistory(importedCount) {
        const historyItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            imported: importedCount,
            fileName: currentFile.name
        };

        // Salvar no localStorage (em produção, seria no backend)
        const history = JSON.parse(localStorage.getItem('importHistory') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('importHistory', JSON.stringify(history.slice(0, 10))); // Manter apenas 10 itens

        loadHistory();
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('importHistory') || '[]');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-item">
                    <div class="history-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="history-content">
                        <p>Nenhuma importação realizada</p>
                        <span class="history-time">O histórico aparecerá aqui</span>
                    </div>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fas fa-file-import"></i>
                </div>
                <div class="history-content">
                    <p>Importação de matrículas</p>
                    <span class="history-time">${formatDate(item.date)}</span>
                </div>
                <div class="history-stats">
                    <span><i class="fas fa-users"></i> ${item.imported} registros</span>
                    <span><i class="fas fa-file"></i> ${item.fileName}</span>
                </div>
            </div>
        `).join('');
    }

    // =========================
    // Utilitários
    // =========================
    function updateProgress(percent, message) {
        progressFill.style.width = `${percent}%`;
        statusDetails.textContent = message;
    }

    function resetUpload() {
        currentFile = null;
        fileUpload.value = '';
        importBtn.disabled = true;
        uploadStatus.style.display = 'none';
        previewSection.style.display = 'none';
        
        // Resetar área de upload
        uploadArea.innerHTML = `
            <i class="fas fa-file-excel"></i>
            <p>Arraste o arquivo aqui ou clique para selecionar</p>
            <span class="file-types">Formatos suportados: .csv, .xlsx</span>
        `;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function downloadTemplateFile(e) {
        e.preventDefault();
        
        // Criar conteúdo CSV modelo
        const csvContent = "Matrícula,Nome,Email\n20241001,João Silva,joao.silva@fatec.sp.gov.br\n20241002,Maria Oliveira,maria.oliveira@fatec.sp.gov.br";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo-matriculas.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showCustomAlert('success', 'Modelo Baixado', 'O modelo de planilha foi baixado com sucesso.');
    }

    // =========================
    // Sistema de Alertas 
    // =========================
    function showCustomAlert(type, title, message, buttons = []) {
        const alertOverlay = document.createElement('div');
        alertOverlay.className = `alert-overlay alert-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const buttonHTML = buttons.length > 0 ? 
            `<div class="alert-actions">
                ${buttons.map(btn => `
                    <button class="alert-btn alert-btn-${btn.action}" data-action="${btn.action}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>` : '';

        alertOverlay.innerHTML = `
            <div class="alert-modal">
                <div class="alert-icon">
                    <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                </div>
                <h3 class="alert-title">${title}</h3>
                <div class="alert-message">${message}</div>
                ${buttonHTML}
            </div>
        `;

        document.body.appendChild(alertOverlay);
        
        // Event listeners para botões
        alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                const buttonConfig = buttons.find(b => b.text === this.textContent);
                if (buttonConfig && buttonConfig.callback) {
                    buttonConfig.callback();
                }
                alertOverlay.remove();
            });
        });

        // Fechar ao clicar fora ou pressionar ESC
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) {
                alertOverlay.remove();
            }
        });

        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                alertOverlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

        setTimeout(() => alertOverlay.classList.add('visible'), 10);
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        setupEventListeners();
        loadHistory();
        resetUpload();
    }

    // Iniciar aplicação
    init();

    console.log('✅ Importar Matrículas - Admin inicializado com sucesso!');
});