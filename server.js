const express = require("express");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    stock INTEGER DEFAULT 0
  )`);
}

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
app.get("/api/products", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM products ORDER BY id");
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// notun product add (password lagbe)
app.post("/api/products", checkAuth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const r = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING id",
      [name, price, stock]
    );
    res.json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// product update (password lagbe)
app.put("/api/products/:id", checkAuth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    await pool.query(
      "UPDATE products SET name=$1, price=$2, stock=$3 WHERE id=$4",
      [name, price, stock, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// product delete (password lagbe)
app.delete("/api/products/:id", checkAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 3000;
setupDb()
  .then(() => app.listen(PORT, () => console.log("Running on " + PORT)))
  .catch((e) => {
    console.error("Database connect hoy ni:", e);
    process.exit(1);
  });