/**
 * CAD Toolbar for Interactive Creation Tools
 * Provides UI controls for node and element creation modes
 */

var CADToolbar = function(editor) {
    var scope = this;
    var signals = editor.signals;
    
    this.editor = editor;
    this.nodeCreator = new InteractiveNodeCreator(editor);
    this.elementCreator = new InteractiveElementCreator(editor);
    this.currentTool = null;
    
    // Create toolbar container
    this.container = new UI.Panel();
    this.container.setClass('cad-toolbar');
    this.container.setPosition('absolute');
    this.container.setTop('10px');
    this.container.setLeft('10px');
    this.container.setWidth('300px');
    this.container.setBackgroundColor('#f8f9fa');
    this.container.setBorder('1px solid #dee2e6');
    this.container.setPadding('10px');
    this.container.setZIndex('1000');
    
    // Add border radius via direct style manipulation
    this.container.dom.style.borderRadius = '5px';
    this.container.dom.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    // Title
    var title = new UI.Text('CAD Creation Tools').setFontSize('16px').setFontWeight('bold');
    this.container.add(title);
    this.container.add(new UI.Break());
    
    // Node creation section
    var nodeSection = new UI.Panel();
    nodeSection.setMarginTop('10px');
    
    var nodeTitle = new UI.Text('Node Creation').setFontSize('14px').setFontWeight('bold');
    nodeSection.add(nodeTitle);
    nodeSection.add(new UI.Break());
    
    // Node creation buttons
    var nodeButtonRow = new UI.Row();
    
    this.nodeButton = new UI.Button('📍 Add Nodes').setWidth('120px').setMarginRight('5px');
    this.nodeButton.onClick(function() {
        scope.toggleNodeCreation();
    });
    
    var coordNodeButton = new UI.Button('⌨️ By Coords').setWidth('100px');
    coordNodeButton.onClick(function() {
        scope.showCoordinateInput();
    });
    
    nodeButtonRow.add(this.nodeButton);
    nodeButtonRow.add(coordNodeButton);
    nodeSection.add(nodeButtonRow);
    
    // Node creation options
    var nodeOptionsRow = new UI.Row();
    nodeOptionsRow.setMarginTop('5px');
    
    var gridSnapLabel = new UI.Text('Grid Snap:').setWidth('70px');
    this.gridSnapCheckbox = new UI.Checkbox(true);
    this.gridSnapCheckbox.onChange(function() {
        console.log('Grid snap:', scope.gridSnapCheckbox.getValue());
    });
    
    nodeOptionsRow.add(gridSnapLabel);
    nodeOptionsRow.add(this.gridSnapCheckbox);
    nodeSection.add(nodeOptionsRow);
    
    this.container.add(nodeSection);
    
    // Element creation section
    var elementSection = new UI.Panel();
    elementSection.setMarginTop('15px');
    
    var elementTitle = new UI.Text('Element Creation').setFontSize('14px').setFontWeight('bold');
    elementSection.add(elementTitle);
    elementSection.add(new UI.Break());
    
    // Element creation buttons
    var elementButtonRow = new UI.Row();
    
    this.elementButton = new UI.Button('🔗 Connect Nodes').setWidth('120px').setMarginRight('5px');
    this.elementButton.onClick(function() {
        scope.toggleElementCreation();
    });
    
    var manualElementButton = new UI.Button('⌨️ Manual').setWidth('100px');
    manualElementButton.onClick(function() {
        scope.showManualElementInput();
    });
    
    elementButtonRow.add(this.elementButton);
    elementButtonRow.add(manualElementButton);
    elementSection.add(elementButtonRow);
    
    // Element options
    var elementOptionsRow = new UI.Row();
    elementOptionsRow.setMarginTop('5px');
    
    var sectionLabel = new UI.Text('Section ID:').setWidth('70px');
    this.sectionInput = new UI.Number(1).setWidth('50px').setPrecision(0);
    this.sectionInput.onChange(function() {
        scope.elementCreator.setSectionId(scope.sectionInput.getValue());
    });
    
    elementOptionsRow.add(sectionLabel);
    elementOptionsRow.add(this.sectionInput);
    elementSection.add(elementOptionsRow);
    
    this.container.add(elementSection);
    
    // Status section
    var statusSection = new UI.Panel();
    statusSection.setMarginTop('15px');
    
    var statusTitle = new UI.Text('Status').setFontSize('14px').setFontWeight('bold');
    statusSection.add(statusTitle);
    statusSection.add(new UI.Break());
    
    this.statusText = new UI.Text('Ready').setFontSize('12px').setColor('#666');
    statusSection.add(this.statusText);
    
    this.container.add(statusSection);
    
    // Quick actions
    var actionsSection = new UI.Panel();
    actionsSection.setMarginTop('15px');
    
    var actionsTitle = new UI.Text('Quick Actions').setFontSize('14px').setFontWeight('bold');
    actionsSection.add(actionsTitle);
    actionsSection.add(new UI.Break());
    
    var actionsRow = new UI.Row();
    
    var clearButton = new UI.Button('🗑️ Clear').setWidth('70px').setMarginRight('5px');
    clearButton.onClick(function() {
        scope.clearAll();
    });
    
    var undoButton = new UI.Button('↶ Undo').setWidth('70px').setMarginRight('5px');
    undoButton.onClick(function() {
        scope.editor.undo();
    });
    
    var redoButton = new UI.Button('↷ Redo').setWidth('70px');
    redoButton.onClick(function() {
        scope.editor.redo();
    });
    
    actionsRow.add(clearButton);
    actionsRow.add(undoButton);
    actionsRow.add(redoButton);
    actionsSection.add(actionsRow);
    
    this.container.add(actionsSection);
    
    // Initialize status updates
    this.setupStatusUpdates();
};

CADToolbar.prototype = {
    
    toggleNodeCreation: function() {
        if (this.currentTool === 'node') {
            this.deactivateAllTools();
        } else {
            this.deactivateAllTools();
            this.nodeCreator.activate();
            this.currentTool = 'node';
            this.nodeButton.setBackgroundColor('#007bff');
            this.nodeButton.setColor('#ffffff');
            this.updateStatus('Node creation mode active - Click to place nodes');
        }
    },
    
    toggleElementCreation: function() {
        if (this.currentTool === 'element') {
            this.deactivateAllTools();
        } else {
            this.deactivateAllTools();
            this.elementCreator.activate();
            this.currentTool = 'element';
            this.elementButton.setBackgroundColor('#007bff');
            this.elementButton.setColor('#ffffff');
            this.updateStatus('Element creation mode active - Click nodes to connect');
        }
    },
    
    deactivateAllTools: function() {
        this.nodeCreator.deactivate();
        this.elementCreator.deactivate();
        this.currentTool = null;
        
        // Reset button styles
        this.nodeButton.setBackgroundColor('');
        this.nodeButton.setColor('');
        this.elementButton.setBackgroundColor('');
        this.elementButton.setColor('');
        
        this.updateStatus('Ready');
    },
    
    showCoordinateInput: function() {
        var scope = this;
        
        // Create modal for coordinate input
        var modal = new UI.Modal();
        
        var container = new UI.Panel();
        container.setPadding('20px');
        
        var title = new UI.Text('Add Node by Coordinates').setFontSize('18px').setFontWeight('bold');
        container.add(title);
        container.add(new UI.Break());
        container.add(new UI.Break());
        
        // Coordinate inputs
        var xRow = new UI.Row();
        xRow.add(new UI.Text('X:').setWidth('30px'));
        var xInput = new UI.Number(0).setWidth('100px').setPrecision(3);
        xRow.add(xInput);
        container.add(xRow);
        
        var yRow = new UI.Row();
        yRow.add(new UI.Text('Y:').setWidth('30px'));
        var yInput = new UI.Number(0).setWidth('100px').setPrecision(3);
        yRow.add(yInput);
        container.add(yRow);
        
        var zRow = new UI.Row();
        zRow.add(new UI.Text('Z:').setWidth('30px'));
        var zInput = new UI.Number(0).setWidth('100px').setPrecision(3);
        zRow.add(zInput);
        container.add(zRow);
        
        container.add(new UI.Break());
        
        // Buttons
        var buttonRow = new UI.Row();
        
        var createButton = new UI.Button('Create Node').setMarginRight('10px');
        createButton.onClick(function() {
            var position = new THREE.Vector3(
                xInput.getValue(),
                yInput.getValue(),
                zInput.getValue()
            );
            scope.createNodeAtCoordinates(position);
            modal.hide();
        });
        
        var cancelButton = new UI.Button('Cancel');
        cancelButton.onClick(function() {
            modal.hide();
        });
        
        buttonRow.add(createButton);
        buttonRow.add(cancelButton);
        container.add(buttonRow);
        
        modal.show(container);
    },
    
    showManualElementInput: function() {
        var scope = this;
        
        // Create modal for manual element input
        var modal = new UI.Modal();
        
        var container = new UI.Panel();
        container.setPadding('20px');
        
        var title = new UI.Text('Create Element Manually').setFontSize('18px').setFontWeight('bold');
        container.add(title);
        container.add(new UI.Break());
        container.add(new UI.Break());
        
        // Node inputs
        var nodeIRow = new UI.Row();
        nodeIRow.add(new UI.Text('Node I:').setWidth('60px'));
        var nodeIInput = new UI.Number(1).setWidth('80px').setPrecision(0);
        nodeIRow.add(nodeIInput);
        container.add(nodeIRow);
        
        var nodeJRow = new UI.Row();
        nodeJRow.add(new UI.Text('Node J:').setWidth('60px'));
        var nodeJInput = new UI.Number(2).setWidth('80px').setPrecision(0);
        nodeJRow.add(nodeJInput);
        container.add(nodeJRow);
        
        var sectionRow = new UI.Row();
        sectionRow.add(new UI.Text('Section:').setWidth('60px'));
        var sectionInput = new UI.Number(1).setWidth('80px').setPrecision(0);
        sectionRow.add(sectionInput);
        container.add(sectionRow);
        
        container.add(new UI.Break());
        
        // Buttons
        var buttonRow = new UI.Row();
        
        var createButton = new UI.Button('Create Element').setMarginRight('10px');
        createButton.onClick(function() {
            scope.createElementManually(
                nodeIInput.getValue(),
                nodeJInput.getValue(),
                sectionInput.getValue()
            );
            modal.hide();
        });
        
        var cancelButton = new UI.Button('Cancel');
        cancelButton.onClick(function() {
            modal.hide();
        });
        
        buttonRow.add(createButton);
        buttonRow.add(cancelButton);
        container.add(buttonRow);
        
        modal.show(container);
    },
    
    createNodeAtCoordinates: function(position) {
        // Use the node creator to create a node at specific coordinates
        this.nodeCreator.updateNodeCount();
        this.nodeCreator.createNodeAtPosition(position);
        this.updateStatus(`Node created at (${position.x}, ${position.y}, ${position.z})`);
    },
    
    createElementManually: function(nodeI, nodeJ, sectionId) {
        // Find the nodes by their numbers
        var nodeIObj = null;
        var nodeJObj = null;
        
        this.editor.scene.traverse(function(child) {
            if (child.userData && child.userData.type === 'node') {
                if (child.userData.nn === nodeI) nodeIObj = child;
                if (child.userData.nn === nodeJ) nodeJObj = child;
            }
        });
        
        if (!nodeIObj || !nodeJObj) {
            this.updateStatus('Error: Could not find specified nodes');
            return;
        }
        
        // Set the section ID and create element
        this.elementCreator.setSectionId(sectionId);
        this.elementCreator.selectedNodes = [nodeIObj, nodeJObj];
        this.elementCreator.createElement();
        this.elementCreator.selectedNodes = [];
    },
    
    clearAll: function() {
        if (confirm('Are you sure you want to clear all objects?')) {
            this.deactivateAllTools();
            this.editor.clear();
            this.updateStatus('All objects cleared');
        }
    },
    
    updateStatus: function(message) {
        this.statusText.setValue(message);
        console.log('CAD Toolbar Status:', message);
    },
    
    setupStatusUpdates: function() {
        var scope = this;
        
        // Listen to editor signals for status updates
        this.editor.signals.objectAdded.add(function(object) {
            if (object.userData && object.userData.type === 'node') {
                scope.updateStatus(`Node ${object.userData.nn} added`);
            } else if (object.userData && object.userData.type === 'element') {
                scope.updateStatus(`Element ${object.userData.en} added`);
            }
        });
        
        this.editor.signals.objectRemoved.add(function(object) {
            if (object.userData && object.userData.type === 'node') {
                scope.updateStatus(`Node ${object.userData.nn} removed`);
            } else if (object.userData && object.userData.type === 'element') {
                scope.updateStatus(`Element ${object.userData.en} removed`);
            }
        });
        
        this.editor.signals.editorCleared.add(function() {
            scope.updateStatus('Editor cleared');
        });
    },
    
    show: function() {
        this.container.setDisplay('block');
    },
    
    hide: function() {
        this.container.setDisplay('none');
    },
    
    toggle: function() {
        if (this.container.dom.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
};

// Export for global use
window.CADToolbar = CADToolbar;