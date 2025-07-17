/**
 * Interactive Node Creator for CAD System
 * Allows click-to-place node creation with visual feedback
 */

var InteractiveNodeCreator = function(editor) {
    var scope = this;
    var signals = editor.signals;
    var viewport = document.getElementById('viewport');
    
    this.editor = editor;
    this.isActive = false;
    this.previewNode = null;
    this.nodeCount = 1;
    this.validator = new ValidationHelper();
    
    // Materials for nodes
    this.nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000066,
        emissive: 0x000066
    });
    
    this.previewMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        transparent: true,
        opacity: 0.7
    });
    
    // Raycasting for ground plane intersection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    // Event handlers
    this.onMouseMove = function(event) {
        if (!scope.isActive) return;
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        var intersectPoint = new THREE.Vector3();
        scope.raycaster.ray.intersectPlane(scope.groundPlane, intersectPoint);
        
        if (intersectPoint && scope.previewNode) {
            scope.previewNode.position.copy(intersectPoint);
            scope.updatePreviewLabel(intersectPoint);
            editor.signals.sceneGraphChanged.dispatch();
        }
    };
    
    this.onMouseClick = function(event) {
        if (!scope.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        var intersectPoint = new THREE.Vector3();
        scope.raycaster.ray.intersectPlane(scope.groundPlane, intersectPoint);
        
        if (intersectPoint) {
            scope.createNodeAtPosition(intersectPoint);
        }
    };
    
    this.onKeyDown = function(event) {
        if (event.key === 'Escape') {
            scope.deactivate();
        }
    };
};

InteractiveNodeCreator.prototype = {
    
    activate: function() {
        this.isActive = true;
        this.updateNodeCount();
        this.createPreviewNode();
        
        // Add event listeners
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('click', this.onMouseClick, true); // Use capture phase
        document.addEventListener('keydown', this.onKeyDown, false);
        
        // Change cursor
        document.body.style.cursor = 'crosshair';
        
        // Update status
        this.updateStatus('Click to place nodes. Press ESC to exit.');
        
        console.log('Interactive node creation activated');
    },
    
    deactivate: function() {
        this.isActive = false;
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('click', this.onMouseClick, true);
        document.removeEventListener('keydown', this.onKeyDown, false);
        
        // Remove preview node
        if (this.previewNode) {
            this.editor.scene.remove(this.previewNode);
            this.previewNode = null;
        }
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
        // Update status
        this.updateStatus('Node creation mode deactivated');
        
        this.editor.signals.sceneGraphChanged.dispatch();
        console.log('Interactive node creation deactivated');
    },
    
    createPreviewNode: function() {
        var geometry = new THREE.SphereGeometry(0.05, 12, 12);
        this.previewNode = new THREE.Mesh(geometry, this.previewMaterial);
        this.previewNode.name = 'PreviewNode';
        this.previewNode.visible = true;
        
        this.editor.scene.add(this.previewNode);
    },
    
    updatePreviewLabel: function(position) {
        // Update preview node position display
        var coords = `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
        this.updateStatus(`Node ${this.nodeCount} - Position: ${coords} - Click to place`);
    },
    
    createNodeAtPosition: function(position) {
        // Snap to grid if enabled
        var snappedPosition = this.snapToGrid(position);
        
        // Get existing nodes for validation
        var existingNodes = [];
        this.editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node') {
                existingNodes.push(child);
            }
        });
        
        // Validate node creation
        if (!this.validator.validateNode(snappedPosition, existingNodes)) {
            this.updateStatus('Error: ' + this.validator.getErrorMessages().join(', '));
            return;
        }
        
        // Show warnings if any
        if (this.validator.hasWarnings()) {
            console.warn('Node creation warnings:', this.validator.getWarningMessages());
        }
        
        // Create the actual node
        var geometry = new THREE.SphereGeometry(0.05, 12, 12);
        var mesh = new THREE.Mesh(geometry, this.nodeMaterial.clone());
        
        mesh.name = 'Node ' + this.nodeCount;
        mesh.position.copy(snappedPosition);
        
        // Set node metadata
        mesh.userData = {
            'nn': this.nodeCount,
            'type': 'node',
            'coord_x': snappedPosition.x,
            'coord_y': snappedPosition.y,
            'coord_z': snappedPosition.z,
            'label_position': {
                x: snappedPosition.x,
                y: snappedPosition.y,
                z: snappedPosition.z
            },
            'dof_dx': 1,
            'dof_dy': 1,
            'dof_dz': 1,
            'dof_rx': 1,
            'dof_ry': 1,
            'dof_rz': 1
        };
        
        // Add to scene using command system for undo/redo support
        this.editor.execute(new AddObjectCommand(mesh));
        
        // Update node count
        this.nodeCount++;
        
        // Update status
        this.updateStatus(`Node ${mesh.userData.nn} created at (${snappedPosition.x.toFixed(2)}, ${snappedPosition.y.toFixed(2)}, ${snappedPosition.z.toFixed(2)})`);
        
        console.log('Node created:', mesh.userData);
        
        // Auto-select the new node
        this.editor.select(mesh);
    },
    
    snapToGrid: function(position) {
        // Simple grid snapping (can be enhanced)
        var gridSize = 0.5;
        return new THREE.Vector3(
            Math.round(position.x / gridSize) * gridSize,
            Math.round(position.y / gridSize) * gridSize,
            Math.round(position.z / gridSize) * gridSize
        );
    },
    
    updateNodeCount: function() {
        // Find the highest existing node number
        var maxNodeNum = 0;
        this.editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node' && child.userData.nn) {
                maxNodeNum = Math.max(maxNodeNum, child.userData.nn);
            }
        });
        this.nodeCount = maxNodeNum + 1;
    },
    
    updateStatus: function(message) {
        // Update status in the UI (can be enhanced to show in a status bar)
        console.log('Status:', message);
        
        // Try to update AIDEA status if available
        var statusDiv = document.getElementById('modelStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = '#007bff';
        }
    },
    
    setGroundPlane: function(normal, distance) {
        this.groundPlane.set(normal, distance);
    },
    
    toggle: function() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
};

// Export for global use
window.InteractiveNodeCreator = InteractiveNodeCreator;