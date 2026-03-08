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
                    nivel: 3,
                    cargo: "Gestão de Segurança Eletrônica",
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
                                                { nivel: 5, cargo: "Operadores Diurnos", quantidade: 4 },
                                                { nivel: 5, cargo: "Operadores Noturnos", quantidade: 4 }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            nivel: 4,
                            cargo: "Central Técnica",
                            filhos: [
                                {
                                    nivel: 5,
                                    cargo: "Instalação e Manutenção",
                                    filhos: [
                                        {
                                            nivel: 5,
                                            cargo: "Supervisor Técnico",
                                            filhos: [
                                                {
                                                    nivel: 5,
                                                    cargo: "Tecnicos",
                                                    quantidade: 4,
                                                    filhos: [
                                                        {
                                                            nivel: 5,
                                                            cargo: "Auxiliares Tecnicos",
                                                            quantidade: 4,
                                                            filhos: [
                                                                { nivel: 5, cargo: "Tec. Shield" }
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
                                                                { nivel: 5, cargo: "Suporte Shield" }
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
                                                { nivel: 5, cargo: "Equipe de Jovens Aprendiz" }
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
}

function ensureNodeNames(nodeData) {
    if (!Array.isArray(nodeData.nomes)) {
        nodeData.nomes = [];
    }
    return nodeData.nomes;
}

function getNodeName(nodeData, nameIndex) {
    const names = ensureNodeNames(nodeData);
    const value = names[nameIndex];
    return typeof value === "string" ? value : "";
}

function setNodeName(nodeData, nameIndex, rawValue) {
    const names = ensureNodeNames(nodeData);
    names[nameIndex] = rawValue;

    while (names.length > 0) {
        const lastValue = String(names[names.length - 1] || "").trim();
        if (lastValue) break;
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
        "Gestão de Segurança Eletrônica",
        "Central de Monitoramento",
        "Central Técnica",
        "Tecnologia",
        "Apoio e Logística",
        "Operação de Monitoramento",
        "Instalação e Manutenção",
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
    const titles = Array.from(document.querySelectorAll(".org2-card h3"));
    const match = titles.find((el) => normalizeLabel(el.textContent) === target);
    return match ? match.closest(".org2-card") : null;
}

function alignGerenciaOperacionalWithMonitoramento() {
    const gerenciaCard = findNodeCardByLabel("Gerencia Operacional");
    const monitoramentoCard = findNodeCardByLabel("Central de Monitoramento");

    if (!gerenciaCard || !monitoramentoCard) return;

    const gerenciaNode = gerenciaCard.closest(".node");
    if (!gerenciaNode) return;

    gerenciaNode.style.transform = "";

    const gerenciaRect = gerenciaCard.getBoundingClientRect();
    const monitoramentoRect = monitoramentoCard.getBoundingClientRect();

    const gerenciaCenter = gerenciaRect.left + (gerenciaRect.width / 2);
    const monitoramentoCenter = monitoramentoRect.left + (monitoramentoRect.width / 2);
    const delta = Math.round(monitoramentoCenter - gerenciaCenter);

    gerenciaNode.style.transform = `translateX(${delta}px)`;
}

function alignGerenciaComercialWithApoioLogistica() {
    const gerenciaCard = findNodeCardByLabel("Gerencia Comercial");
    const apoioCard = findNodeCardByLabel("Apoio e Logistica");

    if (!gerenciaCard || !apoioCard) return;

    const gerenciaNode = gerenciaCard.closest(".node");
    if (!gerenciaNode) return;

    gerenciaNode.style.transform = "";

    const gerenciaRect = gerenciaCard.getBoundingClientRect();
    const apoioRect = apoioCard.getBoundingClientRect();

    const gerenciaCenter = gerenciaRect.left + (gerenciaRect.width / 2);
    const apoioCenter = apoioRect.left + (apoioRect.width / 2);
    const delta = Math.round(apoioCenter - gerenciaCenter);

    gerenciaNode.style.transform = `translateX(${delta}px)`;
}

function alignShieldWithGerenciaOperacional() {
    const group = document.querySelector(".group-container.org2-gestao-with-shield");
    const shieldWrap = group ? group.querySelector(".org2-card-wrap.org2-floating-shield") : null;
    const shieldCard = shieldWrap ? shieldWrap.querySelector(".org2-card") : null;
    const gestaoCard = findNodeCardByLabel("Gestao de Seguranca Eletronica");
    const gerenciaCard = findNodeCardByLabel("Gerencia Operacional");

    if (!group || !shieldWrap || !shieldCard || !gestaoCard || !gerenciaCard) return;

    shieldWrap.style.transform = "";
    shieldWrap.style.right = "auto";

    const groupRect = group.getBoundingClientRect();
    const shieldRectBase = shieldCard.getBoundingClientRect();
    const gerenciaRect = gerenciaCard.getBoundingClientRect();
    const gestaoRect = gestaoCard.getBoundingClientRect();

    const targetCenterX = gerenciaRect.left + (gerenciaRect.width / 2);
    let targetLeft = Math.round(targetCenterX - groupRect.left - (shieldRectBase.width / 2));

    // Mantem o Shield a esquerda do card de Gestao, sem sobrepor.
    const maxLeftBeforeGestao = Math.round((gestaoRect.left - groupRect.left) - shieldRectBase.width - 24);
    targetLeft = Math.min(targetLeft, maxLeftBeforeGestao);

    shieldWrap.style.left = `${targetLeft}px`;

    let connector = group.querySelector(".org2-shield-link");
    if (!connector) {
        connector = document.createElement("span");
        connector.className = "org2-shield-link";
        connector.setAttribute("aria-hidden", "true");
        group.appendChild(connector);
    }

    const shieldRect = shieldCard.getBoundingClientRect();
    const startX = shieldRect.right - groupRect.left;
    const startY = (shieldRect.top + (shieldRect.height / 2)) - groupRect.top;
    const endX = gestaoRect.left - groupRect.left;
    const endY = (gestaoRect.top + (gestaoRect.height / 2)) - groupRect.top;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    connector.style.left = `${startX}px`;
    connector.style.top = `${startY}px`;
    connector.style.width = `${Math.round(length)}px`;
    connector.style.transform = `translateY(-50%) rotate(${angle}deg)`;
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
    const tecShieldCard = findNodeCardByLabel("Tec. Shield");
    const suporteShieldCard = findNodeCardByLabel("Suporte Shield");

    if (!layout || !shieldCard || !tecShieldCard || !suporteShieldCard) {
        removeShieldNetworkLayer();
        return;
    }

    const layer = getOrCreateShieldNetworkLayer();
    if (!layer) return;
    layer.innerHTML = "";

    const layoutRect = layout.getBoundingClientRect();
    const shieldRect = shieldCard.getBoundingClientRect();
    const tecRect = tecShieldCard.getBoundingClientRect();
    const suporteRect = suporteShieldCard.getBoundingClientRect();

    const shieldLeftX = shieldRect.left - layoutRect.left;
    const shieldCenterY = (shieldRect.top + (shieldRect.height / 2)) - layoutRect.top;

    const tecLeftX = tecRect.left - layoutRect.left;
    const tecCenterX = (tecRect.left + (tecRect.width / 2)) - layoutRect.left;
    const tecBottomY = tecRect.bottom - layoutRect.top;
    const tecBranchY = tecBottomY + 14;

    const suporteLeftX = suporteRect.left - layoutRect.left;
    const suporteCenterX = (suporteRect.left + (suporteRect.width / 2)) - layoutRect.left;
    const suporteBottomY = suporteRect.bottom - layoutRect.top;
    const suporteBranchY = tecBranchY;

    // Afasta a espinha lateral para nao encostar nos cards da coluna de monitoramento.
    const trunkX = Math.max(10, Math.round(Math.min(shieldLeftX, tecLeftX, suporteLeftX) - 150));
    const trunkTopY = Math.round(Math.min(shieldCenterY, tecBranchY, suporteBranchY));
    const trunkBottomY = Math.round(Math.max(shieldCenterY, tecBranchY, suporteBranchY));

    drawShieldHorizontalSegment(layer, "shield-to-trunk", shieldLeftX, trunkX, shieldCenterY);
    drawShieldVerticalSegment(layer, "trunk", trunkX, trunkTopY, trunkBottomY);

    // Os dois conectores entram por baixo dos cards.
    drawShieldHorizontalSegment(layer, "trunk-to-tec-branch", trunkX, tecCenterX, tecBranchY);
    drawShieldVerticalSegment(layer, "tec-branch-up", tecCenterX, tecBranchY, tecBottomY);

    drawShieldHorizontalSegment(layer, "trunk-to-suporte-branch", trunkX, suporteCenterX, suporteBranchY);
    drawShieldVerticalSegment(layer, "suporte-branch-up", suporteCenterX, suporteBranchY, suporteBottomY);
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
}

function refreshGerenciasAlignment() {
    alignGerenciaOperacionalWithMonitoramento();
    alignGerenciaComercialWithApoioLogistica();
    alignShieldWithGerenciaOperacional();
    updateShieldDownstreamConnectors();
    updateGerenciasTopConnector();
}

function createCardElement(nodeData, extraClass, isTitleOnly, nameIndex = 0) {
    const card = document.createElement("article");
    card.className = `card org2-card ${extraClass}`.trim();
    if (isTitleOnly) {
        card.classList.add("org2-title-only-card");
    }

    const cargo = document.createElement("h3");
    cargo.textContent = nodeData.cargo;
    card.appendChild(cargo);

    if (!isTitleOnly) {
        const nome = document.createElement("div");
        nome.className = "org2-name-slot";
        nome.setAttribute("contenteditable", "true");
        nome.setAttribute("role", "textbox");
        nome.setAttribute("aria-label", `Nome para ${nodeData.cargo}`);
        nome.textContent = getNodeName(nodeData, nameIndex);

        const commitValue = () => {
            const safeValue = String(nome.innerText || "")
                .replace(/\s+/g, " ")
                .trim();

            if (nome.textContent !== safeValue) {
                nome.textContent = safeValue;
            }

            setNodeName(nodeData, nameIndex, safeValue);
            scheduleOrg2Save();
        };

        nome.addEventListener("input", commitValue);
        nome.addEventListener("blur", commitValue);
        card.appendChild(nome);
    }

    return card;
}

function getExtraCardCopies(nodeData) {
    if (!Number.isFinite(nodeData.quantidade) || nodeData.quantidade <= 1) {
        return 0;
    }

    const cargo = normalizeLabel(nodeData.cargo);
    if (cargo === normalizeLabel("Operadores Diurnos")) {
        return 3;
    }
    if (cargo === normalizeLabel("Operadores Noturnos")) {
        return 3;
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
    const isTitleOnly = isTitleOnlyCargo(nodeData.cargo);
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

            const extraNameSlot = extraCard.querySelector(".org2-name-slot");
            if (extraNameSlot) {
                extraNameSlot.setAttribute("aria-label", `Nome adicional ${index + 1} para ${nodeData.cargo}`);
            }

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

    const isGestaoSeguranca =
        normalizeLabel(nodeData.cargo) === normalizeLabel("Gestao de Seguranca Eletronica");

    if (isGestaoSeguranca) {
        group.classList.add("org2-gestao-with-shield");
        const shieldCard = createCard({ cargo: "Shield", nivel: nodeData.nivel }, "org2-shield-card");
        shieldCard.classList.add("org2-floating-shield");
        group.appendChild(shieldCard);
    }

    group.appendChild(createCard(nodeData));
    node.appendChild(group);

    const children = Array.isArray(nodeData.filhos) ? nodeData.filhos : [];
    if (children.length > 0) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children";
        if (nodeData.nivel === 1) {
            childrenContainer.classList.add("org2-gerencias-row");
        }
        children.forEach((child) => {
            childrenContainer.appendChild(createNodeElement(child));
        });
        node.appendChild(childrenContainer);
    }

    return node;
}

function renderDiretorias() {
    const topContainer = document.getElementById("org2-top-directorias");
    if (!topContainer) return;

    topContainer.innerHTML = "";
    org2Diretorias.forEach((diretoria) => {
        topContainer.appendChild(createCard(diretoria, "org2-top-card"));
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

    requestAnimationFrame(() => {
        refreshGerenciasAlignment();
        syncTopScrollMetrics();
        requestAnimationFrame(() => {
            refreshGerenciasAlignment();
            syncTopScrollMetrics();
        });
    });
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
        slot.removeAttribute("contenteditable");
        slot.removeAttribute("role");
        slot.removeAttribute("aria-label");
    });

    document.body.appendChild(clone);
    return clone;
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
