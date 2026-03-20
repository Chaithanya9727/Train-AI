# 🚆 AI Train Traffic Control System — INDIA MASTER

**Advanced AI-Powered Digital Twin for Indian Railways**
*A Capstone Project by [YOUR NAME]*

---

## 🌟 The Vision
Indian Railways operates one of the densest networks globally. Managing 13,000+ daily trains manually leads to significant delays and safety risks. This project implements an **AI-Based Digital Twin** of the Mumbai-Delhi Vande Bharat Corridor, using **Reinforcement Learning** to optimize traffic flow, predict delays, and automatically manage railway signals.

## 🏗️ Technical Architecture
- **AI Backend**: Python (FastAPI) + Gymnasium (RL) + NumPy
- **ML Methodology**: Reinforcement Learning (RL) with custom reward functions for collision avoidance and congestion clearing.
- **Frontend Dashboard**: Next.js 15 + TypeScript + Tailwind CSS
- **GIS Mapping**: React-Leaflet with live GPS telemetry via WebSockets.
- **Infrastructure**: Unified "One Folder" architecture for deployment.

## ✅ Key Modules & Features

### 🟠 Module 1: AI Traffic Simulation (Sandbox)
- **Signal Automation**: RED/YELLOW/GREEN signals updated every half-second based on AI occupancy data.
- **Collision Detection**: 360° proximity sensing that alerts and applies emergency brakes (Stop-Protocol) if train distance < 0.15 segment.
- **Unit Control**: Spawn normal or SOS (Emergency) trains to test the AI's priority routing logic.
- **Sim-Rate Control**: High-speed (10X) simulation to fast-forward traffic stress-tests.

### 🟣 Module 2: Real-time India Corridor Monitoring
- **Live Vande Bharat corridor**: Tracking the exact route from Mumbai Central (BCT) to New Delhi (NDLS).
- **AI Delay Prediction**: ML-logic predicting delay in minutes based on current speed, track congestion, and distance.
- **Station Sync**: GPS-synced station nodes with signal lights.

## 🧠 The AI Model (RL Optimization)
The **Reinforcement Learning (RL)** agent observes the state of each track segment:
```python
# The AI Decision Heuristic:
if congestion > 0.7:
    Action -> DE-ACCEL_MODE (Congested Track Clearing)
elif is_emergency_unit:
    Action -> HIGH_PRIORITY_VANDE (Clear all signals forward)
else:
    Action -> NOMINAL_OPERATION (Optimal Speed)
```

## 🚀 Presentation Guide (University Demo)
1. **The 'One-Folder' Deployment**: Show the unified code structure (`Next.js` + `FastAPI`).
2. **Stress Test**: Spawn 5-8 extra units in the **Simulation Module** and show the AI's "Decision Log" as it frantically adjusts signals to prevent a 100% collision risk.
3. **The 'WOW' Moment**: Spawn an **SOS Train** and point out how the AI instantly clears its path by turning signals to **GREEN** while stopping other trains.
4. **Conclusion**: Discuss scalability—how this system can bridge the gap between IRCTC's data and actual autonomous signal switching.

---

### 🛠️ Local Development
`npm install` - Install frontend dependencies.
`pip install -r requirements.txt` - Install AI engine.
`npm run dev` - Launch the GIS Command Center.
`python -m uvicorn api.index:app --reload` - Start the AI RL Engine.
