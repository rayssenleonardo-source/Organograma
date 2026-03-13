# Organograma da Segurança Eletrônica — Brasfort

https://rayssenleonardo-source.github.io/Organograma/

![Logotipo_Horizontal_AzulEscuro](https://github.com/user-attachments/assets/c2b36556-9dd9-4d64-9107-f5c742b1bb84)

## Estrutura do Projeto

```
├── frontend/              # Interface (HTML, CSS, JS)
│   ├── index.html         # Organograma principal
│   ├── organograma-2.html # Organograma de cargos
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js
│   │   └── organograma-2.js
│   └── admin/             # Painel administrativo
│       ├── login.html
│       ├── login.js
│       ├── login.css
│       ├── admin.html
│       ├── admin.js
│       ├── admin.css
│       ├── admin-org2.html
│       └── admin-org2.js
├── data/
│   └── dados.json         # Dados do organograma
├── backend/
│   ├── app.py             # API Flask
│   └── requirements.txt
├── uploads/               # Fotos enviadas
├── deploy/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── render.yaml
├── docs/
│   ├── pessoas.md
│   └── images.md
└── .github/workflows/
```

## Backend Python (salvamento sem baixar JSON)

### 1. Instalar dependências
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Rodar API
```bash
python app.py
```

API padrão: `http://127.0.0.1:5000`

### 3. Como funciona no Admin
- O painel tenta conectar automaticamente em `/api`.
- Com backend ativo, o botão `Salvar no Servidor` grava direto em `data/dados.json`.
- Upload de foto salva arquivo em `uploads/` e grava a URL no JSON.
- Remover foto apaga o arquivo de `uploads/` (quando a foto veio do backend).

Se as variáveis do Supabase estiverem configuradas, dados e fotos passam a ser salvos no Supabase automaticamente.

### Endpoints
- `GET /api/health`
- `GET /api/dados`
- `PUT /api/dados`
- `POST /api/upload-photo` (multipart `file`)
- `DELETE /api/photo` (JSON `{ "url": "..." }`)

## Subir com Docker

### Build + up
```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

Use `--build` sempre que alterar arquivos da interface, como `*.html`, `*.js` e `*.css`.
No `docker-compose.yml`, apenas `data/dados.json` e `uploads/` são montados como volume; o restante do código fica dentro da imagem.

### Logs
```bash
docker compose -f deploy/docker-compose.yml logs -f
```

### Parar
```bash
docker compose -f deploy/docker-compose.yml down
```

Aplicação: `http://localhost:5001`

## Deploy no Render

Este repositório já inclui `deploy/render.yaml` para subir como Web Service Python.

### Opção 1 (recomendada): Blueprint
1. No Render, clique em `New +` > `Blueprint`.
2. Conecte este repositório.
3. Confirme a criação do serviço `organograma` usando o `deploy/render.yaml`.

### Opção 2: Configuração manual
- Runtime: `Python`
- Root Directory: `backend`
- Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120 --max-requests 500 --max-requests-jitter 50 app:app`
- Health Check Path: `/api/health`

### Variáveis de ambiente
- `FLASK_DEBUG=false`
- `DATA_FILE=/tmp/data/dados.json`
- `UPLOADS_DIR=/tmp/uploads`
- `SUPABASE_URL=https://SEU-PROJETO.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_DATA_TABLE=organograma_data`
- `SUPABASE_DATA_ROW_ID=main`
- `SUPABASE_STORAGE_BUCKET=organograma-uploads`
- `SUPABASE_STORAGE_PREFIX=organograma`

No plano Free do Render, o filesystem é temporário. Para persistência real use Supabase.

## Configuração Supabase (simples)

### 1. Criar tabela de dados
No SQL Editor do Supabase, rode:

```sql
create table if not exists public.organograma_data (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 2. Criar bucket de fotos
- Crie um bucket chamado `organograma-uploads`
- Marque como `Public`

### 3. Configurar variáveis no Render
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (usar a Service Role, não a anon)
- `SUPABASE_DATA_TABLE=organograma_data`
- `SUPABASE_DATA_ROW_ID=main`
- `SUPABASE_STORAGE_BUCKET=organograma-uploads`
- `SUPABASE_STORAGE_PREFIX=organograma` (opcional)

## Sincronizar dados do Render para o Git (simples)

Este repositório tem o workflow `.github/workflows/sync-dados-render.yml`.

Ele busca `GET /api/dados` no serviço publicado e, se houver mudança, atualiza `data/dados.json` e faz commit na `main`.

### Configurar uma vez
1. No GitHub do repositório: `Settings` > `Secrets and variables` > `Actions` > `Variables`.
2. Crie a variável `RENDER_API_DADOS_URL` com a URL completa do endpoint, por exemplo:
   `https://SEU-SERVICO.onrender.com/api/dados`

### Rodar manualmente
1. Aba `Actions` > workflow `Sync dados.json from Render`.
2. Clique em `Run workflow`.
3. Opcional: informe `api_url` no formulário (se vazio, usa `RENDER_API_DADOS_URL`).

### Execução automática
- O workflow também roda a cada 6 horas.
