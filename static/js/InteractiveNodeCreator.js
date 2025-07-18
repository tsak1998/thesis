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
    
    // Raycasting for 3D intersection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    // Create invisible grid planes for 3D snapping
    this.gridPlanes = [];
    this.createGridPlanes();
    
    // Event handlers
    this.onMouseMove = function(event) {
        if (!scope.isActive) return;
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        // Find intersection with grid planes for 3D positioning
        var intersectPoint = scope.findBestIntersection();
        
        if (intersectPoint && scope.previewNode) {
            // Apply grid snapping to preview position
            var snappedPosition = scope.snapToGrid(intersectPoint);
            scope.previewNode.position.copy(snappedPosition);
            scope.updatePreviewLabel(snappedPosition, intersectPoint);
            editor.signals.sceneGraphChanged.dispatch();
        }
    };
    
    this.onMouseClick = function(event) {
        if (!scope.isActive) return;
        
        // Only handle clicks on the viewport canvas
        if (event.target !== editor.renderer.domElement) {
            console.log('Click not on viewport canvas, skipping node creation');
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        // Find intersection with grid planes for 3D positioning
        var intersectPoint = scope.findBestIntersection();
        
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
    
    updatePreviewLabel: function(snappedPosition, originalPosition) {
        // Update preview node position display with snap info
        var coords = `(${snappedPosition.x.toFixed(2)}, ${snappedPosition.y.toFixed(2)}, ${snappedPosition.z.toFixed(2)})`;
        var snapInfo = '';
        
        if (originalPosition && this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var distance = originalPosition.distanceTo(snappedPosition);
            if (distance > 0.001) {
                snapInfo = ` [Grid Snap: ${distance.toFixed(3)}]`;
            } else {
                snapInfo = ' [On Grid]';
            }
        }
        
        this.updateStatus(`Node ${this.nodeCount} - Position: ${coords}${snapInfo} - Click to place`);
    },
    
    createNodeAtPosition: function(position) {
        // Snap to grid if enabled - use Grid Nodes system if available
        var snappedPosition = this.snapToGrid(position);
        
        // Additional validation: ensure node is within grid bounds
        if (!this.isPositionWithinGridBounds(snappedPosition)) {
            this.updateStatus('Error: Cannot place node outside grid boundaries');
            console.warn('Node creation blocked: position outside grid bounds', snappedPosition);
            return;
        }
        
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
        
        // Show snapping feedback in status
        var snapInfo = this.getSnapInfo(position, snappedPosition);
        this.updateStatus(`Node ${mesh.userData.nn} created at (${snappedPosition.x.toFixed(2)}, ${snappedPosition.y.toFixed(2)}, ${snappedPosition.z.toFixed(2)})${snapInfo}`);
        
        console.log('Node created:', mesh.userData);
        
        // Auto-select the new node
        this.editor.select(mesh);
    },
    
    isPositionWithinGridBounds: function(position) {
        // If grid nodes system is not enabled, allow any position
        if (!this.editor.gridNodes || !this.editor.gridNodes.config.enabled) {
            return true;
        }
        
        var config = this.editor.gridNodes.config;
        var totalSize = config.totalSize;
        var startPos = config.startPosition;
        
        var minX = startPos.x - totalSize.x / 2;
        var maxX = startPos.x + totalSize.x / 2;
        var minY = startPos.y - totalSize.y / 2;
        var maxY = startPos.y + totalSize.y / 2;
        var minZ = startPos.z - totalSize.z / 2;
        var maxZ = startPos.z + totalSize.z / 2;
        
        var withinBounds = (position.x >= minX && position.x <= maxX &&
                           position.y >= minY && position.y <= maxY &&
                           position.z >= minZ && position.z <= maxZ);
        
        if (!withinBounds) {
            console.log('Position outside bounds:', position, 'bounds:', {
                x: [minX, maxX], y: [minY, maxY], z: [minZ, maxZ]
            });
        }
        
        return withinBounds;
    },
    
    snapToGrid: function(position) {
        // Use Grid Nodes system if available and enabled
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var snappedPosition = this.editor.gridNodes.snapToGrid(position);
            
            // Additional validation to ensure the position is within grid bounds
            var config = this.editor.gridNodes.config;
            var totalSize = config.totalSize;
            var startPos = config.startPosition;
            
            var minX = startPos.x - totalSize.x / 2;
            var maxX = startPos.x + totalSize.x / 2;
            var minY = startPos.y - totalSize.y / 2;
            var maxY = startPos.y + totalSize.y / 2;
            var minZ = startPos.z - totalSize.z / 2;
            var maxZ = startPos.z + totalSize.z / 2;
            
            // Ensure snapped position is strictly within bounds
            snappedPosition.x = Math.max(minX, Math.min(maxX, snappedPosition.x));
            snappedPosition.y = Math.max(minY, Math.min(maxY, snappedPosition.y));
            snappedPosition.z = Math.max(minZ, Math.min(maxZ, snappedPosition.z));
            
            console.log('Grid Nodes snap:', position, '->', snappedPosition, 'bounds:', {
                x: [minX, maxX], y: [minY, maxY], z: [minZ, maxZ]
            });
            return snappedPosition;
        }
        
        // Fallback to simple grid snapping
        var gridSize = 0.5;
        return new THREE.Vector3(
            Math.round(position.x / gridSize) * gridSize,
            Math.round(position.y / gridSize) * gridSize,
            Math.round(position.z / gridSize) * gridSize
        );
    },
    
    getSnapInfo: function(originalPosition, snappedPosition) {
        // Check if Grid Nodes system was used
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var distance = originalPosition.distanceTo(snappedPosition);
            if (distance > 0.001) {
                return ` [Snapped to grid: ${distance.toFixed(3)} units]`;
            } else {
                return ' [On grid]';
            }
        }
        return '';
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
    },
    
    isClickOnUI: function(target) {
        // Check if the click target is a UI element or its child
        var uiSelectors = [
            '.cad-toolbar',
            '.sidebar',
            '.menubar',
            '.toolbar',
            '.modal',
            '.dialog',
            'button',
            'input',
            'select',
            'textarea',
            '.ui-panel',
            '.ui-button',
            '.ui-input',
            '.ui-select',
            '.ui-textarea',
            '.ui-checkbox',
            '.ui-number',
            '.ui-text',
            '.ui-row',
            '.ui-break',
            '.ui-modal',
            '#sidebar',
            '#menubar',
            '#toolbar'
        ];
        
        // Check if target or any parent matches UI selectors
        var element = target;
        while (element && element !== document.body) {
            // Check element classes
            if (element.className) {
                var classes = element.className.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    var className = '.' + classes[i];
                    if (uiSelectors.indexOf(className) !== -1) {
                        return true;
                    }
                }
            }
            
            // Check element ID
            if (element.id) {
                var idSelector = '#' + element.id;
                if (uiSelectors.indexOf(idSelector) !== -1) {
                    return true;
                }
            }
            
            // Check element tag name
            var tagName = element.tagName ? element.tagName.toLowerCase() : '';
            if (uiSelectors.indexOf(tagName) !== -1) {
                return true;
            }
            
            // Check for specific UI indicators
            if (element.style && element.style.zIndex && parseInt(element.style.zIndex) > 100) {
                return true;
            }
            
            element = element.parentElement;
        }
        
        return false;
    },
    
    createGridPlanes: function() {
        // Create invisible planes for 3D grid intersection
        this.gridPlanes = [];
        
        if (!this.editor.gridNodes) return;
        
        var config = this.editor.gridNodes.config;
        if (!config || !config.enabled) return;
        
        var gridSize = config.gridSize;
        var totalSize = config.totalSize;
        var startPos = config.startPosition;
        
        // Calculate number of grid lines in each direction
        var pointsX = Math.floor(totalSize.x / gridSize) + 1;
        var pointsY = Math.floor(totalSize.y / gridSize) + 1;
        var pointsZ = Math.floor(totalSize.z / gridSize) + 1;
        
        // Create horizontal planes (XZ planes at different Y levels)
        for (var i = 0; i < pointsY; i++) {
            var y = startPos.y - totalSize.y/2 + i * gridSize;
            this.gridPlanes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y));
        }
        
        // Create vertical planes (XY planes at different Z levels)
        for (var j = 0; j < pointsZ; j++) {
            var z = startPos.z - totalSize.z/2 + j * gridSize;
            this.gridPlanes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z));
        }
        
        // Create side planes (YZ planes at different X levels)
        for (var k = 0; k < pointsX; k++) {
            var x = startPos.x - totalSize.x/2 + k * gridSize;
            this.gridPlanes.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -x));
        }
    },
    
    findBestIntersection: function() {
        // Update grid planes if grid nodes are enabled
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            this.createGridPlanes();
        }
        
        var intersections = [];
        
        // Try intersecting with all grid planes
        for (var i = 0; i < this.gridPlanes.length; i++) {
            var intersectPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.gridPlanes[i], intersectPoint)) {
                var distance = this.raycaster.ray.origin.distanceTo(intersectPoint);
                
                // Validate intersection is within grid bounds if grid is enabled
                var isWithinBounds = true;
                if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
                    var config = this.editor.gridNodes.config;
                    var totalSize = config.totalSize;
                    var startPos = config.startPosition;
                    
                    var minX = startPos.x - totalSize.x / 2;
                    var maxX = startPos.x + totalSize.x / 2;
                    var minY = startPos.y - totalSize.y / 2;
                    var maxY = startPos.y + totalSize.y / 2;
                    var minZ = startPos.z - totalSize.z / 2;
                    var maxZ = startPos.z + totalSize.z / 2;
                    
                    isWithinBounds = (intersectPoint.x >= minX && intersectPoint.x <= maxX &&
                                    intersectPoint.y >= minY && intersectPoint.y <= maxY &&
                                    intersectPoint.z >= minZ && intersectPoint.z <= maxZ);
                }
                
                if (isWithinBounds) {
                    intersections.push({
                        point: intersectPoint,
                        distance: distance,
                        plane: this.gridPlanes[i],
                        withinBounds: true
                    });
                }
            }
        }
        
        // Also try ground plane as fallback
        var groundIntersect = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, groundIntersect)) {
            var groundDistance = this.raycaster.ray.origin.distanceTo(groundIntersect);
            intersections.push({
                point: groundIntersect,
                distance: groundDistance,
                plane: this.groundPlane,
                withinBounds: false // Ground plane is fallback
            });
        }
        
        // Sort by distance and prioritize intersections within bounds
        intersections.sort(function(a, b) {
            // Prioritize within-bounds intersections
            if (a.withinBounds && !b.withinBounds) return -1;
            if (!a.withinBounds && b.withinBounds) return 1;
            return a.distance - b.distance;
        });
        
        for (var j = 0; j < intersections.length; j++) {
            var intersection = intersections[j];
            // Check if intersection is within reasonable bounds
            if (intersection.distance > 0 && intersection.distance < 1000) {
                return intersection.point;
            }
        }
        
        // Fallback to ground plane intersection
        var fallbackPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.groundPlane, fallbackPoint);
        return fallbackPoint;
    }
};

// Export for global use
window.InteractiveNodeCreator = InteractiveNodeCreator;