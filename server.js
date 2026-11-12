const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("shop.db");

db.exec(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0
)`);

app.use(express.json());
app.use(express.static("public"));

// sob product dekha
app.get("/api/products", (req, res) => {
  res.json(db.prepare("SELECT * FROM products").all());
});

// notun product add
app.post("/api/products", (req, res) => {
  const { name, price, stock } = req.body;
  const r = db.prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)")
              .run(name, price, stock);
  res.json({ id: r.lastInsertRowid });
});

// product update
app.put("/api/products/:id", (req, res) => {
  const { name, price, stock } = req.body;
  db.prepare("UPDATE products SET name=?, price=?, stock=? WHERE id=?")
    .run(name, price, stock, req.params.id);
  res.json({ ok: true });
});

// product delete
app.delete("/api/products/:id", (req, res) => {
  db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));