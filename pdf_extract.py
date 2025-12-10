from __future__ import annotations

import pathlib
from typing import Iterable

import pdfplumber


def extract_text(path: str | pathlib.Path) -> str:
    """
    Extract all text from a PDF file.

    Args:
        path: Path to the PDF file.

    Returns:
        Concatenated text from all pages separated by newlines.
    """
    pdf_path = pathlib.Path(path)
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(_page_text(page) for page in pdf.pages)


def _page_text(page: pdfplumber.page.Page) -> str:
    # Some pages may return None if they have no extractable text.
    return page.extract_text() or ""


def extract_multiple(paths: Iterable[str | pathlib.Path]) -> dict[str, str]:
    """
    Extract text for multiple PDFs at once.

    Returns:
        Mapping of filename (string) to extracted text.
    """
    return {str(path): extract_text(path) for path in paths}


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract text from a PDF.")
    parser.add_argument("pdf", help="Path to a PDF file.")
    args = parser.parse_args()

    output = extract_text(args.pdf)
    print(output)
