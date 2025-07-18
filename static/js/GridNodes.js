/**
 * Grid Nodes System for CAD Interface
 * Uses THREE.js GridHelper for efficient 3D grid visualization
 */

var GridNodes = function(editor) {
    var scope = this;
    this.editor = editor;
    this.signals = editor.signals;
    
    // Grid configuration - NEW SPECIFICATIONS: 10m × 10m × 10m grid volume
    this.config = {
        enabled: false,
        // Start position (origin)
        startPosition: { x: 0, y: 0, z: 0 },
        // Grid size (spacing between grid lines)
        gridSize: 2.0, // 2.0 m spacing (changed from 0.5)
        // Total size (extents)
        totalSize: { x: 10, y: 10, z: 10 }, // 10 m extents in X, Y, Z
        // Level height (between floors)
        levelHeight: 10, // 10 m between floors
        // Number of levels (base + extras)
        numberOfLevels: 4, // base + 3 extras
        transparency: 0.3, // Grid transparency (0-1) - semi-transparent
        color: 0x888888, // Grid line color (gray)
        centerLineColor: 0x444444, // Center line color (darker gray)
        snapTolerance: 0.25, // Maximum distance for snapping to grid intersections
        snapEnabled: true, // Enable/disable grid snapping
        // Individual plane visibility
        planes: {
            xz: false, // Horizontal planes (XZ at different Y levels) - OFF
            xy: false, // Vertical planes (XY at different Z levels) - OFF
            yz: true   // Vertical planes (YZ at different X levels) - ACTIVE (YZ only)
        }
    };
    
    // Grid state
    this.gridContainer = null;
    this.wireframeCube = null;
    this.globalAxes = null;
    this.isVisible = false;
    this.gridHelpers = {
        xz: [], // Horizontal planes (XZ at different Y levels)
        xy: [], // Vertical planes (XY at different Z levels)
        yz: []  // Vertical planes (YZ at different X levels)
    };
    this.nodePositions = [];
    
    // Visual feedback for snapping
    this.snapIndicator = null;
    this.snapIndicatorTimeout = null;
    
    // Initialize
    this.init();
};

GridNodes.prototype = {
    
    init: function() {
        this.createGridContainer();
        this.createWireframeCube();
        this.createGlobalAxes();
        this.createSnapIndicator();
        this.setupEventListeners();
        console.log('Grid Nodes system initialized with 10m × 10m × 10m grid volume');
    },
    
    createSnapIndicator: function() {
        // Create a visual indicator for snapping
        var geometry = new THREE.SphereGeometry(0.2, 8, 6);
        var material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        this.snapIndicator = new THREE.Mesh(geometry, material);
        this.snapIndicator.name = 'SnapIndicator';
        this.snapIndicator.visible = false;
        this.snapIndicator.renderOrder = 1000; // Render on top
        this.editor.scene.add(this.snapIndicator);
    },
    
    showSnapIndicator: function(position, duration) {
        if (!this.snapIndicator) return;
        
        duration = duration || 500; // Default 500ms
        
        this.snapIndicator.position.copy(position);
        this.snapIndicator.visible = true;
        
        // Clear any existing timeout
        if (this.snapIndicatorTimeout) {
            clearTimeout(this.snapIndicatorTimeout);
        }
        
        // Hide after duration
        var scope = this;
        this.snapIndicatorTimeout = setTimeout(function() {
            if (scope.snapIndicator) {
                scope.snapIndicator.visible = false;
            }
        }, duration);
        
        // Trigger render update
        if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
            this.editor.signals.sceneGraphChanged.dispatch();
        }
    },
    
    hideSnapIndicator: function() {
        if (this.snapIndicator) {
            this.snapIndicator.visible = false;
            
            if (this.snapIndicatorTimeout) {
                clearTimeout(this.snapIndicatorTimeout);
                this.snapIndicatorTimeout = null;
            }
            
            // Trigger render update
            if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
                this.editor.signals.sceneGraphChanged.dispatch();
            }
        }
    },
    
    createGridContainer: function() {
        this.gridContainer = new THREE.Object3D();
        this.gridContainer.name = 'GridNodes';
        this.gridContainer.visible = false;
        this.editor.scene.add(this.gridContainer);
    },
    
    createWireframeCube: function() {
        // Create wireframe cube to visualize the 10m × 10m × 10m grid volume
        var size = this.config.totalSize;
        var geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        var edges = new THREE.EdgesGeometry(geometry);
        var material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.6,
            linewidth: 8 // Make lines thicker
        });
        
        this.wireframeCube = new THREE.LineSegments(edges, material);
        this.wireframeCube.name = 'WireframeCube';
        this.wireframeCube.position.set(
            this.config.startPosition.x,
            this.config.startPosition.y,
            this.config.startPosition.z
        );
        
        this.gridContainer.add(this.wireframeCube);
        console.log('Created wireframe cube for 10m × 10m × 10m grid volume');
    },
    
    createGlobalAxes: function() {
        // Create global X-, Y-, Z-axes arrows (red, green, blue)
        this.globalAxes = new THREE.Object3D();
        this.globalAxes.name = 'GlobalAxes';
        
        var axisLength = 6; // 6 meter arrows
        var origin = new THREE.Vector3(
            this.config.startPosition.x,
            this.config.startPosition.y,
            this.config.startPosition.z
        );
        
        // X-axis (Red)
        var xDirection = new THREE.Vector3(1, 0, 0);
        var xArrow = new THREE.ArrowHelper(xDirection, origin, axisLength, 0xff0000, axisLength * 0.2, axisLength * 0.1);
        xArrow.name = 'X-Axis';
        this.globalAxes.add(xArrow);
        
        // Y-axis (Green)
        var yDirection = new THREE.Vector3(0, 1, 0);
        var yArrow = new THREE.ArrowHelper(yDirection, origin, axisLength, 0x00ff00, axisLength * 0.2, axisLength * 0.1);
        yArrow.name = 'Y-Axis';
        this.globalAxes.add(yArrow);
        
        // Z-axis (Blue)
        var zDirection = new THREE.Vector3(0, 0, 1);
        var zArrow = new THREE.ArrowHelper(zDirection, origin, axisLength, 0x0000ff, axisLength * 0.2, axisLength * 0.1);
        zArrow.name = 'Z-Axis';
        this.globalAxes.add(zArrow);
        
        this.gridContainer.add(this.globalAxes);
        console.log('Created global X-, Y-, Z-axes (red, green, blue)');
    },
    
    generateGrid: function() {
        this.clearGrid();
        
        var config = this.config;
        var planes = config.planes;
        var totalSize = config.totalSize;
        var gridSize = config.gridSize;
        var numberOfLevels = config.numberOfLevels;
        var levelHeight = config.levelHeight;
        
        // Calculate number of divisions for each direction based on grid size
        var divisionsX = Math.floor(totalSize.x / gridSize);
        var divisionsY = Math.floor(totalSize.y / gridSize);
        var divisionsZ = Math.floor(totalSize.z / gridSize);
        
        // Create XZ plane grids (horizontal) - floor levels
        if (planes.xz) {
            for (var level = 0; level < numberOfLevels; level++) {
                var y = config.startPosition.y + (level * levelHeight / (numberOfLevels - 1)) - totalSize.y / 2;
                
                var gridXZ = new THREE.GridHelper(totalSize.x, divisionsX, config.centerLineColor, config.color);
                gridXZ.position.set(config.startPosition.x, y, config.startPosition.z);
                gridXZ.material.transparent = true;
                gridXZ.material.opacity = config.transparency;
                gridXZ.userData.planeType = 'xz';
                gridXZ.userData.level = level;
                this.gridHelpers.xz.push(gridXZ);
                this.gridContainer.add(gridXZ);
            }
        }
        
        // Create XY plane grids (vertical) - elevation planes
        if (planes.xy) {
            var numVerticalPlanes = Math.floor(totalSize.z / gridSize) + 1;
            for (var i = 0; i < numVerticalPlanes; i++) {
                var z = config.startPosition.z - totalSize.z / 2 + (i * gridSize);
                
                var gridXY = new THREE.GridHelper(Math.max(totalSize.x, totalSize.y), Math.max(divisionsX, divisionsY), config.centerLineColor, config.color);
                gridXY.rotation.x = Math.PI / 2;
                gridXY.position.set(config.startPosition.x, config.startPosition.y, z);
                gridXY.material.transparent = true;
                gridXY.material.opacity = config.transparency * 0.6;
                gridXY.userData.planeType = 'xy';
                this.gridHelpers.xy.push(gridXY);
                this.gridContainer.add(gridXY);
            }
        }
        
        // Create YZ plane grids (vertical) - side elevation planes
        if (planes.yz) {
            var numSidePlanes = Math.floor(totalSize.x / gridSize) + 1;
            for (var j = 0; j < numSidePlanes; j++) {
                var x = config.startPosition.x - totalSize.x / 2 + (j * gridSize);
                
                var gridYZ = new THREE.GridHelper(Math.max(totalSize.y, totalSize.z), Math.max(divisionsY, divisionsZ), config.centerLineColor, config.color);
                gridYZ.rotation.z = Math.PI / 2;
                gridYZ.position.set(x, config.startPosition.y, config.startPosition.z);
                gridYZ.material.transparent = true;
                gridYZ.material.opacity = config.transparency * 0.6;
                gridYZ.userData.planeType = 'yz';
                this.gridHelpers.yz.push(gridYZ);
                this.gridContainer.add(gridYZ);
            }
        }
        
        // Generate node positions for snapping
        this.generateNodePositions();
        
        var totalGrids = this.gridHelpers.xz.length + this.gridHelpers.xy.length + this.gridHelpers.yz.length;
        console.log(`Generated 10m × 10m × 10m grid system - ${totalGrids} grid planes, ${this.nodePositions.length} snap points`);
        console.log(`Grid spacing: ${gridSize}m, Levels: ${numberOfLevels}, Level height: ${levelHeight}m`);
        console.log(`Plane visibility: XZ=${planes.xz}, XY=${planes.xy}, YZ=${planes.yz}`);
        this.updateGridVisuals();
    },
    
    generateNodePositions: function() {
        // Generate snap points for the new grid system
        this.nodePositions = [];
        var config = this.config;
        var totalSize = config.totalSize;
        var gridSize = config.gridSize;
        var startPos = config.startPosition;
        
        // Calculate number of grid points in each direction
        var pointsX = Math.floor(totalSize.x / gridSize) + 1;
        var pointsY = Math.floor(totalSize.y / gridSize) + 1;
        var pointsZ = Math.floor(totalSize.z / gridSize) + 1;
        
        // Generate grid intersection points
        for (var i = 0; i < pointsX; i++) {
            for (var j = 0; j < pointsY; j++) {
                for (var k = 0; k < pointsZ; k++) {
                    var x = startPos.x - totalSize.x/2 + i * gridSize;
                    var y = startPos.y - totalSize.y/2 + j * gridSize;
                    var z = startPos.z - totalSize.z/2 + k * gridSize;
                    this.nodePositions.push(new THREE.Vector3(x, y, z));
                }
            }
        }
        
        console.log(`Generated ${this.nodePositions.length} snap points (${pointsX}×${pointsY}×${pointsZ})`);
    },
    
    clearGrid: function() {
        // Remove all grid helpers by plane type
        var planeTypes = ['xz', 'xy', 'yz'];
        for (var p = 0; p < planeTypes.length; p++) {
            var planeType = planeTypes[p];
            for (var i = 0; i < this.gridHelpers[planeType].length; i++) {
                var grid = this.gridHelpers[planeType][i];
                if (grid.material) grid.material.dispose();
                if (grid.geometry) grid.geometry.dispose();
                this.gridContainer.remove(grid);
            }
            this.gridHelpers[planeType] = [];
        }
        
        // Clean up wireframe cube
        if (this.wireframeCube) {
            if (this.wireframeCube.material) this.wireframeCube.material.dispose();
            if (this.wireframeCube.geometry) this.wireframeCube.geometry.dispose();
            this.gridContainer.remove(this.wireframeCube);
            this.wireframeCube = null;
        }
        
        // Clean up global axes
        if (this.globalAxes) {
            this.globalAxes.traverse(function(child) {
                if (child.material) child.material.dispose();
                if (child.geometry) child.geometry.dispose();
            });
            this.gridContainer.remove(this.globalAxes);
            this.globalAxes = null;
        }
        
        this.nodePositions = [];
    },
    
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.setVisible(this.config.enabled);
        
        if (this.config.enabled) {
            // Recreate wireframe cube and axes if they don't exist
            if (!this.wireframeCube) {
                this.createWireframeCube();
            }
            if (!this.globalAxes) {
                this.createGlobalAxes();
            }
            // Generate grid if it doesn't exist
            var totalGrids = this.gridHelpers.xz.length + this.gridHelpers.xy.length + this.gridHelpers.yz.length;
            if (totalGrids === 0) {
                this.generateGrid();
            }
        }
        
        console.log('Grid Nodes', this.config.enabled ? 'enabled' : 'disabled');
        return this.config.enabled;
    },
    
    setVisible: function(visible) {
        this.isVisible = visible;
        if (this.gridContainer) {
            this.gridContainer.visible = visible;
        }
        
        // Trigger render update
        if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
            this.editor.signals.sceneGraphChanged.dispatch();
        }
    },
    
    updateGridSize: function(gridSize) {
        this.config.gridSize = Math.max(0.1, parseFloat(gridSize) || 0.5);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    updateTotalSize: function(sizeX, sizeY, sizeZ) {
        this.config.totalSize.x = Math.max(1, parseFloat(sizeX) || 10);
        this.config.totalSize.y = Math.max(1, parseFloat(sizeY) || 10);
        this.config.totalSize.z = Math.max(1, parseFloat(sizeZ) || 10);
        
        if (this.config.enabled) {
            // Recreate wireframe cube with new size
            this.clearGrid();
            this.createWireframeCube();
            this.createGlobalAxes();
            this.generateGrid();
        }
    },
    
    updateNumberOfLevels: function(levels) {
        this.config.numberOfLevels = Math.max(1, parseInt(levels) || 4);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    updateLevelHeight: function(height) {
        this.config.levelHeight = Math.max(1, parseFloat(height) || 10);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    updateStartPosition: function(x, y, z) {
        this.config.startPosition.x = parseFloat(x) || 0;
        this.config.startPosition.y = parseFloat(y) || 0;
        this.config.startPosition.z = parseFloat(z) || 0;
        
        if (this.config.enabled) {
            // Recreate everything with new start position
            this.clearGrid();
            this.createWireframeCube();
            this.createGlobalAxes();
            this.generateGrid();
        }
    },
    
    updateTransparency: function(transparency) {
        this.config.transparency = Math.max(0.1, Math.min(1.0, parseFloat(transparency) || 0.3));
        this.updateGridVisuals();
    },
    
    updateGridVisuals: function() {
        // Update material properties for all grid helpers by plane type
        var planeTypes = ['xz', 'xy', 'yz'];
        for (var p = 0; p < planeTypes.length; p++) {
            var planeType = planeTypes[p];
            for (var i = 0; i < this.gridHelpers[planeType].length; i++) {
                var grid = this.gridHelpers[planeType][i];
                if (grid.material) {
                    // XZ plane grids (horizontal) get full opacity
                    if (planeType === 'xz') {
                        grid.material.opacity = this.config.transparency;
                    } else {
                        // Vertical grids get slightly reduced opacity but more visible than before
                        grid.material.opacity = this.config.transparency * 0.7;
                    }
                    grid.material.needsUpdate = true;
                }
            }
        }
    },
    
    togglePlane: function(planeType) {
        if (!this.config.planes.hasOwnProperty(planeType)) {
            console.warn('Invalid plane type:', planeType);
            return false;
        }
        
        this.config.planes[planeType] = !this.config.planes[planeType];
        
        // Show/hide existing grids of this type
        for (var i = 0; i < this.gridHelpers[planeType].length; i++) {
            var grid = this.gridHelpers[planeType][i];
            grid.visible = this.config.planes[planeType];
        }
        
        // If grid is enabled, regenerate to add/remove planes
        if (this.config.enabled) {
            this.generateGrid();
        }
        
        console.log(`Plane ${planeType.toUpperCase()} toggled:`, this.config.planes[planeType]);
        return this.config.planes[planeType];
    },
    
    setPlaneVisibility: function(planeType, visible) {
        if (!this.config.planes.hasOwnProperty(planeType)) {
            console.warn('Invalid plane type:', planeType);
            return;
        }
        
        this.config.planes[planeType] = visible;
        
        // Show/hide existing grids of this type
        for (var i = 0; i < this.gridHelpers[planeType].length; i++) {
            var grid = this.gridHelpers[planeType][i];
            grid.visible = visible;
        }
        
        // If grid is enabled, regenerate to add/remove planes
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    setSnapTolerance: function(tolerance) {
        this.config.snapTolerance = Math.max(0.1, Math.min(10.0, parseFloat(tolerance) || 1.0));
        console.log('Grid snap tolerance set to:', this.config.snapTolerance);
    },
    
    setSnapEnabled: function(enabled) {
        this.config.snapEnabled = Boolean(enabled);
        console.log('Grid snapping', this.config.snapEnabled ? 'enabled' : 'disabled');
    },
    
    toggleSnap: function() {
        this.config.snapEnabled = !this.config.snapEnabled;
        console.log('Grid snapping', this.config.snapEnabled ? 'enabled' : 'disabled');
        return this.config.snapEnabled;
    },
    
    getNodeAt: function(position, tolerance) {
        tolerance = tolerance || 0.5;
        
        if (!this.nodePositions || this.nodePositions.length === 0) {
            return null;
        }
        
        for (var i = 0; i < this.nodePositions.length; i++) {
            var nodePos = this.nodePositions[i];
            if (nodePos && nodePos.distanceTo) {
                var distance = nodePos.distanceTo(position);
                if (distance <= tolerance) {
                    return { position: nodePos, index: i };
                }
            }
        }
        return null;
    },
    
    snapToGrid: function(position, tolerance) {
        if (!this.config.enabled || !this.config.snapEnabled) return position;
        
        tolerance = tolerance || this.config.snapTolerance || 0.25;
        var snappedPosition = position.clone();
        
        // Calculate grid bounds
        var totalSize = this.config.totalSize;
        var startPos = this.config.startPosition;
        var gridSize = this.config.gridSize;
        
        var halfSizeX = totalSize.x / 2;
        var halfSizeY = totalSize.y / 2;
        var halfSizeZ = totalSize.z / 2;
        
        // Calculate grid bounds
        var minX = startPos.x - halfSizeX;
        var maxX = startPos.x + halfSizeX;
        var minY = startPos.y - halfSizeY;
        var maxY = startPos.y + halfSizeY;
        var minZ = startPos.z - halfSizeZ;
        var maxZ = startPos.z + halfSizeZ;
        
        // First, clamp the position to grid bounds
        var clampedPosition = new THREE.Vector3(
            Math.max(minX, Math.min(maxX, position.x)),
            Math.max(minY, Math.min(maxY, position.y)),
            Math.max(minZ, Math.min(maxZ, position.z))
        );
        
        // Find nearest grid intersection point within bounds
        var nearestGridPoint = this.findNearestGridIntersectionWithinBounds(clampedPosition);
        
        if (nearestGridPoint) {
            var distance = clampedPosition.distanceTo(nearestGridPoint);
            
            // Always snap to nearest grid point if within bounds, regardless of tolerance for better UX
            // But still respect tolerance for visual feedback
            if (distance <= tolerance || this.config.snapEnabled) {
                // Double-check that snapped position is within bounds
                if (nearestGridPoint.x >= minX && nearestGridPoint.x <= maxX &&
                    nearestGridPoint.y >= minY && nearestGridPoint.y <= maxY &&
                    nearestGridPoint.z >= minZ && nearestGridPoint.z <= maxZ) {
                    return nearestGridPoint;
                }
            }
        }
        
        // If no valid grid point found, return the clamped position (still within bounds)
        return clampedPosition;
    },
    
    findNearestGridIntersection: function(position) {
        if (!this.nodePositions || this.nodePositions.length === 0) {
            return null;
        }
        
        var nearestPoint = null;
        var minDistance = Infinity;
        
        // Find the closest grid intersection point
        for (var i = 0; i < this.nodePositions.length; i++) {
            var nodePos = this.nodePositions[i];
            if (nodePos && nodePos.distanceTo) {
                var distance = nodePos.distanceTo(position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = nodePos.clone();
                }
            }
        }
        
        return nearestPoint;
    },
    
    findNearestGridIntersectionWithinBounds: function(position) {
        if (!this.nodePositions || this.nodePositions.length === 0) {
            return null;
        }
        
        var totalSize = this.config.totalSize;
        var startPos = this.config.startPosition;
        
        var minX = startPos.x - totalSize.x / 2;
        var maxX = startPos.x + totalSize.x / 2;
        var minY = startPos.y - totalSize.y / 2;
        var maxY = startPos.y + totalSize.y / 2;
        var minZ = startPos.z - totalSize.z / 2;
        var maxZ = startPos.z + totalSize.z / 2;
        
        var nearestPoint = null;
        var minDistance = Infinity;
        
        // Find the closest grid intersection point that is within bounds
        for (var i = 0; i < this.nodePositions.length; i++) {
            var nodePos = this.nodePositions[i];
            if (nodePos && nodePos.distanceTo) {
                // Check if this grid point is within bounds
                if (nodePos.x >= minX && nodePos.x <= maxX &&
                    nodePos.y >= minY && nodePos.y <= maxY &&
                    nodePos.z >= minZ && nodePos.z <= maxZ) {
                    
                    var distance = nodePos.distanceTo(position);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPoint = nodePos.clone();
                    }
                }
            }
        }
        
        return nearestPoint;
    },
    
    snapToGridWithFeedback: function(position, tolerance, showVisual) {
        if (!this.config.enabled || !this.config.snapEnabled) return { position: position, snapped: false };
        
        tolerance = tolerance || this.config.snapTolerance || 1.0;
        showVisual = showVisual !== false; // Default to true
        var nearestGridPoint = this.findNearestGridIntersection(position);
        
        if (nearestGridPoint) {
            var distance = position.distanceTo(nearestGridPoint);
            
            if (distance <= tolerance) {
                var snappedPosition = this.snapToGrid(position, tolerance);
                
                // Show visual feedback if requested
                if (showVisual) {
                    this.showSnapIndicator(snappedPosition, 300);
                }
                
                return {
                    position: snappedPosition,
                    snapped: true,
                    snapPoint: nearestGridPoint,
                    distance: distance
                };
            }
        }
        
        return { position: position, snapped: false };
    },
    
    getGridInfo: function() {
        var config = this.config;
        var totalSize = config.totalSize;
        var startPos = config.startPosition;
        
        var bounds = {
            min: new THREE.Vector3(
                startPos.x - totalSize.x/2,
                startPos.y - totalSize.y/2,
                startPos.z - totalSize.z/2
            ),
            max: new THREE.Vector3(
                startPos.x + totalSize.x/2,
                startPos.y + totalSize.y/2,
                startPos.z + totalSize.z/2
            )
        };
        
        var totalGrids = this.gridHelpers.xz.length + this.gridHelpers.xy.length + this.gridHelpers.yz.length;
        
        return {
            enabled: config.enabled,
            visible: this.isVisible,
            gridCount: totalGrids,
            snapPointCount: this.nodePositions.length,
            gridSize: config.gridSize,
            totalSize: config.totalSize,
            startPosition: config.startPosition,
            numberOfLevels: config.numberOfLevels,
            levelHeight: config.levelHeight,
            transparency: config.transparency,
            planes: config.planes,
            bounds: bounds,
            planeCount: {
                xz: this.gridHelpers.xz.length,
                xy: this.gridHelpers.xy.length,
                yz: this.gridHelpers.yz.length
            },
            snap: {
                enabled: config.snapEnabled,
                tolerance: config.snapTolerance
            }
        };
    },
    
    setupEventListeners: function() {
        var scope = this;
        
        // Listen for editor clear events
        if (this.editor.signals && this.editor.signals.editorCleared) {
            this.editor.signals.editorCleared.add(function() {
                scope.clearGrid();
                scope.config.enabled = false;
                scope.setVisible(false);
            });
        }
    },
    
    dispose: function() {
        this.clearGrid();
        
        // Clean up snap indicator
        if (this.snapIndicator) {
            if (this.snapIndicatorTimeout) {
                clearTimeout(this.snapIndicatorTimeout);
                this.snapIndicatorTimeout = null;
            }
            if (this.snapIndicator.material) this.snapIndicator.material.dispose();
            if (this.snapIndicator.geometry) this.snapIndicator.geometry.dispose();
            if (this.snapIndicator.parent) this.snapIndicator.parent.remove(this.snapIndicator);
            this.snapIndicator = null;
        }
        
        if (this.gridContainer && this.gridContainer.parent) {
            this.gridContainer.parent.remove(this.gridContainer);
        }
        
        console.log('Grid Nodes system disposed');
    }
};

// Export for global use
window.GridNodes = GridNodes;