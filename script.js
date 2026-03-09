// ============================================================================
// 1. FUNÇÕES UTILITÁRIAS
// ============================================================================
function getInitials(name) {
    if (typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
}

function createCardImage(src, onError) {
    const img = document.createElement('img');
    img.decoding = 'async';
    img.loading = 'eager';
    if (typeof onError === 'function') img.onerror = onError;
    img.src = src;
    return img;
}

// ============================================================================
// 2. LÓGICA DO MODAL
// ============================================================================
const modalOverlay = document.getElementById('profile-modal');
const closeModalBtn = document.querySelector('.close-btn');
const modalAvatar = document.getElementById('modal-avatar');
const modalName = document.getElementById('modal-name');
const modalRole = document.getElementById('modal-role');
const modalBody = document.getElementById('modal-body');

function openModal(pessoaDados, cargoTitulo) {
    modalBody.innerHTML = '';
    modalAvatar.innerHTML = '';
    modalName.innerText = pessoaDados.nome || '';
    const cargoFinal = pessoaDados.cargo || cargoTitulo || '';
    modalRole.innerText = cargoFinal;

    if (pessoaDados.foto) {
        const img = document.createElement('img');
        img.src = pessoaDados.foto;
        img.onerror = () => { modalAvatar.innerText = getInitials(pessoaDados.nome); };
        modalAvatar.appendChild(img);
    } else {
        modalAvatar.innerText = getInitials(pessoaDados.nome);
    }

    const campos = [
        { key: 'matricula', label: 'Matrícula' },
        { key: 'email', label: 'E-mail' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'nascimento', label: 'Data de Nascimento' },
        { key: 'admissao', label: 'Data de Admissão' },
        { key: 'descricao', label: 'Descrição' }
    ];

    let hasInfo = false;
    campos.forEach(campo => {
        const valor = pessoaDados[campo.key];
        if (!valor) return;
        hasInfo = true;
        const row = document.createElement('div');
        row.className = 'info-row';
        
        if (campo.key === 'descricao') {
            row.classList.add('info-row-descricao');
            const textoDescricao = String(valor).replace(/^<br\s*\/?>/i, '');
            row.innerHTML = `<span class="info-label">${campo.label}</span><p class="info-value descricao-text">${textoDescricao}</p>`;
        } else {
            row.innerHTML = `<span class="info-label">${campo.label}</span><span class="info-value">${valor}</span>`;
        }
        modalBody.appendChild(row);
    });

    if (pessoaDados.descricaoDetalhada) {
        hasInfo = true;
        const wrapper = document.createElement('div');
        wrapper.className = 'descricao-detalhada-wrapper';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-detalhes-descricao';
        btn.textContent = 'Ver descrição detalhada';
        
        const detailCard = document.createElement('div');
        detailCard.className = 'descricao-detalhada-card hidden';
        const textoLongo = String(pessoaDados.descricaoDetalhada).replace(/^<br\s*\/?>/i, '');
        detailCard.innerHTML = `<p>${textoLongo}</p>`;

        btn.addEventListener('click', () => {
            const isHidden = detailCard.classList.contains('hidden');
            detailCard.classList.toggle('hidden', !isHidden);
            btn.textContent = isHidden ? 'Ocultar descrição detalhada' : 'Ver descrição detalhada';
        });
        wrapper.appendChild(btn);
        wrapper.appendChild(detailCard);
        modalBody.appendChild(wrapper);
    }

    if (!hasInfo) modalBody.innerHTML = '<p style="color:#999; font-style:italic;">Nenhuma informação adicional cadastrada.</p>';
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

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

function isTecnicoSuporteCargo(cargo) {
    return normalizeText(cargo) === 'tecnico de suporte';
}

function isMonitoramentoCargo(cargo) {
    const cargoNormalizado = normalizeText(cargo);
    return cargoNormalizado === 'op. monitoramento' || cargoNormalizado === 'op monitoramento';
}

// ============================================================================
// 3. RENDERIZAÇÃO DA ÁRVORE PRINCIPAL (COM LINHAS)
// ============================================================================
function createNodeElement(data) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `node level-${data.nivel}`;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-container';
    const cargoNormalizado = normalizeText(data.cargo);
    const isAuxiliarTecnico = isAuxiliarTecnicoCargo(data.cargo);
    const isTecnicoSeg = isTecnicoSegCargo(data.cargo);
    const isMonitoramento = isMonitoramentoCargo(data.cargo);
    const isTecnicoSuporte = isTecnicoSuporteCargo(data.cargo);
    const hasSuporteSplit = isTecnicoSuporte && Array.isArray(data.nomes) && data.nomes.length > 1;
    const hasNoTopLinePerson = Array.isArray(data.nomes) && data.nomes.some((pessoa) => (
        pessoa && typeof pessoa === 'object' && (
            pessoa.semLinhaSuperior === true || pessoa.noTopLine === true
        )
    ));

    if (hasSuporteSplit) {
        nodeDiv.classList.add('support-node');
    }
    if (hasNoTopLinePerson) {
        nodeDiv.classList.add('node-has-no-top-line-person');
    }

    if (data.layout === "vertical" || isAuxiliarTecnico) {
        groupDiv.classList.add("vertical-layout");
    }

    const getPersonData = (pessoa) => {
        if (typeof pessoa === 'object' && pessoa !== null) return pessoa;
        return { nome: pessoa };
    };

    const buildPersonCard = (pessoa, cargoTitulo = data.cargo) => {
        const dados = getPersonData(pessoa);
        const card = document.createElement('div');
        card.className = 'card';
        if (dados.semLinhaSuperior === true || dados.noTopLine === true) {
            card.classList.add('no-top-line');
        }

        const avatarMini = document.createElement('div');
        avatarMini.className = 'avatar';
        if (dados.foto) {
            const img = document.createElement('img');
            img.src = dados.foto;
            avatarMini.appendChild(img);
        } else {
            avatarMini.innerText = getInitials(dados.nome);
        }

        const nameEl = document.createElement('h3');
        nameEl.innerText = dados.nome;
        const roleEl = document.createElement('div');
        roleEl.className = 'role-tag';
        roleEl.innerText = cargoTitulo;

        card.appendChild(avatarMini);
        card.appendChild(nameEl);
        card.appendChild(roleEl);
        card.addEventListener('click', () => openModal(dados, cargoTitulo));
        return card;
    };

    const appendPersonCard = (pessoa, target, cargoTitulo = data.cargo) => {
        target.appendChild(buildPersonCard(pessoa, cargoTitulo));
    };

    const tecnicoAuxiliarNode = isTecnicoSeg && Array.isArray(data.filhos)
        ? data.filhos.find((filho) => isAuxiliarTecnicoCargo(filho?.cargo))
        : null;
    const tecnicoAuxiliarNames = Array.isArray(tecnicoAuxiliarNode?.nomes) ? tecnicoAuxiliarNode.nomes : [];

    const appendTecnicoCardWithAuxiliar = (pessoa, index, target) => {
        const tecnicoDados = getPersonData(pessoa);
        const pairWrapper = document.createElement('div');
        pairWrapper.className = 'tecnico-aux-pair';
        pairWrapper.appendChild(buildPersonCard(tecnicoDados, data.cargo));

        const auxiliarDireto = (tecnicoDados.auxiliar && typeof tecnicoDados.auxiliar === 'object')
            ? tecnicoDados.auxiliar
            : null;
        const auxiliarFallback = auxiliarDireto ? null : tecnicoAuxiliarNames[index];
        const auxiliarDados = auxiliarDireto || (auxiliarFallback ? getPersonData(auxiliarFallback) : null);

        if (auxiliarDados) {
            const auxiliarSlot = document.createElement('div');
            auxiliarSlot.className = 'auxiliar-slot';
            const auxiliarCargo = auxiliarDados.cargo || 'Auxiliar Técnico';
            auxiliarSlot.appendChild(buildPersonCard(auxiliarDados, auxiliarCargo));
            pairWrapper.appendChild(auxiliarSlot);
        }

        target.appendChild(pairWrapper);
    };

    if (isMonitoramento && Array.isArray(data.nomes) && data.nomes.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitoramento-columns monitoramento-turnos';

        const operadoresDia = [];
        const operadoresNoite = [];
        let semTurnoIndex = 0;

        data.nomes.forEach((pessoa) => {
            const dados = getPersonData(pessoa);
            const turno = String(dados.turno || '').trim().toLowerCase();
            const isNoite = turno.includes('noite');

            if (!turno) {
                const destino = semTurnoIndex % 2 === 0 ? operadoresDia : operadoresNoite;
                destino.push(dados);
                semTurnoIndex += 1;
                return;
            }

            (isNoite ? operadoresNoite : operadoresDia).push(dados);
        });

        const colManha = document.createElement('div');
        colManha.className = 'monitoramento-col';
        colManha.innerHTML = `<h4>Operadores - Dia <span class="turno-count">${operadoresDia.length}</span></h4>`;

        const colNoite = document.createElement('div');
        colNoite.className = 'monitoramento-col';
        colNoite.innerHTML = `<h4>Operadores - Noite <span class="turno-count">${operadoresNoite.length}</span></h4>`;

        operadoresDia.forEach((pessoa) => appendPersonCard(pessoa, colManha));
        operadoresNoite.forEach((pessoa) => appendPersonCard(pessoa, colNoite));

        wrapper.appendChild(colManha);
        wrapper.appendChild(colNoite);
        groupDiv.appendChild(wrapper);
    } else if (isTecnicoSuporte && Array.isArray(data.nomes) && data.nomes.length > 1) {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitoramento-columns suporte-columns';

        const colEsquerda = document.createElement('div');
        colEsquerda.className = 'monitoramento-col';

        const colDireita = document.createElement('div');
        colDireita.className = 'monitoramento-col';

        data.nomes.forEach((pessoa, index) => {
            appendPersonCard(pessoa, index % 2 === 0 ? colEsquerda : colDireita);
        });

        wrapper.appendChild(colEsquerda);
        wrapper.appendChild(colDireita);
        groupDiv.appendChild(wrapper);
    } else if (data.nomes && data.nomes.length > 0) {
        data.nomes.forEach((pessoa, index) => {
            if (isTecnicoSeg) {
                appendTecnicoCardWithAuxiliar(pessoa, index, groupDiv);
                return;
            }
            appendPersonCard(pessoa, groupDiv);
        });
    }
    nodeDiv.appendChild(groupDiv);

    const filhosOriginais = Array.isArray(data.filhos) ? data.filhos : [];
    const filhosParaRenderizar = [];

    if (isTecnicoSeg && filhosOriginais.length > 0) {
        const idxAuxiliar = filhosOriginais.findIndex((filho) => isAuxiliarTecnicoCargo(filho?.cargo));

        if (idxAuxiliar >= 0) {
            const auxiliarNode = filhosOriginais[idxAuxiliar];
            const nomesAuxiliar = Array.isArray(auxiliarNode?.nomes) ? auxiliarNode.nomes : [];
            const limiteConsumido = Array.isArray(data.nomes)
                ? Math.min(data.nomes.length, nomesAuxiliar.length)
                : 0;
            const nomesRestantes = nomesAuxiliar.slice(limiteConsumido);

            filhosOriginais.forEach((filho, idx) => {
                if (idx !== idxAuxiliar) filhosParaRenderizar.push(filho);
            });

            if (
                nomesRestantes.length > 0 ||
                (Array.isArray(auxiliarNode?.filhos) && auxiliarNode.filhos.length > 0)
            ) {
                filhosParaRenderizar.unshift({
                    ...auxiliarNode,
                    nomes: nomesRestantes,
                    filhos: Array.isArray(auxiliarNode.filhos) ? auxiliarNode.filhos : []
                });
            }
        } else {
            filhosParaRenderizar.push(...filhosOriginais);
        }
    } else {
        filhosParaRenderizar.push(...filhosOriginais);
    }

    if (filhosParaRenderizar.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        if (filhosParaRenderizar.length === 1) {
            childrenContainer.classList.add('single-child');
            if (isTecnicoSuporteCargo(filhosParaRenderizar[0]?.cargo)) {
                childrenContainer.classList.add('single-child-no-connector');
                nodeDiv.classList.add('single-child-parent-no-connector');
            }
        }

        filhosParaRenderizar.forEach((filho) => {
            if (!filho || typeof filho !== "object") return;
            const childEl = createNodeElement(filho);
            if (childEl instanceof Node) childrenContainer.appendChild(childEl);
        });
        nodeDiv.appendChild(childrenContainer);
    }
    return nodeDiv;
}

function detachMonitoramentoNodes(node, collector = []) {
    if (!node || typeof node !== 'object') return null;

    if (isMonitoramentoCargo(node.cargo)) {
        collector.push(node);
        return null;
    }

    const clone = { ...node };
    const filhos = Array.isArray(node.filhos) ? node.filhos : [];
    const filhosFiltrados = [];

    filhos.forEach((filho) => {
        const filhoProcessado = detachMonitoramentoNodes(filho, collector);
        if (filhoProcessado) filhosFiltrados.push(filhoProcessado);
    });

    clone.filhos = filhosFiltrados;
    return clone;
}

function renderMonitoramentoGroups(grupos) {
    const section = document.getElementById('monitoramento-section');
    const container = document.getElementById('monitoramento-container');
    if (!section || !container) return;

    container.innerHTML = '';

    if (!Array.isArray(grupos) || grupos.length === 0) {
        section.classList.remove('active');
        return;
    }

    let hasCards = false;

    grupos.forEach((grupo) => {
        if (!grupo || typeof grupo !== 'object') return;
        const nomes = Array.isArray(grupo.nomes) ? grupo.nomes : [];
        if (nomes.length === 0) return;
        hasCards = true;

        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'monitoramento-group';
        const colDia = document.createElement('div');
        colDia.className = 'monitoramento-turno';
        colDia.innerHTML = '<h4>Plantao Dia</h4>';
        const colNoite = document.createElement('div');
        colNoite.className = 'monitoramento-turno';
        colNoite.innerHTML = '<h4>Plantao Noite</h4>';
        const diaCards = document.createElement('div');
        diaCards.className = 'monitoramento-turno-cards';
        const noiteCards = document.createElement('div');
        noiteCards.className = 'monitoramento-turno-cards';

        let semTurnoIndex = 0;
        nomes.forEach((pessoa) => {
            const dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderTop = "3px solid #4683c4";

            const avatarMini = document.createElement('div');
            avatarMini.className = 'avatar';
            if (dados.foto) {
                const img = createCardImage(dados.foto, () => {
                    avatarMini.innerHTML = '';
                    avatarMini.innerText = getInitials(dados.nome);
                });
                avatarMini.appendChild(img);
            } else {
                avatarMini.innerText = getInitials(dados.nome);
            }

            const nameEl = document.createElement('h3');
            nameEl.innerText = dados.nome;
            const roleEl = document.createElement('div');
            roleEl.className = 'role-tag';
            roleEl.innerText = grupo.cargo || 'Op. Monitoramento';

            card.appendChild(avatarMini);
            card.appendChild(nameEl);
            card.appendChild(roleEl);
            card.addEventListener('click', () => openModal(dados, grupo.cargo || 'Op. Monitoramento'));

            const turno = String(dados.turno || '').trim().toLowerCase();
            if (!turno) {
                (semTurnoIndex % 2 === 0 ? diaCards : noiteCards).appendChild(card);
                semTurnoIndex += 1;
            } else if (turno.includes('noite')) {
                noiteCards.appendChild(card);
            } else {
                diaCards.appendChild(card);
            }
        });

        colDia.appendChild(diaCards);
        colNoite.appendChild(noiteCards);
        groupWrapper.appendChild(colDia);
        groupWrapper.appendChild(colNoite);
        container.appendChild(groupWrapper);
    });

    section.classList.toggle('active', hasCards);
}

// ============================================================================
// 4. NOVA FUNÇÃO: RENDERIZAR GRUPOS DE APOIO (SEM LINHAS)
// ============================================================================
function renderSupportGroups(grupos) {
    const container = document.getElementById('support-container');
    if (!container || !grupos) return;
    container.innerHTML = ''; 

    grupos.forEach(grupo => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'support-group';

        if (grupo.nomes && grupo.nomes.length > 0) {
            grupo.nomes.forEach(pessoa => {
                let dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };
                const card = document.createElement('div');
                card.className = 'card';
                card.style.borderTop = "3px solid #94a3b8"; 

                const avatarMini = document.createElement('div');
                avatarMini.className = 'avatar';
                if (dados.foto) {
                    const img = document.createElement('img');
                    img.src = dados.foto;
                    avatarMini.appendChild(img);
                } else {
                    avatarMini.innerText = getInitials(dados.nome);
                }

                const nameEl = document.createElement('h3');
                nameEl.innerText = dados.nome;
                const roleEl = document.createElement('div');
                roleEl.className = 'role-tag';
                roleEl.innerText = grupo.cargo;

                card.appendChild(avatarMini);
                card.appendChild(nameEl);
                card.appendChild(roleEl);
                card.addEventListener('click', () => openModal(dados, grupo.cargo));
                groupWrapper.appendChild(card);
            });
        }
        container.appendChild(groupWrapper);
    });
}

// ============================================================================
// 5. CARREGAMENTO DOS DADOS (JSON)
// ============================================================================
const mainContainer = document.getElementById('org-container');
const DATA_SOURCES = [
    '/api/dados',
    'http://127.0.0.1:5000/api/dados',
    'http://localhost:5000/api/dados',
    'dados.json'
];

function fetchWithTimeout(url, timeoutMs = 2000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { cache: 'no-store', signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

async function loadData() {
    for (const source of DATA_SOURCES) {
        try {
            const response = await fetchWithTimeout(source);
            if (!response.ok) continue;
            return await response.json();
        } catch (error) {
            console.debug(`Falha ao carregar ${source}:`, error?.message || error);
        }
    }

    throw new Error('Nenhuma fonte de dados disponivel.');
}

loadData()
    .then(data => {
        const arvorePrincipal = data.principal ? data.principal : data;
        const monitoramentoNodes = [];
        const arvoreSemMonitoramento = detachMonitoramentoNodes(arvorePrincipal, monitoramentoNodes);

        if (mainContainer) {
            mainContainer.innerHTML = '';
            if (arvoreSemMonitoramento) {
                mainContainer.appendChild(createNodeElement(arvoreSemMonitoramento));
            }
        }

        renderMonitoramentoGroups(monitoramentoNodes);

        if (data.apoio) {
            renderSupportGroups(data.apoio);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar o JSON:', error);
        if (mainContainer) mainContainer.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar dados.</p>';
    });

// ============================================================================
// 6. SPLASH SCREEN & ADMIN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.remove(), 1000);
        }
    }, 3000);
});

const btnAdmin = document.getElementById('btn-admin-access');
if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        window.location.href = "Admin/login.html";
    });
}
