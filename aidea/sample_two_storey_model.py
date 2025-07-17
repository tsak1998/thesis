"""
Sample Two-Storey Rectangular Structure in AIDEA Format

This module creates a sample two-storey rectangular building structure
using the AIDEA model format for testing the translator.
"""

from .aidea_model import (
    Model, Settings, SettingsUnits, Node, Member, Material, Section, Plate,
    Support, PointLoad, DistributedLoad, SelfWeight, LoadCombination, Pressure,
    ShearWall, ShearWallMaterial, ShearWallOpening, ShearWallFlange,
    ShearWallSupport, ShearWallStory, ShearWallLoad
)


def create_two_storey_structure() -> Model:
    """
    Create a sample two-storey rectangular structure.
    
    Structure details:
    - 4 columns (3m height each storey)
    - 2 storeys (total height 6m)
    - 6m x 4m plan dimensions
    - Steel frame construction
    - Dead and live loads
    - Wind loads
    
    Returns:
        Model: Complete AIDEA model of the structure
    """
    
    # Settings
    settings = Settings(
        units=SettingsUnits(
            length='m',
            force='kn',
            moment='kn-m',
            stress='mpa'
        ),
        vertical_axis='Z'
    )
    
    # Materials
    materials = {
        '1': Material(
            id=1,
            name='Steel S355',
            elasticity_modulus=210000.0,  # MPa
            shear_modulus=81000.0,        # MPa
            density=7850.0,               # kg/m³
            poissons_ratio=0.3,
            yield_strength=355.0,         # MPa
            ultimate_strength=510.0,      # MPa
            thermal_expansion_coefficient=12e-6  # 1/°C
        ),
        '2': Material(
            id=2,
            name='Concrete C30/37',
            elasticity_modulus=33000.0,   # MPa (Ec = 33 GPa for C30/37)
            shear_modulus=13750.0,        # MPa (G = Ec/(2*(1+ν)))
            density=2500.0,               # kg/m³
            poissons_ratio=0.2,
            yield_strength=30.0,          # MPa (fck)
            ultimate_strength=37.0,       # MPa (fcm)
            thermal_expansion_coefficient=10e-6  # 1/°C
        )
    }
    
    # Sections
    sections = {
        '1': Section(
            version=1,
            name='HEB200_Column',
            area=0.0078,      # m²
            Iz=5696e-8,       # m⁴ (strong axis)
            Iy=2003e-8,       # m⁴ (weak axis)
            J=190e-8,         # m⁴ (torsion)
            material_id=1
        ),
        '2': Section(
            version=1,
            name='IPE300_Beam',
            area=0.0053,      # m²
            Iz=8356e-8,       # m⁴ (strong axis)
            Iy=604e-8,        # m⁴ (weak axis)
            J=20.1e-8,        # m⁴ (torsion)
            material_id=1
        )
    }
    
    # Nodes - Two storey structure
    # Ground level (Z=0)
    # First floor (Z=3)
    # Second floor (Z=6)
    nodes = {
        # Ground level nodes
        '1': Node(x=0.0, y=0.0, z=0.0),    # Column 1 base
        '2': Node(x=6.0, y=0.0, z=0.0),    # Column 2 base
        '3': Node(x=6.0, y=4.0, z=0.0),    # Column 3 base
        '4': Node(x=0.0, y=4.0, z=0.0),    # Column 4 base
        
        # First floor nodes (Z=3m)
        '5': Node(x=0.0, y=0.0, z=3.0),    # Column 1 first floor
        '6': Node(x=6.0, y=0.0, z=3.0),    # Column 2 first floor
        '7': Node(x=6.0, y=4.0, z=3.0),    # Column 3 first floor
        '8': Node(x=0.0, y=4.0, z=3.0),    # Column 4 first floor
        
        # Second floor nodes (Z=6m)
        '9': Node(x=0.0, y=0.0, z=6.0),    # Column 1 top
        '10': Node(x=6.0, y=0.0, z=6.0),   # Column 2 top
        '11': Node(x=6.0, y=4.0, z=6.0),   # Column 3 top
        '12': Node(x=0.0, y=4.0, z=6.0),   # Column 4 top
    }
    
    # Plates (Floor Slabs)
    plates = {
        # First Floor Slab (nodes 5,6,7,8)
        'SLAB_1F': Plate(
            type="plate",
            nodes=[5, 6, 7, 8],  # First floor corner nodes
            material_id=1,  # Steel material (could be concrete in real project)
            thickness=0.2,  # 200mm thick slab
            membrane_thickness=0.2,
            bending_thickness=0.2
        ),
        # Second Floor Slab (nodes 9,10,11,12)
        'SLAB_2F': Plate(
            type="plate",
            nodes=[9, 10, 11, 12],  # Second floor corner nodes
            material_id=1,  # Steel material (could be concrete in real project)
            thickness=0.2,  # 200mm thick slab
            membrane_thickness=0.2,
            bending_thickness=0.2
        )
    }
    
    # Members
    members = {
        # Columns - Ground to First Floor
        'C1_GF': Member(
            type='column',
            node_A=1, node_B=5,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF',  # Fixed base
            fixity_B='FFFFFF',  # Fixed top
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C2_GF': Member(
            type='column',
            node_A=2, node_B=6,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C3_GF': Member(
            type='column',
            node_A=3, node_B=7,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C4_GF': Member(
            type='column',
            node_A=4, node_B=8,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        
        # Columns - First to Second Floor
        'C1_FS': Member(
            type='column',
            node_A=5, node_B=9,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C2_FS': Member(
            type='column',
            node_A=6, node_B=10,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C3_FS': Member(
            type='column',
            node_A=7, node_B=11,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'C4_FS': Member(
            type='column',
            node_A=8, node_B=12,
            section_id=1,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        
        # Beams - First Floor
        'B1_F1': Member(
            type='beam',
            node_A=5, node_B=6,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B2_F1': Member(
            type='beam',
            node_A=6, node_B=7,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B3_F1': Member(
            type='beam',
            node_A=7, node_B=8,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B4_F1': Member(
            type='beam',
            node_A=8, node_B=5,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        
        # Beams - Second Floor
        'B1_F2': Member(
            type='beam',
            node_A=9, node_B=10,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B2_F2': Member(
            type='beam',
            node_A=10, node_B=11,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B3_F2': Member(
            type='beam',
            node_A=11, node_B=12,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
        'B4_F2': Member(
            type='beam',
            node_A=12, node_B=9,
            section_id=2,
            rotation_angle=0,
            fixity_A='FFFFFF', fixity_B='FFFFFF',
            offset_Ax='0', offset_Ay='0', offset_Az='0',
            offset_Bx='0', offset_By='0', offset_Bz='0',
            stiffness_A_Ry=1.0, stiffness_A_Rz=1.0,
            stiffness_B_Ry=1.0, stiffness_B_Rz=1.0
        ),
    }
    
    # Supports - Fixed base for all columns
    supports = {
        '1': Support(
            node=1,
            restraint_code='TTTTTT',  # Fixed in all directions
            tx=0, ty=0, tz=0, rx=0, ry=0, rz=0
        ),
        '2': Support(
            node=2,
            restraint_code='TTTTTT',
            tx=0, ty=0, tz=0, rx=0, ry=0, rz=0
        ),
        '3': Support(
            node=3,
            restraint_code='TTTTTT',
            tx=0, ty=0, tz=0, rx=0, ry=0, rz=0
        ),
        '4': Support(
            node=4,
            restraint_code='TTTTTT',
            tx=0, ty=0, tz=0, rx=0, ry=0, rz=0
        ),
    }
    
    # Point loads - Live loads on floors
    point_loads = {
        # First floor live loads (concentrated at nodes)
        'LL_F1_N5': PointLoad(
            load_id=1,
            load_group='Live',
            type='n',
            node='5',
            x_mag=0.0, y_mag=0.0, z_mag=-15.0  # 15 kN downward
        ),
        'LL_F1_N6': PointLoad(
            load_id=2,
            load_group='Live',
            type='n',
            node='6',
            x_mag=0.0, y_mag=0.0, z_mag=-15.0
        ),
        'LL_F1_N7': PointLoad(
            load_id=3,
            load_group='Live',
            type='n',
            node='7',
            x_mag=0.0, y_mag=0.0, z_mag=-15.0
        ),
        'LL_F1_N8': PointLoad(
            load_id=4,
            load_group='Live',
            type='n',
            node='8',
            x_mag=0.0, y_mag=0.0, z_mag=-15.0
        ),
        
        # Second floor live loads
        'LL_F2_N9': PointLoad(
            load_id=5,
            load_group='Live',
            type='n',
            node='9',
            x_mag=0.0, y_mag=0.0, z_mag=-12.0  # 12 kN downward
        ),
        'LL_F2_N10': PointLoad(
            load_id=6,
            load_group='Live',
            type='n',
            node='10',
            x_mag=0.0, y_mag=0.0, z_mag=-12.0
        ),
        'LL_F2_N11': PointLoad(
            load_id=7,
            load_group='Live',
            type='n',
            node='11',
            x_mag=0.0, y_mag=0.0, z_mag=-12.0
        ),
        'LL_F2_N12': PointLoad(
            load_id=8,
            load_group='Live',
            type='n',
            node='12',
            x_mag=0.0, y_mag=0.0, z_mag=-12.0
        ),
        
        # Wind loads (horizontal on top floor)
        'Wind_N9': PointLoad(
            load_id=9,
            load_group='Wind',
            type='n',
            node='9',
            x_mag=5.0, y_mag=0.0, z_mag=0.0  # 5 kN in X direction
        ),
        'Wind_N10': PointLoad(
            load_id=10,
            load_group='Wind',
            type='n',
            node='10',
            x_mag=5.0, y_mag=0.0, z_mag=0.0
        ),
        'Wind_N11': PointLoad(
            load_id=11,
            load_group='Wind',
            type='n',
            node='11',
            x_mag=5.0, y_mag=0.0, z_mag=0.0
        ),
        'Wind_N12': PointLoad(
            load_id=12,
            load_group='Wind',
            type='n',
            node='12',
            x_mag=5.0, y_mag=0.0, z_mag=0.0
        ),
    }
    
    # Distributed loads - Dead loads on beams
    distributed_loads = {
        # First floor beam dead loads
        'DL_B1_F1': DistributedLoad(
            load_id=1,
            load_group='Dead',
            member='B1_F1',  # Reference member by name
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-10.0,  # 10 kN/m downward
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-10.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B2_F1': DistributedLoad(
            load_id=2,
            load_group='Dead',
            member='B2_F1',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-10.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-10.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B3_F1': DistributedLoad(
            load_id=3,
            load_group='Dead',
            member='B3_F1',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-10.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-10.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B4_F1': DistributedLoad(
            load_id=4,
            load_group='Dead',
            member='B4_F1',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-10.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-10.0,
            position_A=0.0, position_B=100.0
        ),
        
        # Second floor beam dead loads
        'DL_B1_F2': DistributedLoad(
            load_id=5,
            load_group='Dead',
            member='B1_F2',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-8.0,  # 8 kN/m downward
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-8.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B2_F2': DistributedLoad(
            load_id=6,
            load_group='Dead',
            member='B2_F2',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-8.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-8.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B3_F2': DistributedLoad(
            load_id=7,
            load_group='Dead',
            member='B3_F2',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-8.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-8.0,
            position_A=0.0, position_B=100.0
        ),
        'DL_B4_F2': DistributedLoad(
            load_id=8,
            load_group='Dead',
            member='B4_F2',
            axes='global',
            x_mag_A=0.0, y_mag_A=0.0, z_mag_A=-8.0,
            x_mag_B=0.0, y_mag_B=0.0, z_mag_B=-8.0,
            position_A=0.0, position_B=100.0
        ),
    }
    
    # Pressure loads on plates (area loads)
    area_loads = {
        # First floor slab pressure loads (dead load equivalent)
        'PL_SLAB_1F_DEAD': Pressure(
            load_id=1,
            load_group='Dead',
            plate_id=1,  # Reference to SLAB_1F
            axes='global',
            x_mag=0.0, y_mag=0.0, z_mag=-5.0  # 5 kPa downward pressure
        ),
        'PL_SLAB_1F_LIVE': Pressure(
            load_id=2,
            load_group='Live',
            plate_id=1,  # Reference to SLAB_1F
            axes='global',
            x_mag=0.0, y_mag=0.0, z_mag=-3.0  # 3 kPa downward live load
        ),
        
        # Second floor slab pressure loads
        'PL_SLAB_2F_DEAD': Pressure(
            load_id=3,
            load_group='Dead',
            plate_id=2,  # Reference to SLAB_2F
            axes='global',
            x_mag=0.0, y_mag=0.0, z_mag=-4.0  # 4 kPa downward pressure
        ),
        'PL_SLAB_2F_LIVE': Pressure(
            load_id=4,
            load_group='Live',
            plate_id=2,  # Reference to SLAB_2F
            axes='global',
            x_mag=0.0, y_mag=0.0, z_mag=-2.5  # 2.5 kPa downward live load
        ),
    }
    
    # Self weight
    self_weight = {
        'SW': SelfWeight(
            x=0.0, y=0.0, z=-1.0,  # Gravity in negative Z direction
            load_group='Dead'
        )
    }
    
    # Load combinations
    load_combinations = {
        'ULS_1': LoadCombination(
            name='1.35G + 1.5Q',
            criteria='ULS',
            Dead=1.35,
            Live=1.5
        ),
        'ULS_2': LoadCombination(
            name='1.35G + 1.5Q + 0.9W',
            criteria='ULS',
            Dead=1.35,
            Live=1.5,
            Wind=0.9
        ),
        'SLS': LoadCombination(
            name='1.0G + 1.0Q',
            criteria='SLS',
            Dead=1.0,
            Live=1.0
        )
    }
    
    # Shear Walls for lateral resistance
    shear_walls = {
        # Shear Wall 1 - Along X direction (between nodes 1-2 and 5-6)
        'SW_X1': ShearWall(
            name='Shear Wall X1',
            length=6.0,  # 6m long (between columns)
            height=6.0,  # 6m high (full building height)
            mesh_size=0.5,  # 0.5m mesh size for detailed analysis
            ky_modification_factor=0.35,  # Cracking factor per ACI 318
            
            # Concrete material for the wall
            materials=[
                ShearWallMaterial(
                    name='Concrete',
                    elasticity_modulus=33000.0,  # MPa
                    shear_modulus=13750.0,       # MPa
                    poissons_ratio=0.2,
                    density=2500.0,              # kg/m³
                    thickness=0.25,              # 250mm thick wall
                    x_start=0.0, x_end=6.0,
                    y_start=0.0, y_end=6.0
                )
            ],
            
            # Add a door opening
            openings=[
                ShearWallOpening(
                    name='Door_1',
                    x_start=2.0,
                    y_start=0.0,
                    width=1.0,   # 1m wide door
                    height=2.1,  # 2.1m high door
                    tie_stiffness=None  # No tie above door
                )
            ],
            
            # Foundation support
            supports=[
                ShearWallSupport(
                    elevation=0.0,
                    x_start=0.0,
                    x_end=6.0
                )
            ],
            
            # Define stories for stiffness calculation
            stories=[
                ShearWallStory(
                    story_name='First_Floor',
                    elevation=3.0,
                    x_start=0.0,
                    x_end=6.0
                ),
                ShearWallStory(
                    story_name='Second_Floor',
                    elevation=6.0,
                    x_start=0.0,
                    x_end=6.0
                )
            ],
            
            # Seismic loads
            loads=[
                ShearWallLoad(
                    load_id=1,
                    load_group='Wind',
                    story_name='First_Floor',
                    force_magnitude=50.0,  # 50 kN lateral force
                    load_type='shear'
                ),
                ShearWallLoad(
                    load_id=2,
                    load_group='Wind',
                    story_name='Second_Floor',
                    force_magnitude=40.0,  # 40 kN lateral force
                    load_type='shear'
                )
            ]
        ),
        
        # Shear Wall 2 - Along Y direction (between nodes 2-3 and 6-7)
        'SW_Y1': ShearWall(
            name='Shear Wall Y1',
            length=4.0,  # 4m long
            height=6.0,  # 6m high
            mesh_size=0.5,
            ky_modification_factor=0.35,
            
            materials=[
                ShearWallMaterial(
                    name='Concrete',
                    elasticity_modulus=33000.0,
                    shear_modulus=13750.0,
                    poissons_ratio=0.2,
                    density=2500.0,
                    thickness=0.20,  # 200mm thick wall
                    x_start=0.0, x_end=4.0,
                    y_start=0.0, y_end=6.0
                )
            ],
            
            # Add a window opening
            openings=[
                ShearWallOpening(
                    name='Window_1',
                    x_start=1.0,
                    y_start=3.5,
                    width=1.5,   # 1.5m wide window
                    height=1.2,  # 1.2m high window
                    tie_stiffness=None
                )
            ],
            
            supports=[
                ShearWallSupport(
                    elevation=0.0,
                    x_start=0.0,
                    x_end=4.0
                )
            ],
            
            stories=[
                ShearWallStory(
                    story_name='First_Floor',
                    elevation=3.0,
                    x_start=0.0,
                    x_end=4.0
                ),
                ShearWallStory(
                    story_name='Second_Floor',
                    elevation=6.0,
                    x_start=0.0,
                    x_end=4.0
                )
            ],
            
            loads=[
                ShearWallLoad(
                    load_id=3,
                    load_group='Wind',
                    story_name='First_Floor',
                    force_magnitude=30.0,  # 30 kN lateral force
                    load_type='shear'
                ),
                ShearWallLoad(
                    load_id=4,
                    load_group='Wind',
                    story_name='Second_Floor',
                    force_magnitude=25.0,  # 25 kN lateral force
                    load_type='shear'
                )
            ]
        )
    }
    
    # Create the complete model
    model = Model(
        settings=settings,
        details=[],
        nodes=nodes,
        members=members,
        plates=plates,
        meshed_plates={},
        materials=materials,
        sections=sections,
        supports=supports,
        settlements={},
        groups={},
        point_loads=point_loads,
        moments={},
        distributed_loads=distributed_loads,
        area_loads=area_loads,
        self_weight=self_weight,
        load_combinations=load_combinations,
        load_cases={},
        nodal_masses={},
        design_input=[],
        shear_walls=shear_walls
    )
    
    return model


if __name__ == "__main__":
    # Create and display the model
    model = create_two_storey_structure()
    print("Two-storey structure model created successfully!")
    print(f"Nodes: {len(model.nodes)}")
    print(f"Members: {len(model.members)}")
    print(f"Plates: {len(model.plates)}")
    print(f"Materials: {len(model.materials)}")
    print(f"Sections: {len(model.sections)}")
    print(f"Supports: {len(model.supports)}")
    print(f"Point loads: {len(model.point_loads)}")
    print(f"Distributed loads: {len(model.distributed_loads)}")
    print(f"Area loads (pressure): {len(model.area_loads)}")
    print(f"Load combinations: {len(model.load_combinations)}")
    print(f"Shear walls: {len(model.shear_walls)}")
    
    # Print shear wall details
    for wall_id, wall in model.shear_walls.items():
        print(f"\nShear Wall {wall_id}:")
        print(f"  - Length: {wall.length}m, Height: {wall.height}m")
        print(f"  - Materials: {len(wall.materials)}")
        print(f"  - Openings: {len(wall.openings)}")
        print(f"  - Stories: {len(wall.stories)}")
        print(f"  - Loads: {len(wall.loads)}")