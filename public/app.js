(() => {
    'use strict';

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const genreSelect = document.getElementById('genreSelect');
    const customInput = document.getElementById('customInput');
    const searchBtn   = document.getElementById('searchBtn');
    const liveVal     = document.getElementById('liveVal');
    const bookGrid    = document.getElementById('bookGrid');
    const loader      = document.getElementById('loader');
    const errorBox    = document.getElementById('errorBox');
    const errorMsg    = document.getElementById('errorMsg');

    // ── Initial load ──────────────────────────────────────────────────────────
    runSearch(genreSelect.value);

    // ── Payload chip click-to-copy & auto-run ─────────────────────────────────
    document.querySelectorAll('.payload-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const payload = chip.dataset.payload;

            // 1. Fill the attack input & update live query
            customInput.value = payload;
            updateLiveQuery(payload);

            // 2. Run the search immediately
            runSearch(payload);

            // 3. Copy to clipboard
            navigator.clipboard.writeText(payload).catch(() => {
                // Fallback for older browsers
                const tmp = document.createElement('textarea');
                tmp.value = payload;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
            });

            // 4. Flash green "copied" state on the chip
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
    genreSelect.addEventListener('change', () => {
        customInput.value = '';
        updateLiveQuery(genreSelect.value);
        runSearch(genreSelect.value);
    });

    customInput.addEventListener('input', () => {
        const v = customInput.value;
        updateLiveQuery(v || genreSelect.value);
    });

    searchBtn.addEventListener('click', triggerSearch);

    customInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') triggerSearch();
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function triggerSearch() {
        const term = customInput.value.trim() || genreSelect.value;
        updateLiveQuery(term);
        runSearch(term);
    }

    function updateLiveQuery(value) {
        liveVal.textContent = value;
    }

    // ── Core fetch ────────────────────────────────────────────────────────────
    async function runSearch(genre) {
        showLoader(true);
        clearResults();
        hideError();

        try {
            // The genre string is NOT sanitised — intentional SQLi vulnerability
            const res  = await fetch(`/api/books?genre=${encodeURIComponent(genre)}`);
            const data = await res.json();

            showLoader(false);

            if (!res.ok) {
                displayError(data.error ?? 'An unexpected server error occurred.');
                return;
            }

            if (!data.length) {
                bookGrid.innerHTML = '<p class="subtitle" style="grid-column:1/-1;text-align:center;padding:2rem 0">No books found for that query.</p>';
                return;
            }

            renderBooks(data);
        } catch (err) {
            showLoader(false);
            displayError('Network error — could not reach the server.');
            console.error('[StoryShelf]', err);
        }
    }

    // ── Renderers ─────────────────────────────────────────────────────────────
    function renderBooks(books) {
        bookGrid.innerHTML = '';

        books.forEach(book => {
            const isRestricted = book.genre === 'Restricted';
            const card = document.createElement('article');
            card.className = `book-card${isRestricted ? ' restricted' : ''}`;

            card.innerHTML = `
                <div class="book-spine"></div>
                <div class="book-id">Book #${book.id}</div>
                <h3 class="book-title">${safe(book.title)}</h3>
                <div class="book-author">by ${safe(book.author)}</div>
                <div class="book-footer">
                    <span class="book-price">${book.price > 0 ? `$${book.price.toFixed(2)}` : 'N/A'}</span>
                    <span class="book-genre">${safe(book.genre)}</span>
                </div>
                <div class="book-stock">Stock: ${book.stock} unit${book.stock !== 1 ? 's' : ''}</div>
            `;

            bookGrid.appendChild(card);
        });
    }

    // ── UI state helpers ──────────────────────────────────────────────────────
    function showLoader(show)  { loader.classList.toggle('hidden', !show); }
    function clearResults()    { bookGrid.innerHTML = ''; }
    function hideError()       { errorBox.classList.add('hidden'); }

    function displayError(message) {
        errorMsg.textContent = message;
        errorBox.classList.remove('hidden');
    }

    // Minimal XSS guard (we're demoing SQLi, not stored XSS)
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
