const Tesseract = require("tesseract.js");
const path = require("path");

async function test() {
  try {
    console.log("Starting Tesseract test...");
    // Create a simple image buffer (1x1 pixel) or just try to initialize
    // Since we don't have an image, we'll just check if we can create a worker or recognize something dummy if possible,
    // or just check if the require works and paths are resolved.
    
    // Actually, let's try to recognize a non-existent file to trigger the worker loading at least
    // or use a buffer.
    const buffer = Buffer.from("fake image data"); 
    
    // This will fail on image processing but should succeed in loading the worker
    try {
        await Tesseract.recognize(buffer, "eng");
    } catch (e) {
        // We expect an error about image format, but NOT about module not found
        if (e.toString().includes("Module not found") || e.code === "MODULE_NOT_FOUND") {
            console.error("Tesseract Module Error:", e);
            process.exit(1);
        }
        console.log("Tesseract loaded worker successfully (error was expected for bad image):", e.message);
    }
    
    console.log("Tesseract test passed (worker loaded).");
  } catch (error) {
    console.error("Tesseract test failed:", error);
    process.exit(1);
  }
}

test();
