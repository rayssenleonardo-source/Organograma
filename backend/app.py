"""Backend API para persistir dados do organograma."""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from urllib.parse import unquote, urlparse

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT_DIR / "dados.json"
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
}

app = Flask(__name__, static_folder=str(ROOT_DIR), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024


def read_data() -> dict:
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_data_atomic(payload: dict) -> None:
    # Em bind mount de arquivo único (./dados.json:/app/dados.json), usar rename
    # pode "descolar" o arquivo do host. Escrita direta mantém sincronismo.
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def normalize_upload_url(raw_url: str) -> Path:
    parsed = urlparse(raw_url)
    clean_path = unquote(parsed.path or "")

    if not clean_path.startswith("/uploads/"):
        raise ValueError("A URL precisa apontar para /uploads/.")

    target = (ROOT_DIR / clean_path.lstrip("/")).resolve()
    uploads_root = UPLOADS_DIR.resolve()

    if uploads_root not in target.parents:
        raise ValueError("Caminho de upload invalido.")

    return target


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
    return jsonify({"status": "ok"})


@app.get("/api/dados")
def get_data():
    try:
        return jsonify(read_data())
    except FileNotFoundError:
        return jsonify({"error": "dados.json nao encontrado."}), 404


@app.put("/api/dados")
def put_data():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Corpo JSON invalido."}), 400

    write_data_atomic(payload)
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
    destination = UPLOADS_DIR / final_name
    file_storage.save(destination)

    return jsonify({"ok": True, "url": f"/uploads/{final_name}"})


@app.delete("/api/photo")
def delete_photo():
    payload = request.get_json(silent=True) or {}
    raw_url = payload.get("url")

    if not isinstance(raw_url, str) or not raw_url.strip():
        return jsonify({"error": "Campo url obrigatorio."}), 400

    try:
        target = normalize_upload_url(raw_url)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

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
