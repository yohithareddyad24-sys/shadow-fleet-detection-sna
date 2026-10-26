from app.pipeline.validate import is_valid_position

def test_good():
    assert is_valid_position("123456789", 1.2, 103.9, 5.0)

def test_bad_mmsi():
    assert not is_valid_position("12345", 1.2, 103.9, 5.0)

def test_not_available_values():
    assert not is_valid_position("123456789", 91, 181, 5.0)

def test_impossible_speed():
    assert not is_valid_position("123456789", 1.2, 103.9, 102.3)
