from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel


# === Base classes for common patterns ===

class BaseOffset(BaseModel):
    offset_Ax: str
    offset_Ay: str
    offset_Az: str
    offset_Bx: str
    offset_By: str
    offset_Bz: str


class BaseStiffness(BaseModel):
    stiffness_A_Ry: float
    stiffness_A_Rz: float
    stiffness_B_Ry: float
    stiffness_B_Rz: float


class BaseLoad(BaseModel):
    load_id: int
    load_group: str


class BaseAxes(BaseModel):
    axes: Literal["global", "local"] = "global"


# === Models ===

class SettingsUnits(BaseModel):
    length: str = 'm'
    section_length: str = 'mm'
    material_strength: str = 'mpa'
    density: str = 'kg/m3'
    force: str = 'kn'
    moment: str = 'kn-m'
    pressure: str = 'kpa'
    mass: str = 'kg'
    translation: str = 'mm'
    stress: str = 'mpa'


class Settings(BaseModel):
    units: SettingsUnits = SettingsUnits()
    precision: str = 'fixed'
    precision_values: int = 3
    vertical_axis: str = 'Z'
    member_offsets_axis: str = 'local'
    solver_timeout: int = 600
    smooth_plate_nodal_results: bool = True
    auto_stabilize_model: bool = False
    only_solve_user_defined_load_combinations: bool = False


class Node(BaseModel):
    x: float
    y: float
    z: float


class Member(BaseOffset, BaseStiffness):
    type: str
    node_A: int
    node_B: int
    section_id: int
    rotation_angle: int
    fixity_A: str
    fixity_B: str


class Material(BaseModel):
    id: Optional[int]
    name: str
    elasticity_modulus: float
    shear_modulus: Optional[float]
    density: float
    poissons_ratio: float
    yield_strength: Optional[float]
    ultimate_strength: Optional[float]
    thermal_expansion_coefficient: Optional[float]
    aux: Optional[Any] = None


class Section(BaseModel):
    version: int
    name: str
    area: float
    Iz: float
    Iy: float
    material_id: int
    aux: Optional[Any] = None
    J: Optional[float] = None


class Plate(BaseModel):
    type: str = "plate"
    nodes: List[int]  # List of node IDs that define the plate corners
    material_id: int
    thickness: float
    membrane_thickness: Optional[float] = None
    bending_thickness: Optional[float] = None


class Support(BaseModel):
    tx: float = 0
    ty: float = 0
    tz: float = 0
    rx: float = 0
    ry: float = 0
    rz: float = 0
    node: int
    restraint_code: str


class PointLoad(BaseLoad):
    type: Literal['n', 'm'] = 'n'
    node: str | None = None
    member: str | None = None
    x_mag: float
    y_mag: float
    z_mag: float


class DistributedLoad(BaseLoad, BaseAxes):
    member: int | str
    x_mag_A: float = 0
    y_mag_A: float = 0
    z_mag_A: float = 0
    x_mag_B: float = 0
    y_mag_B: float = 0
    z_mag_B: float = 0
    position_A: float = 0
    position_B: float = 100


class Pressure(BaseLoad, BaseAxes):
    plate_id: int
    x_mag: float = 0
    y_mag: float = 0
    z_mag: float = 0


class SelfWeight(BaseModel):
    x: float
    y: float
    z: float
    load_group: str


class LoadCombination(BaseModel):
    model_config = {"extra": "allow"}
    
    name: str
    criteria: str


class LoadCases(BaseModel):
    AISC: Dict[str, str] = {}


# === Shear Wall Models ===

class ShearWallMaterial(BaseModel):
    """Material definition for shear wall regions."""
    name: str
    elasticity_modulus: float
    shear_modulus: float
    poissons_ratio: float
    density: float
    thickness: float
    x_start: Optional[float] = None
    x_end: Optional[float] = None
    y_start: Optional[float] = None
    y_end: Optional[float] = None


class ShearWallOpening(BaseModel):
    """Opening definition in a shear wall."""
    name: str
    x_start: float
    y_start: float
    width: float
    height: float
    tie_stiffness: Optional[float] = None  # AE value for tie above opening


class ShearWallFlange(BaseModel):
    """Flange (wall return) definition for a shear wall."""
    thickness: float
    width: float
    x_position: float
    y_start: float
    y_end: float
    material_name: str
    side: Literal["NS", "FS"]  # Near Side or Far Side


class ShearWallSupport(BaseModel):
    """Support definition for a shear wall."""
    elevation: float = 0.0
    x_start: Optional[float] = None
    x_end: Optional[float] = None


class ShearWallStory(BaseModel):
    """Story/floor definition for a shear wall."""
    story_name: str
    elevation: float
    x_start: Optional[float] = None
    x_end: Optional[float] = None


class ShearWallLoad(BaseLoad):
    """Load applied to a shear wall story."""
    story_name: str
    force_magnitude: float
    load_type: Literal["shear", "axial"] = "shear"


class ShearWall(BaseModel):
    """
    Shear wall definition for lateral force resistance.
    
    A shear wall resists loads parallel to the plane of the wall and is typically
    used to resist wind and seismic forces. This model supports complex geometries
    with openings, flanges, and multiple materials.
    """
    name: str
    length: float  # Overall wall length
    height: float  # Overall wall height
    mesh_size: float = 1.0  # Desired mesh size for finite element analysis
    ky_modification_factor: float = 0.35  # Stiffness reduction for cracking
    
    # Materials - can have multiple materials in different regions
    materials: List[ShearWallMaterial] = []
    
    # Geometric features
    openings: List[ShearWallOpening] = []
    flanges: List[ShearWallFlange] = []
    
    # Boundary conditions and loading
    supports: List[ShearWallSupport] = []
    stories: List[ShearWallStory] = []
    loads: List[ShearWallLoad] = []
    
    # Analysis options
    include_pier_analysis: bool = True
    include_coupling_beam_analysis: bool = True


class Model(BaseModel):
    settings: Settings
    details: List[Any]
    nodes: Dict[str, Node]
    members: Dict[str, Member]
    plates: Dict[str, Plate]
    meshed_plates: Dict[str, Any]
    materials: Dict[str, Material]
    sections: Dict[str, Section]
    supports: Dict[str, Support]
    settlements: Dict[str, Any]
    groups: Dict[str, Any]
    point_loads: Dict[str, PointLoad]
    moments: Dict[str, Any]
    distributed_loads: Dict[str, DistributedLoad]
    area_loads: Dict[str, Pressure]
    self_weight: Dict[str, SelfWeight]
    load_combinations: Dict[str, LoadCombination]
    load_cases: LoadCases
    nodal_masses: Dict[str, Any]
    design_input: List[Any]
    shear_walls: Dict[str, ShearWall] = {}


