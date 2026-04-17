import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Import the Firebase configuration
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

// Initialize Firestore with the specific database ID if provided
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId) 
  : getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure Multer for memory storage
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // API Route for Image Upload (Saves to Firestore instead of Storage)
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        console.error("[Server] No file in request");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`[Server] Firestore Upload: ${req.file.originalname}, size: ${req.file.size} bytes`);
      
      // Convert buffer to base64
      const base64Data = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      
      // Save to Firestore 'images' collection
      const imageDoc = db.collection('images').doc();
      await imageDoc.set({
        dataUrl: dataUrl,
        contentType: req.file.mimetype,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        name: req.file.originalname
      });

      // Return the URL to our own Express server endpoint
      const downloadURL = `/api/images/${imageDoc.id}`;
      
      console.log(`[Server] Firestore Upload success. URL: ${downloadURL}`);
      res.json({ url: downloadURL });
    } catch (error: any) {
      console.error("[Server] FIRESTORE UPLOAD ERROR:", error);
      res.status(500).json({ 
        error: error.message || "Internal server error",
        details: error.stack
      });
    }
  });

  // API Route to serve images from Firestore
  app.get("/api/images/:id", async (req, res) => {
    try {
      const doc = await db.collection('images').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).send("Image not found");
      }
      
      const data = doc.data();
      if (!data || !data.dataUrl) {
        return res.status(404).send("Image data missing");
      }
      
      // Extract base64 data
      const base64Data = data.dataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', data.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);
    } catch (error) {
      console.error("[Server] Image fetch error:", error);
      res.status(500).send("Error fetching image");
    }
  });

  // Vite middleware for development
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

startServer();
