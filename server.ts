import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING || process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      collection_name TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(collection_name, doc_id)
    )
  `);
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        console.error("[Server] No file in request");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await pool.query(
        `INSERT INTO images (name, content_type, data) VALUES ($1, $2, $3) RETURNING id`,
        [req.file.originalname, req.file.mimetype, req.file.buffer]
      );

      const imageId = result.rows[0]?.id;
      if (!imageId) {
        throw new Error("Failed to save image");
      }

      const downloadURL = `/api/images/${imageId}`;
      console.log(`[Server] PostgreSQL Upload success. URL: ${downloadURL}`);
      res.json({ url: downloadURL });
    } catch (error: any) {
      console.error("[Server] POSTGRES UPLOAD ERROR:", error);
      res.status(500).json({
        error: error.message || "Internal server error",
        details: error.stack,
      });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT name, content_type, data FROM images WHERE id = $1`,
        [req.params.id]
      );

      const row = result.rows[0];
      if (!row) {
        return res.status(404).send("Image not found");
      }

      res.setHeader('Content-Type', row.content_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(row.data);
    } catch (error) {
      console.error("[Server] Image fetch error:", error);
      res.status(500).send("Error fetching image");
    }
  });

  app.get('/api/collections/:collection', async (req, res) => {
    try {
      const { limit, offset } = req.query;
      let query = `SELECT doc_id, data FROM documents WHERE collection_name = $1`;
      const params: any[] = [req.params.collection];

      if (req.params.collection === 'activities') {
        query += `
          ORDER BY
            CASE
              WHEN data->>'date' ~ '([0-9]{4})年[0-9]{1,2}月[0-9]{1,2}日' THEN
                ((regexp_match(data->>'date', '([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日'))[1]::int * 10000) +
                ((regexp_match(data->>'date', '([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日'))[2]::int * 100) +
                ((regexp_match(data->>'date', '([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日'))[3]::int)
              ELSE 0
            END DESC,
            created_at DESC`;
      } else {
        query += ` ORDER BY created_at DESC`;
      }

      if (limit) {
        const limitVal = parseInt(limit as string);
        if (!isNaN(limitVal)) {
          params.push(limitVal);
          query += ` LIMIT $${params.length}`;
        }
      }
      if (offset) {
        const offsetVal = parseInt(offset as string);
        if (!isNaN(offsetVal)) {
          params.push(offsetVal);
          query += ` OFFSET $${params.length}`;
        }
      }

      const result = await pool.query(query, params);
      const items = result.rows.map((row) => ({ id: row.doc_id, ...row.data }));
      res.json(items);
    } catch (error) {
      console.error('[Server] Collection fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch collection' });
    }
  });

  app.get('/api/collections/:collection/:id', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT data FROM documents WHERE collection_name = $1 AND doc_id = $2 LIMIT 1`,
        [req.params.collection, req.params.id]
      );
      const row = result.rows[0];
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json({ id: req.params.id, ...row.data });
    } catch (error) {
      console.error('[Server] Document fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  });

  app.post('/api/collections/:collection', express.json(), async (req, res) => {
    try {
      const collectionName = req.params.collection;
      const body = req.body;
      const docId = body.id?.toString() || Date.now().toString();
      await pool.query(
        `INSERT INTO documents (collection_name, doc_id, data) VALUES ($1, $2, $3)
         ON CONFLICT (collection_name, doc_id) DO UPDATE SET data = $3, created_at = NOW()`,
        [collectionName, docId, body]
      );
      res.json({ id: docId, ...body });
    } catch (error) {
      console.error('[Server] Document create error:', error);
      res.status(500).json({ error: 'Failed to create document' });
    }
  });

  app.put('/api/collections/:collection/:id', express.json(), async (req, res) => {
    try {
      const collectionName = req.params.collection;
      const docId = req.params.id;
      const body = req.body;
      const result = await pool.query(
        `INSERT INTO documents (collection_name, doc_id, data) VALUES ($1, $2, $3)
         ON CONFLICT (collection_name, doc_id) DO UPDATE SET data = $3`,
        [collectionName, docId, body]
      );
      res.json({ id: docId, ...body });
    } catch (error) {
      console.error('[Server] Document update error:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  });

  app.delete('/api/collections/:collection/:id', async (req, res) => {
    try {
      await pool.query(
        `DELETE FROM documents WHERE collection_name = $1 AND doc_id = $2`,
        [req.params.collection, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('[Server] Document delete error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
