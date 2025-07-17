"""
Debug script to check if loads are being applied correctly
"""

from sample_two_storey_model import create_two_storey_structure
from aidea_to_pynite_translator import AideaToPyniteTranslator

def debug_loads():
    print("=== LOAD DEBUGGING ===")
    
    # Create AIDEA model
    aidea_model = create_two_storey_structure()
    print(f"AIDEA model created with:")
    print(f"  Point loads: {len(aidea_model.point_loads)}")
    print(f"  Distributed loads: {len(aidea_model.distributed_loads)}")
    print(f"  Self weight: {len(aidea_model.self_weight)}")
    
    # Show some sample loads
    print("\nSample point loads:")
    for i, (load_id, load) in enumerate(list(aidea_model.point_loads.items())[:3]):
        print(f"  {load_id}: Node {load.node}, Group {load.load_group}, Z={load.z_mag}")
    
    print("\nSample distributed loads:")
    for i, (load_id, load) in enumerate(list(aidea_model.distributed_loads.items())[:3]):
        print(f"  {load_id}: Member {load.member}, Group {load.load_group}, Z_A={load.z_mag_A}")
    
    # Translate to PyNite
    translator = AideaToPyniteTranslator()
    pynite_model = translator.translate_model(aidea_model)
    
    print(f"\nPyNite model created with:")
    print(f"  Load combinations: {list(pynite_model.load_combos.keys())}")
    print(f"  Load cases: {pynite_model.load_cases}")
    
    # Check if loads were applied to nodes
    total_nodal_loads = 0
    for node_name, node in pynite_model.nodes.items():
        if hasattr(node, 'NodeLoads') and node.NodeLoads:
            print(f"  Node {node_name} has {len(node.NodeLoads)} loads")
            for load in node.NodeLoads:
                print(f"    {load}")
            total_nodal_loads += len(node.NodeLoads)
    
    print(f"Total nodal loads applied: {total_nodal_loads}")
    
    # Check if loads were applied to members
    total_member_loads = 0
    for member_name, member in pynite_model.members.items():
        pt_loads = len(member.PtLoads) if hasattr(member, 'PtLoads') else 0
        dist_loads = len(member.DistLoads) if hasattr(member, 'DistLoads') else 0
        if pt_loads > 0 or dist_loads > 0:
            print(f"  Member {member_name}: {pt_loads} point loads, {dist_loads} distributed loads")
            if hasattr(member, 'DistLoads') and member.DistLoads:
                for load in member.DistLoads:
                    print(f"    {load}")
        total_member_loads += pt_loads + dist_loads
    
    print(f"Total member loads applied: {total_member_loads}")
    
    # Check load combinations
    print(f"\nLoad combinations:")
    for combo_name, combo in pynite_model.load_combos.items():
        print(f"  {combo_name}: {combo.factors}")

if __name__ == "__main__":
    debug_loads()