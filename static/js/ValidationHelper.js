/**
 * Validation Helper for CAD Operations
 * Provides validation and error handling for node and element creation
 */

var ValidationHelper = function() {
    this.errors = [];
    this.warnings = [];
};

ValidationHelper.prototype = {
    
    // Validate node creation
    validateNode: function(position, existingNodes) {
        this.clearMessages();
        
        // Check for valid coordinates
        if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            this.addError('Invalid coordinates provided');
            return false;
        }
        
        // Check for duplicate nodes (within tolerance)
        var tolerance = 0.01;
        for (var i = 0; i < existingNodes.length; i++) {
            var node = existingNodes[i];
            if (node.userData && node.userData.type === 'node') {
                var distance = position.distanceTo(node.position);
                if (distance < tolerance) {
                    this.addWarning(`Node very close to existing node ${node.userData.nn} (distance: ${distance.toFixed(4)})`);
                }
            }
        }
        
        // Check coordinate bounds
        var maxCoord = 1000;
        if (Math.abs(position.x) > maxCoord || Math.abs(position.y) > maxCoord || Math.abs(position.z) > maxCoord) {
            this.addWarning('Node coordinates are very large, consider using smaller values');
        }
        
        return true;
    },
    
    // Validate element creation
    validateElement: function(nodeI, nodeJ, sectionId) {
        this.clearMessages();
        
        // Check if nodes exist
        if (!nodeI || !nodeJ) {
            this.addError('Both start and end nodes must be specified');
            return false;
        }
        
        // Check if nodes are the same
        if (nodeI.userData.nn === nodeJ.userData.nn) {
            this.addError('Start and end nodes cannot be the same');
            return false;
        }
        
        // Check if nodes are valid node objects
        if (!nodeI.userData || nodeI.userData.type !== 'node' || 
            !nodeJ.userData || nodeJ.userData.type !== 'node') {
            this.addError('Selected objects are not valid nodes');
            return false;
        }
        
        // Check section ID
        if (!sectionId || sectionId < 1) {
            this.addError('Valid section ID must be provided (>= 1)');
            return false;
        }
        
        // Check element length
        var length = nodeI.position.distanceTo(nodeJ.position);
        if (length < 0.001) {
            this.addError('Element length is too small (nodes are too close)');
            return false;
        }
        
        if (length > 1000) {
            this.addWarning('Element length is very large, verify coordinates');
        }
        
        return true;
    },
    
    // Check for duplicate elements
    validateDuplicateElement: function(nodeI, nodeJ, existingElements) {
        for (var i = 0; i < existingElements.length; i++) {
            var element = existingElements[i];
            if (element.userData && element.userData.type === 'element') {
                var elemNodeI = element.userData.nodei;
                var elemNodeJ = element.userData.nodej;
                
                // Check both directions
                if ((elemNodeI === nodeI.userData.nn && elemNodeJ === nodeJ.userData.nn) ||
                    (elemNodeI === nodeJ.userData.nn && elemNodeJ === nodeI.userData.nn)) {
                    this.addWarning(`Element already exists between nodes ${nodeI.userData.nn} and ${nodeJ.userData.nn}`);
                    return false;
                }
            }
        }
        return true;
    },
    
    // Validate model consistency
    validateModel: function(scene) {
        this.clearMessages();
        
        var nodes = [];
        var elements = [];
        var nodeIds = new Set();
        var elementIds = new Set();
        
        // Collect all nodes and elements
        scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node') {
                nodes.push(child);
                if (nodeIds.has(child.userData.nn)) {
                    this.addError(`Duplicate node ID: ${child.userData.nn}`);
                }
                nodeIds.add(child.userData.nn);
            } else if (child.userData && child.userData.type === 'element') {
                elements.push(child);
                if (elementIds.has(child.userData.en)) {
                    this.addError(`Duplicate element ID: ${child.userData.en}`);
                }
                elementIds.add(child.userData.en);
            }
        }.bind(this));
        
        // Check element connectivity
        elements.forEach(function(element) {
            var nodeI = element.userData.nodei;
            var nodeJ = element.userData.nodej;
            
            var nodeIExists = nodes.some(n => n.userData.nn === nodeI);
            var nodeJExists = nodes.some(n => n.userData.nn === nodeJ);
            
            if (!nodeIExists) {
                this.addError(`Element ${element.userData.en} references non-existent node ${nodeI}`);
            }
            if (!nodeJExists) {
                this.addError(`Element ${element.userData.en} references non-existent node ${nodeJ}`);
            }
        }.bind(this));
        
        // Check for isolated nodes
        var connectedNodes = new Set();
        elements.forEach(function(element) {
            connectedNodes.add(element.userData.nodei);
            connectedNodes.add(element.userData.nodej);
        });
        
        nodes.forEach(function(node) {
            if (!connectedNodes.has(node.userData.nn)) {
                this.addWarning(`Node ${node.userData.nn} is not connected to any elements`);
            }
        }.bind(this));
        
        return this.errors.length === 0;
    },
    
    // Helper methods
    addError: function(message) {
        this.errors.push(message);
        console.error('Validation Error:', message);
    },
    
    addWarning: function(message) {
        this.warnings.push(message);
        console.warn('Validation Warning:', message);
    },
    
    clearMessages: function() {
        this.errors = [];
        this.warnings = [];
    },
    
    hasErrors: function() {
        return this.errors.length > 0;
    },
    
    hasWarnings: function() {
        return this.warnings.length > 0;
    },
    
    getErrorMessages: function() {
        return this.errors.slice();
    },
    
    getWarningMessages: function() {
        return this.warnings.slice();
    },
    
    getAllMessages: function() {
        var messages = [];
        this.errors.forEach(function(error) {
            messages.push({ type: 'error', message: error });
        });
        this.warnings.forEach(function(warning) {
            messages.push({ type: 'warning', message: warning });
        });
        return messages;
    },
    
    displayMessages: function(container) {
        var messages = this.getAllMessages();
        if (messages.length === 0) return;
        
        var messageHtml = '<div class="validation-messages">';
        messages.forEach(function(msg) {
            var className = msg.type === 'error' ? 'error-message' : 'warning-message';
            messageHtml += `<div class="${className}">${msg.message}</div>`;
        });
        messageHtml += '</div>';
        
        if (container) {
            container.innerHTML = messageHtml;
        } else {
            console.log('Validation Messages:', messages);
        }
    }
};

// Export for global use
window.ValidationHelper = ValidationHelper;