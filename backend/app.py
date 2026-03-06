"""Backend API para persistir dados do organograma."""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATA_FILE = ROOT_DIR / "dados.json"
DATA_FILE = Path(os.getenv("DATA_FILE", str(DEFAULT_DATA_FILE))).expanduser()
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(ROOT_DIR / "uploads"))).expanduser()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_DATA_TABLE = os.getenv("SUPABASE_DATA_TABLE", "organograma_data").strip() or "organograma_data"
SUPABASE_DATA_ROW_ID = os.getenv("SUPABASE_DATA_ROW_ID", "main").strip() or "main"
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "").strip()
SUPABASE_STORAGE_PREFIX = os.getenv("SUPABASE_STORAGE_PREFIX", "organograma").strip("/")

USE_SUPABASE_DATA = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
USE_SUPABASE_STORAGE = USE_SUPABASE_DATA and bool(SUPABASE_STORAGE_BUCKET)

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

app = Flask(__name__, static_folder=str(ROOT_DIR), static_url_path="")
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
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


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


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
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
def put_data():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Corpo JSON invalido."}), 400

    try:
        write_data_atomic(payload)
    except Exception as error:
        return jsonify({"error": str(error)}), 500

    return jsonify({"ok": True})


@app.post("/api/upload-photo")
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
    return send_from_directory(ROOT_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
