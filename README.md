# CyberMart — SQL Injection Lab

A full-stack web application built to demonstrate how SQL Injection vulnerabilities arise, how they can be exploited in different ways, and how to fix them. The theme is a fictional electronics store called **CyberMart**.

## Features

- **Vulnerable Backend:** Built with Node.js, Express, and AlaSQL (an in-memory SQL database).
- **Dynamic Frontend:** A modern electronics catalogue UI built with HTML, CSS, and Vanilla JavaScript.
- **Live SQL Visualiser:** The UI shows exactly what SQL query is being sent to the backend in real-time.
- **Click-to-Copy Payload Chips:** Pre-built injection payloads that auto-fill the input, copy to clipboard, and run the search instantly.

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

The application has a category filter. The vulnerable code takes the user input directly and concatenates it into the SQL query with no sanitization:

```javascript
const query = `SELECT * FROM products WHERE category = '${category}'`;
```

The database contains two hidden records in the `Classified` category that are never shown through normal browsing. The goal is to expose them using SQL Injection.

### Payload 1 — Full Dump

Type the following in the **Custom / Attack Input** field (or click chip **1**):

```
' OR '1'='1
```

**What happens?** The backend constructs:

```sql
SELECT * FROM products WHERE category = '' OR '1'='1'
```

Since `'1'='1'` is always true, every row is returned — all 15 products including both classified records.

---

### Payload 2 — Targeted Leak

Type the following (or click chip **2**):

```
' OR category='Classified
```

**What happens?** The backend constructs:

```sql
SELECT * FROM products WHERE category = '' OR category='Classified'
```

This returns **only** the 2 classified products, without exposing all other records.

---

## The Fix

The correct approach is to use **parameterized queries**, which separate user data from SQL logic entirely:

```javascript
// SECURE — input is treated as data, never as SQL
const rows = alasql('SELECT * FROM products WHERE category = ?', [category]);
```

This completely neutralizes the payloads above.

## Disclaimer

This project is strictly for educational purposes and is meant to be run locally. Do not use these techniques on systems you do not own or have explicit permission to test.
