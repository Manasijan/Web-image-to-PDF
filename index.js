(async () => {
  // 1. Load jsPDF with Trusted Types support
  const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const policy = window.trustedTypes
    ? trustedTypes.createPolicy('pdfPolicy', { createScriptURL: (url) => url })
    : null;

  const loadScript = (url) =>
    new Promise((resolve, reject) => {
      if (window.jspdf) return resolve();
      const script = document.createElement('script');
      script.src = policy ? policy.createScriptURL(url) : url;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  await loadScript(scriptUrl);
  const { jsPDF } = window.jspdf;

  // 2. Simple on-screen progress toast
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 18px',
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    fontSize: '13px',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  });
  document.body.appendChild(toast);
  const updateStatus = (msg) => (toast.innerText = msg);

  // 3. Robust image-to-data-URL extractor
  async function extractImageData(img) {
    if (!img.complete) await img.decode().catch(() => {});

    // Primary: Canvas drawing with white background (fixes transparent PNGs)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.95);
      canvas.remove();
      return { data, width: img.naturalWidth, height: img.naturalHeight };
    } catch (err) {
      // Fallback: If canvas was tainted by CORS, fetch directly as blob
      const res = await fetch(img.src);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            data: reader.result,
            width: img.naturalWidth || 800,
            height: img.naturalHeight || 1100,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  }

  // 4. Main PDF Compiler
  async function generatePDF({
    selector = 'img',
    filename = 'compiled_document.pdf',
    minWidth = 150,
    minHeight = 150,
    fitPageToImage = true,
  } = {}) {
    updateStatus('Scanning page for images...');

    // Collect and filter out decorative icons, avatars, and hidden elements
    const images = Array.from(document.querySelectorAll(selector))
      .filter((img) => {
        const isVisible = img.offsetParent !== null || img.getClientRects().length > 0;
        const isLargeEnough = (img.naturalWidth >= minWidth && img.naturalHeight >= minHeight);
        return isVisible && isLargeEnough;
      })
      // Ensure top-to-bottom reading order
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    if (images.length === 0) {
      updateStatus('⚠️ No valid images found.');
      setTimeout(() => toast.remove(), 4000);
      return;
    }

    let pdf = null;

    for (let i = 0; i < images.length; i++) {
      updateStatus(`Adding page ${i + 1} of ${images.length}...`);
      try {
        const { data, width, height } = await extractImageData(images[i]);

        if (!pdf) {
          // Initialize PDF matching the orientation & dimensions of the first image
          pdf = fitPageToImage
            ? new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'px', format: [width, height] })
            : new jsPDF({ unit: 'px', format: 'a4' });
        } else {
          pdf.addPage(fitPageToImage ? [width, height] : 'a4', width > height ? 'l' : 'p');
        }

        if (fitPageToImage) {
          pdf.addImage(data, 'JPEG', 0, 0, width, height);
        } else {
          const { width: pW, height: pH } = pdf.internal.pageSize;
          const scale = Math.min(pW / width, pH / height);
          const w = width * scale;
          const h = height * scale;
          pdf.addImage(data, 'JPEG', (pW - w) / 2, (pH - h) / 2, w, h);
        }
      } catch (e) {
        console.warn(`Skipped image ${i + 1} due to error:`, e);
      }
    }

    updateStatus('Saving PDF...');
    pdf.save(filename);
    updateStatus('✅ Complete!');
    setTimeout(() => toast.remove(), 3000);
  }

  // Run the compiler
  await generatePDF({
    selector: 'img',
    filename: `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'download'}.pdf`,
    minWidth: 200,
    minHeight: 200,
    fitPageToImage: true, // Set to false if you want fixed standard A4 pages
  });
})();