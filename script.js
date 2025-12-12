// --- DADOS DO ORGANOGRAMA ---
const orgData = {
  cargo: "Gerência",
  nomes: [
    {
      nome: "Glenda Negreiros",
      email: "glenda@brasfort.com.br",
      foto: "https://github.com/user-attachments/assets/5ecca86d-dd31-4f36-9cd2-d601f56ebba8",
      descricao:
        "<br> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    }
  ],
  nivel: 1,
  filhos: [
    {
      cargo: "Coordenação",
      nomes: [
        {
          nome: "Luciano Nascimento",
          matricula: "21467",
          foto: "https://github.com/user-attachments/assets/98982e04-790a-4fd7-be29-29217af7ca32",
          email: "luciano.nascimento@brasfort.com.br",
          telefone: "(61)98358-5726",
          nascimento: "09-07-1984",
          admissao: "01/2021",
          descricao:
            "<br> Responsável por coordenar as operações técnicas e administrativas do setor, liderando equipes, acompanhando serviços, garantindo qualidade e alinhamento com práticas de segurança, performance e eficiência.."
        }
      ],
      nivel: 2,
      filhos: [
        {
          cargo: "Administrativo",
          nomes: [
            {
              nome: "Quely Ferreira",
              matricula: "28091",
              foto: "https://github.com/user-attachments/assets/17bfd145-243e-48d5-8073-099a22277204",
              email: "quely.ferreira@brasfort.com.br",
              telefone: "(61)985631537",
              nascimento: "09-05-1972",
              admissao: "03/2021",
              descricao:
                "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
            }
          ],
          nivel: 3,
          filhos: [
            {
              cargo: "Jovem Aprendiz",
              nomes: [
                {
                  nome: "Isack Aragão",
                  foto: "https://github.com/user-attachments/assets/1b7764bc-ae95-4c67-94cc-c1975f46728c",
                  matricula: "52698",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "14-09-1999",
                  admissao: "03/2025",
                  descricao:
                    "<br>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
                },
                {
                  nome: "Davi Gadioli",
                  matricula: "001234",
                  foto: "https://github.com/user-attachments/assets/0c105ea1-3fe7-44b5-8ead-b53247698363",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "26 anos",
                  admissao: "10/03/2025",
                  descricao:
                    "<br>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
                },
                {
                  nome: "Guilherme Alexandre",
                  matricula: "53097",
                  email: "danilo.vinicius@brasfort.com",
                  foto: "https://github.com/user-attachments/assets/8593b0fc-76d4-436d-abfc-8fefa5b96a07",
                  telefone: "(61) 99999-9999",
                  nascimento: "26 anos",
                  admissao: "10/03/2025",
                  descricao:
                    "<br>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
                },
                {
                  nome: "Lucas Sales",
                  matricula: "001234",
                  foto: "https://github.com/user-attachments/assets/75b5cd83-0968-4051-b758-255d0a39fbdf",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "26 anos",
                  admissao: "10/03/2025",
                  descricao:
                    "<br>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
                }
              ],
              nivel: 5,
              filhos: []
            }
          ]
        },
        {
          cargo: "Técnico de Suporte",
          nomes: [
            {
              nome: "Rayssen Leonardo",
              matricula: "29974",
              foto: "https://github.com/user-attachments/assets/16eef1a3-8f46-4fc8-8b9c-055d4f054fb5",
              email: "rayssen.braga@brasfort.com",
              telefone: "(61) 99581-9374",
              nascimento: "06-05-2003",
              admissao: "03/2024",
              descricao:
                "<br>Responsável por atendimentos técnicos remotos e presenciais, identificando e corrigindo falhas em sistemas de segurança eletrônica. Atua de forma analítica, orientando usuários, elaborando relatórios e apoiando projetos, garantindo disponibilidade e desempenho dos sistemas.."
            }
          ],
          nivel: 3,
          filhos: [
            {
              cargo: "Técnico de Suporte",
              nomes: [
                {
                  nome: "Danilo Vinícius",
                  foto: "https://github.com/user-attachments/assets/96e7e204-d6c9-494c-8dbf-46b8f7fbdb9c",
                  matricula: "52029",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 98485-3715",
                  nascimento: "14-09-1999",
                  admissao: "03/2025",
                  descricao:
                    "<br>Responsável por atendimentos técnicos remotos e presenciais, identificando e corrigindo falhas em sistemas de segurança eletrônica. Atua de forma analítica, orientando usuários, elaborando relatórios e apoiando projetos, garantindo disponibilidade e desempenho dos sistemas.."
                },
                {
                  nome: "Quedma Paula",
                  matricula: "40312",
                  foto: "https://github.com/user-attachments/assets/da33e098-642f-4783-865b-5563594176fb",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "",
                  admissao: "10/03/2025",
                  descricao:
                    "<br>Responsável por atendimentos técnicos remotos e presenciais, identificando e corrigindo falhas em sistemas de segurança eletrônica. Atua de forma analítica, orientando usuários, elaborando relatórios e apoiando projetos, garantindo disponibilidade e desempenho dos sistemas.."
                }
              ],
              nivel: 3,
              filhos: [
                {
                  cargo: "Op. Monitoramento",
                  layout: "vertical",
                  nomes: [
                    {
                      nome: "Adriel Rego",
                      matricula: "50275",
                      foto: "https://github.com/user-attachments/assets/11c70c12-c8ed-4348-a3e4-efd93770b838",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      admissao: "10/03/2025",
                      descricao:
                        "<br>Responsável pelo monitoramento remoto de sistemas de segurança eletrônica, atendendo ocorrências, executando rondas virtuais, checklists e prestando suporte técnico e administrativo. Atua como ponto central na detecção de incidentes e resposta rápida a riscos."
                    },
                    {
                      nome: "Luis Gabriel",
                      matricula: "52290",
                      foto: "https://github.com/user-attachments/assets/c067ede5-5d77-4317-b58a-ed03349e5793",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      admissao: "10/03/2025",
                      descricao:
                        "<br>Responsável pelo monitoramento remoto de sistemas de segurança eletrônica, atendendo ocorrências, executando rondas virtuais, checklists e prestando suporte técnico e administrativo. Atua como ponto central na detecção de incidentes e resposta rápida a riscos."
                    },
                    {
                      nome: "David Alves",
                      matricula: "52102",
                      foto: "https://github.com/user-attachments/assets/7763c7c1-2630-45ed-879e-863e66c854f4",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      admissao: "10/03/2025",
                      descricao:
                        "<br>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
                    },
                    {
                      nome: "Fabricio Forte",
                      matricula: "52702",
                      foto: "https://github.com/user-attachments/assets/952337c8-42b4-4436-ae4a-f5d08cd9e33f",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      admissao: "10/03/2025",
                      descricao:
                        "<br>Responsável pelo monitoramento remoto de sistemas de segurança eletrônica, atendendo ocorrências, executando rondas virtuais, checklists e prestando suporte técnico e administrativo. Atua como ponto central na detecção de incidentes e resposta rápida a riscos."
                    }
                  ],
                  nivel: 5,
                  filhos: []
                }
              ]
            }
          ]
        },
        {
          cargo: "Técnico de Seg. Eletrônica",
          nomes: [
            {
              nome: "Silvano Rodrigues",
              matricula: "27579",
              foto: "https://github.com/user-attachments/assets/e3924039-fd1d-4056-a6f7-9e9b8d52a179",
              email: "silvano.souza@brasfort.com",
              telefone: "(61) 99666-2715",
              nascimento: "06-04-2003",
              admissao: "02/2021",
              descricao:
                "<br>Responsável por instalar, configurar e manter sistemas de segurança eletrônica, garantindo funcionamento adequado de alarmes, CFTV, cercas elétricas e controles de acesso, atuando diretamente em campo com precisão técnica e conformidade.."
            },
            {
              nome: "Thiago Alves",
              matricula: "53211",
              foto: "https://github.com/user-attachments/assets/3cfeee29-c8b6-470f-8ae0-2088fcd0febb",
              email: "naotem@brasfort.com",
              telefone: "(61) 99903-7261",
              nascimento: "29-07-1985",
              admissao: "10/2025",
              descricao:
                "<br>Responsável por instalar, configurar e manter sistemas de segurança eletrônica, garantindo funcionamento adequado de alarmes, CFTV, cercas elétricas e controles de acesso, atuando diretamente em campo com precisão técnica e conformidade.."
            }
          ],
          nivel: 3,
          filhos: [
            {
              cargo: "Auxiliar Técnico",
              layout: "vertical",
              nomes: [
                {
                  nome: "Lucas Matos",
                  matricula: "29109",
                  foto: "https://github.com/user-attachments/assets/e6d656dd-b400-4ab4-bf6f-55b2986aa197",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "26 anos",
                  admissao: "10/03/2025",
                  descricao:
                    "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                },
                {
                  nome: "Eduardo Gonçalves",
                  matricula: "52031",
                  foto: "https://github.com/user-attachments/assets/337621a5-614f-454c-9409-90fd0e5bd964",
                  email:"eduardo.goncalves@brasfort.com",
                  telefone: "(61) 98143-6487",
                  nascimento: "08-04-2003",
                  admissao: "03/2025",
                  descricao:
                    "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                },
                {
                  nome: "Cauã Carvalho",
                  matricula: "53176",
                  foto: "https://github.com/user-attachments/assets/1f9adacc-43fc-489c-ab89-5dfe2416c35e",
                  email: "caua.oliveira@brasfort.com.br",
                  telefone: "(61) 98214-8361",
                  nascimento: "16-10-2003",
                  admissao: "10/2025",
                  descricao:
                    "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                },
              ],
              nivel: 4,
              filhos: [
                {
                  cargo: "Auxiliar Técnico (Intermitente)",
                  layout: "vertical",
                  nomes: [
                    {
                  nome: "Atila Gabriel",
                  matricula: "001234",
                  foto: "https://github.com/user-attachments/assets/2e4c3c8c-9729-4a5d-b95d-34a59a017f5a",
                  email: "danilo.vinicius@brasfort.com",
                  telefone: "(61) 99999-9999",
                  nascimento: "26 anos",
                  descricao:
                    "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                }, 
                    {
                      nome: "Matheus Guerra",
                      matricula: "52597",
                      foto: "https://github.com/user-attachments/assets/1e911aef-c71e-4a84-a844-a739bbd5c6c5",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      descricao:
                        "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                    },
                    {
                      nome: "Vinicius Borges",
                      matricula: "001234",
                      foto: "https://github.com/user-attachments/assets/e9038a7d-dccb-4025-a41b-fd29594982e3",
                      email: "danilo.vinicius@brasfort.com",
                      telefone: "(61) 99999-9999",
                      nascimento: "26 anos",
                      descricao:
                        "<br>Responsável por oferecer suporte administrativo às operações do setor de segurança eletrônica, organizando documentos, acompanhando ordens de serviço, auxiliando na gestão de estoque técnico e prestando atendimento aos clientes e à equipe de campo, com foco em agilidade, organização e conformidade."
                    }
                  ],
                  nivel: 4,
                  filhos: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// --- UTILITÁRIOS ---
function getInitials(name) {
  if (typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

// --- LÓGICA DO MODAL ---
const modalOverlay = document.getElementById('profile-modal');
const closeModalBtn = document.querySelector('.close-btn');

// Elementos internos do modal para preencher
const modalAvatar = document.getElementById('modal-avatar');
const modalName = document.getElementById('modal-name');
const modalRole = document.getElementById('modal-role');
const modalBody = document.getElementById('modal-body');

function openModal(pessoaDados, cargoTitulo) {
    // 1. Limpa dados anteriores
    modalBody.innerHTML = '';
    modalAvatar.innerHTML = '';

    // 2. Preenche Cabeçalho
    modalName.innerText = pessoaDados.nome;
    modalRole.innerText = cargoTitulo;

    // 3. Preenche Avatar (Foto ou Iniciais)
    if (pessoaDados.foto) {
        const img = document.createElement('img');
        img.src = pessoaDados.foto;
        img.onerror = () => { modalAvatar.innerText = getInitials(pessoaDados.nome); };
        modalAvatar.appendChild(img);
    } else {
        modalAvatar.innerText = getInitials(pessoaDados.nome);
    }

    // 4. Preenche Corpo (Informações extras)
    // Lista de campos que queremos exibir se existirem
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
        if (pessoaDados[campo.key]) {
            hasInfo = true;
            const row = document.createElement('div');
            row.className = 'info-row';
            row.innerHTML = `<span class="info-label">${campo.label}</span> <span class="info-value">${pessoaDados[campo.key]}</span>`;
            modalBody.appendChild(row);
        }
    });

    if (!hasInfo) {
        modalBody.innerHTML = '<p style="color:#999; font-style:italic;">Nenhuma informação adicional cadastrada.</p>';
    }

    // 5. Mostra o Modal
    modalOverlay.classList.add('active');
}

// Fechar Modal
function closeModal() {
    modalOverlay.classList.remove('active');
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal(); // Fecha se clicar fora
});

// --- RENDERIZAÇÃO DO ORGANOGRAMA ---
function createNodeElement(data) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `node level-${data.nivel}`;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-container';
    if (data.layout === "vertical") groupDiv.classList.add("vertical-layout");

    if (data.nomes && data.nomes.length > 0) {
        data.nomes.forEach(pessoa => {
            // Normaliza dados (string vira objeto)
            let dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };

            const card = document.createElement('div');
            card.className = 'card';

            // Avatar Mini
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
            roleEl.innerText = data.cargo;

            card.appendChild(avatarMini);
            card.appendChild(nameEl);
            card.appendChild(roleEl);

            // CLIQUE NO CARTÃO -> ABRE O MODAL
            card.addEventListener('click', () => openModal(dados, data.cargo));

            groupDiv.appendChild(card);
        });
    }

    nodeDiv.appendChild(groupDiv);

 if (Array.isArray(data.filhos) && data.filhos.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'children';

    // Marca quando só existe 1 filho
    if (data.filhos.length === 1) {
        childrenContainer.classList.add('single-child');
    }

    data.filhos.forEach(filho => {
        if (!filho || typeof filho !== "object") return;

        const childEl = createNodeElement(filho);
        if (childEl instanceof Node) {
            childrenContainer.appendChild(childEl);
        }
    });

    nodeDiv.appendChild(childrenContainer);
}
    return nodeDiv;
}

const container = document.getElementById('org-container');
if (container) {
    container.innerHTML = '';
    container.appendChild(createNodeElement(orgData));
}

// --- LÓGICA DO SPLASH SCREEN ---
document.addEventListener("DOMContentLoaded", () => {
    // Define o tempo de espera (3000 milissegundos = 3 segundos)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            // Adiciona a classe que faz o fade-out (sumir)
            splash.classList.add('hidden');
            
            // (Opcional) Remove o elemento do HTML totalmente após a transição
            setTimeout(() => {
                splash.remove();
            }, 1000); // Espera o tempo da transição CSS (0.8s) terminar
        }
    }, 3000);
});
