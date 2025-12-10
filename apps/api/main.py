from __future__ import annotations

import io
from typing import Annotated

import pdfplumber
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse


app = FastAPI(title="PDF Text Extractor", version="0.1.0")


@app.post("/extract")
async def extract_pdf_text(file: Annotated[UploadFile, File(description="PDF file to extract")]):
    if file.content_type not in ("application/pdf", "application/x-pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = []
            for idx, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                pages.append({"page": idx, "text": text})

            full_text = "\n".join(p["text"] for p in pages)

        return JSONResponse(
            {
                "filename": file.filename,
                "page_count": len(pages),
                "text": full_text,
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to extract PDF text.") from exc


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
