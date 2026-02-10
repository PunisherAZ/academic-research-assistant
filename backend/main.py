from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import os

from services.search import search_openalex
from services.citation import generate_apa_citation, generate_mla_citation, generate_chicago_citation
from database import get_db, engine, Base
from models import Paper, Tag, Note, paper_tags
from pdf_storage import save_pdf, get_pdf_path, pdf_exists, delete_pdf

app = FastAPI(title="Academic Research Agent", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3003",
    "*", # Allow all for LAN access
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class SearchResult(BaseModel):
    id: str
    title: str
    authors: List[str]
    year: int
    abstract: Optional[str] = None
    url: str
    citation_apa: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "academic-backend"}

@app.post("/search/openalex", response_model=List[SearchResult])
def search_academic(request: SearchRequest):
    """
    Search OpenAlex for academic papers.
    """
    try:
        results = search_openalex(request.query, request.limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cite/apa", response_model=str)
def cite_paper_apa(paper: SearchResult):
    """
    Generate APA 7th Citation for a paper.
    """
    return generate_apa_citation(paper)

@app.post("/cite/mla", response_model=str)
def cite_paper_mla(paper: SearchResult):
    """
    Generate MLA 9th Citation for a paper.
    """
    return generate_mla_citation(paper)

@app.post("/cite/chicago", response_model=str)
def cite_paper_chicago(paper: SearchResult):
    """
    Generate Chicago 17th Citation for a paper.
    """
    return generate_chicago_citation(paper)


# =============================================================================
# DATABASE INITIALIZATION
# =============================================================================

@app.on_event("startup")
def init_db():
    """Initialize database tables on startup"""
    Base.metadata.create_all(bind=engine)


# =============================================================================
# PAPERS API
# =============================================================================

@app.get("/api/papers")
def get_papers(db: Session = Depends(get_db)):
    """Get all saved papers with tags and notes"""
    papers = db.query(Paper).all()
    return papers


@app.post("/api/papers")
def create_paper(paper_data: dict, db: Session = Depends(get_db)):
    """Save a new paper"""
    paper = Paper(**paper_data)
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@app.delete("/api/papers/{paper_id}")
def delete_paper(paper_id: str, db: Session = Depends(get_db)):
    """Delete a paper and its associated PDF"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Delete PDF if exists
    if paper.pdf_path:
        delete_pdf(paper_id)
    
    db.delete(paper)
    db.commit()
    return {"status": "deleted", "id": paper_id}


# =============================================================================
# TAGS API
# =============================================================================

@app.get("/api/tags")
def get_tags(db: Session = Depends(get_db)):
    """Get all tags"""
    tags = db.query(Tag).all()
    return tags


@app.post("/api/tags")
def create_tag(tag_data: dict, db: Session = Depends(get_db)):
    """Create a new tag"""
    tag = Tag(**tag_data)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    """Delete a tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return {"status": "deleted", "id": tag_id}


@app.post("/api/papers/{paper_id}/tags/{tag_id}")
def add_tag_to_paper(paper_id: str, tag_id: str, db: Session = Depends(get_db)):
    """Assign a tag to a paper"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if not paper or not tag:
        raise HTTPException(status_code=404, detail="Paper or tag not found")
    
    if tag not in paper.tags:
        paper.tags.append(tag)
        db.commit()
    
    return {"status": "tagged", "paper_id": paper_id, "tag_id": tag_id}


@app.delete("/api/papers/{paper_id}/tags/{tag_id}")
def remove_tag_from_paper(paper_id: str, tag_id: str, db: Session = Depends(get_db)):
    """Remove a tag from a paper"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if not paper or not tag:
        raise HTTPException(status_code=404, detail="Paper or tag not found")
    
    if tag in paper.tags:
        paper.tags.remove(tag)
        db.commit()
    
    return {"status": "untagged", "paper_id": paper_id, "tag_id": tag_id}


# =============================================================================
# NOTES API
# =============================================================================

@app.get("/api/notes/{paper_id}")
def get_note(paper_id: str, db: Session = Depends(get_db)):
    """Get note for a specific paper"""
    note = db.query(Note).filter(Note.paper_id == paper_id).first()
    if not note:
        return {"paper_id": paper_id, "content": "", "updated_at": None}
    return note


@app.post("/api/notes/{paper_id}")
def save_note(paper_id: str, note_data: dict, db: Session = Depends(get_db)):
    """Save or update a note for a paper"""
    note = db.query(Note).filter(Note.paper_id == paper_id).first()
    
    if note:
        # Update existing note
        note.content = note_data.get("content", "")
        from datetime import datetime
        note.updated_at = datetime.utcnow()
    else:
        # Create new note
        note = Note(paper_id=paper_id, content=note_data.get("content", ""))
        db.add(note)
    
    db.commit()
    db.refresh(note)
    return note


@app.delete("/api/notes/{paper_id}")
def delete_note(paper_id: str, db: Session = Depends(get_db)):
    """Delete a note"""
    note = db.query(Note).filter(Note.paper_id == paper_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"status": "deleted", "paper_id": paper_id}


# =============================================================================
# PDF STORAGE API
# =============================================================================

@app.post("/api/papers/{paper_id}/upload-pdf")
async def upload_pdf(
    paper_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a PDF for a paper"""
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Check if paper exists
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Save PDF
    pdf_path = await save_pdf(file, paper_id)
    
    # Update paper record
    paper.pdf_path = pdf_path
    db.commit()
    
    return {
        "status": "uploaded",
        "paper_id": paper_id,
        "pdf_url": pdf_path,
        "filename": file.filename
    }


@app.get("/api/pdfs/{paper_id}")
async def download_pdf(paper_id: str):
    """Download/view a PDF file"""
    if not pdf_exists(paper_id):
        raise HTTPException(status_code=404, detail="PDF not found")
    
    pdf_path = get_pdf_path(paper_id)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"{paper_id}.pdf"
    )


@app.delete("/api/pdfs/{paper_id}")
def delete_pdf_endpoint(paper_id: str, db: Session = Depends(get_db)):
    """Delete a PDF file"""
    # Update database
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if paper:
        paper.pdf_path = None
        db.commit()
    
    # Delete file
    if delete_pdf(paper_id):
        return {"status": "deleted", "paper_id": paper_id}
    else:
        raise HTTPException(status_code=404, detail="PDF not found")
