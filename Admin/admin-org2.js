const ADMIN_AUTH_KEY = "organograma_admin_auth";
const DATA_SOURCES = [
    "/api/dados",
    "http://127.0.0.1:5000/api/dados",
    "http://localhost:5000/api/dados",
    "../dados.json"
];

const ORG2_OPERADOR_LIDER_TITULO = "Operador N2 Lider Plantão";
const ORG2_OPERADOR_TOTAL_CARDS = 4;
const ORG2_TECNICOS_SUPORTE_CARDS = 1;
const ORG2_TITLE_ONLY_CARGOS = new Set([
    "Segurança Eletrônica",
    "Diurno",
    "Noturno",
    "Central de Monitoramento",
    "Central Técnica",
    "Tecnologia",
    "Apoio e Logística",
    "Operação de Monitoramento",
    "Instalação",
    "Manutenção",
    "Instalação e Manutenção",
    "CIPLAN 5x2",
    "STF 6x1",
    "Clientes 6x1",
    "Projetos, Inovação e Planejamento",
    "Op. Apoio Técnico, ADM e Logístico",
    "Shield",
    "Diretoria Operacional",
    "Diretoria de Inovação, Processos e Tecnologia"
].map((label) => normalizeText(label)));

const ORG2_PERSISTABLE_FIELDS = ["nome", "foto", "descricao", "descricaoDetalhada"];

const treeSearchInput = document.getElementById("org2-tree-search");
const treeView = document.getElementById("org2-tree-view");
const placeholder = document.getElementById("org2-editor-placeholder");
const editForm = document.getElementById("org2-edit-form");
const formTitle = document.getElementById("org2-form-title");
const pathInput = document.getElementById("org2-path");
const cargoInput = document.getElementById("org2-cargo");
const cargoEditInput = document.getElementById("org2-cargo-edit");
const nomeInput = document.getElementById("org2-nome");
const fotoUrlInput = document.getElementById("org2-foto-url");
const fotoFileInput = document.getElementById("org2-foto-file");
const btnRemovePhoto = document.getElementById("org2-btn-remove-photo");
const photoPreview = document.getElementById("org2-photo-preview");
const descricaoInput = document.getElementById("org2-descricao");
const descricaoDetalhadaInput = document.getElementById("org2-descricao-detalhada");
const saveStatus = document.getElementById("org2-save-status");
const btnLogout = document.getElementById("btn-org2-logout");

let globalData = null;
let org2Snapshot = null;
let slotItems = [];
let selectedSlotId = "";
let isSaving = false;
let hasPendingSave = false;
let activeApiBase = "";
let backendOrigin = window.location.origin;

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function isEmptyEntry(entry) {
    if (typeof entry === "string") return String(entry).trim() === "";

    if (entry && typeof entry === "object") {
        return !Object.values(entry).some((value) => String(value || "").trim() !== "");
    }

    return true;
}

function ensureNodeNames(nodeData) {
    if (!Array.isArray(nodeData.nomes)) {
        nodeData.nomes = [];
    }
    return nodeData.nomes;
}

function readPersonData(nodeData, index) {
    const names = ensureNodeNames(nodeData);
    const entry = names[index];

    if (entry && typeof entry === "object") {
        return { ...entry };
    }
    if (typeof entry === "string") {
        return { nome: entry };
    }

    return {};
}

function writePersonData(nodeData, index, rawPayload) {
    const names = ensureNodeNames(nodeData);
    const previous = names[index];
    const base = (previous && typeof previous === "object") ? { ...previous } : {};

    ORG2_PERSISTABLE_FIELDS.forEach((field) => {
        const rawValue = String(rawPayload?.[field] || "");
        const normalized = field === "nome" ? rawValue.trim() : rawValue.trim();

        if (normalized) {
            base[field] = normalized;
        } else {
            delete base[field];
        }
    });

    if (Object.keys(base).length === 0) {
        names[index] = "";
    } else {
        names[index] = base;
    }

    while (names.length > 0) {
        if (!isEmptyEntry(names[names.length - 1])) break;
        names.pop();
    }
}

function isTitleOnlyCargo(cargo) {
    return ORG2_TITLE_ONLY_CARGOS.has(normalizeText(cargo));
}

function getCardDisplayCargo(nodeData, nameIndex = 0) {
    const customCargo = getCustomCardDisplayCargo(nodeData, nameIndex);
    if (customCargo) return customCargo;
    return getDefaultCardDisplayCargo(nodeData, nameIndex);
}

function getDefaultCardDisplayCargo(nodeData, nameIndex = 0) {
    const cargo = normalizeText(nodeData?.cargo);

    if (
        cargo === normalizeText("Operadores Diurnos") ||
        cargo === normalizeText("Operadores Noturnos")
    ) {
        if (nameIndex % 2 === 0) {
            return ORG2_OPERADOR_LIDER_TITULO;
        }
        return nameIndex === 1 ? "Operador (PCD)" : "Operador";
    }

    if (cargo === normalizeText("Tecnicos de Suporte")) {
        const limiteTecnicosSuporte = ORG2_TECNICOS_SUPORTE_CARDS;

        if (nameIndex >= limiteTecnicosSuporte) {
            return "Jovem Aprendiz";
        }
    }

    if (
        cargo === normalizeText("Equipe de Jovens Aprendiz") ||
        cargo === normalizeText("Equipe de Jovem Aprendiz")
    ) {
        return "Jovem Aprendiz";
    }

    return String(nodeData?.cargo || "Sem Cargo");
}

function ensureNodeDisplayCargos(nodeData) {
    if (!Array.isArray(nodeData.cargosExibicao)) {
        nodeData.cargosExibicao = [];
    }
    return nodeData.cargosExibicao;
}

function getCustomCardDisplayCargo(nodeData, nameIndex) {
    const labels = Array.isArray(nodeData?.cargosExibicao) ? nodeData.cargosExibicao : [];
    const rawValue = labels[nameIndex];
    return typeof rawValue === "string" ? rawValue.trim() : "";
}

function setCustomCardDisplayCargo(nodeData, nameIndex, rawValue) {
    const labels = ensureNodeDisplayCargos(nodeData);
    const normalizedValue = String(rawValue || "")
        .replace(/\s+/g, " ")
        .trim();
    const defaultLabel = String(getDefaultCardDisplayCargo(nodeData, nameIndex) || "").trim();

    if (!normalizedValue || normalizeText(normalizedValue) === normalizeText(defaultLabel)) {
        labels[nameIndex] = "";
    } else {
        labels[nameIndex] = normalizedValue;
    }

    while (labels.length > 0) {
        if (String(labels[labels.length - 1] || "").trim()) break;
        labels.pop();
    }

    if (labels.length === 0) {
        delete nodeData.cargosExibicao;
    }
}

function getExtraCardCopies(nodeData) {
    const cargo = normalizeText(nodeData?.cargo);

    if (
        cargo === normalizeText("Jovem Aprendiz") ||
        cargo === normalizeText("Equipe de Jovens Aprendiz") ||
        cargo === normalizeText("Equipe de Jovem Aprendiz")
    ) {
        return 1;
    }

    if (cargo === normalizeText("Tecnicos de Suporte")) {
        return 2;
    }

    if (!Number.isFinite(nodeData?.quantidade) || nodeData.quantidade <= 1) {
        return 0;
    }

    if (cargo === normalizeText("Operadores Diurnos")) {
        return ORG2_OPERADOR_TOTAL_CARDS - 1;
    }
    if (cargo === normalizeText("Operadores Noturnos")) {
        return ORG2_OPERADOR_TOTAL_CARDS - 1;
    }
    if (cargo === normalizeText("Auxiliares Tecnicos")) {
        return 3;
    }
    if (cargo === normalizeText("Tecnicos")) {
        return 3;
    }

    return 1;
}

function collectEditableSlots(nodeData, path = [], output = []) {
    if (!nodeData || typeof nodeData !== "object") return output;

    const currentCargo = String(nodeData.cargo || "Sem Cargo");
    const nextPath = [...path, currentCargo];

    if (!isTitleOnlyCargo(currentCargo)) {
        const slotsCount = 1 + getExtraCardCopies(nodeData);

        for (let index = 0; index < slotsCount; index += 1) {
            const person = readPersonData(nodeData, index);
            const cargoBaseLabel = getDefaultCardDisplayCargo(nodeData, index);
            const cargoCustomAtual = getCustomCardDisplayCargo(nodeData, index);
            output.push({
                id: `${output.length}-${nextPath.join("|")}-${index}`,
                nodeRef: nodeData,
                nameIndex: index,
                pathLabel: nextPath.join(" > "),
                cargoLabel: getCardDisplayCargo(nodeData, index),
                cargoBaseLabel,
                cargoCustomAtual,
                nomeAtual: String(person.nome || "")
            });
        }
    }

    const filhos = Array.isArray(nodeData.filhos) ? nodeData.filhos : [];
    filhos.forEach((child) => collectEditableSlots(child, nextPath, output));
    return output;
}

function setStatus(message, isError = false) {
    if (!saveStatus) return;
    saveStatus.textContent = message;
    saveStatus.classList.remove("hidden");
    saveStatus.style.color = isError ? "#dc2626" : "#16a34a";
}

function clearStatusLater(delayMs = 2500) {
    if (!saveStatus) return;
    window.setTimeout(() => {
        saveStatus.classList.add("hidden");
        saveStatus.textContent = "";
    }, delayMs);
}

function resolvePhotoForPreview(value) {
    const src = String(value || "").trim();
    if (!src) return "";

    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
        return src;
    }

    if (src.startsWith("/")) {
        return `${backendOrigin}${src}`;
    }

    if (src.startsWith("uploads/")) {
        return `${backendOrigin}/${src}`;
    }

    return src;
}

function updatePhotoPreview(rawUrl, options = {}) {
    const showError = options.showError !== false;
    if (!photoPreview) return;
    const src = resolvePhotoForPreview(rawUrl);
    if (!src) {
        photoPreview.onerror = null;
        photoPreview.onload = null;
        photoPreview.classList.add("hidden");
        photoPreview.removeAttribute("src");
        return;
    }

    photoPreview.onerror = () => {
        photoPreview.classList.add("hidden");
        if (showError) {
            setStatus("Falha ao carregar prévia da foto. Use uma URL direta de imagem (.jpg/.png).", true);
        }
    };
    photoPreview.onload = () => {
        photoPreview.classList.remove("hidden");
    };
    photoPreview.src = src;
}

function getSelectedSlot() {
    return slotItems.find((slot) => slot.id === selectedSlotId) || null;
}

function renderTree() {
    if (!treeView) return;
    treeView.innerHTML = "";

    const query = normalizeText(treeSearchInput?.value || "");
    const list = document.createElement("ul");

    let matches = 0;
    slotItems.forEach((slot) => {
        const searchable = normalizeText(
            `${slot.pathLabel} ${slot.cargoLabel} ${slot.nomeAtual}`
        );
        if (query && !searchable.includes(query)) return;
        matches += 1;

        const li = document.createElement("li");
        const item = document.createElement("div");
        item.className = "tree-item";
        if (slot.id === selectedSlotId) {
            item.classList.add("selected");
        }

        const main = document.createElement("div");
        main.className = "tree-item-main";

        const icon = document.createElement("span");
        icon.className = "material-icons-round";
        icon.textContent = "badge";

        const name = document.createElement("span");
        name.className = "tree-item-name";
        name.textContent = slot.nomeAtual || "Sem nome";

        main.appendChild(icon);
        main.appendChild(name);

        const role = document.createElement("small");
        role.className = "tree-item-role";
        role.textContent = `${slot.cargoLabel} • #${slot.nameIndex + 1}`;

        item.appendChild(main);
        item.appendChild(role);
        item.addEventListener("click", () => {
            selectedSlotId = slot.id;
            fillFormFromSlot(slot);
            renderTree();
        });

        li.appendChild(item);
        list.appendChild(li);
    });

    if (matches === 0) {
        const empty = document.createElement("p");
        empty.style.color = "#64748b";
        empty.style.fontSize = "13px";
        empty.textContent = "Nenhum card encontrado para o filtro informado.";
        treeView.appendChild(empty);
        return;
    }

    treeView.appendChild(list);
}

function fillFormFromSlot(slot) {
    if (!slot || !editForm || !placeholder) return;
    const person = readPersonData(slot.nodeRef, slot.nameIndex);
    const cargoBase = String(slot.cargoBaseLabel || slot.cargoLabel || "");
    const cargoCustom = String(slot.cargoCustomAtual || "");

    placeholder.classList.add("hidden");
    editForm.classList.remove("hidden");
    if (formTitle) formTitle.textContent = `Editar ${slot.cargoLabel}`;
    if (pathInput) pathInput.value = slot.pathLabel;
    if (cargoInput) cargoInput.value = cargoBase;
    if (cargoEditInput) cargoEditInput.value = cargoCustom || cargoBase;
    if (nomeInput) nomeInput.value = String(person.nome || "");
    if (fotoUrlInput) fotoUrlInput.value = String(person.foto || "");
    if (descricaoInput) descricaoInput.value = String(person.descricao || "");
    if (descricaoDetalhadaInput) descricaoDetalhadaInput.value = String(person.descricaoDetalhada || "");
    if (fotoFileInput) fotoFileInput.value = "";
    updatePhotoPreview(person.foto || "", { showError: false });
}

async function persistData() {
    if (isSaving) {
        hasPendingSave = true;
        return;
    }

    isSaving = true;
    try {
        setStatus("Salvando...");
        const response = await fetch("/api/dados", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(globalData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        setStatus("Salvo com sucesso.");
        clearStatusLater();
    } catch (error) {
        console.error("Falha ao salvar ORG2:", error);
        setStatus("Falha ao salvar. Tente novamente.", true);
    } finally {
        isSaving = false;
        if (hasPendingSave) {
            hasPendingSave = false;
            await persistData();
        }
    }
}

async function fetchWithTimeout(url, timeoutMs = 2200) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { cache: "no-store", signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function loadData() {
    for (const source of DATA_SOURCES) {
        try {
            const response = await fetchWithTimeout(source);
            if (!response.ok) continue;

            if (source.endsWith("/api/dados")) {
                activeApiBase = source.slice(0, -"/dados".length);
                try {
                    backendOrigin = new URL(source, window.location.href).origin;
                } catch (error) {
                    backendOrigin = window.location.origin;
                }
            }

            return await response.json();
        } catch (error) {
            console.debug(`Falha ao carregar ${source}:`, error?.message || error);
        }
    }
    throw new Error("Nenhuma fonte de dados disponivel.");
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function ensureOrg2Snapshot(data) {
    if (!data.organograma2 || typeof data.organograma2 !== "object") {
        data.organograma2 = {
            diretorias: [],
            estrutura: { nivel: 1, cargo: "Segurança Eletrônica", filhos: [] }
        };
    }

    if (!data.organograma2.estrutura || typeof data.organograma2.estrutura !== "object") {
        data.organograma2.estrutura = { nivel: 1, cargo: "Segurança Eletrônica", filhos: [] };
    }

    return data.organograma2;
}

async function uploadPhotoFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = activeApiBase ? `${activeApiBase}/upload-photo` : "/api/upload-photo";
    const response = await fetch(endpoint, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.url) {
        throw new Error("Resposta de upload sem URL.");
    }

    return resolvePhotoForPreview(payload.url);
}

function refreshSlotsAndTree() {
    slotItems = collectEditableSlots(org2Snapshot.estrutura, [], []);
    const selected = getSelectedSlot();
    if (!selected && slotItems.length > 0) {
        selectedSlotId = slotItems[0].id;
    }
    renderTree();
    const slotToRender = getSelectedSlot();
    if (slotToRender) {
        fillFormFromSlot(slotToRender);
    }
}

function initEventHandlers() {
    treeSearchInput?.addEventListener("input", () => renderTree());

    fotoUrlInput?.addEventListener("input", () => {
        updatePhotoPreview(fotoUrlInput.value, { showError: false });
    });

    fotoUrlInput?.addEventListener("blur", () => {
        updatePhotoPreview(fotoUrlInput.value, { showError: true });
    });

    fotoFileInput?.addEventListener("change", async () => {
        const file = fotoFileInput.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setStatus("Selecione um arquivo de imagem válido.", true);
            fotoFileInput.value = "";
            return;
        }

        try {
            setStatus("Enviando foto...");
            try {
                const uploadedUrl = await uploadPhotoFile(file);
                fotoUrlInput.value = uploadedUrl;
                updatePhotoPreview(uploadedUrl, { showError: true });
                setStatus("Foto enviada com sucesso.");
            } catch (uploadError) {
                const dataUrl = await fileToDataUrl(file);
                fotoUrlInput.value = dataUrl;
                updatePhotoPreview(dataUrl, { showError: true });
                setStatus("Backend indisponível para upload. Prévia local aplicada.");
            }
            clearStatusLater();
        } catch (error) {
            console.error("Falha no upload de foto:", error);
            setStatus(`Falha no upload: ${error.message}`, true);
        } finally {
            fotoFileInput.value = "";
        }
    });

    btnRemovePhoto?.addEventListener("click", () => {
        if (fotoUrlInput) {
            fotoUrlInput.value = "";
        }
        updatePhotoPreview("");
    });

    editForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const selected = getSelectedSlot();
        if (!selected) return;

        const payload = {
            nome: String(nomeInput?.value || ""),
            foto: String(fotoUrlInput?.value || ""),
            descricao: String(descricaoInput?.value || ""),
            descricaoDetalhada: String(descricaoDetalhadaInput?.value || "")
        };

        setCustomCardDisplayCargo(selected.nodeRef, selected.nameIndex, cargoEditInput?.value || "");
        writePersonData(selected.nodeRef, selected.nameIndex, payload);
        refreshSlotsAndTree();
        selectedSlotId = selected.id;
        renderTree();
        fillFormFromSlot(getSelectedSlot());
        await persistData();
    });

    btnLogout?.addEventListener("click", () => {
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
        window.location.href = "login.html?next=admin-org2.html";
    });
}

async function init() {
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) !== "ok") {
        window.location.href = "login.html?next=admin-org2.html";
        return;
    }

    try {
        globalData = await loadData();
        org2Snapshot = ensureOrg2Snapshot(globalData);
        initEventHandlers();
        refreshSlotsAndTree();
    } catch (error) {
        console.error("Falha ao inicializar admin do ORG2:", error);
        if (treeView) {
            treeView.innerHTML = "<p style='color:#dc2626;'>Erro ao carregar dados do ORG2.</p>";
        }
        setStatus("Erro ao carregar dados.", true);
    }
}

window.addEventListener("DOMContentLoaded", init);
