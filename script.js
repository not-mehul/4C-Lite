const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const messageEl = document.getElementById('message');
const previewEl = document.getElementById('preview');
const resultEl = document.getElementById('result');
const lastUpdatedEl = document.getElementById('lastUpdated');
let dragCounter = 0;
const DEBUG = false; // Toggle detailed logging

// Utility to escape HTML
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fetch and populate last-updated timestamp (example)
fetch('Verkada Command Connector Compatibility.csv', { method: 'HEAD' })
    .then(res => {
        const date = res.headers.get('last-modified');
        lastUpdatedEl.textContent = date ? new Date(date).toLocaleString() : 'Unknown';
    })
    .catch(() => {
        lastUpdatedEl.textContent = 'Unavailable';
    });

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);

['dragenter'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        dragCounter++;
        dropZone.classList.add('bg-gray-100');
    });
});
['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        dragCounter = evt === 'dragleave' ? --dragCounter : 0;
        if (dragCounter <= 0) {
            dropZone.classList.remove('bg-gray-100');
            dragCounter = 0;
        }
    });
});
dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer));

enableDragEvents(dropZone);

function handleFiles(input) {
    clearUI();
    const file = input.files ? input.files[0] : input.items[0].getAsFile();
    if (!file || file.type !== 'text/csv') {
        showMessage('Please upload a valid CSV file.');
        fileInput.value = '';
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: data => {
            try {
                const { data: rows, meta: { fields: headers } } = data;
                if (!headers.length || !rows.length) throw new Error('Empty CSV');
                const sanitized = sanitizeColumns(headers, rows);
                renderPreview(sanitized);
                showDuplicates(sanitized);
            } catch (err) {
                showMessage(err.message);
                fileInput.value = '';
            }
        },
        error: err => showMessage(err.message)
    });
}

function showMessage(msg) {
    messageEl.textContent = msg;
    previewEl.innerHTML = '';
    resultEl.innerHTML = '';
}

function clearUI() {
    messageEl.textContent = '';
    previewEl.innerHTML = '';
    resultEl.innerHTML = '';
}

function sanitizeColumns(headers, rows) {
    const removeIdx = new Set();
    const serialRegex = /\b(sn|serial)\b/i;
    const sampleSize = Math.min(rows.length, 1000);

    headers.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (serialRegex.test(lower)) {
            removeIdx.add(idx);
        } else {
            for (let i = 0; i < sampleSize; i++) {
                const cell = rows[i][h];
                if (/^\d+(-\d+){3}$/.test(cell) ||               // simple IP
                    /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i.test(cell) || // MAC
                    /\d{4}-\d{2}-\d{2}/.test(cell)) {           // date
                    removeIdx.add(idx);
                    break;
                }
            }
        }
    });

    const keptHeaders = headers.filter((_, i) => !removeIdx.has(i));
    const keptRows = rows.map(r => {
        const obj = {};
        keptHeaders.forEach(h => { obj[h] = r[h]; });
        return obj;
    });
    return { headers: keptHeaders, rows: keptRows };
}

function renderPreview({ headers, rows }) {
    const previewRows = rows.slice(0, 10);
    let html = '<table class="min-w-full border-collapse">';
    html += '<caption class="sr-only">CSV Preview</caption>';
    html += '<thead><tr>' + headers.map(h => `<th scope="col" class="border px-2 py-1">${escapeHTML(h)}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + previewRows.map(r => '<tr>' +
        headers.map(h => `<td class="border px-2 py-1">${escapeHTML(r[h] || '')}</td>`).join('') + '</tr>').join('') + '</tbody>';
    html += '</table>';
    previewEl.innerHTML = html;
}

function identifyModelColumn(headers) {
    const models = window.compatibleModels || [];
    let best = { idx: -1, score: 0 };
    headers.forEach((h, i) => {
        const lower = h.toLowerCase();
        models.forEach(m => {
            const score = Math.round(stringSimilarity.compareTwoStrings(lower, m.toLowerCase()) * 100);
            if (score > best.score) best = { idx: i, score };
        });
    });
    return best.idx;
}

function showDuplicates({ headers, rows }) {
    const hashes = {};
    rows.forEach(r => {
        const key = headers.map(h => r[h]).join('||');
        hashes[key] = (hashes[key] || 0) + 1;
    });
    const dupKeys = Object.entries(hashes).filter(([, c]) => c > 1);
    if (!dupKeys.length) {
        resultEl.textContent = 'No duplicates found.';
        return;
    }

    let html = '<table class="min-w-full border-collapse">';
    html += '<caption class="sr-only">Duplicate Rows</caption>';
    html += '<thead><tr>' + headers.map(h => `<th scope="col" class="border px-2 py-1">${escapeHTML(h)}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + rows.filter(r => dupKeys.some(([k]) => k === headers.map(h => r[h]).join('||')))
        .map(r => '<tr>' + headers.map(h => `<td class="border px-2 py-1">${escapeHTML(r[h] || '')}</td>`).join('') + '</tr>').join('') + '</tbody>';
    html += '</table>';
    resultEl.innerHTML = html;
}

// Utility to ensure drag events are captured
function enableDragEvents(el) {
    ['dragover', 'drop'].forEach(evt => el.addEventListener(evt, e => e.preventDefault()));
}