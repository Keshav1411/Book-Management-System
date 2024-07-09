import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', year_published: '', pdf: null });
  const [checkbox, setCheckbox] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [editBook, setEditBook] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDeleteBooks = async () => {
    const response = window.confirm("Are you sure you want to delete the selected books?")

    try {
      if (response) {
        for (const bookId of selectedBooks) {
          await axios.delete(`http://localhost:8000/delete-books/${bookId}`);
        }
      }
      else {
        console.log("Cancelled delete ")
      }
      fetchBooks();
    }
    catch (error) {
      console.error('Error deleting books:', error);
    }

    setCheckbox(false);
    setSelectedBooks([]);
  };


  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:8000/books/');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleAddBook = async () => {
    const formData = new FormData();
    formData.append('title', newBook.title);
    formData.append('author', newBook.author);
    formData.append('year_published', newBook.year_published);
    formData.append('pdf', newBook.pdf);

    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('year').value = '';
    document.getElementById('pdf').value = null;
    // Log the form data
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    setLoading(true)
    try {

      const response = await axios.post('http://localhost:8000/add-books/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      document.getElementById('add-book-form').style.display = 'none'
      console.log('Book added successfully:', response.data);
      fetchBooks();
      //setNewBook({ title: '', author: '', year_published: '', pdf: null });



    } catch (error) {
      setLoading(false)
      console.error('Error adding book:', error.response ? error.response.data : error.message);
      alert("Error adding book")

    }
    setLoading(false)
  };

  const handleEditBook = (book) => {
    setEditBook(book);
  };

  const handleUpdateBook = async () => {
    const formData = new FormData();
    formData.append('title', editBook.title);
    formData.append('author', editBook.author);
    formData.append('year_published', editBook.year_published);
    if (editBook.pdf instanceof File) {
      formData.append('pdf', editBook.pdf);
    }
    setLoading(true)
    try {
      await axios.put(`http://localhost:8000/update-books/${editBook.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchBooks();
      setEditBook(null);
    } catch (error) {
      console.error('Error updating book:', error);
    }
    setLoading(false)
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await axios.delete(`http://localhost:8000/delete-books/${bookId}`);
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'pdf') {
      setNewBook({ ...newBook, [name]: files[0] });
    } else {
      setNewBook({ ...newBook, [name]: value });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'pdf') {
      setEditBook({ ...editBook, [name]: files[0] });
    } else {
      setEditBook({ ...editBook, [name]: value });
    }
  };

  const handleCheckbox = () => {
    setCheckbox(true);
  }

  const handleSelectBook = (e) => {
    const bookId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedBooks([...selectedBooks, bookId]);
    } else {
      setSelectedBooks(selectedBooks.filter(id => id !== bookId));
    }
  };

  const handleGenerateSummary = async (bookId) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:8000/books/get-summary/${bookId}`);
      setSummary(response.data.summary);
      setShowSummaryModal(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    setLoading(false)
  };

  return (
    <div className='bg'>
      <div className='Summary'>

          {showSummaryModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Summary</h2>
                <p>{summary}</p>
                <button className="close" onClick={() => setShowSummaryModal(false)}>Close</button>
              </div>
            </div>
          )}
      </div>
      <div className="App">
        {loading && (
          <div class="loader"></div>
        )}
        <nav>
          <h1>Book Management System</h1>
        </nav>
        <div className="container">

          <button className="add" onClick={() => document.getElementById('add-book-form').style.display = 'block'}>Add Book</button>
          {!checkbox && (
            <button className="delete" onClick={handleCheckbox}>Delete Books</button>
          )}
          {checkbox && (
            <button className="delete" onClick={handleDeleteBooks}>Delete</button>
          )}


          {editBook && (
            <div id="edit-book-form">
              <h2>Edit Book</h2>
              <input name="title" value={editBook.title} placeholder="Title" onChange={handleEditInputChange} />
              <input name="author" value={editBook.author} placeholder="Author" onChange={handleEditInputChange} />
              <input name="year_published" value={editBook.year_published} placeholder="Year Published" onChange={handleEditInputChange} />
              <input name="pdf" type="file" onChange={handleEditInputChange} />
              <button className="edit" onClick={handleUpdateBook}>Update</button>
              <button className="cancel" onClick={() => setEditBook(null)}>Cancel</button>
            </div>
          )}
          <div id="add-book-form" style={{ display: 'none' }}>
            <h2>Add New Book</h2>
            <input id='title' name="title" placeholder="Title" onChange={handleInputChange} />
            <input id='author' name="author" placeholder="Author" onChange={handleInputChange} />
            <input id='year' name="year_published" placeholder="Year Published" onChange={handleInputChange} />
            <input id='pdf' name="pdf" type="file" onChange={handleInputChange} />
            <button className="add" onClick={handleAddBook}>Submit</button>
            <button className="cancel" onClick={() => document.getElementById('add-book-form').style.display = 'none'}>Cancel</button>
          </div>
          <table>
            <thead>
              <tr>
                {checkbox && (
                  <th>Select</th>
                )}
                <th>Title</th>
                <th>Author</th>
                <th>Year Published</th>
                <th>PDF</th>
                <th>Actions</th>
                <th>Category</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  {checkbox && (
                    <td><input type="checkbox" value={book.id} onChange={handleSelectBook} /></td>
                  )}
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.year_published}</td>
                  <td>{book.pdf}</td>

                  <td>
                    <button className="edit" onClick={() => handleEditBook(book)}>Edit</button>
                    <button className="delete" onClick={() => handleDeleteBook(book.id)}>Delete</button>
                  </td>
                  <td>
                    {book.category}
                  </td>
                  <td>
                    <button className="summary" onClick={() => handleGenerateSummary(book.id)}>Generate Summary</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
};

export default App;
