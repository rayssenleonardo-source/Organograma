"""Backend API para persistir dados do organograma."""

from __future__ import annotations

import base64
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from functools import wraps

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
DEFAULT_DATA_FILE = ROOT_DIR / "data" / "dados.json"
DATA_FILE = Path(os.getenv("DATA_FILE", str(DEFAULT_DATA_FILE))).expanduser()
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(ROOT_DIR / "uploads"))).expanduser()

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "minha-senha-super-secreta")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_DATA_TABLE = os.getenv("SUPABASE_DATA_TABLE", "organograma_data").strip() or "organograma_data"
SUPABASE_DATA_ROW_ID = os.getenv("SUPABASE_DATA_ROW_ID", "main").strip() or "main"
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "").strip()
SUPABASE_STORAGE_PREFIX = os.getenv("SUPABASE_STORAGE_PREFIX", "organograma").strip("/")

USE_SUPABASE_DATA = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
USE_SUPABASE_STORAGE = USE_SUPABASE_DATA and bool(SUPABASE_STORAGE_BUCKET)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_REPO = os.getenv("GITHUB_REPO", "").strip()
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main").strip() or "main"
GITHUB_DATA_PATH = os.getenv("GITHUB_DATA_PATH", "dados.json").strip().strip("/")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE", "https://api.github.com").strip().rstrip("/")
GITHUB_COMMITTER_NAME = os.getenv("GITHUB_COMMITTER_NAME", "").strip()
GITHUB_COMMITTER_EMAIL = os.getenv("GITHUB_COMMITTER_EMAIL", "").strip()
GITHUB_COMMIT_MESSAGE_PREFIX = (
    os.getenv("GITHUB_COMMIT_MESSAGE_PREFIX", "chore(data): atualiza dados.json via API").strip()
    or "chore(data): atualiza dados.json via API"
)

USE_GITHUB_SYNC = bool(GITHUB_TOKEN and GITHUB_REPO and GITHUB_DATA_PATH)

ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
}
IMAGE_PROXY_MAX_BYTES = int(os.getenv("IMAGE_PROXY_MAX_BYTES", str(12 * 1024 * 1024)))

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024


def default_payload() -> dict:
    if DEFAULT_DATA_FILE.exists():
        try:
            with DEFAULT_DATA_FILE.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            if isinstance(payload, dict):
                return payload
        except Exception:
            pass

    return {
        "principal": {"cargo": "Organograma", "nomes": [], "filhos": []},
        "apoio": [],
    }


def supabase_headers(extra: dict | None = None) -> dict:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    if extra:
        headers.update(extra)
    return headers


def supabase_request(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json_payload: object | None = None,
    data: bytes | None = None,
    extra_headers: dict | None = None,
    timeout: int = 10,
) -> requests.Response:
    if not USE_SUPABASE_DATA:
        raise RuntimeError("Supabase nao configurado.")

    url = f"{SUPABASE_URL}{path}"
    headers = supabase_headers(extra_headers)
    return requests.request(
        method=method,
        url=url,
        params=params,
        json=json_payload,
        data=data,
        headers=headers,
        timeout=timeout,
    )


def supabase_read_data() -> dict:
    response = supabase_request(
        "GET",
        f"/rest/v1/{SUPABASE_DATA_TABLE}",
        params={
            "select": "payload",
            "id": f"eq.{SUPABASE_DATA_ROW_ID}",
            "limit": "1",
        },
        timeout=10,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao ler dados no Supabase: HTTP {response.status_code}")

    rows = response.json()
    if not rows:
        raise FileNotFoundError("Registro de dados nao encontrado no Supabase.")

    payload = rows[0].get("payload")
    if not isinstance(payload, dict):
        raise RuntimeError("Payload invalido no Supabase.")

    return payload


def supabase_write_data(payload: dict) -> None:
    response = supabase_request(
        "POST",
        f"/rest/v1/{SUPABASE_DATA_TABLE}",
        params={"on_conflict": "id"},
        json_payload=[{"id": SUPABASE_DATA_ROW_ID, "payload": payload}],
        extra_headers={
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        timeout=10,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao gravar dados no Supabase: HTTP {response.status_code}")


def serialize_payload(payload: dict) -> str:
    return f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n"


def github_headers(extra: dict | None = None) -> dict:
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "organograma-backend",
    }
    if extra:
        headers.update(extra)
    return headers


def github_request(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json_payload: object | None = None,
    timeout: int = 15,
) -> requests.Response:
    if not USE_GITHUB_SYNC:
        raise RuntimeError("Sincronizacao com GitHub nao configurada.")

    url = f"{GITHUB_API_BASE}{path}"
    return requests.request(
        method=method,
        url=url,
        params=params,
        json=json_payload,
        headers=github_headers(),
        timeout=timeout,
    )


def github_fetch_file_state() -> tuple[str | None, str | None]:
    response = github_request(
        "GET",
        f"/repos/{GITHUB_REPO}/contents/{GITHUB_DATA_PATH}",
        params={"ref": GITHUB_BRANCH},
        timeout=15,
    )

    if response.status_code == 404:
        return None, None
    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao ler arquivo no GitHub: HTTP {response.status_code}")

    body = response.json()
    sha = body.get("sha")
    raw_content = body.get("content")
    if raw_content is None:
        return sha, None
    if not isinstance(raw_content, str):
        raise RuntimeError("Conteudo invalido retornado pelo GitHub.")

    try:
        decoded = base64.b64decode(raw_content.encode("utf-8"), validate=False).decode("utf-8")
    except Exception as error:
        raise RuntimeError(f"Falha ao decodificar conteudo no GitHub: {error}") from error

    return sha, decoded


def build_github_commit_message() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    return f"{GITHUB_COMMIT_MESSAGE_PREFIX} ({timestamp})"


def github_put_file(serialized_payload: str, file_sha: str | None) -> requests.Response:
    encoded_content = base64.b64encode(serialized_payload.encode("utf-8")).decode("ascii")
    body: dict[str, object] = {
        "message": build_github_commit_message(),
        "content": encoded_content,
        "branch": GITHUB_BRANCH,
    }
    if file_sha:
        body["sha"] = file_sha
    if GITHUB_COMMITTER_NAME and GITHUB_COMMITTER_EMAIL:
        body["committer"] = {
            "name": GITHUB_COMMITTER_NAME,
            "email": GITHUB_COMMITTER_EMAIL,
        }

    return github_request(
        "PUT",
        f"/repos/{GITHUB_REPO}/contents/{GITHUB_DATA_PATH}",
        json_payload=body,
        timeout=20,
    )


def sync_payload_to_github(payload: dict) -> tuple[bool, str]:
    if not USE_GITHUB_SYNC:
        return True, "disabled"

    serialized_payload = serialize_payload(payload)
    remote_sha, remote_content = github_fetch_file_state()

    if remote_content == serialized_payload:
        return True, "unchanged"

    response = github_put_file(serialized_payload, remote_sha)
    if response.status_code in {200, 201}:
        return True, "updated"

    # SHA pode ficar desatualizado se houver atualizacao concorrente; tenta uma nova vez.
    if response.status_code == 409:
        remote_sha, remote_content = github_fetch_file_state()
        if remote_content == serialized_payload:
            return True, "unchanged"
        retry_response = github_put_file(serialized_payload, remote_sha)
        if retry_response.status_code in {200, 201}:
            return True, "updated"
        raise RuntimeError(
            f"Falha ao sincronizar com GitHub: HTTP {retry_response.status_code}"
        )

    raise RuntimeError(f"Falha ao sincronizar com GitHub: HTTP {response.status_code}")


def initialize_storage() -> None:
    if not USE_SUPABASE_STORAGE:
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    if USE_SUPABASE_DATA:
        try:
            supabase_read_data()
        except FileNotFoundError:
            supabase_write_data(default_payload())
        return

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    if DATA_FILE.exists():
        return

    if DEFAULT_DATA_FILE.exists():
        DATA_FILE.write_text(DEFAULT_DATA_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(default_payload(), handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def read_data() -> dict:
    if USE_SUPABASE_DATA:
        return supabase_read_data()

    with DATA_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_data_atomic(payload: dict) -> None:
    if USE_SUPABASE_DATA:
        supabase_write_data(payload)
        return

    # Em bind mount de arquivo único (./dados.json:/app/dados.json), usar rename
    # pode "descolar" o arquivo do host. Escrita direta mantém sincronismo.
    serialized_payload = serialize_payload(payload)
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        handle.write(serialized_payload)


def normalize_local_upload_url(raw_url: str) -> Path:
    parsed = urlparse(raw_url)
    clean_path = unquote(parsed.path or "")

    if not clean_path.startswith("/uploads/"):
        raise ValueError("A URL precisa apontar para /uploads/.")

    upload_relative_path = clean_path.removeprefix("/uploads/")
    target = (UPLOADS_DIR / upload_relative_path).resolve()
    uploads_root = UPLOADS_DIR.resolve()

    if target == uploads_root or uploads_root not in target.parents:
        raise ValueError("Caminho de upload invalido.")

    return target


def normalize_supabase_upload_path(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    clean_path = unquote(parsed.path or "")
    supabase_host = urlparse(SUPABASE_URL).netloc

    if parsed.netloc and parsed.netloc != supabase_host:
        raise ValueError("A URL nao pertence ao Supabase configurado.")

    prefix = f"/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/"
    if not clean_path.startswith(prefix):
        raise ValueError("A URL precisa apontar para o bucket publico configurado.")

    object_path = clean_path.removeprefix(prefix).strip("/")
    if not object_path:
        raise ValueError("Caminho de upload invalido.")

    return object_path


def upload_to_supabase_storage(file_storage, final_name: str) -> str:
    object_path = final_name
    if SUPABASE_STORAGE_PREFIX:
        object_path = f"{SUPABASE_STORAGE_PREFIX}/{final_name}"

    content = file_storage.read()
    response = supabase_request(
        "POST",
        f"/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{object_path}",
        data=content,
        extra_headers={
            "Content-Type": file_storage.mimetype or "application/octet-stream",
            "x-upsert": "false",
        },
        timeout=20,
    )

    if response.status_code >= 400:
        raise RuntimeError(f"Falha no upload para Supabase Storage: HTTP {response.status_code}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{object_path}"


def delete_from_supabase_storage(raw_url: str) -> bool:
    object_path = normalize_supabase_upload_path(raw_url)
    response = supabase_request(
        "DELETE",
        f"/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{object_path}",
        timeout=10,
    )

    if response.status_code == 404:
        return False
    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao remover arquivo no Supabase Storage: HTTP {response.status_code}")

    return True


initialize_storage()

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("X-Admin-Token")
        if not token or token != ADMIN_API_KEY:
            return jsonify({"error": "Nao autorizado"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.after_request
def add_cors_headers(response):
    # Em producao, troque '*' pelo dominio real (ex: https://seu-app.onrender.com)
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token"
    return response


@app.route("/api", methods=["OPTIONS"])
@app.route("/api/<path:_path>", methods=["OPTIONS"])
def api_options(_path: str | None = None):
    return ("", 204)


@app.get("/api/health")
def api_health():
    return jsonify(
        {
            "status": "ok",
            "data_store": "supabase" if USE_SUPABASE_DATA else "local",
            "photo_store": "supabase" if USE_SUPABASE_STORAGE else "local",
            "github_sync": "enabled" if USE_GITHUB_SYNC else "disabled",
        }
    )


@app.get("/api/image-proxy")
def image_proxy():
    raw_url = (request.args.get("url") or "").strip()
    if not raw_url:
        return jsonify({"error": "Parametro url obrigatorio."}), 400

    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return jsonify({"error": "URL invalida."}), 400

    if parsed.hostname in {"localhost", "127.0.0.1", "::1"}:
        return jsonify({"error": "Host nao permitido."}), 400

    try:
        upstream = requests.get(raw_url, stream=True, timeout=20)
    except requests.RequestException as error:
        return jsonify({"error": f"Falha ao baixar imagem: {error}"}), 502

    if upstream.status_code >= 400:
        return jsonify({"error": f"Imagem indisponivel: HTTP {upstream.status_code}"}), 502

    content_type = (upstream.headers.get("Content-Type") or "application/octet-stream").split(";")[0].strip()
    chunks = []
    total_size = 0
    for chunk in upstream.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        total_size += len(chunk)
        if total_size > IMAGE_PROXY_MAX_BYTES:
            upstream.close()
            return jsonify({"error": "Imagem excede o limite permitido no proxy."}), 413
        chunks.append(chunk)

    response = app.response_class(b"".join(chunks), status=200, mimetype=content_type)
    response.headers["Cache-Control"] = "public, max-age=86400"
    return response


@app.get("/api/dados")
def get_data():
    try:
        return jsonify(read_data())
    except FileNotFoundError:
        return jsonify({"error": "dados nao encontrado."}), 404
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.put("/api/dados")
@require_auth
def put_data():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Corpo JSON invalido."}), 400

    try:
        write_data_atomic(payload)
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    github_sync_status = "disabled"
    github_sync_error = None

    if USE_GITHUB_SYNC:
        try:
            _, github_sync_status = sync_payload_to_github(payload)
        except Exception as error:
            github_sync_status = "failed"
            github_sync_error = str(error)
            app.logger.exception("Falha ao sincronizar dados com GitHub")

    response_payload: dict[str, object] = {
        "ok": True,
        "github_sync": {
            "enabled": USE_GITHUB_SYNC,
            "status": github_sync_status,
        },
    }
    if github_sync_error:
        response_payload["github_sync"]["error"] = github_sync_error

    return jsonify(response_payload)


@app.post("/api/upload-photo")
@require_auth
def upload_photo():
    if "file" not in request.files:
        return jsonify({"error": "Campo file nao enviado."}), 400

    file_storage = request.files["file"]
    if not file_storage or not file_storage.filename:
        return jsonify({"error": "Arquivo invalido."}), 400

    ext = Path(file_storage.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Extensao nao permitida: {ext}"}), 400

    safe_name = secure_filename(file_storage.filename)
    if not safe_name:
        safe_name = f"photo{ext}"

    final_name = f"{uuid.uuid4().hex}_{safe_name}"

    try:
        if USE_SUPABASE_STORAGE:
            photo_url = upload_to_supabase_storage(file_storage, final_name)
        else:
            destination = UPLOADS_DIR / final_name
            file_storage.save(destination)
            photo_url = f"/uploads/{final_name}"
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    return jsonify({"ok": True, "url": photo_url})


@app.delete("/api/photo")
@require_auth
def delete_photo():
    payload = request.get_json(silent=True) or {}
    raw_url = payload.get("url")

    if not isinstance(raw_url, str) or not raw_url.strip():
        return jsonify({"error": "Campo url obrigatorio."}), 400

    try:
        if USE_SUPABASE_STORAGE and "/storage/v1/object/public/" in raw_url:
            found = delete_from_supabase_storage(raw_url)
            if not found:
                return jsonify({"error": "Arquivo nao encontrado."}), 404
            return jsonify({"ok": True})

        target = normalize_local_upload_url(raw_url)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    if not target.exists() or not target.is_file():
        return jsonify({"error": "Arquivo nao encontrado."}), 404

    target.unlink()
    return jsonify({"ok": True})


@app.get("/uploads/<path:filename>")
def get_uploaded_photo(filename: str):
    return send_from_directory(UPLOADS_DIR, filename)


@app.get("/")
def root_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
