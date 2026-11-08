import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.asset import AssetDocument, Asset

router = APIRouter(prefix="/documents", tags=["Document Storage"])

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

    target_dir = os.path.join(settings.UPLOAD_DIR, "assets", str(asset_id))
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = os.path.getsize(file_path) // 1024

    doc = AssetDocument(
        asset_id=asset.id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        file_size_kb=file_size_kb,
        uploaded_by="IT Admin"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "success": True,
        "message": "Document uploaded successfully",
        "document_id": doc.id,
        "file_name": doc.file_name,
        "file_size_kb": doc.file_size_kb
    }

@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(AssetDocument).filter(AssetDocument.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")
    return FileResponse(doc.file_path, filename=doc.file_name)

