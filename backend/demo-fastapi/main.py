"""Punto de entrada FastAPI — MODO DEMO del módulo de certificados.

Ejecuta:
    uvicorn main:app --reload --port 8001   (desde la carpeta backend/)

Expone los routers bajo /api/v1, habilita CORS para el front en :4201 y registra
el limitador de tasa (slowapi) usado por el endpoint público de verificación.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.modules.certificados.router import admin_router, limiter, public_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="DIGEMID · Certificados (demo)",
    version="1.0.0",
    description="Mockup standalone: verificación pública + panel admin + blockchain simulado.",
)

# CORS para el frontend Angular (acceso directo; con proxy va same-origin).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4201",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Rate limiting (slowapi) — el decorador @limiter.limit del router público lo usa.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Routers del módulo certificados, todos bajo /api/v1.
app.include_router(public_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "modo": "demo"}


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {
        "servicio": "DIGEMID Certificados (demo)",
        "docs": "/docs",
        "ejemplo_publico": "/api/v1/certificados/verificar/DIGEMID-DEMO-001",
    }
