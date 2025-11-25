// importar-matriculas.js
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

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

        uploadStatus.style.display = "block";
        updateProgress(10, "Lendo arquivo...");

        try {
            updateProgress(40, "Processando dados do arquivo...");

            // 📌 Agora realmente lê o arquivo
            previewData = await parseFile(currentFile);

            updateProgress(90, "Gerando preview...");
            await new Promise(r => setTimeout(r, 300));

            showPreview();

        } catch (error) {
            showCustomAlert("error", "Erro no Arquivo", error.toString());
            console.error(error);
        }
    }


    // substituir parseFile e validateRow pela versão abaixo

    // reconhece aliases de cabeçalho e devolve objeto limpo pronto pra validação
    function normalizeHeaders(headerRow) {
        return headerRow.map(h => {
            if (!h) return "";
            const key = String(h).trim().toLowerCase();
            if (["matricula", "matrícula", "rm", "registro", "matric"].includes(key)) return "matricula";
            if (["role", "cargo", "perfil"].includes(key)) return "role";
            if (["status", "estado"].includes(key)) return "status";
            if (["nome", "nome_pre_cadastrado", "nome pré cadastrado", "full name", "name"].includes(key)) return "nome_pre_cadastrado";
            // fallback: manter original simplificado
            return key;
        });
    }

    async function parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = e.target.result;

                // CSV
                if (file.name.toLowerCase().endsWith(".csv")) {
                    const lines = data.split(/\r\n|\n/).filter(Boolean);
                    if (lines.length === 0) return resolve([]);

                    const rawHeader = lines.shift().split(",").map(h => h.trim());
                    const headers = normalizeHeaders(rawHeader);

                    const rows = lines.map(line => {
                        const cols = line.split(",");
                        const obj = {};
                        headers.forEach((h, i) => {
                            obj[h || `col${i}`] = (cols[i] || "").trim();
                        });
                        return validateRow(obj);
                    });

                    resolve(rows);
                }
                // XLSX
                else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
                    try {
                        // precisa do xlsx no HTML: <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
                        const workbook = XLSX.read(data, { type: "binary" });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }); // array de arrays
                        if (!rawJson || rawJson.length === 0) return resolve([]);

                        const rawHeader = rawJson[0].map(h => String(h).trim());
                        const headers = normalizeHeaders(rawHeader);

                        const rows = rawJson.slice(1).map(colsArr => {
                            const obj = {};
                            headers.forEach((h, i) => {
                                obj[h || `col${i}`] = (colsArr[i] || "").toString().trim();
                            });
                            return validateRow(obj);
                        });

                        resolve(rows);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject("Formato não suportado. Use .csv ou .xlsx");
                }
            };

            reader.onerror = (err) => reject(err);

            if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    // valida os campos esperados pelo banco e retorna objeto padrão
    function validateRow(row) {
        // pegar valores (aceita tanto nome_pre_cadastrado quanto nome)
        const matricula = String(row.matricula || row["matrícula"] || "").trim();
        const roleRaw = String(row.role || row.cargo || "").trim().toLowerCase();
        const statusRaw = String(row.status || row.estado || "").trim().toLowerCase();
        const nome = String(row.nome_pre_cadastrado || row.nome || row.name || "").trim();

        // valores permitidos
        const validRoles = ["professor", "suporte", "admin"];
        const validStatus = ["ativa", "inativa"];

        // defaults quando ausentes
        const role = validRoles.includes(roleRaw) ? roleRaw : "suporte";
        const status = validStatus.includes(statusRaw) ? statusRaw : "ativa";

        // validações
        let valid = true;
        const observacoes = [];

        if (!matricula) {
            valid = false;
            observacoes.push("Matrícula ausente");
        } else if (matricula.length < 4 || matricula.length > 13) {
            valid = false;
            observacoes.push("Tamanho da matrícula inválido");
        }

        if (!validRoles.includes(roleRaw) && roleRaw !== "") {
            observacoes.push(`Role desconhecido ("${roleRaw}"), será definido como '${role}'`);
        }

        if (!validStatus.includes(statusRaw) && statusRaw !== "") {
            observacoes.push(`Status desconhecido ("${statusRaw}"), será definido como '${status}'`);
        }

        // montar objeto final compatível com backend
        return {
            matricula,
            role,                      // valor normalizado (ou default)
            status,                    // valor normalizado (ou default)
            nome_pre_cadastrado: nome || null,
            valid,
            observacao: observacoes.join("; ")
        };
    }


    
    

    function showPreview() {
        // Atualizar estatísticas
        const total = previewData.length;
        const validCount = previewData.filter(item => item.valid).length;
        const invalidCount = previewData.filter(item => !item.valid).length;

        previewTotal.textContent = total;
        previewValid.textContent = validCount;
        previewInvalid.textContent = invalidCount;

        // Renderizar tabela
        previewTableBody.innerHTML = previewData.map(item => `
            <tr>
                <td><strong>${item.matricula}</strong></td>
                <td>${item.nome_pre_cadastrado || '-'}</td>
                <td>${item.role}</td>
                <td>${item.status}</td>

                <td>
                    <span class="status-badge ${item.valid ? 'valid' : 'invalid'}">
                        ${item.valid ? 'Válido' : 'Inválido'}
                    </span>
                </td>

                <td>${item.observacao || '-'}</td>
            </tr>
        `).join('');

        // Mostrar seção
        previewSection.style.display = 'block';
        uploadStatus.style.display = 'none';

        // Desabilitar confirmar se tiver inválidos
        const hasInvalid = previewData.some(r => !r.valid);
        confirmImport.disabled = hasInvalid;

        if (hasInvalid) {
            showCustomAlert(
                'warning',
                'Existem linhas inválidas',
                'Corrija ou remova as linhas inválidas antes de confirmar. O botão foi desabilitado.'
            );
        }
    }


    // =========================
    // Confirmação de Importação
    // =========================
    async function confirmImportData() {
        const fileName = currentFile.name; // salvar antes de resetar
        updateProgress(0, 'Enviando arquivo para o servidor...');
        uploadStatus.style.display = 'block';

        try {
            const formData = new FormData();
            formData.append("arquivo", currentFile);

            const response = await fetch("/api/matriculas/importar", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Falha ao importar arquivo");
            }

            updateProgress(100, 'Importação concluída!');

            showCustomAlert(
                'success',
                'Importação Concluída',
                `${result.registros || 0} matrículas foram importadas com sucesso.`
            );

            resetUpload();
            addToHistory(result.registros || 0, fileName);  // passar fileName
        } catch (error) {
            console.error(error);
            showCustomAlert('error', 'Erro ao Importar', error.message);
            updateProgress(0, 'Erro ao importar');
        }
    }



    // =========================
    // Histórico
    // =========================
    function addToHistory(importedCount, fileName) {
        const historyItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            imported: importedCount,
            fileName: fileName
        };

        // Salvar no localStorage (em produção, seria no backend)
        const history = JSON.parse(localStorage.getItem('importHistory') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('importHistory', JSON.stringify(history.slice(0, 10))); // manter apenas 10 itens

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