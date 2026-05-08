# 🧍 Posture AI Service Documentation

A Python-based microservice that performs high-fidelity postural analysis using computer vision.

## 🛠️ Tech Stack
- **Framework:** [Flask](https://flask.palletsprojects.com/)
- **Vision Engine:** [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- **Processing:** [OpenCV](https://opencv.org/)
- **Model:** `pose_landmarker_heavy.task` (33 landmarks)

## 🧠 AI Logic
The service analyzes the user across four views (Front, Right, Back, Left) to identify postural deviations:
- **Shoulder Leveling**: Detects uneven shoulder height.
- **Head Alignment**: Analyzes ear-to-shoulder vertical alignment.
- **Pelvic Tilt**: Identifies lateral pelvic shift.
- **Joint Angles**: Calculates precision angles for neck, spine, and knees.

## 📡 API Interface
- `GET /video_feed`: Stream the annotated camera feed.
- `POST /capture_view`: Trigger a snapshot and analysis for a specific view.
- `GET /analysis_results`: Retrieve the full postural report.

## 🚀 Running Locally
```bash
python services/posture/main.py
```
The service runs on **Port 5000**.
