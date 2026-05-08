// ════════════════════════════════════════════════════════════════
//  Exercise Tracker — app.js
// ════════════════════════════════════════════════════════════════

// ── DOM ────────────────────────────────────────────────────────────────────
const videoFeed = document.getElementById('video-feed');
const placeholder = document.getElementById('placeholder');
const cameraArea = document.getElementById('camera-area');
const btnStartCam = document.getElementById('btn-start-cam');
const btnStartEx = document.getElementById('btn-start-ex');
const btnStopEx = document.getElementById('btn-stop-ex');
const btnReset = document.getElementById('btn-reset');
const btnStopCam = document.getElementById('btn-stop-cam');
const btnFs = document.getElementById('btn-fullscreen');

const repCount = document.getElementById('rep-count');
const repDisplay = document.getElementById('rep-display');
const yogaDisplay = document.getElementById('yoga-display');
const yogaSeconds = document.getElementById('yoga-seconds');
const yogaTarget = document.getElementById('yoga-target');
const yogaSets = document.getElementById('yoga-sets');
const timerArc = document.getElementById('timer-arc');
const formFill = document.getElementById('form-fill');
const formPct = document.getElementById('form-pct');
const feedbackBox = document.getElementById('feedback-box');
const feedbackTxt = document.getElementById('feedback-text');
const stateBadge = document.getElementById('state-badge');
const exNameLabel = document.getElementById('ex-name-label');
const mAngle = document.getElementById('m-angle');
const mAngleLabel = document.getElementById('m-angle-label');
const mSpeed = document.getElementById('m-speed');
const mSpeedItem = document.getElementById('m-speed-item');
const mAvgTime = document.getElementById('m-avgtime');
const mAvgTimeItem = document.getElementById('m-avgtime-item');
const mAvgLabel = document.getElementById('m-avgtime-label');
const mStatus = document.getElementById('m-status');
const mStatusLabel = document.getElementById('m-status-label');
const guideContent = document.getElementById('guide-content');
const yogaBadge = document.getElementById('yoga-badge');
const repCard = document.getElementById('rep-card');

const EX_BTNS = document.querySelectorAll('.ex-btn');
const CAT_TABS = document.querySelectorAll('.cat-tab');

// ── State ──────────────────────────────────────────────────────────────────
let currentEx = 'squats';
let cameraOn = false;
let tracking = false;
let pollTimer = null;
let isYogaMode = false;
let lastAlarmTime = 0;
let audioCtx = null;

function playAlarm() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
        gain.connect(audioCtx.destination);
        osc.connect(gain);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

// ── Exercise data ──────────────────────────────────────────────────────────
const EX_LABELS = {
    squats: 'Squats',
    bicep_curls: 'Bicep Curls',
    pushups: 'Push-ups',
    neck_rotation: 'Neck Rotation',
    neck_tilt: 'Neck Tilt',
    shoulder_rolls: 'Shoulder Rolls',
    shoulder_press: 'Shoulder Press',
    lateral_raises: 'Lateral Raises',
    mountain_pose: 'Tadasana',
    warrior_i: 'Virabhadrasana I',
    warrior_ii: 'Virabhadrasana II',
    tree_pose: 'Vrikshasana',
    chair_pose: 'Utkatasana',
    triangle_pose: 'Trikonasana',
};

const EX_COLORS = {
    squats: '#60a5fa',
    bicep_curls: '#34d399',
    pushups: '#a78bfa',
    neck_rotation: '#fb923c',
    neck_tilt: '#22d3ee',
    shoulder_rolls: '#c084fc',
    shoulder_press: '#2dd4bf',
    lateral_raises: '#fcd34d',
    mountain_pose: '#f59e0b',
    warrior_i: '#f59e0b',
    warrior_ii: '#f59e0b',
    tree_pose: '#f59e0b',
    chair_pose: '#f59e0b',
    triangle_pose: '#f59e0b',
};

const YOGA_EXERCISES = new Set([
    'mountain_pose', 'warrior_i', 'warrior_ii', 'tree_pose', 'chair_pose', 'triangle_pose'
]);

const EX_GUIDES = {
    squats: [
        'Stand with feet shoulder-width apart',
        'Keep chest up, back straight throughout',
        'Lower until knees reach ~90° angle',
        'Drive through heels to stand back up',
        'Keep knees in line with toes — no caving in',
    ],
    bicep_curls: [
        'Stand straight, arms fully extended at sides',
        'Keep elbows fixed — do not let them drift forward',
        'Curl weights up until angle is ~45°',
        'Lower slowly — don\'t just drop your arms',
        'Use a controlled medium speed (2s up, 2s down)',
    ],
    pushups: [
        'Start in a high plank — body in a straight line',
        'Hands slightly wider than shoulder-width',
        'Lower chest to the floor — elbows ~45° from body',
        'Push back up until arms are fully extended',
        'Keep hips level — do not sag or pike',
    ],
    neck_rotation: [
        'Stand or sit tall with shoulders relaxed',
        'Slowly turn head to the LEFT — hold 1s',
        'Return to centre, then rotate RIGHT — hold 1s',
        'Keep shoulders completely still throughout',
        'Medium speed only — never jerk or rush',
    ],
    neck_tilt: [
        'Sit or stand tall, face forward',
        'Slowly tilt right ear toward right shoulder',
        'Return to centre, then tilt left ear to left shoulder',
        'Keep both shoulders level and relaxed',
        'Do NOT rotate your head — only tilt sideways',
    ],
    shoulder_rolls: [
        'Stand tall with arms relaxed at sides',
        'Roll both shoulders UP toward ears',
        'Then roll them BACK and DOWN in a circle',
        'Keep your neck relaxed throughout',
        'Slow, controlled circles for full range',
    ],
    shoulder_press: [
        'Stand with feet shoulder-width apart',
        'Hold weights at shoulder height, elbows at ~90°',
        'Press arms straight overhead until locked out',
        'Lower slowly back to shoulder height',
        'Keep core tight — no arching your lower back',
    ],
    lateral_raises: [
        'Stand with arms at sides, slight elbow bend',
        'Raise both arms out to sides simultaneously',
        'Stop when wrists are at shoulder height (T-shape)',
        'Lower slowly — don\'t let arms drop',
        'No shrugging — keep shoulders down and level',
    ],
    mountain_pose: [
        'Stand with feet together, weight evenly distributed',
        'Arms hang naturally at sides, palms forward',
        'Lengthen spine — imagine a string pulling your crown up',
        'Relax shoulders down and back',
        'Breathe deeply and hold for 30 seconds',
    ],
    warrior_i: [
        'Step one foot forward into a wide lunge',
        'Bend front knee to ~90° — knee over ankle',
        'Back leg stays straight and strong',
        'Raise both arms overhead, palms together',
        'Square hips forward and hold for 30 seconds',
    ],
    warrior_ii: [
        'Step feet wide apart — about 3-4 feet',
        'Turn front foot 90°, back foot slightly inward',
        'Bend front knee to 90° over ankle',
        'Extend arms out to sides at shoulder height',
        'Gaze over front fingertips and hold for 30 seconds',
    ],
    tree_pose: [
        'Stand on one leg, find your balance point',
        'Place other foot on inner calf or inner thigh (not knee)',
        'Bring hands to prayer at chest, or raise overhead',
        'Keep standing hip level — engage your core',
        'Fix your gaze on a still point and hold for 30 seconds',
    ],
    chair_pose: [
        'Stand with feet hip-width apart',
        'Bend knees and lower as if sitting in a chair',
        'Aim for thighs parallel to the floor (~100°)',
        'Raise arms overhead, parallel or palms together',
        'Keep chest lifted, spine long — hold for 30 seconds',
    ],
    triangle_pose: [
        'Stand with feet wide apart (3-4 feet)',
        'Turn front foot out 90°, back foot slightly in',
        'Keep both legs straight and strong',
        'Reach front hand down toward ankle/shin/floor',
        'Extend top arm straight up — gaze up to top hand, hold 30s',
    ],
};

// ════════════════════════════════════════════════════════════════
//  CATEGORY TABS
// ════════════════════════════════════════════════════════════════
CAT_TABS.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tracking) return;
        CAT_TABS.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.cat;
        document.querySelectorAll('.exercise-selector').forEach(el => el.classList.add('hidden'));
        document.getElementById(`cat-${cat}`)?.classList.remove('hidden');
    });
});

// ════════════════════════════════════════════════════════════════
//  EXERCISE SELECTOR
// ════════════════════════════════════════════════════════════════
EX_BTNS.forEach(btn => {
    btn.addEventListener('click', () => {
        if (tracking) return;
        EX_BTNS.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEx = btn.dataset.ex;
        isYogaMode = YOGA_EXERCISES.has(currentEx);
        updateGuide();
        updateExLabel();
        updateYogaMode();
    });
});

function updateGuide() {
    const steps = EX_GUIDES[currentEx] || [];
    const isYoga = YOGA_EXERCISES.has(currentEx);
    guideContent.innerHTML = steps.map((s, i) =>
        `<div class="guide-step">
            <div class="guide-num ${isYoga ? 'yoga-num' : ''}">${i + 1}</div>
            <p>${s}</p>
        </div>`
    ).join('');
}

function updateExLabel() {
    exNameLabel.textContent = EX_LABELS[currentEx] || currentEx;
    const col = EX_COLORS[currentEx] || '#5b5cf0';
    feedbackBox.style.borderColor = col;
}

function updateYogaMode() {
    isYogaMode = YOGA_EXERCISES.has(currentEx);
    if (isYogaMode) {
        yogaBadge.classList.remove('hidden');
        repDisplay.classList.add('hidden');
        yogaDisplay.classList.remove('hidden');
        repCard.classList.add('yoga-active');
        // Swap metric labels for yoga
        mAngleLabel.textContent = 'Hold Time';
        mAvgLabel.textContent = 'Hold Target';
        mStatusLabel.textContent = 'In Pose';
        mSpeedItem.style.opacity = '0.3';
        mAvgTimeItem.style.opacity = '1';
    } else {
        yogaBadge.classList.add('hidden');
        repDisplay.classList.remove('hidden');
        yogaDisplay.classList.add('hidden');
        repCard.classList.remove('yoga-active');
        mAngleLabel.textContent = 'Joint Angle';
        mAvgLabel.textContent = 'Avg Rep Time';
        mStatusLabel.textContent = 'Status';
        mSpeedItem.style.opacity = '1';
        mAvgTimeItem.style.opacity = '1';
    }
}

// ════════════════════════════════════════════════════════════════
//  BUTTON HANDLERS
// ════════════════════════════════════════════════════════════════
btnStartCam.addEventListener('click', async () => {
    btnStartCam.disabled = true;
    btnStartCam.textContent = 'Starting...';
    try {
        const r = await fetch('/start_camera', { method: 'POST' });
        const d = await r.json();
        if (!d.ok) throw new Error(d.message);

        placeholder.style.display = 'none';
        videoFeed.src = '/video_feed?' + Date.now();
        videoFeed.style.display = 'block';

        btnStartCam.classList.add('hidden');
        btnStartEx.classList.remove('hidden');
        btnStopCam.classList.remove('hidden');
        btnFs.classList.remove('hidden');

        cameraOn = true;
        startPolling();
        updateGuide();
        updateExLabel();
        updateYogaMode();
    } catch (e) {
        alert('Camera error: ' + e.message);
        btnStartCam.disabled = false;
        btnStartCam.textContent = '📷 Start Camera';
    }
});

btnStartEx.addEventListener('click', () => doStartExercise());

async function doStartExercise() {
    const r = await fetch('/start_exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise: currentEx })
    });
    const d = await r.json();
    if (!d.ok) { alert('Error: ' + d.message); return; }

    tracking = true;
    btnStartEx.classList.add('hidden');
    btnStopEx.classList.remove('hidden');
    btnReset.classList.remove('hidden');
    stateBadge.textContent = isYogaMode ? 'Holding' : 'Tracking';
    stateBadge.className = 'stat-badge ' + (isYogaMode ? 'yoga-tracking' : 'tracking');
    enterFullscreen();
}

btnStopEx.addEventListener('click', () => doStopExercise());

async function doStopExercise() {
    await fetch('/stop_exercise', { method: 'POST' });
    tracking = false;
    btnStopEx.classList.add('hidden');
    btnStartEx.classList.remove('hidden');
    stateBadge.textContent = 'Stopped';
    stateBadge.className = 'stat-badge';
    exitFullscreen();
}

btnReset.addEventListener('click', async () => {
    await fetch('/reset_exercise', { method: 'POST' });
    repCount.textContent = '0';
    yogaSeconds.textContent = '0';
    yogaSets.textContent = '0';
    updateTimerArc(0, 30, false);
    updateFormBar(100);
    feedbackTxt.textContent = 'Reset — ready to go again';
    mAngle.textContent = '—';
    mSpeed.textContent = '—';
    mAvgTime.textContent = '—';
    mStatus.textContent = '—';
});

btnStopCam.addEventListener('click', async () => {
    exitFullscreen();
    clearInterval(pollTimer); pollTimer = null;
    await fetch('/stop_camera', { method: 'POST' });
    cameraOn = false; tracking = false;
    videoFeed.style.display = 'none';
    videoFeed.src = '';
    placeholder.style.display = 'flex';
    btnStopCam.classList.add('hidden');
    btnStartEx.classList.add('hidden');
    btnStopEx.classList.add('hidden');
    btnReset.classList.add('hidden');
    btnFs.classList.add('hidden');
    btnStartCam.classList.remove('hidden');
    btnStartCam.disabled = false;
    btnStartCam.textContent = '📷 Start Camera';
    stateBadge.textContent = 'Ready';
    stateBadge.className = 'stat-badge';
});

// ── Fullscreen ─────────────────────────────────────────────────────────────
function enterFullscreen() {
    const fn = cameraArea.requestFullscreen || cameraArea.webkitRequestFullscreen;
    if (fn) fn.call(cameraArea);
}
function exitFullscreen() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen;
    if (fn && document.fullscreenElement) fn.call(document);
}
document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    cameraArea.classList.toggle('is-fullscreen', isFs);
    btnFs.textContent = isFs ? '⛶ Exit' : '⛶ Fullscreen';
});
btnFs.addEventListener('click', () => {
    document.fullscreenElement ? exitFullscreen() : enterFullscreen();
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
            updateUI(d);
        } catch (e) { }
    }, 200);
}

function updateUI(d) {
    const s = d.stats || {};

    if (s.is_yoga) {
        // ── Yoga mode UI ──────────────────────────────────────
        const hold = s.hold_elapsed || 0;
        const target = s.hold_target || 30;
        const inPose = s.in_pose || false;

        yogaSeconds.textContent = Math.floor(hold);
        yogaTarget.textContent = target + 's';
        yogaSets.textContent = s.reps || 0;
        updateTimerArc(hold, target, inPose);

        // Metrics
        mAngle.textContent = hold.toFixed(1) + 's';
        mAvgTime.textContent = target + 's';
        mStatus.textContent = inPose ? '✓ In Pose' : '✗ Not in Pose';
        mStatus.style.color = inPose ? '#3fb950' : '#f85149';
        mSpeed.textContent = inPose ? 'Holding' : 'Get in pose';
        mSpeed.style.color = inPose ? '#fbbf24' : '#9ca3af';

    } else {
        // ── Physical exercise UI ──────────────────────────────
        if (s.reps !== undefined) repCount.textContent = s.reps;

        if (s.angle !== undefined) mAngle.textContent = s.angle + '°';
        if (s.speed_msg !== undefined) {
            mSpeed.textContent = s.speed_msg || '—';
            mSpeed.style.color = s.speed_status === 'good' ? '#3fb950'
                : s.speed_status === 'too_fast' ? '#f85149' : '#d29922';
        }
        if (s.avg_rep_time !== undefined)
            mAvgTime.textContent = s.avg_rep_time > 0 ? s.avg_rep_time + 's' : '—';
        if (s.speed_status !== undefined) {
            const statusMap = { good: '✓ Good', too_fast: '⚠ Too Fast', too_slow: '⚠ Too Slow' };
            mStatus.textContent = statusMap[s.speed_status] || '—';
            mStatus.style.color = s.speed_status === 'good' ? '#3fb950'
                : s.speed_status === 'too_fast' ? '#f85149' : '#d29922';
        }
    }

    // Shared UI
    if (s.form_score !== undefined) updateFormBar(s.form_score);

    if (s.feedback) {
        feedbackTxt.textContent = s.feedback;
        const col = EX_COLORS[currentEx] || '#5b5cf0';
        const isError = /Keep|Fix|Don't|Slow|deeper|Curl|Lower|Bend|Raise|Step|level|tight|arch|Lift|Extend|Straight|further/i.test(s.feedback);
        feedbackBox.style.borderColor = isError ? '#ef4444' : col;
        feedbackTxt.style.color = isError ? '#fca5a5' : '#e0e4ec';
    }

    // ── Alarm Logic ──────────────────────────────────────────
    if (tracking && !isYogaMode) {
        const tooFast = s.speed_status === 'too_fast';
        const veryWrong = s.form_score !== undefined && s.form_score < 40;
        
        if (tooFast || veryWrong) {
            const now = Date.now();
            if (now - lastAlarmTime > 800) { // Throttle alarm every 800ms
                playAlarm();
                lastAlarmTime = now;
                // Visual feedback
                document.body.classList.add('alarm-active');
                setTimeout(() => document.body.classList.remove('alarm-active'), 400);
            }
        }
    }
}

// ── Yoga timer ring ────────────────────────────────────────────────────────
function updateTimerArc(hold, target, inPose) {
    const circumference = 264; // 2 * π * 42
    const progress = Math.min(hold / Math.max(target, 1), 1.0);
    const offset = circumference * (1 - progress);
    timerArc.style.strokeDashoffset = offset;
    timerArc.style.stroke = inPose ? '#10b981' : '#f59e0b';
    timerArc.classList.toggle('in-pose', inPose);
}

function updateFormBar(score) {
    formFill.style.width = score + '%';
    formPct.textContent = score + '%';
    formFill.style.background = score >= 75 ? '#3fb950' : score >= 50 ? '#d29922' : '#f85149';
}

// ── Init ───────────────────────────────────────────────────────────────────
updateGuide();
updateExLabel();
updateYogaMode();