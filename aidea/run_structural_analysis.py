"""
Complete Structural Analysis Example

This script demonstrates the complete workflow:
1. Create AIDEA model for two-storey structure
2. Translate to PyNite format
3. Run structural analysis
4. Display results
"""

import numpy as np
from .sample_two_storey_model import create_two_storey_structure
from .aidea_to_pynite_translator import AideaToPyniteTranslator


def print_section_header(title: str):
    """Print a formatted section header."""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)


def print_model_summary(aidea_model):
    """Print summary of the AIDEA model."""
    print_section_header("AIDEA MODEL SUMMARY")
    print(f"Structure: Two-storey rectangular building")
    print(f"Dimensions: 6m x 4m x 6m (height)")
    print(f"Nodes: {len(aidea_model.nodes)}")
    print(f"Members: {len(aidea_model.members)}")
    print(f"Materials: {len(aidea_model.materials)}")
    print(f"Sections: {len(aidea_model.sections)}")
    print(f"Supports: {len(aidea_model.supports)}")
    print(f"Point loads: {len(aidea_model.point_loads)}")
    print(f"Distributed loads: {len(aidea_model.distributed_loads)}")
    print(f"Load combinations: {len(aidea_model.load_combinations)}")
    
    print("\nMaterials:")
    for mat_id, material in aidea_model.materials.items():
        print(f"  {mat_id}: {material.name} (E={material.elasticity_modulus} MPa)")
    
    print("\nSections:")
    for sec_id, section in aidea_model.sections.items():
        print(f"  {sec_id}: {section.name} (A={section.area:.6f} m²)")
    
    print("\nLoad Cases:")
    load_groups = set()
    for load in aidea_model.point_loads.values():
        load_groups.add(load.load_group)
    for load in aidea_model.distributed_loads.values():
        load_groups.add(load.load_group)
    for sw in aidea_model.self_weight.values():
        load_groups.add(sw.load_group)
    
    for group in sorted(load_groups):
        print(f"  - {group}")


def print_pynite_summary(pynite_model):
    """Print summary of the translated PyNite model."""
    print_section_header("PYNITE MODEL SUMMARY")
    print(f"Nodes: {len(pynite_model.nodes)}")
    print(f"Members: {len(pynite_model.members)}")
    print(f"Materials: {len(pynite_model.materials)}")
    print(f"Sections: {len(pynite_model.sections)}")
    print(f"Load combinations: {len(pynite_model.load_combos)}")
    
    print("\nNode coordinates:")
    for node_name, node in list(pynite_model.nodes.items())[:8]:  # Show first 8 nodes
        print(f"  {node_name}: ({node.X:.1f}, {node.Y:.1f}, {node.Z:.1f})")
    if len(pynite_model.nodes) > 8:
        print(f"  ... and {len(pynite_model.nodes) - 8} more nodes")
    
    print("\nSupported nodes:")
    for node_name, node in pynite_model.nodes.items():
        if any([node.support_DX, node.support_DY, node.support_DZ, 
               node.support_RX, node.support_RY, node.support_RZ]):
            supports = []
            if node.support_DX: supports.append('DX')
            if node.support_DY: supports.append('DY')
            if node.support_DZ: supports.append('DZ')
            if node.support_RX: supports.append('RX')
            if node.support_RY: supports.append('RY')
            if node.support_RZ: supports.append('RZ')
            print(f"  {node_name}: {', '.join(supports)}")


def print_analysis_results(results):
    """Print analysis results summary."""
    print_section_header("ANALYSIS RESULTS")
    
    # Get the first load combination for display
    load_combos = list(results['nodes'].keys())
    if not load_combos:
        print("No results available.")
        return
    
    first_combo = None
    for node_data in results['nodes'].values():
        if node_data:
            first_combo = list(node_data.keys())[0]
            break
    
    if not first_combo:
        print("No load combination results found.")
        return
    
    print(f"Results for load combination: {first_combo}")
    
    # Node displacements
    print("\nMaximum Node Displacements:")
    max_dx = max_dy = max_dz = 0
    max_dx_node = max_dy_node = max_dz_node = ""
    
    for node_name, node_data in results['nodes'].items():
        if first_combo in node_data:
            disp = node_data[first_combo]
            if abs(disp['DX']) > abs(max_dx):
                max_dx = disp['DX']
                max_dx_node = node_name
            if abs(disp['DY']) > abs(max_dy):
                max_dy = disp['DY']
                max_dy_node = node_name
            if abs(disp['DZ']) > abs(max_dz):
                max_dz = disp['DZ']
                max_dz_node = node_name
    
    print(f"  Max DX: {max_dx:.6f} m at node {max_dx_node}")
    print(f"  Max DY: {max_dy:.6f} m at node {max_dy_node}")
    print(f"  Max DZ: {max_dz:.6f} m at node {max_dz_node}")
    
    # Member forces
    print("\nMember Forces Summary:")
    for member_name, member_data in list(results['members'].items())[:5]:  # Show first 5 members
        if first_combo in member_data:
            forces = member_data[first_combo]
            print(f"  {member_name}:")
            print(f"    Max Moment: {forces['max_moment']:.2f} kN⋅m")
            print(f"    Max Shear:  {forces['max_shear']:.2f} kN")
            print(f"    Max Axial:  {forces['max_axial']:.2f} kN")
    
    if len(results['members']) > 5:
        print(f"  ... and {len(results['members']) - 5} more members")
    
    # Reactions
    print("\nSupport Reactions:")
    total_fx = total_fy = total_fz = 0
    for node_name, reaction_data in results['reactions'].items():
        if first_combo in reaction_data:
            rxn = reaction_data[first_combo]
            print(f"  {node_name}: FX={rxn['RxnFX']:.2f}, FY={rxn['RxnFY']:.2f}, FZ={rxn['RxnFZ']:.2f} kN")
            total_fx += rxn['RxnFX']
            total_fy += rxn['RxnFY']
            total_fz += rxn['RxnFZ']
    
    print(f"\nTotal Reactions: FX={total_fx:.2f}, FY={total_fy:.2f}, FZ={total_fz:.2f} kN")


def run_complete_analysis():
    """Run the complete structural analysis workflow."""
    try:
        # Step 1: Create AIDEA model
        print_section_header("STEP 1: CREATING AIDEA MODEL")
        print("Creating two-storey rectangular structure...")
        aidea_model = create_two_storey_structure()
        print("✓ AIDEA model created successfully!")
        
        # Display model summary
        print_model_summary(aidea_model)
        
        # Step 2: Translate to PyNite
        print_section_header("STEP 2: TRANSLATING TO PYNITE")
        print("Initializing translator...")
        translator = AideaToPyniteTranslator()
        
        print("Translating AIDEA model to PyNite format...")
        pynite_model = translator.translate_model(aidea_model)
        print("✓ Translation completed successfully!")
        
        # Display PyNite model summary
        print_pynite_summary(pynite_model)
        
        # Step 3: Run analysis
        print_section_header("STEP 3: RUNNING STRUCTURAL ANALYSIS")
        print("Running linear static analysis...")
        translator.run_analysis(
            analysis_type='linear',
            log=True,
            check_stability=True,
            check_statics=True
        )
        print("✓ Analysis completed successfully!")
        
        # Step 4: Get and display results
        print_section_header("STEP 4: EXTRACTING RESULTS")
        print("Extracting analysis results...")
        results = translator.get_results_summary()
        print("✓ Results extracted successfully!")
        
        # Display results
        print_analysis_results(results)
        
        # Step 5: Additional analysis information
        print_section_header("ADDITIONAL INFORMATION")
        print(f"Analysis type: {pynite_model.solution}")
        print(f"Load cases analyzed: {pynite_model.load_cases}")
        
        # Check for any warnings or issues
        print("\nModel validation:")
        orphaned = pynite_model.orphaned_nodes()
        if orphaned:
            print(f"⚠ Warning: Found {len(orphaned)} orphaned nodes: {orphaned}")
        else:
            print("✓ No orphaned nodes found")
        
        print("\n" + "="*60)
        print(" ANALYSIS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return pynite_model, results
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def demonstrate_advanced_features(pynite_model):
    """Demonstrate additional PyNite features."""
    if pynite_model is None:
        return
    
    print_section_header("ADVANCED FEATURES DEMONSTRATION")
    
    try:
        # Try to create visualizations (if matplotlib is available)
        print("Attempting to create visualizations...")
        
        # Get a sample member for plotting
        member_names = list(pynite_model.members.keys())
        if member_names:
            sample_member = member_names[0]
            combo_names = list(pynite_model.load_combos.keys())
            if combo_names:
                sample_combo = combo_names[0]
                
                print(f"Sample member: {sample_member}")
                print(f"Sample load combination: {sample_combo}")
                
                # Try to get member results
                member = pynite_model.members[sample_member]
                try:
                    max_moment = member.max_moment('Mz', sample_combo)
                    max_shear = member.max_shear('Fy', sample_combo)
                    print(f"  Max moment: {max_moment:.2f} kN⋅m")
                    print(f"  Max shear: {max_shear:.2f} kN")
                except:
                    print("  Could not extract detailed member results")
        
        print("✓ Advanced features demonstration completed")
        
    except Exception as e:
        print(f"⚠ Some advanced features not available: {str(e)}")


if __name__ == "__main__":
    print("AIDEA to PyNite Structural Analysis System")
    print("==========================================")
    
    # Run the complete analysis
    pynite_model, results = run_complete_analysis()
    
    # Demonstrate advanced features
    if pynite_model:
        demonstrate_advanced_features(pynite_model)
    
    print("\nAnalysis workflow completed!")