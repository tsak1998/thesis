/**
 * Grid Nodes System for CAD Interface
 * Creates a 3D grid of transparent nodes with configurable spacing and size
 */

var GridNodes = function(editor) {
    var scope = this;
    this.editor = editor;
    this.signals = editor.signals;
    
    // Grid configuration
    this.config = {
        enabled: false,
        size: { x: 50, y: 50, z: 50 }, // Grid dimensions in design units
        spacing: { x: 1, y: 1, z: 1 }, // Spacing between nodes
        transparency: 0.3, // Node transparency (0-1)
        nodeSize: 0.1, // Visual size of each node
        color: 0x4CAF50, // Grid node color (green)
        hoverColor: 0x2196F3 // Hover color (blue)
    };
    
    // Grid state
    this.gridNodes = [];
    this.gridContainer = null;
    this.isVisible = false;
    
    // Materials
    this.nodeMaterial = new THREE.MeshBasicMaterial({
        color: this.config.color,
        transparent: true,
        opacity: this.config.transparency
    });
    
    this.hoverMaterial = new THREE.MeshBasicMaterial({
        color: this.config.hoverColor,
        transparent: true,
        opacity: this.config.transparency * 1.5
    });
    
    // Initialize
    this.init();
};

GridNodes.prototype = {
    
    init: function() {
        this.createGridContainer();
        this.setupEventListeners();
        console.log('Grid Nodes system initialized');
    },
    
    createGridContainer: function() {
        this.gridContainer = new THREE.Object3D();
        this.gridContainer.name = 'GridNodes';
        this.gridContainer.visible = false;
        this.editor.scene.add(this.gridContainer);
    },
    
    generateGrid: function() {
        this.clearGrid();
        
        var geometry = new THREE.SphereGeometry(this.config.nodeSize, 8, 6);
        var nodeCount = 0;
        
        // Calculate grid bounds
        var halfSizeX = this.config.size.x / 2;
        var halfSizeY = this.config.size.y / 2;
        var halfSizeZ = this.config.size.z / 2;
        
        // Generate nodes
        for (var x = -halfSizeX; x <= halfSizeX; x += this.config.spacing.x) {
            for (var y = -halfSizeY; y <= halfSizeY; y += this.config.spacing.y) {
                for (var z = -halfSizeZ; z <= halfSizeZ; z += this.config.spacing.z) {
                    var node = this.createGridNode(geometry, x, y, z, nodeCount++);
                    this.gridNodes.push(node);
                    this.gridContainer.add(node);
                }
            }
        }
        
        console.log(`Generated ${nodeCount} grid nodes`);
        this.updateNodeVisuals();
    },
    
    createGridNode: function(geometry, x, y, z, index) {
        var node = new THREE.Mesh(geometry, this.nodeMaterial.clone());
        node.position.set(x, y, z);
        node.userData = {
            type: 'grid_node',
            index: index,
            gridPosition: { x: x, y: y, z: z },
            isHovered: false
        };
        
        // Add interaction capabilities
        this.addNodeInteraction(node);
        
        return node;
    },
    
    addNodeInteraction: function(node) {
        // Store original material
        node.userData.originalMaterial = node.material;
        
        // Add to raycaster targets if needed
        // This would be handled by the main interaction system
    },
    
    clearGrid: function() {
        while (this.gridContainer.children.length > 0) {
            var child = this.gridContainer.children[0];
            this.gridContainer.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.gridNodes = [];
    },
    
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.setVisible(this.config.enabled);
        
        if (this.config.enabled && this.gridNodes.length === 0) {
            this.generateGrid();
        }
        
        console.log('Grid Nodes', this.config.enabled ? 'enabled' : 'disabled');
        return this.config.enabled;
    },
    
    setVisible: function(visible) {
        this.isVisible = visible;
        this.gridContainer.visible = visible;
        
        // Trigger render update
        if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
            this.editor.signals.sceneGraphChanged.dispatch();
        }
    },
    
    updateSize: function(sizeX, sizeY, sizeZ) {
        this.config.size.x = parseFloat(sizeX) || 50;
        this.config.size.y = parseFloat(sizeY) || 50;
        this.config.size.z = parseFloat(sizeZ) || 50;
        
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    updateSpacing: function(spacingX, spacingY, spacingZ) {
        this.config.spacing.x = Math.max(0.1, parseFloat(spacingX) || 1);
        this.config.spacing.y = Math.max(0.1, parseFloat(spacingY) || 1);
        this.config.spacing.z = Math.max(0.1, parseFloat(spacingZ) || 1);
        
        if (this.config.enabled) {
            this.generateGrid();
        }
    },
    
    updateTransparency: function(transparency) {
        this.config.transparency = Math.max(0.1, Math.min(1.0, parseFloat(transparency) || 0.3));
        this.updateNodeVisuals();
    },
    
    updateNodeVisuals: function() {
        // Update material properties
        this.nodeMaterial.opacity = this.config.transparency;
        this.hoverMaterial.opacity = this.config.transparency * 1.5;
        
        // Update all existing nodes
        this.gridNodes.forEach(function(node) {
            if (node.material && !node.userData.isHovered) {
                node.material.opacity = this.config.transparency;
            }
        }.bind(this));
    },
    
    highlightNode: function(node) {
        if (node && node.userData.type === 'grid_node') {
            node.material = this.hoverMaterial.clone();
            node.userData.isHovered = true;
        }
    },
    
    unhighlightNode: function(node) {
        if (node && node.userData.type === 'grid_node' && node.userData.isHovered) {
            node.material = node.userData.originalMaterial;
            node.userData.isHovered = false;
        }
    },
    
    getNodeAt: function(position, tolerance) {
        tolerance = tolerance || 0.5;
        
        for (var i = 0; i < this.gridNodes.length; i++) {
            var node = this.gridNodes[i];
            var distance = node.position.distanceTo(position);
            if (distance <= tolerance) {
                return node;
            }
        }
        return null;
    },
    
    snapToGrid: function(position) {
        if (!this.config.enabled) return position;
        
        var snappedPosition = position.clone();
        
        // Snap to nearest grid points
        snappedPosition.x = Math.round(position.x / this.config.spacing.x) * this.config.spacing.x;
        snappedPosition.y = Math.round(position.y / this.config.spacing.y) * this.config.spacing.y;
        snappedPosition.z = Math.round(position.z / this.config.spacing.z) * this.config.spacing.z;
        
        return snappedPosition;
    },
    
    getGridInfo: function() {
        var totalNodes = this.gridNodes.length;
        var bounds = {
            min: new THREE.Vector3(-this.config.size.x/2, -this.config.size.y/2, -this.config.size.z/2),
            max: new THREE.Vector3(this.config.size.x/2, this.config.size.y/2, this.config.size.z/2)
        };
        
        return {
            enabled: this.config.enabled,
            visible: this.isVisible,
            nodeCount: totalNodes,
            size: this.config.size,
            spacing: this.config.spacing,
            transparency: this.config.transparency,
            bounds: bounds
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
        
        // Listen for scene changes
        if (this.editor.signals && this.editor.signals.sceneGraphChanged) {
            // Could add auto-update logic here if needed
        }
    },
    
    dispose: function() {
        this.clearGrid();
        if (this.gridContainer && this.gridContainer.parent) {
            this.gridContainer.parent.remove(this.gridContainer);
        }
        
        if (this.nodeMaterial) this.nodeMaterial.dispose();
        if (this.hoverMaterial) this.hoverMaterial.dispose();
        
        console.log('Grid Nodes system disposed');
    }
};

// Export for global use
window.GridNodes = GridNodes;