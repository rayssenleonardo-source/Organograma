const ORG2_DEFAULT_DIRETORIAS = [
    { cargo: "Diretoria Operacional" },
    { cargo: "Diretoria de Inovação, Processos e Tecnologia" }
];

const ORG2_DEFAULT_ESTRUTURA = {
    nivel: 1,
    cargo: "Segurança Eletrônica",
    filhos: [
        { nivel: 2, cargo: "Gerência Operacional" },
        {
            nivel: 2,
            cargo: "Gerência de Seg. Eletrônica",
            filhos: [
                {
                    nivel: 4,
                    cargo: "Central de Monitoramento",
                    filhos: [
                        {
                            nivel: 5,
                            cargo: "Operação de Monitoramento",
                            filhos: [
                                {
                                    nivel: 5,
                                    cargo: "Supervisor de Monitoramento",
                                    filhos: [
                                        {
                                            nivel: 5,
                                            cargo: "Diurno",
                                            filhos: [
                                                { nivel: 5, cargo: "Operadores Diurnos", quantidade: 4 }
                                            ]
                                        },
                                        {
                                            nivel: 5,
                                            cargo: "Noturno",
                                            filhos: [
                                                { nivel: 5, cargo: "Operadores Noturnos", quantidade: 4 }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    nivel: 4,
                    cargo: "Shield"
                },
                {
                    nivel: 4,
                    cargo: "Central Técnica",
                    filhos: [
                        {
                            nivel: 5,
                            cargo: "Supervisor Técnico",
                            filhos: [
                                {
                                    nivel: 5,
                                    cargo: "Instalação",
                                    filhos: [
                                        {
                                            nivel: 5,
                                            cargo: "Clientes 6x1A",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Técnico",
                                                    filhos: [
                                                        {
                                                            nivel: 5,
                                                            cargo: "Auxiliar Técnico"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    nivel: 5,
                                    cargo: "Manutenção",
                                    filhos: [
                                        {
                                            nivel: 5,
                                            cargo: "CIPLAN 5x2",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Técnico",
                                                    filhos: [
                                                        { nivel: 5, cargo: "Auxiliar Técnico" }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            nivel: 5,
                                            cargo: "STF 6x1",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Técnico",
                                                    filhos: [
                                                        { nivel: 5, cargo: "Auxiliar Técnico" }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            nivel: 5,
                                            cargo: "Clientes 6x1A",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Técnico",
                                                    filhos: [
                                                        { nivel: 5, cargo: "Auxiliar Técnico" }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    nivel: 5,
                                    cargo: "Tecnico Shield"
                                }
                            ]
                        }
                    ]
                },
                {
                    nivel: 4,
                    cargo: "Tecnologia",
                    filhos: [
                        {
                            nivel: 5,
                            cargo: "Projetos, Inovação e Planejamento",
                            filhos: [
                                {
                                    nivel: 5,
                                    cargo: "Analista de Tecnologia N2",
                                    filhos: [
                                        {
                                            nivel: 5,
                                            cargo: "Analista de Tecnologia N1",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Tecnicos de Suporte",
                                                    quantidade: 2,
                                                    filhos: [
                                                        { nivel: 5, cargo: "Analista Shield" }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    nivel: 4,
                    cargo: "Apoio e Logística",
                    filhos: [
                        {
                            nivel: 5,
                            cargo: "Op. Apoio Técnico, ADM e Logístico",
                            filhos: [
                                {
                                    nivel: 5,
                                    cargo: "Assistente Administrativo",
                                    filhos: [
                                        { nivel: 5, cargo: "Jovem Aprendiz" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        { nivel: 2, cargo: "Gerência Comercial" }
    ]
};

const btnExportPdfOrg2 = document.getElementById("btn-export-pdf-org2");
const org2MainScroll = document.getElementById("dashboard-content");
const org2TopScroll = document.getElementById("org2-scroll-top");
const org2TopScrollInner = document.getElementById("org2-scroll-top-inner");

let isSyncingOrg2Scroll = false;

function normalizeLabel(value) {
    return (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function isOrg2BlueHighlightCargo(value) {
    const cargo = normalizeLabel(value);
    return (
        cargo === normalizeLabel("Gerência de Seg. Eletrônica") ||
        cargo === normalizeLabel("Analista de Tecnologia N1")
    );
}

function isOrg2GreenHighlightCargo(value) {
    return normalizeLabel(value).includes("shield");
}

function isOrg2YellowHighlightCargo(value) {
    const cargo = normalizeLabel(value);
    return (
        cargo === normalizeLabel(ORG2_OPERADOR_LIDER_TITULO) ||
        cargo === normalizeLabel("Analista de Tecnologia N2")
    );
}

function isOrg2YellowHighlightPerson(value) {
    const person = normalizeLabel(value);
    return (
        person === normalizeLabel("Cauã Carvalho") ||
        person === normalizeLabel("Thiago Alves")
    );
}

function isOrg2RedHighlightPerson(value) {
    const person = normalizeLabel(value);
    return (
        person === normalizeLabel("Silvano Rodrigues") ||
        person === normalizeLabel("Renier Müller") ||
        person === normalizeLabel("Renier Müller Cunha")
    );
}

function isOrg2PurpleHighlightPerson(value) {
    return normalizeLabel(value) === normalizeLabel("Cirlei Silva");
}

function isEmptyPersonEntry(entry) {
    if (typeof entry === "string") {
        return String(entry).trim() === "";
    }

    if (entry && typeof entry === "object") {
        return !Object.values(entry).some((value) => String(value || "").trim() !== "");
    }

    return true;
}

function getPersonEntryName(entry) {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") return String(entry.nome || "");
    return "";
}

function clonePersonEntry(entry) {
    if (typeof entry === "string") return String(entry);
    if (entry && typeof entry === "object") return { ...entry };
    return "";
}

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "";
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return `${first}${last}`.toUpperCase();
}

function resolveOrg2PhotoSrc(rawValue) {
    const src = String(rawValue || "").trim();
    if (!src) return "";

    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
        return src;
    }

    if (src.startsWith("/")) return src;
    if (src.startsWith("uploads/")) return `/${src}`;
    return src;
}

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

const ORG2_DATA_SOURCES = [
    "/api/dados",
    "http://127.0.0.1:5000/api/dados",
    "http://localhost:5000/api/dados",
    "dados.json"
];

const ORG2_DATA_KEY = "organograma2";
const ORG2_OPERADOR_LIDER_TITULO = "Operador N2 Lider Plantão";
const ORG2_OPERADOR_TOTAL_CARDS = 4;
const ORG2_TECNICOS_SUPORTE_CARDS = 1;
const ORG2_NAME_PLACEHOLDER = "Nome do Funcionário";
const ORG2_TECNOLOGIA_SHIFT_RIGHT_PX = 36;
const ORG2_APOIO_LOGISTICA_SHIFT_RIGHT_PX = 36;

let org2Diretorias = cloneData(ORG2_DEFAULT_DIRETORIAS);
let org2Estrutura = cloneData(ORG2_DEFAULT_ESTRUTURA);
let org2PayloadCache = null;
let org2SaveTimer = null;
let org2IsSaving = false;
let org2HasPendingSave = false;

function fetchWithTimeout(url, timeoutMs = 2200) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { cache: "no-store", signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

async function loadOrg2Payload() {
    for (const source of ORG2_DATA_SOURCES) {
        try {
            const response = await fetchWithTimeout(source);
            if (!response.ok) continue;
            return await response.json();
        } catch (error) {
            console.debug(`Falha ao carregar ${source}:`, error?.message || error);
        }
    }
    return null;
}

function readOrg2SnapshotFromPayload(payload) {
    if (!payload || typeof payload !== "object") return null;

    const rawSnapshot = payload[ORG2_DATA_KEY];
    if (!rawSnapshot || typeof rawSnapshot !== "object") return null;

    if (!Array.isArray(rawSnapshot.diretorias)) return null;
    if (!rawSnapshot.estrutura || typeof rawSnapshot.estrutura !== "object") return null;

    return {
        diretorias: cloneData(rawSnapshot.diretorias),
        estrutura: cloneData(rawSnapshot.estrutura)
    };
}

function buildOrg2Snapshot() {
    return {
        diretorias: cloneData(org2Diretorias),
        estrutura: cloneData(org2Estrutura)
    };
}

function syncOrg2StateFromPayload(payload) {
    const snapshot = readOrg2SnapshotFromPayload(payload);
    if (snapshot) {
        org2Diretorias = snapshot.diretorias;
        org2Estrutura = snapshot.estrutura;
    } else {
        org2Diretorias = cloneData(ORG2_DEFAULT_DIRETORIAS);
        org2Estrutura = cloneData(ORG2_DEFAULT_ESTRUTURA);
    }

    normalizeOrg2LegacyLabels(org2Estrutura);
    flattenGestaoSegurancaNodes(org2Estrutura);
    ensureShieldUnderGerenciaSeguranca(org2Estrutura);
    ensureCentralTecnicaSplit(org2Estrutura);
    ensureMonitoramentoTurnosGroups(org2Estrutura);
}

function walkOrg2Nodes(nodeData, visitor) {
    if (!nodeData || typeof nodeData !== "object") return;
    visitor(nodeData);

    const filhos = Array.isArray(nodeData.filhos) ? nodeData.filhos : [];
    filhos.forEach((filho) => walkOrg2Nodes(filho, visitor));
}

function normalizeOrg2LegacyLabels(rootNode) {
    walkOrg2Nodes(rootNode, (node) => {
        const cargo = normalizeLabel(node.cargo);
        if (
            cargo === normalizeLabel("Equipe de Jovens Aprendiz") ||
            cargo === normalizeLabel("Equipe de Jovem Aprendiz")
        ) {
            node.cargo = "Jovem Aprendiz";
            return;
        }

        if (cargo === normalizeLabel("Suporte Shield")) {
            node.cargo = "Analista Shield";
        }
    });
}

function ensureMonitoramentoTurnosGroups(rootNode) {
    walkOrg2Nodes(rootNode, (node) => {
        if (normalizeLabel(node?.cargo) !== normalizeLabel("Supervisor de Monitoramento")) return;

        const filhosOriginais = Array.isArray(node.filhos) ? node.filhos : [];
        if (filhosOriginais.length === 0) return;

        let hasLegacyTurnoNodes = false;
        const filhosAgrupados = filhosOriginais.map((filho) => {
            const cargoFilho = normalizeLabel(filho?.cargo);
            if (
                cargoFilho === normalizeLabel("Operadores Diurnos") ||
                cargoFilho === normalizeLabel("Operadores Noturnos")
            ) {
                hasLegacyTurnoNodes = true;
                const turnoCargo = cargoFilho === normalizeLabel("Operadores Diurnos")
                    ? "Diurno"
                    : "Noturno";
                const levelFromChild = Number.isFinite(filho?.nivel)
                    ? filho.nivel
                    : (Number.isFinite(node.nivel) ? node.nivel : 5);

                filho.nivel = levelFromChild;
                filho.quantidade = ORG2_OPERADOR_TOTAL_CARDS;

                const names = ensureNodeNames(filho);
                if (normalizeLabel(getPersonEntryName(names[0])) === normalizeLabel(ORG2_OPERADOR_LIDER_TITULO)) {
                    names.shift();
                }
                while (names.length > 0) {
                    if (!isEmptyPersonEntry(names[names.length - 1])) break;
                    names.pop();
                }

                return {
                    nivel: levelFromChild,
                    cargo: turnoCargo,
                    filhos: [filho]
                };
            }
            return filho;
        });

        if (hasLegacyTurnoNodes) {
            node.filhos = filhosAgrupados;
        }

        const filhosTurno = Array.isArray(node.filhos) ? node.filhos : [];
        filhosTurno.forEach((turnoNode) => {
            const cargoTurno = normalizeLabel(turnoNode?.cargo);
            if (
                cargoTurno !== normalizeLabel("Diurno") &&
                cargoTurno !== normalizeLabel("Noturno")
            ) {
                return;
            }

            const turnoChildren = Array.isArray(turnoNode.filhos) ? turnoNode.filhos : [];
            let operadorNode = turnoChildren.find((item) => {
                const itemCargo = normalizeLabel(item?.cargo);
                return (
                    itemCargo === normalizeLabel("Operadores Diurnos") ||
                    itemCargo === normalizeLabel("Operadores Noturnos")
                );
            });

            if (!operadorNode) {
                const nivelFallback = Number.isFinite(turnoNode.nivel)
                    ? turnoNode.nivel
                    : (Number.isFinite(node.nivel) ? node.nivel : 5);
                operadorNode = {
                    nivel: nivelFallback,
                    cargo: cargoTurno === normalizeLabel("Diurno")
                        ? "Operadores Diurnos"
                        : "Operadores Noturnos",
                    quantidade: ORG2_OPERADOR_TOTAL_CARDS,
                    nomes: []
                };
            }

            operadorNode.cargo = cargoTurno === normalizeLabel("Diurno")
                ? "Operadores Diurnos"
                : "Operadores Noturnos";
            operadorNode.quantidade = ORG2_OPERADOR_TOTAL_CARDS;

            const names = ensureNodeNames(operadorNode);
            if (normalizeLabel(getPersonEntryName(names[0])) === normalizeLabel(ORG2_OPERADOR_LIDER_TITULO)) {
                names.shift();
            }
            while (names.length > 0) {
                if (!isEmptyPersonEntry(names[names.length - 1])) break;
                names.pop();
            }

            turnoNode.filhos = [operadorNode];
        });
    });
}

function flattenGestaoSegurancaNodes(nodeData) {
    if (!nodeData || typeof nodeData !== "object") return;

    const filhos = Array.isArray(nodeData.filhos) ? nodeData.filhos : [];
    if (filhos.length === 0) return;

    const filhosNormalizados = [];
    filhos.forEach((filho) => {
        flattenGestaoSegurancaNodes(filho);

        if (normalizeLabel(filho?.cargo) === normalizeLabel("Gestão de Segurança Eletrônica")) {
            const netos = Array.isArray(filho.filhos) ? filho.filhos : [];
            netos.forEach((neto) => filhosNormalizados.push(neto));
            return;
        }

        filhosNormalizados.push(filho);
    });

    nodeData.filhos = filhosNormalizados;
}

function ensureShieldUnderGerenciaSeguranca(rootNode) {
    walkOrg2Nodes(rootNode, (node) => {
        if (normalizeLabel(node?.cargo) !== normalizeLabel("Gerência de Seg. Eletrônica")) return;

        const filhos = Array.isArray(node.filhos) ? node.filhos : [];
        const filhosSemShield = [];
        let shieldNode = null;

        filhos.forEach((filho) => {
            if (normalizeLabel(filho?.cargo) === normalizeLabel("Shield")) {
                if (!shieldNode) shieldNode = filho;
                return;
            }
            filhosSemShield.push(filho);
        });

        if (!shieldNode) {
            shieldNode = { cargo: "Shield" };
        }

        const levelFromChildren = filhosSemShield.find((filho) => Number.isFinite(filho?.nivel));
        const levelFallback = Number.isFinite(node.nivel) ? node.nivel + 2 : 4;
        shieldNode.nivel = Number.isFinite(levelFromChildren?.nivel)
            ? levelFromChildren.nivel
            : levelFallback;

        const idxCentralTecnica = filhosSemShield.findIndex((filho) => (
            normalizeLabel(filho?.cargo) === normalizeLabel("Central Técnica")
        ));

        if (idxCentralTecnica >= 0) {
            node.filhos = [
                ...filhosSemShield.slice(0, idxCentralTecnica),
                shieldNode,
                ...filhosSemShield.slice(idxCentralTecnica)
            ];
            return;
        }

        node.filhos = [...filhosSemShield, shieldNode];
    });
}

const ORG2_TECNICOS_LOCAIS = ["CIPLAN 5x2", "STF 6x1", "Clientes 6x1A"];

function getFirstNodePerson(nodeData) {
    if (!nodeData || typeof nodeData !== "object") return "";
    const names = Array.isArray(nodeData.nomes) ? nodeData.nomes : [];
    const firstPerson = names.find((value) => !isEmptyPersonEntry(value));
    return firstPerson ? clonePersonEntry(firstPerson) : "";
}

function getFirstNodeName(nodeData) {
    const person = getFirstNodePerson(nodeData);
    return String(getPersonEntryName(person) || "").trim();
}

function findFirstDescendantByCargo(nodeData, labels) {
    if (!nodeData || typeof nodeData !== "object") return null;

    let found = null;
    walkOrg2Nodes(nodeData, (item) => {
        if (found) return;
        if (item === nodeData) return;

        const cargo = normalizeLabel(item?.cargo);
        if (labels.some((label) => cargo === normalizeLabel(label))) {
            found = item;
        }
    });

    return found;
}

function buildTecnicosLocalNode(localCargo, nivel, tecnicoPerson = "", auxiliarPerson = "") {
    const tecnicoNode = {
        nivel,
        cargo: "Técnico",
        filhos: [{ nivel, cargo: "Auxiliar Técnico" }]
    };
    if (!isEmptyPersonEntry(tecnicoPerson)) tecnicoNode.nomes = [clonePersonEntry(tecnicoPerson)];
    if (!isEmptyPersonEntry(auxiliarPerson)) tecnicoNode.filhos[0].nomes = [clonePersonEntry(auxiliarPerson)];

    return {
        nivel,
        cargo: localCargo,
        filhos: [tecnicoNode]
    };
}

function buildInstalacaoNode(nivel, tecnicoPerson = "", auxiliarPerson = "") {
    const tecnicoNode = {
        nivel,
        cargo: "Técnico",
        filhos: [{ nivel, cargo: "Auxiliar Técnico" }]
    };

    if (!isEmptyPersonEntry(tecnicoPerson)) tecnicoNode.nomes = [clonePersonEntry(tecnicoPerson)];
    if (!isEmptyPersonEntry(auxiliarPerson)) tecnicoNode.filhos[0].nomes = [clonePersonEntry(auxiliarPerson)];

    return {
        nivel,
        cargo: "Instalação",
        filhos: [
            {
                nivel,
                cargo: "Clientes 6x1A",
                filhos: [tecnicoNode]
            }
        ]
    };
}

function buildManutencaoNode(nivel, locais) {
    return {
        nivel,
        cargo: "Manutenção",
        filhos: locais
    };
}

function buildTecnicoShieldNode(nivel, tecnicoShieldPerson = "") {
    const node = {
        nivel,
        cargo: "Tecnico Shield"
    };

    if (!isEmptyPersonEntry(tecnicoShieldPerson)) node.nomes = [clonePersonEntry(tecnicoShieldPerson)];
    return node;
}

function buildSupervisorTecnicoNode(
    nivel,
    instalacaoNode,
    manutencaoNode,
    tecnicoShieldNode,
    supervisorPerson = ""
) {
    const supervisorNode = {
        nivel,
        cargo: "Supervisor Técnico",
        filhos: [instalacaoNode, manutencaoNode, tecnicoShieldNode]
    };

    if (!isEmptyPersonEntry(supervisorPerson)) supervisorNode.nomes = [clonePersonEntry(supervisorPerson)];
    return supervisorNode;
}

function ensureCentralTecnicaSplit(rootNode) {
    walkOrg2Nodes(rootNode, (node) => {
        if (normalizeLabel(node?.cargo) !== normalizeLabel("Central Técnica")) return;

        const filhosOriginais = Array.isArray(node.filhos) ? node.filhos : [];
        const supervisorExistente = filhosOriginais.find((filho) => (
            normalizeLabel(filho?.cargo) === normalizeLabel("Supervisor Técnico")
        ));
        const filhosSupervisor = Array.isArray(supervisorExistente?.filhos) ? supervisorExistente.filhos : [];
        const filhosBase = filhosSupervisor.length > 0 ? filhosSupervisor : filhosOriginais;

        const instalacaoExistente = filhosBase.find((filho) => (
            normalizeLabel(filho?.cargo) === normalizeLabel("Instalação")
        ));
        const manutencaoExistente = filhosBase.find((filho) => (
            normalizeLabel(filho?.cargo) === normalizeLabel("Manutenção")
        ));
        const legadoInstalacaoManutencao = filhosBase.find((filho) => (
            normalizeLabel(filho?.cargo) === normalizeLabel("Instalação e Manutenção")
        ));

        const baseNode =
            instalacaoExistente ||
            manutencaoExistente ||
            legadoInstalacaoManutencao ||
            filhosBase[0] ||
            supervisorExistente ||
            filhosOriginais[0];
        const baseNivel = Number.isFinite(baseNode?.nivel)
            ? baseNode.nivel
            : (Number.isFinite(node.nivel) ? node.nivel + 1 : 5);

        const supervisorExistenteDesc = supervisorExistente || findFirstDescendantByCargo(node, ["Supervisor Técnico", "Supervisor Tecnico"]);
        const supervisorPerson = getFirstNodePerson(supervisorExistenteDesc);
        const tecnicoShieldExistenteDesc = findFirstDescendantByCargo(node, ["Tecnico Shield", "Técnico Shield", "Tec. Shield"]);
        const tecnicoShieldPerson = getFirstNodePerson(tecnicoShieldExistenteDesc);

        const tecnicoInstalacaoNode = findFirstDescendantByCargo(instalacaoExistente, ["Técnico", "Tecnico", "Tecnicos"]);
        const auxiliarInstalacaoNode = findFirstDescendantByCargo(instalacaoExistente, ["Auxiliar Técnico", "Auxiliar Tecnico", "Auxiliares Tecnicos"]);

        const tecnicoInstalacaoPerson = getFirstNodePerson(tecnicoInstalacaoNode);
        const auxiliarInstalacaoPerson = getFirstNodePerson(auxiliarInstalacaoNode);

        const sourceManutencao = manutencaoExistente || legadoInstalacaoManutencao || null;
        const filhosManutencao = Array.isArray(sourceManutencao?.filhos) ? sourceManutencao.filhos : [];

        const tecnicoPeople = [];
        const auxiliarPeople = [];
        walkOrg2Nodes(sourceManutencao, (item) => {
            const cargo = normalizeLabel(item?.cargo);
            const person = getFirstNodePerson(item);
            if (isEmptyPersonEntry(person)) return;

            if (
                cargo === normalizeLabel("Técnico") ||
                cargo === normalizeLabel("Tecnico") ||
                cargo === normalizeLabel("Tecnicos")
            ) {
                tecnicoPeople.push(person);
            }
            if (
                cargo === normalizeLabel("Auxiliar Técnico") ||
                cargo === normalizeLabel("Auxiliar Tecnico") ||
                cargo === normalizeLabel("Auxiliares Tecnicos")
            ) {
                auxiliarPeople.push(person);
            }
        });

        const localNodes = ORG2_TECNICOS_LOCAIS.map((localCargo, index) => {
            const localExistente = filhosManutencao.find((filho) => (
                normalizeLabel(filho?.cargo) === normalizeLabel(localCargo)
            ));

            const tecnicoLocal = findFirstDescendantByCargo(localExistente, ["Técnico", "Tecnico", "Tecnicos"]);
            const auxiliarLocal = findFirstDescendantByCargo(localExistente, ["Auxiliar Técnico", "Auxiliar Tecnico", "Auxiliares Tecnicos"]);

            const tecnicoPerson = getFirstNodePerson(tecnicoLocal) || tecnicoPeople[index] || "";
            const auxiliarPerson = getFirstNodePerson(auxiliarLocal) || auxiliarPeople[index] || "";

            return buildTecnicosLocalNode(localCargo, baseNivel, tecnicoPerson, auxiliarPerson);
        });

        const outrosFilhos = filhosOriginais.filter((filho) => {
            const cargo = normalizeLabel(filho?.cargo);
            return (
                cargo !== normalizeLabel("Supervisor Técnico") &&
                cargo !== normalizeLabel("Instalação") &&
                cargo !== normalizeLabel("Manutenção") &&
                cargo !== normalizeLabel("Instalação e Manutenção") &&
                cargo !== normalizeLabel("Tecnico Shield") &&
                cargo !== normalizeLabel("Técnico Shield") &&
                cargo !== normalizeLabel("Tec. Shield")
            );
        });

        node.filhos = [
            buildSupervisorTecnicoNode(
                baseNivel,
                buildInstalacaoNode(baseNivel, tecnicoInstalacaoPerson, auxiliarInstalacaoPerson),
                buildManutencaoNode(baseNivel, localNodes),
                buildTecnicoShieldNode(baseNivel, tecnicoShieldPerson),
                supervisorPerson
            ),
            ...outrosFilhos
        ];
    });
}

function getCardDisplayCargo(nodeData, nameIndex = 0) {
    const customCargo = getCustomCardDisplayCargo(nodeData, nameIndex);
    if (customCargo) return customCargo;
    return getDefaultCardDisplayCargo(nodeData, nameIndex);
}

function getDefaultCardDisplayCargo(nodeData, nameIndex = 0) {
    const cargo = normalizeLabel(nodeData.cargo);

    if (
        cargo === normalizeLabel("Operadores Diurnos") ||
        cargo === normalizeLabel("Operadores Noturnos")
    ) {
        if (nameIndex % 2 === 0) {
            return ORG2_OPERADOR_LIDER_TITULO;
        }
        return nameIndex === 1 ? "Operador (PCD)" : "Operador";
    }

    if (cargo === normalizeLabel("Tecnicos de Suporte")) {
        const limiteTecnicosSuporte = ORG2_TECNICOS_SUPORTE_CARDS;

        if (nameIndex >= limiteTecnicosSuporte) {
            return "Jovem Aprendiz";
        }
    }

    if (
        cargo === normalizeLabel("Equipe de Jovens Aprendiz") ||
        cargo === normalizeLabel("Equipe de Jovem Aprendiz")
    ) {
        return "Jovem Aprendiz";
    }

    return nodeData.cargo;
}

function getCustomCardDisplayCargo(nodeData, nameIndex) {
    const labels = Array.isArray(nodeData?.cargosExibicao) ? nodeData.cargosExibicao : [];
    const rawValue = labels[nameIndex];
    return typeof rawValue === "string" ? rawValue.trim() : "";
}

function getCardScaleLabel(nodeData, nameIndex = 0) {
    const nodeCargo = normalizeLabel(nodeData?.cargo);
    const cardCargo = normalizeLabel(getDefaultCardDisplayCargo(nodeData, nameIndex));

    if (nodeCargo === normalizeLabel("Diurno") || nodeCargo === normalizeLabel("Noturno")) {
        return "12x36";
    }

    if (
        cardCargo === normalizeLabel("Supervisor Técnico") ||
        cardCargo === normalizeLabel("Supervisor Tecnico") ||
        cardCargo === normalizeLabel("Supervisor de Monitoramento")
    ) {
        return "6x1";
    }

    if (
        cardCargo === normalizeLabel("Analista de Tecnologia N2") ||
        cardCargo === normalizeLabel("Analista de Tecnologia N1")
    ) {
        return "5x2";
    }

    if (cardCargo === normalizeLabel("Tecnicos de Suporte")) {
        return "6x1";
    }

    return "";
}

function ensureNodeNames(nodeData) {
    if (!Array.isArray(nodeData.nomes)) {
        nodeData.nomes = [];
    }
    return nodeData.nomes;
}

function isEmptyNameEntry(entry) {
    return isEmptyPersonEntry(entry);
}

function getNodeName(nodeData, nameIndex) {
    return getNodePersonData(nodeData, nameIndex).nome;
}

function getNodePersonData(nodeData, nameIndex) {
    const names = ensureNodeNames(nodeData);
    const value = names[nameIndex];

    if (typeof value === "string") {
        return { nome: value };
    }

    if (value && typeof value === "object") {
        return {
            ...value,
            nome: typeof value.nome === "string" ? value.nome : "",
            foto: typeof value.foto === "string" ? value.foto : ""
        };
    }

    return { nome: "", foto: "" };
}

function setNodeName(nodeData, nameIndex, rawValue) {
    const names = ensureNodeNames(nodeData);
    const nextValue = String(rawValue || "");
    const existingEntry = names[nameIndex];

    if (existingEntry && typeof existingEntry === "object") {
        if (nextValue.trim()) {
            existingEntry.nome = nextValue;
        } else {
            delete existingEntry.nome;
        }
        names[nameIndex] = existingEntry;
    } else {
        names[nameIndex] = nextValue;
    }

    while (names.length > 0) {
        if (!isEmptyNameEntry(names[names.length - 1])) break;
        names.pop();
    }
}

function buildPayloadForSave(basePayload) {
    const payload = (basePayload && typeof basePayload === "object")
        ? cloneData(basePayload)
        : {};

    payload[ORG2_DATA_KEY] = buildOrg2Snapshot();
    return payload;
}

function scheduleOrg2Save() {
    if (org2SaveTimer) {
        clearTimeout(org2SaveTimer);
    }

    org2SaveTimer = setTimeout(() => {
        org2SaveTimer = null;
        persistOrg2Data().catch((error) => {
            console.warn("Falha ao salvar dados do organograma 2:", error);
        });
    }, 650);
}

async function persistOrg2Data() {
    if (org2IsSaving) {
        org2HasPendingSave = true;
        return;
    }

    org2IsSaving = true;
    try {
        const payloadToSave = buildPayloadForSave(org2PayloadCache || {});
        const response = await fetch("/api/dados", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payloadToSave)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        org2PayloadCache = payloadToSave;
    } finally {
        org2IsSaving = false;
        if (org2HasPendingSave) {
            org2HasPendingSave = false;
            await persistOrg2Data();
        }
    }
}

const ORG2_CARGOS_TITULO_APENAS = new Set(
    [
        "Segurança Eletrônica",
        "Diurno",
        "Noturno",
        "Central de Monitoramento",
        "Central Técnica",
        "Tecnologia",
        "Apoio e Logística",
        "Gerência Operacional",
        "Gerência Comercial",
        "Operação de Monitoramento",
        "Instalação",
        "Manutenção",
        "Instalação e Manutenção",
        "CIPLAN 5x2",
        "STF 6x1",
        "Clientes 6x1A",
        "Projetos, Inovação e Planejamento",
        "Op. Apoio Técnico, ADM e Logístico",
        "Shield"
    ].map((label) => normalizeLabel(label))
);

const ORG2_CARGOS_SEM_CONTADOR = new Set(
    [
        "Operadores Diurnos",
        "Operadores Noturnos",
        "Tecnicos de Suporte",
        "Tecnicos",
        "Auxiliares Tecnicos"
    ].map((label) => normalizeLabel(label))
);

function isTitleOnlyCargo(cargo) {
    return ORG2_CARGOS_TITULO_APENAS.has(normalizeLabel(cargo));
}

function shouldShowCount(cargo) {
    return !ORG2_CARGOS_SEM_CONTADOR.has(normalizeLabel(cargo));
}

function findNodeCardByLabel(label) {
    const target = normalizeLabel(label);
    const cards = Array.from(document.querySelectorAll(".org2-card"));
    return cards.find((card) => normalizeLabel(getCardCargoLabel(card)) === target) || null;
}

function findFirstNodeCardByLabels(labels) {
    for (const label of labels) {
        const card = findNodeCardByLabel(label);
        if (card) return card;
    }
    return null;
}

function getCardCargoLabel(card) {
    if (!card) return "";

    const dataCargo = String(card.dataset.org2Cargo || "").trim();
    if (dataCargo) return dataCargo;

    const title = card.querySelector(".org2-card-title");
    return title ? String(title.textContent || "") : "";
}

function alignGerenciaOperacionalWithMonitoramento() {
    const gerenciaCard = findNodeCardByLabel("Gerencia Operacional");
    const monitoramentoCard = findNodeCardByLabel("Central de Monitoramento");
    const gerenciaSegCard = findFirstNodeCardByLabels([
        "Gerencia de Seg. Eletronica",
        "Gerência de Seg. Eletrônica"
    ]);

    if (!gerenciaCard || !monitoramentoCard) return;

    const gerenciaNode = gerenciaCard.closest(".node");
    if (!gerenciaNode) return;

    gerenciaNode.style.transform = "";

    const gerenciaRect = gerenciaCard.getBoundingClientRect();
    const monitoramentoRect = monitoramentoCard.getBoundingClientRect();

    const gerenciaCenter = gerenciaRect.left + (gerenciaRect.width / 2);
    const monitoramentoCenter = monitoramentoRect.left + (monitoramentoRect.width / 2);
    let targetCenter = monitoramentoCenter;

    if (gerenciaSegCard) {
        const gerenciaSegRect = gerenciaSegCard.getBoundingClientRect();
        const minGapPx = 26;
        const maxAllowedCenter = gerenciaSegRect.left - minGapPx - (gerenciaRect.width / 2);
        targetCenter = Math.min(targetCenter, maxAllowedCenter);
    }

    const delta = Math.round(targetCenter - gerenciaCenter);

    gerenciaNode.style.transform = `translateX(${delta}px)`;
    gerenciaNode.style.zIndex = "4";
}

function alignGerenciaComercialWithApoioLogistica() {
    const gerenciaCard = findFirstNodeCardByLabels([
        "Gerencia Comercial",
        "Gerancia Comercial",
        "Gerência Comercial",
        "Gerância Comercial"
    ]);
    const gerenciaSegCard = findFirstNodeCardByLabels([
        "Gerencia de Seg. Eletronica",
        "Gerência de Seg. Eletrônica"
    ]);
    const gerenciaOperacionalCard = findFirstNodeCardByLabels([
        "Gerencia Operacional",
        "Gerência Operacional"
    ]);

    if (!gerenciaCard || !gerenciaSegCard || !gerenciaOperacionalCard) return;

    const gerenciaNode = gerenciaCard.closest(".node");
    if (!gerenciaNode) return;

    gerenciaNode.style.transform = "";

    const gerenciaRect = gerenciaCard.getBoundingClientRect();
    const gerenciaSegRect = gerenciaSegCard.getBoundingClientRect();
    const gerenciaOperacionalRect = gerenciaOperacionalCard.getBoundingClientRect();

    const gerenciaCenter = gerenciaRect.left + (gerenciaRect.width / 2);
    const gerenciaSegCenter = gerenciaSegRect.left + (gerenciaSegRect.width / 2);
    const gerenciaOperacionalCenter =
        gerenciaOperacionalRect.left + (gerenciaOperacionalRect.width / 2);

    // Mantem o comercial com o mesmo espaçamento da operacional, espelhando ao redor da gerencia de seguranca.
    const spacing = Math.max(0, gerenciaSegCenter - gerenciaOperacionalCenter);
    const targetCenter = gerenciaSegCenter + spacing;
    const delta = Math.round(targetCenter - gerenciaCenter);

    gerenciaNode.style.transform = `translateX(${delta}px)`;
}

function getOrCreateShieldNetworkLayer() {
    const layout = document.getElementById("org2-layout");
    if (!layout) return null;

    let layer = layout.querySelector("#org2-shield-network");
    if (!layer) {
        layer = document.createElement("div");
        layer.id = "org2-shield-network";
        layer.className = "org2-shield-network";
        layer.setAttribute("aria-hidden", "true");
        layout.appendChild(layer);
    }

    return layer;
}

function removeShieldNetworkLayer() {
    const layer = document.getElementById("org2-shield-network");
    if (layer && layer.parentNode) {
        layer.parentNode.removeChild(layer);
    }
}

function upsertShieldNetworkSegment(layer, segmentId) {
    let segment = layer.querySelector(`[data-segment=\"${segmentId}\"]`);
    if (!segment) {
        segment = document.createElement("span");
        segment.className = "org2-shield-network-segment";
        segment.dataset.segment = segmentId;
        layer.appendChild(segment);
    }
    return segment;
}

function drawShieldHorizontalSegment(layer, segmentId, x1, x2, y) {
    const segment = upsertShieldNetworkSegment(layer, segmentId);
    const left = Math.round(Math.min(x1, x2));
    const width = Math.max(2, Math.round(Math.abs(x2 - x1)));
    const top = Math.round(y) - 1;

    segment.style.left = `${left}px`;
    segment.style.top = `${top}px`;
    segment.style.width = `${width}px`;
    segment.style.height = "2px";
}

function drawShieldVerticalSegment(layer, segmentId, x, y1, y2) {
    const segment = upsertShieldNetworkSegment(layer, segmentId);
    const top = Math.round(Math.min(y1, y2));
    const height = Math.max(2, Math.round(Math.abs(y2 - y1)));
    const left = Math.round(x) - 1;

    segment.style.left = `${left}px`;
    segment.style.top = `${top}px`;
    segment.style.width = "2px";
    segment.style.height = `${height}px`;
}

function updateShieldDownstreamConnectors() {
    const layout = document.getElementById("org2-layout");
    const shieldCard = findNodeCardByLabel("Shield");
    const centralMonitoramentoCard = findFirstNodeCardByLabels([
        "Central de Monitoramento",
        "Central de Monitoramento"
    ]);
    const analistaN2Card = findFirstNodeCardByLabels([
        "Analista de Tecnologia N2"
    ]);
    const analistaShieldCard = findFirstNodeCardByLabels([
        "Analista Shield",
        "Suporte Shield"
    ]);
    const tecnicoShieldCard = findFirstNodeCardByLabels([
        "Tecnico Shield",
        "Técnico Shield",
        "Tec. Shield"
    ]);

    const targetCards = [
        { id: "analista-shield", card: analistaShieldCard },
        { id: "tecnico-shield", card: tecnicoShieldCard }
    ].filter((target) => Boolean(target.card));

    if (!layout || !shieldCard || targetCards.length === 0) {
        removeShieldNetworkLayer();
        return;
    }

    const layer = getOrCreateShieldNetworkLayer();
    if (!layer) return;
    layer.innerHTML = "";

    const layoutRect = layout.getBoundingClientRect();
    const shieldRect = shieldCard.getBoundingClientRect();
    const monitoramentoCardBottomY = centralMonitoramentoCard
        ? (centralMonitoramentoCard.getBoundingClientRect().bottom - layoutRect.top)
        : null;

    const shieldCenterX = (shieldRect.left + (shieldRect.width / 2)) - layoutRect.left;
    const shieldBottomY = shieldRect.bottom - layoutRect.top;
    // Conector sai por baixo do card Shield e desvia abaixo do card Central de Monitoramento.
    const shieldRouteY = Math.round(Math.max(
        shieldBottomY + 14,
        Number.isFinite(monitoramentoCardBottomY) ? monitoramentoCardBottomY + 14 : 0
    ));

    const targetPositions = targetCards.map((target) => {
        const rect = target.card.getBoundingClientRect();
        const leftX = rect.left - layoutRect.left;
        const centerX = (rect.left + (rect.width / 2)) - layoutRect.left;
        const bottomY = rect.bottom - layoutRect.top;
        const branchY = bottomY + 14;

        return {
            id: target.id,
            leftX,
            centerX,
            bottomY,
            branchY
        };
    });

    // Tronco principal desce reto a partir do Shield.
    const trunkX = Math.round(shieldCenterX);
    const trunkTopY = Math.round(shieldRouteY);
    const trunkBottomY = Math.round(Math.max(shieldRouteY, ...targetPositions.map((target) => target.branchY)));

    drawShieldVerticalSegment(layer, "shield-to-route", shieldCenterX, shieldBottomY, shieldRouteY);
    drawShieldVerticalSegment(layer, "trunk", trunkX, trunkTopY, trunkBottomY);

    // Os conectores entram por baixo de cada card destino.
    targetPositions.forEach((target) => {
        drawShieldHorizontalSegment(
            layer,
            `trunk-to-${target.id}-branch`,
            trunkX,
            target.centerX,
            target.branchY
        );
        drawShieldVerticalSegment(
            layer,
            `${target.id}-branch-up`,
            target.centerX,
            target.branchY,
            target.bottomY
        );
    });

    if (analistaN2Card && analistaShieldCard) {
        const analistaRect = analistaN2Card.getBoundingClientRect();
        const analistaShieldRect = analistaShieldCard.getBoundingClientRect();

        const analistaLeftX = analistaRect.left - layoutRect.left;
        const analistaCenterY = (analistaRect.top + (analistaRect.height / 2)) - layoutRect.top;
        const analistaShieldLeftX = analistaShieldRect.left - layoutRect.left;
        const analistaShieldCenterY = (analistaShieldRect.top + (analistaShieldRect.height / 2)) - layoutRect.top;

        const bridgeX = Math.max(10, Math.round(Math.min(analistaLeftX, analistaShieldLeftX) - 26));

        drawShieldHorizontalSegment(
            layer,
            "analista-n2-to-analista-shield-start",
            analistaLeftX,
            bridgeX,
            analistaCenterY
        );
        drawShieldVerticalSegment(
            layer,
            "analista-n2-to-analista-shield-vertical",
            bridgeX,
            analistaCenterY,
            analistaShieldCenterY
        );
        drawShieldHorizontalSegment(
            layer,
            "analista-n2-to-analista-shield-end",
            bridgeX,
            analistaShieldLeftX,
            analistaShieldCenterY
        );
    }
}

function updateGerenciasTopConnector() {
    const row = document.querySelector(".children.org2-gerencias-row");
    if (!row) return;

    const directNodes = Array.from(row.children).filter((el) => el.classList.contains("node"));
    if (directNodes.length < 2) return;

    const centers = directNodes
        .map((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left + (rect.width / 2);
        })
        .filter((value) => Number.isFinite(value));

    if (centers.length < 2) return;

    const rowRect = row.getBoundingClientRect();
    const minCenter = Math.min(...centers) - rowRect.left;
    const maxCenter = Math.max(...centers) - rowRect.left;
    const width = Math.max(0, maxCenter - minCenter);

    row.style.setProperty("--org2-row-line-left", `${Math.round(minCenter)}px`);
    row.style.setProperty("--org2-row-line-width", `${Math.round(width)}px`);

    const gerenciaOperacionalCard = findFirstNodeCardByLabels([
        "Gerencia Operacional",
        "Gerência Operacional"
    ]);
    const gerenciaSegCard = findFirstNodeCardByLabels([
        "Gerencia de Seg. Eletronica",
        "Gerência de Seg. Eletrônica"
    ]);
    const gerenciaComercialCard = findFirstNodeCardByLabels([
        "Gerencia Comercial",
        "Gerancia Comercial",
        "Gerência Comercial",
        "Gerância Comercial"
    ]);

    const existingMarkers = Array.from(row.querySelectorAll(".org2-gerencia-s-marker"));
    if (!gerenciaOperacionalCard || !gerenciaSegCard || !gerenciaComercialCard) {
        existingMarkers.forEach((marker) => marker.remove());
        return;
    }

    const gerenciaOperacionalRect = gerenciaOperacionalCard.getBoundingClientRect();
    const gerenciaSegRect = gerenciaSegCard.getBoundingClientRect();
    const gerenciaComercialRect = gerenciaComercialCard.getBoundingClientRect();

    const operacionalCenter = (gerenciaOperacionalRect.left + (gerenciaOperacionalRect.width / 2)) - rowRect.left;
    const segCenter = (gerenciaSegRect.left + (gerenciaSegRect.width / 2)) - rowRect.left;
    const comercialCenter = (gerenciaComercialRect.left + (gerenciaComercialRect.width / 2)) - rowRect.left;

    const leftMid = Math.round((operacionalCenter + segCenter) / 2);
    const rightMid = Math.round((segCenter + comercialCenter) / 2);

    const upsertMarker = (className, leftPx) => {
        let marker = row.querySelector(`.${className}`);
        if (!marker) {
            marker = document.createElement("span");
            marker.className = `org2-gerencia-s-marker ${className}`;
            marker.textContent = "S";
            marker.setAttribute("aria-hidden", "true");
            row.appendChild(marker);
        }
        marker.style.left = `${leftPx}px`;
    };

    upsertMarker("org2-gerencia-s-left", leftMid);
    upsertMarker("org2-gerencia-s-right", rightMid);
}

function updateSupervisorTecnicoShieldConnector() {
    const supervisorNodes = Array.from(document.querySelectorAll(".org2-card"))
        .filter((card) => normalizeLabel(getCardCargoLabel(card)) === normalizeLabel("Supervisor Técnico"))
        .map((card) => card.closest(".node"))
        .filter(Boolean);

    supervisorNodes.forEach((supervisorNode) => {
        const supervisorCard = supervisorNode.querySelector(":scope > .group-container .org2-card");
        const shieldCard = supervisorNode.querySelector(":scope > .org2-supervisor-shield-branch .org2-card");
        let link = supervisorNode.querySelector(":scope > .org2-supervisor-shield-link");

        if (!supervisorCard || !shieldCard) {
            if (link) link.remove();
            return;
        }

        if (!link) {
            link = document.createElement("span");
            link.className = "org2-supervisor-shield-link";
            link.setAttribute("aria-hidden", "true");
            supervisorNode.appendChild(link);
        }

        const nodeRect = supervisorNode.getBoundingClientRect();
        const supervisorRect = supervisorCard.getBoundingClientRect();
        const shieldRect = shieldCard.getBoundingClientRect();

        const centerX = Math.round((supervisorRect.left + (supervisorRect.width / 2)) - nodeRect.left);
        const startY = Math.round(supervisorRect.bottom - nodeRect.top);
        const endY = Math.round(shieldRect.top - nodeRect.top);
        const height = Math.max(0, endY - startY);

        link.style.left = `${centerX}px`;
        link.style.top = `${startY}px`;
        link.style.height = `${height}px`;
    });
}

function alignTecnologiaEApoioLogistica() {
    const tecnologiaCard = findFirstNodeCardByLabels([
        "Tecnologia"
    ]);
    const apoioLogisticaCard = findFirstNodeCardByLabels([
        "Apoio e Logística",
        "Apoio e Logistica"
    ]);

    if (tecnologiaCard) {
        const tecnologiaNode = tecnologiaCard.closest(".node");
        if (tecnologiaNode) {
            tecnologiaNode.style.transform = `translateX(${ORG2_TECNOLOGIA_SHIFT_RIGHT_PX}px)`;
        }
    }

    if (apoioLogisticaCard) {
        const apoioLogisticaNode = apoioLogisticaCard.closest(".node");
        if (apoioLogisticaNode) {
            apoioLogisticaNode.style.transform = `translateX(${ORG2_APOIO_LOGISTICA_SHIFT_RIGHT_PX}px)`;
        }
    }
}

function updateTecnologiaConnectorBridge() {
    const centralTecnicaCard = findFirstNodeCardByLabels([
        "Central Técnica",
        "Central Tecnica"
    ]);
    const tecnologiaCard = findFirstNodeCardByLabels([
        "Tecnologia"
    ]);

    const existingBridges = Array.from(document.querySelectorAll(".org2-tech-connector-bridge"));
    if (!centralTecnicaCard || !tecnologiaCard) {
        existingBridges.forEach((bridge) => bridge.remove());
        return;
    }

    const centralNode = centralTecnicaCard.closest(".node");
    const tecnologiaNode = tecnologiaCard.closest(".node");
    const row = centralNode?.parentElement;

    if (!centralNode || !tecnologiaNode || !row || row !== tecnologiaNode.parentElement) {
        existingBridges.forEach((bridge) => bridge.remove());
        return;
    }

    const rowStyles = window.getComputedStyle(row);
    const connectorGap = Number.parseFloat(rowStyles.getPropertyValue("--connector-gap")) || 30;
    const halfGap = connectorGap / 2;

    const rowRect = row.getBoundingClientRect();
    const centralRect = centralNode.getBoundingClientRect();
    const tecnologiaRect = tecnologiaNode.getBoundingClientRect();

    const left = Math.round((centralRect.right - rowRect.left) + halfGap);
    const right = Math.round((tecnologiaRect.left - rowRect.left) - halfGap);
    const width = Math.max(0, right - left);
    const top = Math.round(centralRect.top - rowRect.top);

    let bridge = row.querySelector(".org2-tech-connector-bridge");
    if (!bridge) {
        bridge = document.createElement("span");
        bridge.className = "org2-tech-connector-bridge";
        bridge.setAttribute("aria-hidden", "true");
        row.appendChild(bridge);
    }

    if (width <= 0) {
        bridge.style.display = "none";
        return;
    }

    bridge.style.display = "block";
    bridge.style.left = `${left}px`;
    bridge.style.top = `${top}px`;
    bridge.style.width = `${width}px`;
}

function refreshGerenciasAlignment() {
    alignGerenciaOperacionalWithMonitoramento();
    alignGerenciaComercialWithApoioLogistica();
    alignTecnologiaEApoioLogistica();
    updateTecnologiaConnectorBridge();
    updateSupervisorTecnicoShieldConnector();
    updateShieldDownstreamConnectors();
    updateGerenciasTopConnector();
}

function createCardElement(nodeData, extraClass, isTitleOnly, nameIndex = 0) {
    const card = document.createElement("article");
    card.className = `card org2-card ${extraClass}`.trim();
    const defaultCargo = getDefaultCardDisplayCargo(nodeData, nameIndex);
    const displayCargo = getCardDisplayCargo(nodeData, nameIndex);
    const scaleLabel = getCardScaleLabel(nodeData, nameIndex);
    card.dataset.org2Cargo = defaultCargo;

    if (isOrg2GreenHighlightCargo(displayCargo)) {
        card.classList.add("org2-card-highlight-green");
    }

    if (isOrg2YellowHighlightCargo(defaultCargo)) {
        card.classList.add("org2-card-highlight-yellow");
    }

    if (isTitleOnly) {
        card.classList.add("org2-title-only-card");
        const title = document.createElement("h3");
        title.className = "org2-card-title";
        title.textContent = displayCargo;
        card.appendChild(title);

        if (scaleLabel) {
            const scale = document.createElement("div");
            scale.className = "role-tag org2-scale-tag org2-title-scale-tag";
            scale.textContent = scaleLabel;
            card.appendChild(scale);
        }
        return card;
    }

    card.classList.add("org2-person-card");
    const personData = getNodePersonData(nodeData, nameIndex);

    const nome = document.createElement("h3");
    nome.className = "org2-name-slot";
    nome.setAttribute("aria-label", `Nome para ${displayCargo}`);

    const rawName = String(personData.nome || "").trim();
    const avatar = document.createElement("div");
    avatar.className = "avatar org2-avatar";
    avatar.setAttribute("aria-hidden", "true");

    if (isOrg2YellowHighlightPerson(rawName)) {
        card.classList.add("org2-card-highlight-yellow");
    }

    if (isOrg2RedHighlightPerson(rawName)) {
        card.classList.add("org2-card-highlight-red");
    }

    if (isOrg2PurpleHighlightPerson(rawName)) {
        card.classList.add("org2-card-highlight-purple");
    }

    const initials = getInitials(rawName) || "NF";
    const photoSrc = resolveOrg2PhotoSrc(personData.foto);
    if (photoSrc) {
        const img = document.createElement("img");
        img.loading = "eager";
        img.decoding = "async";
        img.src = photoSrc;
        img.alt = rawName ? `Foto de ${rawName}` : "Foto do funcionário";
        img.onerror = () => {
            avatar.innerHTML = "";
            avatar.textContent = initials;
        };
        avatar.appendChild(img);
    } else {
        avatar.textContent = initials;
    }

    if (rawName) {
        nome.textContent = rawName;
    } else {
        nome.textContent = ORG2_NAME_PLACEHOLDER;
        nome.classList.add("is-placeholder");
    }

    const cargo = document.createElement("div");
    cargo.className = "role-tag org2-role-tag";
    cargo.textContent = displayCargo;

    let scale = null;
    if (scaleLabel) {
        scale = document.createElement("div");
        scale.className = "role-tag org2-scale-tag";
        scale.textContent = scaleLabel;
    }

    card.appendChild(avatar);
    card.appendChild(nome);
    card.appendChild(cargo);
    if (scale) {
        card.appendChild(scale);
    }

    return card;
}

function getExtraCardCopies(nodeData) {
    const cargo = normalizeLabel(nodeData.cargo);

    if (
        cargo === normalizeLabel("Jovem Aprendiz") ||
        cargo === normalizeLabel("Equipe de Jovens Aprendiz") ||
        cargo === normalizeLabel("Equipe de Jovem Aprendiz")
    ) {
        return 1;
    }

    if (cargo === normalizeLabel("Tecnicos de Suporte")) {
        return 2;
    }

    if (!Number.isFinite(nodeData.quantidade) || nodeData.quantidade <= 1) {
        return 0;
    }

    if (cargo === normalizeLabel("Operadores Diurnos")) {
        return ORG2_OPERADOR_TOTAL_CARDS - 1;
    }
    if (cargo === normalizeLabel("Operadores Noturnos")) {
        return ORG2_OPERADOR_TOTAL_CARDS - 1;
    }
    if (cargo === normalizeLabel("Auxiliares Tecnicos")) {
        return 3;
    }
    if (cargo === normalizeLabel("Tecnicos")) {
        return 3;
    }

    return 1;
}

function createCard(nodeData, extraClass = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "org2-card-wrap";
    if (isOrg2BlueHighlightCargo(nodeData.cargo)) {
        wrapper.classList.add("org2-card-highlight-blue");
    }
    const forceTitleOnly = extraClass.split(/\s+/).includes("org2-force-title-only");
    const isTitleOnly = forceTitleOnly || isTitleOnlyCargo(nodeData.cargo);
    const showCount = shouldShowCount(nodeData.cargo);

    if (showCount && Number.isFinite(nodeData.quantidade)) {
        wrapper.classList.add("has-count");
        const count = document.createElement("span");
        count.className = "org2-count";
        count.textContent = String(nodeData.quantidade);
        wrapper.appendChild(count);
    }

    const card = createCardElement(nodeData, extraClass, isTitleOnly, 0);
    wrapper.appendChild(card);

    const extraCardsCount = getExtraCardCopies(nodeData);
    if (extraCardsCount > 0) {
        wrapper.classList.add("org2-has-multi-card");
        for (let index = 0; index < extraCardsCount; index += 1) {
            const extraCard = createCardElement(nodeData, extraClass, isTitleOnly, index + 1);
            extraCard.classList.add("org2-card-secondary");

            wrapper.appendChild(extraCard);
        }
    }

    return wrapper;
}

function createNodeElement(nodeData) {
    const node = document.createElement("div");
    node.className = `node level-${nodeData.nivel}`;

    const group = document.createElement("div");
    group.className = "group-container";

    group.appendChild(createCard(nodeData));
    node.appendChild(group);

    const isSupervisorTecnicoNode =
        normalizeLabel(nodeData.cargo) === normalizeLabel("Supervisor Técnico");
    const children = Array.isArray(nodeData.filhos) ? nodeData.filhos : [];
    const childrenToRender = [];
    let detachedTecnicoShieldChild = null;

    children.forEach((child) => {
        const isTecnicoShieldChild =
            normalizeLabel(child?.cargo) === normalizeLabel("Tecnico Shield") ||
            normalizeLabel(child?.cargo) === normalizeLabel("Técnico Shield");

        if (isSupervisorTecnicoNode && isTecnicoShieldChild && !detachedTecnicoShieldChild) {
            detachedTecnicoShieldChild = child;
            return;
        }

        childrenToRender.push(child);
    });

    if (childrenToRender.length > 0) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children";
        if (nodeData.nivel === 1) {
            childrenContainer.classList.add("org2-gerencias-row");
        }
        childrenToRender.forEach((child) => {
            childrenContainer.appendChild(createNodeElement(child));
        });
        node.appendChild(childrenContainer);
    }

    if (detachedTecnicoShieldChild) {
        const shieldBranch = document.createElement("div");
        shieldBranch.className = "org2-supervisor-shield-branch";
        shieldBranch.appendChild(createCard(detachedTecnicoShieldChild, "org2-supervisor-shield-card"));
        node.appendChild(shieldBranch);
    }

    return node;
}

function renderDiretorias() {
    const topContainer = document.getElementById("org2-top-directorias");
    if (!topContainer) return;

    topContainer.innerHTML = "";
    org2Diretorias.forEach((diretoria) => {
        topContainer.appendChild(createCard(diretoria, "org2-top-card org2-force-title-only"));
    });
}

function renderOrganograma() {
    const container = document.getElementById("org2-container");
    if (!container) return;

    container.innerHTML = "";
    container.appendChild(createNodeElement(org2Estrutura));
}

function syncTopScrollMetrics() {
    if (!org2MainScroll || !org2TopScroll || !org2TopScrollInner) return;

    const totalWidth = org2MainScroll.scrollWidth;
    const viewportWidth = org2MainScroll.clientWidth;
    const hasHorizontalOverflow = totalWidth > viewportWidth + 1;

    org2TopScrollInner.style.width = `${totalWidth}px`;
    org2TopScroll.style.display = hasHorizontalOverflow ? "block" : "none";

    if (!hasHorizontalOverflow) {
        org2TopScroll.scrollLeft = 0;
        org2MainScroll.scrollLeft = 0;
        return;
    }

    org2TopScroll.scrollLeft = org2MainScroll.scrollLeft;
}

function setupTopHorizontalScroll() {
    if (!org2MainScroll || !org2TopScroll) return;

    org2TopScroll.addEventListener("scroll", () => {
        if (isSyncingOrg2Scroll) return;
        isSyncingOrg2Scroll = true;
        org2MainScroll.scrollLeft = org2TopScroll.scrollLeft;
        isSyncingOrg2Scroll = false;
    }, { passive: true });

    org2MainScroll.addEventListener("scroll", () => {
        if (isSyncingOrg2Scroll) return;
        isSyncingOrg2Scroll = true;
        org2TopScroll.scrollLeft = org2MainScroll.scrollLeft;
        isSyncingOrg2Scroll = false;
    }, { passive: true });

    window.addEventListener("resize", () => {
        refreshGerenciasAlignment();
        syncTopScrollMetrics();
    });

    window.addEventListener("load", () => {
        refreshGerenciasAlignment();
        syncTopScrollMetrics();
    });

    requestAnimationFrame(() => {
        refreshGerenciasAlignment();
        syncTopScrollMetrics();
        requestAnimationFrame(() => {
            refreshGerenciasAlignment();
            syncTopScrollMetrics();
        });
    });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            refreshGerenciasAlignment();
            syncTopScrollMetrics();
        }).catch(() => {});
    }
}

function createPdfCaptureClone(target) {
    const clone = target.cloneNode(true);
    clone.id = "dashboard-content-export-org2";
    clone.style.position = "fixed";
    clone.style.left = "-100000px";
    clone.style.top = "0";
    clone.style.width = `${target.scrollWidth}px`;
    clone.style.maxWidth = "none";
    clone.style.overflow = "visible";
    clone.style.background = "#eef1f4";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "-1";

    Array.from(clone.querySelectorAll(".org2-name-slot")).forEach((slot) => {
        slot.removeAttribute("aria-label");
    });

    Array.from(clone.querySelectorAll("img")).forEach((img) => {
        const src = (img.getAttribute("src") || img.src || "").trim();
        const safeSrc = buildOrg2PdfImageSrc(src);
        if (!safeSrc) return;
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        img.setAttribute("loading", "eager");
        img.setAttribute("decoding", "sync");
        img.src = safeSrc;
    });

    document.body.appendChild(clone);
    return clone;
}

function buildOrg2PdfImageSrc(rawSrc) {
    const src = String(rawSrc || "").trim();
    if (!src) return "";
    if (src.startsWith("data:") || src.startsWith("blob:")) return src;

    try {
        const parsed = new URL(src, window.location.origin);
        if (parsed.origin === window.location.origin) {
            return parsed.toString();
        }
        return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
    } catch {
        return src;
    }
}

async function waitForFonts(timeoutMs = 3000) {
    if (!document.fonts || !document.fonts.ready) return;

    try {
        await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, timeoutMs))
        ]);
    } catch (error) {
        console.warn("Falha ao aguardar fontes para exportacao:", error);
    }
}

async function waitForImages(container, timeoutMs = 12000) {
    if (!container) return;

    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.all(images.map((img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
        }

        let done = false;
        const finalize = () => {
            if (done) return;
            done = true;
            img.removeEventListener("load", finalize);
            img.removeEventListener("error", finalize);
            resolve();
        };

        const timer = setTimeout(finalize, timeoutMs);
        img.addEventListener("load", () => {
            clearTimeout(timer);
            finalize();
        }, { once: true });
        img.addEventListener("error", () => {
            clearTimeout(timer);
            finalize();
        }, { once: true });
    })));
}

async function exportOrganogramaPdf() {
    const target = document.getElementById("dashboard-content");
    if (!target) {
        alert("Area do organograma nao encontrada.");
        return;
    }

    const jsPdfApi = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
    if (!window.html2canvas || !jsPdfApi) {
        alert("Biblioteca de PDF indisponivel. Recarregue a pagina e tente novamente.");
        return;
    }

    const previousLabel = btnExportPdfOrg2?.innerHTML || "";
    if (btnExportPdfOrg2) {
        btnExportPdfOrg2.disabled = true;
        btnExportPdfOrg2.innerHTML = '<span class="material-icons-round">hourglass_top</span><span style="font-size:12px; font-weight:700; letter-spacing:.4px;">GERANDO</span>';
    }

    let exportTarget = null;

    try {
        await waitForFonts();
        exportTarget = createPdfCaptureClone(target);
        await waitForFonts();
        await waitForImages(exportTarget);

        const captureScale = 2;
        const canvas = await window.html2canvas(exportTarget, {
            scale: captureScale,
            useCORS: true,
            allowTaint: false,
            imageTimeout: 15000,
            width: exportTarget.scrollWidth,
            height: exportTarget.scrollHeight,
            windowWidth: exportTarget.scrollWidth,
            windowHeight: exportTarget.scrollHeight,
            backgroundColor: "#eef1f4"
        });

        const pdf = new jsPdfApi({
            orientation: "portrait",
            unit: "pt",
            format: "a4"
        });

        const margin = 20;
        const titleText = "Organograma de Cargos";
        const headerHeight = 38;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentTopPt = margin + headerHeight;
        const contentWidthPt = pageWidth - (margin * 2);
        const contentHeightPt = pageHeight - contentTopPt - margin;
        const pixelsToPt = contentWidthPt / canvas.width;
        const maxSliceHeightPx = Math.max(1, Math.floor(contentHeightPt / pixelsToPt));

        const drawPageHeader = () => {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.setTextColor(15, 23, 42);
            pdf.text(titleText, pageWidth / 2, margin + 16, { align: "center" });
            pdf.setDrawColor(203, 213, 225);
            pdf.setLineWidth(1);
            pdf.line(margin, margin + 24, pageWidth - margin, margin + 24);
        };

        const targetRect = exportTarget.getBoundingClientRect();
        const cardRanges = Array.from(exportTarget.querySelectorAll(".org2-card-wrap"))
            .map((card) => {
                const rect = card.getBoundingClientRect();
                const topPx = Math.max(0, Math.floor((rect.top - targetRect.top) * captureScale));
                const bottomPx = Math.min(canvas.height, Math.ceil((rect.bottom - targetRect.top) * captureScale));
                return { topPx, bottomPx };
            })
            .filter((range) => range.bottomPx > range.topPx)
            .sort((a, b) => a.topPx - b.topPx);

        const slices = [];
        let startY = 0;

        while (startY < canvas.height) {
            let endY = Math.min(canvas.height, startY + maxSliceHeightPx);

            if (endY < canvas.height) {
                const crossing = cardRanges.find((range) => range.topPx < endY && range.bottomPx > endY);
                if (crossing) {
                    const cutBeforeCard = crossing.topPx - 4;
                    const hasUsefulSpace = (cutBeforeCard - startY) > Math.floor(maxSliceHeightPx * 0.35);
                    if (hasUsefulSpace) {
                        endY = cutBeforeCard;
                    } else {
                        endY = Math.min(canvas.height, crossing.bottomPx + 4);
                    }
                }
            }

            if (endY <= startY) {
                endY = Math.min(canvas.height, startY + maxSliceHeightPx);
            }

            slices.push({ startY, endY });
            startY = endY;
        }

        slices.forEach((slice, index) => {
            if (index > 0) pdf.addPage();
            drawPageHeader();

            const sliceHeight = slice.endY - slice.startY;
            const pageCanvas = document.createElement("canvas");
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;
            const pageCtx = pageCanvas.getContext("2d");
            if (!pageCtx) return;

            pageCtx.drawImage(
                canvas,
                0,
                slice.startY,
                canvas.width,
                sliceHeight,
                0,
                0,
                canvas.width,
                sliceHeight
            );

            const pageImage = pageCanvas.toDataURL("image/png");
            const pageImageHeightPt = sliceHeight * pixelsToPt;
            pdf.addImage(pageImage, "PNG", margin, contentTopPt, contentWidthPt, pageImageHeightPt, undefined, "FAST");
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        pdf.save(`organograma-cargos-${timestamp}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Nao foi possivel gerar o PDF. Tente novamente.");
    } finally {
        if (exportTarget && exportTarget.parentNode) {
            exportTarget.parentNode.removeChild(exportTarget);
        }
        if (btnExportPdfOrg2) {
            btnExportPdfOrg2.disabled = false;
            btnExportPdfOrg2.innerHTML = previousLabel;
        }
    }
}

async function initializeOrg2State() {
    const payload = await loadOrg2Payload();
    org2PayloadCache = (payload && typeof payload === "object") ? payload : {};
    syncOrg2StateFromPayload(org2PayloadCache);
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeOrg2State();
    } catch (error) {
        console.warn("Falha ao inicializar dados do organograma 2:", error);
        org2PayloadCache = {};
        syncOrg2StateFromPayload(null);
    }

    renderDiretorias();
    renderOrganograma();
    setupTopHorizontalScroll();
    refreshGerenciasAlignment();

    if (btnExportPdfOrg2) {
        btnExportPdfOrg2.addEventListener("click", exportOrganogramaPdf);
    }
});
