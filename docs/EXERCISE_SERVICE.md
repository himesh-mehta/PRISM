# 🏋️ Exercise AI Service Documentation

A Python-based microservice that tracks physical exercises and provides real-time form correction.

## 🛠️ Tech Stack
- **Framework:** [Flask](https://flask.palletsprojects.com/)
- **Vision Engine:** [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- **Processing:** [OpenCV](https://opencv.org/)
- **Model:** `pose_landmarker_heavy.task`

## 🧠 Core Features
- **Repetition Counting**: Automated state-based counting for Squats, Push-ups, and Curls.
- **Form Evaluation**: Real-time feedback on range of motion and joint positioning.
- **Speed Detection**: Alerts user if movements are too fast or too slow.
- **Yoga Support**: Hold-time tracking and pose stability analysis.

## 📡 API Interface
- `POST /start_camera`: Initialize the camera module.
- `POST /start_exercise`: Select the exercise type and begin tracking.
- `GET /app_state`: Poll for current reps, form score, and feedback text.
- `POST /stop_exercise`: Finalize the session and save statistics.

## 🚀 Running Locally
```bash
python services/exercise/main.py
```
The service runs on **Port 5001**.
