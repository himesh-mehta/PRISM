// ════════════════════════════════════════════════════════════════
//  Posture Detection — app.js
// ════════════════════════════════════════════════════════════════

// ── DOM refs ──────────────────────────────────────────────────────────────
const videoFeed = document.getElementById('video-feed');
const placeholder = document.getElementById('camera-placeholder');
const cameraArea = document.getElementById('camera-area');
const btnStartCamera = document.getElementById('btn-start-camera');
const btnStartAnalysis = document.getElementById('btn-start-analysis');
const btnReset = document.getElementById('btn-reset');
const btnStopCamera = document.getElementById('btn-stop-camera');
const btnFullscreen = document.getElementById('btn-fullscreen');
const panelIdle = document.getElementById('panel-idle');
const panelReady = document.getElementById('panel-ready');
const panelScanning = document.getElementById('panel-scanning');
const panelResults = document.getElementById('panel-results');
const scanInstr = document.getElementById('scan-instr');
const prepCd = document.getElementById('prep-cd');
const cdRing = document.getElementById('cd-ring');
const cdNum = document.getElementById('cd-num');
const capWrap = document.getElementById('cap-wrap');
const capFill = document.getElementById('cap-fill');
const capLabel = document.getElementById('cap-label');
const scanDots = document.getElementById('scan-dots');
const resultScore = document.getElementById('result-score');
const resultMetrics = document.getElementById('result-metrics');
const resultFindings = document.getElementById('result-findings');
const wakeBadge = document.getElementById('wake-badge');
const wakeTranscript = document.getElementById('wake-transcript');

// ── Constants ─────────────────────────────────────────────────────────────
const VIEW_ORDER = ['FRONT', 'RIGHT', 'BACK', 'LEFT'];
const VIEW_NUMS = { FRONT: '①', RIGHT: '②', BACK: '③', LEFT: '④' };
const VIEW_COLORS = { FRONT: '#60a5fa', RIGHT: '#a78bfa', BACK: '#34d399', LEFT: '#fb923c' };
const VIEW_INSTRS = {
    FRONT: 'Stand FACING the camera · Arms relaxed · Feet shoulder-width apart',
    RIGHT: 'Turn RIGHT side to the camera · Look straight ahead · Stand tall',
    BACK: 'Turn your BACK to the camera · Arms relaxed · Feet shoulder-width apart',
    LEFT: 'Turn LEFT side to the camera · Look straight ahead · Stand tall',
};
const VOICE_TURN = {
    FRONT: 'Stand facing the camera. Keep your arms relaxed.',
    RIGHT: 'Turn right.',
    BACK: 'Turn back.',
    LEFT: 'Turn left.',
};

let pollTimer = null;
let lastState = null;
let lastViewIdx = -1;
let resultsFetched = false;
let cameraIsOn = false;
let analysisTriggered = false;

// ════════════════════════════════════════════════════════════════
//  VOICE OUTPUT (TTS)
// ════════════════════════════════════════════════════════════════
const synth = window.speechSynthesis;
function speak(text, delay = 0) {
    setTimeout(() => {
        synth.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US'; utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;
        synth.speak(utt);
    }, delay);
}

// ════════════════════════════════════════════════════════════════
//  WAKE WORD ENGINE
// ════════════════════════════════════════════════════════════════
let recognizer = null;
let wakeRunning = false;
let prismHeard = false;
let prismTimer = null;
let restartTimer = null;

// All words/phrases that count as "prism"
const WAKE_WORDS = ['prism', 'prison', 'prizm', 'prysm', 'pris', 'prism start', 'hey prism'];
// All words/phrases that count as "start analysis"
const START_WORDS = ['start analysis', 'start the analysis', 'start analyses',
    'start analyzing', 'analysis', 'analyses', 'start scan'];

function hasWake(t) { return WAKE_WORDS.some(w => t.includes(w)); }
function hasStart(t) { return START_WORDS.some(w => t.includes(w)); }

function setBadge(state, extra) {
    if (!wakeBadge) return;
    const map = {
        off: ['🎤 Say: "Hey Prism, Start Analysis"', '#4b5563'],
        listening: ['🎤 Listening…', '#059669'],
        prism: ['✓ Hey Prism! Now say "Start Analysis"', '#d97706'],
        triggered: ['🚀 Starting analysis!', '#6366f1'],
        error: ['⚠ Mic access needed — allow mic permission', '#dc2626'],
    };
    const [text, color] = map[state] || map.off;
    wakeBadge.textContent = extra ? text + ' — ' + extra : text;
    wakeBadge.style.color = color;
    wakeBadge.style.borderColor = color;
}

function setTranscript(t) {
    if (wakeTranscript) wakeTranscript.textContent = t ? `Heard: "${t}"` : '';
}

// ── Core recognition setup ────────────────────────────────────────────────
function buildRecognizer() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.maxAlternatives = 5;

    r.onstart = () => {
        wakeRunning = true;
        if (!analysisTriggered) setBadge('listening');
    };

    r.onresult = (event) => {
        // Collect every word from every result + every alternative
        let allText = '';
        for (let i = 0; i < event.results.length; i++) {
            for (let j = 0; j < event.results[i].length; j++) {
                allText += ' ' + event.results[i][j].transcript.toLowerCase();
            }
        }
        allText = allText.trim().replace(/[^a-z\s]/g, '');
        setTranscript(allText.slice(-80));

        // ── One-shot: entire phrase ─────────────────────────────────
        if (hasWake(allText) && hasStart(allText) && !analysisTriggered) {
            clearTimeout(prismTimer);
            prismHeard = false;
            fireAnalysis();
            return;
        }

        // ── Two-stage: "prism" first, then "start" ──────────────────
        if (hasWake(allText) && !prismHeard && !analysisTriggered) {
            prismHeard = true;
            setBadge('prism');
            speak('Yes?');
            clearTimeout(prismTimer);
            prismTimer = setTimeout(() => {
                prismHeard = false;
                if (!analysisTriggered) setBadge('listening');
                setTranscript('');
            }, 6000);
        }

        if (prismHeard && hasStart(allText) && !analysisTriggered) {
            clearTimeout(prismTimer);
            prismHeard = false;
            fireAnalysis();
        }
    };

    r.onerror = (e) => {
        wakeRunning = false;
        // 'no-speech' is NORMAL — it just means silence for a few seconds
        // Restart silently without showing any error
        if (e.error === 'no-speech' || e.error === 'aborted') {
            scheduleRestart();
            return;
        }
        // Permission denied — show error, don't retry
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setBadge('error');
            return;
        }
        // All other errors — restart
        scheduleRestart();
    };

    r.onend = () => {
        wakeRunning = false;
        // Always restart unless camera stopped or analysis running
        if (cameraIsOn && !analysisTriggered) {
            scheduleRestart();
        }
    };

    return r;
}

function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
        if (cameraIsOn && !analysisTriggered) {
            startListening();
        }
    }, 100);
}

function startListening() {
    if (wakeRunning) return;
    recognizer = buildRecognizer();
    if (!recognizer) { setBadge('error'); return; }
    try {
        recognizer.start();
    } catch (e) {
        wakeRunning = false;
        scheduleRestart();
    }
}

function stopListening() {
    cameraIsOn = false;
    wakeRunning = false;
    prismHeard = false;
    clearTimeout(prismTimer);
    clearTimeout(restartTimer);
    if (recognizer) {
        try { recognizer.stop(); } catch (e) { }
        recognizer = null;
    }
    setBadge('off');
    setTranscript('');
}

// ── Fire the analysis ─────────────────────────────────────────────────────
async function fireAnalysis() {
    if (analysisTriggered) return;
    if (lastState !== 'cam_ready') return;
    analysisTriggered = true;
    setBadge('triggered');
    setTranscript('');
    speak('Starting your posture scan. Stand facing the camera.');

    // Stop listening while scanning to save CPU
    if (recognizer) { try { recognizer.stop(); } catch (e) { } }

    setTimeout(async () => {
        try {
            const r = await fetch('/start_analysis', { method: 'POST' });
            const d = await r.json();
            if (d.ok) {
                btnStartAnalysis.classList.add('hidden');
                btnReset.classList.add('hidden');
                resultsFetched = false;
                lastViewIdx = -1;
                showPanel('scanning');
                renderScanDots(-1, []);
                enterFullscreen();
            } else {
                analysisTriggered = false;
                setBadge('listening');
                startListening();
            }
        } catch (e) {
            analysisTriggered = false;
            setBadge('listening');
            startListening();
        }
    }, 1000);
}

// ════════════════════════════════════════════════════════════════
//  FULLSCREEN
// ════════════════════════════════════════════════════════════════
function enterFullscreen() {
    if (!cameraArea) return;
    const fn = cameraArea.requestFullscreen || cameraArea.webkitRequestFullscreen
        || cameraArea.mozRequestFullScreen || cameraArea.msRequestFullscreen;
    if (fn) fn.call(cameraArea);
}
function exitFullscreen() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen
        || document.mozCancelFullScreen || document.msExitFullscreen;
    if (fn && document.fullscreenElement) fn.call(document);
}
document.addEventListener('fullscreenchange', onFsChange);
document.addEventListener('webkitfullscreenchange', onFsChange);
function onFsChange() {
    const isFs = !!document.fullscreenElement;
    if (cameraArea) cameraArea.classList.toggle('is-fullscreen', isFs);
    if (btnFullscreen) {
        btnFullscreen.innerHTML = isFs
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg> Exit`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg> Fullscreen`;
    }
}
if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
        document.fullscreenElement ? exitFullscreen() : enterFullscreen();
    });
}

// ════════════════════════════════════════════════════════════════
//  BUTTON HANDLERS
// ════════════════════════════════════════════════════════════════
btnStartCamera.addEventListener('click', async () => {
    btnStartCamera.disabled = true;
    btnStartCamera.textContent = 'Starting...';
    try {
        const r = await fetch('/start_camera', { method: 'POST' });
        const d = await r.json();
        if (!d.ok) throw new Error(d.message);

        placeholder.style.display = 'none';
        videoFeed.src = '/video_feed?' + Date.now();
        videoFeed.classList.remove('hidden');
        btnStartCamera.classList.add('hidden');
        btnStartAnalysis.classList.remove('hidden');
        btnStopCamera.classList.remove('hidden');
        if (btnFullscreen) btnFullscreen.classList.remove('hidden');

        cameraIsOn = true;
        analysisTriggered = false;
        showPanel('ready');
        startPolling();
        startListening();   // begin wake word
        speak('Camera ready. Say Hey Prism start analysis, or click Start Analysis.');

    } catch (e) {
        alert('Camera error: ' + e.message);
        btnStartCamera.disabled = false;
        btnStartCamera.textContent = 'Start Camera';
    }
});

btnStartAnalysis.addEventListener('click', async () => {
    if (analysisTriggered) return;
    analysisTriggered = true;
    if (recognizer) { try { recognizer.stop(); } catch (e) { } }
    const r = await fetch('/start_analysis', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) {
        analysisTriggered = false;
        alert('Could not start: ' + (d.message || 'unknown error'));
        return;
    }
    btnStartAnalysis.classList.add('hidden');
    btnReset.classList.add('hidden');
    resultsFetched = false;
    lastViewIdx = -1;
    showPanel('scanning');
    renderScanDots(-1, []);
    enterFullscreen();
    speak(VOICE_TURN['FRONT']);
});

btnReset.addEventListener('click', async () => {
    await fetch('/reset', { method: 'POST' });
    resultsFetched = false;
    lastViewIdx = -1;
    analysisTriggered = false;
    btnStartAnalysis.classList.remove('hidden');
    btnReset.classList.add('hidden');
    showPanel('ready');
    startListening();   // resume wake word after reset
});

btnStopCamera.addEventListener('click', async () => {
    synth.cancel();
    stopListening();
    exitFullscreen();
    clearInterval(pollTimer); pollTimer = null;
    await fetch('/stop_camera', { method: 'POST' });

    cameraIsOn = false;
    videoFeed.classList.add('hidden');
    videoFeed.src = '';
    placeholder.style.display = 'flex';
    btnStopCamera.classList.add('hidden');
    btnStartAnalysis.classList.add('hidden');
    btnReset.classList.add('hidden');
    if (btnFullscreen) btnFullscreen.classList.add('hidden');
    btnStartCamera.classList.remove('hidden');
    btnStartCamera.disabled = false;
    btnStartCamera.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>Start Camera`;
    lastState = null; resultsFetched = false; analysisTriggered = false;
    showPanel('idle');
});

// ════════════════════════════════════════════════════════════════
//  POLLING
// ════════════════════════════════════════════════════════════════
function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
        try {
            const r = await fetch('/app_state');
            const d = await r.json();
            handleState(d);
        } catch (e) { }
    }, 200);
}

function handleState(d) {
    const s = d.state;
    const vidx = d.view_index;

    if (s === 'prep' && d.view) {
        showPanel('scanning');
        const vid = d.view.id, col = VIEW_COLORS[vid];
        scanInstr.innerHTML =
            `<span style="color:${col};font-weight:700">${VIEW_NUMS[vid]} ${vid} VIEW</span>
             <br><small style="color:#6b7280">${VIEW_INSTRS[vid]}</small>`;
        cdRing.style.borderColor = col;
        cdRing.style.boxShadow = `0 0 22px ${col}55`;
        cdNum.textContent = Math.ceil(d.prep_rem) || 1;
        show(prepCd); hide(capWrap);
        renderScanDots(vidx, d.completed, 'prep', col);
        if (vidx !== lastViewIdx && vidx > 0) {
            lastViewIdx = vidx;
            speak(VOICE_TURN[vid]);
        }
    }
    else if (s === 'capturing' && d.view) {
        showPanel('scanning');
        const vid = d.view.id, col = VIEW_COLORS[vid];
        const sl = Math.ceil(d.cap_rem) || 0;
        scanInstr.innerHTML =
            `<span style="color:${col};font-weight:700">Capturing ${vid}...</span>
             <br><small style="color:#6b7280">Hold still — ${sl}s remaining</small>`;
        capFill.style.width = (d.cap_prog * 100) + '%';
        capFill.style.background = col;
        capLabel.textContent = sl + 's';
        hide(prepCd); show(capWrap);
        renderScanDots(vidx, d.completed, 'capturing', col);
    }
    else if (s === 'done' && !resultsFetched) {
        resultsFetched = true;
        hide(prepCd); hide(capWrap);
        setTimeout(() => {
            exitFullscreen();
            btnReset.classList.remove('hidden');
            analysisTriggered = false;
            startListening();   // resume wake word
        }, 700);
        fetchResults();
    }

    lastState = s;
}

// ════════════════════════════════════════════════════════════════
//  SCAN DOTS
// ════════════════════════════════════════════════════════════════
function renderScanDots(activeIdx, completed, phase, activeCol) {
    if (!scanDots) return;
    scanDots.innerHTML = VIEW_ORDER.map((vid, i) => {
        const col = VIEW_COLORS[vid];
        const done = completed && completed.includes(vid);
        const act = i === activeIdx;
        const dotBg = done || act ? col : '#21262d';
        const dotSh = act ? `box-shadow:0 0 9px ${col}` : '';
        let st = '';
        if (done) st = `<span class="dot-status" style="color:${col}">✓ Done</span>`;
        else if (act && phase === 'prep') st = `<span class="dot-status" style="color:${col}">⏱ Prep</span>`;
        else if (act && phase === 'capturing') st = `<span class="dot-status" style="color:${col}">● Live</span>`;
        return `<div class="scan-dot-row">
            <div class="dot-circle ${done ? 'done' : act ? 'active' : ''}" style="background:${dotBg};${dotSh}"></div>
            <span class="dot-name ${done ? 'done' : act ? 'active' : ''}">${VIEW_NUMS[vid]} ${vid}</span>${st}
        </div>`;
    }).join('');
}

// ════════════════════════════════════════════════════════════════
//  RESULTS
// ════════════════════════════════════════════════════════════════
async function fetchResults() {
    try {
        const r = await fetch('/results');
        const d = await r.json();
        if (d.ok) { renderResults(d.data); showPanel('results'); }
    } catch (e) { resultsFetched = false; }
}

function renderResults(res) {
    const oc = res.overall_color;
    resultScore.innerHTML = `
        <div class="score-wrap">
            <div class="score-ring" style="border-color:${oc}">
                <span class="score-num" style="color:${oc}">${res.overall}</span>
                <span class="score-sub">/100</span>
            </div>
            <div class="score-label" style="color:${oc}">${cap(res.overall_status)} Posture</div>
            <div class="score-meta">${res.metrics.length} metrics · ${res.views.length} views</div>
        </div>`;

    resultMetrics.innerHTML = `<div class="sec-hdr">Metric Scores</div>` +
        res.metrics.map(m => `
        <div class="metric-row">
            <div class="m-dot" style="background:${m.color}"></div>
            <div class="m-name">${m.name}<span class="m-view">${m.view}</span></div>
            <div class="m-bar-track">
                <div class="m-bar-fill" style="width:0%;background:${m.color}" data-w="${m.score}"></div>
            </div>
            <div class="m-val">${m.score}</div>
        </div>`).join('');

    requestAnimationFrame(() => setTimeout(() => {
        document.querySelectorAll('.m-bar-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
    }, 80));

    resultFindings.innerHTML = `<div class="sec-hdr">Findings & Recommendations</div>` +
        (res.findings.length
            ? res.findings.map(f => `
                <div class="finding-card" style="border-left-color:${f.color}">
                    <div class="finding-title" style="color:${f.color}">
                        <div class="finding-dot" style="background:${f.color}"></div>${f.title}
                    </div>
                    <ul class="finding-detail">${f.details.map(d => `<li>${d}</li>`).join('')}</ul>
                </div>`).join('')
            : `<div style="text-align:center;padding:14px;color:#3fb950;font-size:.82rem">✓ No significant issues — excellent posture!</div>`);
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════
function showPanel(w) {
    panelIdle.classList.toggle('hidden', w !== 'idle');
    panelReady.classList.toggle('hidden', w !== 'ready');
    panelScanning.classList.toggle('hidden', w !== 'scanning');
    panelResults.classList.toggle('hidden', w !== 'results');
}
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }