(() => {
    'use strict';

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const categorySelect = document.getElementById('categorySelect');
    const customInput    = document.getElementById('customInput');
    const searchBtn      = document.getElementById('searchBtn');
    const liveVal        = document.getElementById('liveVal');
    const productGrid    = document.getElementById('productGrid');
    const loader         = document.getElementById('loader');
    const errorBox       = document.getElementById('errorBox');
    const errorMsg       = document.getElementById('errorMsg');
    const resultsCount   = document.getElementById('resultsCount');

    const categoryEmoji = {
        'Laptops':     '💻',
        'Phones':      '📱',
        'Accessories': '🎧',
        'Monitors':    '🖥️',
        'Classified':  '🔒',
    };

    // ── Initial load ──────────────────────────────────────────────────────────
    runSearch(categorySelect.value);

    // ── Payload chip click-to-copy & auto-run ─────────────────────────────────
    document.querySelectorAll('.payload-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const payload = chip.dataset.payload;

            customInput.value = payload;
            updateLiveQuery(payload);
            runSearch(payload);

            navigator.clipboard.writeText(payload).catch(() => {
                const tmp = document.createElement('textarea');
                tmp.value = payload;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
            });

            chip.classList.add('copied');
            const copyIcon = chip.querySelector('.chip-copy');
            if (copyIcon) {
                copyIcon.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
            }

            setTimeout(() => {
                chip.classList.remove('copied');
                if (copyIcon) {
                    copyIcon.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                }
            }, 1800);
        });
    });

    // ── Event listeners ───────────────────────────────────────────────────────
    categorySelect.addEventListener('change', () => {
        customInput.value = '';
        updateLiveQuery(categorySelect.value);
        runSearch(categorySelect.value);
    });

    customInput.addEventListener('input', () => {
        const v = customInput.value;
        updateLiveQuery(v || categorySelect.value);
    });

    searchBtn.addEventListener('click', triggerSearch);
    customInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function triggerSearch() {
        const term = customInput.value.trim() || categorySelect.value;
        updateLiveQuery(term);
        runSearch(term);
    }

    function updateLiveQuery(value) {
        liveVal.textContent = value;
    }

    function setCount(n) {
        resultsCount.textContent = n === null ? '—' : `${n} result${n !== 1 ? 's' : ''}`;
    }

    // ── Core fetch ────────────────────────────────────────────────────────────
    async function runSearch(category) {
        showLoader(true);
        clearResults();
        hideError();
        setCount(null);

        try {
            const res  = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
            const data = await res.json();

            showLoader(false);

            if (!res.ok) {
                displayError(data.error ?? 'An unexpected server error occurred.');
                return;
            }

            setCount(data.length);

            if (!data.length) {
                productGrid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:4rem 0;">
                        <div style="font-size:2.5rem;margin-bottom:0.75rem;">🔍</div>
                        <p style="font-size:0.95rem;color:var(--muted);font-weight:600;">No products found for that query.</p>
                    </div>`;
                return;
            }

            renderProducts(data);
        } catch (err) {
            showLoader(false);
            displayError('Network error — could not reach the server.');
            console.error('[CyberMart]', err);
        }
    }

    // ── Renderers ─────────────────────────────────────────────────────────────
    function renderProducts(products) {
        productGrid.innerHTML = '';

        products.forEach(product => {
            const isClassified = product.category === 'Classified';
            const emoji = categoryEmoji[product.category] ?? '📦';
            const card  = document.createElement('article');
            card.className = `product-card${isClassified ? ' classified' : ''}`;

            card.innerHTML = `
                <div class="product-id">ID #${String(product.id).padStart(3, '0')}</div>
                <div class="product-icon">${emoji}</div>
                <h3 class="product-name">${safe(product.name)}</h3>
                <div class="product-brand">${safe(product.brand)}</div>
                <div class="product-footer">
                    <span class="product-price">${product.price > 0 ? `$${product.price.toFixed(2)}` : 'CLASSIFIED'}</span>
                    <span class="product-category">${safe(product.category)}</span>
                </div>
                <div class="product-stock">Stock: ${product.stock} unit${product.stock !== 1 ? 's' : ''}</div>
            `;

            productGrid.appendChild(card);
        });
    }

    // ── UI state helpers ──────────────────────────────────────────────────────
    function showLoader(show)  { loader.classList.toggle('hidden', !show); }
    function clearResults()    { productGrid.innerHTML = ''; }
    function hideError()       { errorBox.classList.add('hidden'); }

    function displayError(message) {
        errorMsg.textContent = message;
        errorBox.classList.remove('hidden');
    }

    function safe(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }
})();
