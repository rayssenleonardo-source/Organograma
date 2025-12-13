// admin.js - Lógica do Painel Administrativo

let globalData = null; // Armazena o JSON completo
let selectedNode = null; // Armazena a pessoa sendo editada (referência)
let selectedParent = null; // Armazena o pai da pessoa selecionada (para exclusão)
let selectedIndex = -1; // Índice no array de nomes (se houver múltiplos nomes no mesmo cargo)

// Elementos do DOM
const treeView = document.getElementById('tree-view');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editForm = document.getElementById('edit-form');
const btnSaveJson = document.getElementById('btn-save-json');
const btnAddChild = document.getElementById('btn-add-child');
const btnDelete = document.getElementById('btn-delete');

// --- 1. CARREGAR DADOS ---
fetch('dados.json')
    .then(r => r.json())
    .then(data => {
        globalData = data;
        renderTree();
    })
    .catch(err => alert("Erro ao carregar dados.json. Certifique-se de estar rodando em um servidor local (Live Server)."));

// --- 2. RENDERIZAR ÁRVORE ---
function renderTree() {
    treeView.innerHTML = '';
    const rootUl = document.createElement('ul');
    
    // Inicia a recursão a partir da raiz
    buildTreeItem(globalData, rootUl, null);
    
    treeView.appendChild(rootUl);
}

function buildTreeItem(node, container, parent) {
    // Verifica se há nomes neste nível
    if (node.nomes && node.nomes.length > 0) {
        node.nomes.forEach((pessoa, index) => {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'tree-item';
            
            // Ícone e Nome
            let nomeTexto = typeof pessoa === 'object' ? pessoa.nome : pessoa;
            div.innerHTML = `<span class="material-icons-round">person</span> ${nomeTexto} <small style="color:#999; margin-left:5px">(${node.cargo})</small>`;
            
            // Evento de Clique (Selecionar)
            div.onclick = () => selectItem(node, index, parent, div);
            
            li.appendChild(div);

            // Se for o último nome da lista deste cargo, renderizamos os filhos DESTE cargo abaixo
            // Nota: No seu modelo, todos os nomes compartilham os mesmos filhos do cargo.
            if (index === 0 && node.filhos && node.filhos.length > 0) {
                const ulChildren = document.createElement('ul');
                node.filhos.forEach(filho => buildTreeItem(filho, ulChildren, node));
                li.appendChild(ulChildren);
            }

            container.appendChild(li);
        });
    }
}

// --- 3. SELECIONAR ITEM ---
function selectItem(node, index, parent, element) {
    // Atualiza visual
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Atualiza estado global
    selectedNode = node; // O objeto do Cargo/Nível
    selectedIndex = index; // Qual pessoa dentro da lista 'nomes'
    selectedParent = parent; // O objeto pai (cargo acima)

    // Preenche formulário
    const pessoa = node.nomes[index];
    populateForm(typeof pessoa === 'object' ? pessoa : { nome: pessoa });

    // Mostra form
    editorPlaceholder.classList.add('hidden');
    editForm.classList.remove('hidden');
}

// --- 4. PREENCHER FORMULÁRIO ---
function populateForm(dados) {
    const f = document.forms['edit-form'];
    f['nome'].value = dados.nome || '';
    f['cargo_display'].value = selectedNode.cargo || ''; // Cargo é propriedade do nó, não da pessoa geralmente
    f['foto'].value = dados.foto || '';
    f['email'].value = dados.email || '';
    f['matricula'].value = dados.matricula || '';
    f['telefone'].value = dados.telefone || '';
    f['nascimento'].value = dados.nascimento || '';
    f['admissao'].value = dados.admissao || '';
    f['descricao'].value = dados.descricao || '';
    f['descricaoDetalhada'].value = dados.descricaoDetalhada || '';
}

// --- 5. SALVAR ALTERAÇÕES (MEMÓRIA) ---
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedNode) return;

    const f = document.forms['edit-form'];
    
    // Cria/Atualiza o objeto da pessoa
    const novosDados = {
        nome: f['nome'].value,
        foto: f['foto'].value,
        email: f['email'].value,
        matricula: f['matricula'].value,
        telefone: f['telefone'].value,
        nascimento: f['nascimento'].value,
        admissao: f['admissao'].value,
        descricao: f['descricao'].value,
        descricaoDetalhada: f['descricaoDetalhada'].value
    };

    // Remove campos vazios para limpar o JSON
    Object.keys(novosDados).forEach(key => {
        if (!novosDados[key]) delete novosDados[key];
    });

    // Atualiza o array original
    selectedNode.nomes[selectedIndex] = novosDados;
    
    // Atualiza o nome do cargo (cuidado, isso muda para todos nesse nó)
    if(f['cargo_display'].value) {
        selectedNode.cargo = f['cargo_display'].value;
    }

    alert('Dados atualizados na memória! Lembre-se de clicar em "Baixar JSON" para salvar o arquivo.');
    renderTree(); // Atualiza a árvore lateral
});

// --- 6. ADICIONAR SUBORDINADO ---
btnAddChild.addEventListener('click', () => {
    if (!selectedNode) return;

    const nomeNovo = prompt("Nome do novo colaborador:");
    if (!nomeNovo) return;
    
    const cargoNovo = prompt("Cargo do novo setor:");
    if (!cargoNovo) return;

    // Cria estrutura do novo nó
    const novoNo = {
        cargo: cargoNovo,
        nomes: [{ nome: nomeNovo }], // Cria já como objeto
        nivel: selectedNode.nivel + 1,
        filhos: []
    };

    if (!selectedNode.filhos) selectedNode.filhos = [];
    selectedNode.filhos.push(novoNo);
    
    renderTree();
    alert("Subordinado adicionado! Selecione-o na árvore para editar detalhes.");
});

// --- 7. EXCLUIR COLABORADOR ---
btnDelete.addEventListener('click', () => {
    if (!selectedNode) return;
    if (confirm(`Tem certeza que deseja excluir ${selectedNode.nomes[selectedIndex].nome || 'este item'}?`)) {
        
        // Remove a pessoa da lista de nomes
        selectedNode.nomes.splice(selectedIndex, 1);

        // Se não sobrou ninguém nesse cargo e ele não tem filhos, talvez devêssemos remover o nó inteiro?
        // Lógica simplificada: Se a lista de nomes ficar vazia, removemos o nó do pai
        if (selectedNode.nomes.length === 0) {
            if (selectedParent) {
                const indexNoFilhos = selectedParent.filhos.indexOf(selectedNode);
                if (indexNoFilhos > -1) {
                    selectedParent.filhos.splice(indexNoFilhos, 1);
                }
            } else {
                alert("Não é possível remover a raiz (Gerência) totalmente.");
                return;
            }
        }

        renderTree();
        editForm.classList.add('hidden');
        editorPlaceholder.classList.remove('hidden');
    }
});

// --- 8. BAIXAR JSON (EXPORTAR) ---
btnSaveJson.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(globalData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dados.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});