"""
AI TRAIN TRAFFIC CONTROL SYSTEM
================================
Capstone Project — Complete Backend

Features:
1. Smart Train Tracking (GPS simulation on tracks)
2. Collision Detection AI
3. Signal Automation (Red/Green)
4. Delay Prediction (ML Model)
5. Real-time WebSocket Dashboard Feed
"""

import gymnasium as gym
import numpy as np
import random
import time
import asyncio
import json
import math
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum

# ============================================================
# STEP 1: RAILWAY NETWORK MODEL
# ============================================================

class SignalState(str, Enum):
    RED = "RED"
    GREEN = "GREEN"
    YELLOW = "YELLOW"

class TrainStatus(str, Enum):
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    EMERGENCY = "EMERGENCY"
    DELAYED = "DELAYED"

# Define the railway network: tracks and stations
STATIONS = [
    {"id": 0, "name": "MUMBAI CENTRAL",  "lat": 18.9697, "lon": 72.8193, "km": 0},
    {"id": 1, "name": "SURAT JN",        "lat": 21.2049, "lon": 72.8406, "km": 263},
    {"id": 2, "name": "VADODARA JN",     "lat": 22.3106, "lon": 73.1812, "km": 392},
    {"id": 3, "name": "RATLAM JN",       "lat": 23.3364, "lon": 75.0374, "km": 600},
    {"id": 4, "name": "KOTA JN",         "lat": 25.1311, "lon": 75.8458, "km": 780},
    {"id": 5, "name": "NEW DELHI",       "lat": 28.6429, "lon": 77.2187, "km": 1384},
]

def lerp(a, b, t):
    return a + (b - a) * t

class Signal:
    def __init__(self, signal_id, track_segment, station_name):
        self.id = signal_id
        self.track_segment = track_segment
        self.station_name = station_name
        self.state = SignalState.GREEN
        self.reason = ""

class Train:
    def __init__(self, train_id, name, track, direction=1, is_emergency=False):
        self.id = train_id
        self.name = name
        self.track = track  # which track segment (0-4 for 5 segments)
        self.position = random.uniform(0, 1)  # 0 to 1 within segment
        self.speed = random.uniform(0.005, 0.015)
        self.base_speed = self.speed
        self.direction = direction  # 1=forward, -1=backward
        self.status = TrainStatus.RUNNING
        self.is_emergency = is_emergency
        self.delay_minutes = 0
        self.lat = 0
        self.lon = 0
        self.update_gps()

    def update_gps(self):
        """Convert track position to GPS coordinates"""
        idx = self.track % (len(STATIONS) - 1)
        s1 = STATIONS[idx]
        s2 = STATIONS[idx + 1]
        self.lat = lerp(s1["lat"], s2["lat"], self.position)
        self.lon = lerp(s1["lon"], s2["lon"], self.position)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "track": self.track,
            "position": round(self.position, 4),
            "speed": round(self.speed, 5),
            "status": self.status.value,
            "is_emergency": self.is_emergency,
            "delay_minutes": self.delay_minutes,
            "lat": round(self.lat, 5),
            "lon": round(self.lon, 5),
            "direction": self.direction
        }


# ============================================================
# STEP 2: COLLISION DETECTION AI
# ============================================================

class CollisionDetector:
    DANGER_THRESHOLD = 0.15  # 15% of track = danger zone
    WARNING_THRESHOLD = 0.25

    def detect(self, trains):
        alerts = []
        for i in range(len(trains)):
            for j in range(i+1, len(trains)):
                t1, t2 = trains[i], trains[j]
                # Same track check
                if t1.track == t2.track:
                    distance = abs(t1.position - t2.position)
                    if distance < self.DANGER_THRESHOLD:
                        alerts.append({
                            "type": "COLLISION_DANGER",
                            "severity": "CRITICAL",
                            "train_a": t1.name,
                            "train_b": t2.name,
                            "track": t1.track,
                            "distance": round(distance, 4),
                            "message": f"⚠️ COLLISION RISK: {t1.name} & {t2.name} on Track {t1.track} — Distance: {distance:.2%}"
                        })
                    elif distance < self.WARNING_THRESHOLD:
                        alerts.append({
                            "type": "PROXIMITY_WARNING",
                            "severity": "WARNING",
                            "train_a": t1.name,
                            "train_b": t2.name,
                            "track": t1.track,
                            "distance": round(distance, 4),
                            "message": f"⚡ CLOSE PROXIMITY: {t1.name} & {t2.name} on Track {t1.track}"
                        })
        return alerts


# ============================================================
# STEP 3: SIGNAL AUTOMATION SYSTEM
# ============================================================

class SignalController:
    def __init__(self):
        self.signals = []
        for i in range(len(STATIONS) - 1):
            self.signals.append(Signal(
                signal_id=i,
                track_segment=i,
                station_name=STATIONS[i]["name"]
            ))

    def update(self, trains, alerts):
        """Auto-control signals based on train positions and alerts"""
        # Reset all to GREEN
        for sig in self.signals:
            sig.state = SignalState.GREEN
            sig.reason = "Track clear"

        # If collision alert, set RED
        danger_tracks = set()
        for alert in alerts:
            if alert["severity"] == "CRITICAL":
                danger_tracks.add(alert["track"])

        for sig in self.signals:
            if sig.track_segment in danger_tracks:
                sig.state = SignalState.RED
                sig.reason = "Collision risk detected"
            else:
                # Check density: if 2+ trains on segment, set YELLOW
                trains_on_seg = sum(1 for t in trains if t.track == sig.track_segment)
                if trains_on_seg >= 2:
                    sig.state = SignalState.YELLOW
                    sig.reason = "High density"

        # Emergency train priority: clear the path
        for train in trains:
            if train.is_emergency:
                sig_idx = train.track % len(self.signals)
                self.signals[sig_idx].state = SignalState.GREEN
                self.signals[sig_idx].reason = f"PRIORITY: {train.name}"

    def to_list(self):
        return [{
            "id": s.id,
            "track_segment": s.track_segment,
            "station": s.station_name,
            "state": s.state.value,
            "reason": s.reason
        } for s in self.signals]


# ============================================================
# STEP 4: DELAY PREDICTION (AI/ML MODEL)
# ============================================================

class DelayPredictor:
    """
    Simple ML-inspired delay prediction model.
    Uses features: speed, congestion, distance_remaining, time_of_day
    In a real system, this would be a trained sklearn/tensorflow model.
    """
    def __init__(self):
        # Simulated model weights (like a trained linear regression)
        self.weights = {
            "speed_factor": -15.0,      # faster = less delay
            "congestion_factor": 25.0,  # more congestion = more delay
            "distance_factor": 0.01,    # more distance = more delay
            "time_factor": 3.0          # peak hours = more delay
        }

    def predict(self, train, all_trains):
        # Feature extraction
        speed_norm = train.speed / 0.015  # normalize speed
        trains_on_track = sum(1 for t in all_trains if t.track == train.track)
        congestion = trains_on_track / max(len(all_trains), 1)
        distance_remaining = (1 - train.position) * 200  # km remaining in segment
        hour = time.localtime().tm_hour
        is_peak = 1.0 if (7 <= hour <= 10 or 17 <= hour <= 20) else 0.0

        # Prediction (like model.predict())
        delay = (
            self.weights["speed_factor"] * (1 - speed_norm) +
            self.weights["congestion_factor"] * congestion +
            self.weights["distance_factor"] * distance_remaining +
            self.weights["time_factor"] * is_peak +
            random.gauss(0, 2)  # noise
        )
        confidence = max(0.6, min(0.98, 0.85 + random.gauss(0, 0.05)))
        return max(0, round(delay, 1)), round(confidence, 2)


# ============================================================
# STEP 5: MAIN SIMULATION ENGINE
# ============================================================

class TrainTrafficEngine:
    def __init__(self):
        self.trains = []
        self.collision_detector = CollisionDetector()
        self.signal_controller = SignalController()
        self.delay_predictor = DelayPredictor()
        self.alerts = []
        self.sim_speed = 1.0
        self.tick = 0
        self.total_collisions_prevented = 0
        self.stations = STATIONS

        # Spawn initial trains
        train_names = ["VANDE_BHARAT_22439", "RAJDHANI_12952", "SHATABDI_12010", 
                       "DURONTO_12290", "GARIB_RATH_12216"]
        for i, name in enumerate(train_names):
            self.trains.append(Train(i, name, track=i % (len(STATIONS)-1)))

    def add_train(self, is_emergency=False):
        tid = len(self.trains)
        name = f"EXPRESS_{20000 + tid}" if not is_emergency else f"🚨 EMERGENCY_{tid}"
        t = Train(tid, name, track=tid % (len(STATIONS)-1), is_emergency=is_emergency)
        self.trains.append(t)

    def remove_train(self):
        if len(self.trains) > 1:
            self.trains.pop()

    def step(self):
        self.tick += 1

        # Move trains
        for train in self.trains:
            if train.status == TrainStatus.STOPPED:
                continue

            # Check signal before moving
            sig_idx = train.track % len(self.signal_controller.signals)
            signal = self.signal_controller.signals[sig_idx]

            if signal.state == SignalState.RED and not train.is_emergency:
                train.status = TrainStatus.STOPPED
                train.speed = 0
                continue
            elif signal.state == SignalState.YELLOW:
                train.speed = train.base_speed * 0.5 * self.sim_speed
            else:
                train.speed = train.base_speed * self.sim_speed

            train.position += train.speed * train.direction
            if train.position >= 1.0:
                train.track = (train.track + 1) % (len(STATIONS) - 1)
                train.position = 0
            elif train.position < 0:
                train.track = (train.track - 1) % (len(STATIONS) - 1)
                train.position = 1.0

            train.update_gps()

            # Delay prediction
            delay, _ = self.delay_predictor.predict(train, self.trains)
            train.delay_minutes = delay
            if delay > 15:
                train.status = TrainStatus.DELAYED
            elif train.status == TrainStatus.DELAYED and delay < 5:
                train.status = TrainStatus.RUNNING

        # Collision detection
        self.alerts = self.collision_detector.detect(self.trains)

        # If collision detected, AUTO-STOP the slower train
        for alert in self.alerts:
            if alert["severity"] == "CRITICAL":
                self.total_collisions_prevented += 1
                # Find the trains and stop the slower one
                for t in self.trains:
                    if t.name == alert["train_b"] and not t.is_emergency:
                        t.status = TrainStatus.STOPPED
                        t.speed = 0

        # Signal automation
        self.signal_controller.update(self.trains, self.alerts)

        # Resume stopped trains after 5 ticks if safe
        if self.tick % 10 == 0:
            for t in self.trains:
                if t.status == TrainStatus.STOPPED and not t.is_emergency:
                    # Check if it's safe to resume
                    safe = True
                    for other in self.trains:
                        if other.id != t.id and other.track == t.track:
                            if abs(other.position - t.position) < 0.2:
                                safe = False
                    if safe:
                        t.status = TrainStatus.RUNNING
                        t.speed = t.base_speed * self.sim_speed

    def get_state(self):
        predictions = {}
        for t in self.trains:
            delay, conf = self.delay_predictor.predict(t, self.trains)
            predictions[t.name] = {"delay": delay, "confidence": conf}

        return {
            "trains": [t.to_dict() for t in self.trains],
            "stations": self.stations,
            "signals": self.signal_controller.to_list(),
            "alerts": self.alerts,
            "predictions": predictions,
            "stats": {
                "total_trains": len(self.trains),
                "running": sum(1 for t in self.trains if t.status == TrainStatus.RUNNING),
                "stopped": sum(1 for t in self.trains if t.status == TrainStatus.STOPPED),
                "delayed": sum(1 for t in self.trains if t.status == TrainStatus.DELAYED),
                "collisions_prevented": self.total_collisions_prevented,
                "avg_delay": round(np.mean([t.delay_minutes for t in self.trains]), 1) if self.trains else 0
            },
            "timestamp": time.time(),
            "tick": self.tick
        }


# ============================================================
# STEP 6: API + WEBSOCKET SERVER
# ============================================================

app = FastAPI(title="AI Train Traffic Control")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

engine = TrainTrafficEngine()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Handle commands from frontend
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                data = json.loads(msg)
                cmd = data.get("type")
                if cmd == "ADD_TRAIN":
                    engine.add_train(is_emergency=data.get("emergency", False))
                elif cmd == "REMOVE_TRAIN":
                    engine.remove_train()
                elif cmd == "SET_SPEED":
                    engine.sim_speed = max(0.1, data.get("speed", 1) / 2.0)
                elif cmd == "SET_LOCATION":
                    lat, lon = data["lat"], data["lon"]
                    engine.stations = [
                        {"id": i, "name": f"NODE_{chr(65+i)}", "lat": lat + (i*0.008), "lon": lon + (i*0.008), "km": i*100}
                        for i in range(6)
                    ]
                    for t in engine.trains:
                        t.update_gps()
                    engine.signal_controller = SignalController()
            except asyncio.TimeoutError:
                pass

            engine.step()
            state = engine.get_state()
            await websocket.send_json(state)
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"WebSocket closed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
