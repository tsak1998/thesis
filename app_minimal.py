"""
Minimal Flask application for AIDEA CAD frontend.
This version only serves the CAD interface to render the two-storey building.
"""

from flask import Flask, render_template, request, jsonify
import json
import sys
import os

# Add the current directory to Python path for AIDEA imports
sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__)
app.secret_key = "aidea_cad_secret"

# Global storage for the current model
current_model = None

@app.route('/')
def index():
    """Main CAD interface."""
    return render_template('editor_aidea.html')

@app.route('/load', methods=['POST'])
def load():
    """Load the two-story building model data for frontend rendering."""
    global current_model
    
    try:
        # Import and create the two-story model
        from aidea.sample_two_storey_model import create_two_storey_structure
        current_model = create_two_storey_structure()
        
        # Convert AIDEA model to frontend format
        nodes_data = []
        elements_data = []
        point_loads_data = []
        dist_loads_data = []
        materials_data = []
        sections_data = []
        
        # Convert nodes
        for node_id, node in current_model.nodes.items():
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
        for member_id, member in current_model.members.items():
            # Determine element type based on member type
            elem_type = 'column' if 'C' in member_id else 'beam'
            
            # Extract element number from member ID
            if member_id.startswith('C') and '_' in member_id:
                elem_num = int(member_id.split('_')[0][1:])
            elif member_id.startswith('B') and '_' in member_id:
                elem_num = int(member_id.split('_')[0][1:])
            else:
                elem_num = len(elements_data) + 1
            
            elements_data.append({
                'en': elem_num,
                'nodei': member.node_A,
                'nodej': member.node_B,
                'section_id': member.section_id,
                'elem_type': elem_type,
                'user_id': 'demo_user'
            })
        
        # Convert point loads
        for load_id, point_load in current_model.point_loads.items():
            if point_load.node:
                point_loads_data.append({
                    'nn': int(point_load.node),
                    'c': 99999,  # Node load indicator
                    'p_x': point_load.x_mag,
                    'p_y': point_load.y_mag,
                    'p_z': point_load.z_mag,
                    'm_x': 0,
                    'm_y': 0,
                    'm_z': 0,
                    'user_id': 'demo_user'
                })
        
        # Convert distributed loads
        for load_id, dist_load in current_model.distributed_loads.items():
            member_name = str(dist_load.member)
            member_id = None
            
            # Extract member number from member name
            if member_name.startswith('B') and '_' in member_name:
                member_id = int(member_name.split('_')[0][1:])
            elif member_name.startswith('C') and '_' in member_name:
                member_id = int(member_name.split('_')[0][1:])
            
            if member_id:
                dist_loads_data.append({
                    'en': member_id,
                    'p_1_x': dist_load.x_mag_A,
                    'p_2_x': dist_load.x_mag_B,
                    'p_1_y': dist_load.y_mag_A,
                    'p_2_y': dist_load.y_mag_B,
                    'p_1_z': dist_load.z_mag_A,
                    'p_2_z': dist_load.z_mag_B,
                    'c': dist_load.position_A / 100.0,
                    'l': (dist_load.position_B - dist_load.position_A) / 100.0,
                    'user_id': 'demo_user'
                })
        
        # Convert materials
        for mat_id, material in current_model.materials.items():
            materials_data.append({
                'material_id': int(mat_id),
                'E': material.elasticity_modulus,
                'G': material.shear_modulus or (material.elasticity_modulus / (2 * (1 + material.poissons_ratio))),
                'n': material.poissons_ratio,
                'user_id': 'demo_user'
            })
        
        # Convert sections
        for sec_id, section in current_model.sections.items():
            sections_data.append({
                'section_id': int(sec_id),
                'material': section.material_id,
                'type': 'steel',
                'dimensions': section.name,
                'A': section.area,
                'Ix': section.J or 0,
                'Iy': section.Iy,
                'Iz': section.Iz,
                'user_id': 'demo_user'
            })
        
        # Create simple data structure for frontend
        nodes_json = json.dumps({'data': nodes_data})
        elements_json = json.dumps({'data': elements_data})
        point_loads_json = json.dumps({'data': point_loads_data})
        dist_loads_json = json.dumps({'data': dist_loads_data})
        materials_json = json.dumps({'data': materials_data})
        sections_json = json.dumps({'data': sections_data})
        mqn_json = json.dumps({'data': []})  # Empty for now
        
        # Return data in the format expected by the frontend
        return (nodes_json + '|' + 
                elements_json + '|' + 
                point_loads_json + '|' + 
                dist_loads_json + '|' + 
                materials_json + '|' + 
                sections_json + '|' + 
                mqn_json)
        
    except Exception as e:
        print(f"Error loading model: {e}")
        import traceback
        traceback.print_exc()
        
        # Return empty data structure
        empty_data = json.dumps({'data': []})
        return '|'.join([empty_data] * 7)

@app.route('/yellow', methods=['POST'])
def run_analysis():
    """Run structural analysis using AIDEA models."""
    global current_model
    
    try:
        # Use the current model or create a new one
        if current_model is None:
            from aidea.sample_two_storey_model import create_two_storey_structure
            current_model = create_two_storey_structure()
        
        # For now, return mock analysis results since PyNite might not be available
        # In a real implementation, you would use the translator here
        
        # Create mock results that match the expected format
        elements_results = {}
        displacements_results = {}
        reactions_data = []
        nodal_displacements_data = []
        deformed_data = {}
        
        # Mock member results
        for i, (member_id, member) in enumerate(current_model.members.items()):
            elem_num = i + 1
            elements_results[str(elem_num)] = {
                'x': [0, 1],
                'Fx': [10.0, -10.0],  # Mock axial forces
                'Fy': [5.0, -5.0],    # Mock shear forces
                'Fz': [0, 0],
                'Mx': [0, 0],
                'My': [20.0, -20.0],  # Mock moments
                'Mz': [0, 0]
            }
        
        # Mock displacement results
        for node_id, node in current_model.nodes.items():
            displacements_results[node_id] = {
                'x': [0],
                'ux': [0.001],  # Mock displacement in mm
                'uy': [0.002],
                'uz': [0.003]
            }
            
            nodal_displacements_data.append({
                'number': int(node_id),
                'ux': 0.001,
                'uy': 0.002,
                'uz': 0.003,
                'rx': 0.0001,
                'ry': 0.0002,
                'rz': 0.0001
            })
        
        # Mock reactions for supported nodes
        for support_id, support in current_model.supports.items():
            reactions_data.append({
                'number': support.node,
                'Fx': 25.0,   # Mock reaction forces
                'Fy': 15.0,
                'Fz': 50.0,
                'Mx': 5.0,
                'My': 10.0,
                'Mz': 2.0
            })
        
        # Mock deformed shape
        for node_id, node in current_model.nodes.items():
            deformed_data[int(node_id)] = {
                'x': [node.x + 0.1],  # Small displacement for visualization
                'y': [node.y + 0.05],
                'z': [node.z + 0.02]
            }
        
        # Convert to JSON format
        reactions_json = json.dumps({'data': reactions_data})
        nodal_displacements_json = json.dumps({'data': nodal_displacements_data})
        
        return jsonify({
            'mqn': elements_results,
            'displ': displacements_results,
            'reactions': reactions_json,
            'nodal_displacements': nodal_displacements_json,
            'deformed': deformed_data
        })
        
    except Exception as e:
        print(f"Error in analysis: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'mqn': {},
            'displ': {},
            'reactions': '{"data": []}',
            'nodal_displacements': '{"data": []}',
            'deformed': {}
        })

@app.route('/get_model_info', methods=['GET'])
def get_model_info():
    """Get information about the current model."""
    global current_model
    
    if current_model is None:
        try:
            from aidea.sample_two_storey_model import create_two_storey_structure
            current_model = create_two_storey_structure()
        except Exception as e:
            return jsonify({'error': f'Could not load model: {e}'})
    
    info = {
        'nodes': len(current_model.nodes),
        'members': len(current_model.members),
        'materials': len(current_model.materials),
        'sections': len(current_model.sections),
        'supports': len(current_model.supports),
        'point_loads': len(current_model.point_loads),
        'distributed_loads': len(current_model.distributed_loads),
        'load_combinations': len(current_model.load_combinations)
    }
    
    return jsonify(info)

if __name__ == '__main__':
    print("Starting AIDEA CAD Server...")
    print("Visit: http://localhost:5000 to view the two-storey building")
    app.run(debug=True, host='0.0.0.0', port=5000)