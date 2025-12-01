// assets/js/criar-ordem.js

// Importa globalCred.js se necessário
// import "../../assets/js/globalCred.js";

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
            alert("Máximo de 3 arquivos permitidos.");
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
    // ENVIO DE FORMULÁRIOS
    // =========================
    async function enviarOrdem(body, filesInput, tipoOrdem, modalElement){
        const token = localStorage.getItem("authToken");
        if(!token){
            alert("Sessão expirada. Faça login novamente.");
            window.location.href="../../index.html";
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
            if(!res.ok) throw new Error(data.erro||"Erro ao criar ordem.");

            alert(`${tipoOrdem==="problema"?"Problema":"Instalação"} enviada com sucesso!`);
            if(modalElement) closeModal(modalElement);
            window.location.href="minhas-ordens.html";
        } catch(err){
            console.error(err);
            alert("Erro ao enviar a ordem. Veja console para detalhes.");
        }
    }

    const formProblema = getElement("form-problema");
    const formInstalacao = getElement("form-instalacao");

    formProblema?.addEventListener("submit", e=>{
        e.preventDefault();
        const body = {
            tipo_solicitacao:"problema",
            titulo:`${getElement("local-detalhe-problema").value} + ${getElement("tipo-kit-problema").value}`,
            local_tipo: getElement("tipo-ambiente-problema").value,
            local_detalhe: getElement("local-detalhe-problema").value,
            equipamento: getElement("tipo-kit-problema").value,
            tipo_problema: getElement("tipo-problema-problema").value,
            descricao: getElement("descricao-problema").value
        };
        enviarOrdem(body, getElement("file-upload-problema"), "problema", modalProblema);
    });

    formInstalacao?.addEventListener("submit", e=>{
        e.preventDefault();
        const body = {
            tipo_solicitacao:"instalacao",
            titulo:`${getElement("local-detalhe-instalacao").value} + ${getElement("app-name-instalacao").value}`,
            app_nome: getElement("app-name-instalacao").value,
            app_versao: getElement("app-version-instalacao").value,
            app_link: getElement("app-link-instalacao").value,
            local_tipo: getElement("tipo-ambiente-instalacao").value, 
            local_detalhe: getElement("local-detalhe-instalacao").value
        };
        enviarOrdem(body, null, "instalacao", modalInstalacao);
    });

    console.log("Sistema Support Nexus - Criar Ordem carregado com sucesso!");
});
