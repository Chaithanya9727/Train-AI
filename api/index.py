import random, time, asyncio, json, math, httpx, uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum

class SignalState(str, Enum): RED, GREEN, YELLOW = "RED", "GREEN", "YELLOW"
class TrainStatus(str, Enum): RUNNING, STOPPED, EMERGENCY, DELAYED = "RUNNING", "STOPPED", "EMERGENCY", "DELAYED"
class WeatherType(str, Enum): CLEAR, RAIN, FOG, STORM = "CLEAR", "RAIN", "FOG", "STORM"

STATIONS = [
    {"id":0,"name":"MUMBAI CENTRAL","lat":18.9697, "lon":72.8193},
    {"id":1,"name":"SURAT JN","lat":21.2049, "lon":72.8406},
    {"id":2,"name":"VADODARA JN","lat":22.3106, "lon":73.1812},
    {"id":3,"name":"RATLAM JN","lat":23.3364, "lon":75.0374},
    {"id":4,"name":"KOTA JN","lat":25.1311, "lon":75.8458},
    {"id":5,"name":"NEW DELHI","lat":28.6429, "lon":77.2187},
]

async def fetch_osm_stations(lat: float, lon: float, radius: int = 50000):
    url = "http://overpass-api.de/api/interpreter"
    query = f'[out:json][timeout:15];(node["railway"~"station|halt"](around:{radius},{lat},{lon}););out body tags;'
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data={"data": query}, headers={"User-Agent": "TrainAI/1.0"}, timeout=10.0)
            if resp.status_code == 200:
                els = resp.json().get("elements", [])
                stns, seen = [], set()
                for n in els:
                    name = n.get("tags", {}).get("name")
                    if not name or name in seen: continue
                    seen.add(name); stns.append({"id": len(stns), "name": name.upper(), "lat": n["lat"], "lon": n["lon"]})
                    if len(stns) >= 12: break
                if len(stns) >= 2:
                    stns.sort(key=lambda x: x["lat"])
                    for i, s in enumerate(stns): s["id"] = i
                    return stns
    except: pass
    # Ultra-aggressive inland shift to avoid sea for cities like Chennai/Mumbai
    is_east_coast = lon > 78.5
    is_west_coast = lon < 74.0
    
    # Stay much closer to center for fallback
    offsets = [(-0.01, -0.01), (-0.005, 0.01), (0.005, 0.015), (0.01, -0.005), (0.015, 0.01), (0.02, 0.02)]
    
    final_mods = []
    for m_lat, m_lon in offsets:
        adjust_lon = m_lon
        if is_east_coast: adjust_lon -= 0.12 # Massive shift west
        if is_west_coast: adjust_lon += 0.12 # Massive shift east
        final_mods.append((m_lat, adjust_lon))

    names = ["CITY", "WEST", "EAST", "SOUTH", "NORTH", "CENTRAL"]
    return [{"id": i, "name": f"STN_{names[i]}", "lat": lat + m[0], "lon": lon + m[1]} for i, m in enumerate(final_mods)]

TRAIN_NAMES = [
    "Vande Bharat Exp", "Rajdhani Express", "Shatabdi Express", "Duronto Express", 
    "Tejas Express", "Garib Rath", "Gatimaan Express", "Humsafar Exp", 
    "Mahamana Express", "Uday Express", "Antyodaya Exp", "Jan Shatabdi"
]

def lerp(a, b, t): return a + (b - a) * t

class Train:
    def __init__(self, tid, name, track):
        self.id, self.name, self.track = tid, name, track
        self.position, self.speed = random.uniform(0, 1), 0.01
        self.status, self.lat, self.lon, self.delay_minutes = TrainStatus.RUNNING, 0, 0, 0
        self.passengers = random.randint(200, 1200)

    def update(self, stations, broken_tracks, sig_state, mult=1.0):
        # Handle broken track limits
        if self.track in broken_tracks:
            self.status = TrainStatus.STOPPED
            self.speed = 0
            self.delay_minutes += 1
        elif sig_state == SignalState.RED: 
            self.speed = 0
            self.status = TrainStatus.STOPPED
        else:
            self.speed = 0.008 * mult * (0.5 if sig_state == SignalState.YELLOW else 1.0)
            self.status = TrainStatus.RUNNING 
            self.position += self.speed
            if self.position >= 1.0: 
                self.track = (self.track + 1) % max(1, len(stations)-1)
                self.position = 0
        
        idx = self.track % max(1, len(stations) - 1)
        next_idx = min(idx+1, len(stations)-1)
        self.lat = lerp(stations[idx]["lat"], stations[next_idx]["lat"], self.position)
        self.lon = lerp(stations[idx]["lon"], stations[next_idx]["lon"], self.position)

class TrainTrafficEngine:
    def __init__(self):
        self.stations = STATIONS
        self.tick = 0
        self.ai_logs = []
        self.alerts = []
        self.trains = [Train(i, random.choice(TRAIN_NAMES), i % 5) for i in range(5)]
        self.signals = [SignalState.GREEN] * max(1, len(self.stations) - 1)
        self.sim_speed = 1
        self.eco_mode = False
        self.broken_tracks = []
        self.collisions_prevented = 0
        self.delay_history = [0] * 20
        self.weather = {"type": "CLEAR", "visibility_km": 10, "wind_speed": 5, "speed_multiplier": 1.0}
    
    def step(self):
        self.tick += 1
        num_segs = max(1, len(self.stations) - 1)
        
        while len(self.signals) < num_segs: self.signals.append(SignalState.GREEN)
        self.signals = self.signals[:num_segs]

        density = [0] * num_segs
        for t in self.trains:
            if t.track < len(density):
                density[t.track] += 1

        self.alerts = []
        
        if random.random() < 0.005:
            w_types = ["CLEAR", "CLEAR", "CLEAR", "RAIN", "FOG", "STORM"]
            sel = random.choice(w_types)
            if sel == "CLEAR": self.weather = {"type": "CLEAR", "visibility_km": 10, "wind_speed": 5, "speed_multiplier": 1.0}
            elif sel == "RAIN": self.weather = {"type": "RAIN", "visibility_km": 4, "wind_speed": 20, "speed_multiplier": 0.8}
            elif sel == "FOG": self.weather = {"type": "FOG", "visibility_km": 0.5, "wind_speed": 2, "speed_multiplier": 0.5}
            elif sel == "STORM": self.weather = {"type": "STORM", "visibility_km": 2, "wind_speed": 65, "speed_multiplier": 0.4}
            self.ai_logs.append({"tick":self.tick, "action":"WEATHER_SYNC", "reason":f"Weather shifted to {sel}."})

        for i in range(num_segs):
            if i in self.broken_tracks:
                if self.signals[i] != SignalState.RED:
                    self.signals[i] = SignalState.RED
                    self.ai_logs.append({"tick":self.tick, "action":"EMERGENCY_BRAKE", "reason":f"Track {i} sabotage detected! Halt enforced."})
                    self.alerts.append({"severity": "CRITICAL", "message": f"Track {i} Sabotaged! RED signal."})
            elif density[i] >= 2:
                if self.signals[i] != SignalState.YELLOW:
                    self.signals[i] = SignalState.YELLOW
                    self.ai_logs.append({"tick":self.tick, "action":"SIGNAL_SWITCH", "reason":f"Congestion on track {i}. Speed reduced."})
                    self.collisions_prevented += 1
            else:
                self.signals[i] = SignalState.GREEN

        speed_mult = self.sim_speed * self.weather["speed_multiplier"] * (0.7 if self.eco_mode else 1.0)
        
        for t in self.trains:
            state = self.signals[t.track] if t.track < len(self.signals) else SignalState.GREEN
            t.update(self.stations, self.broken_tracks, state, speed_mult)
            if t.status == TrainStatus.STOPPED and t.track not in self.broken_tracks:
                if t.track < num_segs-1 and self.signals[t.track+1] == SignalState.RED:
                    self.alerts.append({"severity": "WARN", "message": f"Train {t.name} holding before segment {t.track+1}."})

        if self.tick % 50 == 0: 
            self.ai_logs.append({"tick":self.tick, "action":"SYSTEM_SYNC", "reason":"Neural Network: Telemetry Optimal."})
        
        self.ai_logs = self.ai_logs[-15:]
        
        avg_delay = int(sum(t.delay_minutes for t in self.trains) / max(1, len(self.trains)))
        if self.tick % 10 == 0:
            self.delay_history.append(avg_delay)
            self.delay_history = self.delay_history[-20:]
            
        track_routes = []
        for i in range(num_segs):
            track_routes.append({
                "coords": [
                    [self.stations[i]["lat"], self.stations[i]["lon"]],
                    [self.stations[i+1]["lat"], self.stations[i+1]["lon"]]
                ]
            })

        predictions = {}
        for t in self.trains:
            predictions[t.name] = {
                "confidence": max(0.4, min(0.99, 1.0 - (t.delay_minutes * 0.05) + random.uniform(-0.05, 0.05)))
            }

        return {
            "trains": [{"id": t.id, "name": t.name, "lat": t.lat, "lon": t.lon, "status": t.status.value, "delay_minutes": t.delay_minutes, "speed_kmh": int(t.speed * 8000), "passengers": t.passengers} for t in self.trains],
            "stations": self.stations,
            "signals": [{"id": i, "station": self.stations[i]["name"] if i < len(self.stations) else f"SEG_{i}", "state": self.signals[i].value} for i in range(num_segs)],
            "track_routes": track_routes,
            "broken_tracks": self.broken_tracks,
            "weather": self.weather,
            "alerts": self.alerts,
            "predictions": predictions,
            "stats": {
                "avg_delay": avg_delay, 
                "running": sum(1 for t in self.trains if t.status == TrainStatus.RUNNING),
                "stopped": sum(1 for t in self.trains if t.status == TrainStatus.STOPPED),
                "delayed": sum(1 for t in self.trains if t.delay_minutes > 5),
                "total_trains": len(self.trains),
                "collisions_prevented": self.collisions_prevented,
                "total_passengers": sum(t.passengers for t in self.trains)
            },
            "analytics": {
                "ai_decisions": self.ai_logs,
                "delay_trend": self.delay_history,
                "eco_saved_kwh": self.tick * 4 if self.eco_mode else 0
            }
        }

engine = TrainTrafficEngine()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
            d = json.loads(msg)
            type_val = d.get("type")
            if type_val == "SET_LOCATION":
                res = await fetch_osm_stations(d["lat"], d["lon"])
                if res and len(res) >= 2: 
                    engine.stations = res
                    engine.trains = [Train(i, random.choice(TRAIN_NAMES), i % (len(res)-1)) for i in range(5)]
                    engine.broken_tracks = []
                    engine.ai_logs.append({"tick":engine.tick, "action":"SYNC", "reason":f"Recalculating routes for {res[0]['name']}."})
            elif type_val == "SET_SPEED":
                engine.sim_speed = int(d.get("speed", 1))
                engine.ai_logs.append({"tick":engine.tick, "action":"SYS_VAR", "reason":f"Simulation speed set to {engine.sim_speed}X."})
            elif type_val == "ADD_TRAIN":
                tid = len(engine.trains)
                name = random.choice(TRAIN_NAMES)
                engine.trains.append(Train(tid, name, 0))
                engine.ai_logs.append({"tick":engine.tick, "action":"INJECT", "reason":f"New train {name} injected to grid."})
            elif type_val == "REMOVE_TRAIN":
                if engine.trains:
                    rem = engine.trains.pop()
                    engine.ai_logs.append({"tick":engine.tick, "action":"EJECT", "reason":f"Train {rem.name} routed off grid."})
            elif type_val == "SET_ECO":
                engine.eco_mode = d.get("enabled", False)
                engine.ai_logs.append({"tick":engine.tick, "action":"MODE_CHANGE", "reason":f"ECO MODE {'ENABLED' if engine.eco_mode else 'DISABLED'}."})
            elif type_val == "SABOTAGE_TRACK":
                seg = d.get("segment", 0)
                if seg in engine.broken_tracks:
                    engine.broken_tracks.remove(seg)
                    engine.ai_logs.append({"tick":engine.tick, "action":"REPAIR", "reason":f"Track {seg} repair complete."})
                else:
                    engine.broken_tracks.append(seg)
                    engine.ai_logs.append({"tick":engine.tick, "action":"SABOTAGE", "reason":f"Track {seg} sabotaged by operator!"})
        except: pass
        try: await websocket.send_json(engine.step())
        except: break
        await asyncio.sleep(0.5)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8085))
    uvicorn.run(app, host="0.0.0.0", port=port)
