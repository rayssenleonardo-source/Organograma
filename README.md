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

### Logs
```bash
docker compose logs -f
```

### Parar
```bash
docker compose down
```

Aplicacao: `http://localhost:5000`

- O `dados.json` e a pasta `uploads/` ficam montados do host para o container.
- Alteracoes feitas no Admin com backend ativo sao persistidas sem baixar JSON manualmente.
