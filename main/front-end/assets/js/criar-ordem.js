// criar-ordem.js - com sistema de notificações igual às outras páginas
document.addEventListener("DOMContentLoaded", function() {
    console.log("✅ Script criar-ordem.js iniciado!");

    // =========================
    // DADOS DO SISTEMA
    // =========================
    const salasAula = ["101","102","103","104","105","106","107","108","109","110","111","112","113","304","305","307","310","311","312","313"];
    const laboratorios = ["202","203","204","205","206","207","208","209","210","211","213","214","215"];

    const kits = {
        "sala": [
            { value: "kit-professor", label: "Kit Professor" },
            { value: "tv", label: "TV" },
            { value: "perifericos", label: "Periféricos (Mouse/Teclado)" },
            { value: "conectividade", label: "Problema de Conectividade" }
        ],
        "laboratorio": [
            { value: "kit-professor", label: "Kit Professor" },
            { value: "kit-aluno-desktop", label: "Kit Aluno (Desktop)" },
            { value: "kit-aluno-notebook", label: "Kit Aluno (Notebook)" },
            { value: "perifericos", label: "Periféricos (Mouse/Teclado)" },
            { value: "conectividade", label: "Problema de Conectividade" }
        ]
    };

    const problemas = {
        "kit-professor":[
            {value:"sem-video", label:"Monitor não liga"},
            {value:"sem-internet", label:"Sem Internet"},
            {value:"nao-espelha-tv", label:"Não está espelhando na TV"},
            {value:"gabinete-nao-liga", label:"Gabinete não liga"},
            {value:"outro", label:"Outro problema"}
        ],
        "kit-aluno-desktop":[
            {value:"sem-video", label:"Monitor não liga"},
            {value:"sem-internet", label:"Sem Internet"},
            {value:"gabinete-nao-liga", label:"Gabinete não liga"},
            {value:"outro", label:"Outro problema"}
        ],
        "kit-aluno-notebook":[
            {value:"sem-internet", label:"Sem Internet"},
            {value:"bateria", label:"Problema com Bateria"},
            {value:"nao-liga", label:"Notebook não liga"},
            {value:"outro", label:"Outro problema"}
        ],
        "tv":[
            {value:"nao-liga", label:"TV não liga"},
            {value:"sem-sinal", label:"Sem sinal"},
            {value:"outro", label:"Outro problema"}
        ],
        "perifericos":[
            {value:"mouse-defeito", label:"Mouse com defeito"},
            {value:"teclado-defeito", label:"Teclado com defeito"},
            {value:"outro", label:"Outro problema"}
        ],
        "conectividade":[
            {value:"cabo-rede", label:"Problema com cabo de rede"},
            {value:"keystone", label:"Problema com Keystone"},
            {value:"outro", label:"Outro problema"}
        ],
        "default":[
            {value:"outro", label:"Outro problema"}
        ]
    };

    // =========================
    // FUNÇÕES UTILITÁRIAS
    // =========================
    const getElement = id => document.getElementById(id);

    function populateSelect(select, options) {
        if (!select) return;
        select.innerHTML = `<option value="">Selecione...</option>`;
        options.forEach(o => {
            const opt = document.createElement("option");
            opt.value = o.value || o;
            opt.textContent = o.label || o;
            select.appendChild(opt);
        });
    }

    // =========================
    // SISTEMA DE NOTIFICAÇÃO - IGUAL às outras páginas
    // =========================
    function showNotification(message, type = 'success') {
        return new Promise((resolve) => {
            const modal = getElement('notification-modal');
            const messageEl = getElement('notification-message');
            const header = modal?.querySelector('.modal-header h3');

            if (!modal || !messageEl || !header) {
                console.error('❌ Elementos do modal de notificação não encontrados');
                // Fallback para alert padrão
                alert(message);
                resolve();
                return;
            }

            messageEl.textContent = message;

            // Configurar cores baseadas no tipo
            if (type === 'success') {
                header.innerHTML = '<i class="fas fa-check-circle"></i> Sucesso';
                modal.querySelector('.modal-header').style.background = '#d4edda';
                header.style.color = '#155724';
                modal.classList.remove('error');
            } else if (type === 'error') {
                header.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro';
                modal.querySelector('.modal-header').style.background = '#f8d7da';
                header.style.color = '#721c24';
                modal.classList.add('error');
            }

            // Mostrar modal
            modal.classList.remove('hidden');
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');

                // Remover event listeners
                modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
                    btn.removeEventListener('click', onClose);
                });

                // Remover listener do ESC
                document.removeEventListener('keydown', escHandler);
            };

            const onClose = () => {
                cleanup();
                resolve();
            };

            const escHandler = (e) => {
                if (e.key === 'Escape') onClose();
            };

            // Configurar eventos de fechamento
            modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
                btn.addEventListener('click', onClose);
            });

            // Fechar clicando fora do modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) onClose();
            });

            // Fechar com ESC
            document.addEventListener('keydown', escHandler);

            // Auto-fechar após 3 segundos apenas para sucesso
            if (type === 'success') {
                setTimeout(onClose, 3000);
            }
        });
    }

    // =========================
    // CONFIGURAR EVENT LISTENERS PARA NOTIFICAÇÕES
    // =========================
    function setupNotificationListeners() {
        console.log('🔧 Configurando listeners de notificações...');

        // Delegar eventos para fechar modais de notificação
        document.addEventListener('click', function(e) {
            // Botão X (modal-close) no modal de notificação
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    modal.classList.add('hidden');
                }
            }

            // Botão "OK" no modal de notificação
            if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    modal.classList.add('hidden');
                }
            }

            // Clicar fora do modal de notificação
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                e.target.classList.add('hidden');
            }
        });

        // Fechar notificação com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const notificationModal = getElement('notification-modal');
                if (notificationModal && notificationModal.classList.contains('active')) {
                    notificationModal.classList.remove('active');
                    notificationModal.classList.add('hidden');
                }
            }
        });

        console.log('✅ Listeners de notificações configurados');
    }

    // =========================
    // UPDATE DEPENDÊNCIAS SELECTS
    // =========================
    function updateLocais(modal) {
        const tipoSelect = getElement(`tipo-ambiente-${modal}`);
        const selectLocal = getElement(`local-detalhe-${modal}`);
        if(!tipoSelect || !selectLocal) return;

        const tipoAmbiente = tipoSelect.value;
        if(tipoAmbiente==="sala") populateSelect(selectLocal, salasAula);
        else if(tipoAmbiente==="laboratorio") populateSelect(selectLocal, laboratorios);
        else selectLocal.innerHTML = `<option value="">Selecione...</option>`;

        updateKits(modal);
    }

    function updateKits(modal) {
        const tipoSelect = getElement(`tipo-ambiente-${modal}`);
        const selectKit = getElement(`tipo-kit-${modal}`);
        if(!tipoSelect || !selectKit) return;

        const tipoAmbiente = tipoSelect.value;
        if(kits[tipoAmbiente]) populateSelect(selectKit, kits[tipoAmbiente]);
        else populateSelect(selectKit, []);

        updateProblemas(modal);
    }

    function updateProblemas(modal) {
        const selectKit = getElement(`tipo-kit-${modal}`);
        const selectProblema = getElement(`tipo-problema-${modal}`);
        if(!selectKit || !selectProblema) return;

        const kit = selectKit.value || "default";
        const listaProblemas = problemas[kit] || problemas.default;
        populateSelect(selectProblema, listaProblemas);
    }

    // =========================
    // MODAIS
    // =========================
    const modalProblema = getElement("modal-problema");
    const modalInstalacao = getElement("modal-instalacao");
    const abrirProblema = getElement("abrir-problema");
    const abrirInstalacao = getElement("abrir-instalacao");

    function openModal(modal) {
        if(modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    function closeModal(modal) {
        if(modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }

    abrirProblema?.addEventListener("click", () => openModal(modalProblema));
    abrirInstalacao?.addEventListener("click", () => openModal(modalInstalacao));

    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", e => {
            const target = e.target.dataset.close;
            const modal = getElement(`modal-${target}`);
            closeModal(modal);
        });
    });

    [modalProblema, modalInstalacao].forEach(modal => {
        modal?.addEventListener("click", e => {
            if(e.target === modal) closeModal(modal);
        });
    });

    document.addEventListener("keydown", e => {
        if(e.key === "Escape") {
            closeModal(modalProblema);
            closeModal(modalInstalacao);
        }
    });

    ["problema","instalacao"].forEach(modal=>{
        const tipoSelect = getElement(`tipo-ambiente-${modal}`);
        const kitSelect = getElement(`tipo-kit-${modal}`);
        tipoSelect?.addEventListener("change", ()=>updateLocais(modal));
        kitSelect?.addEventListener("change", ()=>updateProblemas(modal));
        updateLocais(modal);
    });

    // =========================
    // UPLOAD DE ARQUIVOS
    // =========================
    function handleFileUpload(fileInput, fileList) {
        if(!fileInput || !fileList) return;

        fileList.innerHTML = "";
        const files = Array.from(fileInput.files);

        if(files.length > 3) {
            showNotification("Máximo de 3 arquivos permitidos.", 'error');
            fileInput.value = "";
            return;
        }

        files.forEach((file, i) => {
            const item = document.createElement("div");
            item.className = "file-item";

            if(file.type.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.className = "preview-thumb";
                img.alt = file.name;
                item.appendChild(img);
            } else {
                const icon = document.createElement("i");
                icon.className = "fas fa-file-alt";
                item.appendChild(icon);
            }

            const name = document.createElement("span");
            name.textContent = file.name;
            item.appendChild(name);

            const remove = document.createElement("span");
            remove.className = "remove";
            remove.dataset.index = i;
            remove.innerHTML = "&times;";
            item.appendChild(remove);

            fileList.appendChild(item);
        });

        fileList.querySelectorAll(".remove").forEach(btn=>{
            btn.addEventListener("click", e=>{
                const index = parseInt(e.target.dataset.index);
                const newFiles = files.filter((_, i)=>i!==index);
                const dt = new DataTransfer();
                newFiles.forEach(f=>dt.items.add(f));
                fileInput.files = dt.files;
                handleFileUpload(fileInput, fileList);
            });
        });
    }

    const btnUpload = getElement("file-upload-btn");
    const inputUpload = getElement("file-upload-problema");
    const listUpload = getElement("file-list-problema");

    if(btnUpload && inputUpload){
        btnUpload.addEventListener("click", ()=>inputUpload.click());
        inputUpload.addEventListener("change", ()=>handleFileUpload(inputUpload, listUpload));
    }

    // =========================
    // ENVIO DE FORMULÁRIOS COM NOTIFICAÇÕES
    // =========================
    async function enviarOrdem(body, filesInput, tipoOrdem, modalElement){
        const token = localStorage.getItem("authToken");
        if(!token){
            await showNotification("Sessão expirada. Faça login novamente.", 'error');
            setTimeout(() => {
                window.location.href="../../index.html";
            }, 1500);
            return;
        }

        try{
            let bodyToSend;
            let headers = {Authorization: `Bearer ${token}`};

            if(filesInput && filesInput.files.length>0){
                bodyToSend = new FormData();
                for(const[key,value] of Object.entries(body)) bodyToSend.append(key,value);
                for(const file of filesInput.files) bodyToSend.append("anexos",file);
            } else {
                headers["Content-Type"]="application/json";
                bodyToSend = JSON.stringify(body);
            }

            const res = await fetch("/api/ordens",{
                method:"POST",
                headers,
                body: bodyToSend
            });

            const data = await res.json();
            if(!res.ok) {
                const errorMsg = data.erro || data.message || "Erro ao criar ordem.";
                throw new Error(errorMsg);
            }

            // Sucesso - mostrar notificação personalizada
            const tipoMsg = tipoOrdem==="problema"?"Problema":"Instalação";
            await showNotification(`${tipoMsg} enviada com sucesso!`, 'success');

            if(modalElement) closeModal(modalElement);

            // Redirecionar após 1.5 segundos para dar tempo de ver a notificação
            setTimeout(() => {
                window.location.href="minhas-ordens.html";
            }, 1500);
        } catch(err){
            console.error("Erro ao enviar ordem:", err);
            await showNotification(`Erro ao enviar a ordem: ${err.message}`, 'error');
        }
    }

    // =========================
    // VALIDAÇÃO DE FORMULÁRIOS
    // =========================
    function validarFormProblema() {
        const tipoAmbiente = getElement("tipo-ambiente-problema").value;
        const local = getElement("local-detalhe-problema").value;
        const kit = getElement("tipo-kit-problema").value;
        const problema = getElement("tipo-problema-problema").value;

        if (!tipoAmbiente) {
            showNotification("Selecione o tipo de ambiente", 'error');
            return false;
        }
        if (!local) {
            showNotification("Selecione o local", 'error');
            return false;
        }
        if (!kit) {
            showNotification("Selecione o equipamento", 'error');
            return false;
        }
        if (!problema) {
            showNotification("Selecione o tipo de problema", 'error');
            return false;
        }

        return true;
    }

    function validarFormInstalacao() {
        const tipoAmbiente = getElement("tipo-ambiente-instalacao").value;
        const local = getElement("local-detalhe-instalacao").value;
        const appNome = getElement("app-name-instalacao").value;

        if (!tipoAmbiente) {
            showNotification("Selecione o tipo de ambiente", 'error');
            return false;
        }
        if (!local) {
            showNotification("Selecione o local", 'error');
            return false;
        }
        if (!appNome.trim()) {
            showNotification("Informe o nome do aplicativo", 'error');
            return false;
        }

        return true;
    }

    // =========================
    // EVENTOS DE SUBMIT
    // =========================
    const formProblema = getElement("form-problema");
    const formInstalacao = getElement("form-instalacao");

    formProblema?.addEventListener("submit", async e => {
        e.preventDefault();

        if (!validarFormProblema()) return;

        const body = {
            tipo_solicitacao: "problema",
            titulo: `${getElement("local-detalhe-problema").value} - ${getElement("tipo-kit-problema").value}`,
            local_tipo: getElement("tipo-ambiente-problema").value,
            local_detalhe: getElement("local-detalhe-problema").value,
            equipamento: getElement("tipo-kit-problema").value,
            tipo_problema: getElement("tipo-problema-problema").value,
            descricao: getElement("descricao-problema").value
        };

        await enviarOrdem(body, getElement("file-upload-problema"), "problema", modalProblema);
    });

    formInstalacao?.addEventListener("submit", async e => {
        e.preventDefault();

        if (!validarFormInstalacao()) return;

        const body = {
            tipo_solicitacao: "instalacao",
            titulo: `${getElement("local-detalhe-instalacao").value} - ${getElement("app-name-instalacao").value}`,
            app_nome: getElement("app-name-instalacao").value,
            app_versao: getElement("app-version-instalacao").value || null,
            app_link: getElement("app-link-instalacao").value || null,
            local_tipo: getElement("tipo-ambiente-instalacao").value, 
            local_detalhe: getElement("local-detalhe-instalacao").value
        };

        await enviarOrdem(body, null, "instalacao", modalInstalacao);
    });

    // =========================
    // INICIALIZAÇÃO
    // =========================
    function init() {
        console.log("Sistema Support Nexus - Criar Ordem carregado com sucesso!");
        setupNotificationListeners();
    }

    init();
});