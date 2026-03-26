from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.reconciliation import router as reconciliation_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
)

app = FastAPI(title='GST Invoice Reconciliation API', version='1.0.0')


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={'error': exc.detail})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    logging.getLogger(__name__).exception('Unhandled exception: %s', exc)
    return JSONResponse(status_code=500, content={'error': 'Internal server error'})

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok'}


app.include_router(reconciliation_router)
