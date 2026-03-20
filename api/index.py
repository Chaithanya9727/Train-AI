"""
AI TRAIN TRAFFIC CONTROL SYSTEM v5.0 — ULTIMATE EDITION
=========================================================
Capstone Project — World-Class Backend

Features:
1. Smart Train Tracking (GPS simulation)
2. Collision Detection AI
3. Signal Automation (Red/Yellow/Green)
4. Delay Prediction (ML Model)
5. Weather Impact System (Rain/Fog/Storm)
6. Event History & Analytics
7. Voice Alert Data Feed
"""

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
# CORE ENUMS
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

class WeatherType(str, Enum):
    CLEAR = "CLEAR"
    RAIN = "RAIN"
    FOG = "FOG"
    STORM = "STORM"

# ============================================================
# STATIONS DATA
# ============================================================
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

# ============================================================
# WEATHER ENGINE
# ============================================================
class WeatherEngine:
    def __init__(self):
        self.current = WeatherType.CLEAR
        self.intensity = 0.0  # 0-1
        self.visibility_km = 10.0
        self.wind_speed = 5.0
        self.change_timer = 0

    def update(self):
        self.change_timer += 1
        if self.change_timer > random.randint(60, 180):
            self.change_timer = 0
            choices = [WeatherType.CLEAR, WeatherType.CLEAR, WeatherType.RAIN,
                       WeatherType.FOG, WeatherType.STORM]
            self.current = random.choice(choices)

        if self.current == WeatherType.CLEAR:
            self.intensity = max(0, self.intensity - 0.02)
            self.visibility_km = min(10, self.visibility_km + 0.1)
            self.wind_speed = max(5, self.wind_speed - 0.2)
        elif self.current == WeatherType.RAIN:
            self.intensity = min(0.7, self.intensity + 0.01)
            self.visibility_km = max(4, self.visibility_km - 0.05)
            self.wind_speed = min(25, self.wind_speed + 0.1)
        elif self.current == WeatherType.FOG:
            self.intensity = min(0.8, self.intensity + 0.015)
            self.visibility_km = max(1, self.visibility_km - 0.1)
            self.wind_speed = max(3, self.wind_speed - 0.1)
        elif self.current == WeatherType.STORM:
            self.intensity = min(1.0, self.intensity + 0.02)
            self.visibility_km = max(0.5, self.visibility_km - 0.15)
            self.wind_speed = min(60, self.wind_speed + 0.5)

    def speed_multiplier(self):
        if self.current == WeatherType.CLEAR:
            return 1.0
        elif self.current == WeatherType.RAIN:
            return 0.7
        elif self.current == WeatherType.FOG:
            return 0.5
        elif self.current == WeatherType.STORM:
            return 0.3
        return 1.0

    def to_dict(self):
        return {
            "type": self.current.value,
            "intensity": round(self.intensity, 2),
            "visibility_km": round(self.visibility_km, 1),
            "wind_speed": round(self.wind_speed, 1),
            "speed_multiplier": round(self.speed_multiplier(), 2)
        }

# ============================================================
# SIGNAL
# ============================================================
class Signal:
    def __init__(self, signal_id, track_segment, station_name):
        self.id = signal_id
        self.track_segment = track_segment
        self.station_name = station_name
        self.state = SignalState.GREEN
        self.reason = ""

# ============================================================
# TRAIN
# ============================================================
class Train:
    def __init__(self, train_id, name, track, direction=1, is_emergency=False):
        self.id = train_id
        self.name = name
        self.track = track
        self.position = random.uniform(0, 1)
        self.speed = random.uniform(0.005, 0.015)
        self.base_speed = self.speed
        self.direction = direction
        self.status = TrainStatus.RUNNING
        self.is_emergency = is_emergency
        self.delay_minutes = 0
        self.lat = 0
        self.lon = 0
        self.speed_kmh = random.randint(80, 160)
        self.passengers = random.randint(200, 1200)
        self.on_time_pct = round(random.uniform(85, 99), 1)
        self.update_gps()

    def update_gps(self, stations=None):
        st = stations or STATIONS
        idx = self.track % (len(st) - 1)
        s1 = st[idx]
        s2 = st[idx + 1]
        self.lat = lerp(s1["lat"], s2["lat"], self.position)
        self.lon = lerp(s1["lon"], s2["lon"], self.position)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "track": self.track,
            "position": round(self.position, 4), "speed": round(self.speed, 5),
            "status": self.status.value, "is_emergency": self.is_emergency,
            "delay_minutes": self.delay_minutes,
            "lat": round(self.lat, 5), "lon": round(self.lon, 5),
            "direction": self.direction,
            "speed_kmh": self.speed_kmh,
            "passengers": self.passengers,
            "on_time_pct": self.on_time_pct
        }

# ============================================================
# COLLISION DETECTOR
# ============================================================
class CollisionDetector:
    DANGER_THRESHOLD = 0.15
    WARNING_THRESHOLD = 0.25

    def detect(self, trains):
        alerts = []
        for i in range(len(trains)):
            for j in range(i+1, len(trains)):
                t1, t2 = trains[i], trains[j]
                if t1.track == t2.track:
                    distance = abs(t1.position - t2.position)
                    if distance < self.DANGER_THRESHOLD:
                        alerts.append({
                            "type": "COLLISION_DANGER", "severity": "CRITICAL",
                            "train_a": t1.name, "train_b": t2.name,
                            "track": t1.track, "distance": round(distance, 4),
                            "message": f"⚠️ COLLISION RISK: {t1.name} & {t2.name} — Distance: {distance:.2%}",
                            "voice": f"DANGER! Collision risk between {t1.name.replace('_', ' ')} and {t2.name.replace('_', ' ')} on Track {t1.track}!"
                        })
                    elif distance < self.WARNING_THRESHOLD:
                        alerts.append({
                            "type": "PROXIMITY_WARNING", "severity": "WARNING",
                            "train_a": t1.name, "train_b": t2.name,
                            "track": t1.track, "distance": round(distance, 4),
                            "message": f"⚡ PROXIMITY: {t1.name} & {t2.name}",
                            "voice": f"Warning! Close proximity between {t1.name.replace('_', ' ')} and {t2.name.replace('_', ' ')}."
                        })
        return alerts

# ============================================================
# SIGNAL CONTROLLER
# ============================================================
class SignalController:
    def __init__(self):
        self.signals = []
        for i in range(len(STATIONS) - 1):
            self.signals.append(Signal(i, i, STATIONS[i]["name"]))

    def update(self, trains, alerts):
        for sig in self.signals:
            sig.state = SignalState.GREEN
            sig.reason = "Track clear"

        danger_tracks = set()
        for alert in alerts:
            if alert["severity"] == "CRITICAL":
                danger_tracks.add(alert["track"])

        for sig in self.signals:
            if sig.track_segment in danger_tracks:
                sig.state = SignalState.RED
                sig.reason = "Collision risk detected"
            else:
                trains_on_seg = sum(1 for t in trains if t.track == sig.track_segment)
                if trains_on_seg >= 2:
                    sig.state = SignalState.YELLOW
                    sig.reason = "High density"

        for train in trains:
            if train.is_emergency:
                sig_idx = train.track % len(self.signals)
                self.signals[sig_idx].state = SignalState.GREEN
                self.signals[sig_idx].reason = f"PRIORITY: {train.name}"

    def to_list(self):
        return [{"id": s.id, "track_segment": s.track_segment, "station": s.station_name,
                 "state": s.state.value, "reason": s.reason} for s in self.signals]

# ============================================================
# DELAY PREDICTOR (ML MODEL)
# ============================================================
class DelayPredictor:
    def __init__(self):
        self.weights = {
            "speed_factor": -15.0, "congestion_factor": 25.0,
            "distance_factor": 0.01, "time_factor": 3.0, "weather_factor": 20.0
        }

    def predict(self, train, all_trains, weather):
        speed_norm = train.speed / 0.015
        trains_on_track = sum(1 for t in all_trains if t.track == train.track)
        congestion = trains_on_track / max(len(all_trains), 1)
        distance_remaining = (1 - train.position) * 200
        hour = time.localtime().tm_hour
        is_peak = 1.0 if (7 <= hour <= 10 or 17 <= hour <= 20) else 0.0
        weather_impact = weather.intensity

        delay = (
            self.weights["speed_factor"] * (1 - speed_norm) +
            self.weights["congestion_factor"] * congestion +
            self.weights["distance_factor"] * distance_remaining +
            self.weights["time_factor"] * is_peak +
            self.weights["weather_factor"] * weather_impact +
            random.gauss(0, 2)
        )
        confidence = max(0.6, min(0.98, 0.85 + random.gauss(0, 0.05)))
        return max(0, round(delay, 1)), round(confidence, 2)

# ============================================================
# ANALYTICS ENGINE
# ============================================================
class AnalyticsEngine:
    def __init__(self):
        self.delay_history = []      # list of avg delays over time
        self.collision_history = []   # timestamps of collisions prevented
        self.throughput_history = []  # trains moved per tick window
        self.ai_decisions = []       # log of AI decisions
        self.max_history = 60        # keep last 60 data points

    def record_tick(self, stats, alerts, weather, tick):
        self.delay_history.append(stats["avg_delay"])
        if len(self.delay_history) > self.max_history:
            self.delay_history.pop(0)

        if any(a["severity"] == "CRITICAL" for a in alerts):
            self.collision_history.append(tick)

        self.throughput_history.append(stats["running"])
        if len(self.throughput_history) > self.max_history:
            self.throughput_history.pop(0)

        # AI decision log
        if alerts:
            for a in alerts:
                self.ai_decisions.append({
                    "tick": tick,
                    "action": "EMERGENCY_BRAKE" if a["severity"] == "CRITICAL" else "SPEED_REDUCE",
                    "reason": a["message"],
                    "weather": weather.current.value,
                    "timestamp": time.time()
                })
        if len(self.ai_decisions) > 30:
            self.ai_decisions = self.ai_decisions[-30:]

    def to_dict(self):
        return {
            "delay_trend": self.delay_history,
            "collision_events": len(self.collision_history),
            "throughput_trend": self.throughput_history,
            "ai_decisions": self.ai_decisions[-10:],
            "peak_delay": max(self.delay_history) if self.delay_history else 0,
            "avg_throughput": round(np.mean(self.throughput_history), 1) if self.throughput_history else 0
        }

# ============================================================
# MAIN ENGINE
# ============================================================
class TrainTrafficEngine:
    def __init__(self):
        self.trains = []
        self.collision_detector = CollisionDetector()
        self.signal_controller = SignalController()
        self.delay_predictor = DelayPredictor()
        self.weather = WeatherEngine()
        self.analytics = AnalyticsEngine()
        self.alerts = []
        self.voice_queue = []
        self.sim_speed = 1.0
        self.tick = 0
        self.total_collisions_prevented = 0
        self.stations = STATIONS
        self.track_routes = self._build_routes()

        names = ["VANDE_BHARAT_22439", "RAJDHANI_12952", "SHATABDI_12010",
                 "DURONTO_12290", "GARIB_RATH_12216"]
        for i, name in enumerate(names):
            self.trains.append(Train(i, name, track=i % (len(STATIONS)-1)))

    def _build_routes(self):
        routes = []
        for i in range(len(self.stations) - 1):
            s1, s2 = self.stations[i], self.stations[i+1]
            routes.append({
                "from": s1["name"], "to": s2["name"],
                "coords": [[s1["lat"], s1["lon"]], [s2["lat"], s2["lon"]]],
                "segment": i
            })
        return routes

    def add_train(self, is_emergency=False):
        tid = max((t.id for t in self.trains), default=-1) + 1
        name = f"EXPRESS_{20000 + tid}" if not is_emergency else f"EMERGENCY_{tid}"
        t = Train(tid, name, track=tid % (len(self.stations)-1), is_emergency=is_emergency)
        self.trains.append(t)
        if is_emergency:
            self.voice_queue.append(f"Emergency train {name} has been deployed. All signals clearing.")

    def remove_train(self):
        if len(self.trains) > 1:
            removed = self.trains.pop()
            self.voice_queue.append(f"Train {removed.name} has been removed from the network.")

    def step(self):
        self.tick += 1
        self.voice_queue = []

        # Weather update
        self.weather.update()
        weather_mult = self.weather.speed_multiplier()

        # Weather voice alert
        if self.weather.current == WeatherType.STORM and self.tick % 30 == 0:
            self.voice_queue.append("Storm warning! All trains reducing speed to 30 percent.")
        elif self.weather.current == WeatherType.FOG and self.tick % 50 == 0:
            self.voice_queue.append("Dense fog detected. Visibility below 2 kilometers. Speed restrictions active.")

        # Move trains
        for train in self.trains:
            if train.status == TrainStatus.STOPPED:
                continue

            sig_idx = train.track % len(self.signal_controller.signals)
            signal = self.signal_controller.signals[sig_idx]

            if signal.state == SignalState.RED and not train.is_emergency:
                train.status = TrainStatus.STOPPED
                train.speed = 0
                continue
            elif signal.state == SignalState.YELLOW:
                train.speed = train.base_speed * 0.5 * self.sim_speed * weather_mult
            else:
                train.speed = train.base_speed * self.sim_speed * weather_mult

            train.speed_kmh = int(train.speed * 12000 * weather_mult)
            train.position += train.speed * train.direction

            if train.position >= 1.0:
                train.track = (train.track + 1) % (len(self.stations) - 1)
                train.position = 0
            elif train.position < 0:
                train.track = (train.track - 1) % (len(self.stations) - 1)
                train.position = 1.0

            train.update_gps(self.stations)

            delay, _ = self.delay_predictor.predict(train, self.trains, self.weather)
            train.delay_minutes = delay
            if delay > 15:
                train.status = TrainStatus.DELAYED
            elif train.status == TrainStatus.DELAYED and delay < 5:
                train.status = TrainStatus.RUNNING

        # Collision detection
        self.alerts = self.collision_detector.detect(self.trains)

        for alert in self.alerts:
            if alert["severity"] == "CRITICAL":
                self.total_collisions_prevented += 1
                self.voice_queue.append(alert["voice"])
                for t in self.trains:
                    if t.name == alert["train_b"] and not t.is_emergency:
                        t.status = TrainStatus.STOPPED
                        t.speed = 0

        # Signal automation
        self.signal_controller.update(self.trains, self.alerts)

        # Resume stopped trains
        if self.tick % 10 == 0:
            for t in self.trains:
                if t.status == TrainStatus.STOPPED and not t.is_emergency:
                    safe = True
                    for other in self.trains:
                        if other.id != t.id and other.track == t.track:
                            if abs(other.position - t.position) < 0.2:
                                safe = False
                    if safe:
                        t.status = TrainStatus.RUNNING
                        t.speed = t.base_speed * self.sim_speed

        # Stats
        stats = {
            "total_trains": len(self.trains),
            "running": sum(1 for t in self.trains if t.status == TrainStatus.RUNNING),
            "stopped": sum(1 for t in self.trains if t.status == TrainStatus.STOPPED),
            "delayed": sum(1 for t in self.trains if t.status == TrainStatus.DELAYED),
            "collisions_prevented": self.total_collisions_prevented,
            "avg_delay": round(np.mean([t.delay_minutes for t in self.trains]), 1) if self.trains else 0,
            "total_passengers": sum(t.passengers for t in self.trains)
        }

        # Analytics
        self.analytics.record_tick(stats, self.alerts, self.weather, self.tick)

        # Predictions
        predictions = {}
        for t in self.trains:
            delay, conf = self.delay_predictor.predict(t, self.trains, self.weather)
            predictions[t.name] = {"delay": delay, "confidence": conf}

        return {
            "trains": [t.to_dict() for t in self.trains],
            "stations": self.stations,
            "signals": self.signal_controller.to_list(),
            "alerts": self.alerts,
            "predictions": predictions,
            "weather": self.weather.to_dict(),
            "analytics": self.analytics.to_dict(),
            "voice_alerts": self.voice_queue,
            "track_routes": self.track_routes,
            "stats": stats,
            "timestamp": time.time(),
            "tick": self.tick
        }


# ============================================================
# API SERVER
# ============================================================
app = FastAPI(title="AI Train Traffic Control v5")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

engine = TrainTrafficEngine()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
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
                    # Spread stations across ~75km corridor from searched location
                    directions = ["SOUTH", "SW JN", "WEST JN", "CENTRAL", "NORTH JN", "NE TERMINAL"]
                    engine.stations = [
                        {"id": i, "name": f"{directions[i]}", "lat": lat + (i * 0.15), "lon": lon + (i * 0.08), "km": i * 150}
                        for i in range(6)
                    ]
                    engine.track_routes = engine._build_routes()
                    for t in engine.trains:
                        t.update_gps(engine.stations)
                    engine.signal_controller = SignalController()
            except asyncio.TimeoutError:
                pass

            state = engine.step()
            await websocket.send_json(state)
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"WebSocket closed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
