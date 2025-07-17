"""
Test script to debug LoadCombination issues
"""

from aidea_model import LoadCombination

def test_load_combo():
    print("=== LOAD COMBINATION TEST ===")
    
    # Test creating a LoadCombination with extra fields
    combo = LoadCombination(
        name='1.35G + 1.5Q',
        criteria='ULS',
        Dead=1.35,
        Live=1.5
    )
    
    print(f"Created combo: {combo}")
    print(f"Name: {combo.name}")
    print(f"Criteria: {combo.criteria}")
    print(f"Dict: {combo.__dict__}")
    print(f"Model dump: {combo.model_dump()}")
    
    # Try to access the extra fields
    try:
        print(f"Dead factor: {combo.Dead}")
        print(f"Live factor: {combo.Live}")
    except AttributeError as e:
        print(f"AttributeError: {e}")
    
    # Check if they're in __dict__
    for attr_name, attr_value in combo.__dict__.items():
        if attr_name not in ['name', 'criteria']:
            print(f"Extra field: {attr_name} = {attr_value}")

if __name__ == "__main__":
    test_load_combo()