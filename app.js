/**
 * KALKULATOR ILMIAH PRO — JAVASCRIPT ENGINE
 * Accurate Recursive Descent Math Parser matching the C++ core,
 * Web Audio sound synthesis, Interactive 2D Graph Plotter, and Storage.
 */

(() => {
    'use strict';

    // --- State ---
    let expression = '';
    let lastAnswer = 0;
    let memoryValue = 0;
    let isDegreeMode = true;
    let isSoundEnabled = true;
    let history = [];

    // --- Audio Context for Click Feedback ---
    let audioCtx = null;
    function playClickSound(freq = 600, duration = 0.035, type = 'sine') {
        if (!isSoundEnabled) return;
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch {
            // Audio not allowed or failed, silently ignore
        }
    }

    // --- DOM Elements ---
    const exprDisplay = document.getElementById('expression-display');
    const resultDisplay = document.getElementById('result-display');
    const btnModeDeg = document.getElementById('btn-mode-deg');
    const btnModeRad = document.getElementById('btn-mode-rad');
    const indMemory = document.getElementById('indicator-memory');
    const indAns = document.getElementById('indicator-ans');
    const indError = document.getElementById('indicator-error');

    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnGraphToggle = document.getElementById('btn-graph-toggle');
    const btnHistoryToggle = document.getElementById('btn-history-toggle');
    const historyBadge = document.getElementById('history-badge');

    const graphPanel = document.getElementById('graph-panel');
    const btnCloseGraph = document.getElementById('btn-close-graph');
    const historyDrawer = document.getElementById('history-drawer');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const historyList = document.getElementById('history-list');

    const toastEl = document.getElementById('toast');

    // --- Panel / Sheet helper (backdrop, scroll-lock, aria state) ---
    const backdropEl = document.createElement('div');
    backdropEl.className = 'panel-backdrop';
    document.body.appendChild(backdropEl);

    const sheetMedia = window.matchMedia('(max-width: 1024px)');

    function isPanelOpen(panel) {
        return !panel.classList.contains('hidden');
    }

    function syncPanelState() {
        const graphOpen = isPanelOpen(graphPanel);
        const historyOpen = isPanelOpen(historyDrawer);
        btnGraphToggle.setAttribute('aria-expanded', String(graphOpen));
        btnHistoryToggle.setAttribute('aria-expanded', String(historyOpen));

        if (!sheetMedia.matches) {
            backdropEl.classList.remove('show');
            document.body.classList.remove('no-scroll');
            return;
        }

        const anyOpen = graphOpen || historyOpen;
        backdropEl.classList.toggle('show', anyOpen);
        document.body.classList.toggle('no-scroll', anyOpen);
    }

    function openPanel(panel) {
        const other = panel === graphPanel ? historyDrawer : graphPanel;
        other.classList.add('hidden');
        panel.classList.remove('hidden');
        syncPanelState();
    }

    function closePanel(panel) {
        panel.classList.add('hidden');
        syncPanelState();
    }

    function closeAllPanels() {
        graphPanel.classList.add('hidden');
        historyDrawer.classList.add('hidden');
        syncPanelState();
    }

    backdropEl.addEventListener('click', closeAllPanels);
    if (typeof sheetMedia.addEventListener === 'function') {
        sheetMedia.addEventListener('change', syncPanelState);
    } else if (typeof sheetMedia.addListener === 'function') {
        sheetMedia.addListener(syncPanelState);
    }

    // Graph elements
    const graphCanvas = document.getElementById('graph-canvas');
    const fnInput = document.getElementById('function-input');
    const btnPlot = document.getElementById('btn-plot');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnResetView = document.getElementById('btn-reset-view');
    const graphCoords = document.getElementById('graph-coords');

    // --- Toast helper ---
    let toastTimer = null;
    function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2200);
    }

    // --- Factorial helper ---
    function factorial(n) {
        if (n < 0 || Math.floor(n) !== n || n > 170) {
            throw new Error('fact(n) butuh bulat 0..170');
        }
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    // --- RECURSIVE DESCENT MATH PARSER ---
    // Direct JavaScript port of the C++ Parser in kalkulator_ilmiah.cpp
    class MathParser {
        constructor(text, degMode, ansVal, customX = null) {
            this.s = text;
            this.pos = 0;
            this.deg = degMode;
            this.ans = ansVal;
            this.x = customX;
        }

        parse() {
            const v = this.expr();
            this.skipSpace();
            if (this.pos < this.s.length) {
                throw new Error(`Karakter tidak dikenal: '${this.s[this.pos]}'`);
            }
            return v;
        }

        skipSpace() {
            while (this.pos < this.s.length && /\s/.test(this.s[this.pos])) {
                this.pos++;
            }
        }

        match(str) {
            this.skipSpace();
            if (this.s.startsWith(str, this.pos)) {
                this.pos += str.length;
                return true;
            }
            return false;
        }

        // expr -> term (('+' | '-') term)*
        expr() {
            let v = this.term();
            while (true) {
                if (this.match('+')) v += this.term();
                else if (this.match('-')) v -= this.term();
                else return v;
            }
        }

        // term -> unary (('*' | '/' | '%') unary)*
        term() {
            let v = this.unary();
            while (true) {
                if (this.match('*')) {
                    v *= this.unary();
                } else if (this.match('/')) {
                    const d = this.unary();
                    if (d === 0) throw new Error('Pembagian dengan nol');
                    v /= d;
                } else if (this.match('%')) {
                    const d = this.unary();
                    if (d === 0) throw new Error('Modulo dengan nol');
                    v = v % d;
                } else {
                    return v;
                }
            }
        }

        // unary -> '-' unary | '+' unary | power
        unary() {
            if (this.match('-')) return -this.unary();
            if (this.match('+')) return this.unary();
            return this.power();
        }

        // power -> primary ('^' unary)? (kanan asosiatif)
        power() {
            const base = this.primary();
            if (this.match('^')) {
                const exp = this.unary();
                return Math.pow(base, exp);
            }
            return base;
        }

        primary() {
            this.skipSpace();
            if (this.pos >= this.s.length) {
                throw new Error('Ekspresi tidak lengkap');
            }

            if (this.match('(')) {
                const v = this.expr();
                if (!this.match(')')) throw new Error("Kurung tutup ')' hilang");
                return v;
            }

            const ch = this.s[this.pos];
            if (/\d/.test(ch) || ch === '.') return this.number();
            if (/[a-zA-Z_]/.test(ch)) return this.identifier();

            throw new Error(`Karakter tidak dikenal: '${ch}'`);
        }

        number() {
            const start = this.pos;
            while (this.pos < this.s.length && (/[\d.]/.test(this.s[this.pos]))) {
                this.pos++;
            }
            const numStr = this.s.substring(start, this.pos);
            const val = parseFloat(numStr);
            if (isNaN(val)) throw new Error(`Angka tidak valid: ${numStr}`);
            return val;
        }

        toRad(angle) {
            return this.deg ? (angle * Math.PI) / 180 : angle;
        }

        fromRad(rad) {
            return this.deg ? (rad * 180) / Math.PI : rad;
        }

        identifier() {
            const start = this.pos;
            while (this.pos < this.s.length && /[a-zA-Z0-9_]/.test(this.s[this.pos])) {
                this.pos++;
            }
            const name = this.s.substring(start, this.pos).toLowerCase();

            // Constants
            if (name === 'pi') return Math.PI;
            if (name === 'e') return Math.E;
            if (name === 'ans') return this.ans;
            if (name === 'x' && this.x !== null) return this.x;
            if (name === 'rand') {
                if (this.match('(')) {
                    this.match(')');
                }
                return Math.random();
            }

            // Function call: name(expr)
            if (!this.match('(')) {
                // If it's single variable x without parens
                if (name === 'x') return this.x || 0;
                throw new Error(`Fungsi '${name}' butuh tanda kurung '('`);
            }

            const arg = this.expr();
            if (!this.match(')')) {
                throw new Error("Kurung tutup ')' hilang");
            }

            return this.applyFunction(name, arg);
        }

        applyFunction(f, x) {
            switch (f) {
                case 'sin': return Math.sin(this.toRad(x));
                case 'cos': return Math.cos(this.toRad(x));
                case 'tan': {
                    const cosVal = Math.cos(this.toRad(x));
                    if (Math.abs(cosVal) < 1e-12) throw new Error('tan tidak terdefinisi');
                    return Math.tan(this.toRad(x));
                }
                case 'asin':
                    if (x < -1 || x > 1) throw new Error('asin input harus -1..1');
                    return this.fromRad(Math.asin(x));
                case 'acos':
                    if (x < -1 || x > 1) throw new Error('acos input harus -1..1');
                    return this.fromRad(Math.acos(x));
                case 'atan': return this.fromRad(Math.atan(x));
                case 'sqrt':
                    if (x < 0) throw new Error('Akar bilangan negatif');
                    return Math.sqrt(x);
                case 'cbrt': return Math.cbrt(x);
                case 'ln':
                    if (x <= 0) throw new Error('ln hanya untuk x > 0');
                    return Math.log(x);
                case 'log':
                    if (x <= 0) throw new Error('log hanya untuk x > 0');
                    return Math.log10(x);
                case 'exp': return Math.exp(x);
                case 'abs': return Math.abs(x);
                case 'fact': return factorial(x);
                default:
                    throw new Error(`Fungsi tidak dikenal: '${f}'`);
            }
        }
    }

    function evaluateMath(str, degMode, ansVal, customX = null) {
        if (!str || !str.trim()) return 0;
        const parser = new MathParser(str, degMode, ansVal, customX);
        const res = parser.parse();
        if (!isFinite(res)) throw new Error('Hasil di luar batas (Infinity / NaN)');
        // Fix standard floating inaccuracies, e.g. 0.1 + 0.2
        return parseFloat(res.toPrecision(12));
    }

    // --- UI Update & Display ---
    function updateDisplay(resultPreview = null, isError = false) {
        exprDisplay.textContent = expression || '';
        exprDisplay.scrollLeft = exprDisplay.scrollWidth;

        if (isError) {
            resultDisplay.textContent = resultPreview || 'Error';
            indError.classList.remove('hidden');
        } else {
            indError.classList.add('hidden');
            if (resultPreview !== null) {
                resultDisplay.textContent = resultPreview;
            } else if (!expression) {
                resultDisplay.textContent = '0';
            } else {
                // Try live calculation preview
                try {
                    const live = evaluateMath(expression, isDegreeMode, lastAnswer);
                    resultDisplay.textContent = live;
                } catch {
                    // Incomplete expression, don't change or throw error
                }
            }
        }

        // Indicators
        indAns.classList.toggle('hidden', lastAnswer === 0);
        indMemory.classList.toggle('hidden', memoryValue === 0);
    }

    // --- Key Actions ---
    function insertToExpression(text) {
        playClickSound(580, 0.03);
        expression += text;
        updateDisplay();
    }

    function clearExpression() {
        playClickSound(300, 0.05, 'triangle');
        expression = '';
        updateDisplay('0');
    }

    function backspace() {
        playClickSound(420, 0.03);
        if (!expression) return;
        // If ends with spaces e.g. " + ", remove cleanly
        if (expression.endsWith(' + ') || expression.endsWith(' - ') || expression.endsWith(' * ') || expression.endsWith(' / ')) {
            expression = expression.slice(0, -3);
        } else {
            expression = expression.slice(0, -1);
        }
        updateDisplay();
    }

    function calculateFinal() {
        if (!expression.trim()) return;
        playClickSound(800, 0.06, 'sine');
        try {
            resultDisplay.classList.add('calculating');
            setTimeout(() => resultDisplay.classList.remove('calculating'), 180);

            const result = evaluateMath(expression, isDegreeMode, lastAnswer);
            const record = {
                id: Date.now(),
                expr: expression,
                result: result,
                mode: isDegreeMode ? 'DEG' : 'RAD',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };

            history.unshift(record);
            if (history.length > 50) history.pop();
            saveHistory();
            renderHistory();

            lastAnswer = result;
            expression = String(result);
            updateDisplay(result);
        } catch (err) {
            updateDisplay(err.message || 'Error', true);
        }
    }

    // --- Memory Operations ---
    function handleMemory(action) {
        playClickSound(640, 0.04);
        try {
            const currentVal = evaluateMath(expression || String(lastAnswer), isDegreeMode, lastAnswer);
            switch (action) {
                case 'mc':
                    memoryValue = 0;
                    showToast('Memori dibersihkan (MC)');
                    break;
                case 'mr':
                    expression += String(memoryValue);
                    showToast(`Recall Memori: ${memoryValue}`);
                    break;
                case 'm-plus':
                    memoryValue += currentVal;
                    showToast(`M+ (${memoryValue})`);
                    break;
                case 'm-minus':
                    memoryValue -= currentVal;
                    showToast(`M− (${memoryValue})`);
                    break;
                case 'ms':
                    memoryValue = currentVal;
                    showToast(`Tersimpan ke Memori: ${memoryValue}`);
                    break;
                case 'copy':
                    navigator.clipboard.writeText(resultDisplay.textContent)
                        .then(() => showToast('Hasil berhasil disalin!'))
                        .catch(() => showToast('Gagal menyalin'));
                    break;
            }
            updateDisplay();
        } catch {
            showToast('Operasi memori gagal');
        }
    }

    // --- History Storage & Rendering ---
    function loadHistory() {
        try {
            const stored = localStorage.getItem('kalkulator_history');
            if (stored) history = JSON.parse(stored);
        } catch {
            history = [];
        }
        renderHistory();
    }

    function saveHistory() {
        try {
            localStorage.setItem('kalkulator_history', JSON.stringify(history));
        } catch {
            // storage full or disabled
        }
    }

    function renderHistory() {
        historyBadge.textContent = history.length;
        if (!historyList) return;

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Belum ada riwayat kalkulasi</p>
                    <span>Hitung sesuatu untuk melihat riwayat di sini</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item" data-expr="${encodeURIComponent(item.expr)}" data-res="${item.result}">
                <div class="history-item-top">
                    <span>${item.mode} • ${item.time}</span>
                    <span>Klik untuk memuat</span>
                </div>
                <div class="history-expr">${escapeHtml(item.expr)}</div>
                <div class="history-res">= ${item.result}</div>
            </div>
        `).join('');

        historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const expr = decodeURIComponent(el.getAttribute('data-expr'));
                expression = expr;
                updateDisplay();
                closePanel(historyDrawer);
                showToast('Ekspresi dimuat ulang');
            });
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    // --- Mode DEG / RAD ---
    btnModeDeg.addEventListener('click', () => {
        playClickSound(700, 0.02);
        isDegreeMode = true;
        btnModeDeg.classList.add('active');
        btnModeRad.classList.remove('active');
        updateDisplay();
    });

    btnModeRad.addEventListener('click', () => {
        playClickSound(700, 0.02);
        isDegreeMode = false;
        btnModeRad.classList.add('active');
        btnModeDeg.classList.remove('active');
        updateDisplay();
    });

    // --- Keypad Buttons Event Delegation ---
    document.querySelector('.keypad-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.hasAttribute('data-insert')) {
            insertToExpression(btn.getAttribute('data-insert'));
        } else if (btn.hasAttribute('data-action')) {
            const action = btn.getAttribute('data-action');
            if (action === 'clear') clearExpression();
            else if (action === 'backspace') backspace();
            else if (action === 'calculate') calculateFinal();
        }
    });

    // --- Memory Bar Event Delegation ---
    document.querySelector('.memory-bar').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.action) return;
        handleMemory(btn.dataset.action);
    });

    // --- Sound Toggle ---
    btnSoundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        btnSoundToggle.querySelector('.icon-sound-on').classList.toggle('hidden', !isSoundEnabled);
        btnSoundToggle.querySelector('.icon-sound-off').classList.toggle('hidden', isSoundEnabled);
        showToast(isSoundEnabled ? 'Suara diaktifkan' : 'Suara dimatikan');
        if (isSoundEnabled) playClickSound(650, 0.04);
    });

    // --- Theme Toggle ---
    function syncThemeColor() {
        const dark = document.documentElement.getAttribute('data-theme') !== 'light';
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#0a0d14' : '#f1f5f9');
    }

    btnThemeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', nextTheme);
        btnThemeToggle.querySelector('.icon-moon').classList.toggle('hidden', !isDark);
        btnThemeToggle.querySelector('.icon-sun').classList.toggle('hidden', isDark);
        try {
            localStorage.setItem('kalkulator_theme', nextTheme);
        } catch {}
        syncThemeColor();
        drawGraph();
    });

    // --- Panel Toggles (sheet modal pada tablet & HP) ---
    btnGraphToggle.addEventListener('click', () => {
        if (isPanelOpen(graphPanel)) {
            closePanel(graphPanel);
            return;
        }
        openPanel(graphPanel);
        setTimeout(resizeCanvas, 60);
    });

    btnCloseGraph.addEventListener('click', () => {
        closePanel(graphPanel);
    });

    btnHistoryToggle.addEventListener('click', () => {
        if (isPanelOpen(historyDrawer)) {
            closePanel(historyDrawer);
            return;
        }
        openPanel(historyDrawer);
    });

    btnCloseHistory.addEventListener('click', () => {
        closePanel(historyDrawer);
    });

    btnClearHistory.addEventListener('click', () => {
        history = [];
        saveHistory();
        renderHistory();
        showToast('Riwayat telah dibersihkan');
    });

    // --- 2D GRAPH PLOTTER (Canvas) ---
    let graphScale = 35; // pixels per unit
    let graphOffsetX = 0; // translation in pixels
    let graphOffsetY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    function resizeCanvas() {
        if (!graphCanvas) return;
        const rect = graphCanvas.getBoundingClientRect();
        const cssWidth = Math.max(1, Math.round(rect.width));
        const cssHeight = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const backingWidth = Math.round(cssWidth * dpr);
        const backingHeight = Math.round(cssHeight * dpr);
        if (graphCanvas.width !== backingWidth || graphCanvas.height !== backingHeight) {
            graphCanvas.width = backingWidth;
            graphCanvas.height = backingHeight;
        }
        drawGraph();
    }

    function drawGraph() {
        if (!graphCanvas || graphPanel.classList.contains('hidden')) return;
        const ctx = graphCanvas.getContext('2d');
        const rect = graphCanvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        const dpr = graphCanvas.width / Math.max(1, graphCanvas.clientWidth) || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const originX = w / 2 + graphOffsetX;
        const originY = h / 2 + graphOffsetY;

        // Colors based on current theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgFill = isDark ? '#06090f' : '#ffffff';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
        const axisColor = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.45)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        ctx.fillStyle = bgFill;
        ctx.fillRect(0, 0, w, h);

        // Draw Grid Lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        const startX = (originX % graphScale) - graphScale;
        for (let x = startX; x < w; x += graphScale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        const startY = (originY % graphScale) - graphScale;
        for (let y = startY; y < h; y += graphScale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw Axes
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 2;

        // X Axis
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(w, originY);
        ctx.stroke();

        // Y Axis
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, h);
        ctx.stroke();

        // Axis numbers
        ctx.fillStyle = textColor;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // X numbers
        const minX = Math.floor(-originX / graphScale);
        const maxX = Math.ceil((w - originX) / graphScale);
        for (let i = minX; i <= maxX; i++) {
            if (i === 0) continue;
            const px = originX + i * graphScale;
            ctx.fillText(i, px, Math.min(Math.max(originY + 4, 4), h - 16));
        }

        // Y numbers
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const minY = Math.floor((originY - h) / graphScale);
        const maxY = Math.ceil(originY / graphScale);
        for (let j = minY; j <= maxY; j++) {
            if (j === 0) continue;
            const py = originY - j * graphScale;
            ctx.fillText(j, Math.min(Math.max(originX - 6, 24), w - 4), py);
        }

        // Origin label
        ctx.fillText('0', originX - 6, originY + 8);

        // Plot Function
        const formula = fnInput.value.trim();
        if (!formula) return;

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        let isDrawing = false;
        const step = 1; // pixel step

        for (let px = 0; px < w; px += step) {
            const mathX = (px - originX) / graphScale;
            try {
                // Using radian mode for standard Cartesian calculus graphs
                const mathY = evaluateMath(formula, false, lastAnswer, mathX);
                if (isFinite(mathY)) {
                    const py = originY - mathY * graphScale;
                    if (py >= -h && py <= h * 2) {
                        if (!isDrawing) {
                            ctx.moveTo(px, py);
                            isDrawing = true;
                        } else {
                            ctx.lineTo(px, py);
                        }
                    } else {
                        isDrawing = false;
                    }
                } else {
                    isDrawing = false;
                }
            } catch {
                isDrawing = false;
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Update badge koordinat kursor (CSS pixel space agar tetap akurat di semua ukuran/DPR)
    function updateCoords(clientX, clientY) {
        if (!graphCoords) return;
        const rect = graphCanvas.getBoundingClientRect();
        const originX = rect.width / 2 + graphOffsetX;
        const originY = rect.height / 2 + graphOffsetY;
        const curX = ((clientX - rect.left - originX) / graphScale).toFixed(2);
        const curY = ((originY - (clientY - rect.top)) / graphScale).toFixed(2);
        graphCoords.textContent = `x: ${curX}, y: ${curY}`;
    }

    function touchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    // Graph interactions (Zoom, Pan, Mouse Move)
    if (graphCanvas) {
        graphCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX - graphOffsetX;
            dragStartY = e.clientY - graphOffsetY;
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        graphCanvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                graphOffsetX = e.clientX - dragStartX;
                graphOffsetY = e.clientY - dragStartY;
                drawGraph();
            }
            updateCoords(e.clientX, e.clientY);
        });

        graphCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
            graphScale = Math.min(Math.max(graphScale * zoomFactor, 10), 200);
            drawGraph();
        }, { passive: false });

        // --- Dukungan Sentuh: geser 1 jari (pan) & cubit 2 jari (pinch zoom) ---
        let pinchStartDist = 0;
        let pinchStartScale = graphScale;
        let touchStartX = 0;
        let touchStartY = 0;

        graphCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                touchStartX = e.touches[0].clientX - graphOffsetX;
                touchStartY = e.touches[0].clientY - graphOffsetY;
                updateCoords(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                isDragging = false;
                pinchStartDist = touchDistance(e.touches);
                pinchStartScale = graphScale;
            }
        }, { passive: true });

        graphCanvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging) {
                e.preventDefault();
                graphOffsetX = e.touches[0].clientX - touchStartX;
                graphOffsetY = e.touches[0].clientY - touchStartY;
                drawGraph();
                updateCoords(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                e.preventDefault();
                const dist = touchDistance(e.touches);
                if (pinchStartDist > 0) {
                    graphScale = Math.min(Math.max(pinchStartScale * (dist / pinchStartDist), 10), 200);
                    drawGraph();
                }
            }
        }, { passive: false });

        graphCanvas.addEventListener('touchend', () => {
            isDragging = false;
            pinchStartDist = 0;
        });
    }

    btnZoomIn.addEventListener('click', () => {
        graphScale = Math.min(graphScale * 1.25, 200);
        drawGraph();
    });

    btnZoomOut.addEventListener('click', () => {
        graphScale = Math.max(graphScale * 0.8, 10);
        drawGraph();
    });

    btnResetView.addEventListener('click', () => {
        graphScale = 35;
        graphOffsetX = 0;
        graphOffsetY = 0;
        drawGraph();
    });

    btnPlot.addEventListener('click', drawGraph);
    fnInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') drawGraph();
    });

    document.querySelectorAll('.quick-fn-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            fnInput.value = chip.dataset.fn;
            drawGraph();
        });
    });

    // --- Global Keyboard Shortcuts ---
    window.addEventListener('keydown', (e) => {
        // If typing in graph formula input, let default input behavior work
        if (document.activeElement === fnInput) return;

        const key = e.key;

        if (/\d/.test(key)) {
            insertToExpression(key);
        } else if (key === '.') {
            insertToExpression('.');
        } else if (key === '+') {
            insertToExpression(' + ');
        } else if (key === '-') {
            insertToExpression(' - ');
        } else if (key === '*') {
            insertToExpression(' * ');
        } else if (key === '/') {
            e.preventDefault();
            insertToExpression(' / ');
        } else if (key === '^') {
            insertToExpression('^');
        } else if (key === '%') {
            insertToExpression('%');
        } else if (key === '(' || key === ')') {
            insertToExpression(key);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculateFinal();
        } else if (key === 'Backspace') {
            e.preventDefault();
            backspace();
        } else if (key === 'Escape') {
            e.preventDefault();
            if (isPanelOpen(graphPanel) || isPanelOpen(historyDrawer)) {
                closeAllPanels();
            } else {
                clearExpression();
            }
        }
    });

    // --- Init ---
    let resizeRaf = null;
    function scheduleCanvasResize() {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
            resizeRaf = null;
            resizeCanvas();
        });
    }

    window.addEventListener('resize', scheduleCanvasResize);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

    if (graphCanvas && typeof ResizeObserver === 'function') {
        new ResizeObserver(scheduleCanvasResize).observe(graphCanvas.parentElement);
    }

    try {
        const savedTheme = localStorage.getItem('kalkulator_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            btnThemeToggle.querySelector('.icon-moon').classList.toggle('hidden', savedTheme !== 'dark');
            btnThemeToggle.querySelector('.icon-sun').classList.toggle('hidden', savedTheme === 'dark');
        }
    } catch {}

    loadHistory();
    updateDisplay('0');
    syncThemeColor();
    syncPanelState();
    resizeCanvas();
})();
