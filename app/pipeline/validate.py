def is_valid_position(mmsi: str, lat, lon, speed) -> bool:
    """
    Validates AIS position reports:
    - MMSI must be a 9-digit string
    - Latitude must be between -90 and 90
    - Longitude must be between -180 and 180
    - Filter out AIS standard 'not available' sentinel values (91, 181)
    - Vessel speed must be realistic (0 to 50 knots, excluding 102.3 not available)
    """
    if not (isinstance(mmsi, str) and len(mmsi) == 9 and mmsi.isdigit()):
        return False
    if lat is None or lon is None:
        return False
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return False
    if lat == 91 or lon == 181:            # AIS standard "not available" values
        return False
    if speed is not None and not (0 <= speed <= 50):   # 102.3 = not available
        return False
    return True
