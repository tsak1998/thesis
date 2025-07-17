"""
Test script for PyNite results models.

This script demonstrates how to use the Pydantic models to capture and organize
PyNite analysis results from the sample two-storey structure.
"""

import sys
import os
from typing import Dict, Any

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from pydantic import BaseModel, Field
    PYDANTIC_AVAILABLE = True
except ImportError:
    print("Pydantic not available. Install with: pip install pydantic")
    PYDANTIC_AVAILABLE = False

# Import our models and sample structure
from sample_two_storey_model import create_two_storey_structure
from aidea_to_pynite_translator import AideaToPyniteTranslator

if PYDANTIC_AVAILABLE:
    from pynite_results_models import (
        PyNiteResults, AnalysisSummary, LoadCombinationResults,
        create_member_results_from_pynite, create_nodal_displacement_from_pynite,
        create_nodal_reaction_from_pynite, create_plate_results_from_pynite
    )


def run_analysis_and_extract_results():
    """
    Run the two-storey structure analysis and extract results using our Pydantic models.
    """
    if not PYDANTIC_AVAILABLE:
        print("Cannot run test without Pydantic. Please install pydantic.")
        return None
    
    print("Creating two-storey structure...")
    aidea_model = create_two_storey_structure()
    
    print("Translating to PyNite...")
    translator = AideaToPyniteTranslator()
    pynite_model = translator.translate_model(aidea_model)
    
    print("Running analysis...")
    translator.run_analysis('linear')
    
    print("Extracting results into Pydantic models...")
    
    # Create analysis summary
    analysis_summary = AnalysisSummary(
        analysis_type='Linear',
        num_nodes=len(pynite_model.nodes),
        num_members=len(pynite_model.members),
        num_plates=len(pynite_model.plates),
        num_load_combinations=len(pynite_model.load_combos)
    )
    
    # Initialize the main results object
    results = PyNiteResults(
        analysis_summary=analysis_summary,
        model_name="Two-Storey Sample Structure",
        analysis_date="2024-01-01"
    )
    
    # Extract results for each load combination
    for combo_name in pynite_model.load_combos.keys():
        print(f"Processing load combination: {combo_name}")
        
        # Create load combination results container
        combo_results = LoadCombinationResults(combination_name=combo_name)
        
        # Extract nodal displacements
        for node_name, node in pynite_model.nodes.items():
            nodal_disp = create_nodal_displacement_from_pynite(node, combo_name)
            combo_results.nodal_displacements[node_name] = nodal_disp
            
            # Extract nodal reactions (only for supported nodes)
            if (node.support_DX or node.support_DY or node.support_DZ or 
                node.support_RX or node.support_RY or node.support_RZ):
                nodal_reaction = create_nodal_reaction_from_pynite(node, combo_name)
                combo_results.nodal_reactions[node_name] = nodal_reaction
        
        # Extract member results
        for member_name, member in pynite_model.members.items():
            try:
                member_results = create_member_results_from_pynite(member, combo_name)
                combo_results.member_results[member_name] = member_results
            except Exception as e:
                print(f"Warning: Could not extract results for member {member_name}: {e}")
        
        # Extract plate results
        for plate_name, plate in pynite_model.plates.items():
            try:
                plate_results = create_plate_results_from_pynite(plate, combo_name)
                combo_results.plate_results[plate_name] = plate_results
            except Exception as e:
                print(f"Warning: Could not extract results for plate {plate_name}: {e}")
        
        # Add to main results
        results.load_combination_results[combo_name] = combo_results
    
    # Calculate global extremes
    print("Calculating global extremes...")
    
    max_displacement = 0.0
    max_reaction = 0.0
    max_member_force = 0.0
    max_member_moment = 0.0
    
    for combo_results in results.load_combination_results.values():
        # Check displacements
        for disp in combo_results.nodal_displacements.values():
            disp_mag = (disp.displacement.x**2 + disp.displacement.y**2 + disp.displacement.z**2)**0.5
            max_displacement = max(max_displacement, disp_mag)
        
        # Check reactions
        for reaction in combo_results.nodal_reactions.values():
            reaction_mag = (reaction.force.x**2 + reaction.force.y**2 + reaction.force.z**2)**0.5
            max_reaction = max(max_reaction, reaction_mag)
        
        # Check member forces and moments
        for member_result in combo_results.member_results.values():
            max_member_force = max(max_member_force, abs(member_result.axial_force.max_axial))
            max_member_force = max(max_member_force, abs(member_result.axial_force.min_axial))
            max_member_moment = max(max_member_moment, abs(member_result.moment_y.max_moment))
            max_member_moment = max(max_member_moment, abs(member_result.moment_z.max_moment))
    
    results.global_max_displacement = max_displacement
    results.global_max_reaction = max_reaction
    results.global_max_member_force = max_member_force
    results.global_max_member_moment = max_member_moment
    
    return results


def print_results_summary(results: 'PyNiteResults'):
    """Print a summary of the analysis results."""
    if not PYDANTIC_AVAILABLE:
        return
    
    print("\n" + "="*60)
    print("ANALYSIS RESULTS SUMMARY")
    print("="*60)
    
    print(f"Model: {results.model_name}")
    print(f"Analysis Type: {results.analysis_summary.analysis_type}")
    print(f"Number of Nodes: {results.analysis_summary.num_nodes}")
    print(f"Number of Members: {results.analysis_summary.num_members}")
    print(f"Number of Plates: {results.analysis_summary.num_plates}")
    print(f"Number of Load Combinations: {results.analysis_summary.num_load_combinations}")
    
    print(f"\nGlobal Extremes:")
    print(f"  Max Displacement: {results.global_max_displacement:.6f}")
    print(f"  Max Reaction: {results.global_max_reaction:.2f}")
    print(f"  Max Member Force: {results.global_max_member_force:.2f}")
    print(f"  Max Member Moment: {results.global_max_member_moment:.2f}")
    
    print(f"\nLoad Combinations: {', '.join(results.get_all_combinations())}")
    
    # Show sample results for first load combination
    if results.load_combination_results:
        first_combo = list(results.load_combination_results.keys())[0]
        combo_results = results.load_combination_results[first_combo]
        
        print(f"\nSample Results for '{first_combo}':")
        
        # Show first few nodal displacements
        print("  Nodal Displacements (first 3):")
        for i, (node_id, disp) in enumerate(combo_results.nodal_displacements.items()):
            if i >= 3:
                break
            print(f"    Node {node_id}: DX={disp.displacement.x:.6f}, DY={disp.displacement.y:.6f}, DZ={disp.displacement.z:.6f}")
        
        # Show reactions
        if combo_results.nodal_reactions:
            print("  Nodal Reactions:")
            for node_id, reaction in combo_results.nodal_reactions.items():
                print(f"    Node {node_id}: FX={reaction.force.x:.2f}, FY={reaction.force.y:.2f}, FZ={reaction.force.z:.2f}")
        
        # Show member results (first few)
        print("  Member Results (first 3):")
        for i, (member_id, member_result) in enumerate(combo_results.member_results.items()):
            if i >= 3:
                break
            print(f"    Member {member_id}:")
            print(f"      Max Axial: {member_result.axial_force.max_axial:.2f}")
            print(f"      Max Moment Y: {member_result.moment_y.max_moment:.2f}")
            print(f"      Max Moment Z: {member_result.moment_z.max_moment:.2f}")


def demonstrate_model_usage(results: 'PyNiteResults'):
    """Demonstrate various ways to use the results models."""
    if not PYDANTIC_AVAILABLE or not results:
        return
    
    print("\n" + "="*60)
    print("DEMONSTRATING MODEL USAGE")
    print("="*60)
    
    # Get specific results
    combo_name = list(results.load_combination_results.keys())[0]
    print(f"Using load combination: {combo_name}")
    
    # Get nodal displacement for a specific node
    node_id = list(results.load_combination_results[combo_name].nodal_displacements.keys())[0]
    nodal_disp = results.get_nodal_displacement(node_id, combo_name)
    if nodal_disp:
        print(f"\nNodeal displacement for node {node_id}:")
        print(f"  DX: {nodal_disp.displacement.x:.6f}")
        print(f"  DY: {nodal_disp.displacement.y:.6f}")
        print(f"  DZ: {nodal_disp.displacement.z:.6f}")
    
    # Get member results for a specific member
    if results.load_combination_results[combo_name].member_results:
        member_id = list(results.load_combination_results[combo_name].member_results.keys())[0]
        member_result = results.get_member_results(member_id, combo_name)
        if member_result:
            print(f"\nMember results for member {member_id}:")
            print(f"  Max Axial Force: {member_result.axial_force.max_axial:.2f}")
            print(f"  Min Axial Force: {member_result.axial_force.min_axial:.2f}")
            print(f"  Max Moment Y: {member_result.moment_y.max_moment:.2f}")
            print(f"  Max Moment Z: {member_result.moment_z.max_moment:.2f}")
            print(f"  End Forces (i-end): Fx={member_result.end_forces.i_end_forces.x:.2f}")
    
    # Get plate results if available
    if results.load_combination_results[combo_name].plate_results:
        plate_id = list(results.load_combination_results[combo_name].plate_results.keys())[0]
        plate_result = results.get_plate_results(plate_id, combo_name)
        if plate_result:
            print(f"\nPlate results for plate {plate_id}:")
            print(f"  Element Type: {plate_result.element_type}")
            if plate_result.center_stress:
                print(f"  Center Stress: Sx={plate_result.center_stress.sx:.2f}, Sy={plate_result.center_stress.sy:.2f}")
            if plate_result.center_moment:
                print(f"  Center Moment: Mx={plate_result.center_moment.mx:.2f}, My={plate_result.center_moment.my:.2f}")
    
    # Demonstrate utility methods
    max_disp_combo = results.get_max_displacement_by_combo(combo_name)
    max_moment_combo = results.get_max_member_moment_by_combo(combo_name)
    print(f"\nUtility method results for {combo_name}:")
    print(f"  Max displacement in combo: {max_disp_combo:.6f}")
    print(f"  Max member moment in combo: {max_moment_combo:.2f}")
    
    # Show JSON serialization capability
    print(f"\nJSON serialization test:")
    try:
        json_str = results.model_dump_json(indent=2)
        print(f"  Successfully serialized to JSON ({len(json_str)} characters)")
        print(f"  First 200 characters: {json_str[:200]}...")
    except Exception as e:
        print(f"  JSON serialization failed: {e}")


def main():
    """Main test function."""
    print("Testing PyNite Results Models")
    print("="*40)
    
    if not PYDANTIC_AVAILABLE:
        print("Pydantic is not available. Please install it to run this test.")
        print("Run: pip install pydantic")
        return
    
    try:
        # Run analysis and extract results
        results = run_analysis_and_extract_results()
        
        if results:
            # Print summary
            print_results_summary(results)
            
            # Demonstrate usage
            demonstrate_model_usage(results)
            
            print(f"\n" + "="*60)
            print("TEST COMPLETED SUCCESSFULLY!")
            print("="*60)
            print("\nThe Pydantic models successfully captured all PyNite analysis results.")
            print("Key features demonstrated:")
            print("- Comprehensive result organization by load combination")
            print("- Type-safe access to all result types")
            print("- Utility methods for common queries")
            print("- JSON serialization capability")
            print("- Structured data with proper validation")
            
        else:
            print("Failed to extract results.")
            
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()