"""
Posture Detection — main.py
============================
• 33-point skeleton using pose_landmarker_heavy.task (most accurate model)
• 60 FPS target stream
• Fixed MJPEG stream (no ERR_INCOMPLETE_CHUNKED_ENCODING)
• Wake word + voice command handled in app.js (Web Speech API)
• Full-body zoom, fullscreen, 4-view clockwise analysis
"""

import cv2, math, time, threading
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_py
from mediapipe.tasks.python import vision as mp_vis
from flask import Flask, Response, jsonify, render_template

app = Flask(__name__)

# ═══════════════════════════════════════════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════════════════════════════════════════
import os
_DIR = os.path.dirname(os.path.abspath(__file__))
POSE_MODEL     = os.path.join(os.path.dirname(_DIR), 'pose_landmarker_heavy.task')   # most accurate
PREP_S         = 3
CAP_S          = 5
TARGET_FPS     = 24
FRAME_INTERVAL = 1.0 / TARGET_FPS
ZOOM_SCALE     = 1.0   # 1.0=no zoom (fills up screen flawlessly with object-fit)

VIEWS = [
    {'id':'FRONT','num':'①','lines':['Stand FACING the camera','Arms relaxed at sides','Feet shoulder-width apart']},
    {'id':'RIGHT','num':'②','lines':['Turn RIGHT side to camera','Look straight ahead','Stand tall']},
    {'id':'BACK', 'num':'③','lines':['Turn BACK to the camera','Arms relaxed at sides','Feet shoulder-width apart']},
    {'id':'LEFT', 'num':'④','lines':['Turn LEFT side to camera','Look straight ahead','Stand tall']},
]

VC = {'FRONT':(250,165,96),'RIGHT':(200,100,255),'BACK':(100,220,100),'LEFT':(60,160,255)}

# ── 33 Landmark indices ───────────────────────────────────────────────────
P = dict(
    NOSE=0,
    L_EYE_I=1,L_EYE=2,L_EYE_O=3,R_EYE_I=4,R_EYE=5,R_EYE_O=6,
    L_EAR=7,R_EAR=8,MOUTH_L=9,MOUTH_R=10,
    L_SH=11,R_SH=12,L_EL=13,R_EL=14,
    L_WR=15,R_WR=16,
    L_PINKY=17,R_PINKY=18,L_INDEX=19,R_INDEX=20,L_THUMB=21,R_THUMB=22,
    L_HIP=23,R_HIP=24,L_KNEE=25,R_KNEE=26,
    L_ANK=27,R_ANK=28,L_HEEL=29,R_HEEL=30,L_FOOT=31,R_FOOT=32,
)
FACE_IDX = {0,1,2,3,4,5,6,7,8,9,10}

POSE_EDGES = [
    (0,1,'face'),(1,2,'face'),(2,3,'face'),(3,7,'face'),
    (0,4,'face'),(4,5,'face'),(5,6,'face'),(6,8,'face'),(9,10,'face'),
    (11,13,'arm'),(13,15,'arm'),(15,17,'arm'),(15,19,'arm'),(15,21,'arm'),(17,19,'arm'),
    (12,14,'arm'),(14,16,'arm'),(16,18,'arm'),(16,20,'arm'),(16,22,'arm'),(18,20,'arm'),
    (11,12,'torso'),(11,23,'torso'),(12,24,'torso'),(23,24,'torso'),
    (23,25,'leg'),(25,27,'leg'),(27,29,'leg'),(27,31,'leg'),(29,31,'leg'),
    (24,26,'leg'),(26,28,'leg'),(28,30,'leg'),(28,32,'leg'),(30,32,'leg'),
]

KEY_LABELS = {
    P['L_SH']:'L.SH', P['R_SH']:'R.SH',
    P['L_EL']:'L.EL', P['R_EL']:'R.EL',
    P['L_WR']:'L.WR', P['R_WR']:'R.WR',
    P['L_HIP']:'L.HI', P['R_HIP']:'R.HI',
    P['L_KNEE']:'L.KN',P['R_KNEE']:'R.KN',
    P['L_ANK']:'L.AN', P['R_ANK']:'R.AN',
    P['NOSE']:'NOSE',
}


# ═══════════════════════════════════════════════════════════════════════════
#  ZOOM OUT
# ═══════════════════════════════════════════════════════════════════════════
def zoom_out(frame, scale=ZOOM_SCALE):
    if scale >= 1.0: return frame
    h, w = frame.shape[:2]
    nh, nw = int(h*scale), int(w*scale)
    resized = cv2.resize(frame, (nw,nh), interpolation=cv2.INTER_LINEAR)
    canvas  = np.zeros_like(frame)
    yo, xo  = (h-nh)//2, (w-nw)//2
    canvas[yo:yo+nh, xo:xo+nw] = resized
    return canvas


# ═══════════════════════════════════════════════════════════════════════════
#  PROFESSIONAL 33-POINT SKELETON RENDERER
# ═══════════════════════════════════════════════════════════════════════════
def draw_skeleton(frame, lms, accent):
    h, w = frame.shape[:2]

    def dim(c, f): return tuple(int(x*f) for x in c)
    gcol = {
        'face':  (45, 45, 60),
        'arm':   dim(accent, 0.85),
        'torso': accent,
        'leg':   dim(accent, 0.70),
    }

    pts = [(int(lm.x*w), int(lm.y*h),
            float(lm.visibility) if hasattr(lm,'visibility') else 1.0)
           for lm in lms]

    # 1. Glow layer
    glow = np.zeros_like(frame)
    for a, b, grp in POSE_EDGES:
        if grp == 'face': continue
        if a >= len(pts) or b >= len(pts): continue
        v = min(pts[a][2], pts[b][2])
        if v < 0.3: continue
        cv2.line(glow, pts[a][:2], pts[b][:2], gcol[grp], 14, cv2.LINE_AA)
    glow = cv2.GaussianBlur(glow, (21,21), 0)
    cv2.addWeighted(frame, 1.0, glow, 0.28, 0, frame)

    # 2. Bones
    for a, b, grp in POSE_EDGES:
        if a >= len(pts) or b >= len(pts): continue
        v = min(pts[a][2], pts[b][2])
        if v < 0.25: continue
        c  = gcol[grp]
        cv = tuple(int(x*min(v,1.0)) for x in c)
        t  = 1 if grp == 'face' else 3
        cv2.line(frame, pts[a][:2], pts[b][:2], cv, t, cv2.LINE_AA)

    # 3. Joints
    for idx, (px,py,vis) in enumerate(pts):
        if vis < 0.25: continue
        if idx in FACE_IDX:
            cv2.circle(frame,(px,py),3,(45,45,62),-1,cv2.LINE_AA)
            cv2.circle(frame,(px,py),3,(90,90,110),1,cv2.LINE_AA)
        else:
            vf = min(vis,1.0)
            ac = tuple(int(x*vf) for x in accent)
            cv2.circle(frame,(px,py),10,(12,12,18),-1,cv2.LINE_AA)
            cv2.circle(frame,(px,py), 9,ac,2,cv2.LINE_AA)
            cv2.circle(frame,(px,py), 5,ac,-1,cv2.LINE_AA)
            cv2.circle(frame,(px,py), 2,(240,240,255),-1,cv2.LINE_AA)
            if idx in KEY_LABELS:
                lbl = KEY_LABELS[idx]
                cv2.putText(frame,lbl,(px+12,py+5),cv2.FONT_HERSHEY_SIMPLEX,0.29,(0,0,0),3,cv2.LINE_AA)
                cv2.putText(frame,lbl,(px+12,py+5),cv2.FONT_HERSHEY_SIMPLEX,0.29,(215,215,225),1,cv2.LINE_AA)

    # 4. Point count
    vis_count = sum(1 for _,_,v in pts if v>=0.25)
    cnt = f'Points: {vis_count}/33'
    cw,_ = cv2.getTextSize(cnt,cv2.FONT_HERSHEY_SIMPLEX,0.40,1)[0]
    cv2.putText(frame,cnt,(w-cw-14,28),cv2.FONT_HERSHEY_SIMPLEX,0.40,(255,255,255),3,cv2.LINE_AA) # outline
    cv2.putText(frame,cnt,(w-cw-14,28),cv2.FONT_HERSHEY_SIMPLEX,0.40,(0,0,0),1,cv2.LINE_AA)     # text


# ═══════════════════════════════════════════════════════════════════════════
#  HUD OVERLAY
# ═══════════════════════════════════════════════════════════════════════════
def draw_hud(frame, state, view_idx, phase_start):
    h, w = frame.shape[:2]
    now  = time.time()

    if state in ('prep','capturing','done'):
        pw, ph, gap = 56, 7, 9
        total = 4*pw+3*gap; ox = (w-total)//2
        el    = now-phase_start
        prog  = min(el/CAP_S,1.0) if state=='capturing' else 0.0
        for i, v in enumerate(VIEWS):
            vc=VC[v['id']]; bx=ox+i*(pw+gap); by=14
            if i<view_idx:
                cv2.rectangle(frame,(bx,by),(bx+pw,by+ph),vc,-1)
            elif i==view_idx and state=='capturing':
                cv2.rectangle(frame,(bx,by),(bx+pw,by+ph),(30,30,40),-1)
                cv2.rectangle(frame,(bx,by),(bx+int(pw*prog),by+ph),vc,-1)
            else:
                cv2.rectangle(frame,(bx,by),(bx+pw,by+ph),(30,30,40),-1)
            cv2.rectangle(frame,(bx,by),(bx+pw,by+ph),vc if i<=view_idx else (55,55,65),1)

    if state=='prep' and view_idx<len(VIEWS):
        v=VIEWS[view_idx]; vc=VC[v['id']]
        el=now-phase_start; rem=max(1,PREP_S-int(el))
        # Cinematic Blur Background - Keep only text-free focus view
        frame[:] = cv2.GaussianBlur(frame, (35, 35), 0)
        ov = frame.copy()
        cv2.rectangle(ov, (0, 0), (w, h), (8, 10, 14), -1)
        cv2.addWeighted(ov, 0.45, frame, 0.55, 0, frame)

    elif state=='capturing' and view_idx<len(VIEWS):
        v=VIEWS[view_idx]; vc=VC[v['id']]
        el=now-phase_start; sl=max(0,CAP_S-int(el))
        # cv2.rectangle(frame,(12,12),(182,46),(8,9,14),-1)
        # cv2.rectangle(frame,(12,12),(182,46),vc,1)
        # cv2.putText(frame,f'{v["id"]}  {sl}s left',(22,34),cv2.FONT_HERSHEY_SIMPLEX,0.52,vc,1,cv2.LINE_AA)
        prog=min((now-phase_start)/CAP_S,1.0)
        cv2.rectangle(frame,(0,h-7),(w,h),(25,27,35),-1)
        cv2.rectangle(frame,(0,h-7),(int(w*prog),h),vc,-1)

    elif state=='done':
        msg='Analysis Complete!'
        ms,_=cv2.getTextSize(msg,cv2.FONT_HERSHEY_SIMPLEX,1.0,2); cx=w//2
        cv2.putText(frame,msg,(cx-ms[0]//2+2,58+2),cv2.FONT_HERSHEY_SIMPLEX,1.0,(0,0,0),4,cv2.LINE_AA)
        cv2.putText(frame,msg,(cx-ms[0]//2,58),cv2.FONT_HERSHEY_SIMPLEX,1.0,(180,210,50),2,cv2.LINE_AA) # Soft emerald: Cyan tone BGR


# ═══════════════════════════════════════════════════════════════════════════
#  ANALYSIS ENGINE — pure math on normalised landmarks
# ═══════════════════════════════════════════════════════════════════════════
class _P:
    __slots__=('x','y','z','visibility')
    def __init__(self,x,y,z,v=1.): self.x=x;self.y=y;self.z=z;self.visibility=v

def _avg(frames):
    if not frames: return None
    n,k=len(frames),len(frames[0])
    return [_P(
        sum(f[j].x for f in frames)/n,
        sum(f[j].y for f in frames)/n,
        sum(f[j].z for f in frames)/n,
        sum((f[j].visibility if hasattr(f[j],'visibility') else 1.) for f in frames)/n,
    ) for j in range(k)]

def _mid(a,b): return _P((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2)
def _hd(a,b):  return abs(a.y-b.y)*100
def _sc(d,mx): return max(0,round(100-(d/max(mx,.001))*100))
def _sd(arr):
    m=sum(arr)/len(arr)
    return math.sqrt(sum((v-m)**2 for v in arr)/len(arr))
def _angle3(a,b,c):
    ba=(a.x-b.x,a.y-b.y); bc=(c.x-b.x,c.y-b.y)
    dot=ba[0]*bc[0]+ba[1]*bc[1]
    mag=math.hypot(*ba)*math.hypot(*bc)
    if mag<1e-6: return 0.0
    return math.degrees(math.acos(max(-1,min(1,dot/mag))))
def _col(s): return '#3fb950' if s>=80 else '#d29922' if s>=60 else '#f85149'
def _lbl(s): return 'good' if s>=80 else 'fair' if s>=60 else 'poor'

def run_analysis(captured):
    F=_avg(captured.get('FRONT',[])); B=_avg(captured.get('BACK', []))
    L=_avg(captured.get('LEFT', [])); R=_avg(captured.get('RIGHT',[]))
    metrics=[]; findings=[]
    def M(name,s,view): metrics.append({'name':name,'score':s,'view':view,'color':_col(s),'status':_lbl(s)})
    def F_(title,details,s): findings.append({'title':title,'details':details,'score':s,'color':_col(s),'status':_lbl(s)})

    if F:
        sd=_hd(F[P['L_SH']],F[P['R_SH']]); ss=_sc(sd,4); M('Shoulder Level',ss,'Front')
        if ss<80:
            side='Left' if F[P['L_SH']].y>F[P['R_SH']].y else 'Right'
            F_(f'Uneven Shoulders — {side} lower',
               [f'{side} shoulder ~{round(sd*0.9,1)}° lower.',
                'Stretch the elevated-side upper trapezius.',
                'Strengthen the depressed-side levator scapulae.'],ss)

        hpd=_hd(F[P['L_HIP']],F[P['R_HIP']]); hs=_sc(hpd,4); M('Hip Level',hs,'Front')
        if hs<80:
            side='Left' if F[P['L_HIP']].y>F[P['R_HIP']].y else 'Right'
            F_(f'Lateral Pelvic Tilt — {side} hip lower',
               [f'{side} hip ~{round(hpd*0.9,1)}° lower.',
                'May indicate leg-length discrepancy.',
                'Hip-hike exercises + physiotherapy.'],hs)

        ht=_hd(F[P['L_EAR']],F[P['R_EAR']]); hts=_sc(ht,3.5); M('Head Tilt',hts,'Front')
        if hts<80:
            side='Left' if F[P['L_EAR']].y>F[P['R_EAR']].y else 'Right'
            F_(f'Head Tilts to the {side}',
               [f'Ear height diff ~{round(ht*0.85,1)}°.',
                f'Stretch {side} SCM and scalene muscles.',
                'Strengthen opposite neck side.'],hts)

        msX=_mid(F[P['L_SH']],F[P['R_SH']]).x; mhX=_mid(F[P['L_HIP']],F[P['R_HIP']]).x
        mkX=_mid(F[P['L_KNEE']],F[P['R_KNEE']]).x; maX=_mid(F[P['L_ANK']],F[P['R_ANK']]).x
        xd=_sd([msX,mhX,mkX,maX])*100; sps=_sc(xd,2.5); M('Spinal Alignment',sps,'Front')
        if sps<80:
            F_('Lateral Spinal Deviation',
               [f'Midline deviates (index={xd:.1f}).',
                'May indicate scoliosis or muscle imbalance.',
                'X-ray + physiotherapy evaluation recommended.'],sps)

        lkd=abs(F[P['L_KNEE']].x-(F[P['L_HIP']].x+F[P['L_ANK']].x)/2)*100
        rkd=abs(F[P['R_KNEE']].x-(F[P['R_HIP']].x+F[P['R_ANK']].x)/2)*100
        ks=_sc((lkd+rkd)/2,5); M('Knee Alignment',ks,'Front')
        if ks<70:
            F_('Knee Valgus / Varus',
               [f'Knees deviate {round((lkd+rkd)/2,1)}% from axis.',
                'Strengthen hip abductors and adductors.',
                'Check footwear for over-pronation.'],ks)

        lDs=abs(F[P['L_SH']].x-msX)*100; rDs=abs(F[P['R_SH']].x-msX)*100
        M('Shoulder Symmetry',_sc(abs(lDs-rDs),3),'Front')

        lc=_angle3(F[P['L_SH']],F[P['L_EL']],F[P['L_WR']])
        rc=_angle3(F[P['R_SH']],F[P['R_EL']],F[P['R_WR']])
        cs2=_sc(abs(lc-rc),15); M('Elbow Carry Angle',cs2,'Front')
        if cs2<75:
            F_('Asymmetric Elbow Carry Angle',
               [f'Left: {lc:.1f}°  Right: {rc:.1f}°  Diff: {abs(lc-rc):.1f}°.',
                'Indicates asymmetric shoulder rotation.',
                'Strengthen rotator cuff bilaterally.'],cs2)

    if B:
        bsd=_hd(B[P['L_SH']],B[P['R_SH']]); M('Shoulder (Back)',_sc(bsd,4),'Back')
        bmsX=_mid(B[P['L_SH']],B[P['R_SH']]).x; bmhX=_mid(B[P['L_HIP']],B[P['R_HIP']]).x
        bmkX=_mid(B[P['L_KNEE']],B[P['R_KNEE']]).x; bmaX=_mid(B[P['L_ANK']],B[P['R_ANK']]).x
        bxd=_sd([bmsX,bmhX,bmkX,bmaX])*100; bsps=_sc(bxd,2.5); M('Spine (Back)',bsps,'Back')
        if bsps<80:
            F_('Posterior Spinal Deviation',
               [f'Back-view deviation ({bxd:.1f}) confirms scoliosis risk.',
                'Specialist imaging strongly recommended.'],bsps)
        M('Hip Level (Back)',_sc(_hd(B[P['L_HIP']],B[P['R_HIP']]),4),'Back')
        scap=abs(abs(B[P['L_SH']].x-bmsX)-abs(B[P['R_SH']].x-bmsX))*100
        scS=_sc(scap,4); M('Scapular Symmetry',scS,'Back')
        if scS<75:
            F_('Scapular Asymmetry',
               [f'Shoulder blades uneven by {scap:.1f}%.',
                'One scapula may be winged or protracted.',
                'Strengthen serratus anterior and middle trapezius.'],scS)

    SV=L or R
    if SV:
        sl_='Left' if L else 'Right'
        earI=P['L_EAR'] if L else P['R_EAR']; shI=P['L_SH'] if L else P['R_SH']
        hipI=P['L_HIP'] if L else P['R_HIP']; knI=P['L_KNEE'] if L else P['R_KNEE']
        ankI=P['L_ANK'] if L else P['R_ANK']
        elI=P['L_EL'] if L else P['R_EL'];    wrI=P['L_WR'] if L else P['R_WR']

        fhp=abs(SV[earI].x-SV[shI].x)*100; fhs=_sc(fhp,8); M('Forward Head',fhs,f'{sl_} Side')
        if fhs<75:
            F_('Forward Head Posture',
               [f'Ear {fhp:.1f}% ahead of shoulder.',
                'Each 2.5 cm forward adds ~4.5 kg neck load.',
                'Chin tucks 3×15 daily.'],fhs)

        midX=(SV[hipI].x+SV[ankI].x)/2; sfwd=(SV[shI].x-midX)*100; rss=_sc(abs(sfwd),7)
        M('Rounded Shoulders',rss,f'{sl_} Side')
        if rss<75:
            dir_='forward' if sfwd>0 else 'backward'
            F_(f'Shoulder Protraction ({abs(sfwd):.1f}% {dir_})',
               ['Shoulder off neutral hip-ankle axis.',
                'Stretch pectorals minor.',
                'Strengthen rhomboids and lower trapezius.'],rss)

        shY=SV[shI].y; ankY=SV[ankI].y; hipY=SV[hipI].y
        expY=shY+(ankY-shY)*0.5; hpd2=abs(hipY-expY)*100; ls=_sc(hpd2,6)
        M('Lumbar Curve',ls,f'{sl_} Side')
        if ls<75:
            tilt='Anterior' if hipY>expY else 'Posterior'
            F_(f'{tilt} Pelvic Tilt',
               [f'Hip {hpd2:.1f}% off neutral.',
                'Strengthen glutes and deep core.',
                'Stretch iliopsoas 3×30 s per side.'],ls)

        knD=abs(SV[knI].x-(SV[hipI].x+SV[ankI].x)/2)*100; knSS=_sc(knD,8)
        M('Knee (Side)',knSS,f'{sl_} Side')
        if knSS<70:
            F_('Knee Sagittal Misalignment',
               [f'Knee {knD:.1f}% off plumb line.',
                'Risk of hyperextension.',
                'Balance quad and hamstring strength.'],knSS)

        ea=_angle3(SV[shI],SV[elI],SV[wrI]); es=_sc(abs(180-ea),40)
        M('Elbow Flexion',es,f'{sl_} Side')
        if es<70:
            F_(f'Elbow Not Fully Relaxed ({ea:.0f}°)',
               ['Arm appears bent rather than hanging straight.',
                'May indicate tension in biceps.',
                'Consciously relax arms during standing posture.'],es)

        tl=(SV[hipI].x-SV[shI].x)*100; ts2=_sc(abs(tl),5)
        M('Trunk Lean',ts2,f'{sl_} Side')
        if ts2<75:
            dir2='forward' if tl>0 else 'backward'
            F_(f'Trunk Leans {dir2.capitalize()} ({abs(tl):.1f}%)',
               ['Upper body not vertically aligned over hips.',
                'Strengthen deep core (transversus abdominis).',
                'Check for pelvic tilt as root cause.'],ts2)

    overall=round(sum(m['score'] for m in metrics)/len(metrics)) if metrics else 0
    return {'overall':overall,'overall_color':_col(overall),'overall_status':_lbl(overall),
            'metrics':metrics,'findings':findings,'views':list(captured.keys())}


# ═══════════════════════════════════════════════════════════════════════════
#  APPLICATION STATE
# ═══════════════════════════════════════════════════════════════════════════
class PostureApp:
    def __init__(self):
        self._lock        = threading.Lock()
        self.cap          = None
        self.pose_lmk     = None
        self.state        = 'idle'
        self.view_idx     = 0
        self.captured     = {}
        self.live_frames  = []
        self.phase_start  = 0.0
        self.results      = None
        self.ts_ms        = 0
        self._last_frame_t= 0.0
        self.paused       = False
        self._pause_start_t = 0.0
        # Pre-load model at startup so Start Detection is instant
        try:
            self._load_model()
            print('[OK] Posture model pre-loaded at startup')
        except Exception as e:
            print(f'[WARN] Posture model pre-load failed: {e}')

    def _load_model(self):
        import os
        if not os.path.exists(POSE_MODEL):
            raise FileNotFoundError(
                f"'{POSE_MODEL}' not found.\n"
                "Download: https://storage.googleapis.com/mediapipe-models/"
                "pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
            )
        opts = mp_vis.PoseLandmarkerOptions(
            base_options=mp_py.BaseOptions(model_asset_path=POSE_MODEL),
            running_mode=mp_vis.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.pose_lmk = mp_vis.PoseLandmarker.create_from_options(opts)
        print('[OK] Pose landmarker (heavy) loaded — 33 points')

    def start_camera(self):
        # DirectShow avoids 6-second Windows MSMF hang
        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        if not self.cap or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)

        if not self.cap or not self.cap.isOpened(): return False,'Cannot open webcam'
        # BUFFERSIZE=1: eliminates accumulated frame lag
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT,  480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        # Model already loaded at startup — no delay here
        if not self.pose_lmk:
            try:
                self._load_model()
            except Exception as e:
                return False, str(e)
        with self._lock: self.state='cam_ready'
        return True,'ok'

    def stop_camera(self):
        with self._lock: self.state='idle'
        if self.cap: self.cap.release(); self.cap=None

    def start_analysis(self):
        with self._lock:
            self.state='prep'; self.view_idx=0
            self.captured={}; self.results=None
            self.live_frames=[]; self.phase_start=time.time()

    def reset(self):
        with self._lock:
            self.state='cam_ready'; self.view_idx=0
            self.captured={}; self.results=None; self.live_frames=[]

    def _tick(self, lms):
        with self._lock: is_p = self.paused
        if is_p: return
        now=time.time()
        with self._lock: s=self.state
        if s=='prep':
            if now-self.phase_start>=PREP_S:
                with self._lock:
                    self.state='capturing'; self.live_frames=[]; self.phase_start=now
        elif s=='capturing':
            if lms: self.live_frames.append(lms)
            if now-self.phase_start>=CAP_S:
                vid=VIEWS[self.view_idx]['id']
                with self._lock:
                    self.captured[vid]=list(self.live_frames)
                    self.view_idx+=1
                    if self.view_idx>=len(VIEWS):
                        self.results=run_analysis(self.captured)
                        self.state='done'
                    else:
                        self.state='prep'; self.phase_start=now; self.live_frames=[]

    # ── FIXED gen_frames ──────────────────────────────────────────────
    def gen_frames(self):
        frame_count = 0
        while True:
            # Camera not open — send placeholder
            if not self.cap or not self.cap.isOpened():
                blank=np.zeros((480,640,3),dtype=np.uint8)
                cv2.putText(blank,'Camera starting...',(140,240),
                            cv2.FONT_HERSHEY_SIMPLEX,0.9,(60,65,75),2)
                _,buf=cv2.imencode('.jpg',blank,[cv2.IMWRITE_JPEG_QUALITY,75])
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+buf.tobytes()+b'\r\n'
                time.sleep(0.05)
                continue

            ret,raw=self.cap.read()
            if not ret:
                blank=np.zeros((480,640,3),dtype=np.uint8)
                cv2.putText(blank,'Device Frame Fail - camera busy?',(80,240),cv2.FONT_HERSHEY_SIMPLEX,0.6,(50,60,220),2)
                _,buf=cv2.imencode('.jpg',blank,[cv2.IMWRITE_JPEG_QUALITY,60])
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+buf.tobytes()+b'\r\n'
                time.sleep(0.1)
                continue

            frame_count += 1

            # FPS throttle — sleep so stream NEVER yields nothing
            now=time.time()
            elapsed=now-self._last_frame_t
            if elapsed < FRAME_INTERVAL:
                time.sleep(FRAME_INTERVAL - elapsed)
            self._last_frame_t = time.time()

            # Wrap all processing — a single bad frame never kills the stream
            try:
                frame=cv2.flip(raw,1)
                frame=zoom_out(frame,ZOOM_SCALE)
                self.ts_ms+=int(FRAME_INTERVAL*1000)

                lms=None
                # AI SPEED OPTIMIZATION: Only detect every 3rd frame
                if self.pose_lmk and (frame_count % 3 == 0):
                    try:
                        rgb=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
                        mp_img=mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb)
                        r=self.pose_lmk.detect_for_video(mp_img,int(self.ts_ms))
                        if r.pose_landmarks:
                            lms=r.pose_landmarks[0]
                            self._last_lms = lms
                    except Exception:
                        pass
                else:
                    lms = getattr(self, '_last_lms', None)

                with self._lock:
                    cur=self.state; vidx=self.view_idx; ps=self.phase_start

                if cur in ('prep','capturing'):
                    self._tick(lms)
                    with self._lock:
                        cur=self.state; vidx=self.view_idx; ps=self.phase_start

                if lms and not self.paused:
                    col=VC.get(VIEWS[vidx]['id'] if vidx<len(VIEWS) else 'FRONT',(245,121,110))
                    draw_skeleton(frame,lms,col)

                draw_hud(frame,cur,vidx,ps)

            except Exception:
                pass  # never let a frame error kill the stream

            _,buf=cv2.imencode('.jpg',frame,[cv2.IMWRITE_JPEG_QUALITY,50])
            yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+buf.tobytes()+b'\r\n'

    def state_dict(self):
        with self._lock:
            s=self.state; vidx=self.view_idx; now=time.time(); el=now-self.phase_start
            cur_captured = dict(self.captured)
            if s == 'capturing' and self.live_frames:
                if vidx < len(VIEWS):
                    cur_captured[VIEWS[vidx]['id']] = list(self.live_frames)
        
        live_res = None
        if cur_captured:
            try:
                live_res = run_analysis(cur_captured)
            except Exception: pass

        prep_rem=max(0,round(PREP_S-el,1)) if s=='prep'      else 0
        cap_rem =max(0,round(CAP_S -el,1)) if s=='capturing' else 0
        cap_prog=min(1.0,el/CAP_S)         if s=='capturing' else 0
        return {'state':s,'view_index':vidx,
                'view':VIEWS[vidx] if vidx<len(VIEWS) else None,
                'completed':[VIEWS[i]['id'] for i in range(vidx)],
                'prep_rem':prep_rem,'cap_rem':cap_rem,'cap_prog':round(cap_prog,3),
                'paused':self.paused, 'results': live_res}


posture=PostureApp()


# ═══════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════
@app.route('/')
def index(): return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(posture.gen_frames(),mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_camera',methods=['POST'])
def start_camera():
    ok,msg=posture.start_camera(); return jsonify({'ok':ok,'message':msg})

@app.route('/start_analysis',methods=['POST'])
def start_analysis():
    if posture.state!='cam_ready': return jsonify({'ok':False,'message':'Camera not ready'})
    posture.start_analysis(); return jsonify({'ok':True})

@app.route('/app_state')
def app_state(): return jsonify(posture.state_dict())

@app.route('/results')
def results():
    if posture.results is None: return jsonify({'ok':False})
    return jsonify({'ok':True,'data':posture.results})

@app.route('/reset',methods=['POST'])
def reset(): posture.reset(); return jsonify({'ok':True})

@app.route('/pause_toggle',methods=['POST'])
def pause_toggle():
    with posture._lock:
        posture.paused = not posture.paused
        if posture.paused:
            posture._pause_start_t = time.time()
        else:
            posture.phase_start += (time.time() - posture._pause_start_t)
        return jsonify({'ok':True, 'paused':posture.paused})

@app.route('/stop_camera',methods=['POST'])
def stop_camera(): posture.stop_camera(); return jsonify({'ok':True})

@app.route('/posture_status')
def posture_status():
    return jsonify({'posture':'unknown','feedback':'Use Start Analysis.'})


if __name__=='__main__':
    import os
    print('\n'+'='*55)
    print('  Posture Detection — 33-point skeleton')
    print('='*55)
    status = 'Found' if os.path.exists(POSE_MODEL) else 'MISSING'
    print(f'  {status}: {POSE_MODEL}')
    if not os.path.exists(POSE_MODEL):
        print('\n  Download command:')
        print('  curl -o pose_landmarker_heavy.task "https://storage.googleapis.com/'
              'mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/'
              'pose_landmarker_heavy.task"')
    print(f'\n  Target FPS : {TARGET_FPS}')
    print(f'  Zoom scale : {ZOOM_SCALE}  (lower = more body visible)')
    print('\n  Open: http://127.0.0.1:5000\n')
    app.run(debug=False,host='0.0.0.0',port=5000,threaded=True)