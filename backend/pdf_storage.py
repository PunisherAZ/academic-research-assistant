import os
from fastapi import UploadFile, HTTPException
import shutil
from pathlib import Path

# PDF storage directory
PDF_STORAGE_DIR = "/app/data/pdfs"
os.makedirs(PDF_STORAGE_DIR, exist_ok=True)


async def save_pdf(file: UploadFile, paper_id: str) -> str:
    """
    Save uploaded PDF to file system
    
    Args:
        file: Uploaded PDF file
        paper_id: Unique paper identifier
        
    Returns:
        Relative path to saved PDF (/pdfs/abc123.pdf)
    """
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create file path - sanitize paper_id to be safe for filesystem
    safe_filename = paper_id.replace(":", "_").replace("/", "_")
    file_path = os.path.join(PDF_STORAGE_DIR, f"{safe_filename}.pdf")
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"Successfully saved PDF to {file_path}")
    except Exception as e:
        print(f"Failed to save PDF to {file_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save PDF: {str(e)}")
    
    return f"/pdfs/{safe_filename}.pdf"


def get_pdf_path(paper_id: str) -> str:
    """
    Get full file system path to PDF
    
    Args:
        paper_id: Unique paper identifier
        
    Returns:
        Absolute path to PDF file
    """
    safe_filename = paper_id.replace(":", "_").replace("/", "_")
    return os.path.join(PDF_STORAGE_DIR, f"{safe_filename}.pdf")


def pdf_exists(paper_id: str) -> bool:
    """
    Check if PDF file exists for a paper
    
    Args:
        paper_id: Unique paper identifier
        
    Returns:
        True if PDF exists, False otherwise
    """
    return os.path.exists(get_pdf_path(paper_id))


def delete_pdf(paper_id: str) -> bool:
    """
    Delete PDF file from storage
    
    Args:
        paper_id: Unique paper identifier
        
    Returns:
        True if deleted, False if didn't exist
    """
    pdf_path = get_pdf_path(paper_id)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
        return True
    return False
