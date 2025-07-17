from flask import Flask, render_template, flash, redirect, url_for, session, logging, request, json, jsonify
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
import pandas as pd
import dxfgrabber
from io import StringIO

# Import AIDEA models and functionality
from aidea.aidea_model import Model
from aidea.sample_two_storey_model import create_two_storey_structure
from aidea.aidea_to_pynite_translator import AideaToPyniteTranslator
from aidea.run_structural_analysis import run_complete_analysis

app = Flask(__name__)
app.secret_key = "^A%DJAJU^JJ123"

# Config Debug
app.debug = True
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

# Global storage for the current model (in production, use proper session management)
current_model = None
analysis_results = None

@app.route('/')
@app.route('/index')
def index():
    return render_template('home.html')

@app.route('/editor')
def editor():
    # Remove login requirement for now - focus on CAD functionality
    return render_template('editor.html')

@app.route('/editor_aidea')
def editor_aidea():
    # New AIDEA-based editor
    return render_template('editor_aidea.html')

@app.route('/getUsername', methods=['POST'])
def get_username():
    # Return a default user since we removed database authentication
    return jsonify("demo_user")

@app.route('/load', methods=['GET', 'POST'])
def load():
    """Load the two-story building model data for frontend rendering."""
    if request.method == 'POST':
        global current_model
        
        # Create the two-story model
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
                'dof_dx': 0,  # Default DOF values
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
            
            elements_data.append({
                'en': int(member_id.split('_')[0][1:]) if member_id.startswith('C') or member_id.startswith('B') else int(member_id),
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
            # Find member name from the distributed load
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
                'type': 'steel',  # Default type
                'dimensions': section.name,
                'A': section.area,
                'Ix': section.J or 0,  # Torsion constant
                'Iy': section.Iy,
                'Iz': section.Iz,
                'user_id': 'demo_user'
            })
        
        # Convert to pandas DataFrames and then to JSON format expected by frontend
        nodes_df = pd.DataFrame(nodes_data)
        elements_df = pd.DataFrame(elements_data)
        point_loads_df = pd.DataFrame(point_loads_data)
        dist_loads_df = pd.DataFrame(dist_loads_data)
        materials_df = pd.DataFrame(materials_data)
        sections_df = pd.DataFrame(sections_data)
        
        # Create empty mqn data for now
        mqn_data = pd.DataFrame()
        
        # Return data in the format expected by the frontend
        return (nodes_df.to_json(orient='table', index=False) + '|' + 
                elements_df.to_json(orient='table', index=False) + '|' + 
                point_loads_df.to_json(orient='table', index=False) + '|' + 
                dist_loads_df.to_json(orient='table', index=False) + '|' + 
                materials_df.to_json(orient='table', index=False) + '|' + 
                sections_df.to_json(orient='table', index=False) + '|' + 
                mqn_data.to_json(orient='table', index=False))

@app.route('/readDXF', methods=['GET', 'POST'])
def readDXF():
    """Handle DXF file import - simplified for now."""
    if request.method == 'POST':
        try:
            fl = (request.get_data()).decode('UTF-8')
            stream = StringIO(fl)
            dxf = dxfgrabber.read(stream)
            
            # For now, return empty data - can be enhanced later
            nodes_data = pd.DataFrame()
            elements_data = pd.DataFrame()
            
            return nodes_data.to_json(orient='table') + '|' + elements_data.to_json(orient='table')
        except Exception as e:
            return f'Could not read DXF file: {str(e)}'
    else:
        return 'Could not read DXF file'

class RegisterForm(Form):
    name = StringField('Name', [validators.Length(min=1, max=50)])
    username = StringField('Username', [validators.Length(min=4, max=25)])
    email = StringField('Email', [validators.Length(min=6, max=50)])
    password = PasswordField('Password', [
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match')
    ])
    confirm = PasswordField('Confirm Password')

# Simplified user management without database
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm(request.form)
    if request.method == 'POST' and form.validate():
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password_candidate = request.form['password']
        
        # Simplified login - accept any credentials for demo
        session['logged_in'] = True
        session['username'] = username
        flash('You are now logged in', 'success')
        return redirect(url_for('editor'))
    
    return render_template('login.html')

def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            flash('Unauthorized, Please login', 'danger')
            return redirect(url_for('login'))
    return wrap

@app.route('/logout')
def logout():
    session.clear()
    flash('You are now logged out', 'success')
    return redirect(url_for('login'))

@app.route('/save', methods=["GET", "POST"])
def save():
    """Save model data - simplified without database."""
    if request.method == 'POST':
        data = request.get_json()
        # For now, just acknowledge the save
        flash('Model saved successfully!', 'success')
        return jsonify({'status': 'success', 'message': 'Model saved'})
    return render_template('editor.html')

@app.route('/yellow', methods=["GET", "POST"])
def run_analysis():
    """Run structural analysis using AIDEA models and PyNite."""
    if request.method == 'POST':
        global current_model, analysis_results
        
        try:
            # Use the current model or create a new one
            if current_model is None:
                current_model = create_two_storey_structure()
            
            # Create translator and run analysis
            translator = AideaToPyniteTranslator()
            pynite_model = translator.translate_model(current_model)
            
            # Run analysis
            translator.run_analysis(
                analysis_type='linear',
                log=False,
                check_stability=True,
                check_statics=True
            )
            
            # Get results
            results = translator.get_results_summary()
            analysis_results = results
            
            # Convert results to format expected by frontend
            elements_results = {}
            displacements_results = {}
            reactions_data = []
            nodal_displacements_data = []
            deformed_data = {}
            
            # Get first load combination
            first_combo = None
            for node_data in results['nodes'].values():
                if node_data:
                    first_combo = list(node_data.keys())[0]
                    break
            
            if first_combo:
                # Process member results
                for member_name, member_data in results['members'].items():
                    if first_combo in member_data:
                        forces = member_data[first_combo]
                        # Create simplified force data for visualization
                        elements_results[member_name] = {
                            'x': [0, 1],  # Simplified - start and end
                            'Fx': [forces['max_axial'], forces['min_axial']],
                            'Fy': [forces['max_shear'], forces['min_shear']],
                            'Fz': [0, 0],
                            'Mx': [0, 0],
                            'My': [forces['max_moment'], forces['min_moment']],
                            'Mz': [0, 0]
                        }
                
                # Process displacement results
                for node_name, node_data in results['nodes'].items():
                    if first_combo in node_data:
                        disp = node_data[first_combo]
                        displacements_results[node_name] = {
                            'x': [0],
                            'ux': [disp['DX']],
                            'uy': [disp['DY']],
                            'uz': [disp['DZ']]
                        }
                        
                        # Add to nodal displacements
                        nodal_displacements_data.append({
                            'number': int(node_name),
                            'ux': disp['DX'],
                            'uy': disp['DY'],
                            'uz': disp['DZ'],
                            'rx': disp['RX'],
                            'ry': disp['RY'],
                            'rz': disp['RZ']
                        })
                
                # Process reactions
                for node_name, reaction_data in results['reactions'].items():
                    if first_combo in reaction_data:
                        rxn = reaction_data[first_combo]
                        reactions_data.append({
                            'number': int(node_name),
                            'Fx': rxn['RxnFX'],
                            'Fy': rxn['RxnFY'],
                            'Fz': rxn['RxnFZ'],
                            'Mx': rxn['RxnMX'],
                            'My': rxn['RxnMY'],
                            'Mz': rxn['RxnMZ']
                        })
                
                # Create deformed shape data
                for node_name, node_data in results['nodes'].items():
                    if first_combo in node_data:
                        disp = node_data[first_combo]
                        node = current_model.nodes[node_name]
                        deformed_data[int(node_name)] = {
                            'x': [node.x + disp['DX'] * 100],  # Scale for visibility
                            'y': [node.y + disp['DY'] * 100],
                            'z': [node.z + disp['DZ'] * 100]
                        }
            
            # Convert to DataFrames and JSON
            reactions_df = pd.DataFrame(reactions_data)
            nodal_displacements_df = pd.DataFrame(nodal_displacements_data)
            
            return jsonify({
                'mqn': elements_results,
                'displ': displacements_results,
                'reactions': reactions_df.to_json(orient='table', index=False),
                'nodal_displacements': nodal_displacements_df.to_json(orient='table', index=False),
                'deformed': deformed_data
            })
            
        except Exception as e:
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
        current_model = create_two_storey_structure()
    
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
    app.secret_key = "^A%DJAJU^JJ123"
    app.run(debug=True, port=5001)  # Use different port to avoid conflicts