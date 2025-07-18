/**
 * Interactive Element Creator for CAD System
 * Allows click-to-connect element creation between nodes
 */

var InteractiveElementCreator = function(editor) {
    var scope = this;
    var signals = editor.signals;
    var viewport = document.getElementById('viewport');
    
    this.editor = editor;
    this.isActive = false;
    this.selectedNodes = [];
    this.previewLine = null;
    this.elementCount = 1;
    this.currentSectionId = 1;
    this.validator = new ValidationHelper();
    
    // Materials for elements - using utility function
    this.elementMaterial = LineUtils.createStandardLineMaterial({
        color: 0x404040,
        lineWidth: 12
    });

    this.previewMaterial = LineUtils.createStandardLineMaterial({
        color: 0x00ff00,
        lineWidth: 12
    });
    // Make preview material transparent
    this.previewMaterial.transparent = true;
    this.previewMaterial.opacity = 0.7;
    
    this.highlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00
    });
    
    // Raycasting for node selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.raycaster.linePrecision = 0.1;
    
    // Event handlers
    this.onMouseMove = function(event) {
        if (!scope.isActive) return;
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        // Get all nodes in the scene
        var nodes = [];
        editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node') {
                nodes.push(child);
            }
        });
        
        var intersects = scope.raycaster.intersectObjects(nodes);
        
        // Reset all node materials
        nodes.forEach(function(node) {
            if (scope.selectedNodes.indexOf(node) === -1) {
                if (node.material && node.material.emissive) {
                    node.material.emissive.setHex(0x000066);
                }
            }
        });
        
        // Highlight hovered node
        if (intersects.length > 0) {
            var hoveredNode = intersects[0].object;
            if (scope.selectedNodes.indexOf(hoveredNode) === -1) {
                if (hoveredNode.material && hoveredNode.material.emissive) {
                    hoveredNode.material.emissive.setHex(0xffff00);
                }
            }
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'crosshair';
        }
        
        // Update preview line if we have one selected node
        if (scope.selectedNodes.length === 1) {
            scope.updatePreviewLine(event);
        }
        
        editor.signals.sceneGraphChanged.dispatch();
    };
    
    this.onMouseClick = function(event) {
        if (!scope.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        var rect = viewport.getBoundingClientRect();
        scope.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scope.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        scope.raycaster.setFromCamera(scope.mouse, editor.camera);
        
        // Get all nodes in the scene
        var nodes = [];
        editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node') {
                nodes.push(child);
            }
        });
        
        var intersects = scope.raycaster.intersectObjects(nodes);
        
        if (intersects.length > 0) {
            var clickedNode = intersects[0].object;
            scope.selectNode(clickedNode);
        }
    };
    
    this.onKeyDown = function(event) {
        if (event.key === 'Escape') {
            scope.deactivate();
        } else if (event.key === 'Enter' && scope.selectedNodes.length === 2) {
            scope.createElement();
        }
    };
};

InteractiveElementCreator.prototype = {
    
    activate: function() {
        this.isActive = true;
        this.selectedNodes = [];
        this.updateElementCount();
        
        // Add event listeners
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('click', this.onMouseClick, true);
        document.addEventListener('keydown', this.onKeyDown, false);
        
        // Change cursor
        document.body.style.cursor = 'crosshair';
        
        // Update status
        this.updateStatus('Click on two nodes to create an element. Press ESC to exit.');
        
        console.log('Interactive element creation activated');
    },
    
    deactivate: function() {
        this.isActive = false;
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('click', this.onMouseClick, true);
        document.removeEventListener('keydown', this.onKeyDown, false);
        
        // Clear selections and preview
        this.clearSelections();
        this.removePreviewLine();
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
        // Update status
        this.updateStatus('Element creation mode deactivated');
        
        this.editor.signals.sceneGraphChanged.dispatch();
        console.log('Interactive element creation deactivated');
    },
    
    selectNode: function(node) {
        if (this.selectedNodes.indexOf(node) !== -1) {
            // Node already selected, deselect it
            this.deselectNode(node);
            return;
        }
        
        if (this.selectedNodes.length >= 2) {
            // Already have 2 nodes, replace the first one
            this.deselectNode(this.selectedNodes[0]);
        }
        
        this.selectedNodes.push(node);
        if (node.material && node.material.emissive) {
            node.material.emissive.setHex(0x00ff00);
        }
        
        this.updateStatus(`Node ${node.userData.nn} selected. ${this.selectedNodes.length}/2 nodes selected.`);
        
        if (this.selectedNodes.length === 2) {
            this.updateStatus(`Two nodes selected. Click to create element or press Enter.`);
            this.createElement();
        }
        
        this.editor.signals.sceneGraphChanged.dispatch();
    },
    
    deselectNode: function(node) {
        var index = this.selectedNodes.indexOf(node);
        if (index !== -1) {
            this.selectedNodes.splice(index, 1);
            if (node.material && node.material.emissive) {
                node.material.emissive.setHex(0x000066);
            }
        }
        this.removePreviewLine();
    },
    
    clearSelections: function() {
        this.selectedNodes.forEach(function(node) {
            if (node.material && node.material.emissive) {
                node.material.emissive.setHex(0x000066);
            }
        });
        this.selectedNodes = [];
    },
    
    updatePreviewLine: function(event) {
        if (this.selectedNodes.length !== 1) return;
        
        var viewport = document.getElementById('viewport');
        var rect = viewport.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.editor.camera);
        
        // Create a ground plane intersection for the preview end point
        var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        var intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(groundPlane, intersectPoint);
        
        if (intersectPoint) {
            this.createPreviewLine(this.selectedNodes[0].position, intersectPoint);
        }
    },
    
    createPreviewLine: function(startPos, endPos) {
        this.removePreviewLine();
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(startPos.x, startPos.y, startPos.z));
        geometry.vertices.push(new THREE.Vector3(endPos.x, endPos.y, endPos.z));
        
        this.previewLine = LineUtils.createLineMesh(geometry, {
            color: 0x00ff00,
            lineWidth: 12
        });
        this.previewLine.material.transparent = true;
        this.previewLine.material.opacity = 0.7;
        this.previewLine.name = 'PreviewLine';
        
        this.editor.scene.add(this.previewLine);
    },
    
    removePreviewLine: function() {
        if (this.previewLine) {
            this.editor.scene.remove(this.previewLine);
            this.previewLine = null;
        }
    },
    
    createElement: function() {
        if (this.selectedNodes.length !== 2) return;
        
        var nodeI = this.selectedNodes[0];
        var nodeJ = this.selectedNodes[1];
        
        // Validate element creation
        if (!this.validator.validateElement(nodeI, nodeJ, this.currentSectionId)) {
            this.updateStatus('Error: ' + this.validator.getErrorMessages().join(', '));
            return;
        }
        
        // Get existing elements for duplicate check
        var existingElements = [];
        this.editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'element') {
                existingElements.push(child);
            }
        });
        
        // Check for duplicate elements
        if (!this.validator.validateDuplicateElement(nodeI, nodeJ, existingElements)) {
            this.updateStatus('Warning: ' + this.validator.getWarningMessages().join(', '));
            // Continue anyway, but warn user
        }
        
        // Calculate element properties
        var startPos = nodeI.position;
        var endPos = nodeJ.position;
        var length = startPos.distanceTo(endPos);
        var centerPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        
        // Calculate local coordinate system
        var xLocal = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        var upVector = new THREE.Vector3(0, 1, 0);
        var yLocal = new THREE.Vector3().crossVectors(upVector, xLocal).normalize();
        var zLocal = new THREE.Vector3().crossVectors(xLocal, yLocal).normalize();
        
        // Handle vertical elements
        if (Math.abs(xLocal.y) > 0.99) {
            yLocal.set(1, 0, 0);
            zLocal.set(0, 0, 1);
        }
        
        // Create element geometry
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        geometry.vertices.push(new THREE.Vector3(length, 0, 0));
        
        // Create the element using utility function
        var element = LineUtils.createLineMesh(geometry, {
            color: 0x404040,
            lineWidth: 12
        });
        element.name = 'Element ' + this.elementCount;
        
        // Set element metadata
        element.userData = {
            'en': this.elementCount,
            'type': 'element',
            'nodei': nodeI.userData.nn,
            'nodej': nodeJ.userData.nn,
            'elem_type': 'beam', // Default to beam, can be changed
            'section_id': this.currentSectionId,
            'length': length,
            'label_position': {
                x: centerPos.x,
                y: centerPos.y,
                z: centerPos.z
            },
            'xLocal': xLocal,
            'yLocal': yLocal,
            'zLocal': zLocal,
            // Default fixity conditions (pinned)
            'fixity_dx_i': 0, 'fixity_dy_i': 0, 'fixity_dz_i': 0,
            'fixity_rx_i': 0, 'fixity_ry_i': 0, 'fixity_rz_i': 0,
            'fixity_dx_j': 0, 'fixity_dy_j': 0, 'fixity_dz_j': 0,
            'fixity_rx_j': 0, 'fixity_ry_j': 0, 'fixity_rz_j': 0
        };
        
        // Position and orient the element
        element.position.copy(startPos);
        element.lookAt(endPos);
        element.rotateY(-Math.PI / 2); // Adjust for Three.js coordinate system
        
        // Add to scene using command system
        this.editor.execute(new AddObjectCommand(element));
        
        // Update status
        this.updateStatus(`Element ${this.elementCount} created between nodes ${nodeI.userData.nn} and ${nodeJ.userData.nn}`);
        
        // Clear selections and prepare for next element
        this.clearSelections();
        this.removePreviewLine();
        this.elementCount++;
        
        // Auto-select the new element
        this.editor.select(element);
        
        console.log('Element created:', element.userData);
    },
    
    updateElementCount: function() {
        // Find the highest existing element number
        var maxElementNum = 0;
        this.editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'element' && child.userData.en) {
                maxElementNum = Math.max(maxElementNum, child.userData.en);
            }
        });
        this.elementCount = maxElementNum + 1;
    },
    
    updateStatus: function(message) {
        console.log('Status:', message);
        
        // Try to update AIDEA status if available
        var statusDiv = document.getElementById('modelStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = '#007bff';
        }
    },
    
    setSectionId: function(sectionId) {
        this.currentSectionId = sectionId;
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
window.InteractiveElementCreator = InteractiveElementCreator;