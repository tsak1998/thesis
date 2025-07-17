"""
AIDEA to PyNite Translator

This module provides functionality to translate structural models from AIDEA format
to PyNite format and run structural analysis.
"""

from typing import Dict, List, Optional
import numpy as np
from Pynite import FEModel3D
from Pynite.ShearWall import ShearWall
from .aidea_model import Model, Node, Member, Material, Section, Plate, Support, PointLoad, DistributedLoad, Pressure, ShearWall as AideaShearWall


class AideaToPyniteTranslator:
    """Translates AIDEA structural models to PyNite format and runs analysis."""
    
    def __init__(self):
        self.pynite_model: Optional[FEModel3D] = None
        self.aidea_model: Optional[Model] = None
        self.shear_walls: Dict[str, ShearWall] = {}
        
    def translate_model(self, aidea_model: Model) -> FEModel3D:
        """
        Translate an AIDEA model to PyNite format.
        
        Args:
            aidea_model: The AIDEA model to translate
            
        Returns:
            FEModel3D: The translated PyNite model
        """
        self.aidea_model = aidea_model
        self.pynite_model = FEModel3D()
        
        # Translate in order: materials, sections, nodes, supports, members, plates, loads, shear walls
        self._translate_materials()
        self._translate_sections()
        self._translate_nodes()
        self._translate_supports()
        self._translate_members()
        self._translate_plates()
        self._translate_loads()
        self._translate_load_combinations()
        self._translate_shear_walls()
        
        return self.pynite_model
    
    def _translate_materials(self):
        """Translate materials from AIDEA to PyNite format."""
        for material_id, material in self.aidea_model.materials.items():
            # Convert material properties to PyNite units if needed
            E = material.elasticity_modulus  # Assume already in correct units
            G = material.shear_modulus or (E / (2 * (1 + material.poissons_ratio)))
            nu = material.poissons_ratio
            rho = material.density
            fy = material.yield_strength
            
            self.pynite_model.add_material(
                name=material_id,
                E=E,
                G=G,
                nu=nu,
                rho=rho,
                fy=fy
            )
    
    def _translate_sections(self):
        """Translate sections from AIDEA to PyNite format."""
        for section_id, section in self.aidea_model.sections.items():
            self.pynite_model.add_section(
                name=section_id,
                A=section.area,
                Iy=section.Iy,
                Iz=section.Iz,
                J=section.J or 0.0  # Default torsion constant if not provided
            )
    
    def _translate_nodes(self):
        """Translate nodes from AIDEA to PyNite format."""
        for node_id, node in self.aidea_model.nodes.items():
            self.pynite_model.add_node(
                name=node_id,
                X=node.x,
                Y=node.y,
                Z=node.z
            )
    
    def _translate_supports(self):
        """Translate supports from AIDEA to PyNite format."""
        for support_id, support in self.aidea_model.supports.items():
            # Parse restraint code to determine support conditions
            restraints = self._parse_restraint_code(support.restraint_code)
            
            self.pynite_model.def_support(
                node_name=str(support.node),
                support_DX=restraints['DX'],
                support_DY=restraints['DY'],
                support_DZ=restraints['DZ'],
                support_RX=restraints['RX'],
                support_RY=restraints['RY'],
                support_RZ=restraints['RZ']
            )
    
    def _parse_restraint_code(self, restraint_code: str) -> Dict[str, bool]:
        """
        Parse restraint code to determine support conditions.
        
        Args:
            restraint_code: String representing restraint conditions
            
        Returns:
            Dictionary with support conditions for each DOF
        """
        # Common restraint codes:
        # 'FFFFFF' = free in all directions
        # 'TTTTTT' = fixed in all directions  
        # 'TTTFFF' = pinned (fixed translation, free rotation)
        # 'TTFFFF' = roller in Z direction
        
        restraints = {
            'DX': restraint_code[0].upper() == 'T',
            'DY': restraint_code[1].upper() == 'T', 
            'DZ': restraint_code[2].upper() == 'T',
            'RX': restraint_code[3].upper() == 'T',
            'RY': restraint_code[4].upper() == 'T',
            'RZ': restraint_code[5].upper() == 'T'
        }
        
        return restraints
    
    def _translate_members(self):
        """Translate members from AIDEA to PyNite format."""
        for member_id, member in self.aidea_model.members.items():
            # Get material name from section
            section = self.aidea_model.sections[str(member.section_id)]
            material_name = str(section.material_id)
            
            self.pynite_model.add_member(
                name=member_id,
                i_node=str(member.node_A),
                j_node=str(member.node_B),
                material_name=material_name,
                section_name=str(member.section_id),
                rotation=member.rotation_angle
            )
            
            # Apply member end releases if specified
            if hasattr(member, 'fixity_A') and hasattr(member, 'fixity_B'):
                releases_A = self._parse_fixity(member.fixity_A, 'i')
                releases_B = self._parse_fixity(member.fixity_B, 'j')
                
                # Combine releases for both ends
                all_releases = {**releases_A, **releases_B}
                
                self.pynite_model.def_releases(
                    member_name=member_id,
                    **all_releases
                )
    
    def _parse_fixity(self, fixity: str, end: str = 'i') -> Dict[str, bool]:
        """
        Parse member end fixity conditions.
        
        Args:
            fixity: String representing fixity conditions
            end: 'i' for start node, 'j' for end node
            
        Returns:
            Dictionary with release conditions
        """
        # This is a simplified parser - adjust based on your fixity format
        # Assuming format like 'FFFFFF' where F=fixed, R=released
        if len(fixity) >= 6:
            suffix = end
            return {
                f'Dx{suffix}': fixity[0].upper() == 'R',
                f'Dy{suffix}': fixity[1].upper() == 'R',
                f'Dz{suffix}': fixity[2].upper() == 'R',
                f'Rx{suffix}': fixity[3].upper() == 'R',
                f'Ry{suffix}': fixity[4].upper() == 'R',
                f'Rz{suffix}': fixity[5].upper() == 'R'
            }
        return {}
    
    def _translate_plates(self):
        """Translate plates from AIDEA to PyNite format."""
        for plate_id, plate in self.aidea_model.plates.items():
            # Get material name
            material_name = str(plate.material_id)
            
            # Get node names for the plate
            node_names = [str(node_id) for node_id in plate.nodes]
            
            # Add plate to PyNite model
            # Note: PyNite uses add_quad for 4-node plates
            if len(node_names) == 4:
                self.pynite_model.add_quad(
                    name=plate_id,
                    i_node=node_names[0],
                    j_node=node_names[1],
                    m_node=node_names[2],
                    n_node=node_names[3],
                    t=plate.thickness,
                    material_name=material_name
                )
            else:
                print(f"Warning: Plate {plate_id} has {len(node_names)} nodes. Only 4 node plates are supported in this implementation.")
    
    def _translate_loads(self):
        """Translate loads from AIDEA to PyNite format."""
        # Translate point loads
        for load_id, point_load in self.aidea_model.point_loads.items():
            if point_load.node:
                # Nodal load
                if point_load.type == 'n':  # Force
                    if point_load.x_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='FX',
                            P=point_load.x_mag,
                            case=point_load.load_group
                        )
                    if point_load.y_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='FY',
                            P=point_load.y_mag,
                            case=point_load.load_group
                        )
                    if point_load.z_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='FZ',
                            P=point_load.z_mag,
                            case=point_load.load_group
                        )
                elif point_load.type == 'm':  # Moment
                    if point_load.x_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='MX',
                            P=point_load.x_mag,
                            case=point_load.load_group
                        )
                    if point_load.y_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='MY',
                            P=point_load.y_mag,
                            case=point_load.load_group
                        )
                    if point_load.z_mag != 0:
                        self.pynite_model.add_node_load(
                            node_name=point_load.node,
                            direction='MZ',
                            P=point_load.z_mag,
                            case=point_load.load_group
                        )
        
        # Translate distributed loads
        for load_id, dist_load in self.aidea_model.distributed_loads.items():
            member_name = str(dist_load.member)
            
            # Find the member by name if it's a string, otherwise assume it's already correct
            if member_name in self.aidea_model.members:
                member = self.aidea_model.members[member_name]
            else:
                # Try to find member by searching through all members
                member = None
                for mem_id, mem in self.aidea_model.members.items():
                    if mem_id == member_name:
                        member = mem
                        member_name = mem_id
                        break
                if member is None:
                    print(f"Warning: Could not find member {member_name} for distributed load {load_id}")
                    continue
            
            node_A = self.aidea_model.nodes[str(member.node_A)]
            node_B = self.aidea_model.nodes[str(member.node_B)]
            
            # Calculate member length
            length = np.sqrt(
                (node_B.x - node_A.x)**2 + 
                (node_B.y - node_A.y)**2 + 
                (node_B.z - node_A.z)**2
            )
            
            x1 = length * dist_load.position_A / 100.0
            x2 = length * dist_load.position_B / 100.0
            
            # Add distributed loads for each direction
            if dist_load.x_mag_A != 0 or dist_load.x_mag_B != 0:
                direction = 'Fx' if dist_load.axes == 'local' else 'FX'
                self.pynite_model.add_member_dist_load(
                    member_name=member_name,
                    direction=direction,
                    w1=dist_load.x_mag_A,
                    w2=dist_load.x_mag_B,
                    x1=x1,
                    x2=x2,
                    case=dist_load.load_group
                )
            
            if dist_load.y_mag_A != 0 or dist_load.y_mag_B != 0:
                direction = 'Fy' if dist_load.axes == 'local' else 'FY'
                self.pynite_model.add_member_dist_load(
                    member_name=member_name,
                    direction=direction,
                    w1=dist_load.y_mag_A,
                    w2=dist_load.y_mag_B,
                    x1=x1,
                    x2=x2,
                    case=dist_load.load_group
                )
            
            if dist_load.z_mag_A != 0 or dist_load.z_mag_B != 0:
                direction = 'Fz' if dist_load.axes == 'local' else 'FZ'
                self.pynite_model.add_member_dist_load(
                    member_name=member_name,
                    direction=direction,
                    w1=dist_load.z_mag_A,
                    w2=dist_load.z_mag_B,
                    x1=x1,
                    x2=x2,
                    case=dist_load.load_group
                )
        
        # Translate pressure loads on plates (area loads)
        for load_id, pressure_load in self.aidea_model.area_loads.items():
            # Find the plate name by plate_id
            plate_name = None
            plate_id_to_find = pressure_load.plate_id
            
            # Simple mapping: plate_id 1 -> first plate, plate_id 2 -> second plate, etc.
            plate_names = list(self.aidea_model.plates.keys())
            if 1 <= plate_id_to_find <= len(plate_names):
                plate_name = plate_names[plate_id_to_find - 1]  # 1-based to 0-based
            
            if plate_name:
                # Calculate total pressure magnitude (assuming Z is the main direction)
                total_pressure = pressure_load.z_mag
                if total_pressure != 0:
                    self.pynite_model.add_quad_surface_pressure(
                        quad_name=plate_name,
                        pressure=total_pressure,
                        case=pressure_load.load_group
                    )
            else:
                print(f"Warning: Could not find plate for pressure load {load_id} with plate_id {plate_id_to_find}")
        
        # Add self-weight if specified
        for sw_id, self_weight in self.aidea_model.self_weight.items():
            if self_weight.x != 0:
                self.pynite_model.add_member_self_weight('FX', self_weight.x, self_weight.load_group)
            if self_weight.y != 0:
                self.pynite_model.add_member_self_weight('FY', self_weight.y, self_weight.load_group)
            if self_weight.z != 0:
                self.pynite_model.add_member_self_weight('FZ', self_weight.z, self_weight.load_group)
    
    def _translate_load_combinations(self):
        """Translate load combinations from AIDEA to PyNite format."""
        for combo_id, load_combo in self.aidea_model.load_combinations.items():
            # Extract factors from the load combination using model_dump()
            # This properly handles Pydantic v2 extra fields
            combo_data = load_combo.model_dump()
            factors = {}
            for attr_name, attr_value in combo_data.items():
                if attr_name not in ['name', 'criteria']:
                    factors[attr_name] = attr_value
            
            
            self.pynite_model.add_load_combo(
                name=combo_id,
                factors=factors
            )
    
    def run_analysis(self, analysis_type: str = 'linear', **kwargs) -> None:
        """
        Run structural analysis on the translated model.
        
        Args:
            analysis_type: Type of analysis ('linear', 'pdelta', 'nonlinear')
            **kwargs: Additional arguments for analysis
        """
        if self.pynite_model is None:
            raise ValueError("No model has been translated yet. Call translate_model() first.")
        
        if analysis_type.lower() == 'linear':
            self.pynite_model.analyze_linear(**kwargs)
        elif analysis_type.lower() == 'pdelta':
            self.pynite_model.analyze_PDelta(**kwargs)
        elif analysis_type.lower() == 'nonlinear':
            self.pynite_model.analyze(**kwargs)
        else:
            raise ValueError(f"Unknown analysis type: {analysis_type}")
    
    def get_results_summary(self) -> Dict:
        """
        Get a summary of analysis results.
        
        Returns:
            Dictionary containing analysis results summary
        """
        if self.pynite_model is None:
            raise ValueError("No model available for results.")
        
        results = {
            'nodes': {},
            'members': {},
            'reactions': {}
        }
        
        # Get load combinations
        load_combos = list(self.pynite_model.load_combos.keys())
        if not load_combos:
            load_combos = ['Combo 1']  # Default combo
        
        # Node displacements
        for node_name, node in self.pynite_model.nodes.items():
            results['nodes'][node_name] = {}
            for combo in load_combos:
                if combo in node.DX:
                    results['nodes'][node_name][combo] = {
                        'DX': node.DX.get(combo, 0),
                        'DY': node.DY.get(combo, 0),
                        'DZ': node.DZ.get(combo, 0),
                        'RX': node.RX.get(combo, 0),
                        'RY': node.RY.get(combo, 0),
                        'RZ': node.RZ.get(combo, 0)
                    }
        
        # Member forces
        for member_name, member in self.pynite_model.members.items():
            results['members'][member_name] = {}
            for combo in load_combos:
                try:
                    results['members'][member_name][combo] = {
                        'max_moment': member.max_moment('Mz', combo),
                        'min_moment': member.min_moment('Mz', combo),
                        'max_shear': member.max_shear('Fy', combo),
                        'min_shear': member.min_shear('Fy', combo),
                        'max_axial': member.max_axial(combo),
                        'min_axial': member.min_axial(combo)
                    }
                except:
                    # Handle cases where results might not be available
                    results['members'][member_name][combo] = {
                        'max_moment': 0,
                        'min_moment': 0,
                        'max_shear': 0,
                        'min_shear': 0,
                        'max_axial': 0,
                        'min_axial': 0
                    }
        
        # Reactions
        for node_name, node in self.pynite_model.nodes.items():
            if any([node.support_DX, node.support_DY, node.support_DZ, 
                   node.support_RX, node.support_RY, node.support_RZ]):
                results['reactions'][node_name] = {}
                for combo in load_combos:
                    if combo in node.RxnFX:
                        results['reactions'][node_name][combo] = {
                            'RxnFX': node.RxnFX.get(combo, 0),
                            'RxnFY': node.RxnFY.get(combo, 0),
                            'RxnFZ': node.RxnFZ.get(combo, 0),
                            'RxnMX': node.RxnMX.get(combo, 0),
                            'RxnMY': node.RxnMY.get(combo, 0),
                            'RxnMZ': node.RxnMZ.get(combo, 0)
                        }
        
        return results
    
    def _translate_shear_walls(self):
        """Translate shear walls from AIDEA to PyNite format."""
        for wall_id, aidea_wall in self.aidea_model.shear_walls.items():
            # Create a new PyNite ShearWall object
            pynite_wall = ShearWall()
            
            # Set basic wall properties
            pynite_wall.L = aidea_wall.length
            pynite_wall.H = aidea_wall.height
            pynite_wall.mesh_size = aidea_wall.mesh_size
            pynite_wall.ky_mod = aidea_wall.ky_modification_factor
            
            # Add materials to the wall
            for material in aidea_wall.materials:
                pynite_wall.add_material(
                    name=material.name,
                    E=material.elasticity_modulus,
                    G=material.shear_modulus,
                    nu=material.poissons_ratio,
                    rho=material.density,
                    t=material.thickness,
                    x_start=material.x_start,
                    x_end=material.x_end,
                    y_start=material.y_start,
                    y_end=material.y_end
                )
            
            # Add openings to the wall
            for opening in aidea_wall.openings:
                pynite_wall.add_opening(
                    name=opening.name,
                    x_start=opening.x_start,
                    y_start=opening.y_start,
                    width=opening.width,
                    height=opening.height,
                    tie=opening.tie_stiffness
                )
            
            # Add flanges to the wall
            for flange in aidea_wall.flanges:
                pynite_wall.add_flange(
                    thickness=flange.thickness,
                    width=flange.width,
                    x=flange.x_position,
                    y_start=flange.y_start,
                    y_end=flange.y_end,
                    material=flange.material_name,
                    side=flange.side
                )
            
            # Add supports to the wall
            for support in aidea_wall.supports:
                pynite_wall.add_support(
                    elevation=support.elevation,
                    x_start=support.x_start,
                    x_end=support.x_end
                )
            
            # Add stories to the wall
            for story in aidea_wall.stories:
                pynite_wall.add_story(
                    story_name=story.story_name,
                    elevation=story.elevation,
                    x_start=story.x_start,
                    x_end=story.x_end
                )
            
            # Add loads to the wall
            for load in aidea_wall.loads:
                if load.load_type == "shear":
                    pynite_wall.add_shear(
                        story_name=load.story_name,
                        force=load.force_magnitude,
                        case=load.load_group
                    )
                elif load.load_type == "axial":
                    pynite_wall.add_axial(
                        story_name=load.story_name,
                        force=load.force_magnitude,
                        case=load.load_group
                    )
            
            # Store the shear wall for later analysis
            self.shear_walls[wall_id] = pynite_wall
    
    def analyze_shear_walls(self, **kwargs):
        """
        Analyze all shear walls in the model.
        
        Args:
            **kwargs: Additional arguments for shear wall analysis
        """
        for wall_id, wall in self.shear_walls.items():
            print(f"Analyzing shear wall: {wall_id}")
            
            # Generate the wall mesh and model
            wall.generate()
            
            # Analyze the wall
            wall.model.analyze_linear(**kwargs)
            
            print(f"Shear wall {wall_id} analysis complete")
    
    def get_shear_wall_results(self, wall_id: str, combo_name: str = 'Combo 1') -> Dict:
        """
        Get results for a specific shear wall.
        
        Args:
            wall_id: ID of the shear wall
            combo_name: Load combination name
            
        Returns:
            Dictionary containing shear wall results
        """
        if wall_id not in self.shear_walls:
            raise ValueError(f"Shear wall {wall_id} not found")
        
        wall = self.shear_walls[wall_id]
        
        results = {
            'wall_id': wall_id,
            'wall_length': wall.L,
            'wall_height': wall.H,
            'piers': {},
            'coupling_beams': {},
            'story_stiffness': {}
        }
        
        # Get pier results
        for pier_id, pier in wall.piers.items():
            P, M, V, M_VL = pier.sum_forces(combo_name)
            results['piers'][pier_id] = {
                'pier_id': pier_id,
                'x_position': pier.x,
                'y_position': pier.y,
                'width': pier.width,
                'height': pier.height,
                'axial_force': P,
                'shear_force': V,
                'moment': M,
                'shear_span_ratio': M_VL
            }
        
        # Get coupling beam results
        for beam_id, beam in wall.coupling_beams.items():
            P, M, V, M_VH = beam.sum_forces(combo_name)
            results['coupling_beams'][beam_id] = {
                'beam_id': beam_id,
                'x_position': beam.x,
                'y_position': beam.y,
                'length': beam.length,
                'height': beam.height,
                'axial_force': P,
                'shear_force': V,
                'moment': M,
                'shear_span_ratio': M_VH
            }
        
        # Get story stiffness results
        for story in wall._stories:
            story_name = str(story[0])  # Ensure story_name is a string
            try:
                stiffness_value = wall.stiffness(story_name)
                results['story_stiffness'][story_name] = {
                    'story_name': story_name,
                    'stiffness': stiffness_value,
                    'test_force': 100.0,
                    'max_displacement': 100.0 / stiffness_value if stiffness_value > 0 else 0.0
                }
            except:
                results['story_stiffness'][story_name] = {
                    'story_name': story_name,
                    'stiffness': 0.0,
                    'test_force': 100.0,
                    'max_displacement': 0.0
                }
        
        return results