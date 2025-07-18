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
        var spacing = config.spacing;
        var repetition = config.repetition;
        
        // Grid bounds are from 0 to (repetition * spacing) in all axes
        var maxCoord = repetition * spacing;
        
        var withinBounds = (position.x >= 0 && position.x <= maxCoord &&
                           position.y >= 0 && position.y <= maxCoord &&
                           position.z >= 0 && position.z <= maxCoord);
        
        if (!withinBounds) {
            console.log('Position outside bounds:', position, 'bounds:', {
                x: [0, maxCoord], y: [0, maxCoord], z: [0, maxCoord]
            });
        }
        
        return withinBounds;
    },
    
    snapToGrid: function(position) {
        // Use raycast-based snapping if Grid Nodes system is available and enabled
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var snappedPosition = this.raycastSnapToGridNodes(position);
            if (snappedPosition) {
                console.log('Raycast Grid Nodes snap:', position, '->', snappedPosition);
                return snappedPosition;
            }
            
            // Fallback to Grid Nodes system calculation
            var fallbackSnap = this.editor.gridNodes.snapToGrid(position);
            var config = this.editor.gridNodes.config;
            var spacing = config.spacing;
            var repetition = config.repetition;
            var maxCoord = repetition * spacing;
            
            // Ensure snapped position is strictly within bounds (positive coordinates only)
            fallbackSnap.x = Math.max(0, Math.min(maxCoord, fallbackSnap.x));
            fallbackSnap.y = Math.max(0, Math.min(maxCoord, fallbackSnap.y));
            fallbackSnap.z = Math.max(0, Math.min(maxCoord, fallbackSnap.z));
            
            console.log('Fallback Grid Nodes snap:', position, '->', fallbackSnap);
            return fallbackSnap;
        }
        
        // Fallback to simple grid snapping
        var gridSize = 0.5;
        return new THREE.Vector3(
            Math.round(position.x / gridSize) * gridSize,
            Math.round(position.y / gridSize) * gridSize,
            Math.round(position.z / gridSize) * gridSize
        );
    },
    
    raycastSnapToGridNodes: function(position) {
        // Use proper raycasting from camera through mouse position to find grid nodes
        if (!this.editor.gridNodes || !this.editor.gridNodes.gridContainer) {
            return null;
        }
        
        var tolerance = this.editor.gridNodes.config.snapTolerance || 0.25;
        var gridNodes = [];
        
        // Collect all grid node meshes
        this.editor.gridNodes.gridContainer.traverse(function(child) {
            if (child.userData && child.userData.grid_node) {
                gridNodes.push(child);
            }
        });
        
        if (gridNodes.length === 0) {
            return null;
        }
        
        // Use the existing raycaster that's already set up with camera and mouse position
        var intersects = this.raycaster.intersectObjects(gridNodes, false);
        
        if (intersects.length > 0) {
            // Get the closest intersection (first in array)
            var intersection = intersects[0];
            var gridNodePosition = intersection.object.position;
            
            // Check if the intersection point is within tolerance of the grid node center
            var distanceToCenter = intersection.point.distanceTo(gridNodePosition);
            
            if (distanceToCenter <= tolerance) {
                console.log('Raycast hit grid node at:', gridNodePosition, 'distance:', distanceToCenter);
                return gridNodePosition.clone();
            }
        }
        
        // If no direct raycast hit, fall back to screen-space proximity
        return this.findNearestGridNodeInScreenSpace(position, tolerance, gridNodes);
    },
    
    findNearestGridNodeInScreenSpace: function(worldPosition, tolerance, gridNodes) {
        // Project grid nodes to screen space and find the closest one to the mouse
        var camera = this.editor.camera;
        var viewport = document.getElementById('viewport');
        var rect = viewport.getBoundingClientRect();
        
        // Convert mouse position to screen coordinates
        var mouseScreenX = ((this.mouse.x + 1) / 2) * rect.width;
        var mouseScreenY = ((-this.mouse.y + 1) / 2) * rect.height;
        
        var closestNode = null;
        var minScreenDistance = Infinity;
        var maxScreenDistance = 50; // Maximum screen pixels for snapping
        
        for (var i = 0; i < gridNodes.length; i++) {
            var node = gridNodes[i];
            var nodePosition = node.position.clone();
            
            // Project node position to screen space
            nodePosition.project(camera);
            
            // Convert to screen coordinates
            var nodeScreenX = ((nodePosition.x + 1) / 2) * rect.width;
            var nodeScreenY = ((-nodePosition.y + 1) / 2) * rect.height;
            
            // Check if node is in front of camera (z < 1)
            if (nodePosition.z < 1) {
                // Calculate screen space distance
                var screenDistance = Math.sqrt(
                    Math.pow(mouseScreenX - nodeScreenX, 2) +
                    Math.pow(mouseScreenY - nodeScreenY, 2)
                );
                
                if (screenDistance < minScreenDistance && screenDistance <= maxScreenDistance) {
                    // Also check 3D world distance as secondary criteria
                    var worldDistance = worldPosition.distanceTo(node.position);
                    if (worldDistance <= tolerance * 10) { // More lenient for screen-space snapping
                        minScreenDistance = screenDistance;
                        closestNode = node;
                    }
                }
            }
        }
        
        if (closestNode) {
            console.log('Screen-space snap to grid node at:', closestNode.position, 'screen distance:', minScreenDistance);
            return closestNode.position.clone();
        }
        
        return null;
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
        
        var spacing = config.spacing;
        var repetition = config.repetition;
        
        // Calculate number of grid lines in each direction (positive coordinates only)
        var pointsPerAxis = repetition + 1;
        
        // Create horizontal planes (XZ planes at different Y levels)
        for (var i = 0; i < pointsPerAxis; i++) {
            var y = i * spacing;
            this.gridPlanes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y));
        }
        
        // Create vertical planes (XY planes at different Z levels)
        for (var j = 0; j < pointsPerAxis; j++) {
            var z = j * spacing;
            this.gridPlanes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z));
        }
        
        // Create side planes (YZ planes at different X levels)
        for (var k = 0; k < pointsPerAxis; k++) {
            var x = k * spacing;
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
                    var spacing = config.spacing;
                    var repetition = config.repetition;
                    var maxCoord = repetition * spacing;
                    
                    isWithinBounds = (intersectPoint.x >= 0 && intersectPoint.x <= maxCoord &&
                                    intersectPoint.y >= 0 && intersectPoint.y <= maxCoord &&
                                    intersectPoint.z >= 0 && intersectPoint.z <= maxCoord);
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