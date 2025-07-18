/**
 * Utility functions for creating consistent line materials and geometries
 */

/**
 * Creates a standardized MeshLineMaterial with consistent properties
 * @param {Object} options - Configuration options
 * @param {THREE.Color|number} options.color - Line color (default: 0x404040)
 * @param {number} options.lineWidth - Line width (default: 8.0)
 * @param {string} options.elementType - Element type for color selection ('beam', 'column', etc.)
 * @param {THREE.Vector2} options.resolution - Viewport resolution
 * @returns {MeshLineMaterial} Configured material
 */
function createStandardLineMaterial(options = {}) {
    // Default colors
    const bColor = new THREE.Color(0x0000ff); // Blue for beams
    const cColor = new THREE.Color(0x008080); // Teal for columns
    const defaultColor = new THREE.Color(0x404040); // Default gray
    
    // Get viewport resolution
    const viewport = document.getElementById('viewport');
    const resolution = options.resolution || new THREE.Vector2(
        viewport ? viewport.clientWidth : 800, 
        viewport ? viewport.clientHeight : 600
    );
    
    // Determine color based on element type
    let color = options.color || defaultColor;
    if (options.elementType) {
        if (options.elementType === 'beam') {
            color = bColor;
        } else if (options.elementType === 'column') {
            color = cColor;
        }
    }
    
    // Create and return the material
    return new MeshLineMaterial({
        color: color,
        lineWidth: options.lineWidth || 8.0,
        sizeAttenuation: false,
        useMap: false,
        resolution: resolution,
        near: 0.1,
        far: 200.0
    });
}

/**
 * Creates a MeshLine from THREE.Geometry vertices
 * @param {THREE.Geometry} geometry - Geometry with vertices
 * @returns {MeshLine} Configured MeshLine
 */
function createMeshLineFromGeometry(geometry) {
    const line = new MeshLine();
    line.setGeometry(geometry);
    return line;
}

/**
 * Creates a complete line mesh with standardized material
 * @param {THREE.Geometry} geometry - Line geometry
 * @param {Object} materialOptions - Options for material creation
 * @returns {THREE.Mesh} Complete line mesh
 */
function createLineMesh(geometry, materialOptions = {}) {
    const meshLine = createMeshLineFromGeometry(geometry);
    const material = createStandardLineMaterial(materialOptions);
    return new THREE.Mesh(meshLine.geometry, material);
}

// Export functions for global use
window.LineUtils = {
    createStandardLineMaterial,
    createMeshLineFromGeometry,
    createLineMesh
};