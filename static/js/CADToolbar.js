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
    this.container.setHeight('600px');
    this.container.setBackgroundColor('#f8f9fa');
    this.container.setBorder('1px solid #dee2e6');
    this.container.setPadding('10px');
    this.container.setZIndex('1000');
    
    // Add border radius via direct style manipulation
    this.container.dom.style.borderRadius = '5px';
    this.container.dom.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    this.container.dom.style.overflowY = 'auto';
    this.container.dom.style.maxHeight = '80vh';
    
    // Title
    var title = new UI.Text('Grid Options').setFontSize('16px').setFontWeight('bold').setColor('#333');
    this.container.add(title);
    this.container.add(new UI.Break());
    
    // Mode Selection Toolbar (Top grey toolbar)
    var modeToolbar = new UI.Panel();
    modeToolbar.setClass('mode-toolbar');
    modeToolbar.setBackgroundColor('#f5f5f5');
    modeToolbar.setBorder('1px solid #ddd');
    modeToolbar.setPadding('8px');
    modeToolbar.setMarginBottom('10px');
    modeToolbar.dom.style.borderRadius = '4px';
    
    var modeTitle = new UI.Text('Mode Selection').setFontSize('12px').setFontWeight('bold').setColor('#666');
    modeToolbar.add(modeTitle);
    modeToolbar.add(new UI.Break());
    
    var modeButtonRow = new UI.Row();
    modeButtonRow.setMarginTop('5px');
    
    // Add Members/Nodes mode button
    this.addModeButton = new UI.Button('+ Add Members/Nodes').setWidth('140px').setMarginRight('5px');
    this.addModeButton.onClick(function() {
        scope.setMode('add');
    });
    
    // Select/Move mode button
    this.selectModeButton = new UI.Button('✋ Select/Move').setWidth('100px').setMarginRight('5px');
    this.selectModeButton.onClick(function() {
        scope.setMode('select');
    });
    
    // Edit mode button
    this.editModeButton = new UI.Button('✏️ Edit').setWidth('80px');
    this.editModeButton.onClick(function() {
        scope.setMode('edit');
    });
    
    modeButtonRow.add(this.addModeButton);
    modeButtonRow.add(this.selectModeButton);
    modeButtonRow.add(this.editModeButton);
    modeToolbar.add(modeButtonRow);
    
    this.container.add(modeToolbar);
    
    // Current mode tracking
    this.currentMode = 'select'; // Default mode
    this.setMode('select'); // Initialize with select mode
    
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
        var enabled = scope.gridSnapCheckbox.getValue();
        console.log('Grid snap:', enabled);
        
        // Update status based on grid nodes availability
        if (enabled && scope.editor.gridNodes && scope.editor.gridNodes.config.enabled) {
            scope.updateStatus('Grid snapping enabled - nodes will snap to grid');
        } else if (enabled) {
            scope.updateStatus('Grid snapping enabled - using default 0.5 unit grid');
        } else {
            scope.updateStatus('Grid snapping disabled');
        }
    });
    
    nodeOptionsRow.add(gridSnapLabel);
    nodeOptionsRow.add(this.gridSnapCheckbox);
    
    // Add grid status indicator
    this.gridStatusText = new UI.Text('').setFontSize('11px').setColor('#666');
    nodeOptionsRow.add(this.gridStatusText);
    
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
    
    // Import/Export section
    var importSection = new UI.Panel();
    importSection.setMarginTop('15px');
    
    var importTitle = new UI.Text('Import/Export').setFontSize('14px').setFontWeight('bold');
    importSection.add(importTitle);
    importSection.add(new UI.Break());
    
    var importRow = new UI.Row();
    
    // Create hidden form and file input (like in Menubar.File.js)
    var form = document.createElement('form');
    form.style.display = 'none';
    document.body.appendChild(form);
    
    var fileInput = document.createElement('input');
    fileInput.multiple = false;
    fileInput.type = 'file';
    fileInput.accept = '.dxf';
    fileInput.addEventListener('change', function(event) {
        if (confirm('Any unsaved data will be lost. Are you sure?')) {
            scope.editor.clear();
            
            // Create FormData to properly send the file
            var formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            $.ajax({
                type: 'POST',
                timeout: 20000,
                url: '/import_dxf',
                data: formData,
                processData: false,
                contentType: false,  // Let jQuery set the content type
                dataType: 'json',   // Expect JSON response
                success: function(data) {
                    if (data.success) {
                        // Process the imported data (same format as /load endpoint)
                        scope.processImportedData(data.data);
                        scope.updateStatus(data.message);
                    } else {
                        scope.updateStatus('Error: ' + data.error);
                        alert('Error importing DXF: ' + data.error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error:', xhr, status, error);
                    var errorMsg = 'Error importing DXF file';
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMsg = xhr.responseJSON.error;
                    }
                    scope.updateStatus(errorMsg);
                    alert(errorMsg);
                }
            });
        }
        form.reset();
    });
    form.appendChild(fileInput);
    
    var dxfImportButton = new UI.Button('📁 Import DXF').setWidth('120px').setMarginRight('5px');
    dxfImportButton.onClick(function() {
        console.log('DXF Import button clicked - triggering file input');
        fileInput.click();
    });
    
    var exportButton = new UI.Button('💾 Export').setWidth('100px');
    exportButton.onClick(function() {
        scope.exportModel();
    });
    
    importRow.add(dxfImportButton);
    importRow.add(exportButton);
    importSection.add(importRow);
    
    this.container.add(importSection);
    
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
    
    // Start collapsed by default
    this.container.setDisplay('none');
};

CADToolbar.prototype = {
    
    setMode: function(mode) {
        // Reset all mode buttons with safety checks
        if (this.addModeButton && this.addModeButton.setBackgroundColor) {
            this.addModeButton.setBackgroundColor('');
            this.addModeButton.setColor('');
        }
        if (this.selectModeButton && this.selectModeButton.setBackgroundColor) {
            this.selectModeButton.setBackgroundColor('');
            this.selectModeButton.setColor('');
        }
        if (this.editModeButton && this.editModeButton.setBackgroundColor) {
            this.editModeButton.setBackgroundColor('');
            this.editModeButton.setColor('');
        }
        
        // Set active mode button
        this.currentMode = mode;
        var activeColor = '#007bff';
        var activeTextColor = '#ffffff';
        
        switch(mode) {
            case 'add':
                if (this.addModeButton && this.addModeButton.setBackgroundColor) {
                    this.addModeButton.setBackgroundColor(activeColor);
                    this.addModeButton.setColor(activeTextColor);
                }
                this.updateStatus('Add mode active - Create nodes and elements');
                break;
            case 'select':
                if (this.selectModeButton && this.selectModeButton.setBackgroundColor) {
                    this.selectModeButton.setBackgroundColor(activeColor);
                    this.selectModeButton.setColor(activeTextColor);
                }
                this.updateStatus('Select mode active - Click to select and move objects');
                break;
            case 'edit':
                if (this.editModeButton && this.editModeButton.setBackgroundColor) {
                    this.editModeButton.setBackgroundColor(activeColor);
                    this.editModeButton.setColor(activeTextColor);
                }
                this.updateStatus('Edit mode active - Modify object properties');
                break;
        }
        
        // Deactivate current tools when switching modes
        this.deactivateAllTools();
        
        console.log('CAD Toolbar mode set to:', mode);
    },
    
    toggleNodeCreation: function() {
        if (this.currentTool === 'node') {
            this.deactivateAllTools();
        } else {
            this.deactivateAllTools();
            if (this.nodeCreator && this.nodeCreator.activate) {
                this.nodeCreator.activate();
            }
            this.currentTool = 'node';
            if (this.nodeButton && this.nodeButton.setBackgroundColor) {
                this.nodeButton.setBackgroundColor('#007bff');
                this.nodeButton.setColor('#ffffff');
            }
            this.updateStatus('Node creation mode active - Click to place nodes');
        }
    },
    
    toggleElementCreation: function() {
        if (this.currentTool === 'element') {
            this.deactivateAllTools();
        } else {
            this.deactivateAllTools();
            if (this.elementCreator && this.elementCreator.activate) {
                this.elementCreator.activate();
            }
            this.currentTool = 'element';
            if (this.elementButton && this.elementButton.setBackgroundColor) {
                this.elementButton.setBackgroundColor('#007bff');
                this.elementButton.setColor('#ffffff');
            }
            this.updateStatus('Element creation mode active - Click nodes to connect');
        }
    },
    
    deactivateAllTools: function() {
        if (this.nodeCreator && this.nodeCreator.deactivate) {
            this.nodeCreator.deactivate();
        }
        if (this.elementCreator && this.elementCreator.deactivate) {
            this.elementCreator.deactivate();
        }
        this.currentTool = null;
        
        // Reset button styles with safety checks
        if (this.nodeButton && this.nodeButton.setBackgroundColor) {
            this.nodeButton.setBackgroundColor('');
            this.nodeButton.setColor('');
        }
        if (this.elementButton && this.elementButton.setBackgroundColor) {
            this.elementButton.setBackgroundColor('');
            this.elementButton.setColor('');
        }
        
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
        
        // Apply grid snapping if enabled
        var snappedPosition = this.nodeCreator.snapToGrid(position);
        this.nodeCreator.createNodeAtPosition(snappedPosition);
        
        // Show snap feedback
        var snapInfo = '';
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var distance = position.distanceTo(snappedPosition);
            if (distance > 0.001) {
                snapInfo = ` (snapped ${distance.toFixed(3)} units to grid)`;
            }
        }
        
        this.updateStatus(`Node created at (${snappedPosition.x.toFixed(2)}, ${snappedPosition.y.toFixed(2)}, ${snappedPosition.z.toFixed(2)})${snapInfo}`);
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
        if (this.statusText && this.statusText.setValue) {
            this.statusText.setValue(message);
        }
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
        
        // Update grid status periodically
        setInterval(function() {
            scope.updateGridStatus();
        }, 1000);
    },
    
    updateGridStatus: function() {
        if (!this.gridStatusText) return;
        
        if (this.editor.gridNodes && this.editor.gridNodes.config.enabled) {
            var gridSize = this.editor.gridNodes.config.gridSize;
            var totalSize = this.editor.gridNodes.config.totalSize;
            this.gridStatusText.setValue(`Grid: ${gridSize}m spacing, ${totalSize.x}×${totalSize.y}×${totalSize.z}m`);
            this.gridStatusText.setColor('#4CAF50');
        } else {
            this.gridStatusText.setValue('No grid');
            this.gridStatusText.setColor('#999');
        }
    },
    
    
    processImportedData: function(dataString) {
        // Parse the data string (same format as /load endpoint)
        var parts = dataString.split('|');
        if (parts.length >= 7) {
            var nodesData = JSON.parse(parts[0]);
            var elementsData = JSON.parse(parts[1]);
            var pointLoadsData = JSON.parse(parts[2]);
            var distLoadsData = JSON.parse(parts[3]);
            var materialsData = JSON.parse(parts[4]);
            var sectionsData = JSON.parse(parts[5]);
            var mqnData = JSON.parse(parts[6]);
            
            console.log('Processing imported DXF data:');
            console.log('Nodes:', nodesData.data.length);
            console.log('Elements:', elementsData.data.length);
            
            // Clear existing model
            this.editor.clear();
            
            // Use the same function as the main load functionality
            if (typeof drawFromAidea === 'function') {
                drawFromAidea(this.editor, nodesData, elementsData);
                
                // Store data globally for other functions (same as main load)
                window.currentNodes = nodesData;
                window.currentElements = elementsData;
                window.currentPointLoads = pointLoadsData;
                window.currentDistLoads = distLoadsData;
                window.currentMaterials = materialsData;
                window.currentSections = sectionsData;
                
                // Enable analysis button if it exists
                var analysisBtn = document.getElementById('runAnalysisBtn');
                if (analysisBtn) {
                    analysisBtn.disabled = false;
                }
                
                console.log('DXF data loaded successfully into editor');
            } else {
                console.error('drawFromAidea function not available');
                this.updateStatus('Error: Could not render imported data');
            }
        } else {
            console.error('Invalid data format received from server');
            this.updateStatus('Error: Invalid data format from server');
        }
    },
    
    exportModel: function() {
        // Placeholder for export functionality
        this.updateStatus('Export functionality not yet implemented');
        console.log('Export model requested');
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