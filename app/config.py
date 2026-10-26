import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# AISStream API Key (free from https://aisstream.io)
AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///shadowfleet.db")

# Target Region: Singapore Strait (Lat 1.0 to 1.6, Lon 103.5 to 104.5)
_bbox_raw = os.getenv("BBOX", "1.0,103.5,1.6,104.5").split(",")
_lat1, _lon1, _lat2, _lon2 = (float(x) for x in _bbox_raw)
BBOX = [[_lat1, _lon1], [_lat2, _lon2]]

# Pipeline Thresholds
GAP_MINUTES = 60          # silence longer than this counts as a dark AIS gap
RENDEZVOUS_NM = 0.5       # max distance between two ships (nautical miles)
RENDEZVOUS_SPEED = 3.0    # both ships slower than 3.0 knots
RENDEZVOUS_MIN_MINUTES = 30
ANALYSIS_EVERY_SECONDS = 300
