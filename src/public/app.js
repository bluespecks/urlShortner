/**
 * Shortly - Minimal Unix-inspired Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shorten-form');
  const urlInput = document.getElementById('url-input');
  const submitBtn = document.getElementById('submit-btn');
  const submitBtnText = document.getElementById('submit-btn-text');

  const stateTag = document.getElementById('state-tag');
  const stateDetail = document.getElementById('state-detail');

  const resultCard = document.getElementById('result-card');
  const resultTimestamp = document.getElementById('result-timestamp');
  const shortUrlLink = document.getElementById('short-url-link');
  const originalUrlDisplay = document.getElementById('original-url-display');
  const copyBtn = document.getElementById('copy-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const openBtn = document.getElementById('open-btn');
  const qrBtn = document.getElementById('qr-btn');
  const qrBtnText = document.getElementById('qr-btn-text');

  const qrSection = document.getElementById('qr-section');
  const qrImage = document.getElementById('qr-image');
  const qrFeedback = document.getElementById('qr-feedback');
  const qrDataText = document.getElementById('qr-data-text');
  const downloadQrBtn = document.getElementById('download-qr-btn');
  const downloadQrBtnText = document.getElementById('download-qr-btn-text');

  const errorCard = document.getElementById('error-card');
  const errorMessage = document.getElementById('error-message');

  const apiStatusVal = document.getElementById('api-status-val');
  const serviceStatusVal = document.getElementById('service-status-val');
  const latencyVal = document.getElementById('latency-val');

  let currentShortUrl = '';
  let currentShortCode = '';
  let currentQrDataUrl = '';
  let copyTimeout = null;
  let qrTimeout = null;
  let downloadTimeout = null;

  // Auto-focus input on page load
  if (urlInput) {
    urlInput.focus();
  }

  // Set visual state
  function setState(state, detailText) {
    stateTag.className = 'state-tag';
    switch (state) {
      case 'loading':
        stateTag.classList.add('state-loading');
        stateTag.textContent = 'GENERATING';
        stateDetail.textContent = detailText || 'request dispatched...';
        break;
      case 'created':
        stateTag.classList.add('state-success');
        stateTag.textContent = 'CREATED';
        stateDetail.textContent = detailText || 'short url ready';
        break;
      case 'error':
        stateTag.classList.add('state-error');
        stateTag.textContent = 'ERROR';
        stateDetail.textContent = detailText || 'check input and retry';
        break;
      case 'ready':
      default:
        stateTag.classList.add('state-ready');
        stateTag.textContent = 'READY';
        stateDetail.textContent = detailText || 'less url. more signal.';
        break;
    }
  }

  function resetQrSection() {
    if (qrSection) qrSection.classList.add('hidden');
    currentQrDataUrl = '';
    if (qrImage) {
      qrImage.removeAttribute('src');
      qrImage.alt = 'QR code';
    }
    if (qrDataText) qrDataText.textContent = '';
    if (qrFeedback) qrFeedback.textContent = '[ encoded: short url ]';
    if (qrBtnText) qrBtnText.textContent = '[ generate qr ]';
    if (downloadQrBtnText) downloadQrBtnText.textContent = '[ download qr ]';
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      qrTimeout = null;
    }
    if (downloadTimeout) {
      clearTimeout(downloadTimeout);
      downloadTimeout = null;
    }
  }

  function hideOutputs() {
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    resetQrSection();
  }

  function showError(msg) {
    hideOutputs();
    errorMessage.textContent = msg;
    errorCard.classList.remove('hidden');
    setState('error', msg);
  }

  function showResult(data) {
    hideOutputs();
    currentShortUrl = data.shortUrl;
    currentShortCode = data.shortCode;

    shortUrlLink.href = data.shortUrl;
    shortUrlLink.textContent = data.shortUrl;

    openBtn.href = data.shortUrl;
    originalUrlDisplay.textContent = data.originalUrl;
    resultTimestamp.textContent = new Date().toLocaleTimeString();

    resultCard.classList.remove('hidden');
    setState('created', `code: ${data.shortCode}`);
  }

  // Copy Short URL to clipboard
  async function copyToClipboard() {
    if (!currentShortUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentShortUrl);
      } else {
        // Fallback for non-https/legacy
        const temp = document.createElement('textarea');
        temp.value = currentShortUrl;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }

      copyBtnText.textContent = '> copied';
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copyBtnText.textContent = '[ copy ]';
      }, 1800);
    } catch {
      copyBtnText.textContent = '! failed';
      setTimeout(() => {
        copyBtnText.textContent = '[ copy ]';
      }, 1800);
    }
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalUrl = urlInput.value.trim();

    if (!originalUrl) {
      showError('originalUrl is required');
      urlInput.focus();
      return;
    }

    // Client-side quick check
    if (!/^https?:\/\//i.test(originalUrl)) {
      showError('url must begin with http:// or https://');
      urlInput.focus();
      return;
    }

    // Loading state
    hideOutputs();
    setState('loading', 'generating short code...');
    submitBtn.disabled = true;
    submitBtnText.textContent = '[ generating... ]';

    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || 'something went wrong');
      } else {
        showResult(data);
        urlInput.select();
      }
    } catch {
      showError('unable to reach api');
    } finally {
      submitBtn.disabled = false;
      submitBtnText.textContent = '[ ↵ shorten ]';
    }
  });

  // Generate QR code client-side from currentShortUrl
  function generateQrCode() {
    if (!currentShortUrl) return;

    try {
      const qrFactory = window.qrcode || (typeof qrcode !== 'undefined' ? qrcode : null);
      if (typeof qrFactory !== 'function') {
        throw new Error('QR generator module unavailable');
      }

      // Generate QR code from the generated shortUrl (never the original long URL)
      const qr = qrFactory(0, 'M');
      qr.addData(currentShortUrl);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const margin = 4;
      const totalModules = moduleCount + margin * 2;
      const cellSize = 8;
      const canvasSize = totalModules * cellSize;

      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      // Quiet zone with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Dark modules
      ctx.fillStyle = '#000000';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
          }
        }
      }

      // Convert to lossless PNG data URL
      currentQrDataUrl = canvas.toDataURL('image/png');

      qrImage.src = currentQrDataUrl;
      qrImage.alt = `QR code for ${currentShortUrl}`;
      qrDataText.textContent = currentShortUrl;
      qrFeedback.textContent = '[ encoded: short url ]';

      qrSection.classList.remove('hidden');

      qrBtnText.textContent = '> qr ready';
      if (qrTimeout) clearTimeout(qrTimeout);
      qrTimeout = setTimeout(() => {
        qrBtnText.textContent = '[ generate qr ]';
      }, 1800);
    } catch (err) {
      console.error('[Shortly QR Error]', err);
      qrFeedback.textContent = '! failed to generate qr';
      showError('Failed to generate QR code');
    }
  }

  // Download QR code as PNG image
  function downloadQrCode() {
    if (!currentQrDataUrl || !currentShortCode) return;

    try {
      const filename = `shortly-${currentShortCode}-qr.png`;
      const downloadLink = document.createElement('a');
      downloadLink.href = currentQrDataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      downloadQrBtnText.textContent = '> downloaded';
      if (downloadTimeout) clearTimeout(downloadTimeout);
      downloadTimeout = setTimeout(() => {
        downloadQrBtnText.textContent = '[ download qr ]';
      }, 1800);
    } catch (err) {
      console.error('[Shortly QR Download Error]', err);
      downloadQrBtnText.textContent = '! download failed';
      if (downloadTimeout) clearTimeout(downloadTimeout);
      downloadTimeout = setTimeout(() => {
        downloadQrBtnText.textContent = '[ download qr ]';
      }, 1800);
    }
  }

  // Copy button listener
  copyBtn.addEventListener('click', copyToClipboard);

  // QR button listeners
  if (qrBtn) {
    qrBtn.addEventListener('click', generateQrCode);
  }
  if (downloadQrBtn) {
    downloadQrBtn.addEventListener('click', downloadQrCode);
  }

  // Keyboard shortcut: Escape to reset
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideOutputs();
      setState('ready');
      urlInput.value = '';
      urlInput.focus();
    }
  });

  // Poll system status via /health
  async function checkHealth() {
    const startTime = performance.now();
    try {
      const res = await fetch('/health');
      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        apiStatusVal.innerHTML = '<span class="dot-status online" aria-hidden="true">●</span> online';
        serviceStatusVal.textContent = data.service || 'Shortly';
        latencyVal.textContent = `${latency} ms`;
      } else {
        throw new Error('Health check non-200');
      }
    } catch {
      apiStatusVal.innerHTML = '<span class="dot-status offline" aria-hidden="true">●</span> offline';
      latencyVal.textContent = '-- ms';
    }
  }

  // Initial health check
  checkHealth();
});
