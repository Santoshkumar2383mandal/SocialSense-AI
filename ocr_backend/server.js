// ocr-backend/server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/ocr", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const buffer = req.file.buffer;

    const result = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
    });

    const text = (result.data.text || "").trim();

    if (!text) {
      return res.status(400).json({
        error:
          "No text could be extracted from the image. Try a clearer image with visible text.",
      });
    }

    res.json({ text });
  } catch (err) {
    console.error("OCR backend error:", err);
    res.status(500).json({
      error: err?.message || "Failed to perform OCR",
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`OCR backend running on http://localhost:${PORT}`);
});
