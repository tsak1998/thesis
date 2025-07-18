/**
 * Modern UI Panel for Grid Nodes Control
 * Simplified interface for the new blue nodes only grid system
 */

var GridNodesUI = function(editor) {
    var scope = this;
    this.editor = editor;
    this.gridNodes = new GridNodes(editor);
    
    // Create the main panel
    this.createPanel();
    this.setupEventListeners();
    
    // Add to editor for global access
    editor.gridNodesUI = this;
    editor.gridNodes = this.gridNodes;
};

GridNodesUI.prototype = {
    
    createPanel: function() {
        var scope = this;
        
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'grid-nodes-panel fade-in';
        this.container.style.display = 'none';
        
        // Header
        var header = document.createElement('div');
        header.className = 'grid-nodes-header';
        header.innerHTML = '<span>🔵</span> Grid Nodes Control';
        this.container.appendChild(header);
        
        // Body
        var body = document.createElement('div');
        body.className = 'grid-nodes-body';
        
        // Toggle Button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'grid-toggle-btn';
        this.toggleButton.innerHTML = '🔵 Enable Grid Nodes';
        this.toggleButton.onclick = function() {
            scope.toggleGrid();
        };
        body.appendChild(this.toggleButton);
        
        // Spacing Control
        var spacingGroup = this.createParameterGroup('Grid Spacing (meters)', [
            { label: 'Spacing', id: 'spacing', value: 5.0, min: 0.5, max: 20, step: 0.5 }
        ]);
        body.appendChild(spacingGroup);
        
        // Repetition Control
        var repetitionGroup = this.createParameterGroup('Grid Repetition', [
            { label: 'Repetition', id: 'repetition', value: 3, min: 1, max: 10, step: 1 }
        ]);
        body.appendChild(repetitionGroup);
        
        // Snapping Controls
        var snappingGroup = document.createElement('div');
        snappingGroup.className = 'parameter-group';
        
        var snappingLabel = document.createElement('label');
        snappingLabel.className = 'parameter-label';
        snappingLabel.textContent = 'Grid Snapping';
        snappingGroup.appendChild(snappingLabel);
        
        // Snap Enable Toggle
        var snapToggleContainer = document.createElement('div');
        snapToggleContainer.style.display = 'flex';
        snapToggleContainer.style.alignItems = 'center';
        snapToggleContainer.style.gap = '8px';
        snapToggleContainer.style.marginTop = '8px';
        
        this.snapToggleButton = document.createElement('button');
        this.snapToggleButton.className = 'snap-toggle-btn active';
        this.snapToggleButton.style.padding = '6px 12px';
        this.snapToggleButton.style.fontSize = '12px';
        this.snapToggleButton.style.fontWeight = 'bold';
        this.snapToggleButton.style.border = '2px solid #28a745';
        this.snapToggleButton.style.borderRadius = '4px';
        this.snapToggleButton.style.background = '#28a745';
        this.snapToggleButton.style.color = 'white';
        this.snapToggleButton.style.cursor = 'pointer';
        this.snapToggleButton.style.transition = 'all 0.2s ease';
        this.snapToggleButton.textContent = '🧲 Snap Enabled';
        this.snapToggleButton.onclick = function() {
            scope.toggleSnapping();
        };
        snapToggleContainer.appendChild(this.snapToggleButton);
        
        snappingGroup.appendChild(snapToggleContainer);
        
        // Snap Tolerance Control
        var toleranceContainer = document.createElement('div');
        toleranceContainer.style.marginTop = '8px';
        
        var toleranceLabel = document.createElement('label');
        toleranceLabel.textContent = 'Snap Tolerance';
        toleranceLabel.style.fontSize = '12px';
        toleranceLabel.style.fontWeight = '500';
        toleranceLabel.style.marginBottom = '4px';
        toleranceLabel.style.display = 'block';
        toleranceContainer.appendChild(toleranceLabel);
        
        var toleranceInputContainer = document.createElement('div');
        toleranceInputContainer.style.display = 'flex';
        toleranceInputContainer.style.alignItems = 'center';
        toleranceInputContainer.style.gap = '8px';
        
        this.toleranceSlider = document.createElement('input');
        this.toleranceSlider.type = 'range';
        this.toleranceSlider.className = 'tolerance-slider';
        this.toleranceSlider.min = '0.1';
        this.toleranceSlider.max = '5.0';
        this.toleranceSlider.step = '0.1';
        this.toleranceSlider.value = '0.1';
        this.toleranceSlider.style.flex = '1';
        this.toleranceSlider.oninput = function() {
            scope.updateSnapTolerance();
        };
        
        var toleranceValue = document.createElement('span');
        toleranceValue.id = 'toleranceValue';
        toleranceValue.textContent = '0.25';
        toleranceValue.style.fontSize = '12px';
        toleranceValue.style.color = '#666';
        toleranceValue.style.minWidth = '30px';
        toleranceValue.style.textAlign = 'right';
        
        toleranceInputContainer.appendChild(this.toleranceSlider);
        toleranceInputContainer.appendChild(toleranceValue);
        toleranceContainer.appendChild(toleranceInputContainer);
        snappingGroup.appendChild(toleranceContainer);
        
        body.appendChild(snappingGroup);
        
        // Quick Presets
        var presetsGroup = document.createElement('div');
        presetsGroup.className = 'parameter-group';
        
        var presetsLabel = document.createElement('label');
        presetsLabel.className = 'parameter-label';
        presetsLabel.textContent = 'Quick Presets';
        presetsGroup.appendChild(presetsLabel);
        
        var presetsRow = document.createElement('div');
        presetsRow.style.display = 'flex';
        presetsRow.style.gap = '8px';
        presetsRow.style.marginTop = '8px';
        
        var presets = [
            { name: 'Fine', spacing: 2.5, repetition: 4, nodes: '125' },
            { name: 'Default', spacing: 5.0, repetition: 3, nodes: '64' },
            { name: 'Coarse', spacing: 10.0, repetition: 2, nodes: '27' }
        ];
        
        presets.forEach(function(preset) {
            var btn = document.createElement('button');
            btn.className = 'modern-btn btn-secondary';
            btn.style.flex = '1';
            btn.style.fontSize = '11px';
            btn.style.padding = '6px 4px';
            btn.innerHTML = preset.name + '<br><small style="font-size:9px;opacity:0.7;">' + preset.nodes + ' nodes</small>';
            btn.title = `${preset.name}: ${preset.spacing}m spacing, ${preset.repetition} repetition (${preset.nodes} nodes)`;
            btn.onclick = function() {
                scope.applyPreset(preset);
            };
            presetsRow.appendChild(btn);
        });
        
        presetsGroup.appendChild(presetsRow);
        body.appendChild(presetsGroup);
        
        // Status Indicator
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'status-indicator inactive';
        this.statusIndicator.textContent = 'Grid Nodes: Disabled';
        body.appendChild(this.statusIndicator);
        
        // Info Display
        var infoGroup = document.createElement('div');
        infoGroup.className = 'parameter-group';
        infoGroup.style.marginTop = '12px';
        
        var infoLabel = document.createElement('label');
        infoLabel.className = 'parameter-label';
        infoLabel.textContent = 'Grid Information';
        infoGroup.appendChild(infoLabel);
        
        this.infoDisplay = document.createElement('div');
        this.infoDisplay.style.fontSize = '12px';
        this.infoDisplay.style.color = '#666';
        this.infoDisplay.style.lineHeight = '1.4';
        this.updateInfoDisplay();
        infoGroup.appendChild(this.infoDisplay);
        
        body.appendChild(infoGroup);
        
        this.container.appendChild(body);
        
        // Add to document
        document.body.appendChild(this.container);
    },
    
    createParameterGroup: function(title, parameters) {
        var group = document.createElement('div');
        group.className = 'parameter-group';
        
        var label = document.createElement('label');
        label.className = 'parameter-label';
        label.textContent = title;
        group.appendChild(label);
        
        var row = document.createElement('div');
        row.className = 'parameter-row';
        
        var scope = this;
        parameters.forEach(function(param) {
            var container = document.createElement('div');
            
            var paramLabel = document.createElement('label');
            paramLabel.textContent = param.label;
            paramLabel.style.fontSize = '12px';
            paramLabel.style.fontWeight = '500';
            paramLabel.style.marginBottom = '4px';
            paramLabel.style.display = 'block';
            container.appendChild(paramLabel);
            
            var input = document.createElement('input');
            input.type = 'number';
            input.className = 'parameter-input';
            input.id = param.id;
            input.value = param.value;
            input.min = param.min;
            input.max = param.max;
            input.step = param.step || 1;
            input.onchange = function() {
                scope.updateParameters();
            };
            container.appendChild(input);
            
            row.appendChild(container);
        });
        
        group.appendChild(row);
        return group;
    },
    
    toggleGrid: function() {
        var enabled = this.gridNodes.toggle();
        
        if (enabled) {
            this.toggleButton.textContent = '🔵 Disable Grid Nodes';
            this.toggleButton.classList.add('active');
            this.statusIndicator.className = 'status-indicator active';
            this.statusIndicator.textContent = 'Grid Nodes: Active';
        } else {
            this.toggleButton.textContent = '🔵 Enable Grid Nodes';
            this.toggleButton.classList.remove('active');
            this.statusIndicator.className = 'status-indicator inactive';
            this.statusIndicator.textContent = 'Grid Nodes: Disabled';
        }
        
        this.updateInfoDisplay();
    },
    
    updateParameters: function() {
        var spacingEl = document.getElementById('spacing');
        var repetitionEl = document.getElementById('repetition');
        
        // Update info display first to show warnings
        this.updateInfoDisplay();
        
        // Only update grid if enabled
        if (this.gridNodes.config.enabled) {
            if (spacingEl) {
                this.gridNodes.updateSpacing(spacingEl.value);
            }
            if (repetitionEl) {
                this.gridNodes.updateRepetition(repetitionEl.value);
            }
        }
    },
    
    toggleSnapping: function() {
        var enabled = this.gridNodes.toggleSnap();
        
        // Update button appearance
        if (enabled) {
            this.snapToggleButton.textContent = '🧲 Snap Enabled';
            this.snapToggleButton.style.background = '#28a745';
            this.snapToggleButton.style.borderColor = '#28a745';
            this.snapToggleButton.style.color = 'white';
            this.snapToggleButton.classList.add('active');
        } else {
            this.snapToggleButton.textContent = '🧲 Snap Disabled';
            this.snapToggleButton.style.background = 'transparent';
            this.snapToggleButton.style.borderColor = '#dc3545';
            this.snapToggleButton.style.color = '#dc3545';
            this.snapToggleButton.classList.remove('active');
        }
        
        this.updateInfoDisplay();
    },
    
    updateSnapTolerance: function() {
        if (!this.toleranceSlider) return;
        
        var value = parseFloat(this.toleranceSlider.value);
        this.gridNodes.setSnapTolerance(value);
        
        var valueEl = document.getElementById('toleranceValue');
        if (valueEl) {
            valueEl.textContent = value.toFixed(2);
        }
        
        this.updateInfoDisplay();
    },
    
    applyPreset: function(preset) {
        var spacingEl = document.getElementById('spacing');
        var repetitionEl = document.getElementById('repetition');
        
        // Apply preset values
        if (spacingEl) spacingEl.value = preset.spacing;
        if (repetitionEl) repetitionEl.value = preset.repetition;
        
        this.updateParameters();
        
        // Visual feedback
        if (this.container) {
            var buttons = this.container.querySelectorAll('.modern-btn.btn-secondary');
            buttons.forEach(function(btn) {
                btn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
                btn.style.color = 'white';
                setTimeout(function() {
                    btn.style.background = '';
                    btn.style.color = '';
                }, 200);
            });
        }
    },
    
    updateInfoDisplay: function() {
        var info = this.gridNodes.getGridInfo();
        
        var html = '';
        if (info.enabled) {
            // Get current values from UI elements
            var spacingEl = document.getElementById('spacing');
            var repetitionEl = document.getElementById('repetition');
            
            var spacing = (spacingEl && spacingEl.value) ? parseFloat(spacingEl.value) : info.spacing;
            var repetition = (repetitionEl && repetitionEl.value) ? parseInt(repetitionEl.value) : info.repetition;
            
            // Calculate grid dimensions
            var maxCoordinate = repetition * spacing;
            var totalNodes = Math.pow(repetition + 1, 3);
            
            html += `<strong>Active Nodes:</strong> ${info.nodeCount}<br>`;
            html += `<strong>Grid Spacing:</strong> ${spacing}m<br>`;
            html += `<strong>Grid Repetition:</strong> ${repetition}<br>`;
            html += `<strong>Grid Size:</strong> ${repetition + 1} × ${repetition + 1} × ${repetition + 1}<br>`;
            html += `<strong>Max Coordinates:</strong> (${maxCoordinate}, ${maxCoordinate}, ${maxCoordinate})<br>`;
            html += `<strong>Coordinate Range:</strong> 0 to ${maxCoordinate}m<br>`;
            
            // Show snapping information
            if (info.snap) {
                html += `<strong>Grid Snapping:</strong> ${info.snap.enabled ? 'Enabled' : 'Disabled'}<br>`;
                if (info.snap.enabled) {
                    html += `<strong>Snap Tolerance:</strong> ${info.snap.tolerance.toFixed(2)}m<br>`;
                }
            }
            
            // Performance info
            if (totalNodes > 1000) {
                html += `<br><span style="color: #ffa726; font-weight: bold;">⚡ Performance:</span><br>`;
                html += `${totalNodes} nodes (high density)`;
            } else if (totalNodes > 500) {
                html += `<br><span style="color: #4caf50; font-weight: bold;">✅ Performance:</span><br>`;
                html += `${totalNodes} nodes (good)`;
            } else {
                html += `<br><span style="color: #4caf50; font-weight: bold;">✅ Performance:</span><br>`;
                html += `${totalNodes} nodes (optimal)`;
            }
        } else {
            // Show estimated nodes even when disabled
            var spacingEl = document.getElementById('spacing');
            var repetitionEl = document.getElementById('repetition');
            
            var spacing = (spacingEl && spacingEl.value) ? parseFloat(spacingEl.value) : 5.0;
            var repetition = (repetitionEl && repetitionEl.value) ? parseInt(repetitionEl.value) : 3;
            
            var totalNodes = Math.pow(repetition + 1, 3);
            var maxCoordinate = repetition * spacing;
            
            html = `<strong>Estimated Nodes:</strong> ${totalNodes}<br>`;
            html += `<strong>Grid Spacing:</strong> ${spacing}m<br>`;
            html += `<strong>Grid Repetition:</strong> ${repetition}<br>`;
            html += `<strong>Max Coordinates:</strong> (${maxCoordinate}, ${maxCoordinate}, ${maxCoordinate})<br>`;
            html += `<strong>Positive coordinates only</strong><br>`;
            html += 'Enable grid nodes to activate';
            
            if (totalNodes > 1000) {
                html += `<br><br><span style="color: #ff6b6b; font-weight: bold;">⚠️ Warning:</span><br>`;
                html += `Too many nodes! Reduce repetition or increase spacing.`;
            }
        }
        
        if (this.infoDisplay) {
            this.infoDisplay.innerHTML = html;
        }
    },
    
    show: function() {
        this.container.style.display = 'block';
        this.container.classList.add('fade-in');
    },
    
    hide: function() {
        this.container.style.display = 'none';
    },
    
    toggle: function() {
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    },
    
    setupEventListeners: function() {
        var scope = this;
        
        // Listen for editor events
        if (this.editor.signals) {
            this.editor.signals.editorCleared.add(function() {
                scope.updateInfoDisplay();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Ctrl+G to toggle grid nodes panel
            if (event.ctrlKey && event.key === 'g') {
                event.preventDefault();
                scope.toggle();
            }
            
            // Ctrl+Shift+G to toggle grid nodes
            if (event.ctrlKey && event.shiftKey && event.key === 'G') {
                event.preventDefault();
                scope.toggleGrid();
            }
        });
    }
};

// Export for global use
window.GridNodesUI = GridNodesUI;