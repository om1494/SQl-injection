# StoryShelf — SQL Injection Lab

A full-stack web application built to demonstrate how SQL Injection vulnerabilities arise, how they can be exploited in different ways, and how to fix them. The theme is a fictional library catalogue called **StoryShelf**.

## Features

- **Vulnerable Backend:** Built with Node.js, Express, and AlaSQL (an in-memory SQL database).
- **Dynamic Frontend:** A warm, library-inspired UI built with HTML, CSS, and Vanilla JavaScript.
- **Live SQL Visualiser:** The UI shows exactly what SQL query is being sent to the backend in real-time.
- **Click-to-Copy Payload Chips:** Three pre-built injection payloads that auto-fill the input, copy to clipboard, and run the search instantly.

## Prerequisites

- Node.js installed on your machine.

## How to Run

1. Open a terminal in this project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```
4. Open your browser and navigate to `http://localhost:3000`.

## How to Exploit (SQL Injection)

The application has a genre filter. The vulnerable code takes the user input directly and concatenates it into the SQL query with no sanitization:

```javascript
const query = `SELECT * FROM books WHERE genre = '${genre}'`;
```

The database contains two hidden archive records in the `Restricted` genre that are never shown through normal browsing. The goal is to expose them using SQL Injection.

### Payload 1 — Full Dump

Type the following in the **Custom / Attack Input** field (or click chip **1**):

```
' OR '1'='1
```

**What happens?** The backend constructs:

```sql
SELECT * FROM books WHERE genre = '' OR '1'='1'
```

Since `'1'='1'` is always true, every row is returned — all 15 books including both classified records.

---

### Payload 2 — Targeted Leak

Type the following (or click chip **2**):

```
' OR genre='Restricted
```

**What happens?** The backend constructs:

```sql
SELECT * FROM books WHERE genre = '' OR genre='Restricted'
```

This returns **only** the 2 classified books, without exposing all other records.

---

### Payload 3 — Numeric Column Leak

Type the following (or click chip **3**):

```
' OR stock < 10 AND '1'='1
```

**What happens?** The backend constructs:

```sql
SELECT * FROM books WHERE genre = '' OR stock < 10 AND '1'='1'
```

Returns 3 books with low stock — *Design Patterns* (stock: 5) and both restricted records (stock: 1). The attacker didn't need to know the `Restricted` genre name; probing a numeric column was enough to accidentally expose the hidden data.

---

## The Fix

The correct approach is to use **parameterized queries**, which separate user data from SQL logic entirely:

```javascript
// SECURE — input is treated as data, never as SQL
const rows = alasql('SELECT * FROM books WHERE genre = ?', [genre]);
```

This completely neutralizes all three payloads above.

## Disclaimer

This project is strictly for educational purposes and is meant to be run locally. Do not use these techniques on systems you do not own or have explicit permission to test.
