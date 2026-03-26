from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.services.excel_styling_service import write_reconciliation_excel
from app.services.reconciliation_service import reconcile_files
from app.utils.validators import validate_excel_upload

logger = logging.getLogger(__name__)

router = APIRouter(tags=['Reconciliation'])

TEMP_REPORT_DIR = Path(os.getenv('GST_RECON_TEMP_DIR', '/tmp/gst-reconciliation'))
SESSION_STORE: dict[str, dict] = {}


def _cleanup_session(session_id: str) -> None:
    session_data = SESSION_STORE.pop(session_id, None)
    if not session_data:
        return

    report_path = Path(session_data['report_path'])
    if report_path.exists():
        report_path.unlink(missing_ok=True)


def _safe_error(message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(status_code=status_code, detail=message)


@router.post('/upload-excel')
async def upload_excel(
    books_file: UploadFile = File(...),
    twoB_file: UploadFile = File(...),
):
    validate_excel_upload(books_file)
    validate_excel_upload(twoB_file)

    session_id = str(uuid4())
    report_path = TEMP_REPORT_DIR / f'{session_id}.xlsx'

    try:
        result = await asyncio.to_thread(
            reconcile_files,
            books_file.file,
            books_file.filename or 'books.xlsx',
            twoB_file.file,
            twoB_file.filename or '2b.xlsx',
        )
    except ValueError as exc:
        raise _safe_error(str(exc)) from exc
    except Exception as exc:
        logger.exception('Unexpected reconciliation error for session %s', session_id)
        raise _safe_error('Internal processing error while reconciling files.', status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    sheets = {
        'Matched': result.matched,
        'Books_Not_In_2B': result.books_not_in_2b,
        'TwoB_Not_In_Books': result.twob_not_in_books,
        'Tax_Mismatch': result.tax_mismatch,
        'Duplicate_Invoices': result.duplicate_invoices,
    }

    await asyncio.to_thread(write_reconciliation_excel, report_path, sheets)

    SESSION_STORE[session_id] = {
        'report_path': str(report_path),
        'insights': result.insights,
    }

    return {
        'session_id': session_id,
        **result.insights,
    }


@router.get('/download-report/{session_id}')
async def download_report(session_id: str, background_tasks: BackgroundTasks):
    session_data = SESSION_STORE.get(session_id)
    if not session_data:
        raise _safe_error('Invalid session_id or report expired.', status.HTTP_404_NOT_FOUND)

    report_path = Path(session_data['report_path'])
    if not report_path.exists():
        SESSION_STORE.pop(session_id, None)
        raise _safe_error('Report file not found.', status.HTTP_404_NOT_FOUND)

    background_tasks.add_task(_cleanup_session, session_id)

    return FileResponse(
        path=report_path,
        filename=f'gst-reconciliation-{session_id}.xlsx',
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@router.get('/ai-insights/{session_id}')
async def ai_insights(session_id: str):
    session_data = SESSION_STORE.get(session_id)
    if not session_data:
        raise _safe_error('Invalid session_id or insights expired.', status.HTTP_404_NOT_FOUND)

    return session_data['insights']
