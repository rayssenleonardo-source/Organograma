// admin.js - Painel Administrativo com backend opcional

let globalData = null;
let selectedNode = null;
let selectedParent = null;
let selectedIndex = -1;

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

const treeView = document.getElementById('tree-view');
const treeSearch = document.getElementById('tree-search');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editForm = document.getElementById('edit-form');
const btnAddChild = document.getElementById('btn-add-child');
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
        return pessoa || { nome: '' };
    });

    if (!Array.isArray(node.filhos)) node.filhos = [];
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
            throw new Error(details || `HTTP ${response.status}`);
        }

        if (showStatus) setStatus('Alteracoes salvas com sucesso.', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao salvar no servidor:', error);
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

function switchTab(targetId) {
    tabButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.tabTarget === targetId);
    });
    tabPanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.id !== targetId);
        panel.classList.toggle('active', panel.id === targetId);
    });
}

function renderTree() {
    treeView.innerHTML = '';

    const labelMain = document.createElement('h4');
    labelMain.innerText = 'ORGANOGRAMA PRINCIPAL';
    labelMain.style.cssText = 'padding: 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px;';
    treeView.appendChild(labelMain);

    const mainUl = document.createElement('ul');
    if (globalData.principal) buildTreeItem(globalData.principal, mainUl, null);
    treeView.appendChild(mainUl);

    if (Array.isArray(globalData.apoio) && globalData.apoio.length > 0) {
        const labelSupport = document.createElement('h4');
        labelSupport.innerText = 'APOIO & APRENDIZADO';
        labelSupport.style.cssText = 'padding: 20px 10px 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-top: 1px solid #e2e8f0; margin-top: 10px;';
        treeView.appendChild(labelSupport);

        const supportUl = document.createElement('ul');
        globalData.apoio.forEach((grupo) => buildTreeItem(grupo, supportUl, 'APOIO_ROOT'));
        treeView.appendChild(supportUl);
    }

    applyTreeFilter(treeSearch?.value || '');
}

function buildTreeItem(node, container, parent) {
    if (node.nomes && node.nomes.length > 0) {
        node.nomes.forEach((pessoa, index) => {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'tree-item';

            const nomeTexto = pessoa?.nome || '[Sem nome]';
            div.innerHTML = `
                <div class="tree-item-main">
                    <span class="material-icons-round">person</span>
                    <span class="tree-item-name">${nomeTexto}</span>
                </div>
                <small class="tree-item-role">${node.cargo || 'Sem cargo'} • Nivel ${node.nivel ?? '-'}</small>
            `;

            div.onclick = () => selectItem(node, index, parent, div);
            li.appendChild(div);

            if (index === 0 && node.filhos && node.filhos.length > 0) {
                const ulChildren = document.createElement('ul');
                node.filhos.forEach((filho) => buildTreeItem(filho, ulChildren, node));
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

        if (node.filhos && node.filhos.length > 0) {
            const ulChildren = document.createElement('ul');
            node.filhos.forEach((filho) => buildTreeItem(filho, ulChildren, node));
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

    createNivelInput.min = String(bounds.minLevel);
    createNivelInput.max = String(bounds.maxLevel);
    createNivelInput.value = String(bounds.minLevel);
    createNivelInput.disabled = !bounds.hasValidRange;

    if (createLevelHint) {
        if (!selectedNode) {
            createLevelHint.textContent = 'Selecione um no na arvore para criar o subordinado.';
        } else if (!bounds.hasValidRange) {
            createLevelHint.textContent = 'Nao ha faixa valida para criar subordinado neste no.';
        } else if (bounds.minLevel === bounds.maxLevel) {
            createLevelHint.textContent = `Nivel fixo para novo subordinado: ${bounds.minLevel}.`;
        } else {
            createLevelHint.textContent = `Permitido: ${bounds.minLevel} a ${bounds.maxLevel}.`;
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
    createNomeInput.value = '';
    createCargoInput.value = selectedNode?.cargo || '';
    createTurnoInput.value = '';
    refreshCreateUserForm();
    switchTab('tab-create');
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
    if (!selectedNode) {
        setCreateStatus('Selecione um no na arvore antes de criar usuario.');
        return;
    }

    if (selectedNode === globalData?.principal && (selectedNode.filhos?.length || 0) >= 1) {
        setCreateStatus('A Gerencia deve ter apenas um cargo direto no nivel 2.');
        return;
    }

    const nomeNovo = (createNomeInput?.value || '').trim();
    const cargoNovo = (createCargoInput?.value || '').trim();
    const turnoNovo = (createTurnoInput?.value || '').trim();
    const nivelNovo = Number.parseInt(String(createNivelInput?.value || '').trim(), 10);
    const bounds = getCreateLevelBounds(selectedNode);

    if (!nomeNovo || !cargoNovo) {
        setCreateStatus('Preencha nome e cargo para criar o usuario.');
        return;
    }

    if (
        Number.isNaN(nivelNovo) ||
        nivelNovo < bounds.minLevel ||
        nivelNovo > bounds.maxLevel
    ) {
        setCreateStatus(`Nivel invalido. Informe um numero entre ${bounds.minLevel} e ${bounds.maxLevel}.`);
        return;
    }

    const novaPessoa = { nome: nomeNovo };
    if (turnoNovo) novaPessoa.turno = turnoNovo;
    const cargoNormalizado = cargoNovo.toLowerCase();

    // 1) Se estiver criando no mesmo cargo selecionado, adiciona pessoa no mesmo bloco.
    if ((selectedNode.cargo || '').trim().toLowerCase() === cargoNormalizado) {
        if (!Array.isArray(selectedNode.nomes)) selectedNode.nomes = [];
        selectedNode.nomes.push(novaPessoa);
        if (cargoNormalizado === 'auxiliar técnico' || cargoNormalizado === 'auxiliar tecnico') {
            selectedNode.layout = 'vertical';
        }
    } else {
        // 2) Se ja existir um filho com mesmo cargo e nivel, adiciona no bloco existente.
        if (!Array.isArray(selectedNode.filhos)) selectedNode.filhos = [];
        const existente = selectedNode.filhos.find((child) =>
            (child?.cargo || '').trim().toLowerCase() === cargoNormalizado &&
            Number.parseInt(child?.nivel, 10) === nivelNovo
        );

        if (existente) {
            if (!Array.isArray(existente.nomes)) existente.nomes = [];
            existente.nomes.push(novaPessoa);
            if (cargoNormalizado === 'auxiliar técnico' || cargoNormalizado === 'auxiliar tecnico') {
                existente.layout = 'vertical';
            }
        } else {
            const novoNo = {
                cargo: cargoNovo,
                nomes: [novaPessoa],
                nivel: nivelNovo,
                filhos: []
            };

            if (cargoNormalizado === 'auxiliar técnico' || cargoNormalizado === 'auxiliar tecnico') {
                novoNo.layout = 'vertical';
            }

            selectedNode.filhos.push(novoNo);
        }
    }

    syncTreeLevels();
    persistDraft();
    const savedOnServer = await persistServer(false, true);
    renderTree();
    if (savedOnServer) {
        setCreateStatus('Usuario criado e salvo com sucesso.', 'success');
    } else {
        setCreateStatus('Usuario criado no rascunho local (backend indisponivel).', 'warning');
    }
    createNomeInput.value = '';
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
