/**
 * Grid Nodes System for CAD Interface
 * Simplified system with only faint blue nodes in positive coordinates
 */

var GridNodes = function(editor) {
    var scope = this;
    this.editor = editor;
    this.signals = editor.signals;
    
    // Simplified grid configuration - only spacing and repetition
    this.config = {
        enabled: false,
        spacing: 5.0,        // 5 meters spacing between nodes
        repetition: 1,       // 3 repetitions in each positive direction
        snapTolerance: 0.1, // Maximum distance for snapping to grid nodes
        snapEnabled: true    // Enable/disable grid snapping
    };
    
    // Grid state
    this.gridContainer = null;
    this.gridNodes = [];     // Array to store the blue node meshes
    this.nodePositions = []; // Array to store node positions for snapping
    this.isVisible = false;
    
    // Visual feedback for snapping
    this.snapIndicator = null;
    this.snapIndicatorTimeout = null;
    
    // Initialize
    this.init();
};

GridNodes.prototype = {
    
    init: function() {
        this.createGridContainer();
        this.createSnapIndicator();
        this.setupEventListeners();
        console.log('Grid Nodes system initialized - simplified blue nodes only');
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
    
    generateGrid: function() {
        this.clearGrid();
        
        var spacing = this.config.spacing;
        var repetition = this.config.repetition;
        
        // Create geometry and material for blue nodes
        var nodeGeometry = new THREE.SphereGeometry(0.1, 8, 6); // Small spheres
        var nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff, // Faint blue color
            transparent: true,
            opacity: 0.6
        });
        
        // Generate nodes only in positive coordinates
        for (var x = 0; x <= repetition; x++) {
            for (var y = 0; y <= repetition; y++) {
                for (var z = 0; z <= repetition; z++) {
                    var position = new THREE.Vector3(
                        x * spacing,
                        y * spacing,
                        z * spacing
                    );
                    
                    // Create node mesh
                    var nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
                    nodeMesh.position.copy(position);
                    nodeMesh.name = 'GridNode';
                    
                    // Add metadata for snap detection
                    nodeMesh.userData.grid_node = true;
                    nodeMesh.userData.gridPosition = position.clone();
                    
                    // Add to container and arrays
                    this.gridContainer.add(nodeMesh);
                    this.gridNodes.push(nodeMesh);
                    this.nodePositions.push(position.clone());
                }
            }
        }
        
        var totalNodes = this.gridNodes.length;
        console.log(`Generated ${totalNodes} blue grid nodes in positive coordinates`);
        console.log(`Grid spacing: ${spacing}m, Repetition: ${repetition} (${repetition+1}×${repetition+1}×${repetition+1} grid)`);
        
        // Trigger render update
        if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
            this.editor.signals.sceneGraphChanged.dispatch();
        }
    },
    
    clearGrid: function() {
        // Remove all grid nodes
        for (var i = 0; i < this.gridNodes.length; i++) {
            var node = this.gridNodes[i];
            if (node.material) node.material.dispose();
            if (node.geometry) node.geometry.dispose();
            this.gridContainer.remove(node);
        }
        
        // Clear arrays
        this.gridNodes = [];
        this.nodePositions = [];
        
        console.log('Grid nodes cleared');
    },
    
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.setVisible(this.config.enabled);
        
        if (this.config.enabled) {
            // Generate grid nodes when enabled
            this.generateGrid();
        } else {
            // Clear grid nodes when disabled
            this.clearGrid();
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
    
    updateSpacing: function(spacing) {
        this.config.spacing = Math.max(0.1, parseFloat(spacing) || 5.0);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
        
        console.log('Grid spacing updated to:', this.config.spacing);
    },
    
    updateRepetition: function(repetition) {
        this.config.repetition = Math.max(1, parseInt(repetition) || 3);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
        
        console.log('Grid repetition updated to:', this.config.repetition);
    },
    
    setSnapTolerance: function(tolerance) {
        this.config.snapTolerance = Math.max(0.1, Math.min(10.0, parseFloat(tolerance) || 0.1));
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
        tolerance = tolerance || this.config.snapTolerance;
        
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
        
        tolerance = tolerance || this.config.snapTolerance;
        
        // Find nearest grid node
        var nearestNode = this.findNearestGridNode(position);
        
        if (nearestNode) {
            var distance = position.distanceTo(nearestNode);
            
            if (distance <= tolerance) {
                return nearestNode.clone();
            }
        }
        
        return position;
    },
    
    findNearestGridNode: function(position) {
        if (!this.nodePositions || this.nodePositions.length === 0) {
            return null;
        }
        
        var nearestPoint = null;
        var minDistance = Infinity;
        
        // Find the closest grid node
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
    
    snapToGridWithFeedback: function(position, tolerance, showVisual) {
        if (!this.config.enabled || !this.config.snapEnabled) {
            return { position: position, snapped: false };
        }
        
        tolerance = tolerance || this.config.snapTolerance;
        showVisual = showVisual !== false; // Default to true
        
        var nearestNode = this.findNearestGridNode(position);
        
        if (nearestNode) {
            var distance = position.distanceTo(nearestNode);
            
            if (distance <= tolerance) {
                var snappedPosition = nearestNode.clone();
                
                // Show visual feedback if requested
                if (showVisual) {
                    this.showSnapIndicator(snappedPosition, 300);
                }
                
                return {
                    position: snappedPosition,
                    snapped: true,
                    snapPoint: nearestNode,
                    distance: distance
                };
            }
        }
        
        return { position: position, snapped: false };
    },
    
    getGridInfo: function() {
        var config = this.config;
        var spacing = config.spacing;
        var repetition = config.repetition;
        
        // Calculate grid bounds (positive coordinates only)
        var bounds = {
            min: new THREE.Vector3(0, 0, 0),
            max: new THREE.Vector3(
                repetition * spacing,
                repetition * spacing,
                repetition * spacing
            )
        };
        
        return {
            enabled: config.enabled,
            visible: this.isVisible,
            nodeCount: this.gridNodes.length,
            snapPointCount: this.nodePositions.length,
            spacing: config.spacing,
            repetition: config.repetition,
            bounds: bounds,
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