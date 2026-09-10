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
  let currentQrFgColor = '#e6edf3';
  let customHexColor = '#bc8cff';
  let copyTimeout = null;
  let qrTimeout = null;
  let downloadTimeout = null;

  const colorBtns = document.querySelectorAll('.btn-color[data-color]');
  const customColorBtn = document.getElementById('custom-color-btn');
  const customColorDot = document.getElementById('custom-color-dot');
  const hexPopover = document.getElementById('hex-popover');
  const hexCloseBtn = document.getElementById('hex-close-btn');
  const hexColorInput = document.getElementById('hex-color-input');
  const hexApplyBtn = document.getElementById('hex-apply-btn');
  const hexPreviewDot = document.getElementById('hex-preview-dot');
  const hexPreviewLabel = document.getElementById('hex-preview-label');
  const hexErrorHint = document.getElementById('hex-error-hint');

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
    if (hexPopover) hexPopover.classList.add('hidden');
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

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentShortUrl);
        copied = true;
      }
    } catch {
      // Fall through to textarea fallback
    }

    if (!copied) {
      try {
        const temp = document.createElement('textarea');
        temp.value = currentShortUrl;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        temp.style.top = `${window.scrollY || document.documentElement.scrollTop || 0}px`;
        document.body.appendChild(temp);
        temp.select();
        temp.setSelectionRange(0, temp.value.length);
        copied = document.execCommand('copy');
        document.body.removeChild(temp);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      copyBtnText.textContent = '[ copied! ]';
      copyBtn.classList.add('btn-copied');
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copyBtnText.textContent = '[ copy ]';
        copyBtn.classList.remove('btn-copied');
      }, 1800);
    } else {
      copyBtnText.textContent = '[ copy failed ]';
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
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

  // Keyboard submission: Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS)
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (submitBtn && submitBtn.disabled) {
        return;
      }
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit(submitBtn);
      } else {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
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
      // Level 'M' provides standard 15% error recovery
      const qr = qrFactory(0, 'M');
      qr.addData(currentShortUrl);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const margin = 4; // ISO/IEC 18004 required quiet zone
      const totalModules = moduleCount + margin * 2;

      // High-resolution canvas rendering (approx 880px - 960px) for crisp display and download
      const minTargetSize = 880;
      const cellSize = Math.max(20, Math.ceil(minTargetSize / totalModules));
      const canvasSize = totalModules * cellSize;

      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      // Theme-blended background using Shortly's terminal dark token #0c0e12
      ctx.fillStyle = '#0c0e12';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Customizable foreground modules (default Shortly text-primary #e6edf3)
      ctx.fillStyle = currentQrFgColor || '#e6edf3';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
          }
        }
      }

      // Lossless high-res PNG data URL
      currentQrDataUrl = canvas.toDataURL('image/png');

      qrImage.src = currentQrDataUrl;
      qrImage.alt = `QR code for ${currentShortUrl}`;
      if (qrDataText) qrDataText.textContent = currentShortUrl;
      if (qrFeedback) qrFeedback.textContent = '[ encoded: short url ]';

      qrSection.classList.remove('hidden');

      // Smooth scroll QR into view on mobile / narrow viewports
      qrSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      qrBtnText.textContent = '> qr ready';
      if (qrTimeout) clearTimeout(qrTimeout);
      qrTimeout = setTimeout(() => {
        qrBtnText.textContent = '[ generate qr ]';
      }, 1800);
    } catch (err) {
      console.error('[Shortly QR Error]', err);
      if (qrFeedback) qrFeedback.textContent = '! failed to generate qr';
      showError('Failed to generate QR code');
    }
  }

  // Helper to normalize and validate 3 or 6 hex digits
  function normalizeHex(val) {
    let clean = (val || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      return '#' + clean.toLowerCase();
    }
    return null;
  }

  // Set QR foreground color and optionally re-render active QR
  function setQrColor(newColor, activeElement) {
    if (!newColor) return;
    currentQrFgColor = newColor;

    // Update active and aria-checked states
    document.querySelectorAll('.btn-color').forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });

    if (activeElement) {
      activeElement.classList.add('active');
      activeElement.setAttribute('aria-checked', 'true');
    }

    // Immediately re-generate QR if code is already displayed
    if (currentShortUrl && qrSection && !qrSection.classList.contains('hidden')) {
      generateQrCode();
    }
  }

  // Apply custom hex color
  function applyCustomHex(rawVal, shouldClosePopover = false) {
    const validHex = normalizeHex(rawVal);
    if (!validHex) {
      if (hexErrorHint) hexErrorHint.textContent = '! invalid hex';
      return false;
    }

    if (hexErrorHint) hexErrorHint.textContent = '';
    customHexColor = validHex;
    if (customColorDot) customColorDot.style.backgroundColor = validHex;
    if (hexPreviewDot) hexPreviewDot.style.backgroundColor = validHex;
    if (hexPreviewLabel) hexPreviewLabel.textContent = validHex;
    if (hexColorInput) hexColorInput.value = validHex.replace(/^#/, '');

    setQrColor(validHex, customColorBtn);

    if (shouldClosePopover && hexPopover) {
      hexPopover.classList.add('hidden');
    }
    return true;
  }

  // Bind color preset buttons
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (hexPopover) hexPopover.classList.add('hidden');
      setQrColor(btn.dataset.color, btn);
    });
  });

  // Toggle custom hex popover
  if (customColorBtn) {
    customColorBtn.addEventListener('click', () => {
      const isCurrentlyOpen = hexPopover && !hexPopover.classList.contains('hidden');
      if (isCurrentlyOpen) {
        hexPopover.classList.add('hidden');
      } else {
        if (hexPopover) {
          hexPopover.classList.remove('hidden');
          if (hexColorInput) {
            hexColorInput.value = customHexColor.replace(/^#/, '');
            hexColorInput.focus();
            hexColorInput.select();
          }
        }
      }
      setQrColor(customHexColor, customColorBtn);
    });
  }

  // Close custom hex popover button
  if (hexCloseBtn) {
    hexCloseBtn.addEventListener('click', () => {
      if (hexPopover) hexPopover.classList.add('hidden');
      if (customColorBtn) customColorBtn.focus();
    });
  }

  // Live input in custom hex field
  if (hexColorInput) {
    hexColorInput.addEventListener('input', (e) => {
      const raw = e.target.value.trim();
      const valid = normalizeHex(raw);
      if (valid) {
        if (hexErrorHint) hexErrorHint.textContent = '';
        if (hexPreviewDot) hexPreviewDot.style.backgroundColor = valid;
        if (hexPreviewLabel) hexPreviewLabel.textContent = valid;
        if (customColorDot) customColorDot.style.backgroundColor = valid;
        customHexColor = valid;
        setQrColor(valid, customColorBtn);
      } else {
        if (raw.length > 0) {
          const clean = raw.replace(/^#/, '');
          if (!/^[0-9a-fA-F#]+$/.test(raw)) {
            if (hexErrorHint) hexErrorHint.textContent = '! 0-9, a-f only';
          } else if (clean.length > 6) {
            if (hexErrorHint) hexErrorHint.textContent = '! max 6 digits';
          } else {
            if (hexErrorHint) hexErrorHint.textContent = '';
          }
        } else {
          if (hexErrorHint) hexErrorHint.textContent = '';
        }
      }
    });

    hexColorInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomHex(hexColorInput.value, true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (hexPopover) hexPopover.classList.add('hidden');
        if (customColorBtn) customColorBtn.focus();
      }
    });
  }

  if (hexApplyBtn) {
    hexApplyBtn.addEventListener('click', () => {
      applyCustomHex(hexColorInput.value, true);
    });
  }

  // Download QR code as PNG image
  function downloadQrCode() {
    if (!currentQrDataUrl || !currentShortCode) return;

    try {
      const filename = `shortly-${currentShortCode}-qr.png`;
      const downloadLink = document.createElement('a');
      downloadLink.href = currentQrDataUrl;
      downloadLink.download = filename;
      downloadLink.rel = 'noopener';
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

  // Keyboard shortcut: Escape to close hex popover or reset workspace
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (hexPopover && !hexPopover.classList.contains('hidden')) {
        hexPopover.classList.add('hidden');
        if (customColorBtn) customColorBtn.focus();
        return;
      }
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
