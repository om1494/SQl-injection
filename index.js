const express = require('express');
const alasql = require('alasql');
const path = require('path');

const app = express();
const port = 3000;

// ─── In-Memory Database Setup ────────────────────────────────────────────────
alasql('CREATE TABLE products (id INT, name STRING, brand STRING, category STRING, price DECIMAL, stock INT)');

// Laptops
alasql("INSERT INTO products VALUES (1,  'ProBook X360',            'HP',       'Laptops',    899.99, 14)");
alasql("INSERT INTO products VALUES (2,  'MacBook Air M3',          'Apple',    'Laptops',   1199.00,  6)");
alasql("INSERT INTO products VALUES (3,  'ThinkPad X1 Carbon',      'Lenovo',   'Laptops',   1099.50, 10)");
alasql("INSERT INTO products VALUES (4,  'Surface Pro 9',           'Microsoft','Laptops',    999.99,  8)");

// Phones
alasql("INSERT INTO products VALUES (5,  'Galaxy S24 Ultra',        'Samsung',  'Phones',     1299.99,  9)");
alasql("INSERT INTO products VALUES (6,  'iPhone 15 Pro',           'Apple',    'Phones',     1199.00, 15)");
alasql("INSERT INTO products VALUES (7,  'Pixel 8 Pro',             'Google',   'Phones',      899.00, 12)");
alasql("INSERT INTO products VALUES (8,  'OnePlus 12',              'OnePlus',  'Phones',      699.00, 20)");

// Accessories
alasql("INSERT INTO products VALUES (9,  'MX Master 3S Mouse',      'Logitech', 'Accessories',  99.99, 40)");
alasql("INSERT INTO products VALUES (10, 'WH-1000XM5 Headphones',   'Sony',     'Accessories', 349.99, 22)");
alasql("INSERT INTO products VALUES (11, 'QuadCast USB Microphone',  'HyperX',  'Accessories', 129.99, 18)");

// Monitors
alasql("INSERT INTO products VALUES (12, 'Odyssey G7 32\" 4K',      'Samsung',  'Monitors',    649.99,  7)");
alasql("INSERT INTO products VALUES (13, 'UltraSharp U2723D',        'Dell',     'Monitors',    599.00,  5)");

// Hidden / Classified
alasql("INSERT INTO products VALUES (14, '[CLASSIFIED] Admin Panel Credentials', 'Internal', 'Classified', 0.00, 1)");
alasql("INSERT INTO products VALUES (15, '[CLASSIFIED] Vendor API Keys',         'Internal', 'Classified', 0.00, 1)");

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Vulnerable Search Endpoint ───────────────────────────────────────────────
// WARNING: User input is concatenated directly into the SQL string.
// This is intentionally insecure for demonstration purposes.
app.get('/api/products', (req, res) => {
    const category = req.query.category || '';

    //  VULNERABLE: no input sanitisation, no parameterised query
    const query = `SELECT * FROM products WHERE category = '${category}'`;

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
    console.log(`CyberMart running → http://localhost:${port}`);
    console.log(`Challenge: retrieve the Classified records using SQL Injection!`);
});
