const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is not set"); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: /sslmode=|ssl=true/.test(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined });

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/todos", async (_req, res, next) => {
  try { res.json((await pool.query("SELECT id, title, created_at FROM todos ORDER BY id DESC")).rows); } catch (e) { next(e); }
});
app.post("/api/todos", async (req, res, next) => {
  const title = req.body && req.body.title;
  if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title is required" });
  try { res.status(201).json((await pool.query("INSERT INTO todos (title) VALUES ($1) RETURNING id, title, created_at", [title.trim()])).rows[0]); } catch (e) { next(e); }
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "Internal server error" }); });
app.listen(process.env.PORT || 3000, () => console.log("Todo server up"));
