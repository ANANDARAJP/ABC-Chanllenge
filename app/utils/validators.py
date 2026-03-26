from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {'.xlsx', '.xls'}
MAX_UPLOAD_MB = 20
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


def validate_excel_upload(upload_file: UploadFile, max_size_bytes: int = MAX_UPLOAD_BYTES) -> None:
    """Validate extension and file size for uploaded Excel files."""
    extension = Path(upload_file.filename or '').suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid file format. Only .xlsx and .xls files are allowed.',
        )

    current_pos = upload_file.file.tell()
    upload_file.file.seek(0, 2)
    size = upload_file.file.tell()
    upload_file.file.seek(current_pos)

    if size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'File size exceeds {MAX_UPLOAD_MB}MB limit.',
        )
