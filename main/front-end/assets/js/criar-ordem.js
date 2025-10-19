document.addEventListener("DOMContentLoaded", function() {
    // =========================
    // DADOS DO SISTEMA
    // =========================
    const salasAula = ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "304", "305", "307", "310", "311", "312", "313"];
    const laboratorios = ["202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "213", "214", "215"];

    const kits = {
        "sala": [
            { value: "kit-professor", label: "Kit Professor", icon: "fas fa-desktop" },
            { value: "tv", label: "TV", icon: "fas fa-tv" },
            { value: "perifericos", label: "Periféricos (Mouse/Teclado)", icon: "fas fa-keyboard" },
            { value: "conectividade", label: "Problema de Conectividade", icon: "fas fa-wifi" }
        ],
        "laboratorio": [
            { value: "kit-professor", label: "Kit Professor", icon: "fas fa-desktop" },
            { value: "kit-aluno-desktop", label: "Kit Aluno (Desktop)", icon: "fas fa-computer" },
            { value: "kit-aluno-notebook", label: "Kit Aluno (Notebook)", icon: "fas fa-laptop" },
            { value: "perifericos", label: "Periféricos (Mouse/Teclado)", icon: "fas fa-keyboard" },
            { value: "conectividade", label: "Problema de Conectividade", icon: "fas fa-wifi" }
        ]
    };

    const problemas = {
        "kit-professor": [
            { value: "sem-video", label: "Monitor não liga", icon: "fas fa-video-slash" },
            { value: "sem-internet", label: "Sem Internet", icon: "fas fa-wifi-slash" },
            { value: "nao-espelha-tv", label: "Não está espelhando na TV", icon: "fas fa-sync-alt" },
            { value: "gabinete-nao-liga", label: "Gabinete não liga", icon: "fas fa-power-off" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "kit-aluno-desktop": [
            { value: "sem-video", label: "Monitor não liga", icon: "fas fa-video-slash" },
            { value: "sem-internet", label: "Sem Internet", icon: "fas fa-wifi-slash" },
            { value: "gabinete-nao-liga", label: "Gabinete não liga", icon: "fas fa-power-off" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "kit-aluno-notebook": [
            { value: "sem-internet", label: "Sem Internet", icon: "fas fa-wifi-slash" },
            { value: "bateria", label: "Problema com Bateria", icon: "fas fa-battery-quarter" },
            { value: "nao-liga", label: "Notebook não liga", icon: "fas fa-power-off" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "tv": [
            { value: "nao-liga", label: "TV não liga", icon: "fas fa-power-off" },
            { value: "sem-sinal", label: "Sem sinal", icon: "fas fa-times-circle" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "perifericos": [
            { value: "mouse-defeito", label: "Mouse com defeito", icon: "fas fa-mouse" },
            { value: "teclado-defeito", label: "Teclado com defeito", icon: "fas fa-keyboard" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "conectividade": [
            { value: "cabo-rede", label: "Problema com cabo de rede", icon: "fas fa-network-wired" },
            { value: "keystone", label: "Problema com Keystone", icon: "fas fa-ethernet" },
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
        ],
        "default": [
            { value: "outro", label: "Outro problema", icon: "fas fa-question-circle" }
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
            if (o.icon) {
                opt.dataset.icon = o.icon;
            }
            select.appendChild(opt);
        });
    }

    function updateLocais() {
        const tipoAmbiente = getElement("tipo-ambiente").value;
        const selectLocal = getElement("local-detalhe");
        
        if (tipoAmbiente === "sala") {
            populateSelect(selectLocal, salasAula);
        } else if (tipoAmbiente === "laboratorio") {
            populateSelect(selectLocal, laboratorios);
        } else {
            selectLocal.innerHTML = `<option value="">Selecione...</option>`;
        }
        
        updateKits();
    }

    function updateKits() {
        const tipoAmbiente = getElement("tipo-ambiente").value;
        const selectKit = getElement("tipo-kit");
        
        if (kits[tipoAmbiente]) {
            populateSelect(selectKit, kits[tipoAmbiente]);
        } else {
            populateSelect(selectKit, []);
        }
        
        updateProblemas();
    }

    function updateProblemas() {
        const kitSelecionado = getElement("tipo-kit").value;
        const selectProblema = getElement("tipo-problema");
        
        if (problemas[kitSelecionado]) {
            populateSelect(selectProblema, problemas[kitSelecionado]);
        } else {
            populateSelect(selectProblema, problemas.default);
        }
    }

    // =========================
    // MANIPULAÇÃO DE MODAIS
    // =========================
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }

    // =========================
    // UPLOAD DE ARQUIVOS
    // =========================
    function handleFileUpload(fileInput, fileList) {
        if (!fileInput || !fileList) return;

        fileList.innerHTML = "";
        const files = Array.from(fileInput.files);

        if (files.length > 3) {
            alert("Você pode anexar no máximo 3 arquivos.");
            fileInput.value = "";
            return;
        }

        files.forEach((file, i) => {
            const div = document.createElement("div");
            div.className = "file-item";
            div.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <span>${file.name}</span>
                <span class="remove" data-index="${i}">&times;</span>
            `;
            fileList.appendChild(div);
        });

        fileList.querySelectorAll(".remove").forEach(btn => {
            btn.addEventListener("click", e => {
                const index = parseInt(e.target.dataset.index);
                const newFiles = files.filter((_, i) => i !== index);

                const dt = new DataTransfer();
                newFiles.forEach(f => dt.items.add(f));
                fileInput.files = dt.files;

                handleFileUpload(fileInput, fileList);
            });
        });
    }

    // =========================
    // ENVIO DE FORMULÁRIOS
    // =========================
    async function enviarOrdem(body, filesInput, ordemTipo, modalElement) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "../../index.html";
            return;
        }

        try {
            const res = await fetch("/api/ordens", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao criar ordem.");

            const ordemId = data.ordem?.id;

            if (ordemId && filesInput && filesInput.files.length > 0) {
                const formData = new FormData();
                for (const file of filesInput.files) formData.append("file-upload", file);

                await fetch(`/api/ordens/${ordemId}/anexos`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
            }

            alert(`${ordemTipo === "problema" ? "Problema" : "Instalação"} enviada com sucesso!`);

            if (modalElement) closeModal(modalElement);
            window.location.href = "minhas-ordens.html";
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar a ordem. Veja console.");
        }
    }

    // =========================
    // INICIALIZAÇÃO
    // =========================
    
    // Elementos dos modais
    const modalProblema = getElement("modal-problema");
    const modalInstalacao = getElement("modal-instalacao");
    const abrirProblema = getElement("abrir-problema");
    const abrirInstalacao = getElement("abrir-instalacao");

    // Eventos para abrir modais
    abrirProblema?.addEventListener("click", () => openModal(modalProblema));
    abrirInstalacao?.addEventListener("click", () => openModal(modalInstalacao));

    // Eventos para fechar modais
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.dataset.close;
            const modal = getElement(`modal-${modalId}`);
            closeModal(modal);
        });
    });

    // Fechar modal ao clicar fora
    [modalProblema, modalInstalacao].forEach(modal => {
        modal?.addEventListener("click", e => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Fechar com ESC
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeModal(modalProblema);
            closeModal(modalInstalacao);
        }
    });

    // Inicializar selects dinâmicos
    const tipoAmbienteSelect = getElement("tipo-ambiente");
    const tipoKitSelect = getElement("tipo-kit");
    
    if (tipoAmbienteSelect) {
        tipoAmbienteSelect.addEventListener("change", updateLocais);
    }
    
    if (tipoKitSelect) {
        tipoKitSelect.addEventListener("change", updateProblemas);
    }

    // Inicializar os selects
    updateLocais();

    // Upload de arquivos
    const uploadProblema = getElement("file-upload-problema");
    const listProblema = getElement("file-list-problema");
    const uploadInstalacao = getElement("file-upload-instalacao");
    const listInstalacao = getElement("file-list-instalacao");

    uploadProblema?.addEventListener("change", () => handleFileUpload(uploadProblema, listProblema));
    uploadInstalacao?.addEventListener("change", () => handleFileUpload(uploadInstalacao, listInstalacao));

    // Submissão dos formulários
    const formProblema = getElement("form-problema");
    const formInstalacao = getElement("form-instalacao");

    formProblema?.addEventListener("submit", e => {
        e.preventDefault();
        const body = {
            tipo_solicitacao: "problema",
            local_tipo: getElement("tipo-ambiente").value,
            local_detalhe: getElement("local-detalhe").value,
            equipamento: getElement("tipo-kit").value,
            tipo_problema: getElement("tipo-problema").value,
            descricao: getElement("descricao-problema").value
        };
        enviarOrdem(body, uploadProblema, "problema", modalProblema);
    });

    formInstalacao?.addEventListener("submit", e => {
        e.preventDefault();
        const body = {
            tipo_solicitacao: "instalacao",
            app_nome: getElement("app-name-instalacao").value,
            app_versao: getElement("app-version-instalacao").value,
            app_link: getElement("app-link-instalacao").value
        };
        enviarOrdem(body, null, "instalacao", modalInstalacao);
    });

    console.log("Sistema Support Nexus - Criar Ordem carregado com sucesso!");
});