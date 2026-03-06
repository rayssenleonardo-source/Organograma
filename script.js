


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
        const img = createCardImage(pessoaDados.foto, () => {
            modalAvatar.innerText = getInitials(pessoaDados.nome);
        });
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




function createNodeElement(data) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `node level-${data.nivel}`;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-container';
    const cargoNormalizado = String(data.cargo || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    const isAuxiliarTecnico = cargoNormalizado === 'auxiliar tecnico';
    if (data.layout === "vertical" || isAuxiliarTecnico) {
        groupDiv.classList.add("vertical-layout");
    }

    const appendPersonCard = (pessoa, target) => {
        const dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };
        const card = document.createElement('div');
        card.className = 'card';

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
        roleEl.innerText = data.cargo;

        card.appendChild(avatarMini);
        card.appendChild(nameEl);
        card.appendChild(roleEl);
        card.addEventListener('click', () => openModal(dados, data.cargo));
        target.appendChild(card);
    };

    if (data.cargo === 'Op. Monitoramento' && Array.isArray(data.nomes) && data.nomes.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitoramento-columns monitoramento-turnos';

        const colManha = document.createElement('div');
        colManha.className = 'monitoramento-col';
        colManha.innerHTML = '<h4>Operadores - Dia</h4>';

        const colNoite = document.createElement('div');
        colNoite.className = 'monitoramento-col';
        colNoite.innerHTML = '<h4>Operadores - Noite</h4>';

        data.nomes.forEach((pessoa, index) => {
            const dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };
            const turno = String(dados.turno || '').trim().toLowerCase();
            const isNoite = turno.includes('noite');
            if (!turno) {
                appendPersonCard(dados, index % 2 === 0 ? colManha : colNoite);
                return;
            }
            appendPersonCard(dados, isNoite ? colNoite : colManha);
        });

        wrapper.appendChild(colManha);
        wrapper.appendChild(colNoite);
        groupDiv.appendChild(wrapper);
    } else if (data.cargo === 'Técnico de Suporte' && Array.isArray(data.nomes) && data.nomes.length > 1) {
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
        data.nomes.forEach(pessoa => {
            appendPersonCard(pessoa, groupDiv);
        });
    }
    nodeDiv.appendChild(groupDiv);

    if (Array.isArray(data.filhos) && data.filhos.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        if (data.filhos.length === 1) childrenContainer.classList.add('single-child');
        
        data.filhos.forEach(filho => {
            if (!filho || typeof filho !== "object") return;
            const childEl = createNodeElement(filho);
            if (childEl instanceof Node) childrenContainer.appendChild(childEl);
        });
        nodeDiv.appendChild(childrenContainer);
    }
    return nodeDiv;
}




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

        if (mainContainer && arvorePrincipal) {
            mainContainer.innerHTML = '';
            mainContainer.appendChild(createNodeElement(arvorePrincipal));
        }

        if (data.apoio) {
            renderSupportGroups(data.apoio);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar o JSON:', error);
        if (mainContainer) mainContainer.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar dados.</p>';
    });




document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.remove(), 1000);
        }
    }, 3000);
});

const btnExportPdf = document.getElementById('btn-export-pdf');
const btnAdmin = document.getElementById('btn-admin-access');
let imageProxyAvailable = null;

function isHttpUrl(value) {
    try {
        const parsed = new URL(value, window.location.href);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function isExternalUrl(value) {
    if (!isHttpUrl(value)) return false;
    const parsed = new URL(value, window.location.href);
    return parsed.origin !== window.location.origin;
}

async function canUseImageProxy() {
    if (imageProxyAvailable !== null) return imageProxyAvailable;

    try {
        const response = await fetchWithTimeout('/api/health', 1200);
        imageProxyAvailable = response.ok;
    } catch (error) {
        imageProxyAvailable = false;
    }

    return imageProxyAvailable;
}

function createPdfCaptureClone(target, useProxy) {
    const clone = target.cloneNode(true);
    clone.id = 'dashboard-content-export';
    clone.style.position = 'fixed';
    clone.style.left = '-100000px';
    clone.style.top = '0';
    clone.style.width = `${target.scrollWidth}px`;
    clone.style.maxWidth = 'none';
    clone.style.overflow = 'visible';
    clone.style.background = '#eef1f4';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);

    if (!useProxy) return clone;

    Array.from(clone.querySelectorAll('img')).forEach((img) => {
        const rawSrc = img.getAttribute('src') || '';
        if (!rawSrc || rawSrc.startsWith('data:') || !isExternalUrl(rawSrc)) return;
        const absoluteSrc = new URL(rawSrc, window.location.href).href;
        img.src = `/api/image-proxy?url=${encodeURIComponent(absoluteSrc)}`;
    });

    return clone;
}

async function waitForImages(scope, timeoutMs = 15000) {
    const images = Array.from(scope.querySelectorAll('img'));
    await Promise.all(images.map((img) => new Promise((resolve) => {
        if (img.complete) {
            resolve();
            return;
        }

        const timer = setTimeout(resolve, timeoutMs);
        const done = () => {
            clearTimeout(timer);
            resolve();
        };

        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
    })));
}

async function exportOrganogramaPdf() {
    const target = document.getElementById('dashboard-content');
    if (!target) {
        alert('Area do organograma nao encontrada.');
        return;
    }

    const jsPdfApi = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
    if (!window.html2canvas || !jsPdfApi) {
        alert('Biblioteca de PDF indisponivel. Recarregue a pagina e tente novamente.');
        return;
    }

    const previousLabel = btnExportPdf?.innerHTML || '';
    if (btnExportPdf) {
        btnExportPdf.disabled = true;
        btnExportPdf.innerHTML = '<span class="material-icons-round">hourglass_top</span><span style="font-size:12px; font-weight:700; letter-spacing:.4px;">GERANDO</span>';
    }

    let exportTarget = null;

    try {
        const shouldProxyImages = await canUseImageProxy();
        exportTarget = createPdfCaptureClone(target, shouldProxyImages);
        await waitForImages(exportTarget, 15000);

        const cards = Array.from(exportTarget.querySelectorAll('.card'));

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
            backgroundColor: '#eef1f4'
        });

        const pdf = new jsPdfApi({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const margin = 20;
        const titleText = 'Organograma Segurança eletronica';
        const headerHeight = 38;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentTopPt = margin + headerHeight;
        const contentWidthPt = pageWidth - (margin * 2);
        const contentHeightPt = pageHeight - contentTopPt - margin;
        const pixelsToPt = contentWidthPt / canvas.width;
        const maxSliceHeightPx = Math.max(1, Math.floor(contentHeightPt / pixelsToPt));

        const drawPageHeader = () => {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.setTextColor(15, 23, 42);
            pdf.text(titleText, pageWidth / 2, margin + 16, { align: 'center' });
            pdf.setDrawColor(203, 213, 225);
            pdf.setLineWidth(1);
            pdf.line(margin, margin + 24, pageWidth - margin, margin + 24);
        };

        const targetRect = exportTarget.getBoundingClientRect();
        const cardRanges = cards
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
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;
            const pageCtx = pageCanvas.getContext('2d');
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

            const pageImage = pageCanvas.toDataURL('image/png');
            const pageImageHeightPt = sliceHeight * pixelsToPt;
            pdf.addImage(pageImage, 'PNG', margin, contentTopPt, contentWidthPt, pageImageHeightPt, undefined, 'FAST');
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        pdf.save(`organograma-${timestamp}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Nao foi possivel gerar o PDF. Tente novamente.');
    } finally {
        if (exportTarget && exportTarget.parentNode) {
            exportTarget.parentNode.removeChild(exportTarget);
        }
        if (btnExportPdf) {
            btnExportPdf.disabled = false;
            btnExportPdf.innerHTML = previousLabel;
        }
    }
}

if (btnExportPdf) {
    btnExportPdf.addEventListener('click', exportOrganogramaPdf);
}

if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        window.location.href = "Admin/login.html";
    });
}
