from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel #define the shape and structure of request and response data,
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import shutil
from PyPDF2 import PdfReader
import ollama
 
app = FastAPI()
 
# URL-encode the special characters in your password
DATABASE_URL = "postgresql://keshav:Keshav%40123@localhost:5432/books"
 
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    year_published = Column(Integer)
    pdf = Column(String)
    category = Column(String)
 
Base.metadata.create_all(bind=engine)
 
class BookCreate(BaseModel):
    title: str
    author: str
    year_published: int 
    pdf: str
    category: str
 
@app.post("/add-books/", response_model=BookCreate)
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    year_published: int = Form(...),
    pdf: UploadFile = File(...)
):
    
    file_location = f"pdfs/{pdf.filename}"
    with open(file_location, "wb") as file:
        shutil.copyfileobj(pdf.file, file)
    pdf_reader = PdfReader(open(f"pdfs/{pdf.filename}", 'rb'))
    content = ""
    for page in pdf_reader.pages:
        content += page.extract_text()
    response=ollama.generate(model='qwen2:1.5b', prompt=f"Generate the category of the following text in one word:\n{content}")
    category = response['response']
    print("Generated Category:", category)
    db = SessionLocal()
    db_book = Book(title=title, author=author, year_published=year_published, pdf=pdf.filename,category=category)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    db.close()
    return db_book

@app.get("/books/")
def read_books():
    db = SessionLocal()
    books = db.query(Book).all()
    db.close()
    return books
 
@app.put("/update-books/{book_id}", response_model=BookCreate)
def update_book(
    book_id: int,
    title: str = Form(...),
    author: str = Form(...),
    year_published: int = Form(...),
    pdf: UploadFile = None
):
    db = SessionLocal()
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        db.close()
        raise HTTPException(status_code=404, detail="Book not found")
 
    if pdf:
        # Delete the old PDF file
        old_file_location = f"pdfs/{book.pdf}"
        if os.path.exists(old_file_location):
            os.remove(old_file_location)
       
        # Save the new PDF file
        new_file_location = f"pdfs/{pdf.filename}"
        with open(new_file_location, "wb") as file:
            shutil.copyfileobj(pdf.file, file)
        pdf_reader = PdfReader(open(f"pdfs/{pdf.filename}", 'rb'))
        content = ""
        for page in pdf_reader.pages:
            content += page.extract_text()
        response=ollama.generate(model='qwen2:1.5b', prompt=f"Generate the category of the following text in one word:\n{content}")
        category = response['response']
        print("Generated Category:", category)
        book.pdf = pdf.filename

 
    book.title = title
    book.author = author
    book.year_published = year_published
    book.category=category
    db.commit()
    db.refresh(book)
    db.close()
    return book
 
 
@app.delete("/delete-books/{book_id}")
def delete_book(book_id: int):
    db = SessionLocal()
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        db.close()
        raise HTTPException(status_code=404, detail="Book not found")
   
    file_path = f"pdfs/{book.pdf}"
    if os.path.exists(file_path):
        os.remove(file_path)
 
    db.delete(book)
    db.commit()
    db.close()
    return {"message": "Book and associated PDF deleted successfully"}
 
@app.get("/books/extract-text/{book_id}")
def extract_text(book_id):
    db = SessionLocal()
    book = db.query(Book).filter(Book.id == book_id).first()
    pdf_reader = PdfReader(open(f"pdfs/{book.pdf}", 'rb'))
    content = ""
    for page in pdf_reader.pages:
        content += page.extract_text()
    return content
 
@app.get('/books/get-summary/{book_id}')
def generate_summary(book_id):
    text=extract_text(book_id)
    response = ollama.generate(model='qwen2:1.5b', prompt=f"Summarize the following text:\n\n{text}")

    summary = response['response']

    return {"summary": summary}
# Add CORS middleware
origins = [
    "http://localhost:3000",  # Replace with your frontend URL
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, #allows cookies and HTTP authentication information to be included in cross-origin requests
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
 