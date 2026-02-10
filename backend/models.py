from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# Association table for many-to-many relationship between papers and tags
paper_tags = Table(
    'paper_tags',
    Base.metadata,
    Column('paper_id', String, ForeignKey('papers.id', ondelete='CASCADE')),
    Column('tag_id', String, ForeignKey('tags.id', ondelete='CASCADE'))
)


class Paper(Base):
    """
    Represents a saved research paper with all metadata
    """
    __tablename__ = "papers"
    
    id = Column(String, primary_key=True)
    title = Column(Text, nullable=False)
    authors = Column(JSONB)  # Store as JSON array: ["Author 1", "Author 2"]
    year = Column(Integer)
    journal = Column(String)
    volume = Column(String)
    issue = Column(String)
    pages = Column(String)
    url = Column(Text)
    abstract = Column(Text)
    pdf_path = Column(String)  # Path to PDF file: /pdfs/abc123.pdf
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    tags = relationship("Tag", secondary=paper_tags, back_populates="papers")
    note = relationship("Note", back_populates="paper", uselist=False, cascade="all, delete-orphan")


class Tag(Base):
    """
    Tags for organizing papers
    """
    __tablename__ = "tags"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    color = Column(String)  # Color code for UI
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    papers = relationship("Paper", secondary=paper_tags, back_populates="tags")


class Note(Base):
    """
    Personal notes attached to papers
    """
    __tablename__ = "notes"
    
    paper_id = Column(String, ForeignKey('papers.id', ondelete='CASCADE'), primary_key=True)
    content = Column(Text)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    paper = relationship("Paper", back_populates="note")
