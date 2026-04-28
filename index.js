const express = require('express');
const alasql = require('alasql');
const path = require('path');

const app = express();
const port = 3000;

// ─── In-Memory Database Setup ────────────────────────────────────────────────
alasql('CREATE TABLE books (id INT, title STRING, author STRING, genre STRING, price DECIMAL, stock INT)');

// Sample book catalogue — Technology
alasql("INSERT INTO books VALUES (1,  'The Pragmatic Programmer',        'David Thomas',          'Technology', 45.99, 12)");
alasql("INSERT INTO books VALUES (2,  'Clean Code',                      'Robert C. Martin',      'Technology', 38.50,  8)");
alasql("INSERT INTO books VALUES (3,  'You Don\\'t Know JS',             'Kyle Simpson',          'Technology', 29.99, 18)");
alasql("INSERT INTO books VALUES (4,  'Design Patterns',                 'Gang of Four',          'Technology', 54.00,  5)");

// Biography
alasql("INSERT INTO books VALUES (5,  'Becoming',                                'Michelle Obama',         'Biography',  17.50, 11)");
alasql("INSERT INTO books VALUES (6,  'Steve Jobs',                              'Walter Isaacson',        'Biography',  19.99,  5)");
alasql("INSERT INTO books VALUES (7,  'The Diary of a Young Girl',               'Anne Frank',             'Biography',  11.99, 13)");

// History
alasql("INSERT INTO books VALUES (8,  'Dune',                            'Frank Herbert',         'Fiction',    17.50, 30)");
alasql("INSERT INTO books VALUES (9,  'The Great Gatsby',                'F. Scott Fitzgerald',   'Fiction',    13.99, 20)");
alasql("INSERT INTO books VALUES (10, '1984',                            'George Orwell',         'Fiction',    14.50, 35)");
alasql("INSERT INTO books VALUES (11, 'The Hitchhiker\\'s Guide to the Galaxy', 'Douglas Adams', 'Fiction',    12.99, 17)");

// Modern Fiction
alasql("INSERT INTO books VALUES (12, 'The Great Gatsby',                        'F. Scott Fitzgerald',    'Fiction',    13.99, 20)");
alasql("INSERT INTO books VALUES (13, 'Dune',                                    'Frank Herbert',          'Fiction',    17.50, 30)");
alasql("INSERT INTO books VALUES (14, '1984',                                    'George Orwell',          'Fiction',    14.50, 35)");
alasql("INSERT INTO books VALUES (15, 'The Hitchhiker\'s Guide to the Galaxy',  'Douglas Adams',          'Fiction',    12.99, 17)");

// Hidden / Restricted
alasql("INSERT INTO books VALUES (16, '[ARCHIVE] Curator\'s Log',               'Library Archivist',      'Restricted', 0.00,  1)");
alasql("INSERT INTO books VALUES (17, '[ARCHIVE] Vault Access Ledger',             'Head Librarian',         'Restricted', 0.00,  1)");

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Vulnerable Search Endpoint ───────────────────────────────────────────────
// WARNING: User input is concatenated directly into the SQL string.
// This is intentionally insecure for demonstration purposes.
app.get('/api/books', (req, res) => {
    const genre = req.query.genre || '';

    //  VULNERABLE: no input sanitisation, no parameterised query
    const query = `SELECT * FROM books WHERE genre = '${genre}'`;

    try {
        console.log(`[SQL Executed] ${query}`);
        const rows = alasql(query);
        res.json(rows);
    } catch (err) {
        console.error(`[SQL Error] ${err.message}`);
        res.status(500).json({ error: err.message, executedQuery: query });
    }
});

app.listen(port, () => {
    console.log(`StoryShelf running → http://localhost:${port}`);
    console.log(`Challenge: retrieve the Restricted record using SQL Injection!`);
});
