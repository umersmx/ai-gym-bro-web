<div align="center">

# 🏋️ AI Gym Bro

### Your Intelligent, Browser-Based AI Personal Trainer

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-ai--gym--bro--web.vercel.app-FF6B35?style=for-the-badge)](https://ai-gym-bro-web.vercel.app)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-WASM-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://ai-gym-bro-web.vercel.app)

<br/>

AI Gym Bro is a fully client-side web application that uses your device's camera to **track your body mechanics in real-time**, **correct your exercise form**, and **count your repetitions automatically** — all without uploading a single frame to any server.

<br/>

</div>

---

## 📑 Table of Contents

- [Project Vision](#-project-vision)
- [Features](#-features)
- [Future Roadmap](#-future-roadmap)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Architecture & Geometric Logic](#-architecture--geometric-logic)
- [Getting Started](#-getting-started)
- [How It Works](#-how-it-works)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Collaboration & Task Management](#-collaboration--task-management)
- [Deployment](#-deployment)
- [Credits](#-credits)
- [License](#-license)

---

## 🎯 Project Vision

The fitness industry is evolving — but most AI-powered workout tools still rely on expensive wearables or cloud-based video processing, raising both **cost** and **privacy** concerns.

**AI Gym Bro** was born out of a simple belief:

> *Everyone deserves a smart personal trainer — for free, right in their browser.*

Our vision is to **democratize real-time exercise coaching** by combining cutting-edge pose estimation with lightweight, client-side machine learning. No sign-ups. No uploads. No subscriptions. Just you, your camera, and better form.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏋️ **Exercise Tracking** | Out-of-the-box support for Squats, Bicep Curls, Push-Ups, and Shoulder Press. |
| 🎯 **Real-Time Pose Detection** | Leverages MediaPipe to identify key body joints and render a skeletal overlay on your camera feed. |
| 📈 **Bilateral Rep Counting** | Independently tracks reps for both left and right sides — perfect for alternating curls. |
| 🗣️ **Live Form Feedback** | Computes joint angles in real-time and provides instant cues: *"GO LOWER!"*, *"EXTEND FULLY!"*, or *"GOOD FORM!"*. |
| 🛡️ **100% Client-Side** | Zero data leaves your device. All ML inference runs securely in-browser via WebAssembly. |
| 📱 **Responsive & Mobile Ready** | Beautiful on any screen size. Switch between front/back cameras directly in the interface. |

---

## 🗺️ Future Roadmap

| Priority | Feature | Description |
|:---:|---|---|
| 🔄 | **Deadlift & Lunge Detection** | Expand the exercise library with compound lower-body movements. |
| 📊 | **Workout History & Analytics** | Persist session data locally and display progressive overload charts. |
| 🔊 | **Audio Cues** | Voice-based rep counting and form correction for hands-free workouts. |
| 🌐 | **PWA Support** | Installable on mobile home screens for a native-like experience. |
| 🤝 | **Multi-User Mode** | Side-by-side pose tracking for partner or group workout sessions. |

---

## 🛠️ Tech Stack & Dependencies

The core algorithmic logic was originally prototyped using **`opencv-python`** and **`mediapipe`** in Python. The production application has been fully ported to a modern, secure, client-side web stack:

| Layer | Technology | Version |
|---|---|---|
| **Framework** | [React](https://react.dev/) | `19.x` |
| **Build Tool** | [Vite](https://vitejs.dev/) | `8.x` |
| **ML / Pose Estimation** | [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) | `0.10.x` |
| **Icons** | [Lucide React](https://lucide.dev/) | `1.x` |
| **Styling** | Vanilla CSS | Glassmorphism aesthetic |
| **Deployment** | [Vercel](https://vercel.com/) | — |

---

## 🧠 Architecture & Geometric Logic

AI Gym Bro's exercise detection engine is built on a **finite state machine** that interprets human movement through geometric angle calculations.

```
┌──────────────────────────────────────────────────────────┐
│                    CAMERA FEED                           │
│                       │                                  │
│                       ▼                                  │
│              ┌─────────────────┐                         │
│              │   MediaPipe     │  WASM-based inference   │
│              │  PoseLandmarker │  (GPU/CPU)              │
│              └────────┬────────┘                         │
│                       │  33 body landmarks               │
│                       ▼                                  │
│              ┌─────────────────┐                         │
│              │   Geometry      │  calculateAngle()       │
│              │   Engine        │  Shoulder→Elbow→Wrist   │
│              └────────┬────────┘                         │
│                       │  joint angles (0°–180°)          │
│                       ▼                                  │
│              ┌─────────────────┐                         │
│              │  State Machine  │  Phase A ⇄ Phase B      │
│              │  (Rep Counter)  │  threshold transitions  │
│              └────────┬────────┘                         │
│                       │                                  │
│                       ▼                                  │
│              ┌─────────────────┐                         │
│              │   UI Overlay    │  Rep count, form tips,  │
│              │   & Feedback    │  skeleton rendering      │
│              └─────────────────┘                         │
└──────────────────────────────────────────────────────────┘
```

### Core Angle Calculation

The mathematical foundation that powers all exercise detection — computing the inner angle at a joint formed by three body landmarks:

```javascript
/**
 * Calculates the angle (in degrees) at joint 'b' formed by points a → b → c.
 * Uses Math.atan2 to compute the angle between two vectors:
 *   Vector 1: b → a
 *   Vector 2: b → c
 *
 * @param {number[]} a - [x, y] coordinates (e.g., Shoulder)
 * @param {number[]} b - [x, y] coordinates (e.g., Elbow — the vertex)
 * @param {number[]} c - [x, y] coordinates (e.g., Wrist)
 * @returns {number} Angle at joint 'b' in degrees (0°–180°)
 */
export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c[1] - b[1], c[0] - b[0]) -
    Math.atan2(a[1] - b[1], a[0] - b[0]);

  let angle = Math.abs(radians * (180.0 / Math.PI));

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return angle;
}
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A device with a camera (webcam, laptop camera, or mobile)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/umersmx/ai-gym-bro-web.git
cd ai-gym-bro-web

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **`http://localhost:5173`** in your browser and allow camera access when prompted.

---

## ⚙️ How It Works

| Step | Process | Details |
|:---:|---|---|
| 1 | **Model Initialization** | The MediaPipe WASM runtime is fetched from a CDN and executes directly on the GPU/CPU via WebAssembly. |
| 2 | **Pose Inference** | A visual skeleton is rendered frame-by-frame on an HTML `<canvas>` overlay. |
| 3 | **Geometry Calculation** | The `ExerciseDetector` engine triangulates limb joints (e.g., `Shoulder → Elbow → Wrist`) and evaluates the geometric angle. |
| 4 | **State Machine** | Reps are logged only when angles fully transition between Phase A (e.g., > 160°) and Phase B (e.g., < 40°) and back. |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---:|---|
| `1` – `4` | Switch between exercises |
| `R` | Reset repetition counter |
| `Esc` | Return to landing page |

---

## 🤝 Collaboration & Task Management

We use GitHub **Issues** to maintain a professional, transparent engineering workflow:

| Role | Responsibility |
|---|---|
| **Group Lead** ([@arks](https://github.com/arks)) | Creates Issues for planned features and improvements (e.g., *"Add Squat detection"*, *"Improve UI overlay colors"*). |
| **Lead Developer** ([@umersmx](https://github.com/umersmx)) | Assigns issues, implements the solution, and closes with an associated commit — creating a full public audit trail. |

> **Want to contribute?** Fork the repo, create a feature branch, and submit a Pull Request. All contributions are welcome!

---

## 🌍 Deployment

AI Gym Bro is a static site and can be deployed to any compatible host. We use **Vercel** for production:

```bash
npx vercel --prod
```

---

## 👥 Credits

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/umersmx">
        <img src="https://github.com/umersmx.png" width="80px;" alt="Umer Farooq"/><br />
        <sub><b>Umer Farooq</b></sub>
      </a><br />
      <sub>Lead Developer</sub>
    </td>
    <td align="center">
      <a href="https://github.com/arks">
        <img src="https://github.com/arks.png" width="80px;" alt="Abdur Rehman K. Saeed"/><br />
        <sub><b>Abdur Rehman K. Saeed</b></sub>
      </a><br />
      <sub>Group Lead</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with 💪 and JavaScript**

*Lift smarter, not harder.* 🦾

</div>
