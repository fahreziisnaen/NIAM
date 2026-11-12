import os
import shutil
import re
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.asset import AssetDocument, Asset

router = APIRouter(prefix="/documents", tags=["Document Storage"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv",
    ".txt", ".png", ".jpg", ".jpeg", ".zip", ".tar", ".gz"
}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

def sanitize_filename(filename: str) -> str:
    """Strip path traversals and dangerous characters from uploaded filenames."""
    base = os.path.basename(filename or "document")
    # Remove null bytes and non-printable characters
    base = base.replace("\0", "").strip()
    # Normalize filename: keep only alphanumeric, dashes, underscores, dots
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
    if not clean or clean.startswith("."):
        clean = f"doc_{clean}"
    return clean

@router.post("/upload")
async def upload_asset_document(
    asset_id: int = Form(...),
    document_type: str = Form("Datasheet"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    raw_filename = file.filename or "upload.bin"
    ext = os.path.splitext(raw_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Disallowed file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    safe_name = sanitize_filename(raw_filename)
    target_dir = os.path.abspath(os.path.join(settings.UPLOAD_DIR, "assets", str(asset_id)))
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.abspath(os.path.join(target_dir, safe_name))
    # Security check: ensure final path is strictly inside target_dir (CWE-22)
    if not file_path.startswith(target_dir):
        raise HTTPException(status_code=400, detail="Invalid filename traversal detected")

    total_size = 0
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE_BYTES:
                buffer.close()
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(status_code=413, detail="File size exceeds maximum limit of 25MB")
            buffer.write(chunk)

    file_size_kb = total_size // 1024

    doc = AssetDocument(
        asset_id=asset.id,
        document_type=document_type,
        file_name=safe_name,
        file_path=file_path,
        file_size_kb=file_size_kb,
        uploaded_by="IT Admin"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "success": True,
        "message": "Document uploaded securely",
        "document_id": doc.id,
        "file_name": doc.file_name,
        "file_size_kb": doc.file_size_kb
    }

@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(AssetDocument).filter(AssetDocument.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    # Security check: ensure path is strictly within UPLOAD_DIR
    real_path = os.path.abspath(doc.file_path)
    base_upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    if not real_path.startswith(base_upload_dir):
        raise HTTPException(status_code=403, detail="Access denied: file outside permitted storage")

    return FileResponse(doc.file_path, filename=doc.file_name)

