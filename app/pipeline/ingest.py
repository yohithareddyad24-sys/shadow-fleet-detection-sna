import asyncio
import json
import sys
import random
from datetime import datetime, timezone, timedelta
import websockets

from app import config
from app.db import SessionLocal, Position, Vessel, init_db
from app.pipeline.validate import is_valid_position

URL = "wss://stream.aisstream.io/v0/stream"
BATCH = 200


def parse(msg: dict):
    """Parses one AISStream WebSocket message."""
    mtype = msg.get("MessageType")
    meta = msg.get("MetaData", {})
    body = msg.get("Message", {}).get(mtype, {})
    mmsi = str(meta.get("MMSI", ""))
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if mtype == "PositionReport":
        lat = body.get("Latitude")
        lon = body.get("Longitude")
        sog = body.get("Sog")
        if is_valid_position(mmsi, lat, lon, sog):
            return "pos", {
                "mmsi": mmsi,
                "ts": now,
                "lat": lat,
                "lon": lon,
                "speed": sog,
                "name": (meta.get("ShipName") or "").strip(),
            }
    elif mtype == "ShipStaticData" and len(mmsi) == 9 and mmsi.isdigit():
        return "static", {
            "mmsi": mmsi,
            "ship_type": body.get("Type"),
            "imo": str(body.get("ImoNumber") or ""),
            "name": (body.get("Name") or "").strip(),
        }
    return None


def flush(positions, statics, names):
    """Flushes batches of position updates and static vessel metadata to SQLite safely."""
    if not positions and not statics:
        return

    with SessionLocal() as db:
        if positions:
            db.bulk_insert_mappings(
                Position,
                [{"mmsi": p["mmsi"], "ts": p["ts"], "lat": p["lat"], "lon": p["lon"], "speed": p["speed"]}
                 for p in positions]
            )

        # Collect unique MMSIs in this batch
        seen_positions = {p["mmsi"]: p["ts"] for p in positions}
        all_mmsis = set(seen_positions.keys()) | {s["mmsi"] for s in statics}

        # Query existing vessels once to prevent UNIQUE constraint errors
        existing_vessels = {
            v.mmsi: v for v in db.query(Vessel).filter(Vessel.mmsi.in_(all_mmsis)).all()
        }

        # Upsert vessels safely
        for mmsi in all_mmsis:
            v = existing_vessels.get(mmsi)
            if not v:
                v = Vessel(mmsi=mmsi, flag_mid=mmsi[:3])
                existing_vessels[mmsi] = v
                db.add(v)

            if mmsi in seen_positions:
                v.last_seen = seen_positions[mmsi]
            if mmsi in names and names[mmsi]:
                v.name = names[mmsi]

        for s in statics:
            v = existing_vessels.get(s["mmsi"])
            if v:
                if s.get("ship_type"):
                    v.ship_type = s["ship_type"]
                if s.get("imo"):
                    v.imo = s["imo"]
                if s.get("name"):
                    v.name = s["name"]

        db.commit()
    print(f"📥 [Ingest] Flushed {len(positions)} positions and {len(all_mmsis)} unique vessels to database.")


async def run_simulation():
    """Generates synthetic Singapore Strait traffic when no live API key is set."""
    print("🚢 [Simulation Mode] No AISStream API key found. Generating simulated Singapore Strait traffic...")
    vessels = [
        {"mmsi": "999000001", "name": "MOCK_NEPTUNE_FEEDER", "type": 80, "lat": 1.250, "lon": 103.850},
        {"mmsi": "999000002", "name": "MOCK_OCEAN_SHADOW", "type": 81, "lat": 1.253, "lon": 103.854},
        {"mmsi": "999000004", "name": "MOCK_AEGEAN_BRIDGE", "type": 80, "lat": 1.310, "lon": 103.950},
        {"mmsi": "999000003", "name": "MOCK_TITAN_CARRIER", "type": 70, "lat": 1.280, "lon": 103.820},
        {"mmsi": "999000005", "name": "MOCK_BALTIC_RUNNER", "type": 82, "lat": 1.220, "lon": 103.880},
    ]

    # Pre-populate 4 hours of historical trajectory points so rendezvous detection can find them
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    historical_positions = []
    for step in range(24, 0, -1):
        ts = now - timedelta(minutes=step * 10)
        for v in vessels:
            historical_positions.append({
                "mmsi": v["mmsi"],
                "ts": ts,
                "lat": v["lat"] + random.uniform(-0.002, 0.002),
                "lon": v["lon"] + random.uniform(-0.002, 0.002),
                "speed": random.uniform(0.5, 2.5) if v["mmsi"] in ["999000001", "999000002"] else random.uniform(8.0, 14.0),
                "name": v["name"]
            })
    statics = [{"mmsi": v["mmsi"], "ship_type": v["type"], "imo": f"900{v['mmsi'][-4:]}", "name": v["name"]} for v in vessels]
    names = {v["mmsi"]: v["name"] for v in vessels}
    flush(historical_positions, statics, names)
    print("✅ [Simulation Mode] Pre-populated historical positions for analysis engine.")


async def run_live(record_path=None):
    """Connects to live satellite AISStream WebSocket."""
    init_db()
    sub = {
        "APIKey": config.AISSTREAM_API_KEY,
        "BoundingBoxes": [config.BBOX],
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
    }
    positions, statics, names = [], [], {}
    rec = open(record_path, "a") if record_path else None

    while True:
        try:
            print(f"📡 Connecting to AISStream at {URL}...")
            async with websockets.connect(URL) as ws:
                await ws.send(json.dumps(sub))
                print("🟢 Connected to live stream! Receiving messages...")
                async for raw in ws:
                    if rec:
                        rec.write(raw if isinstance(raw, str) else raw.decode())
                        rec.write("\n")
                    parsed = parse(json.loads(raw))
                    if not parsed:
                        continue
                    kind, row = parsed
                    if kind == "pos":
                        positions.append(row)
                        names[row["mmsi"]] = row["name"]
                    else:
                        statics.append(row)

                    if len(positions) + len(statics) >= BATCH:
                        flush(positions, statics, names)
                        positions, statics, names = [], [], {}
        except Exception as e:
            print("⚠️ Stream error, retrying in 5 seconds:", e)
            await asyncio.sleep(5)


if __name__ == "__main__":
    init_db()
    if not config.AISSTREAM_API_KEY:
        asyncio.run(run_simulation())
    else:
        record_file = sys.argv[1] if len(sys.argv) > 1 else None
        asyncio.run(run_live(record_path=record_file))
