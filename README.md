ORGANOGRAMA DA SEGURANCA ELETRONICA - BRASFORT

https://rayssenleonardo-source.github.io/Organograma/

![Logotipo_Horizontal_AzulEscuro](https://github.com/user-attachments/assets/c2b36556-9dd9-4d64-9107-f5c742b1bb84)

## Backend Python (salvamento sem baixar JSON)

### 1. Instalar dependencias
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

API padrao: `http://127.0.0.1:5000`

### 3. Como funciona no Admin
- O painel tenta conectar automaticamente em `/api`.
- Com backend ativo, o botao `Salvar no Servidor` grava direto em `dados.json`.
- Upload de foto salva arquivo em `uploads/` e grava a URL no JSON.
- Remover foto apaga o arquivo de `uploads/` (quando a foto veio do backend).

Se as variaveis do Supabase estiverem configuradas, dados e fotos passam a ser salvos no Supabase automaticamente.

### Endpoints
- `GET /api/health`
- `GET /api/dados`
- `PUT /api/dados`
- `POST /api/upload-photo` (multipart `file`)
- `DELETE /api/photo` (JSON `{ \"url\": \"...\" }`)

## Subir com Docker

### Build + up
```bash
docker compose up -d --build
```

Use `--build` sempre que alterar arquivos da interface, como `*.html`, `*.js` e `*.css`.
No `docker-compose.yml`, apenas `dados.json` e `uploads/` sao montados como volume; o restante do codigo fica dentro da imagem.

### Logs
```bash
docker compose logs -f
```

### Parar
```bash
docker compose down
```

Aplicacao: `http://localhost:5001`

- O `dados.json` e a pasta `uploads/` ficam montados do host para o container.
- Alteracoes feitas no Admin com backend ativo sao persistidas sem baixar JSON manualmente.

## Deploy no Render

Este repositório ja inclui `render.yaml` para subir como Web Service Python.

### Opcao 1 (recomendada): Blueprint
1. No Render, clique em `New +` > `Blueprint`.
2. Conecte este repositório.
3. Confirme a criacao do servico `organograma` usando o `render.yaml`.

### Opcao 2: Configuracao manual
- Runtime: `Python`
- Root Directory: `backend`
- Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120 --max-requests 500 --max-requests-jitter 50 app:app`
- Health Check Path: `/api/health`

### Variaveis de ambiente
- `FLASK_DEBUG=false`
- `DATA_FILE=/tmp/dados.json`
- `UPLOADS_DIR=/tmp/uploads`
- `SUPABASE_URL=https://SEU-PROJETO.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_DATA_TABLE=organograma_data`
- `SUPABASE_DATA_ROW_ID=main`
- `SUPABASE_STORAGE_BUCKET=organograma-uploads`
- `SUPABASE_STORAGE_PREFIX=organograma`

No plano Free do Render, o filesystem e temporario. Para persistencia real use Supabase.

## Configuracao Supabase (simples)

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

### 3. Configurar variaveis no Render
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (usar a Service Role, nao a anon)
- `SUPABASE_DATA_TABLE=organograma_data`
- `SUPABASE_DATA_ROW_ID=main`
- `SUPABASE_STORAGE_BUCKET=organograma-uploads`
- `SUPABASE_STORAGE_PREFIX=organograma` (opcional)

## Sincronizar dados do Render para o Git (simples)

Este repositorio tem o workflow `.github/workflows/sync-dados-render.yml`.

Ele busca `GET /api/dados` no servico publicado e, se houver mudanca, atualiza `dados.json` e faz commit na `main`.

### Configurar uma vez
1. No GitHub do repositorio: `Settings` > `Secrets and variables` > `Actions` > `Variables`.
2. Crie a variavel `RENDER_API_DADOS_URL` com a URL completa do endpoint, por exemplo:
   `https://SEU-SERVICO.onrender.com/api/dados`

### Rodar manualmente
1. Aba `Actions` > workflow `Sync dados.json from Render`.
2. Clique em `Run workflow`.
3. Opcional: informe `api_url` no formulario (se vazio, usa `RENDER_API_DADOS_URL`).

### Execucao automatica
- O workflow tambem roda a cada 6 horas.
