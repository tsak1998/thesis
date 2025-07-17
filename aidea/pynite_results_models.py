"""
Pydantic models for PyNite structural analysis results.

This module provides comprehensive Pydantic models that reflect all possible
analysis results from PyNite, including:
- Nodal displacements and reactions
- Member forces (axial, shear, moment, torque)
- Member deflections
- Plate/quad stresses and forces
- A comprehensive Results model that holds everything
"""

from typing import Dict, List, Optional, Union, Literal
from pydantic import BaseModel, Field
import numpy as np
from numpy.typing import NDArray


# === Base Models for Common Patterns ===

class BaseResult(BaseModel):
    """Base class for all result types with common metadata."""
    load_combination: str = Field(description="Load combination name")
    element_id: str = Field(description="Element identifier")
    
    class Config:
        arbitrary_types_allowed = True


class Vector3D(BaseModel):
    """3D vector for forces, moments, displacements, etc."""
    x: float = Field(description="X-component")
    y: float = Field(description="Y-component") 
    z: float = Field(description="Z-component")


class LocationResult(BaseModel):
    """Result at a specific location along a member."""
    location: float = Field(description="Location along member (0 to L)")
    value: float = Field(description="Result value at this location")


# === Nodal Results ===

class NodalDisplacement(BaseResult):
    """Nodal displacement results."""
    node_id: str = Field(description="Node identifier")
    displacement: Vector3D = Field(description="Translational displacements (DX, DY, DZ)")
    rotation: Vector3D = Field(description="Rotational displacements (RX, RY, RZ)")


class NodalReaction(BaseResult):
    """Nodal reaction results."""
    node_id: str = Field(description="Node identifier")
    force: Vector3D = Field(description="Reaction forces (FX, FY, FZ)")
    moment: Vector3D = Field(description="Reaction moments (MX, MY, MZ)")


# === Member Force Results ===

class MemberAxialForce(BaseResult):
    """Axial force results along a member."""
    member_id: str = Field(description="Member identifier")
    max_axial: float = Field(description="Maximum axial force")
    min_axial: float = Field(description="Minimum axial force")
    axial_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Axial force at specific locations"
    )


class MemberShearForce(BaseResult):
    """Shear force results along a member."""
    member_id: str = Field(description="Member identifier")
    direction: Literal['Fy', 'Fz'] = Field(description="Shear direction (local axes)")
    max_shear: float = Field(description="Maximum shear force")
    min_shear: float = Field(description="Minimum shear force")
    shear_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Shear force at specific locations"
    )


class MemberMoment(BaseResult):
    """Moment results along a member."""
    member_id: str = Field(description="Member identifier")
    direction: Literal['My', 'Mz'] = Field(description="Moment direction (local axes)")
    max_moment: float = Field(description="Maximum moment")
    min_moment: float = Field(description="Minimum moment")
    moment_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Moment at specific locations"
    )


class MemberTorque(BaseResult):
    """Torsional moment results along a member."""
    member_id: str = Field(description="Member identifier")
    max_torque: float = Field(description="Maximum torque")
    min_torque: float = Field(description="Minimum torque")
    torque_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Torque at specific locations"
    )


class MemberEndForces(BaseResult):
    """Member end forces in local coordinates."""
    member_id: str = Field(description="Member identifier")
    i_end_forces: Vector3D = Field(description="Forces at i-end (Fx, Fy, Fz)")
    i_end_moments: Vector3D = Field(description="Moments at i-end (Mx, My, Mz)")
    j_end_forces: Vector3D = Field(description="Forces at j-end (Fx, Fy, Fz)")
    j_end_moments: Vector3D = Field(description="Moments at j-end (Mx, My, Mz)")


# === Member Displacement/Deflection Results ===

class MemberDeflection(BaseResult):
    """Deflection results along a member."""
    member_id: str = Field(description="Member identifier")
    direction: Literal['dx', 'dy', 'dz'] = Field(description="Deflection direction (local axes)")
    max_deflection: float = Field(description="Maximum deflection")
    min_deflection: float = Field(description="Minimum deflection")
    deflection_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Deflection at specific locations"
    )


class MemberRelativeDeflection(BaseResult):
    """Relative deflection results along a member (deflection relative to chord)."""
    member_id: str = Field(description="Member identifier")
    direction: Literal['dy', 'dz'] = Field(description="Deflection direction (local axes)")
    relative_deflection_at_locations: List[LocationResult] = Field(
        default_factory=list,
        description="Relative deflection at specific locations"
    )


# === Plate/Quad Results ===

class PlateStress(BaseModel):
    """Stress results at a point in a plate/quad element."""
    x: float = Field(description="Local x-coordinate")
    y: float = Field(description="Local y-coordinate")
    sx: float = Field(description="Normal stress in x-direction")
    sy: float = Field(description="Normal stress in y-direction")
    txy: float = Field(description="Shear stress")


class PlateMoment(BaseModel):
    """Moment results at a point in a plate/quad element."""
    x: float = Field(description="Local x-coordinate")
    y: float = Field(description="Local y-coordinate")
    mx: float = Field(description="Moment per unit length about x-axis")
    my: float = Field(description="Moment per unit length about y-axis")
    mxy: float = Field(description="Twisting moment per unit length")


class PlateShear(BaseModel):
    """Shear results at a point in a plate/quad element."""
    x: float = Field(description="Local x-coordinate")
    y: float = Field(description="Local y-coordinate")
    qx: float = Field(description="Shear force per unit length in x-direction")
    qy: float = Field(description="Shear force per unit length in y-direction")


class PlateResults(BaseResult):
    """Complete results for a plate/quad element."""
    plate_id: str = Field(description="Plate/quad identifier")
    element_type: Literal['Plate', 'Quad'] = Field(description="Element type")
    
    # Membrane (in-plane) results
    membrane_stresses: List[PlateStress] = Field(
        default_factory=list,
        description="Membrane stress results at various points"
    )
    
    # Bending results
    bending_moments: List[PlateMoment] = Field(
        default_factory=list,
        description="Bending moment results at various points"
    )
    
    # Shear results
    shear_forces: List[PlateShear] = Field(
        default_factory=list,
        description="Shear force results at various points"
    )
    
    # Corner results (common evaluation points)
    corner_stresses: Dict[str, PlateStress] = Field(
        default_factory=dict,
        description="Stress results at element corners (i, j, m, n)"
    )
    corner_moments: Dict[str, PlateMoment] = Field(
        default_factory=dict,
        description="Moment results at element corners (i, j, m, n)"
    )
    
    # Center results
    center_stress: Optional[PlateStress] = Field(
        None,
        description="Stress results at element center"
    )
    center_moment: Optional[PlateMoment] = Field(
        None,
        description="Moment results at element center"
    )


# === Comprehensive Member Results ===

class MemberResults(BaseResult):
    """Complete results for a member element."""
    member_id: str = Field(description="Member identifier")
    
    # Force results
    axial_force: MemberAxialForce
    shear_force_y: MemberShearForce
    shear_force_z: MemberShearForce
    moment_y: MemberMoment
    moment_z: MemberMoment
    torque: MemberTorque
    end_forces: MemberEndForces
    
    # Displacement results
    deflection_x: MemberDeflection
    deflection_y: MemberDeflection
    deflection_z: MemberDeflection
    relative_deflection_y: Optional[MemberRelativeDeflection] = None
    relative_deflection_z: Optional[MemberRelativeDeflection] = None


# === Shear Wall Results ===

class PierResults(BaseModel):
    """Results for a shear wall pier."""
    pier_id: str = Field(description="Pier identifier")
    x_position: float = Field(description="X-position of pier left edge")
    y_position: float = Field(description="Y-position of pier bottom edge")
    width: float = Field(description="Pier width")
    height: float = Field(description="Pier height")
    
    # Force results
    axial_force: float = Field(description="Total axial force in pier (P)")
    shear_force: float = Field(description="Total shear force in pier (V)")
    moment: float = Field(description="Total moment about pier center (M)")
    shear_span_ratio: float = Field(description="Moment to shear span ratio (M/VL)")


class CouplingBeamResults(BaseModel):
    """Results for a shear wall coupling beam."""
    beam_id: str = Field(description="Coupling beam identifier")
    x_position: float = Field(description="X-position of beam left edge")
    y_position: float = Field(description="Y-position of beam bottom edge")
    length: float = Field(description="Beam length")
    height: float = Field(description="Beam height")
    
    # Force results
    axial_force: float = Field(description="Total axial force in beam (P)")
    shear_force: float = Field(description="Total shear force in beam (V)")
    moment: float = Field(description="Total moment about beam center (M)")
    shear_span_ratio: float = Field(description="Moment to shear span ratio (M/VH)")


class ShearWallStiffness(BaseModel):
    """Stiffness results for a shear wall story."""
    story_name: str = Field(description="Story identifier")
    stiffness: float = Field(description="Story stiffness (force/displacement)")
    test_force: float = Field(description="Test force used for stiffness calculation")
    max_displacement: float = Field(description="Maximum displacement under test force")


class ShearWallResults(BaseResult):
    """Complete results for a shear wall."""
    wall_id: str = Field(description="Shear wall identifier")
    wall_length: float = Field(description="Overall wall length")
    wall_height: float = Field(description="Overall wall height")
    
    # Pier results
    pier_results: Dict[str, PierResults] = Field(
        default_factory=dict,
        description="Results for individual piers by pier ID"
    )
    
    # Coupling beam results
    coupling_beam_results: Dict[str, CouplingBeamResults] = Field(
        default_factory=dict,
        description="Results for individual coupling beams by beam ID"
    )
    
    # Story stiffness results
    story_stiffness: Dict[str, ShearWallStiffness] = Field(
        default_factory=dict,
        description="Stiffness results by story name"
    )
    
    # Overall wall results
    total_base_shear: Optional[float] = Field(
        None,
        description="Total base shear in the wall"
    )
    total_overturning_moment: Optional[float] = Field(
        None,
        description="Total overturning moment at the base"
    )
    max_drift: Optional[float] = Field(
        None,
        description="Maximum story drift"
    )


# === Load Combination Results ===

class LoadCombinationResults(BaseModel):
    """Results for a specific load combination."""
    combination_name: str = Field(description="Load combination name")
    
    # Nodal results
    nodal_displacements: Dict[str, NodalDisplacement] = Field(
        default_factory=dict,
        description="Nodal displacement results by node ID"
    )
    nodal_reactions: Dict[str, NodalReaction] = Field(
        default_factory=dict,
        description="Nodal reaction results by node ID"
    )
    
    # Member results
    member_results: Dict[str, MemberResults] = Field(
        default_factory=dict,
        description="Member results by member ID"
    )
    
    # Plate/quad results
    plate_results: Dict[str, PlateResults] = Field(
        default_factory=dict,
        description="Plate/quad results by element ID"
    )
    
    # Shear wall results
    shear_wall_results: Dict[str, ShearWallResults] = Field(
        default_factory=dict,
        description="Shear wall results by wall ID"
    )


# === Analysis Summary ===

class AnalysisSummary(BaseModel):
    """Summary information about the analysis."""
    analysis_type: Literal['Linear', 'P-Delta', 'Nonlinear TC', 'Pushover'] = Field(
        description="Type of analysis performed"
    )
    solution_time: Optional[float] = Field(None, description="Solution time in seconds")
    num_nodes: int = Field(description="Number of nodes in model")
    num_members: int = Field(description="Number of members in model")
    num_plates: int = Field(description="Number of plates/quads in model")
    num_load_combinations: int = Field(description="Number of load combinations analyzed")
    convergence_info: Optional[Dict[str, Union[str, int, float]]] = Field(
        None,
        description="Convergence information for nonlinear analyses"
    )


# === Main Results Model ===

class PyNiteResults(BaseModel):
    """
    Comprehensive PyNite analysis results model.
    
    This model contains all possible analysis results from a PyNite structural
    analysis, organized by load combination and element type.
    """
    
    # Analysis metadata
    analysis_summary: AnalysisSummary = Field(description="Analysis summary information")
    model_name: Optional[str] = Field(None, description="Name of the structural model")
    analysis_date: Optional[str] = Field(None, description="Date/time of analysis")
    
    # Results by load combination
    load_combination_results: Dict[str, LoadCombinationResults] = Field(
        default_factory=dict,
        description="Results organized by load combination name"
    )
    
    # Global extremes (across all load combinations)
    global_max_displacement: Optional[float] = Field(
        None,
        description="Maximum displacement magnitude across all nodes and combinations"
    )
    global_max_reaction: Optional[float] = Field(
        None,
        description="Maximum reaction magnitude across all nodes and combinations"
    )
    global_max_member_force: Optional[float] = Field(
        None,
        description="Maximum member force across all members and combinations"
    )
    global_max_member_moment: Optional[float] = Field(
        None,
        description="Maximum member moment across all members and combinations"
    )
    global_max_plate_stress: Optional[float] = Field(
        None,
        description="Maximum plate stress across all plates and combinations"
    )
    
    def get_nodal_displacement(self, node_id: str, combo_name: str) -> Optional[NodalDisplacement]:
        """Get nodal displacement for a specific node and load combination."""
        if combo_name in self.load_combination_results:
            return self.load_combination_results[combo_name].nodal_displacements.get(node_id)
        return None
    
    def get_member_results(self, member_id: str, combo_name: str) -> Optional[MemberResults]:
        """Get member results for a specific member and load combination."""
        if combo_name in self.load_combination_results:
            return self.load_combination_results[combo_name].member_results.get(member_id)
        return None
    
    def get_plate_results(self, plate_id: str, combo_name: str) -> Optional[PlateResults]:
        """Get plate results for a specific plate and load combination."""
        if combo_name in self.load_combination_results:
            return self.load_combination_results[combo_name].plate_results.get(plate_id)
        return None
    
    def get_shear_wall_results(self, wall_id: str, combo_name: str) -> Optional[ShearWallResults]:
        """Get shear wall results for a specific wall and load combination."""
        if combo_name in self.load_combination_results:
            return self.load_combination_results[combo_name].shear_wall_results.get(wall_id)
        return None
    
    def get_all_combinations(self) -> List[str]:
        """Get list of all load combination names."""
        return list(self.load_combination_results.keys())
    
    def get_max_displacement_by_combo(self, combo_name: str) -> Optional[float]:
        """Get maximum displacement magnitude for a specific load combination."""
        if combo_name not in self.load_combination_results:
            return None
        
        max_disp = 0.0
        combo_results = self.load_combination_results[combo_name]
        
        for disp in combo_results.nodal_displacements.values():
            # Calculate magnitude of displacement vector
            disp_mag = (disp.displacement.x**2 + disp.displacement.y**2 + disp.displacement.z**2)**0.5
            max_disp = max(max_disp, disp_mag)
        
        return max_disp
    
    def get_max_member_moment_by_combo(self, combo_name: str) -> Optional[float]:
        """Get maximum member moment for a specific load combination."""
        if combo_name not in self.load_combination_results:
            return None
        
        max_moment = 0.0
        combo_results = self.load_combination_results[combo_name]
        
        for member_result in combo_results.member_results.values():
            max_moment = max(max_moment, abs(member_result.moment_y.max_moment))
            max_moment = max(max_moment, abs(member_result.moment_y.min_moment))
            max_moment = max(max_moment, abs(member_result.moment_z.max_moment))
            max_moment = max(max_moment, abs(member_result.moment_z.min_moment))
        
        return max_moment


# === Utility Functions for Creating Results ===

def create_member_results_from_pynite(pynite_member, combo_name: str) -> MemberResults:
    """
    Create MemberResults from a PyNite Member3D object.
    
    Args:
        pynite_member: PyNite Member3D object
        combo_name: Load combination name
        
    Returns:
        MemberResults object populated with data from PyNite member
    """
    
    # Create axial force results
    axial_force = MemberAxialForce(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        max_axial=pynite_member.max_axial(combo_name),
        min_axial=pynite_member.min_axial(combo_name)
    )
    
    # Create shear force results
    shear_force_y = MemberShearForce(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='Fy',
        max_shear=pynite_member.max_shear('Fy', combo_name),
        min_shear=pynite_member.min_shear('Fy', combo_name)
    )
    
    shear_force_z = MemberShearForce(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='Fz',
        max_shear=pynite_member.max_shear('Fz', combo_name),
        min_shear=pynite_member.min_shear('Fz', combo_name)
    )
    
    # Create moment results
    moment_y = MemberMoment(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='My',
        max_moment=pynite_member.max_moment('My', combo_name),
        min_moment=pynite_member.min_moment('My', combo_name)
    )
    
    moment_z = MemberMoment(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='Mz',
        max_moment=pynite_member.max_moment('Mz', combo_name),
        min_moment=pynite_member.min_moment('Mz', combo_name)
    )
    
    # Create torque results
    torque = MemberTorque(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        max_torque=pynite_member.max_torque(combo_name),
        min_torque=pynite_member.min_torque(combo_name)
    )
    
    # Get end forces
    end_forces_vector = pynite_member.f(combo_name)
    end_forces = MemberEndForces(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        i_end_forces=Vector3D(x=end_forces_vector[0,0], y=end_forces_vector[1,0], z=end_forces_vector[2,0]),
        i_end_moments=Vector3D(x=end_forces_vector[3,0], y=end_forces_vector[4,0], z=end_forces_vector[5,0]),
        j_end_forces=Vector3D(x=end_forces_vector[6,0], y=end_forces_vector[7,0], z=end_forces_vector[8,0]),
        j_end_moments=Vector3D(x=end_forces_vector[9,0], y=end_forces_vector[10,0], z=end_forces_vector[11,0])
    )
    
    # Create deflection results
    deflection_x = MemberDeflection(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='dx',
        max_deflection=pynite_member.max_deflection('dx', combo_name),
        min_deflection=pynite_member.min_deflection('dx', combo_name)
    )
    
    deflection_y = MemberDeflection(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='dy',
        max_deflection=pynite_member.max_deflection('dy', combo_name),
        min_deflection=pynite_member.min_deflection('dy', combo_name)
    )
    
    deflection_z = MemberDeflection(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        direction='dz',
        max_deflection=pynite_member.max_deflection('dz', combo_name),
        min_deflection=pynite_member.min_deflection('dz', combo_name)
    )
    
    return MemberResults(
        load_combination=combo_name,
        element_id=pynite_member.name,
        member_id=pynite_member.name,
        axial_force=axial_force,
        shear_force_y=shear_force_y,
        shear_force_z=shear_force_z,
        moment_y=moment_y,
        moment_z=moment_z,
        torque=torque,
        end_forces=end_forces,
        deflection_x=deflection_x,
        deflection_y=deflection_y,
        deflection_z=deflection_z
    )


def create_nodal_displacement_from_pynite(pynite_node, combo_name: str) -> NodalDisplacement:
    """
    Create NodalDisplacement from a PyNite Node3D object.
    
    Args:
        pynite_node: PyNite Node3D object
        combo_name: Load combination name
        
    Returns:
        NodalDisplacement object populated with data from PyNite node
    """
    return NodalDisplacement(
        load_combination=combo_name,
        element_id=pynite_node.name,
        node_id=pynite_node.name,
        displacement=Vector3D(
            x=pynite_node.DX.get(combo_name, 0.0),
            y=pynite_node.DY.get(combo_name, 0.0),
            z=pynite_node.DZ.get(combo_name, 0.0)
        ),
        rotation=Vector3D(
            x=pynite_node.RX.get(combo_name, 0.0),
            y=pynite_node.RY.get(combo_name, 0.0),
            z=pynite_node.RZ.get(combo_name, 0.0)
        )
    )


def create_nodal_reaction_from_pynite(pynite_node, combo_name: str) -> NodalReaction:
    """
    Create NodalReaction from a PyNite Node3D object.
    
    Args:
        pynite_node: PyNite Node3D object
        combo_name: Load combination name
        
    Returns:
        NodalReaction object populated with data from PyNite node
    """
    return NodalReaction(
        load_combination=combo_name,
        element_id=pynite_node.name,
        node_id=pynite_node.name,
        force=Vector3D(
            x=pynite_node.RxnFX.get(combo_name, 0.0),
            y=pynite_node.RxnFY.get(combo_name, 0.0),
            z=pynite_node.RxnFZ.get(combo_name, 0.0)
        ),
        moment=Vector3D(
            x=pynite_node.RxnMX.get(combo_name, 0.0),
            y=pynite_node.RxnMY.get(combo_name, 0.0),
            z=pynite_node.RxnMZ.get(combo_name, 0.0)
        )
    )


def create_plate_results_from_pynite(pynite_plate, combo_name: str) -> PlateResults:
    """
    Create PlateResults from a PyNite Plate3D or Quad3D object.
    
    Args:
        pynite_plate: PyNite Plate3D or Quad3D object
        combo_name: Load combination name
        
    Returns:
        PlateResults object populated with data from PyNite plate
    """
    
    # Determine element type
    element_type = 'Plate' if hasattr(pynite_plate, 'type') and pynite_plate.type == 'Rect' else 'Quad'
    
    # Get corner results (common evaluation points)
    corner_stresses = {}
    corner_moments = {}
    
    # For plates/quads, evaluate at corners in natural coordinates
    corner_coords = [(-1, -1), (1, -1), (1, 1), (-1, 1)]  # xi, eta coordinates
    corner_names = ['i', 'j', 'm', 'n']
    
    for i, (xi, eta) in enumerate(corner_coords):
        corner_name = corner_names[i]
        
        # Get membrane stresses
        if hasattr(pynite_plate, 'membrane'):
            membrane_result = pynite_plate.membrane(xi, eta, local=True, combo_name=combo_name)
            corner_stresses[corner_name] = PlateStress(
                x=xi, y=eta,
                sx=float(membrane_result[0]),
                sy=float(membrane_result[1]),
                txy=float(membrane_result[2])
            )
        
        # Get bending moments
        if hasattr(pynite_plate, 'moment'):
            moment_result = pynite_plate.moment(xi, eta, local=True, combo_name=combo_name)
            corner_moments[corner_name] = PlateMoment(
                x=xi, y=eta,
                mx=float(moment_result[0]),
                my=float(moment_result[1]),
                mxy=float(moment_result[2])
            )
    
    # Get center results
    center_stress = None
    center_moment = None
    
    if hasattr(pynite_plate, 'membrane'):
        membrane_result = pynite_plate.membrane(0, 0, local=True, combo_name=combo_name)
        center_stress = PlateStress(
            x=0, y=0,
            sx=float(membrane_result[0]),
            sy=float(membrane_result[1]),
            txy=float(membrane_result[2])
        )
    
    if hasattr(pynite_plate, 'moment'):
        moment_result = pynite_plate.moment(0, 0, local=True, combo_name=combo_name)
        center_moment = PlateMoment(
            x=0, y=0,
            mx=float(moment_result[0]),
            my=float(moment_result[1]),
            mxy=float(moment_result[2])
        )
    
    return PlateResults(
        load_combination=combo_name,
        element_id=pynite_plate.name,
        plate_id=pynite_plate.name,
        element_type=element_type,
        corner_stresses=corner_stresses,
        corner_moments=corner_moments,
        center_stress=center_stress,
        center_moment=center_moment
    )


def create_pier_results_from_pynite(pynite_pier, combo_name: str) -> PierResults:
    """
    Create PierResults from a PyNite Pier object.
    
    Args:
        pynite_pier: PyNite Pier object
        combo_name: Load combination name
        
    Returns:
        PierResults object populated with data from PyNite pier
    """
    # Get pier forces
    P, M, V, M_VL = pynite_pier.sum_forces(combo_name)
    
    return PierResults(
        pier_id=pynite_pier.name,
        x_position=pynite_pier.x,
        y_position=pynite_pier.y,
        width=pynite_pier.width,
        height=pynite_pier.height,
        axial_force=P,
        shear_force=V,
        moment=M,
        shear_span_ratio=M_VL
    )


def create_coupling_beam_results_from_pynite(pynite_beam, combo_name: str) -> CouplingBeamResults:
    """
    Create CouplingBeamResults from a PyNite CouplingBeam object.
    
    Args:
        pynite_beam: PyNite CouplingBeam object
        combo_name: Load combination name
        
    Returns:
        CouplingBeamResults object populated with data from PyNite coupling beam
    """
    # Get coupling beam forces
    P, M, V, M_VH = pynite_beam.sum_forces(combo_name)
    
    return CouplingBeamResults(
        beam_id=pynite_beam.name,
        x_position=pynite_beam.x,
        y_position=pynite_beam.y,
        length=pynite_beam.length,
        height=pynite_beam.height,
        axial_force=P,
        shear_force=V,
        moment=M,
        shear_span_ratio=M_VH
    )


def create_shear_wall_results_from_pynite(pynite_shear_wall, combo_name: str) -> ShearWallResults:
    """
    Create ShearWallResults from a PyNite ShearWall object.
    
    Args:
        pynite_shear_wall: PyNite ShearWall object
        combo_name: Load combination name
        
    Returns:
        ShearWallResults object populated with data from PyNite shear wall
    """
    
    # Create pier results
    pier_results = {}
    for pier_id, pier in pynite_shear_wall.piers.items():
        pier_results[pier_id] = create_pier_results_from_pynite(pier, combo_name)
    
    # Create coupling beam results
    coupling_beam_results = {}
    for beam_id, beam in pynite_shear_wall.coupling_beams.items():
        coupling_beam_results[beam_id] = create_coupling_beam_results_from_pynite(beam, combo_name)
    
    # Create story stiffness results
    story_stiffness = {}
    for story in pynite_shear_wall._stories:
        story_name = story[0]
        try:
            stiffness_value = pynite_shear_wall.stiffness(story_name)
            story_stiffness[story_name] = ShearWallStiffness(
                story_name=story_name,
                stiffness=stiffness_value,
                test_force=100.0,  # PyNite uses 100 kips for stiffness calculation
                max_displacement=100.0 / stiffness_value if stiffness_value > 0 else 0.0
            )
        except:
            # If stiffness calculation fails, create a placeholder
            story_stiffness[story_name] = ShearWallStiffness(
                story_name=story_name,
                stiffness=0.0,
                test_force=100.0,
                max_displacement=0.0
            )
    
    return ShearWallResults(
        load_combination=combo_name,
        element_id=f"ShearWall_{id(pynite_shear_wall)}",
        wall_id=f"ShearWall_{id(pynite_shear_wall)}",
        wall_length=pynite_shear_wall.L or 0.0,
        wall_height=pynite_shear_wall.H or 0.0,
        pier_results=pier_results,
        coupling_beam_results=coupling_beam_results,
        story_stiffness=story_stiffness
    )