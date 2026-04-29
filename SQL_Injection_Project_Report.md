# SQL Injection Demonstration — Project Report

---

## Abstract

SQL Injection (SQLi) is one of the most prevalent and dangerous vulnerabilities in modern web applications. Despite decades of awareness, it consistently ranks at the top of the OWASP Top 10 list of critical web application security risks. This project presents a hands-on, educational mini-application designed to demonstrate how SQL Injection vulnerabilities arise, how they can be exploited, and why proper mitigation is essential.

The application simulates a realistic electronics catalogue browsing scenario — named **CyberMart** — where an attacker can manipulate a database query through unsanitized user input, ultimately exposing data that is not intended for public access, including classified administrative records. The project is implemented using **Node.js**, **Express**, and **AlaSQL** (an in-memory SQL engine), and is intended strictly for educational and research purposes in a controlled, local environment.

---

## Introduction

SQL Injection is a code-injection technique in which an attacker inserts or "injects" malicious SQL statements into an input field, causing the backend database to execute unintended commands. First documented in the late 1990s, SQLi attacks have been responsible for some of the most high-profile data breaches in history, including incidents at Sony, LinkedIn, and Yahoo.

The vulnerability exists because many web applications construct SQL queries by directly concatenating user-provided input into the query string — without validation, sanitization, or the use of parameterized statements. This allows an attacker to alter the logical structure of the query, bypassing authentication, exfiltrating sensitive data, or even dropping entire database tables.

### Objectives of this Project

1. Illustrate how SQL Injection vulnerabilities are introduced at the code level through improper string concatenation.
2. Demonstrate two practical exploitation scenarios using distinct payload techniques to produce different outputs.
3. Highlight the difference between the vulnerable implementation and the secure alternative (parameterized queries).
4. Serve as an educational reference for students and developers learning about web application security.

---

## Technical Requirements

### Software Dependencies

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.x |
| Web Framework | Express | ^5.2.1 |
| In-memory Database | AlaSQL | ^4.17.2 |
| Package Manager | npm | Bundled with Node.js |

### Hardware Requirements

- Any standard computer capable of running Node.js (no special hardware required).
- A modern web browser (Chrome, Firefox, Edge, etc.) for accessing the frontend.

### Environment

- The application runs entirely **locally** on `http://localhost:3000`.
- No external database server (MySQL, PostgreSQL, etc.) is required — AlaSQL operates as a purely in-memory SQL engine, making setup zero-configuration.
- No authentication, HTTPS, or production infrastructure is used, as this is a local educational tool.

---

## Implementation

> **Note:** This section covers only the **logical/backend implementation**. UI design is excluded.

### 1. In-Memory Database Setup

The application uses **AlaSQL** to simulate a relational database entirely in memory. Upon server startup, a `products` table is created with the following schema:

```
products (id INT, name STRING, brand STRING, category STRING, price DECIMAL, stock INT)
```

Thirteen product records are seeded into this table across four categories: `Laptops`, `Phones`, `Accessories`, and `Monitors`. Two additional records exist in a `Classified` category:

```
(14, '[CLASSIFIED] Admin Panel Credentials', 'Internal', 'Classified', 0.00, 1)
(15, '[CLASSIFIED] Vendor API Keys', 'Internal', 'Classified', 0.00, 1)
```

These classified records represent sensitive data that should never be visible to a regular user — and are the primary targets of the SQL Injection attacks. They are never returned by a normal, legitimate category filter because no UI option corresponds to the `Classified` category.

---

### 2. The Vulnerable API Endpoint

The core vulnerability lives in the `/api/products` GET endpoint in `index.js`. When the frontend sends a request, the server reads the `category` query parameter directly from the URL and **concatenates it unsanitized** into a raw SQL string:

```javascript
const category = req.query.category || '';

// VULNERABLE: Direct string concatenation — no sanitization, no parameterization
const query = `SELECT * FROM products WHERE category = '${category}'`;

const rows = alasql(query);
res.json(rows);
```

**Why this is dangerous:**  
The `category` variable is user-controlled. There is no validation, escaping, or use of parameterized queries. The `${category}` template literal directly embeds whatever the user sends into the SQL string. This gives the attacker full control over the SQL query's logical structure.

---

### 3. The Attacks — Two SQL Injection Payloads

A normal request looks like this:

```
GET /api/products?category=Laptops
```

Which generates the safe query:

```sql
SELECT * FROM products WHERE category = 'Laptops'
```

This project demonstrates two distinct injection techniques, each producing a different result:

---

#### Payload 1 — Full Dump (`' OR '1'='1`)

An attacker sends:

```
GET /api/products?category=' OR '1'='1
```

Which causes the server to construct:

```sql
SELECT * FROM products WHERE category = '' OR '1'='1'
```

**Query Logic Breakdown:**

| Clause | Evaluation |
|---|---|
| `category = ''` | `FALSE` — no product has an empty category |
| `OR '1'='1'` | `TRUE` — this is a tautology; always evaluates to true |
| Combined result | `FALSE OR TRUE` = **`TRUE` for every row** |

**Result:** All 15 products are returned, including both `[CLASSIFIED]` restricted records.

---

#### Payload 2 — Targeted Leak (`' OR category='Classified`)

An attacker sends:

```
GET /api/products?category=' OR category='Classified
```

Which causes the server to construct:

```sql
SELECT * FROM products WHERE category = '' OR category='Classified'
```

**Query Logic Breakdown:**

| Clause | Evaluation |
|---|---|
| `category = ''` | `FALSE` — no product has an empty category |
| `OR category='Classified'` | `TRUE` only for classified records |
| Combined result | Returns **only the 2 classified products** |

**Result:** A precise, targeted leak — the attacker retrieves only the hidden records without exposing all other data. This is a more surgical attack compared to Payload 1.

---

### 4. Error Handling & Query Logging

The server wraps query execution in a `try/catch` block. If the injected SQL is syntactically invalid (e.g., an incomplete payload that breaks the SQL grammar), AlaSQL throws an exception. The server catches this and responds with an HTTP `500` status, returning the error message and the malformed query string in the JSON response:

```javascript
catch (err) {
    res.status(500).json({ error: err.message, executedQuery: query });
}
```

This is itself a secondary vulnerability — **verbose error messages** expose the raw SQL query to the attacker, giving them valuable information to refine their payload. In production systems, such internal errors must never be exposed to the client.

All executed queries are also logged to the server console for educational observation:

```javascript
console.log(`[SQL Executed] ${query}`);
```

---

### 5. Frontend Request Flow (Logical)

The frontend (`app.js`) sends the user's input to the backend API via `fetch`. Notably, it uses `encodeURIComponent()` on the category string before embedding it in the URL:

```javascript
const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
```

`encodeURIComponent` handles **URL encoding** (e.g., spaces → `%20`, `&` → `%26`) but does **not** prevent SQL Injection. The server still decodes the URL parameter back into its original string before concatenating it into the SQL query. This is a common misconception — URL encoding is not a security control against SQLi.

The frontend also includes two **click-to-copy payload chips** that auto-fill the attack input, copy the payload to the clipboard, and execute the search immediately — making it easy to demonstrate each injection technique live.

---

### 6. The Secure Alternative (Parameterized Queries)

For comparison and learning, the correct, secure approach uses **parameterized queries** (also called prepared statements), where user input is passed separately from the query structure:

```javascript
// SECURE: User input is bound as a parameter, not concatenated
const rows = alasql('SELECT * FROM products WHERE category = ?', [category]);
```

With this approach, the database engine treats the `?` placeholder as a **data value only** — never as executable SQL syntax. Even if the user submits `' OR '1'='1`, it is interpreted as a literal string to compare against the `category` column, not as SQL logic. The query would then return zero rows, as expected, completely neutralizing all injection attempts demonstrated in this project.

---

## Conclusion

This project successfully demonstrates one of the most fundamental yet devastating web application vulnerabilities — SQL Injection. Through a deliberately vulnerable electronics search feature (**CyberMart**), it illustrates how a single line of insecure code — a string concatenation in a database query — can expose an entire database to an attacker using multiple different techniques.

Key takeaways from this project:

- **Root Cause:** SQL Injection is caused by mixing **code** and **data** — embedding untrusted user input directly into SQL statements.
- **Impact:** Even in this minimal simulation, the attacks leak classified records that normal users were never supposed to see. In real applications, this can mean leaking millions of user credentials, financial records, or personally identifiable information (PII).
- **Multiple Techniques, Different Outputs:** The same underlying vulnerability can be exploited in different ways — a full dump and a targeted category leak all succeed via the same root cause but return different data subsets.
- **URL Encoding ≠ Security:** `encodeURIComponent` protects against URL-format issues but offers no protection against SQLi once the server decodes and uses the value.
- **Verbose Errors Are Dangerous:** Returning raw SQL errors to the client is itself a vulnerability, as it aids attackers in crafting valid payloads.
- **The Fix Is Simple:** Parameterized queries (prepared statements) completely eliminate SQLi by separating code from data. This should be the standard practice in every application that interacts with a database.

Understanding how these attacks work is the first step toward building secure systems. This project reinforces that security must be considered at every stage of development, not as an afterthought.

---

## References

1. **OWASP Foundation** — *SQL Injection*  
   https://owasp.org/www-community/attacks/SQL_Injection

2. **OWASP Top 10: A03 — Injection**  
   https://owasp.org/Top10/A03_2021-Injection/

3. **OWASP SQL Injection Prevention Cheat Sheet**  
   https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

4. **NIST National Vulnerability Database — SQL Injection**  
   https://nvd.nist.gov/vuln/search/results?query=sql+injection

5. **PortSwigger Web Security Academy — SQL Injection**  
   https://portswigger.net/web-security/sql-injection

6. **W3Schools — SQL Injection**  
   https://www.w3schools.com/sql/sql_injection.asp

7. **MITRE CWE-89: Improper Neutralization of Special Elements used in an SQL Command**  
   https://cwe.mitre.org/data/definitions/89.html

8. **MDN Web Docs — Security: SQL Injection**  
   https://developer.mozilla.org/en-US/docs/Glossary/SQL_Injection

9. **AlaSQL Documentation**  
   https://github.com/AlaSQL/alasql

10. **Express.js Official Documentation**  
    https://expressjs.com/

---

*This report and the associated project are strictly for educational purposes. The techniques described must only be used in controlled, authorized environments.*
