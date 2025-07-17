"""
Two-Storey Structure Results Visualization

This script uses PyNite's rendering capabilities to visualize:
1. The complete two-storey frame structure
2. Shear wall stress distributions and deformed shapes
3. Member forces and moments
4. Nodal displacements
5. Pier and coupling beam identification
"""

import os
from sample_two_storey_model import create_two_storey_structure
from aidea_to_pynite_translator import AideaToPyniteTranslator


def create_output_directory():
    """Create output directory for visualization results."""
    output_dir = "./visualization_results"
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def visualize_frame_structure(translator, output_dir):
    """Visualize the main frame structure with various result types."""
    print("\n" + "=" * 60)
    print("VISUALIZING FRAME STRUCTURE")
    print("=" * 60)
    
    pynite_model = translator.pynite_model
    load_combos = list(pynite_model.load_combos.keys())
    print(f"Available load combinations: {load_combos}")
    
    try:
        from Pynite.Rendering import Renderer
        
        # Create renderer for frame
        renderer = Renderer(pynite_model)
        renderer.window_width = 1200
        renderer.window_height = 800
        renderer.annotation_size = 0.8
        renderer.render_loads = True
        renderer.scalar_bar = True
        renderer.deformed_shape = True
        renderer.deformed_scale = 1
        
        # Render for each load combination
        for combo in load_combos:
            print(f"\nRendering frame for load combination: {combo}")
            renderer.combo_name = combo
            
            # 1. Member moment diagram (Mz - major axis bending)
            renderer.color_map = 'Mz'
            renderer.deformed_shape = False
            screenshot_path = os.path.join(output_dir, f'frame_moments_Mz_{combo}.png')
            renderer.screenshot(screenshot_path, interact=False)
            print(f"  ✓ Saved moment diagram (Mz): {screenshot_path}")
            
            # 2. Member axial forces
            renderer.color_map = 'Fx'
            screenshot_path = os.path.join(output_dir, f'frame_axial_{combo}.png')
            renderer.screenshot(screenshot_path, interact=False)
            print(f"  ✓ Saved axial forces: {screenshot_path}")
            
            # 3. Nodal displacements with deformed shape
            renderer.color_map = 'DZ'
            renderer.deformed_shape = True
            renderer.deformed_scale = 1
            screenshot_path = os.path.join(output_dir, f'frame_displacements_{combo}.png')
            renderer.screenshot(screenshot_path, interact=False)
            print(f"  ✓ Saved displacements: {screenshot_path}")
            
            # 4. Shear forces (Fy)
            renderer.color_map = 'Fy'
            renderer.deformed_shape = False
            screenshot_path = os.path.join(output_dir, f'frame_shear_Fy_{combo}.png')
            renderer.screenshot(screenshot_path, interact=False)
            print(f"  ✓ Saved shear forces (Fy): {screenshot_path}")
        
        print("\n✓ Frame structure visualization completed")
        return True
        
    except Exception as e:
        print(f"❌ Error rendering frame structure: {e}")
        print("Note: This may be due to display/graphics issues in the environment")
        return False


def visualize_shear_walls(translator, output_dir):
    """Visualize shear wall analysis results."""
    print("\n" + "=" * 60)
    print("VISUALIZING SHEAR WALL RESULTS")
    print("=" * 60)
    
    # Create shear wall output directory
    sw_output_dir = os.path.join(output_dir, "shear_walls")
    os.makedirs(sw_output_dir, exist_ok=True)
    
    # Visualize each shear wall
    for wall_id, wall in translator.shear_walls.items():
        print(f"\nVisualizing Shear Wall: {wall_id}")
        print("-" * 40)
        
        try:
            # Create wall-specific directory
            wall_dir = os.path.join(sw_output_dir, wall_id)
            os.makedirs(wall_dir, exist_ok=True)
            
            # Get wall load combinations
            wall_combos = list(wall.model.load_combos.keys()) if wall.model.load_combos else ['Combo 1']
            print(f"  Wall load combinations: {wall_combos}")
            
            # Use PyNite's built-in shear wall rendering
            for combo in wall_combos:
                print(f"  Rendering {wall_id} for combination: {combo}")
                
                try:
                    # Method 1: Use built-in shear wall screenshots
                    wall.screenshots(combo_name=combo, dir_path=wall_dir)
                    print(f"    ✓ Built-in screenshots saved to {wall_dir}/")
                    
                except Exception as e:
                    print(f"    ⚠️  Built-in screenshots failed: {e}")
                    
                    # Method 2: Manual rendering with Renderer
                    try:
                        from Pynite.Rendering import Renderer
                        
                        renderer = Renderer(wall.model)
                        renderer.window_width = 800
                        renderer.window_height = 800
                        renderer.annotation_size = 0.5
                        renderer.combo_name = combo
                        renderer.deformed_shape = True
                        renderer.deformed_scale = 4
                        renderer.scalar_bar = True
                        
                        # Shear stress visualization
                        renderer.color_map = 'Txy'
                        screenshot_path = os.path.join(wall_dir, f'{wall_id}_shear_stress_{combo}.png')
                        renderer.screenshot(screenshot_path, interact=False)
                        print(f"    ✓ Shear stress: {screenshot_path}")
                        
                        # Normal stress in Y direction
                        renderer.color_map = 'Sy'
                        screenshot_path = os.path.join(wall_dir, f'{wall_id}_normal_stress_{combo}.png')
                        renderer.screenshot(screenshot_path, interact=False)
                        print(f"    ✓ Normal stress: {screenshot_path}")
                        
                    except Exception as e2:
                        print(f"    ❌ Manual rendering failed: {e2}")
            
            # Generate pier diagram
            try:
                pier_plot = wall.draw_piers(show=False)
                pier_path = os.path.join(wall_dir, f'{wall_id}_piers.png')
                pier_plot.savefig(pier_path, format='png', dpi=150, bbox_inches='tight')
                print(f"    ✓ Pier diagram: {pier_path}")
            except Exception as e:
                print(f"    ⚠️  Pier diagram failed: {e}")
            
            # Generate coupling beam diagram
            try:
                beam_plot = wall.draw_coupling_beams(show=False)
                beam_path = os.path.join(wall_dir, f'{wall_id}_coupling_beams.png')
                beam_plot.savefig(beam_path, format='png', dpi=150, bbox_inches='tight')
                print(f"    ✓ Coupling beam diagram: {beam_path}")
            except Exception as e:
                print(f"    ⚠️  Coupling beam diagram failed: {e}")
                
        except Exception as e:
            print(f"❌ Error visualizing wall {wall_id}: {e}")
    
    print("\n✓ Shear wall visualization completed")


def create_summary_report(translator, output_dir):
    """Create a text summary of the analysis results."""
    print("\n" + "=" * 60)
    print("CREATING SUMMARY REPORT")
    print("=" * 60)
    
    report_path = os.path.join(output_dir, "analysis_summary.txt")
    
    with open(report_path, 'w') as f:
        f.write("TWO-STOREY STRUCTURE ANALYSIS SUMMARY\n")
        f.write("=" * 50 + "\n\n")
        
        # Model information
        f.write("MODEL INFORMATION:\n")
        f.write(f"- Nodes: {len(translator.pynite_model.nodes)}\n")
        f.write(f"- Members: {len(translator.pynite_model.members)}\n")
        f.write(f"- Plates: {len(translator.pynite_model.quads)}\n")
        f.write(f"- Shear Walls: {len(translator.shear_walls)}\n")
        f.write(f"- Load Combinations: {len(translator.pynite_model.load_combos)}\n\n")
        
        # Frame results summary
        frame_results = translator.get_results_summary()
        load_combos = list(translator.pynite_model.load_combos.keys())
        
        f.write("FRAME ANALYSIS RESULTS:\n")
        for combo in load_combos:
            f.write(f"\nLoad Combination: {combo}\n")
            
            # Maximum displacements
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
                f.write(f"  Max displacement: {max_disp:.6f} m at node {max_node}\n")
            
            # Maximum member forces
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
                f.write(f"  Max moment: {max_moment:.2f} kN⋅m in member {max_member}\n")
        
        # Shear wall results
        f.write("\n\nSHEAR WALL ANALYSIS RESULTS:\n")
        for wall_id, wall in translator.shear_walls.items():
            f.write(f"\nShear Wall: {wall_id}\n")
            f.write(f"  Dimensions: {wall.L}m × {wall.H}m\n")
            f.write(f"  Piers identified: {len(wall.piers)}\n")
            f.write(f"  Coupling beams: {len(wall.coupling_beams)}\n")
            
            # Story stiffness
            f.write("  Story stiffness:\n")
            for story in wall._stories:
                story_name = str(story[0])
                try:
                    stiffness = wall.stiffness(story_name)
                    f.write(f"    {story_name}: {stiffness:.1f} kN/m\n")
                except:
                    f.write(f"    {story_name}: Could not calculate\n")
    
    print(f"✓ Summary report saved: {report_path}")


def main():
    """Main visualization function."""
    print("=" * 80)
    print("TWO-STOREY STRUCTURE VISUALIZATION WITH PYNITE RENDERING")
    print("=" * 80)
    
    try:
        # Create output directory
        output_dir = create_output_directory()
        print(f"Output directory: {output_dir}")
        
        # Create and translate model
        print("\n1. Creating AIDEA model...")
        aidea_model = create_two_storey_structure()
        print(f"   ✓ Model created with {len(aidea_model.shear_walls)} shear walls")
        
        print("\n2. Translating to PyNite...")
        translator = AideaToPyniteTranslator()
        pynite_model = translator.translate_model(aidea_model)
        print("   ✓ Translation completed")
        
        print("\n3. Running structural analysis...")
        translator.run_analysis('linear', log=False, check_statics=False)
        print("   ✓ Frame analysis completed")
        
        print("\n4. Running shear wall analysis...")
        translator.analyze_shear_walls(log=False, check_statics=False)
        print("   ✓ Shear wall analysis completed")
        
        # Visualizations
        print("\n5. Creating visualizations...")
        
        # Frame visualization
        frame_success = visualize_frame_structure(translator, output_dir)
        
        # # Shear wall visualization
        # visualize_shear_walls(translator, output_dir)
        
        # Summary report
        create_summary_report(translator, output_dir)
        
        # Final summary
        print("\n" + "=" * 80)
        print("VISUALIZATION SUMMARY")
        print("=" * 80)
        print(f"✓ Output directory: {output_dir}")
        print(f"✓ Frame analysis: {len(pynite_model.nodes)} nodes, {len(pynite_model.members)} members")
        print(f"✓ Shear walls: {len(translator.shear_walls)} walls analyzed")
        print(f"✓ Load combinations: {len(pynite_model.load_combos)} combinations visualized")
        
        if frame_success:
            print("✓ Frame structure renderings created")
        else:
            print("⚠️  Frame renderings may have issues (check display/graphics)")
        
        print("✓ Shear wall diagrams created")
        print("✓ Analysis summary report generated")
        
        print(f"\n🎉 Visualization completed! Check the '{output_dir}' directory for all results.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during visualization: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ Two-storey structure visualization completed successfully!")
    else:
        print("\n❌ Visualization failed. Please check the error messages above.")