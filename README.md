# Social Media Content Analyzer

This project is a simple and practical tool that helps users evaluate and improve their social media content. It accepts PDFs and images, extracts the text, and provides useful suggestions to make posts more engaging. The goal is to give creators clear insights before publishing anything.


## Features

### 📄 Document Upload
- PDF Files: Extract text from PDF documents with formatting preservation
- Image Files: Support for PNG, JPG, JPEG, and WEBP formats
- Drag & Drop: Intuitive drag-and-drop interface
- File Picker: Traditional file selection button

### 🔍 Text Extraction
- PDF Parsing:  Extracted using `pdf-parse`
- Image OCR: Processed through a lightweight OCR backend using Express and Tesseract.js

### 🤖 AI-Powered Analysis
- Gemini 2.0 Flash : Generates summary, score, suggestions, ideas, hashtags
  - Generates a summary
  - Gives an engagement score
  - Suggests improvements
  - Offers content ideas
  - Provides hashtags
###  User Experience
- Loading States: Visual feedback during file processing
- Error Handling: Clear error messages for invalid files or processing failures
- Modern UI: Beautiful, responsive design with smooth animations
- Copy to Clipboard: Easy text copying functionality

## How It Works

1. **Upload** a PDF or image via drag-and-drop or the file picker (5 MB cap)
2. **Extract Text**
   - PDFs stay on the Next.js API route and go through `pdf-parse`
   - Images are streamed to the standalone `ocr-backend` (Express + Tesseract)
3. **Analyze**
   - Normalized text is sent to Gemini (when `GEMINI_API_KEY` is present)
   - Otherwise, the rule-based engine scores the copy locally
4. **Display** the insights, suggestions, ideas, hashtags, and original text

## Prerequisites

- Node.js 18+
- npm (or pnpm / bun / yarn)
- Google Gemini API Key 

## Installation & Local Dev

1. **Install root dependencies**
   npm install

2. **Install OCR backend dependencies**
   cd ocr-backend
   npm install

3. **Environment variables** (`.env.local`)
   GEMINI_API_KEY=your_gemini_api_key  
   OCR_BACKEND_URL=http://localhost:5001

4. **Start the OCR backend**
   cd ocr-backend
   npm start

5. **Start the Next.js app (root folder)**
   npm run debv

6. Visit [http://localhost:3000](http://localhost:3000) and upload a PDF/image.

> Need to verify Tesseract is installed properly? Run `node scripts/test-tesseract.js`.

## Project Structure

Root/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts   # Upload parsing + AI/rule analysis
│   │   └── page.tsx               # Landing page + workflow
│   ├── components/
│   │   ├── upload-zone.tsx        # Drag/drop UI + manual analyze flow
│   │   └── analysis-result.tsx    # Insight cards
│   └── lib/utils.ts
├── ocr-backend/
│   ├── server.js                  # Express + multer + tesseract.js
│   └── package.json
├── scripts/test-tesseract.js      # Smoke test for OCR worker
├── README.md
└── …

## Technologies Used

- **Next.js 16 + TypeScript** for the UI & API routes
- **Tailwind, Framer Motion, React Dropzone** for modern UX
- **pdf-parse** for PDF text extraction
- **Express + Tesseract.js** for OCR (deployed separately)
- **Google Gemini 2.0 Flash** (optional) for deeper analysis

## API Endpoint

`POST /api/analyze`

- Accepts `FormData` with a single `file`
- Detects PDF vs. image and routes accordingly
- Responds with:
  {
    "text": "Extracted text content...",
    "analysis": {
      "summary": "string",
      "score": 72,
      "suggestions": ["string"],
      "trendingIdeas": ["string"],
      "hashtags": ["#tag"]
    }
  }

## Error Handling

- Frontend enforces file type + size and shows inline errors
- Upload API validates MIME type, size, extraction length, OCR failures
- Gemini failures fall back to rule-based analysis instead of crashing
- Detailed logs are written on the server for PDF/OCR/AI issues

## Building & Deployment

npm run build   # Next.js production build
npm start       # start Next.js server

## Deployment

**Frontend (Next.js App) – Vercel**
The main application is deployed on **Vercel**.  
Make sure to set the following environment variables in your Vercel project:

- `GEMINI_API_KEY`  
- `OCR_BACKEND_URL=https://<your-render-ocr-url>/ocr`

Once these are in place, Vercel will handle the build and hosting of the UI and API routes.

**OCR Backend – Render**
The OCR service (Express + Tesseract.js) is deployed separately on **Render**.  
Render automatically assigns a live URL once the service is deployed.

Set this environment variable in Render:

- `PORT` (only if Render requires it, otherwise it defaults)

Also make sure the container can access the required Tesseract language data.  
Most setups work without extra configuration, but if needed you can mount or include `eng.traineddata`.

After deployment:

- Copy your Render service URL  
- Append `/ocr`  
- Use this full URL in your Next.js environment variable:


## Limitations

- OCR quality depends on source clarity; blurry photos may fail
- PDF uploads larger than 5 MB are rejected to avoid timeouts
- Gemini usage requires a valid API key and counts against your quota
- Currently supports a single file per analysis

## Approach & Tools (≤200 words)

My approach was to keep the system simple, fast, and reliable by separating the heavy processing from the main application. All uploads are handled through a single Next.js API route. This route checks the file type, size limit, and validity. PDF files are processed directly using pdf-parse, while images are forwarded to a lightweight OCR backend built with Express, Multer, and Tesseract.js. This split ensures the Next.js app stays responsive and avoids bundling large OCR libraries.

After extracting the text, I normalize it to remove unnecessary spacing while also keeping the original text available for the user. The analysis layer works in two ways. By default, a rule-based scoring system looks at things like word count, hashtags, emojis, and links to generate practical suggestions and ideas. If a Gemini API key is available, I send the text to the Gemini 2.0 Flash model for a richer and more personalized analysis. If Gemini fails, the app automatically falls back to the rule-based output.

On the frontend, I focused on a clean and smooth user experience using Tailwind CSS and Framer Motion. The interface supports drag-and-drop uploads, clear feedback messages, and easy navigation so users can quickly understand their content insights.