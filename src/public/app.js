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

  const errorCard = document.getElementById('error-card');
  const errorMessage = document.getElementById('error-message');

  const apiStatusVal = document.getElementById('api-status-val');
  const serviceStatusVal = document.getElementById('service-status-val');
  const latencyVal = document.getElementById('latency-val');

  let currentShortUrl = '';
  let copyTimeout = null;

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

  function hideOutputs() {
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
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

  // Copy button listener
  copyBtn.addEventListener('click', copyToClipboard);

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
