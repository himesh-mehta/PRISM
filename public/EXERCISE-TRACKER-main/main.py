"""
Exercise Tracker — main.py
===========================
Flask + OpenCV + MediaPipe (pose_landmarker_heavy.task)

PHYSICAL EXERCISES (Rep Counter):
  Squats | Bicep Curls | Push-ups | Neck Rotation | Neck Tilt
  Shoulder Rolls | Shoulder Press | Lateral Raises

YOGA POSES (Hold Timer):
  Mountain Pose | Warrior I | Warrior II | Tree Pose
  Chair Pose | Triangle Pose
"""

import cv2, math, time, threading, collections
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_py
from mediapipe.tasks.python import vision as mp_vis
from flask import Flask, Response, jsonify, render_template, request

app = Flask(__name__)

# ═══════════════════════════════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════════════════════════════
import os
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pose_landmarker_heavy.task')
TARGET_FPS     = 60
FRAME_INTERVAL = 1.0 / TARGET_FPS
ZOOM_SCALE     = 0.78

SPEED_TOO_FAST = 0.6
SPEED_TOO_SLOW = 4.0

# BGR colors
GREEN  = ( 60, 210,  80)
YELLOW = ( 30, 180, 220)
RED    = ( 60,  60, 220)
BLUE   = (240, 160,  60)
WHITE  = (240, 240, 250)
MUTE   = (130, 130, 140)
BLACK  = (  8,   8,  12)
ORANGE = ( 60, 160, 255)
PURPLE = (200,  80, 200)
TEAL   = (200, 210,  60)

# Landmark indices
LM = dict(
    NOSE=0, L_EAR=7, R_EAR=8,
    L_SH=11, R_SH=12, L_EL=13, R_EL=14,
    L_WR=15, R_WR=16,
    L_HIP=23, R_HIP=24,
    L_KNEE=25, R_KNEE=26,
    L_ANK=27, R_ANK=28,
    L_HEEL=29, R_HEEL=30,
)

EDGES = [
    (0,1,'face'),(1,2,'face'),(2,3,'face'),(3,7,'face'),
    (0,4,'face'),(4,5,'face'),(5,6,'face'),(6,8,'face'),
    (11,13,'arm'),(13,15,'arm'),(12,14,'arm'),(14,16,'arm'),
    (11,12,'torso'),(11,23,'torso'),(12,24,'torso'),(23,24,'torso'),
    (23,25,'leg'),(25,27,'leg'),(27,29,'leg'),
    (24,26,'leg'),(26,28,'leg'),(28,30,'leg'),
]
FACE_IDX = {0,1,2,3,4,5,6,7,8,9,10}

# ── Exercise categories ──────────────────────────────────────────
PHYSICAL_EXERCISES = [
    'squats','bicep_curls','pushups',
    'neck_rotation','neck_tilt',
    'shoulder_rolls','shoulder_press','lateral_raises',
]
YOGA_POSES = [
    'mountain_pose','warrior_i','warrior_ii',
    'tree_pose','chair_pose','triangle_pose',
]
EXERCISES = PHYSICAL_EXERCISES + YOGA_POSES

EXERCISE_LABELS = {
    'squats':          'Squats',
    'bicep_curls':     'Bicep Curls',
    'pushups':         'Push-ups',
    'neck_rotation':   'Neck Rotation',
    'neck_tilt':       'Neck Tilt',
    'shoulder_rolls':  'Shoulder Rolls',
    'shoulder_press':  'Shoulder Press',
    'lateral_raises':  'Lateral Raises',
    'mountain_pose':   'Mountain Pose',
    'warrior_i':       'Warrior I',
    'warrior_ii':      'Warrior II',
    'tree_pose':       'Tree Pose',
    'chair_pose':      'Chair Pose',
    'triangle_pose':   'Triangle Pose',
}

# Yoga hold targets (seconds)
YOGA_HOLD_TARGETS = {
    'mountain_pose': 30,
    'warrior_i':     30,
    'warrior_ii':    30,
    'tree_pose':     30,
    'chair_pose':    30,
    'triangle_pose': 30,
}


# ═══════════════════════════════════════════════════════════════
#  MATH HELPERS
# ═══════════════════════════════════════════════════════════════
def angle3(a, b, c):
    ba = (a[0]-b[0], a[1]-b[1])
    bc = (c[0]-b[0], c[1]-b[1])
    dot = ba[0]*bc[0] + ba[1]*bc[1]
    mag = math.hypot(*ba) * math.hypot(*bc)
    if mag < 1e-6: return 0.0
    return math.degrees(math.acos(max(-1.0, min(1.0, dot/mag))))

def lm_pt(lms, idx, w, h):
    return (int(lms[idx].x*w), int(lms[idx].y*h))

def lm_xy(lms, idx):
    return (lms[idx].x, lms[idx].y)

def midpoint(a, b):
    return ((a[0]+b[0])//2, (a[1]+b[1])//2)


# ═══════════════════════════════════════════════════════════════
#  SKELETON DRAW
# ═══════════════════════════════════════════════════════════════
def draw_skeleton(frame, lms, accent):
    h, w = frame.shape[:2]

    def dim(c, f): return tuple(int(x*f) for x in c)
    gcol = {
        'face':  (40, 40, 55),
        'arm':   dim(accent, 0.85),
        'torso': accent,
        'leg':   dim(accent, 0.72),
    }

    pts = [(int(lm.x*w), int(lm.y*h),
            float(lm.visibility) if hasattr(lm,'visibility') else 1.0)
           for lm in lms]

    glow = np.zeros_like(frame)
    for a, b, grp in EDGES:
        if grp == 'face': continue
        if a >= len(pts) or b >= len(pts): continue
        v = min(pts[a][2], pts[b][2])
        if v < 0.3: continue
        cv2.line(glow, pts[a][:2], pts[b][:2], gcol[grp], 14, cv2.LINE_AA)
    glow = cv2.GaussianBlur(glow, (21,21), 0)
    cv2.addWeighted(frame, 1.0, glow, 0.28, 0, frame)

    for a, b, grp in EDGES:
        if a >= len(pts) or b >= len(pts): continue
        v = min(pts[a][2], pts[b][2])
        if v < 0.25: continue
        c  = gcol[grp]
        cv = tuple(int(x*min(v,1.0)) for x in c)
        cv2.line(frame, pts[a][:2], pts[b][:2], cv, 2 if grp=='face' else 3, cv2.LINE_AA)

    for idx, (px, py, vis) in enumerate(pts):
        if vis < 0.25: continue
        if idx in FACE_IDX:
            cv2.circle(frame, (px,py), 3, (40,40,55), -1, cv2.LINE_AA)
        else:
            vf = min(vis,1.0)
            ac = tuple(int(x*vf) for x in accent)
            cv2.circle(frame, (px,py), 9,  BLACK, -1, cv2.LINE_AA)
            cv2.circle(frame, (px,py), 8,  ac,     2, cv2.LINE_AA)
            cv2.circle(frame, (px,py), 4,  ac,    -1, cv2.LINE_AA)
            cv2.circle(frame, (px,py), 2,  WHITE, -1, cv2.LINE_AA)


# ═══════════════════════════════════════════════════════════════
#  ANGLE ARC OVERLAY
# ═══════════════════════════════════════════════════════════════
def draw_angle_arc(frame, joint_px, angle, color):
    cv2.putText(frame, f'{int(angle)}°',
                (joint_px[0]+14, joint_px[1]-8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.52, BLACK, 3, cv2.LINE_AA)
    cv2.putText(frame, f'{int(angle)}°',
                (joint_px[0]+14, joint_px[1]-8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.52, color, 1, cv2.LINE_AA)


# ═══════════════════════════════════════════════════════════════
#  SPEED CLASSIFIER
# ═══════════════════════════════════════════════════════════════
def classify_speed(seconds_per_phase):
    if seconds_per_phase < SPEED_TOO_FAST:
        return 'too_fast', 'Too Fast — slow down!'
    elif seconds_per_phase > SPEED_TOO_SLOW:
        return 'too_slow', 'Too Slow — keep moving'
    else:
        return 'good', 'Good Speed'


# ═══════════════════════════════════════════════════════════════
#  BASE CLASSES
# ═══════════════════════════════════════════════════════════════

class ExerciseBase:
    """Base class for physical rep-counting exercises."""
    def __init__(self, name):
        self.name         = name
        self.reps         = 0
        self.phase        = 'up'
        self.phase_start  = time.time()
        self.feedback     = 'Get into position'
        self.feedback_col = WHITE
        self.angle        = 0.0
        self.speed_msg    = ''
        self.speed_status = 'good'
        self.form_score   = 100
        self.rep_times    = collections.deque(maxlen=10)
        self.active       = True
        self.session_start= time.time()
        self.is_yoga      = False

    def avg_rep_time(self):
        if not self.rep_times: return 0.0
        return sum(self.rep_times)/len(self.rep_times)

    def process(self, lms, w, h):
        raise NotImplementedError

    def hud_info(self):
        return []


class YogaBase:
    """Base class for yoga hold poses (timer-based, no reps)."""
    def __init__(self, name, hold_target=30):
        self.name          = name
        self.is_yoga       = True
        self.hold_target   = hold_target   # seconds to hold
        self.hold_elapsed  = 0.0           # seconds currently held
        self.hold_start    = None          # time when pose was entered
        self.in_pose       = False
        self.completed     = False
        self.reps          = 0             # used as "sets completed" for yoga
        self.feedback      = 'Get into position'
        self.feedback_col  = WHITE
        self.angle         = 0.0
        self.form_score    = 100
        self.speed_msg     = ''
        self.speed_status  = 'good'
        self.session_start = time.time()

    def avg_rep_time(self):
        return float(self.hold_target)

    def _enter_pose(self):
        if not self.in_pose:
            self.in_pose    = True
            self.hold_start = time.time()

    def _exit_pose(self):
        if self.in_pose:
            self.hold_elapsed += time.time() - self.hold_start
            self.in_pose       = False
            self.hold_start    = None
            self.completed     = False   # reset completion if they break pose

    def _current_hold(self):
        base = self.hold_elapsed
        if self.in_pose and self.hold_start:
            base += time.time() - self.hold_start
        return base

    def process(self, lms, w, h):
        raise NotImplementedError

    def hud_info(self):
        return []


# ═══════════════════════════════════════════════════════════════
#  PHYSICAL EXERCISE TRACKERS
# ═══════════════════════════════════════════════════════════════

class SquatTracker(ExerciseBase):
    def __init__(self):
        super().__init__('squats')
        self.phase = 'up'

    def process(self, lms, w, h):
        try:
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'], w, h)
            r_hip = lm_pt(lms, LM['R_HIP'], w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'], w, h)

            l_ang = angle3(l_hip, l_kn, l_ank)
            r_ang = angle3(r_hip, r_kn, r_ank)
            self.angle = (l_ang + r_ang) / 2

            if self.phase == 'up' and self.angle < 95:
                self.phase = 'down'; self.phase_start = time.time()
            elif self.phase == 'down' and self.angle > 160:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1; self.phase = 'up'

            issues = []
            l_cave = abs(lms[LM['L_KNEE']].x - lms[LM['L_ANK']].x) * 100
            r_cave = abs(lms[LM['R_KNEE']].x - lms[LM['R_ANK']].x) * 100
            if l_cave > 8 or r_cave > 8:
                issues.append('Keep knees over toes')
            l_sh = lm_pt(lms, LM['L_SH'], w, h)
            if abs(l_sh[0] - l_hip[0]) > w * 0.12:
                issues.append('Keep back straight')
            if self.phase == 'down' and self.angle > 110:
                issues.append('Go deeper — aim for 90°')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self.feedback = 'Good Squat Form' if self.phase == 'down' else 'Good — go lower'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_kn, self.angle, self.feedback_col),
                    (r_kn, r_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Knee Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class BicepCurlTracker(ExerciseBase):
    def __init__(self):
        super().__init__('bicep_curls')
        self.phase = 'down'

    def process(self, lms, w, h):
        try:
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            l_el  = lm_pt(lms, LM['L_EL'],  w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            r_el  = lm_pt(lms, LM['R_EL'],  w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],  w, h)

            l_ang = angle3(l_sh, l_el, l_wr)
            r_ang = angle3(r_sh, r_el, r_wr)
            self.angle = (l_ang + r_ang) / 2

            if self.phase == 'down' and self.angle < 50:
                self.phase = 'up'; self.phase_start = time.time()
            elif self.phase == 'up' and self.angle > 150:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1; self.phase = 'down'

            issues = []
            l_drift = abs(lms[LM['L_EL']].x - lms[LM['L_SH']].x) * 100
            r_drift = abs(lms[LM['R_EL']].x - lms[LM['R_SH']].x) * 100
            if l_drift > 12 or r_drift > 12:
                issues.append('Keep elbows fixed at sides')
            if self.phase == 'up' and self.angle > 70:
                issues.append('Curl all the way up')
            if self.phase == 'down' and self.angle < 130:
                issues.append('Lower all the way down')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self.feedback = 'Good Curl Form'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_el, l_ang, self.feedback_col),
                    (r_el, r_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Elbow Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class PushupTracker(ExerciseBase):
    def __init__(self):
        super().__init__('pushups')
        self.phase = 'up'

    def process(self, lms, w, h):
        try:
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            l_el  = lm_pt(lms, LM['L_EL'],  w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            r_el  = lm_pt(lms, LM['R_EL'],  w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],  w, h)
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'], w, h)

            l_ang = angle3(l_sh, l_el, l_wr)
            r_ang = angle3(r_sh, r_el, r_wr)
            self.angle = (l_ang + r_ang) / 2

            if self.phase == 'up' and self.angle < 90:
                self.phase = 'down'; self.phase_start = time.time()
            elif self.phase == 'down' and self.angle > 155:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1; self.phase = 'up'

            issues = []
            body_angle = angle3(l_sh, l_hip, l_ank)
            if body_angle < 155:
                issues.append("Keep body in a plank — don't sag hips")
            elbow_width  = abs(lms[LM['L_EL']].x - lms[LM['R_EL']].x) * 100
            should_width = abs(lms[LM['L_SH']].x - lms[LM['R_SH']].x) * 100
            if elbow_width > should_width * 1.5:
                issues.append('Bring elbows closer to body')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self.feedback = 'Good Push-up Form'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_el, l_ang, self.feedback_col),
                    (r_el, r_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Elbow Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class NeckRotationTracker(ExerciseBase):
    def __init__(self):
        super().__init__('neck_rotation')
        self.phase = 'center'
        self.last_side    = None
        self.rotation_deg = 0.0

    def process(self, lms, w, h):
        try:
            nose  = lm_pt(lms, LM['NOSE'],  w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)

            sh_mid_x  = (l_sh[0] + r_sh[0]) // 2
            sh_width  = abs(l_sh[0] - r_sh[0])
            threshold = sh_width * 0.22

            nose_offset  = nose[0] - sh_mid_x
            self.angle   = abs(nose_offset / max(sh_width, 1) * 90)
            self.rotation_deg = nose_offset / max(sh_width,1) * 45

            if nose[0] < sh_mid_x - threshold:
                current_side = 'left'
            elif nose[0] > sh_mid_x + threshold:
                current_side = 'right'
            else:
                current_side = 'center'

            if current_side != 'center' and current_side != self.last_side:
                if self.last_side is not None:
                    elapsed = time.time() - self.phase_start
                    self.rep_times.append(elapsed)
                    s, m = classify_speed(elapsed)
                    self.speed_status = s; self.speed_msg = m
                    if self.last_side == 'right' and current_side == 'left':
                        self.reps += 1
                self.last_side   = current_side
                self.phase_start = time.time()

            issues = []
            sh_y_diff = abs(l_sh[1] - r_sh[1])
            if sh_y_diff > h * 0.05:
                issues.append('Keep shoulders still — only rotate neck')
            time_in_phase = time.time() - self.phase_start
            if time_in_phase < SPEED_TOO_FAST and current_side != 'center':
                issues.append('Slow down — medium speed only')
            if self.angle < 20 and current_side != 'center':
                issues.append('Rotate further for full range')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                if current_side == 'left':   self.feedback = 'Rotating Left ←'
                elif current_side == 'right': self.feedback = 'Rotating Right →'
                else:                         self.feedback = 'Head Centred'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(nose, self.angle, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Direction', self.last_side.upper() if self.last_side else 'CENTER', BLUE),
            ('Rotation', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class NeckTiltTracker(ExerciseBase):
    """
    Neck lateral tilt: ear moves toward shoulder.
    Tracks left ear y vs left shoulder y distance, and right side.
    Phase LEFT: left ear significantly lower than right ear
    Phase RIGHT: right ear significantly lower than left ear
    """
    def __init__(self):
        super().__init__('neck_tilt')
        self.phase     = 'center'
        self.last_side = None

    def process(self, lms, w, h):
        try:
            l_ear = lm_pt(lms, LM['L_EAR'], w, h)
            r_ear = lm_pt(lms, LM['R_EAR'], w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            nose  = lm_pt(lms, LM['NOSE'],  w, h)

            ear_y_diff  = l_ear[1] - r_ear[1]   # positive = left ear lower
            sh_height   = abs(l_sh[1] - r_sh[1])
            ear_sep     = abs(l_ear[0] - r_ear[0])
            threshold   = max(ear_sep * 0.20, 15)

            # Approximate tilt angle
            self.angle = abs(math.degrees(math.atan2(abs(ear_y_diff), max(ear_sep,1))))

            if ear_y_diff > threshold:
                current_side = 'left'
            elif ear_y_diff < -threshold:
                current_side = 'right'
            else:
                current_side = 'center'

            if current_side != 'center' and current_side != self.last_side:
                if self.last_side is not None:
                    elapsed = time.time() - self.phase_start
                    self.rep_times.append(elapsed)
                    s, m = classify_speed(elapsed)
                    self.speed_status = s; self.speed_msg = m
                    if self.last_side == 'left' and current_side == 'right':
                        self.reps += 1
                    elif self.last_side == 'right' and current_side == 'left':
                        self.reps += 1
                self.last_side   = current_side
                self.phase_start = time.time()

            issues = []
            # Shoulders should stay level
            if sh_height > h * 0.04:
                issues.append('Keep shoulders level — only tilt head')
            # Head shouldn't rotate (nose should stay roughly centred)
            nose_center = (l_sh[0] + r_sh[0]) // 2
            if abs(nose[0] - nose_center) > abs(l_sh[0] - r_sh[0]) * 0.3:
                issues.append('Keep face forward — no rotation')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                if current_side == 'left':   self.feedback = 'Tilting Left ←'
                elif current_side == 'right': self.feedback = 'Tilting Right →'
                else:                         self.feedback = 'Head Centred — tilt now'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(nose, self.angle, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Side', self.last_side.upper() if self.last_side else 'CENTER', BLUE),
            ('Tilt Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class ShoulderRollTracker(ExerciseBase):
    """
    Shoulder rolls: track y-position cycle of shoulder midpoint.
    Phase UP  : shoulder mid y above neutral - threshold
    Phase DOWN: shoulder mid y below neutral + threshold
    Each full UP→DOWN→UP cycle = 1 rep.
    """
    def __init__(self):
        super().__init__('shoulder_rolls')
        self.phase         = 'neutral'
        self.neutral_y     = None
        self.calibration_frames = 0
        self.y_samples     = []

    def process(self, lms, w, h):
        try:
            l_sh = lm_pt(lms, LM['L_SH'], w, h)
            r_sh = lm_pt(lms, LM['R_SH'], w, h)
            mid_y = (l_sh[1] + r_sh[1]) // 2

            # Calibrate neutral in first 30 frames
            if self.calibration_frames < 30:
                self.y_samples.append(mid_y)
                self.calibration_frames += 1
                if self.calibration_frames == 30:
                    self.neutral_y = int(sum(self.y_samples) / len(self.y_samples))
                self.feedback     = 'Calibrating... stand still'
                self.feedback_col = YELLOW
                return []

            sh_span   = abs(l_sh[0] - r_sh[0])
            threshold = sh_span * 0.08
            offset    = mid_y - self.neutral_y  # positive = shoulders dropped

            self.angle = abs(offset / max(sh_span, 1) * 90)

            if self.phase == 'neutral' and offset < -threshold:
                self.phase = 'up'; self.phase_start = time.time()
            elif self.phase == 'up' and offset > threshold:
                self.phase = 'down'
            elif self.phase == 'down' and abs(offset) < threshold * 0.5:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1
                self.phase = 'neutral'

            issues = []
            # Shoulders should move together (y diff shouldn't be too large)
            y_diff = abs(l_sh[1] - r_sh[1])
            if y_diff > h * 0.05:
                issues.append('Roll both shoulders together evenly')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                phase_labels = {'up':'Shoulders UP ↑','down':'Shoulders DOWN ↓','neutral':'Roll forward'}
                self.feedback = phase_labels.get(self.phase, 'Keep rolling')
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_sh, self.angle, self.feedback_col),
                    (r_sh, self.angle, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Shoulder Lift', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class ShoulderPressTracker(ExerciseBase):
    """
    Overhead press: wrist y vs shoulder y.
    Phase DOWN: wrists near shoulder level (ang ~90°)
    Phase UP  : arms nearly straight overhead (ang >155°)
    Uses shoulder-elbow-wrist angle.
    """
    def __init__(self):
        super().__init__('shoulder_press')
        self.phase = 'down'

    def process(self, lms, w, h):
        try:
            l_sh = lm_pt(lms, LM['L_SH'], w, h)
            l_el = lm_pt(lms, LM['L_EL'], w, h)
            l_wr = lm_pt(lms, LM['L_WR'], w, h)
            r_sh = lm_pt(lms, LM['R_SH'], w, h)
            r_el = lm_pt(lms, LM['R_EL'], w, h)
            r_wr = lm_pt(lms, LM['R_WR'], w, h)

            # Angle at elbow (shoulder → elbow → wrist)
            l_ang = angle3(l_sh, l_el, l_wr)
            r_ang = angle3(r_sh, r_el, r_wr)
            self.angle = (l_ang + r_ang) / 2

            if self.phase == 'down' and self.angle > 155:
                self.phase = 'up'; self.phase_start = time.time()
            elif self.phase == 'up' and self.angle < 90:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1; self.phase = 'down'

            issues = []
            # Wrists should be above elbows when pressing (y less in image = higher)
            l_above = l_wr[1] < l_el[1]
            r_above = r_wr[1] < r_el[1]
            if self.phase == 'up' and not (l_above and r_above):
                issues.append('Press arms fully overhead')

            # Elbows at ~90° at start
            if self.phase == 'down' and self.angle > 120:
                issues.append('Lower to 90° before pressing')

            # Back arch — hip should stay under shoulder
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            if abs(l_sh[0] - l_hip[0]) > w * 0.14:
                issues.append('Keep core tight — no back arch')

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self.feedback = 'Arms overhead — lock out!' if self.phase == 'up' else 'Lower to 90° and press'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_el, l_ang, self.feedback_col),
                    (r_el, r_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Elbow Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


class LateralRaiseTracker(ExerciseBase):
    """
    Lateral raises: arms raise from sides to shoulder height (T-shape).
    Track shoulder-hip-wrist angle OR shoulder y vs wrist y.
    Phase DOWN: wrists below shoulders
    Phase UP  : wrists at/above shoulder level
    """
    def __init__(self):
        super().__init__('lateral_raises')
        self.phase = 'down'

    def process(self, lms, w, h):
        try:
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],  w, h)
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            l_el  = lm_pt(lms, LM['L_EL'],  w, h)
            r_el  = lm_pt(lms, LM['R_EL'],  w, h)

            # Angle: hip → shoulder → wrist (arm raise angle)
            l_ang = angle3(l_hip, l_sh, l_wr)
            r_ang = angle3(l_hip, r_sh, r_wr)   # approx
            self.angle = (l_ang + r_ang) / 2

            # Arms up = wrist y < shoulder y (smaller y = higher in frame)
            l_up = l_wr[1] < l_sh[1] + 20
            r_up = r_wr[1] < r_sh[1] + 20
            arms_up = l_up and r_up

            if self.phase == 'down' and arms_up:
                self.phase = 'up'; self.phase_start = time.time()
            elif self.phase == 'up' and not arms_up:
                elapsed = time.time() - self.phase_start
                self.rep_times.append(elapsed)
                s, m = classify_speed(elapsed)
                self.speed_status = s; self.speed_msg = m
                self.reps += 1; self.phase = 'down'

            issues = []
            # Elbows should be slightly bent — not locked
            l_el_ang = angle3(l_sh, l_el, l_wr)
            r_el_ang = angle3(r_sh, r_el, r_wr)
            if l_el_ang > 170 or r_el_ang > 170:
                issues.append('Keep a slight bend in elbows')
            # Don't raise above shoulder — wrists stay level with shoulders at top
            if arms_up:
                over_l = l_wr[1] < l_sh[1] - h*0.08
                over_r = r_wr[1] < r_sh[1] - h*0.08
                if over_l or over_r:
                    issues.append("Don't raise above shoulder height")
            # Shoulders should stay level — no shrugging
            sh_y_diff = abs(l_sh[1] - r_sh[1])
            if sh_y_diff > h * 0.05:
                issues.append("Don't shrug — keep shoulders level")

            if issues:
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self.feedback = 'Hold at shoulder height!' if arms_up else 'Raise arms to sides'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_sh, l_ang, self.feedback_col),
                    (r_sh, r_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        return [
            ('Phase', self.phase.upper(), BLUE),
            ('Raise Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Speed', self.speed_msg or '—', GREEN if self.speed_status=='good' else
             YELLOW if self.speed_status=='too_slow' else RED),
        ]


# ═══════════════════════════════════════════════════════════════
#  YOGA TRACKERS  (hold timer, no reps)
# ═══════════════════════════════════════════════════════════════

class MountainPoseTracker(YogaBase):
    """
    Tadasana — standing upright, arms at sides, feet together.
    Check: body is vertical (shoulder-hip-ankle alignment),
           arms hang straight, head neutral.
    """
    def __init__(self):
        super().__init__('mountain_pose', YOGA_HOLD_TARGETS['mountain_pose'])

    def process(self, lms, w, h):
        try:
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            r_hip = lm_pt(lms, LM['R_HIP'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'], w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],  w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],  w, h)

            # Vertical alignment: shoulder mid x ≈ hip mid x ≈ ankle mid x
            sh_mid  = (l_sh[0]  + r_sh[0])  // 2
            hip_mid = (l_hip[0] + r_hip[0]) // 2
            ank_mid = (l_ank[0] + r_ank[0]) // 2
            sh_span = abs(l_sh[0] - r_sh[0])

            body_align = max(abs(sh_mid - hip_mid), abs(hip_mid - ank_mid))
            in_pose = body_align < sh_span * 0.18

            self.angle = body_align / max(sh_span, 1) * 90

            issues = []
            if body_align > sh_span * 0.18:
                issues.append('Stand straight — align hips over ankles')
            # Arms hanging — wrists near hip level
            l_wr_offset = abs(l_wr[0] - l_sh[0])
            r_wr_offset = abs(r_wr[0] - r_sh[0])
            if l_wr_offset > sh_span * 0.5 or r_wr_offset > sh_span * 0.5:
                issues.append('Let arms hang naturally at sides')
            # Shoulders level
            if abs(l_sh[1] - r_sh[1]) > h * 0.04:
                issues.append('Level your shoulders')

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} complete! Rest and repeat'
                else:
                    self.feedback = f'Hold... {self.hold_target - min(hold, self.hold_target):.0f}s left'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_sh, self.angle, self.feedback_col),
                    (r_sh, self.angle, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Target', f'{self.hold_target}s', BLUE),
            ('Sets Done', str(self.reps), WHITE),
        ]


class WarriorITracker(YogaBase):
    """
    Warrior I: front knee bent ~90°, back leg straight, arms overhead.
    Check front knee angle, back leg extension, arms raised.
    """
    def __init__(self):
        super().__init__('warrior_i', YOGA_HOLD_TARGETS['warrior_i'])

    def process(self, lms, w, h):
        try:
            l_hip = lm_pt(lms, LM['L_HIP'],  w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'],  w, h)
            r_hip = lm_pt(lms, LM['R_HIP'],  w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'],  w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],   w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],   w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],   w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],   w, h)

            l_kn_ang = angle3(l_hip, l_kn, l_ank)
            r_kn_ang = angle3(r_hip, r_kn, r_ank)
            # Front knee is the more bent one
            if l_kn_ang < r_kn_ang:
                front_ang, back_ang = l_kn_ang, r_kn_ang
                front_kn = l_kn
            else:
                front_ang, back_ang = r_kn_ang, l_kn_ang
                front_kn = r_kn
            self.angle = front_ang

            # Arms raised: wrists above shoulders
            arms_up = l_wr[1] < l_sh[1] and r_wr[1] < r_sh[1]

            issues = []
            if front_ang > 110:
                issues.append('Bend front knee deeper — aim for 90°')
            if back_ang < 155:
                issues.append('Straighten back leg fully')
            if not arms_up:
                issues.append('Raise arms overhead — palms together')

            in_pose = (front_ang <= 110) and (back_ang >= 155) and arms_up

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} done! Switch sides'
                else:
                    self.feedback = f'Hold Warrior I... {self.hold_target - min(hold,self.hold_target):.0f}s'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(front_kn, front_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Knee Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Sets Done', str(self.reps), WHITE),
        ]


class WarriorIITracker(YogaBase):
    """
    Warrior II: front knee ~90°, arms extended out to sides (T-shape), gaze forward.
    Check knee angle, hip opening (hips face side), arms level.
    """
    def __init__(self):
        super().__init__('warrior_ii', YOGA_HOLD_TARGETS['warrior_ii'])

    def process(self, lms, w, h):
        try:
            l_hip = lm_pt(lms, LM['L_HIP'],  w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'],  w, h)
            r_hip = lm_pt(lms, LM['R_HIP'],  w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'],  w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],   w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],   w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],   w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],   w, h)

            l_kn_ang = angle3(l_hip, l_kn, l_ank)
            r_kn_ang = angle3(r_hip, r_kn, r_ank)
            front_ang = min(l_kn_ang, r_kn_ang)
            self.angle = front_ang
            front_kn   = l_kn if l_kn_ang < r_kn_ang else r_kn

            # Arms should be extended horizontally — wrists near shoulder height
            l_arm_level = abs(l_wr[1] - l_sh[1]) < h * 0.10
            r_arm_level = abs(r_wr[1] - r_sh[1]) < h * 0.10
            arms_level  = l_arm_level and r_arm_level

            # Wide arm span
            arm_span   = abs(l_wr[0] - r_wr[0])
            sh_span    = abs(l_sh[0]  - r_sh[0])
            wide_arms  = arm_span > sh_span * 2.0

            issues = []
            if front_ang > 110:
                issues.append('Bend front knee to 90°')
            if not arms_level:
                issues.append('Keep arms at shoulder height — parallel to ground')
            if not wide_arms:
                issues.append('Extend arms out wide to both sides')

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} done! Switch sides'
                else:
                    self.feedback = f'Hold Warrior II... {self.hold_target - min(hold,self.hold_target):.0f}s'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(front_kn, front_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Knee Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Sets Done', str(self.reps), WHITE),
        ]


class TreePoseTracker(YogaBase):
    """
    Vrksasana: stand on one leg, other foot on inner thigh/calf.
    Detect: one ankle raised (y significantly above ground level),
            arms raised overhead or at chest.
    """
    def __init__(self):
        super().__init__('tree_pose', YOGA_HOLD_TARGETS['tree_pose'])

    def process(self, lms, w, h):
        try:
            l_ank = lm_pt(lms, LM['L_ANK'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'], w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'],w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'],w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],  w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],  w, h)
            l_hip = lm_pt(lms, LM['L_HIP'], w, h)
            r_hip = lm_pt(lms, LM['R_HIP'], w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],  w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],  w, h)

            # Raised leg: ankle y much higher (smaller pixel y) than other ankle
            ankle_y_diff = abs(l_ank[1] - r_ank[1])
            frame_height = h
            one_leg = ankle_y_diff > frame_height * 0.18  # one ankle lifted

            # Balance: hips level
            hip_level = abs(l_hip[1] - r_hip[1]) < h * 0.08

            # Arms: either raised overhead or at prayer (wrists near chest centre)
            chest_x = (l_sh[0] + r_sh[0]) // 2
            chest_y = (l_sh[1] + r_sh[1]) // 2
            arms_raised = l_wr[1] < l_sh[1] and r_wr[1] < r_sh[1]
            arms_prayer = (abs(l_wr[0] - chest_x) < 80 and abs(r_wr[0] - chest_x) < 80
                           and abs(l_wr[1] - chest_y) < 80)
            good_arms = arms_raised or arms_prayer

            self.angle = ankle_y_diff / max(frame_height, 1) * 90

            issues = []
            if not one_leg:
                issues.append('Lift one foot off the ground')
            elif not hip_level:
                issues.append('Keep hips level — engage core')
            if not good_arms:
                issues.append('Arms overhead or hands at prayer')

            in_pose = one_leg and hip_level and good_arms

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} done! Switch leg'
                else:
                    self.feedback = f'Balance... {self.hold_target - min(hold,self.hold_target):.0f}s'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return []
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Leg Lift', f'{self.angle:.0f}°', self.feedback_col),
            ('Sets Done', str(self.reps), WHITE),
        ]


class ChairPoseTracker(YogaBase):
    """
    Utkatasana: deep squat with arms raised overhead.
    Knee angle ~100-120°, arms raised, back upright.
    """
    def __init__(self):
        super().__init__('chair_pose', YOGA_HOLD_TARGETS['chair_pose'])

    def process(self, lms, w, h):
        try:
            l_hip = lm_pt(lms, LM['L_HIP'],  w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'], w, h)
            l_ank = lm_pt(lms, LM['L_ANK'],  w, h)
            r_hip = lm_pt(lms, LM['R_HIP'],  w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'], w, h)
            r_ank = lm_pt(lms, LM['R_ANK'],  w, h)
            l_sh  = lm_pt(lms, LM['L_SH'],   w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],   w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],   w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],   w, h)

            l_kn_ang = angle3(l_hip, l_kn, l_ank)
            r_kn_ang = angle3(r_hip, r_kn, r_ank)
            self.angle = (l_kn_ang + r_kn_ang) / 2

            arms_up    = l_wr[1] < l_sh[1] and r_wr[1] < r_sh[1]
            knees_bent = self.angle < 130
            back_up    = abs(l_sh[0] - l_hip[0]) < (abs(l_sh[0]-r_sh[0]) * 0.3)

            issues = []
            if not knees_bent:
                issues.append('Bend knees deeper — sit back like a chair')
            elif self.angle < 70:
                issues.append('Not too deep — stay at ~100°')
            if not arms_up:
                issues.append('Raise arms overhead, parallel or together')
            if not back_up:
                issues.append('Keep chest lifted — lengthen spine')

            in_pose = knees_bent and arms_up and back_up and self.angle >= 70

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} complete! Rest and repeat'
                else:
                    self.feedback = f'Hold Chair Pose... {self.hold_target - min(hold,self.hold_target):.0f}s'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_kn, l_kn_ang, self.feedback_col),
                    (r_kn, r_kn_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Knee Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Sets Done', str(self.reps), WHITE),
        ]


class TrianglePoseTracker(YogaBase):
    """
    Trikonasana: legs wide, one arm reaches down toward ankle,
    other arm raised straight up. Body forms a triangle.
    Check: legs straight, side bend, top arm vertical.
    """
    def __init__(self):
        super().__init__('triangle_pose', YOGA_HOLD_TARGETS['triangle_pose'])

    def process(self, lms, w, h):
        try:
            l_sh  = lm_pt(lms, LM['L_SH'],   w, h)
            r_sh  = lm_pt(lms, LM['R_SH'],   w, h)
            l_hip = lm_pt(lms, LM['L_HIP'],  w, h)
            r_hip = lm_pt(lms, LM['R_HIP'],  w, h)
            l_ank = lm_pt(lms, LM['L_ANK'],  w, h)
            r_ank = lm_pt(lms, LM['R_ANK'],  w, h)
            l_kn  = lm_pt(lms, LM['L_KNEE'], w, h)
            r_kn  = lm_pt(lms, LM['R_KNEE'], w, h)
            l_wr  = lm_pt(lms, LM['L_WR'],   w, h)
            r_wr  = lm_pt(lms, LM['R_WR'],   w, h)

            # Wide stance: ankles wide apart
            ankle_span = abs(l_ank[0] - r_ank[0])
            sh_span    = abs(l_sh[0]  - r_sh[0])
            wide_stance = ankle_span > sh_span * 1.8

            # Legs straight
            l_kn_ang = angle3(l_hip, l_kn, l_ank)
            r_kn_ang = angle3(r_hip, r_kn, r_ank)
            legs_straight = l_kn_ang > 155 and r_kn_ang > 155
            self.angle = (l_kn_ang + r_kn_ang) / 2

            # One wrist near ankle (low), other wrist up (high)
            low_wr  = max(l_wr[1], r_wr[1])   # larger y = lower in frame
            high_wr = min(l_wr[1], r_wr[1])
            ref_ank = max(l_ank[1], r_ank[1])
            arm_reach = low_wr > (ref_ank - h * 0.25)  # reaching toward ankle
            arm_up    = high_wr < min(l_sh[1], r_sh[1]) - h * 0.05  # arm raised

            issues = []
            if not wide_stance:
                issues.append('Step feet wider — about 3-4 ft apart')
            if not legs_straight:
                issues.append('Keep both legs straight and strong')
            if not arm_reach:
                issues.append('Reach lower hand toward ankle')
            if not arm_up:
                issues.append('Extend top arm straight up toward ceiling')

            in_pose = wide_stance and legs_straight and arm_reach and arm_up

            if issues:
                self._exit_pose()
                self.feedback = issues[0]; self.feedback_col = RED
                self.form_score = max(40, self.form_score - 1)
            else:
                self._enter_pose()
                hold = self._current_hold()
                if hold >= self.hold_target and not self.completed:
                    self.completed = True
                    self.reps += 1
                    self.hold_elapsed = 0.0
                    self.in_pose = False
                    self.hold_start = None
                    self.feedback = f'Set {self.reps} done! Switch sides'
                else:
                    self.feedback = f'Hold Triangle... {self.hold_target - min(hold,self.hold_target):.0f}s'
                self.feedback_col = GREEN
                self.form_score = min(100, self.form_score + 1)

            return [(l_kn, l_kn_ang, self.feedback_col),
                    (r_kn, r_kn_ang, self.feedback_col)]
        except Exception:
            return []

    def hud_info(self):
        hold = self._current_hold()
        return [
            ('Hold Time', f'{hold:.1f}s', GREEN if self.in_pose else MUTE),
            ('Leg Angle', f'{self.angle:.0f}°', self.feedback_col),
            ('Sets Done', str(self.reps), WHITE),
        ]


# ═══════════════════════════════════════════════════════════════
#  TRACKER FACTORY
# ═══════════════════════════════════════════════════════════════
def make_tracker(ex):
    mapping = {
        'squats':          SquatTracker,
        'bicep_curls':     BicepCurlTracker,
        'pushups':         PushupTracker,
        'neck_rotation':   NeckRotationTracker,
        'neck_tilt':       NeckTiltTracker,
        'shoulder_rolls':  ShoulderRollTracker,
        'shoulder_press':  ShoulderPressTracker,
        'lateral_raises':  LateralRaiseTracker,
        'mountain_pose':   MountainPoseTracker,
        'warrior_i':       WarriorITracker,
        'warrior_ii':      WarriorIITracker,
        'tree_pose':       TreePoseTracker,
        'chair_pose':      ChairPoseTracker,
        'triangle_pose':   TrianglePoseTracker,
    }
    return mapping[ex]()


# ═══════════════════════════════════════════════════════════════
#  ZOOM OUT
# ═══════════════════════════════════════════════════════════════
def zoom_out(frame, scale=ZOOM_SCALE):
    if scale >= 1.0: return frame
    h, w  = frame.shape[:2]
    nh,nw = int(h*scale), int(w*scale)
    rsz   = cv2.resize(frame, (nw,nh), interpolation=cv2.INTER_LINEAR)
    out   = np.zeros_like(frame)
    yo,xo = (h-nh)//2, (w-nw)//2
    out[yo:yo+nh, xo:xo+nw] = rsz
    return out


# ═══════════════════════════════════════════════════════════════
#  HUD DRAW
# ═══════════════════════════════════════════════════════════════
def T(img, s, x, y, sc=0.55, c=WHITE, t=1, bold=False):
    if bold: t += 1
    cv2.putText(img, str(s), (x+1,y+1), cv2.FONT_HERSHEY_SIMPLEX, sc, BLACK, t+2, cv2.LINE_AA)
    cv2.putText(img, str(s), (x,  y  ), cv2.FONT_HERSHEY_SIMPLEX, sc, c,     t,   cv2.LINE_AA)


def draw_rep_counter(frame, tracker, exercise_name):
    h, w = frame.shape[:2]
    is_yoga = getattr(tracker, 'is_yoga', False)
    cv2.rectangle(frame, (12,12), (210,100), (10,11,16), -1)
    cv2.rectangle(frame, (12,12), (210,100), BLUE, 1)
    T(frame, EXERCISE_LABELS.get(exercise_name,''), 20, 36, 0.38, MUTE)

    if is_yoga:
        hold     = tracker._current_hold()
        target   = tracker.hold_target
        progress = min(hold / max(target, 1), 1.0)
        # Progress arc background
        cv2.rectangle(frame, (20, 48), (200, 62), (25,25,35), -1)
        cv2.rectangle(frame, (20, 48), (20+int(180*progress), 62),
                      GREEN if progress < 1.0 else YELLOW, -1)
        T(frame, f'{hold:.0f}s / {target}s', 20, 80, 0.55, WHITE, 1, bold=True)
        T(frame, f'Sets: {tracker.reps}', 130, 80, 0.40, MUTE)
    else:
        T(frame, str(tracker.reps), 20, 85, 1.8, WHITE, 3, bold=True)
        T(frame, 'REPS', 95, 85, 0.48, MUTE)


def draw_form_bar(frame, form_score, feedback, feedback_col):
    h, w = frame.shape[:2]
    bx, by, bw, bh = 12, 110, 180, 14
    col = GREEN if form_score >= 75 else YELLOW if form_score >= 50 else RED
    cv2.rectangle(frame, (bx,by), (bx+bw, by+bh), (25,25,35), -1)
    cv2.rectangle(frame, (bx,by), (bx+int(bw*form_score/100), by+bh), col, -1)
    cv2.rectangle(frame, (bx,by), (bx+bw, by+bh), col, 1)
    T(frame, f'Form: {form_score}%', bx, by-4, 0.34, MUTE)
    T(frame, feedback, 12, 142, 0.48, feedback_col, 1, bold=True)


def draw_hud_info(frame, info_list):
    h, w = frame.shape[:2]
    px, py = w-200, 14
    cv2.rectangle(frame, (px-8,py-4), (w-8, py+len(info_list)*28+4), (10,11,16), -1)
    cv2.rectangle(frame, (px-8,py-4), (w-8, py+len(info_list)*28+4), (50,50,60), 1)
    for i, (label, val, col) in enumerate(info_list):
        T(frame, f'{label}:', px, py+i*28+14, 0.36, MUTE)
        T(frame, str(val),    px+90, py+i*28+14, 0.44, col, 1, bold=True)


def draw_speed_indicator(frame, speed_status, speed_msg):
    h, w = frame.shape[:2]
    if not speed_msg: return
    col = GREEN if speed_status=='good' else YELLOW if speed_status=='too_slow' else RED
    icon = '✓' if speed_status=='good' else '↓' if speed_status=='too_slow' else '↑'
    T(frame, f'{icon} {speed_msg}', 12, h-18, 0.44, col, 1, bold=True)


def draw_yoga_timer_overlay(frame, tracker):
    """Big circular timer overlay for yoga poses."""
    h, w = frame.shape[:2]
    hold   = tracker._current_hold()
    target = tracker.hold_target
    pct    = min(hold / max(target, 1), 1.0)

    # Draw arc in bottom-right
    cx, cy, radius = w-70, h-70, 50
    cv2.circle(frame, (cx,cy), radius, (25,25,35), -1)
    cv2.circle(frame, (cx,cy), radius, (50,50,60),  2)

    # Progress arc
    start_angle = -90
    end_angle   = int(-90 + 360*pct)
    col = GREEN if tracker.in_pose else MUTE
    cv2.ellipse(frame, (cx,cy), (radius,radius), 0, start_angle, end_angle, col, 4, cv2.LINE_AA)

    # Time text
    remaining = max(0, target - hold)
    T(frame, f'{remaining:.0f}', cx-18, cy+8, 0.7, WHITE, 2, bold=True)
    T(frame, 's', cx+12, cy+8, 0.38, MUTE)


def draw_idle_overlay(frame, exercise):
    h, w = frame.shape[:2]
    ov = frame.copy()
    cv2.rectangle(ov, (0,0), (w,h), (6,8,12), -1)
    cv2.addWeighted(ov, 0.5, frame, 0.5, 0, frame)
    lbl = EXERCISE_LABELS.get(exercise, exercise)
    T(frame, lbl, w//2-120, h//2-20, 0.9, WHITE, 2, bold=True)
    if exercise in YOGA_POSES:
        T(frame, 'Get into position and hold', w//2-180, h//2+20, 0.45, MUTE)
    else:
        T(frame, 'Get into position and start moving', w//2-200, h//2+20, 0.45, MUTE)


# ═══════════════════════════════════════════════════════════════
#  APP STATE
# ═══════════════════════════════════════════════════════════════
class ExerciseApp:
    def __init__(self):
        self._lock         = threading.Lock()
        self.cap           = None
        self.landmarker    = None
        self.state         = 'idle'
        self.exercise      = 'squats'
        self.tracker       = None
        self.ts_ms         = 0
        self._last_frame_t = 0.0

        self.accent_map = {
            'squats':          (60, 160, 255),
            'bicep_curls':     (80, 200, 100),
            'pushups':         (100, 100, 255),
            'neck_rotation':   (255, 160, 60),
            'neck_tilt':       (60, 200, 220),
            'shoulder_rolls':  (200, 120, 255),
            'shoulder_press':  (60, 220, 180),
            'lateral_raises':  (255, 200, 60),
            # Yoga — warm golden tones
            'mountain_pose':   (100, 200, 255),
            'warrior_i':       (60, 180, 255),
            'warrior_ii':      (60, 140, 255),
            'tree_pose':       (60, 210, 140),
            'chair_pose':      (180, 100, 255),
            'triangle_pose':   (60, 230, 200),
        }

    def _load_model(self):
        import os
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"'{MODEL_PATH}' not found.\n"
                "Download: https://storage.googleapis.com/mediapipe-models/"
                "pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
            )
        opts = mp_vis.PoseLandmarkerOptions(
            base_options=mp_py.BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=mp_vis.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = mp_vis.PoseLandmarker.create_from_options(opts)
        print('[OK] PoseLandmarker (heavy) loaded')

    def start_camera(self):
        # Try multiple indices and backends
        for idx in [0, 1]:
            self.cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if self.cap.isOpened(): break
        
        if not self.cap or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)

        if not self.cap.isOpened(): return False, 'Cannot open webcam'
        
        # Reduced aggressive settings for better compatibility
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT,  480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        try:
            self._load_model()
        except Exception as e:
            return False, str(e)
        with self._lock:
            self.state = 'cam_ready'
        return True, 'ok'

    def stop_camera(self):
        with self._lock: self.state = 'idle'
        if self.cap: self.cap.release(); self.cap = None

    def start_exercise(self, exercise):
        with self._lock:
            self.exercise = exercise
            self.tracker  = make_tracker(exercise)
            self.state    = 'tracking'

    def stop_exercise(self):
        with self._lock:
            self.state = 'cam_ready'

    def reset_exercise(self):
        with self._lock:
            if self.exercise:
                self.tracker = make_tracker(self.exercise)

    def get_stats(self):
        with self._lock:
            t = self.tracker
            if not t: return {}
            is_yoga = getattr(t, 'is_yoga', False)
            base = {
                'reps':         t.reps,
                'feedback':     t.feedback,
                'form_score':   t.form_score,
                'angle':        round(t.angle, 1),
                'speed_status': t.speed_status,
                'speed_msg':    t.speed_msg,
                'exercise':     t.name,
                'avg_rep_time': round(t.avg_rep_time(), 2),
                'is_yoga':      is_yoga,
            }
            if is_yoga:
                base['hold_elapsed'] = round(t._current_hold(), 1)
                base['hold_target']  = t.hold_target
                base['in_pose']      = t.in_pose
            return base

    def state_dict(self):
        with self._lock:
            s  = self.state
            ex = self.exercise
            t  = self.tracker
        is_yoga = getattr(t, 'is_yoga', False) if t else False
        stats = {
            'reps':         t.reps        if t else 0,
            'form_score':   t.form_score  if t else 100,
            'feedback':     t.feedback    if t else '',
            'angle':        round(t.angle,1) if t else 0,
            'speed_msg':    t.speed_msg   if t else '',
            'speed_status': t.speed_status if t else 'good',
            'avg_rep_time': round(t.avg_rep_time(),2) if t else 0,
            'is_yoga':      is_yoga,
        }
        if is_yoga and t:
            stats['hold_elapsed'] = round(t._current_hold(), 1)
            stats['hold_target']  = t.hold_target
            stats['in_pose']      = t.in_pose
        return {'state': s, 'exercise': ex, 'stats': stats}

    def gen_frames(self):
        while True:
            if not self.cap or not self.cap.isOpened():
                blank = np.zeros((480,640,3), dtype=np.uint8)
                T(blank, 'Camera starting...', 140, 240, 0.9, MUTE)
                _, buf = cv2.imencode('.jpg', blank, [cv2.IMWRITE_JPEG_QUALITY, 75])
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n'
                time.sleep(0.05)
                continue

            ret, raw = self.cap.read()
            if not ret:
                err_f = np.zeros((480,640,3), dtype=np.uint8)
                T(err_f, 'Device Read Fail — check if camera is off', 80, 240, 0.6, RED)
                _, buf = cv2.imencode('.jpg', err_f, [cv2.IMWRITE_JPEG_QUALITY, 60])
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n'
                time.sleep(0.1)
                continue

            now = time.time()
            elapsed = now - self._last_frame_t
            if elapsed < FRAME_INTERVAL:
                time.sleep(FRAME_INTERVAL - elapsed)
            self._last_frame_t = time.time()

            frame = cv2.flip(raw, 1)
            try:
                frame = zoom_out(frame, ZOOM_SCALE)
                h, w  = frame.shape[:2]
                self.ts_ms += int(FRAME_INTERVAL * 1000)

                lms = None
                if self.landmarker:
                    try:
                        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                        r      = self.landmarker.detect_for_video(mp_img, int(self.ts_ms))
                        if r.pose_landmarks:
                            lms = r.pose_landmarks[0]
                    except Exception:
                        pass

                with self._lock:
                    cur_state = self.state
                    cur_ex    = self.exercise
                    tracker   = self.tracker

                if lms:
                    accent = self.accent_map.get(cur_ex, BLUE)
                    draw_skeleton(frame, lms, accent)

                    if cur_state == 'tracking' and tracker:
                        angle_pts = tracker.process(lms, w, h)
                        for (jpt, ang, col) in (angle_pts or []):
                            draw_angle_arc(frame, jpt, ang, col)
                        draw_rep_counter(frame, tracker, cur_ex)
                        draw_form_bar(frame, tracker.form_score,
                                      tracker.feedback, tracker.feedback_col)
                        draw_hud_info(frame, tracker.hud_info())
                        is_yoga = getattr(tracker, 'is_yoga', False)
                        if is_yoga:
                            draw_yoga_timer_overlay(frame, tracker)
                        else:
                            draw_speed_indicator(frame, tracker.speed_status, tracker.speed_msg)
                    elif cur_state == 'cam_ready':
                        draw_idle_overlay(frame, cur_ex)

            except Exception:
                pass

            _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
            yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n'


ex_app = ExerciseApp()


# ═══════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════
@app.route('/')
def index(): return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(ex_app.gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_camera', methods=['POST'])
def start_camera():
    ok, msg = ex_app.start_camera()
    return jsonify({'ok': ok, 'message': msg})

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    ex_app.stop_camera()
    return jsonify({'ok': True})

@app.route('/start_exercise', methods=['POST'])
def start_exercise():
    data = request.get_json()
    ex   = data.get('exercise','squats')
    if ex not in EXERCISES:
        return jsonify({'ok': False, 'message': 'Unknown exercise'})
    ex_app.start_exercise(ex)
    return jsonify({'ok': True})

@app.route('/stop_exercise', methods=['POST'])
def stop_exercise():
    ex_app.stop_exercise()
    return jsonify({'ok': True})

@app.route('/reset_exercise', methods=['POST'])
def reset_exercise():
    ex_app.reset_exercise()
    return jsonify({'ok': True})

@app.route('/app_state')
def app_state():
    return jsonify(ex_app.state_dict())


if __name__ == '__main__':
    import os
    print('\n' + '='*55)
    print('  Exercise Tracker — OpenCV + MediaPipe')
    print('='*55)
    status = '✓ Found' if os.path.exists(MODEL_PATH) else '⚠ Missing'
    print(f'  {status}: {MODEL_PATH}')
    if not os.path.exists(MODEL_PATH):
        print('  Download:')
        print('  curl -o pose_landmarker_heavy.task "https://storage.googleapis.com/'
              'mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"')
    print('\n  Open: http://127.0.0.1:5000\n')
    app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)