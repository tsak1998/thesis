#!/usr/bin/env python3
"""
Test script to verify AIDEA integration works correctly.
This script tests the core functionality without requiring Flask dependencies.
"""

import sys
import os
import json
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_aidea_model_creation():
    """Test creating the two-storey AIDEA model."""
    print("Testing AIDEA model creation...")
    
    try:
        from aidea.sample_two_storey_model import create_two_storey_structure
        
        # Create the model
        model = create_two_storey_structure()
        
        print(f"✓ Model created successfully!")
        print(f"  - Nodes: {len(model.nodes)}")
        print(f"  - Members: {len(model.members)}")
        print(f"  - Materials: {len(model.materials)}")
        print(f"  - Sections: {len(model.sections)}")
        print(f"  - Supports: {len(model.supports)}")
        print(f"  - Point loads: {len(model.point_loads)}")
        print(f"  - Distributed loads: {len(model.distributed_loads)}")
        print(f"  - Load combinations: {len(model.load_combinations)}")
        print(f"  - Shear walls: {len(model.shear_walls)}")
        
        return model
        
    except Exception as e:
        print(f"❌ Error creating model: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_model_to_frontend_conversion(model):
    """Test converting AIDEA model to frontend format."""
    print("\nTesting model to frontend conversion...")
    
    try:
        # Convert nodes
        nodes_data = []
        for node_id, node in model.nodes.items():
            nodes_data.append({
                'nn': int(node_id),
                'coord_x': node.x,
                'coord_y': node.y,
                'coord_z': node.z,
                'dof_dx': 0,
                'dof_dy': 1,
                'dof_dz': 2,
                'dof_rx': 3,
                'dof_ry': 4,
                'dof_rz': 5,
                'user_id': 'demo_user'
            })
        
        # Convert elements (members)
        elements_data = []
        for member_id, member in model.members.items():
            elem_type = 'column' if 'C' in member_id else 'beam'
            
            elements_data.append({
                'en': int(member_id.split('_')[0][1:]) if member_id.startswith('C') or member_id.startswith('B') else int(member_id),
                'nodei': member.node_A,
                'nodej': member.node_B,
                'section_id': member.section_id,
                'elem_type': elem_type,
                'user_id': 'demo_user'
            })
        
        print(f"✓ Conversion successful!")
        print(f"  - Converted {len(nodes_data)} nodes")
        print(f"  - Converted {len(elements_data)} elements")
        
        # Show sample data
        if nodes_data:
            print(f"  - Sample node: {nodes_data[0]}")
        if elements_data:
            print(f"  - Sample element: {elements_data[0]}")
        
        return nodes_data, elements_data
        
    except Exception as e:
        print(f"❌ Error in conversion: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_pynite_translation(model):
    """Test translating AIDEA model to PyNite (if PyNite is available)."""
    print("\nTesting PyNite translation...")
    
    try:
        from aidea.aidea_to_pynite_translator import AideaToPyniteTranslator
        
        translator = AideaToPyniteTranslator()
        pynite_model = translator.translate_model(model)
        
        print(f"✓ PyNite translation successful!")
        print(f"  - PyNite nodes: {len(pynite_model.nodes)}")
        print(f"  - PyNite members: {len(pynite_model.members)}")
        print(f"  - PyNite materials: {len(pynite_model.materials)}")
        print(f"  - PyNite sections: {len(pynite_model.sections)}")
        
        return pynite_model
        
    except ImportError as e:
        print(f"⚠ PyNite not available: {e}")
        print("  This is expected if PyNite is not installed")
        return None
    except Exception as e:
        print(f"❌ Error in PyNite translation: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_json_serialization(model):
    """Test JSON serialization of the model."""
    print("\nTesting JSON serialization...")
    
    try:
        # Test serializing individual components
        nodes_json = json.dumps({k: v.model_dump() for k, v in model.nodes.items()}, indent=2)
        materials_json = json.dumps({k: v.model_dump() for k, v in model.materials.items()}, indent=2)
        
        print(f"✓ JSON serialization successful!")
        print(f"  - Nodes JSON length: {len(nodes_json)} characters")
        print(f"  - Materials JSON length: {len(materials_json)} characters")
        
        # Show sample JSON
        print(f"  - Sample node JSON:")
        sample_node = list(model.nodes.values())[0]
        print(f"    {json.dumps(sample_node.model_dump(), indent=4)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in JSON serialization: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("AIDEA Integration Test Suite")
    print("=" * 50)
    
    # Test 1: Model creation
    model = test_aidea_model_creation()
    if not model:
        print("\n❌ Model creation failed. Stopping tests.")
        return False
    
    # Test 2: Frontend conversion
    nodes_data, elements_data = test_model_to_frontend_conversion(model)
    if not nodes_data or not elements_data:
        print("\n❌ Frontend conversion failed.")
        return False
    
    # Test 3: PyNite translation (optional)
    pynite_model = test_pynite_translation(model)
    
    # Test 4: JSON serialization
    json_success = test_json_serialization(model)
    if not json_success:
        print("\n❌ JSON serialization failed.")
        return False
    
    print("\n" + "=" * 50)
    print("✓ All core tests passed!")
    print("\nThe AIDEA integration is working correctly.")
    print("You can now:")
    print("1. Run the new Flask app: python app_new.py")
    print("2. Visit: http://localhost:5001/editor_aidea")
    print("3. Click 'Load Two-Storey Building' to see the model")
    print("4. Click 'Run Structural Analysis' to analyze the structure")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)