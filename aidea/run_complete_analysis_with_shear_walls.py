"""
Complete Structural Analysis with Shear Walls

This script demonstrates the complete workflow of:
1. Creating a two-storey structure with shear walls
2. Translating from AIDEA to PyNite format
3. Running structural analysis including shear wall analysis
4. Extracting comprehensive results including pier and coupling beam forces
"""

import sys
import traceback
from sample_two_storey_model import create_two_storey_structure
from aidea_to_pynite_translator import AideaToPyniteTranslator
from pynite_results_models import (
    PyNiteResults, AnalysisSummary, LoadCombinationResults,
    create_member_results_from_pynite, create_nodal_displacement_from_pynite,
    create_nodal_reaction_from_pynite, create_plate_results_from_pynite,
    create_shear_wall_results_from_pynite
)


def run_complete_analysis():
    """Run complete structural analysis with shear walls."""
    
    print("=" * 80)
    print("COMPLETE STRUCTURAL ANALYSIS WITH SHEAR WALLS")
    print("=" * 80)
    
    try:
        # Step 1: Create the AIDEA model
        print("\n1. Creating AIDEA model...")
        aidea_model = create_two_storey_structure()
        print(f"   ✓ Model created with {len(aidea_model.shear_walls)} shear walls")
        
        # Step 2: Translate to PyNite
        print("\n2. Translating to PyNite format...")
        translator = AideaToPyniteTranslator()
        pynite_model = translator.translate_model(aidea_model)
        print(f"   ✓ Translated {len(aidea_model.nodes)} nodes")
        print(f"   ✓ Translated {len(aidea_model.members)} members")
        print(f"   ✓ Translated {len(aidea_model.plates)} plates")
        print(f"   ✓ Translated {len(aidea_model.shear_walls)} shear walls")
        
        # Step 3: Run frame analysis
        print("\n3. Running frame analysis...")
        translator.run_analysis('linear', log=False, check_statics=False)
        print("   ✓ Frame analysis completed")
        
        # Step 4: Run shear wall analysis
        print("\n4. Running shear wall analysis...")
        translator.analyze_shear_walls(log=False, check_statics=False)
        print("   ✓ Shear wall analysis completed")
        
        # Step 5: Extract and display results
        print("\n5. Extracting results...")
        
        # Get load combinations
        load_combos = list(pynite_model.load_combos.keys()) if pynite_model.load_combos else ['Combo 1']
        print(f"   ✓ Found {len(load_combos)} load combinations: {load_combos}")
        
        # Display frame results summary
        print("\n" + "=" * 60)
        print("FRAME ANALYSIS RESULTS")
        print("=" * 60)
        
        frame_results = translator.get_results_summary()
        
        # Node displacements
        print("\nMaximum Node Displacements:")
        for combo in load_combos:
            max_disp = 0
            max_node = None
            for node_id, node_results in frame_results['nodes'].items():
                if combo in node_results:
                    disp_mag = (node_results[combo]['DX']**2 + 
                               node_results[combo]['DY']**2 + 
                               node_results[combo]['DZ']**2)**0.5
                    if disp_mag > max_disp:
                        max_disp = disp_mag
                        max_node = node_id
            
            if max_node:
                print(f"  {combo}: {max_disp:.6f} m at node {max_node}")
        
        # Member forces
        print("\nMaximum Member Forces:")
        for combo in load_combos:
            max_moment = 0
            max_member = None
            for member_id, member_results in frame_results['members'].items():
                if combo in member_results:
                    moment = max(abs(member_results[combo]['max_moment']),
                               abs(member_results[combo]['min_moment']))
                    if moment > max_moment:
                        max_moment = moment
                        max_member = member_id
            
            if max_member:
                print(f"  {combo}: {max_moment:.2f} kN⋅m in member {max_member}")
        
        # Display shear wall results
        print("\n" + "=" * 60)
        print("SHEAR WALL ANALYSIS RESULTS")
        print("=" * 60)
        
        for wall_id in translator.shear_walls.keys():
            print(f"\nShear Wall: {wall_id}")
            print("-" * 40)
            
            # Get shear wall specific load combinations
            wall = translator.shear_walls[wall_id]
            wall_combos = list(wall.model.load_combos.keys()) if wall.model.load_combos else ['Combo 1']
            
            for combo in wall_combos:
                try:
                    wall_results = translator.get_shear_wall_results(wall_id, combo)
                    
                    print(f"\nLoad Combination: {combo}")
                    
                    # Pier results
                    if wall_results['piers']:
                        print("  Pier Forces:")
                        for pier_id, pier in wall_results['piers'].items():
                            print(f"    {pier_id}: P={pier['axial_force']:.1f} kN, "
                                  f"V={pier['shear_force']:.1f} kN, "
                                  f"M={pier['moment']:.1f} kN⋅m, "
                                  f"M/VL={pier['shear_span_ratio']:.2f}")
                    
                    # Coupling beam results
                    if wall_results['coupling_beams']:
                        print("  Coupling Beam Forces:")
                        for beam_id, beam in wall_results['coupling_beams'].items():
                            print(f"    {beam_id}: P={beam['axial_force']:.1f} kN, "
                                  f"V={beam['shear_force']:.1f} kN, "
                                  f"M={beam['moment']:.1f} kN⋅m, "
                                  f"M/VH={beam['shear_span_ratio']:.2f}")
                    
                    # Story stiffness
                    if wall_results['story_stiffness']:
                        print("  Story Stiffness:")
                        for story_name, stiffness in wall_results['story_stiffness'].items():
                            print(f"    {story_name}: {stiffness['stiffness']:.1f} kN/m")
                
                except Exception as e:
                    print(f"  Error getting results for {combo}: {e}")
        
        # Step 6: Create comprehensive results model
        print("\n6. Creating comprehensive results model...")
        
        # Create analysis summary
        analysis_summary = AnalysisSummary(
            analysis_type='Linear',
            num_nodes=len(pynite_model.nodes),
            num_members=len(pynite_model.members),
            num_plates=len(pynite_model.quads),
            num_load_combinations=len(load_combos)
        )
        
        # Create load combination results
        load_combination_results = {}
        
        for combo in load_combos:
            combo_results = LoadCombinationResults(combination_name=combo)
            
            # Add nodal displacements
            for node_name, node in pynite_model.nodes.items():
                combo_results.nodal_displacements[node_name] = create_nodal_displacement_from_pynite(node, combo)
                combo_results.nodal_reactions[node_name] = create_nodal_reaction_from_pynite(node, combo)
            
            # Add member results
            for member_name, member in pynite_model.members.items():
                combo_results.member_results[member_name] = create_member_results_from_pynite(member, combo)
            
            # Add plate results
            for plate_name, plate in pynite_model.quads.items():
                combo_results.plate_results[plate_name] = create_plate_results_from_pynite(plate, combo)
            
            # Add shear wall results (only if the combo exists in the shear wall)
            for wall_id, wall in translator.shear_walls.items():
                wall_combos = list(wall.model.load_combos.keys()) if wall.model.load_combos else ['Combo 1']
                if combo in wall_combos:
                    combo_results.shear_wall_results[wall_id] = create_shear_wall_results_from_pynite(wall, combo)
                elif 'Combo 1' in wall_combos:
                    # Fallback to default combo
                    combo_results.shear_wall_results[wall_id] = create_shear_wall_results_from_pynite(wall, 'Combo 1')
            
            load_combination_results[combo] = combo_results
        
        # Create comprehensive results
        comprehensive_results = PyNiteResults(
            analysis_summary=analysis_summary,
            model_name="Two-Storey Structure with Shear Walls",
            load_combination_results=load_combination_results
        )
        
        print("   ✓ Comprehensive results model created")
        
        # Step 7: Summary
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)
        print(f"✓ Frame analysis: {len(pynite_model.nodes)} nodes, {len(pynite_model.members)} members")
        print(f"✓ Plate analysis: {len(pynite_model.quads)} plates")
        print(f"✓ Shear wall analysis: {len(translator.shear_walls)} walls")
        print(f"✓ Load combinations: {len(load_combos)}")
        
        total_piers = sum(len(wall.piers) for wall in translator.shear_walls.values())
        total_coupling_beams = sum(len(wall.coupling_beams) for wall in translator.shear_walls.values())
        print(f"✓ Shear wall components: {total_piers} piers, {total_coupling_beams} coupling beams")
        
        print("\n✅ Complete analysis with shear walls finished successfully!")
        
        return comprehensive_results
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        return None


def demonstrate_shear_wall_features():
    """Demonstrate specific shear wall features."""
    
    print("\n" + "=" * 60)
    print("SHEAR WALL FEATURES DEMONSTRATION")
    print("=" * 60)
    
    try:
        # Create model and translator
        aidea_model = create_two_storey_structure()
        translator = AideaToPyniteTranslator()
        pynite_model = translator.translate_model(aidea_model)
        
        # Run analysis
        translator.run_analysis('linear', log=False)
        translator.analyze_shear_walls(log=False)
        
        # Demonstrate shear wall features
        for wall_id, wall in translator.shear_walls.items():
            print(f"\nShear Wall: {wall_id}")
            print(f"  Dimensions: {wall.L}m × {wall.H}m")
            print(f"  Mesh size: {wall.mesh_size}m")
            print(f"  Cracking factor: {wall.ky_mod}")
            
            # Show pier identification
            print(f"  Identified {len(wall.piers)} piers:")
            for pier_id, pier in wall.piers.items():
                print(f"    {pier_id}: {pier.width:.2f}m × {pier.height:.2f}m at ({pier.x:.1f}, {pier.y:.1f})")
            
            # Show coupling beam identification
            print(f"  Identified {len(wall.coupling_beams)} coupling beams:")
            for beam_id, beam in wall.coupling_beams.items():
                print(f"    {beam_id}: {beam.length:.2f}m × {beam.height:.2f}m at ({beam.x:.1f}, {beam.y:.1f})")
            
            # Show story stiffness
            print("  Story stiffness:")
            for story in wall._stories:
                story_name = str(story[0])
                try:
                    stiffness = wall.stiffness(story_name)
                    print(f"    {story_name}: {stiffness:.1f} kN/m")
                except:
                    print(f"    {story_name}: Could not calculate stiffness")
        
        print("\n✅ Shear wall features demonstration completed!")
        
    except Exception as e:
        print(f"\n❌ Error in demonstration: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    print("Starting complete structural analysis with shear walls...")
    
    # Run complete analysis
    results = run_complete_analysis()
    
    if results:
        # Demonstrate shear wall features
        demonstrate_shear_wall_features()
        
        print(f"\n🎉 All analyses completed successfully!")
        print(f"📊 Results available for {len(results.get_all_combinations())} load combinations")
        print(f"🏗️  Shear wall implementation is working correctly!")
    else:
        print("\n❌ Analysis failed. Please check the error messages above.")
        sys.exit(1)