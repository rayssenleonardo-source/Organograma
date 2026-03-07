// admin.js - Painel Administrativo com backend opcional

let globalData = null;
let selectedNode = null;
let selectedParent = null;
let selectedIndex = -1;
let selectedOperatorRef = null;
let selectedDuplaRef = null;

const STORAGE_KEY = 'organograma_admin_draft_v3';
const ADMIN_AUTH_KEY = 'organograma_admin_auth';
const DATA_SOURCES = ['../dados.json', '/dados.json', 'dados.json'];
const API_BASE_CANDIDATES = Array.from(
    new Set([
        `${window.location.origin}/api`,
        'http://127.0.0.1:5000/api',
        'http://localhost:5000/api'
    ])
);
const EDITABLE_FIELDS = [
    'nome',
    'turno',
    'foto',
    'email',
    'matricula',
    'telefone',
    'nascimento',
    'admissao',
    'descricao',
    'descricaoDetalhada'
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_TREE_LEVEL = 1;
const MAX_TREE_LEVEL = 5;

let activeApiBase = null;
let backendOrigin = window.location.origin;
let autoSaveTimer = null;
const DEBUG_ADMIN_ERRORS = true;

const treeView = document.getElementById('tree-view');
const treeSearch = document.getElementById('tree-search');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editForm = document.getElementById('edit-form');
const btnAddChild = document.getElementById('btn-add-child');
const btnMoveUp = document.getElementById('btn-move-up');
const btnMoveDown = document.getElementById('btn-move-down');
const btnDelete = document.getElementById('btn-delete');
const btnClearDraft = document.getElementById('btn-clear-draft');
const btnLogout = document.getElementById('btn-logout');
const saveStatus = document.getElementById('save-status');
const tabButtons = Array.from(document.querySelectorAll('.editor-tab'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

const fotoUrlInput = editForm.elements['foto'];
const fotoFileInput = document.getElementById('foto-file');
const btnRemovePhoto = document.getElementById('btn-remove-photo');
const photoPreview = document.getElementById('photo-preview');
const levelRangeHint = document.getElementById('level-range-hint');
const createNomeInput = document.getElementById('create-nome');
const createCargoInput = document.getElementById('create-cargo');
const createNivelInput = document.getElementById('create-nivel');
const createTurnoInput = document.getElementById('create-turno');
const createLevelHint = document.getElementById('create-level-hint');
const btnCreateUser = document.getElementById('btn-create-user');
const createUserStatus = document.getElementById('create-user-status');
const createAuxiliarOption = document.getElementById('create-auxiliar-option');
const createAsAuxiliarInput = document.getElementById('create-as-auxiliar');
const operadoresList = document.getElementById('operadores-list');
const operadoresEmpty = document.getElementById('operadores-empty');
const operadoresEditor = document.getElementById('operadores-editor');
const operadoresEditorPlaceholder = document.getElementById('operadores-editor-placeholder');
const operadoresStatus = document.getElementById('operadores-status');
const btnSaveOperador = document.getElementById('btn-save-operador');
const btnDeleteOperador = document.getElementById('btn-delete-operador');
const opNomeInput = document.getElementById('op-nome');
const opTurnoInput = document.getElementById('op-turno');
const opEmailInput = document.getElementById('op-email');
const opTelefoneInput = document.getElementById('op-telefone');
const opMatriculaInput = document.getElementById('op-matricula');
const opNascimentoInput = document.getElementById('op-nascimento');
const opAdmissaoInput = document.getElementById('op-admissao');
const opFotoInput = document.getElementById('op-foto');
const opDescricaoInput = document.getElementById('op-descricao');
const opDescricaoDetalhadaInput = document.getElementById('op-descricao-detalhada');
const duplasList = document.getElementById('duplas-list');
const duplasEmpty = document.getElementById('duplas-empty');
const duplasEditor = document.getElementById('duplas-editor');
const duplasEditorPlaceholder = document.getElementById('duplas-editor-placeholder');
const duplasStatus = document.getElementById('duplas-status');
const btnSaveDupla = document.getElementById('btn-save-dupla');
const duplaHasAuxiliarInput = document.getElementById('dupla-has-auxiliar');
const duplaAuxFields = document.getElementById('dupla-aux-fields');
const duplaTecNomeInput = document.getElementById('dupla-tec-nome');
const duplaTecEmailInput = document.getElementById('dupla-tec-email');
const duplaTecTelefoneInput = document.getElementById('dupla-tec-telefone');
const duplaTecMatriculaInput = document.getElementById('dupla-tec-matricula');
const duplaTecNascimentoInput = document.getElementById('dupla-tec-nascimento');
const duplaTecAdmissaoInput = document.getElementById('dupla-tec-admissao');
const duplaTecFotoInput = document.getElementById('dupla-tec-foto');
const duplaTecDescricaoInput = document.getElementById('dupla-tec-descricao');
const duplaTecDescricaoDetalhadaInput = document.getElementById('dupla-tec-descricao-detalhada');
const duplaAuxNomeInput = document.getElementById('dupla-aux-nome');
const duplaAuxEmailInput = document.getElementById('dupla-aux-email');
const duplaAuxTelefoneInput = document.getElementById('dupla-aux-telefone');
const duplaAuxMatriculaInput = document.getElementById('dupla-aux-matricula');
const duplaAuxNascimentoInput = document.getElementById('dupla-aux-nascimento');
const duplaAuxAdmissaoInput = document.getElementById('dupla-aux-admissao');
const duplaAuxFotoInput = document.getElementById('dupla-aux-foto');
const duplaAuxDescricaoInput = document.getElementById('dupla-aux-descricao');
const duplaAuxDescricaoDetalhadaInput = document.getElementById('dupla-aux-descricao-detalhada');

init();

async function init() {
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) !== 'ok') {
        window.location.href = 'login.html';
        return;
    }

    activeApiBase = await detectApiBase();
    if (activeApiBase) {
        backendOrigin = new URL(activeApiBase).origin;
        setStatus(`Backend conectado em ${backendOrigin}.`);
    } else {
        setStatus('Backend nao encontrado. Usando rascunho/local.');
    }

    const draft = loadDraft();
    if (draft) {
        globalData = draft;
        const levelsAdjusted = syncTreeLevels();
        if (levelsAdjusted) {
            persistDraft();
            await persistServer(false);
        }
        renderTree();
        setStatus(
            levelsAdjusted
                ? 'Rascunho local carregado. Niveis da hierarquia ajustados automaticamente.'
                : 'Rascunho local carregado.'
        );
        return;
    }

    const sourceData = await loadInitialData();
    if (!sourceData) {
        alert('Erro ao carregar os dados iniciais. Verifique o console (F12).');
        return;
    }

    globalData = normalizeRoot(sourceData);
    const levelsAdjusted = syncTreeLevels();
    if (levelsAdjusted) {
        persistDraft();
        await persistServer(false);
        setStatus('Niveis da hierarquia foram ajustados automaticamente.');
    }
    renderTree();
}

async function detectApiBase() {
    for (const base of API_BASE_CANDIDATES) {
        try {
            const response = await fetchWithTimeout(`${base}/health`, { cache: 'no-store' }, 1200);
            if (!response.ok) continue;
            return base;
        } catch (error) {
            console.debug(`API indisponivel em ${base}:`, error?.message || error);
        }
    }
    return null;
}

async function loadInitialData() {
    if (activeApiBase) {
        try {
            const response = await fetchWithTimeout(`${activeApiBase}/dados`, { cache: 'no-store' }, 2000);
            if (response.ok) return await response.json();
        } catch (error) {
            console.warn('Falha ao carregar dados da API, tentando arquivos locais.', error);
        }
    }

    for (const source of DATA_SOURCES) {
        try {
            const response = await fetchWithTimeout(source, { cache: 'no-store' }, 2000);
            if (!response.ok) continue;
            return await response.json();
        } catch (error) {
            console.debug(`Falha ao carregar ${source}:`, error?.message || error);
        }
    }

    return null;
}

function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

function normalizeRoot(data) {
    const root = data && data.principal
        ? data
        : { principal: data || { cargo: 'Organograma', nomes: [], filhos: [] }, apoio: [] };

    normalizeNode(root.principal);
    (root.apoio || []).forEach(normalizeNode);

    return root;
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function isAuxiliarTecnicoCargo(cargo) {
    return normalizeText(cargo) === 'auxiliar tecnico';
}

function isTecnicoSegCargo(cargo) {
    return /^tecnico de seg\.? eletron(ica|ico)$/.test(normalizeText(cargo));
}

function isMonitoramentoCargo(cargo) {
    const normalized = normalizeText(cargo)
        .replace(/\./g, '')
        .replace(/\s+/g, ' ');
    return normalized === 'op monitoramento'
        || normalized === 'operador monitoramento'
        || normalized === 'operador de monitoramento';
}

function isEquivalentCargo(cargoA, cargoB) {
    if (isMonitoramentoCargo(cargoA) && isMonitoramentoCargo(cargoB)) return true;
    if (isAuxiliarTecnicoCargo(cargoA) && isAuxiliarTecnicoCargo(cargoB)) return true;
    return normalizeText(cargoA) === normalizeText(cargoB);
}

function canBindAuxiliarToSelection(node, index) {
    return Boolean(node && index >= 0 && isTecnicoSegCargo(node.cargo));
}

function getSelectedPerson() {
    if (!selectedNode || selectedIndex < 0 || !Array.isArray(selectedNode.nomes)) return null;
    const pessoa = selectedNode.nomes[selectedIndex];
    return pessoa && typeof pessoa === 'object' ? pessoa : null;
}

function migrateAuxiliarFromChildNode(node) {
    if (!node || !isTecnicoSegCargo(node.cargo) || !Array.isArray(node.filhos)) return;

    const auxiliarIndex = node.filhos.findIndex((child) => isAuxiliarTecnicoCargo(child?.cargo));
    if (auxiliarIndex < 0) return;

    const auxiliarNode = node.filhos[auxiliarIndex];
    const auxiliares = Array.isArray(auxiliarNode?.nomes) ? auxiliarNode.nomes : [];
    if (!Array.isArray(node.nomes)) node.nomes = [];
    if (auxiliares.length === 0 || node.nomes.length === 0) return;

    const limite = Math.min(node.nomes.length, auxiliares.length);
    for (let i = 0; i < limite; i += 1) {
        const tecnico = node.nomes[i];
        if (!tecnico || typeof tecnico !== 'object' || tecnico.auxiliar) continue;

        const auxiliar = auxiliares[i];
        if (!auxiliar || typeof auxiliar !== 'object') continue;
        tecnico.auxiliar = { ...auxiliar };
        if (!tecnico.auxiliar.cargo) tecnico.auxiliar.cargo = auxiliarNode.cargo || 'Auxiliar Tecnico';
    }

    const restantes = auxiliares.slice(limite);
    if (restantes.length > 0) {
        auxiliarNode.nomes = restantes;
        return;
    }

    if (Array.isArray(auxiliarNode.filhos) && auxiliarNode.filhos.length > 0) {
        auxiliarNode.nomes = [];
        return;
    }

    node.filhos.splice(auxiliarIndex, 1);
}

function ensureHierarchyLevels(node, parentLevel = null) {
    if (!node || typeof node !== 'object') return false;

    const parsedLevel = Number.parseInt(node.nivel, 10);
    const minimumLevel = parentLevel === null ? MIN_TREE_LEVEL : parentLevel + 1;
    const normalizedLevel = Number.isNaN(parsedLevel)
        ? minimumLevel
        : Math.max(parsedLevel, minimumLevel);

    let changed = false;
    if (node.nivel !== normalizedLevel) {
        node.nivel = normalizedLevel;
        changed = true;
    }

    if (!Array.isArray(node.filhos)) node.filhos = [];
    node.filhos.forEach((child) => {
        if (ensureHierarchyLevels(child, normalizedLevel)) changed = true;
    });

    return changed;
}

function syncTreeLevels() {
    if (!globalData?.principal) return false;
    let changed = false;
    const root = globalData.principal;

    // Regra fixa do topo: existe apenas um cargo no nivel 1 e um no nivel 2.
    if (root.nivel !== 1) {
        root.nivel = 1;
        changed = true;
    }

    if (!Array.isArray(root.filhos)) root.filhos = [];

    // Se existirem multiplos filhos da raiz, preserva o primeiro no nivel 2
    // e move os demais para baixo dele para manter a estrutura esperada.
    if (root.filhos.length > 1) {
        const primaryLevel2 = root.filhos[0];
        if (!Array.isArray(primaryLevel2.filhos)) primaryLevel2.filhos = [];
        primaryLevel2.filhos.push(...root.filhos.slice(1));
        root.filhos = [primaryLevel2];
        changed = true;
    }

    if (root.filhos.length === 1) {
        if (root.filhos[0].nivel !== 2) {
            root.filhos[0].nivel = 2;
            changed = true;
        }
    }

    if (ensureHierarchyLevels(root, null)) changed = true;
    return changed;
}

function getSubtreeDepth(node) {
    if (!node || typeof node !== 'object') return 1;
    if (!Array.isArray(node.filhos) || node.filhos.length === 0) return 1;

    let maxChildDepth = 0;
    node.filhos.forEach((child) => {
        maxChildDepth = Math.max(maxChildDepth, getSubtreeDepth(child));
    });
    return 1 + maxChildDepth;
}

function getNodeLevelBounds(node, parent) {
    const parentLevel = parent && parent !== 'APOIO_ROOT'
        ? Number.parseInt(parent.nivel, 10)
        : Number.NaN;

    const minLevel = Number.isNaN(parentLevel) ? MIN_TREE_LEVEL : parentLevel + 1;
    const depth = getSubtreeDepth(node);
    const maxLevel = MAX_TREE_LEVEL - (depth - 1);

    return {
        minLevel,
        maxLevel,
        hasValidRange: minLevel <= maxLevel
    };
}

function getCreateLevelBounds(parentNode) {
    if (!parentNode || typeof parentNode !== 'object') {
        return { minLevel: MIN_TREE_LEVEL, maxLevel: MAX_TREE_LEVEL, hasValidRange: true };
    }

    const isRoot = parentNode === globalData?.principal;
    if (isRoot) {
        return { minLevel: 2, maxLevel: 2, hasValidRange: true };
    }

    const parentLevel = Number.parseInt(parentNode.nivel, 10);
    const minLevel = Number.isNaN(parentLevel) ? MIN_TREE_LEVEL : parentLevel + 1;
    return {
        minLevel,
        maxLevel: MAX_TREE_LEVEL,
        hasValidRange: minLevel <= MAX_TREE_LEVEL
    };
}

function normalizeNode(node) {
    if (!node || typeof node !== 'object') return;

    if (!Array.isArray(node.nomes)) node.nomes = [];
    node.nomes = node.nomes.map((pessoa) => {
        if (typeof pessoa === 'string') return { nome: pessoa };
        const dados = pessoa || { nome: '' };
        if (dados.auxiliar && typeof dados.auxiliar === 'object') {
            dados.auxiliar = { ...dados.auxiliar };
            if (!dados.auxiliar.cargo) dados.auxiliar.cargo = 'Auxiliar Tecnico';
        }
        return dados;
    });

    if (!Array.isArray(node.filhos)) node.filhos = [];
    migrateAuxiliarFromChildNode(node);
    node.filhos.forEach(normalizeNode);
}

function loadDraft() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return normalizeRoot(JSON.parse(raw));
    } catch (error) {
        console.warn('Rascunho local invalido. Removendo.', error);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function persistDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalData));
}

function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
}

function moveItemInArray(items, fromIndex, toIndex) {
    if (!Array.isArray(items)) return false;
    if (fromIndex < 0 || toIndex < 0) return false;
    if (fromIndex >= items.length || toIndex >= items.length) return false;
    if (fromIndex === toIndex) return false;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    return true;
}

function moveSelectedCard(direction) {
    if (!selectedNode || selectedIndex < 0) {
        return { ok: false, message: 'Selecione um colaborador para mover.' };
    }

    const step = direction === 'up' ? -1 : 1;
    const nomes = Array.isArray(selectedNode.nomes) ? selectedNode.nomes : [];
    const nextPersonIndex = selectedIndex + step;

    if (nextPersonIndex >= 0 && nextPersonIndex < nomes.length) {
        const moved = moveItemInArray(nomes, selectedIndex, nextPersonIndex);
        if (moved) {
            selectedIndex = nextPersonIndex;
            return { ok: true, scope: 'card' };
        }
    }

    let siblingNodes = null;
    if (selectedParent === 'APOIO_ROOT') {
        siblingNodes = globalData?.apoio;
    } else if (selectedParent && selectedParent !== 'APOIO_ROOT') {
        siblingNodes = selectedParent.filhos;
    }

    if (!Array.isArray(siblingNodes)) {
        return { ok: false, message: 'Nao ha posicao disponivel para mover este card.' };
    }

    const currentNodeIndex = siblingNodes.indexOf(selectedNode);
    if (currentNodeIndex < 0) {
        return { ok: false, message: 'Nao foi possivel localizar o no selecionado.' };
    }

    const nextNodeIndex = currentNodeIndex + step;
    if (nextNodeIndex < 0 || nextNodeIndex >= siblingNodes.length) {
        return { ok: false, message: 'Este card ja esta no limite da posicao.' };
    }

    const moved = moveItemInArray(siblingNodes, currentNodeIndex, nextNodeIndex);
    if (!moved) {
        return { ok: false, message: 'Nao foi possivel mover este card.' };
    }

    return { ok: true, scope: 'node' };
}

async function persistServer(showAlert = false, showStatus = true) {
    if (!activeApiBase) {
        if (showStatus) setStatus('Backend nao conectado. Alteracoes mantidas no rascunho local.', 'warning');
        return false;
    }

    try {
        const response = await fetchWithTimeout(`${activeApiBase}/dados`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(globalData)
        }, 3000);

        if (!response.ok) {
            const details = await response.text();
            logAdminDebug('PersistServerHttpError', {
                status: response.status,
                body: details
            });
            throw new Error(details || `HTTP ${response.status}`);
        }

        if (showStatus) setStatus('Alteracoes salvas com sucesso.', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao salvar no servidor:', error);
        logAdminDebug('PersistServerCatch', { error });
        if (showStatus) setStatus('Falha ao salvar no servidor. Mantido no rascunho local.', 'warning');
        return false;
    }
}

function updateStatusElement(element, message, tone = 'info') {
    if (!element) return;
    element.innerText = message;
    element.classList.remove('hidden', 'status-info', 'status-success', 'status-warning');
    element.classList.add(`status-${tone}`);
}

function setStatus(message, tone = 'info') {
    updateStatusElement(saveStatus, message, tone);
}

function setCreateStatus(message, tone = 'info') {
    updateStatusElement(createUserStatus, message, tone);
}

function setOperadoresStatus(message, tone = 'info') {
    updateStatusElement(operadoresStatus, message, tone);
}

function setDuplasStatus(message, tone = 'info') {
    updateStatusElement(duplasStatus, message, tone);
}

function toObjectPerson(value) {
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string') return { nome: value };
    return null;
}

function listTecnicoSegNodes() {
    const nodes = [];

    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (isTecnicoSegCargo(node.cargo)) nodes.push(node);
        if (Array.isArray(node.filhos)) node.filhos.forEach(walk);
    };

    walk(globalData?.principal);
    if (Array.isArray(globalData?.apoio)) {
        globalData.apoio.forEach((node) => walk(node));
    }
    return nodes;
}

function getAuxiliarFromTecnicoNode(node, tecnico, index) {
    const auxiliarDireto = tecnico && typeof tecnico === 'object' && tecnico.auxiliar && typeof tecnico.auxiliar === 'object'
        ? tecnico.auxiliar
        : null;
    if (auxiliarDireto) return auxiliarDireto;

    const auxiliarNode = Array.isArray(node?.filhos)
        ? node.filhos.find((child) => isAuxiliarTecnicoCargo(child?.cargo))
        : null;
    const auxiliarFallback = Array.isArray(auxiliarNode?.nomes) ? auxiliarNode.nomes[index] : null;
    return toObjectPerson(auxiliarFallback);
}

function listDuplasTecnicas() {
    const entries = [];
    const tecnicoNodes = listTecnicoSegNodes();

    tecnicoNodes.forEach((node) => {
        const nomes = Array.isArray(node.nomes) ? node.nomes : [];
        nomes.forEach((tecnicoRaw, index) => {
            const tecnico = toObjectPerson(tecnicoRaw);
            if (!tecnico) return;

            const auxiliar = getAuxiliarFromTecnicoNode(node, tecnico, index);
            entries.push({
                node,
                index,
                tecnicoNome: tecnico.nome || '[Sem nome]',
                auxiliarNome: auxiliar?.nome || '[Sem auxiliar]'
            });
        });
    });

    return entries;
}

function getSelectedDuplaData() {
    if (!selectedDuplaRef?.node || selectedDuplaRef.index < 0) return null;
    if (!Array.isArray(selectedDuplaRef.node.nomes)) return null;

    let tecnico = selectedDuplaRef.node.nomes[selectedDuplaRef.index];
    if (typeof tecnico === 'string') {
        tecnico = { nome: tecnico };
        selectedDuplaRef.node.nomes[selectedDuplaRef.index] = tecnico;
    }
    if (!tecnico || typeof tecnico !== 'object') return null;

    return {
        tecnico,
        auxiliar: getAuxiliarFromTecnicoNode(selectedDuplaRef.node, tecnico, selectedDuplaRef.index)
    };
}

function clearDuplasEditor() {
    selectedDuplaRef = null;
    if (duplasEditor) duplasEditor.classList.add('hidden');
    if (duplasEditorPlaceholder) duplasEditorPlaceholder.classList.remove('hidden');
}

function setFieldValue(input, value) {
    if (!input) return;
    input.value = value || '';
}

function applyFieldValue(target, key, input) {
    if (!target || typeof target !== 'object' || !input) return;
    const value = String(input.value || '').trim();
    if (value) target[key] = value;
    else delete target[key];
}

function toggleDuplaAuxiliarFields(enabled) {
    const fields = [
        duplaAuxNomeInput,
        duplaAuxEmailInput,
        duplaAuxTelefoneInput,
        duplaAuxMatriculaInput,
        duplaAuxNascimentoInput,
        duplaAuxAdmissaoInput,
        duplaAuxFotoInput,
        duplaAuxDescricaoInput,
        duplaAuxDescricaoDetalhadaInput
    ];

    fields.forEach((field) => {
        if (field) field.disabled = !enabled;
    });

    if (duplaAuxFields) {
        duplaAuxFields.classList.toggle('disabled', !enabled);
    }
}

function populateDuplasEditor(entry) {
    const tecnico = toObjectPerson(entry?.node?.nomes?.[entry.index]);
    if (!tecnico || typeof tecnico !== 'object') return;

    selectedDuplaRef = { node: entry.node, index: entry.index };
    if (duplasEditorPlaceholder) duplasEditorPlaceholder.classList.add('hidden');
    if (duplasEditor) duplasEditor.classList.remove('hidden');

    const auxiliar = getAuxiliarFromTecnicoNode(entry.node, tecnico, entry.index);
    const hasAuxiliar = Boolean(auxiliar && typeof auxiliar === 'object');

    setFieldValue(duplaTecNomeInput, tecnico.nome);
    setFieldValue(duplaTecEmailInput, tecnico.email);
    setFieldValue(duplaTecTelefoneInput, tecnico.telefone);
    setFieldValue(duplaTecMatriculaInput, tecnico.matricula);
    setFieldValue(duplaTecNascimentoInput, tecnico.nascimento);
    setFieldValue(duplaTecAdmissaoInput, tecnico.admissao);
    setFieldValue(duplaTecFotoInput, tecnico.foto);
    setFieldValue(duplaTecDescricaoInput, tecnico.descricao);
    setFieldValue(duplaTecDescricaoDetalhadaInput, tecnico.descricaoDetalhada);

    if (duplaHasAuxiliarInput) duplaHasAuxiliarInput.checked = hasAuxiliar;

    setFieldValue(duplaAuxNomeInput, auxiliar?.nome);
    setFieldValue(duplaAuxEmailInput, auxiliar?.email);
    setFieldValue(duplaAuxTelefoneInput, auxiliar?.telefone);
    setFieldValue(duplaAuxMatriculaInput, auxiliar?.matricula);
    setFieldValue(duplaAuxNascimentoInput, auxiliar?.nascimento);
    setFieldValue(duplaAuxAdmissaoInput, auxiliar?.admissao);
    setFieldValue(duplaAuxFotoInput, auxiliar?.foto);
    setFieldValue(duplaAuxDescricaoInput, auxiliar?.descricao);
    setFieldValue(duplaAuxDescricaoDetalhadaInput, auxiliar?.descricaoDetalhada);

    toggleDuplaAuxiliarFields(hasAuxiliar);
}

function renderDuplasTab() {
    if (!duplasList) return;
    const entries = listDuplasTecnicas();

    duplasList.innerHTML = '';
    if (duplasStatus) duplasStatus.classList.add('hidden');
    if (duplasEmpty) duplasEmpty.classList.toggle('hidden', entries.length > 0);

    let hasSelection = false;

    entries.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'duplas-item';
        const isActive = selectedDuplaRef
            && selectedDuplaRef.node === entry.node
            && selectedDuplaRef.index === entry.index;

        if (isActive) {
            item.classList.add('active');
            hasSelection = true;
        }

        item.innerHTML = `<strong>${entry.tecnicoNome}</strong><small>Auxiliar: ${entry.auxiliarNome}</small>`;
        item.addEventListener('click', () => {
            selectedDuplaRef = { node: entry.node, index: entry.index };
            renderDuplasTab();
            populateDuplasEditor(entry);
        });
        duplasList.appendChild(item);
    });

    if (!hasSelection) clearDuplasEditor();
}

function logAdminDebug(scope, details, level = 'error') {
    if (!DEBUG_ADMIN_ERRORS) return;
    const payload = details && typeof details === 'object' ? details : { details };
    const fn = (console[level] && typeof console[level] === 'function') ? console[level] : console.error;
    fn(`[Admin][${scope}]`, payload);
}

function getCreateDebugContext() {
    return {
        selectedNode: selectedNode
            ? {
                cargo: selectedNode.cargo || '',
                nivel: selectedNode.nivel ?? null,
                nomes: Array.isArray(selectedNode.nomes) ? selectedNode.nomes.length : 0,
                filhos: Array.isArray(selectedNode.filhos) ? selectedNode.filhos.length : 0
            }
            : null,
        selectedParent: selectedParent === 'APOIO_ROOT'
            ? 'APOIO_ROOT'
            : (selectedParent
                ? {
                    cargo: selectedParent.cargo || '',
                    nivel: selectedParent.nivel ?? null
                }
                : null),
        selectedIndex,
        form: {
            nome: (createNomeInput?.value || '').trim(),
            cargo: (createCargoInput?.value || '').trim(),
            nivel: String(createNivelInput?.value || '').trim(),
            turno: (createTurnoInput?.value || '').trim(),
            criarComoAuxiliar: Boolean(createAsAuxiliarInput?.checked)
        }
    };
}

window.addEventListener('error', (event) => {
    logAdminDebug('WindowError', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logAdminDebug('UnhandledRejection', { reason: event.reason });
});

function listMonitoramentoNodes() {
    const nodes = [];

    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (isMonitoramentoCargo(node.cargo)) nodes.push(node);
        if (Array.isArray(node.filhos)) node.filhos.forEach(walk);
    };

    walk(globalData?.principal);
    return nodes;
}

function listMonitoramentoNodesWithParent() {
    const entries = [];

    const walk = (node, parent = null) => {
        if (!node || typeof node !== 'object') return;
        if (isMonitoramentoCargo(node.cargo)) {
            entries.push({ node, parent });
            return;
        }
        if (Array.isArray(node.filhos)) {
            node.filhos.forEach((child) => walk(child, node));
        }
    };

    walk(globalData?.principal, null);
    return entries;
}

function listOperators() {
    const entries = [];
    const monitoramentoNodes = listMonitoramentoNodes();

    monitoramentoNodes.forEach((node) => {
        const nomes = Array.isArray(node.nomes) ? node.nomes : [];
        nomes.forEach((pessoa, index) => {
            const dados = (pessoa && typeof pessoa === 'object') ? pessoa : { nome: String(pessoa || '') };
            entries.push({
                node,
                index,
                nome: dados.nome || '[Sem nome]',
                turno: dados.turno || 'Nao informado'
            });
        });
    });

    return entries;
}

function getSelectedOperatorData() {
    if (!selectedOperatorRef?.node || selectedOperatorRef.index < 0) return null;
    const pessoa = selectedOperatorRef.node.nomes?.[selectedOperatorRef.index];
    if (!pessoa || typeof pessoa !== 'object') return null;
    return pessoa;
}

function clearOperatorEditor() {
    selectedOperatorRef = null;
    if (operadoresEditor) operadoresEditor.classList.add('hidden');
    if (operadoresEditorPlaceholder) operadoresEditorPlaceholder.classList.remove('hidden');
}

function populateOperatorEditor(entry) {
    const pessoa = entry?.node?.nomes?.[entry.index];
    if (!pessoa || typeof pessoa !== 'object') return;

    selectedOperatorRef = { node: entry.node, index: entry.index };
    if (operadoresEditorPlaceholder) operadoresEditorPlaceholder.classList.add('hidden');
    if (operadoresEditor) operadoresEditor.classList.remove('hidden');

    if (opNomeInput) opNomeInput.value = pessoa.nome || '';
    if (opTurnoInput) opTurnoInput.value = pessoa.turno || '';
    if (opEmailInput) opEmailInput.value = pessoa.email || '';
    if (opTelefoneInput) opTelefoneInput.value = pessoa.telefone || '';
    if (opMatriculaInput) opMatriculaInput.value = pessoa.matricula || '';
    if (opNascimentoInput) opNascimentoInput.value = pessoa.nascimento || '';
    if (opAdmissaoInput) opAdmissaoInput.value = pessoa.admissao || '';
    if (opFotoInput) opFotoInput.value = pessoa.foto || '';
    if (opDescricaoInput) opDescricaoInput.value = pessoa.descricao || '';
    if (opDescricaoDetalhadaInput) opDescricaoDetalhadaInput.value = pessoa.descricaoDetalhada || '';
}

function renderOperadoresTab() {
    if (!operadoresList) return;
    const entries = listOperators();

    operadoresList.innerHTML = '';
    if (operadoresStatus) operadoresStatus.classList.add('hidden');

    if (operadoresEmpty) operadoresEmpty.classList.toggle('hidden', entries.length > 0);

    let hasSelection = false;

    entries.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'operadores-item';
        const isActive = selectedOperatorRef
            && selectedOperatorRef.node === entry.node
            && selectedOperatorRef.index === entry.index;
        if (isActive) {
            item.classList.add('active');
            hasSelection = true;
        }

        item.innerHTML = `<strong>${entry.nome}</strong><small>Turno: ${entry.turno}</small>`;
        item.addEventListener('click', () => {
            selectedOperatorRef = { node: entry.node, index: entry.index };
            renderOperadoresTab();
            populateOperatorEditor(entry);
        });
        operadoresList.appendChild(item);
    });

    if (!hasSelection) clearOperatorEditor();
}

function switchTab(targetId) {
    tabButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.tabTarget === targetId);
    });
    tabPanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.id !== targetId);
        panel.classList.toggle('active', panel.id === targetId);
    });
}

async function handleMoveCard(direction) {
    const result = moveSelectedCard(direction);
    if (!result.ok) {
        setStatus(result.message, 'warning');
        return;
    }

    syncTreeLevels();
    persistDraft();
    const savedOnServer = await persistServer(false, false);
    renderTree();

    const directionLabel = direction === 'up' ? 'cima' : 'baixo';
    const movedLabel = result.scope === 'card'
        ? `Card movido para ${directionLabel}.`
        : `Card movido na estrutura para ${directionLabel}.`;

    if (savedOnServer) {
        setStatus(`${movedLabel} Alteracoes salvas.`, 'success');
    } else {
        setStatus(`${movedLabel} Backend indisponivel, salvo no rascunho local.`, 'warning');
    }
}

function renderTree() {
    treeView.innerHTML = '';

    const labelMain = document.createElement('h4');
    labelMain.innerText = 'ORGANOGRAMA PRINCIPAL';
    labelMain.style.cssText = 'padding: 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px;';
    treeView.appendChild(labelMain);

    const mainUl = document.createElement('ul');
    if (globalData.principal) buildTreeItem(globalData.principal, mainUl, null, { skipMonitoramento: true });
    treeView.appendChild(mainUl);

    const monitoramentoEntries = listMonitoramentoNodesWithParent();
    if (monitoramentoEntries.length > 0) {
        const labelMonitoramento = document.createElement('h4');
        labelMonitoramento.innerText = 'EQUIPE MONITORAMENTO';
        labelMonitoramento.style.cssText = 'padding: 20px 10px 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-top: 1px solid #e2e8f0; margin-top: 10px;';
        treeView.appendChild(labelMonitoramento);

        const monitoramentoUl = document.createElement('ul');
        monitoramentoEntries.forEach((entry) => {
            buildTreeItem(entry.node, monitoramentoUl, entry.parent, { skipMonitoramento: false });
        });
        treeView.appendChild(monitoramentoUl);
    }

    if (Array.isArray(globalData.apoio) && globalData.apoio.length > 0) {
        const labelSupport = document.createElement('h4');
        labelSupport.innerText = 'APOIO & APRENDIZADO';
        labelSupport.style.cssText = 'padding: 20px 10px 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-top: 1px solid #e2e8f0; margin-top: 10px;';
        treeView.appendChild(labelSupport);

        const supportUl = document.createElement('ul');
        globalData.apoio.forEach((grupo) => buildTreeItem(grupo, supportUl, 'APOIO_ROOT', { skipMonitoramento: false }));
        treeView.appendChild(supportUl);
    }

    applyTreeFilter(treeSearch?.value || '');
    renderOperadoresTab();
    renderDuplasTab();
}

function buildTreeItem(node, container, parent, options = {}) {
    const skipMonitoramento = options.skipMonitoramento === true;
    const filhosVisiveis = Array.isArray(node.filhos)
        ? (skipMonitoramento ? node.filhos.filter((filho) => !isMonitoramentoCargo(filho?.cargo)) : node.filhos)
        : [];

    if (node.nomes && node.nomes.length > 0) {
        node.nomes.forEach((pessoa, index) => {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'tree-item';

            const pessoaDados = toObjectPerson(pessoa) || { nome: '' };
            const nomeTexto = pessoaDados.nome || '[Sem nome]';
            const auxiliarDados = isTecnicoSegCargo(node.cargo)
                ? getAuxiliarFromTecnicoNode(node, pessoaDados, index)
                : null;
            const auxiliarLinha = auxiliarDados?.nome
                ? `<small class="tree-item-sub">Auxiliar: ${auxiliarDados.nome}</small>`
                : '';
            div.innerHTML = `
                <div class="tree-item-main">
                    <span class="material-icons-round">person</span>
                    <span class="tree-item-name">${nomeTexto}</span>
                </div>
                <small class="tree-item-role">${node.cargo || 'Sem cargo'} - Nivel ${node.nivel ?? '-'}</small>
                ${auxiliarLinha}
            `;

            div.onclick = () => selectItem(node, index, parent, div);
            li.appendChild(div);

            if (index === 0 && filhosVisiveis.length > 0) {
                const ulChildren = document.createElement('ul');
                filhosVisiveis.forEach((filho) => buildTreeItem(filho, ulChildren, node, options));
                li.appendChild(ulChildren);
            }

            container.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.className = 'tree-item empty';
        div.innerHTML = `<span style="color:red">[Vazio]</span> ${node.cargo || ''}`;
        div.onclick = () => selectItem(node, -1, parent, div);
        li.appendChild(div);

        if (filhosVisiveis.length > 0) {
            const ulChildren = document.createElement('ul');
            filhosVisiveis.forEach((filho) => buildTreeItem(filho, ulChildren, node, options));
            li.appendChild(ulChildren);
        }

        container.appendChild(li);
    }
}

function applyTreeFilter(rawTerm) {
    const term = String(rawTerm || '').trim().toLowerCase();
    const allTopItems = Array.from(treeView.querySelectorAll(':scope > ul > li'));

    if (!term) {
        allTopItems.forEach((li) => {
            li.style.display = '';
            li.querySelectorAll('li').forEach((nested) => {
                nested.style.display = '';
            });
        });
        return;
    }

    const evaluateNode = (li) => {
        const item = li.querySelector(':scope > .tree-item');
        const selfMatch = item ? item.textContent.toLowerCase().includes(term) : false;
        const children = Array.from(li.querySelectorAll(':scope > ul > li'));
        let childMatch = false;

        children.forEach((child) => {
            const matched = evaluateNode(child);
            if (matched) childMatch = true;
        });

        const visible = selfMatch || childMatch;
        li.style.display = visible ? '' : 'none';
        return visible;
    };

    allTopItems.forEach((li) => evaluateNode(li));
}

function selectItem(node, index, parent, element) {
    document.querySelectorAll('.tree-item').forEach((el) => el.classList.remove('selected'));
    element.classList.add('selected');

    selectedNode = node;
    selectedIndex = index;
    selectedParent = parent;

    if (index >= 0) {
        const pessoa = node.nomes[index] || {};
        populateForm(pessoa);
        document.getElementById('form-title').innerText = `Editando: ${pessoa.nome || 'Colaborador'}`;
    } else {
        populateForm({});
        document.getElementById('form-title').innerText = `Novo Colaborador em ${node.cargo || ''}`;
    }

    editorPlaceholder.classList.add('hidden');
    editForm.classList.remove('hidden');
    refreshCreateUserForm();
}

function populateForm(dados) {
    const f = editForm;

    EDITABLE_FIELDS.forEach((field) => {
        f[field].value = dados[field] || '';
    });

    f['cargo_display'].value = selectedNode?.cargo || '';
    const levelField = f['nivel_display'];
    if (levelField) {
        const bounds = getNodeLevelBounds(selectedNode, selectedParent);
        levelField.value = selectedNode?.nivel ?? '';
        levelField.min = String(bounds.minLevel);
        levelField.max = String(bounds.maxLevel);
        levelField.disabled = !bounds.hasValidRange;

        if (levelRangeHint) {
            if (!bounds.hasValidRange) {
                levelRangeHint.textContent = 'Sem faixa valida de nivel para este no. Ajuste os niveis acima.';
            } else if (bounds.minLevel === bounds.maxLevel) {
                levelRangeHint.textContent = `Nivel fixo para este no: ${bounds.minLevel}.`;
            } else {
                levelRangeHint.textContent = `Permitido: ${bounds.minLevel} a ${bounds.maxLevel}.`;
            }
        }
    }
    if (fotoFileInput) fotoFileInput.value = '';
    updatePhotoPreview(f['foto'].value);
}

function refreshCreateUserForm() {
    if (!createNivelInput) return;
    const bounds = getCreateLevelBounds(selectedNode);
    const canBindAuxiliar = canBindAuxiliarToSelection(selectedNode, selectedIndex);
    const isMonitoramentoSelecionado = isMonitoramentoCargo(selectedNode?.cargo);

    createNivelInput.min = String(bounds.minLevel);
    createNivelInput.max = String(bounds.maxLevel);
    createNivelInput.value = String(bounds.minLevel);
    createNivelInput.disabled = !bounds.hasValidRange;

    if (createLevelHint) {
        if (!selectedNode) {
            createLevelHint.textContent = 'Selecione um no na arvore para criar o subordinado.';
        } else if (!bounds.hasValidRange && isMonitoramentoSelecionado) {
            createLevelHint.textContent = 'Para operador, mantenha o mesmo cargo para adicionar no bloco atual.';
        } else if (!bounds.hasValidRange) {
            createLevelHint.textContent = 'Nao ha faixa valida para criar subordinado neste no.';
        } else if (bounds.minLevel === bounds.maxLevel) {
            createLevelHint.textContent = `Nivel fixo para novo subordinado: ${bounds.minLevel}.`;
        } else {
            createLevelHint.textContent = `Permitido: ${bounds.minLevel} a ${bounds.maxLevel}.`;
        }
    }

    if (createAuxiliarOption) {
        createAuxiliarOption.classList.toggle('hidden', !canBindAuxiliar);
    }

    if (createAsAuxiliarInput) {
        if (!canBindAuxiliar) createAsAuxiliarInput.checked = false;

        const shouldUseAuxiliarCargo = canBindAuxiliar && createAsAuxiliarInput.checked;
        if (createCargoInput) {
            if (shouldUseAuxiliarCargo) {
                createCargoInput.value = 'Auxiliar Tecnico';
            } else if (!canBindAuxiliar) {
                createCargoInput.value = selectedNode?.cargo || '';
            } else if (!createCargoInput.value.trim()) {
                createCargoInput.value = selectedNode?.cargo || '';
            }
            createCargoInput.disabled = shouldUseAuxiliarCargo;
        }
    }

    if (createUserStatus) createUserStatus.classList.add('hidden');
}

function resolvePhotoForPreview(value) {
    const src = (value || '').trim();
    if (!src) return '';

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return src;
    }

    if (src.startsWith('/')) {
        return `${backendOrigin}${src}`;
    }

    return src;
}

function updatePhotoPreview(value) {
    const src = resolvePhotoForPreview(value);

    if (!src) {
        photoPreview.src = '';
        photoPreview.classList.add('hidden');
        return;
    }

    photoPreview.onerror = () => photoPreview.classList.add('hidden');
    photoPreview.onload = () => photoPreview.classList.remove('hidden');
    photoPreview.src = src;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getCurrentPersonBase() {
    if (selectedIndex < 0) return {};

    const current = selectedNode?.nomes?.[selectedIndex];
    if (current && typeof current === 'object') return { ...current };

    return {};
}

function applyFormToSelectedNode() {
    if (!selectedNode) return;

    const f = editForm;
    const novosDados = getCurrentPersonBase();

    EDITABLE_FIELDS.forEach((field) => {
        const value = (f[field].value || '').trim();
        if (value) novosDados[field] = value;
        else delete novosDados[field];
    });

    if (!novosDados.nome) return false;

    if (selectedIndex >= 0) {
        selectedNode.nomes[selectedIndex] = novosDados;
    } else {
        if (!Array.isArray(selectedNode.nomes)) selectedNode.nomes = [];
        selectedNode.nomes.push(novosDados);
        selectedIndex = selectedNode.nomes.length - 1;
    }

    const cargo = (f['cargo_display'].value || '').trim();
    if (cargo) selectedNode.cargo = cargo;

    const nivelRaw = String(f['nivel_display']?.value || '').trim();
    const nivelNovo = Number.parseInt(nivelRaw, 10);
    const bounds = getNodeLevelBounds(selectedNode, selectedParent);

    if (!bounds.hasValidRange) {
        alert('Nao existe faixa valida de nivel para este no. Ajuste os niveis superiores primeiro.');
        return false;
    }

    if (
        Number.isNaN(nivelNovo) ||
        nivelNovo < bounds.minLevel ||
        nivelNovo > bounds.maxLevel
    ) {
        alert(`Nivel invalido. Informe um numero entre ${bounds.minLevel} e ${bounds.maxLevel}.`);
        return false;
    }

    selectedNode.nivel = nivelNovo;
    return true;
}

async function saveCurrentFormChanges({ renderTreeView = false, showFeedback = false } = {}) {
    if (!applyFormToSelectedNode()) return;
    syncTreeLevels();
    persistDraft();
    await persistServer(false, showFeedback);

    if (renderTreeView) renderTree();
}

function scheduleAutoSave() {
    if (!selectedNode) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveCurrentFormChanges({ renderTreeView: false, showFeedback: false });
    }, 700);
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCurrentFormChanges({ renderTreeView: true, showFeedback: true });
});

btnAddChild.addEventListener('click', async () => {
    if (!selectedNode) return;
    const canBindAuxiliar = canBindAuxiliarToSelection(selectedNode, selectedIndex);
    createNomeInput.value = '';
    if (createAsAuxiliarInput) createAsAuxiliarInput.checked = canBindAuxiliar;
    createCargoInput.value = canBindAuxiliar ? 'Auxiliar Tecnico' : (selectedNode?.cargo || '');
    createTurnoInput.value = '';
    refreshCreateUserForm();
    switchTab('tab-create');
});

btnMoveUp?.addEventListener('click', async () => {
    await handleMoveCard('up');
});

btnMoveDown?.addEventListener('click', async () => {
    await handleMoveCard('down');
});

btnDelete.addEventListener('click', async () => {
    if (!selectedNode || selectedIndex === -1) return;

    const pessoaSelecionada = selectedNode.nomes[selectedIndex] || {};
    const nome = pessoaSelecionada.nome || 'este item';

    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    selectedNode.nomes.splice(selectedIndex, 1);

    if (selectedNode.nomes.length === 0) {
        if (selectedNode.filhos && selectedNode.filhos.length > 0) {
            alert('Colaborador removido. O cargo foi mantido porque possui subordinados.');
        } else if (selectedParent && selectedParent !== 'APOIO_ROOT') {
            const indexNoPai = selectedParent.filhos.indexOf(selectedNode);
            if (indexNoPai > -1) selectedParent.filhos.splice(indexNoPai, 1);
        } else if (selectedParent === 'APOIO_ROOT') {
            const indexApoio = globalData.apoio.indexOf(selectedNode);
            if (indexApoio > -1) globalData.apoio.splice(indexApoio, 1);
        }
    }

    selectedNode = null;
    selectedParent = null;
    selectedIndex = -1;

    editForm.classList.add('hidden');
    editorPlaceholder.classList.remove('hidden');

    syncTreeLevels();
    persistDraft();
    await persistServer(false);
    renderTree();
});

btnClearDraft?.addEventListener('click', async () => {
    if (!confirm('Remover o rascunho local e recarregar dados?')) return;

    clearDraft();

    const sourceData = await loadInitialData();
    if (!sourceData) {
        alert('Nao foi possivel recarregar os dados.');
        return;
    }

    globalData = normalizeRoot(sourceData);
    const levelsAdjusted = syncTreeLevels();
    if (levelsAdjusted) {
        persistDraft();
        await persistServer(false);
    }
    selectedNode = null;
    selectedParent = null;
    selectedIndex = -1;

    editForm.classList.add('hidden');
    editorPlaceholder.classList.remove('hidden');

    renderTree();
    setStatus('Rascunho limpo e dados recarregados.');
});

btnCreateUser?.addEventListener('click', async () => {
    try {
        if (!selectedNode) {
            setCreateStatus('Selecione um no na arvore antes de criar usuario.');
            logAdminDebug('CreateUserBlocked.NoSelectedNode', getCreateDebugContext());
            return;
        }

        if (selectedNode === globalData?.principal && (selectedNode.filhos?.length || 0) >= 1) {
            setCreateStatus('A Gerencia deve ter apenas um cargo direto no nivel 2.');
            logAdminDebug('CreateUserBlocked.RootLimit', getCreateDebugContext());
            return;
        }

        const nomeNovo = (createNomeInput?.value || '').trim();
        const turnoNovo = (createTurnoInput?.value || '').trim();
        const vincularAuxiliar = canBindAuxiliarToSelection(selectedNode, selectedIndex) && Boolean(createAsAuxiliarInput?.checked);
        const cargoNovo = vincularAuxiliar
            ? 'Auxiliar Tecnico'
            : (createCargoInput?.value || '').trim();

        if (!nomeNovo || !cargoNovo) {
            setCreateStatus('Preencha nome e cargo para criar o usuario.');
            logAdminDebug('CreateUserBlocked.RequiredFields', {
                ...getCreateDebugContext(),
                nomeNovo,
                cargoNovo
            });
            return;
        }

        const novaPessoa = { nome: nomeNovo };
        if (turnoNovo) novaPessoa.turno = turnoNovo;
        const criarNoMesmoCargo = !vincularAuxiliar && isEquivalentCargo(selectedNode.cargo, cargoNovo);
        const nivelNovo = Number.parseInt(String(createNivelInput?.value || '').trim(), 10);
        const bounds = getCreateLevelBounds(selectedNode);
        const filhosSelecionados = Array.isArray(selectedNode.filhos) ? selectedNode.filhos : [];
        const monitoramentoFilhoExistente = !vincularAuxiliar && !criarNoMesmoCargo && isMonitoramentoCargo(cargoNovo)
            ? filhosSelecionados.find((child) => isMonitoramentoCargo(child?.cargo))
            : null;
        const monitoramentoNoGlobalExistente = !vincularAuxiliar && !criarNoMesmoCargo && isMonitoramentoCargo(cargoNovo)
            ? listMonitoramentoNodes().find((node) => node && typeof node === 'object') || null
            : null;
        const monitoramentoNoDestino = monitoramentoFilhoExistente || monitoramentoNoGlobalExistente;

        if (
            !vincularAuxiliar &&
            !criarNoMesmoCargo &&
            !monitoramentoNoDestino &&
            (
                Number.isNaN(nivelNovo) ||
                nivelNovo < bounds.minLevel ||
                nivelNovo > bounds.maxLevel
            )
        ) {
            setCreateStatus(`Nivel invalido. Informe um numero entre ${bounds.minLevel} e ${bounds.maxLevel}.`);
            logAdminDebug('CreateUserBlocked.InvalidLevel', {
                ...getCreateDebugContext(),
                nivelNovo,
                bounds,
                vincularAuxiliar,
                criarNoMesmoCargo,
                monitoramentoNoDestino: Boolean(monitoramentoNoDestino)
            });
            return;
        }

        if (vincularAuxiliar) {
            const tecnicoSelecionado = getSelectedPerson();
            if (!tecnicoSelecionado) {
                setCreateStatus('Selecione um tecnico valido para vincular o auxiliar.');
                logAdminDebug('CreateUserBlocked.InvalidTecnicoSelection', getCreateDebugContext());
                return;
            }

            tecnicoSelecionado.auxiliar = {
                ...novaPessoa,
                cargo: cargoNovo
            };
        } else {
            // 1) Se estiver criando no mesmo cargo selecionado, adiciona pessoa no mesmo bloco.
            if (criarNoMesmoCargo) {
                if (!Array.isArray(selectedNode.nomes)) selectedNode.nomes = [];
                selectedNode.nomes.push(novaPessoa);
                if (isAuxiliarTecnicoCargo(cargoNovo)) {
                    selectedNode.layout = 'vertical';
                }
            } else {
                // 2) Se ja existir um filho com mesmo cargo e nivel, adiciona no bloco existente.
                if (!Array.isArray(selectedNode.filhos)) selectedNode.filhos = [];
                const existente = monitoramentoNoDestino || selectedNode.filhos.find((child) =>
                    isEquivalentCargo(child?.cargo, cargoNovo) &&
                    Number.parseInt(child?.nivel, 10) === nivelNovo
                );

                if (existente) {
                    if (!Array.isArray(existente.nomes)) existente.nomes = [];
                    existente.nomes.push(novaPessoa);
                    if (isAuxiliarTecnicoCargo(cargoNovo)) {
                        existente.layout = 'vertical';
                    }
                } else {
                    const novoNo = {
                        cargo: cargoNovo,
                        nomes: [novaPessoa],
                        nivel: nivelNovo,
                        filhos: []
                    };

                    if (isAuxiliarTecnicoCargo(cargoNovo)) {
                        novoNo.layout = 'vertical';
                    }

                    selectedNode.filhos.push(novoNo);
                }
            }
        }

        syncTreeLevels();
        persistDraft();
        const savedOnServer = await persistServer(false, true);
        renderTree();

        if (savedOnServer) {
            setCreateStatus(
                vincularAuxiliar
                    ? 'Auxiliar vinculado ao tecnico e salvo com sucesso.'
                    : 'Usuario criado e salvo com sucesso.',
                'success'
            );
        } else {
            setCreateStatus(
                vincularAuxiliar
                    ? 'Auxiliar vinculado no rascunho local (backend indisponivel).'
                    : 'Usuario criado no rascunho local (backend indisponivel).',
                'warning'
            );
        }

        createNomeInput.value = '';
        createTurnoInput.value = '';
        refreshCreateUserForm();
    } catch (error) {
        logAdminDebug('CreateUserUnexpectedError', {
            error,
            context: getCreateDebugContext()
        });
        setCreateStatus('Erro inesperado ao criar usuario. Veja o console (F12).', 'warning');
    }
});

btnSaveOperador?.addEventListener('click', async () => {
    const pessoa = getSelectedOperatorData();
    if (!pessoa) {
        setOperadoresStatus('Selecione um operador para editar.', 'warning');
        return;
    }

    const nome = String(opNomeInput?.value || '').trim();
    if (!nome) {
        setOperadoresStatus('Nome do operador e obrigatorio.', 'warning');
        return;
    }

    pessoa.nome = nome;

    const turno = String(opTurnoInput?.value || '').trim();
    if (turno) pessoa.turno = turno;
    else delete pessoa.turno;

    const fields = [
        ['email', opEmailInput],
        ['telefone', opTelefoneInput],
        ['matricula', opMatriculaInput],
        ['nascimento', opNascimentoInput],
        ['admissao', opAdmissaoInput],
        ['foto', opFotoInput],
        ['descricao', opDescricaoInput],
        ['descricaoDetalhada', opDescricaoDetalhadaInput]
    ];

    fields.forEach(([key, input]) => {
        const value = String(input?.value || '').trim();
        if (value) pessoa[key] = value;
        else delete pessoa[key];
    });

    syncTreeLevels();
    persistDraft();
    const savedOnServer = await persistServer(false, false);
    renderTree();

    setOperadoresStatus(
        savedOnServer
            ? 'Operador atualizado e salvo com sucesso.'
            : 'Operador atualizado no rascunho local (backend indisponivel).',
        savedOnServer ? 'success' : 'warning'
    );
});

btnDeleteOperador?.addEventListener('click', async () => {
    if (!selectedOperatorRef?.node || selectedOperatorRef.index < 0) {
        setOperadoresStatus('Selecione um operador para excluir.', 'warning');
        return;
    }

    const pessoa = getSelectedOperatorData();
    const nome = pessoa?.nome || 'este operador';

    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    const nomes = Array.isArray(selectedOperatorRef.node.nomes) ? selectedOperatorRef.node.nomes : [];
    nomes.splice(selectedOperatorRef.index, 1);
    selectedOperatorRef = null;

    syncTreeLevels();
    persistDraft();
    const savedOnServer = await persistServer(false, false);
    renderTree();

    setOperadoresStatus(
        savedOnServer
            ? 'Operador excluido com sucesso.'
            : 'Operador excluido no rascunho local (backend indisponivel).',
        savedOnServer ? 'success' : 'warning'
    );
});

duplaHasAuxiliarInput?.addEventListener('change', () => {
    toggleDuplaAuxiliarFields(Boolean(duplaHasAuxiliarInput.checked));
});

btnSaveDupla?.addEventListener('click', async () => {
    const dados = getSelectedDuplaData();
    if (!dados?.tecnico) {
        setDuplasStatus('Selecione uma dupla para editar.', 'warning');
        return;
    }

    const tecnico = dados.tecnico;
    const nomeTecnico = String(duplaTecNomeInput?.value || '').trim();
    if (!nomeTecnico) {
        setDuplasStatus('Nome do tecnico e obrigatorio.', 'warning');
        return;
    }

    tecnico.nome = nomeTecnico;
    applyFieldValue(tecnico, 'email', duplaTecEmailInput);
    applyFieldValue(tecnico, 'telefone', duplaTecTelefoneInput);
    applyFieldValue(tecnico, 'matricula', duplaTecMatriculaInput);
    applyFieldValue(tecnico, 'nascimento', duplaTecNascimentoInput);
    applyFieldValue(tecnico, 'admissao', duplaTecAdmissaoInput);
    applyFieldValue(tecnico, 'foto', duplaTecFotoInput);
    applyFieldValue(tecnico, 'descricao', duplaTecDescricaoInput);
    applyFieldValue(tecnico, 'descricaoDetalhada', duplaTecDescricaoDetalhadaInput);

    const hasAuxiliar = Boolean(duplaHasAuxiliarInput?.checked);
    if (hasAuxiliar) {
        const nomeAuxiliar = String(duplaAuxNomeInput?.value || '').trim();
        if (!nomeAuxiliar) {
            setDuplasStatus('Informe o nome do auxiliar ou desmarque a vinculacao.', 'warning');
            return;
        }

        if (!tecnico.auxiliar || typeof tecnico.auxiliar !== 'object') {
            tecnico.auxiliar = {};
        }

        tecnico.auxiliar.nome = nomeAuxiliar;
        tecnico.auxiliar.cargo = 'Auxiliar Tecnico';
        applyFieldValue(tecnico.auxiliar, 'email', duplaAuxEmailInput);
        applyFieldValue(tecnico.auxiliar, 'telefone', duplaAuxTelefoneInput);
        applyFieldValue(tecnico.auxiliar, 'matricula', duplaAuxMatriculaInput);
        applyFieldValue(tecnico.auxiliar, 'nascimento', duplaAuxNascimentoInput);
        applyFieldValue(tecnico.auxiliar, 'admissao', duplaAuxAdmissaoInput);
        applyFieldValue(tecnico.auxiliar, 'foto', duplaAuxFotoInput);
        applyFieldValue(tecnico.auxiliar, 'descricao', duplaAuxDescricaoInput);
        applyFieldValue(tecnico.auxiliar, 'descricaoDetalhada', duplaAuxDescricaoDetalhadaInput);
    } else {
        delete tecnico.auxiliar;
    }

    syncTreeLevels();
    persistDraft();
    const savedOnServer = await persistServer(false, false);
    renderTree();

    setDuplasStatus(
        savedOnServer
            ? 'Dupla tecnica atualizada e salva com sucesso.'
            : 'Dupla tecnica atualizada no rascunho local (backend indisponivel).',
        savedOnServer ? 'success' : 'warning'
    );
});

fotoUrlInput.addEventListener('input', () => {
    updatePhotoPreview(fotoUrlInput.value);
    scheduleAutoSave();
});

async function uploadPhotoToServer(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithTimeout(`${activeApiBase}/upload-photo`, {
        method: 'POST',
        body: formData
    }, 8000);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload.url) throw new Error('Resposta de upload sem URL.');

    return resolvePhotoForPreview(payload.url);
}

async function removePhotoFromServer(url) {
    if (!activeApiBase) return false;

    const response = await fetchWithTimeout(`${activeApiBase}/photo`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    }, 4000);

    return response.ok;
}

fotoFileInput?.addEventListener('change', async () => {
    const file = fotoFileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Selecione um arquivo de imagem valido.');
        fotoFileInput.value = '';
        return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        alert('Imagem muito grande. Limite de 5 MB.');
        fotoFileInput.value = '';
        return;
    }

    try {
        if (activeApiBase) {
            const uploadedUrl = await uploadPhotoToServer(file);
            fotoUrlInput.value = uploadedUrl;
            setStatus('Foto enviada para o servidor.');
        } else {
            const dataUrl = await fileToDataUrl(file);
            fotoUrlInput.value = dataUrl;
            setStatus('Backend inativo: foto convertida para base64 no rascunho.');
        }

        updatePhotoPreview(fotoUrlInput.value);
        scheduleAutoSave();
    } catch (error) {
        console.error(error);
        alert('Falha ao processar a imagem.');
    }
});

btnRemovePhoto?.addEventListener('click', async () => {
    const current = (fotoUrlInput.value || '').trim();

    if (current && activeApiBase && !current.startsWith('data:')) {
        try {
            await removePhotoFromServer(current);
        } catch (error) {
            console.warn('Nao foi possivel remover foto no servidor.', error);
        }
    }

    fotoUrlInput.value = '';
    if (fotoFileInput) fotoFileInput.value = '';
    updatePhotoPreview('');
    scheduleAutoSave();
});

editForm.querySelectorAll('#tab-edit input:not([type=\"file\"]), #tab-edit textarea, #tab-edit select').forEach((field) => {
    field.addEventListener('input', scheduleAutoSave);
    field.addEventListener('change', scheduleAutoSave);
});

createAsAuxiliarInput?.addEventListener('change', () => {
    if (createAsAuxiliarInput.checked) {
        createCargoInput.value = 'Auxiliar Tecnico';
    }
    refreshCreateUserForm();
});

treeSearch?.addEventListener('input', (event) => {
    applyTreeFilter(event.target.value);
});

btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = 'login.html';
});

tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const target = button.dataset.tabTarget;
        if (target) switchTab(target);
    });
});

switchTab('tab-edit');
refreshCreateUserForm();
