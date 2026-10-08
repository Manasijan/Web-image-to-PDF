# Web-image-to-PDF
A lightweight, zero-install browser utility that extracts images from any active webpage, handles CORS &amp; transparency issues, and compiles them into a clean, high-resolution PDF directly from the Developer Console.
## **Features**
- **Dynamic Dimension Matching:** Sizes each PDF page to match the original image resolution and aspect ratio (no awkward white margins).
- **Auto-Sorting:** Orders images naturally as they appear top-to-bottom on the webpage.
- **Noise Filtering:** Ignores small icons, tracker pixels, and avatars (configurable size thresholds).
- **Transparency Fix:** Pre-renders canvas backgrounds with solid white to prevent transparent PNGs from turning black.
- **CORS Fallback:** Automatically switches to raw blob fetching if canvas tainting occurs.
- **Visual Toast UI:** Displays an on-screen progress indicator during generation.
- ## How to Use
1. Navigate to the webpage containing the images you want to save.
2. Open Developer Tools:
   - **Windows/Linux:** Press `F12` or `Ctrl + Shift + I`
   - **macOS:** Press `Cmd + Option + I`
3. Switch to the **Console** tab.
4. Copy the code from [`index.js`](./index.js), paste it into the console, and hit **Enter**.
5. The PDF will compile and download automatically.

## Configuration
You can customize the options at the bottom of the script:
```javascript
await generatePDF({
  selector: 'img',         // CSS selector for targeted scraping
  filename: 'document.pdf',// Custom output name
  minWidth: 200,           // Ignores images narrower than this (px)
  minHeight: 200,          // Ignores images shorter than this (px)
  fitPageToImage: true,    // Set to false for standard A4 pages
});
```

## License
[MIT](LICENSE)
