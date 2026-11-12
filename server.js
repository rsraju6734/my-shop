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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

// admin page ar admin API lock korar function
function checkAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const encoded = auth.split(" ")[1] || "";
  const decoded = Buffer.from(encoded, "base64").toString();
  const password = decoded.split(":")[1];

  if (password === ADMIN_PASSWORD) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Admin"');
  res.status(401).send("Password dao");
}

// admin.html lock
app.get("/admin.html", checkAuth, (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

app.use(express.static("public"));

// sob product dekha (shobai dekhte parbe)
app.get("/api/products", (req, res) => {
  res.json(db.prepare("SELECT * FROM products").all());
});

// notun product add (password lagbe)
app.post("/api/products", checkAuth, (req, res) => {
  const { name, price, stock } = req.body;
  const r = db.prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)")
              .run(name, price, stock);
  res.json({ id: r.lastInsertRowid });
});

// product update (password lagbe)
app.put("/api/products/:id", checkAuth, (req, res) => {
  const { name, price, stock } = req.body;
  db.prepare("UPDATE products SET name=?, price=?, stock=? WHERE id=?")
    .run(name, price, stock, req.params.id);
  res.json({ ok: true });
});

// product delete (password lagbe)
app.delete("/api/products/:id", checkAuth, (req, res) => {
  db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));