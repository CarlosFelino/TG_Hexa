// assets/js/criar-ordem.js

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

    // Lógica de dependência dos selects
    function updateLocais(modal) {
        const tipoSelect = getElement(`tipo-ambiente-${modal}`);
        const selectLocal = getElement(`local-detalhe-${modal}`);
        if(!tipoSelect || !selectLocal) return;

        const tipoAmbiente = tipoSelect.value;
        if(tipoAmbiente==="sala") populateSelect(selectLocal, salasAula);
        else if(tipoAmbiente==="laboratorio") populateSelect(selectLocal, laboratorios);
        else selectLocal.innerHTML = `<option value="">Selecione...</option>`;

        if(modal === "problema") updateKits(modal);
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
        // Verifica se existe lista específica, senão usa default
        const listaProblemas = problemas[kit] || problemas.default;
        populateSelect(selectProblema, listaProblemas);
    }

    // =========================
    // LÓGICA DOS MODAIS
    // =========================
    const modalProblema = getElement("modal-problema");
    const modalInstalacao = getElement("modal-instalacao");
    const abrirProblema = getElement("abrir-problema");
    const abrirInstalacao = getElement("abrir-instalacao");

    function openModal(modal) {
        if(modal) {
            modal.classList.add("active"); // Usa a classe do CSS novo
            document.body.style.overflow = "hidden"; // Previne scroll no fundo
        }
    }

    function closeModal(modal) {
        if(modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }

    // Event Listeners para abrir
    if(abrirProblema) {
        abrirProblema.addEventListener("click", () => {
            console.log("Clicou em Relatar Problema");
            openModal(modalProblema);
        });
    }

    if(abrirInstalacao) {
        abrirInstalacao.addEventListener("click", () => {
            console.log("Clicou em Solicitar Instalação");
            openModal(modalInstalacao);
        });
    }

    // Event Listeners para fechar (X e Fundo)
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", e => {
            const target = e.target.dataset.close; // "problema" ou "instalacao"
            const modal = getElement(`modal-${target}`);
            closeModal(modal);
        });
    });

    [modalProblema, modalInstalacao].forEach(modal => {
        if(modal) {
            modal.addEventListener("click", e => {
                if (e.target === modal) closeModal(modal);
            });
        }
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeModal(modalProblema);
            closeModal(modalInstalacao);
        }
    });

    // Listeners para selects dinâmicos
    ["problema", "instalacao"].forEach(modal => {
        const tipoSelect = getElement(`tipo-ambiente-${modal}`);
        const kitSelect = getElement(`tipo-kit-${modal}`);
        
        if(tipoSelect) tipoSelect.addEventListener("change", () => updateLocais(modal));
        if(kitSelect) kitSelect.addEventListener("change", () => updateProblemas(modal));
    });

    // =========================
    // UPLOAD DE ARQUIVOS
    // =========================
    function handleFileUpload(fileInput, fileList) {
        if (!fileInput || !fileList) return;
        
        // Limpa lista visual atual
        fileList.innerHTML = "";
        const files = Array.from(fileInput.files);

        if (files.length > 3) {
            alert("Máximo de 3 arquivos permitidos.");
            fileInput.value = ""; // Limpa input
            return;
        }

        files.forEach((file, i) => {
            const item = document.createElement("div");
            item.className = "file-item";
            item.innerHTML = `
                <i class="fas fa-file"></i>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                <span class="remove" data-index="${i}" style="cursor: pointer; color: red; margin-left: 10px;">&times;</span>
            `;
            fileList.appendChild(item);
        });

        // Re-adicionar eventos de remover
        fileList.querySelectorAll(".remove").forEach(btn => {
            btn.addEventListener("click", e => {
                const index = parseInt(e.target.dataset.index);
                const dt = new DataTransfer();
                const { files } = fileInput;
                
                for (let i = 0; i < files.length; i++) {
                    if (i !== index) dt.items.add(files[i]);
                }
                
                fileInput.files = dt.files; // Atualiza o input real
                handleFileUpload(fileInput, fileList); // Atualiza visual
            });
        });
    }

    // Conectar botão bonito ao input feio
    const btnUpload = document.getElementById("file-upload-btn");
    const inputUpload = document.getElementById("file-upload-problema");
    const listUpload = document.getElementById("file-list-problema");

    if (btnUpload && inputUpload) {
        btnUpload.addEventListener("click", () => inputUpload.click());
        inputUpload.addEventListener("change", () => handleFileUpload(inputUpload, listUpload));
    }

    // =========================
    // ENVIO DO FORMULÁRIO
    // =========================
    const formProblema = getElement("form-problema");
    const formInstalacao = getElement("form-instalacao");

    async function enviarOrdem(body, fileInput) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessão expirada.");
            return;
        }

        try {
            let requestBody;
            let headers = { "Authorization": `Bearer ${token}` };

            // Se tiver arquivos, usa FormData
            if (fileInput && fileInput.files.length > 0) {
                requestBody = new FormData();
                // Adiciona campos de texto
                Object.keys(body).forEach(key => requestBody.append(key, body[key]));
                // Adiciona arquivos
                Array.from(fileInput.files).forEach(file => requestBody.append("anexos", file));
            } else {
                // Se não, usa JSON
                headers["Content-Type"] = "application/json";
                requestBody = JSON.stringify(body);
            }

            // Simulação de Loading
            const btn = document.querySelector(".modal.active button[type='submit']");
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btn.disabled = true;

            const res = await fetch("/api/ordens", {
                method: "POST",
                headers: headers,
                body: requestBody
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.erro || "Erro ao criar ordem");

            alert("✅ Ordem criada com sucesso!");
            window.location.href = "minhas-ordens.html";

        } catch (err) {
            console.error(err);
            alert("Erro ao enviar: " + err.message);
            const btn = document.querySelector(".modal.active button[type='submit']");
            if(btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    }

    if (formProblema) {
        formProblema.addEventListener("submit", (e) => {
            e.preventDefault();
            const body = {
                tipo_solicitacao: "problema",
                titulo: `Problema em ${getElement("local-detalhe-problema").value}`,
                local_tipo: getElement("tipo-ambiente-problema").value,
                local_detalhe: getElement("local-detalhe-problema").value,
                equipamento: getElement("tipo-kit-problema").value,
                tipo_problema: getElement("tipo-problema-problema").value,
                descricao: getElement("descricao-problema").value
            };
            enviarOrdem(body, getElement("file-upload-problema"));
        });
    }

    if (formInstalacao) {
        formInstalacao.addEventListener("submit", (e) => {
            e.preventDefault();
            const body = {
                tipo_solicitacao: "instalacao",
                titulo: `Instalação: ${getElement("app-name-instalacao").value}`,
                local_tipo: getElement("tipo-ambiente-instalacao").value,
                local_detalhe: getElement("local-detalhe-instalacao").value,
                app_nome: getElement("app-name-instalacao").value,
                app_versao: getElement("app-version-instalacao").value,
                app_link: getElement("app-link-instalacao").value
            };
            enviarOrdem(body, null); // Instalação não tem anexo aqui
        });
    }
});