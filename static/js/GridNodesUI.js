/**
 * Modern UI Panel for Grid Nodes Control
 * Provides a beautiful interface for managing grid nodes
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
        header.innerHTML = '<span>🔲</span> Grid Nodes Control';
        this.container.appendChild(header);
        
        // Body
        var body = document.createElement('div');
        body.className = 'grid-nodes-body';
        
        // Toggle Button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'grid-toggle-btn';
        this.toggleButton.innerHTML = '🔲 Enable Grid Nodes';
        this.toggleButton.onclick = function() {
            scope.toggleGrid();
        };
        body.appendChild(this.toggleButton);
        
        // Plane Toggle Controls
        var planeGroup = document.createElement('div');
        planeGroup.className = 'parameter-group';
        
        var planeLabel = document.createElement('label');
        planeLabel.className = 'parameter-label';
        planeLabel.textContent = 'Visible Planes';
        planeGroup.appendChild(planeLabel);
        
        var planeRow = document.createElement('div');
        planeRow.style.display = 'flex';
        planeRow.style.gap = '8px';
        planeRow.style.marginTop = '8px';
        
        // Create plane toggle buttons
        var planes = [
            { id: 'xz', label: 'XZ', title: 'Horizontal planes (XZ at different Y levels)' },
            { id: 'xy', label: 'XY', title: 'Vertical planes (XY at different Z levels)' },
            { id: 'yz', label: 'YZ', title: 'Vertical planes (YZ at different X levels)' }
        ];
        
        this.planeButtons = {};
        var scope = this;
        planes.forEach(function(plane) {
            var btn = document.createElement('button');
            // Set initial state based on new default configuration (XZ and XY active, YZ off)
            var isActive = (plane.id === 'xz' || plane.id === 'xy');
            btn.className = isActive ? 'plane-toggle-btn active' : 'plane-toggle-btn';
            btn.style.flex = '1';
            btn.style.padding = '8px 4px';
            btn.style.fontSize = '12px';
            btn.style.fontWeight = 'bold';
            btn.style.border = isActive ? '2px solid #007bff' : '2px solid #ddd';
            btn.style.borderRadius = '4px';
            btn.style.background = isActive ? '#007bff' : 'transparent';
            btn.style.color = isActive ? 'white' : '#666';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s ease';
            btn.textContent = plane.label;
            btn.title = plane.title;
            btn.onclick = function() {
                scope.togglePlane(plane.id, btn);
            };
            scope.planeButtons[plane.id] = btn;
            planeRow.appendChild(btn);
        });
        
        planeGroup.appendChild(planeRow);
        body.appendChild(planeGroup);
        
        // Start Position Controls
        var startPosGroup = this.createParameterGroup('Start Position (Origin)', [
            { label: 'X', id: 'startX', value: 0, min: -50, max: 50, step: 0.5 },
            { label: 'Y', id: 'startY', value: 0, min: -50, max: 50, step: 0.5 },
            { label: 'Z', id: 'startZ', value: 0, min: -50, max: 50, step: 0.5 }
        ]);
        body.appendChild(startPosGroup);
        
        // Grid Size Control
        var gridSizeGroup = this.createParameterGroup('Grid Size (Spacing)', [
            { label: 'Spacing', id: 'gridSize', value: 0.5, min: 0.1, max: 2, step: 0.1 }
        ]);
        body.appendChild(gridSizeGroup);
        
        // Total Size Controls
        var totalSizeGroup = this.createParameterGroup('Total Size (Extents)', [
            { label: 'X', id: 'totalSizeX', value: 10, min: 1, max: 50, step: 1 },
            { label: 'Y', id: 'totalSizeY', value: 10, min: 1, max: 50, step: 1 },
            { label: 'Z', id: 'totalSizeZ', value: 10, min: 1, max: 50, step: 1 }
        ]);
        body.appendChild(totalSizeGroup);
        
        // Level Controls
        var levelGroup = this.createParameterGroup('Level Configuration', [
            { label: 'Levels', id: 'numberOfLevels', value: 4, min: 1, max: 10, step: 1 },
            { label: 'Height', id: 'levelHeight', value: 10, min: 1, max: 50, step: 1 }
        ]);
        body.appendChild(levelGroup);
        
        // Transparency Control
        var transparencyGroup = document.createElement('div');
        transparencyGroup.className = 'parameter-group';
        
        var transparencyLabel = document.createElement('label');
        transparencyLabel.className = 'parameter-label';
        transparencyLabel.textContent = 'Transparency';
        transparencyGroup.appendChild(transparencyLabel);
        
        var transparencyContainer = document.createElement('div');
        transparencyContainer.className = 'transparency-control';
        
        this.transparencySlider = document.createElement('input');
        this.transparencySlider.type = 'range';
        this.transparencySlider.className = 'transparency-slider';
        this.transparencySlider.min = '0.1';
        this.transparencySlider.max = '1.0';
        this.transparencySlider.step = '0.1';
        this.transparencySlider.value = '0.5';
        this.transparencySlider.oninput = function() {
            scope.updateTransparency();
        };
        
        var transparencyValue = document.createElement('span');
        transparencyValue.id = 'transparencyValue';
        transparencyValue.textContent = '50%';
        transparencyValue.style.fontSize = '12px';
        transparencyValue.style.color = '#666';
        transparencyValue.style.marginTop = '4px';
        transparencyValue.style.display = 'block';
        
        transparencyContainer.appendChild(this.transparencySlider);
        transparencyContainer.appendChild(transparencyValue);
        transparencyGroup.appendChild(transparencyContainer);
        body.appendChild(transparencyGroup);
        
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
        this.toleranceSlider.value = '1.0';
        this.toleranceSlider.style.flex = '1';
        this.toleranceSlider.oninput = function() {
            scope.updateSnapTolerance();
        };
        
        var toleranceValue = document.createElement('span');
        toleranceValue.id = 'toleranceValue';
        toleranceValue.textContent = '1.0';
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
            { name: 'Fine', gridSize: 0.25, levels: 6, nodes: '~9,261' },
            { name: 'Medium', gridSize: 0.5, levels: 4, nodes: '~2,205' },
            { name: 'Coarse', gridSize: 1.0, levels: 3, nodes: '~363' }
        ];
        
        presets.forEach(function(preset) {
            var btn = document.createElement('button');
            btn.className = 'modern-btn btn-secondary';
            btn.style.flex = '1';
            btn.style.fontSize = '11px';
            btn.style.padding = '6px 4px';
            btn.innerHTML = preset.name + '<br><small style="font-size:9px;opacity:0.7;">' + preset.nodes + '</small>';
            btn.title = `${preset.name}: Grid size ${preset.gridSize}m with ${preset.levels} levels (${preset.nodes} nodes)`;
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
            this.toggleButton.textContent = '🔲 Disable Grid Nodes';
            this.toggleButton.classList.add('active');
            this.statusIndicator.className = 'status-indicator active';
            this.statusIndicator.textContent = 'Grid Nodes: Active';
        } else {
            this.toggleButton.textContent = '🔲 Enable Grid Nodes';
            this.toggleButton.classList.remove('active');
            this.statusIndicator.className = 'status-indicator inactive';
            this.statusIndicator.textContent = 'Grid Nodes: Disabled';
        }
        
        this.updateInfoDisplay();
    },
    
    togglePlane: function(planeType, button) {
        var isActive = this.gridNodes.togglePlane(planeType);
        
        // Update button appearance
        if (isActive) {
            button.style.background = '#007bff';
            button.style.color = 'white';
            button.style.borderColor = '#007bff';
            button.classList.add('active');
        } else {
            button.style.background = 'transparent';
            button.style.color = '#666';
            button.style.borderColor = '#ddd';
            button.classList.remove('active');
        }
        
        // Update info display
        this.updateInfoDisplay();
        
        console.log(`Plane ${planeType.toUpperCase()} toggled:`, isActive);
    },
    
    updateParameters: function() {
        var startXEl = document.getElementById('startX');
        var startYEl = document.getElementById('startY');
        var startZEl = document.getElementById('startZ');
        var gridSizeEl = document.getElementById('gridSize');
        var totalSizeXEl = document.getElementById('totalSizeX');
        var totalSizeYEl = document.getElementById('totalSizeY');
        var totalSizeZEl = document.getElementById('totalSizeZ');
        var numberOfLevelsEl = document.getElementById('numberOfLevels');
        var levelHeightEl = document.getElementById('levelHeight');
        
        // Update info display first to show warnings
        this.updateInfoDisplay();
        
        // Only update grid if enabled
        if (this.gridNodes.config.enabled) {
            if (startXEl && startYEl && startZEl) {
                this.gridNodes.updateStartPosition(startXEl.value, startYEl.value, startZEl.value);
            }
            if (gridSizeEl) {
                this.gridNodes.updateGridSize(gridSizeEl.value);
            }
            if (totalSizeXEl && totalSizeYEl && totalSizeZEl) {
                this.gridNodes.updateTotalSize(totalSizeXEl.value, totalSizeYEl.value, totalSizeZEl.value);
            }
            if (numberOfLevelsEl) {
                this.gridNodes.updateNumberOfLevels(numberOfLevelsEl.value);
            }
            if (levelHeightEl) {
                this.gridNodes.updateLevelHeight(levelHeightEl.value);
            }
        }
    },
    
    updateTransparency: function() {
        if (!this.transparencySlider) return;
        
        var value = this.transparencySlider.value;
        this.gridNodes.updateTransparency(value);
        
        var percentage = Math.round(value * 100);
        var valueEl = document.getElementById('transparencyValue');
        if (valueEl) {
            valueEl.textContent = percentage + '%';
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
            valueEl.textContent = value.toFixed(1);
        }
        
        this.updateInfoDisplay();
    },
    
    applyPreset: function(preset) {
        var gridSizeEl = document.getElementById('gridSize');
        var totalSizeXEl = document.getElementById('totalSizeX');
        var totalSizeYEl = document.getElementById('totalSizeY');
        var totalSizeZEl = document.getElementById('totalSizeZ');
        var numberOfLevelsEl = document.getElementById('numberOfLevels');
        
        // Apply preset values based on preset type
        if (preset.name === 'Fine') {
            if (gridSizeEl) gridSizeEl.value = 0.25;
            if (numberOfLevelsEl) numberOfLevelsEl.value = 6;
        } else if (preset.name === 'Medium') {
            if (gridSizeEl) gridSizeEl.value = 0.5;
            if (numberOfLevelsEl) numberOfLevelsEl.value = 4;
        } else if (preset.name === 'Coarse') {
            if (gridSizeEl) gridSizeEl.value = 1.0;
            if (numberOfLevelsEl) numberOfLevelsEl.value = 3;
        }
        
        // Keep total size at 10m × 10m × 10m
        if (totalSizeXEl) totalSizeXEl.value = 10;
        if (totalSizeYEl) totalSizeYEl.value = 10;
        if (totalSizeZEl) totalSizeZEl.value = 10;
        
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
            var gridSizeEl = document.getElementById('gridSize');
            var totalSizeXEl = document.getElementById('totalSizeX');
            var totalSizeYEl = document.getElementById('totalSizeY');
            var totalSizeZEl = document.getElementById('totalSizeZ');
            var numberOfLevelsEl = document.getElementById('numberOfLevels');
            var levelHeightEl = document.getElementById('levelHeight');
            
            var gridSize = (gridSizeEl && gridSizeEl.value) ? parseFloat(gridSizeEl.value) : info.gridSize;
            var totalSizeX = (totalSizeXEl && totalSizeXEl.value) ? parseFloat(totalSizeXEl.value) : info.totalSize.x;
            var totalSizeY = (totalSizeYEl && totalSizeYEl.value) ? parseFloat(totalSizeYEl.value) : info.totalSize.y;
            var totalSizeZ = (totalSizeZEl && totalSizeZEl.value) ? parseFloat(totalSizeZEl.value) : info.totalSize.z;
            var numberOfLevels = (numberOfLevelsEl && numberOfLevelsEl.value) ? parseInt(numberOfLevelsEl.value) : info.numberOfLevels;
            var levelHeight = (levelHeightEl && levelHeightEl.value) ? parseFloat(levelHeightEl.value) : info.levelHeight;
            
            // Calculate estimated nodes
            var pointsX = Math.floor(totalSizeX / gridSize) + 1;
            var pointsY = Math.floor(totalSizeY / gridSize) + 1;
            var pointsZ = Math.floor(totalSizeZ / gridSize) + 1;
            var estimatedNodes = pointsX * pointsY * pointsZ;
            
            html += `<strong>Active Nodes:</strong> ${info.snapPointCount}<br>`;
            html += `<strong>Grid Size:</strong> ${gridSize}m spacing<br>`;
            html += `<strong>Total Size:</strong> ${totalSizeX} × ${totalSizeY} × ${totalSizeZ}m<br>`;
            html += `<strong>Levels:</strong> ${numberOfLevels} (height: ${levelHeight}m)<br>`;
            html += `<strong>Start Position:</strong> ${info.startPosition.x}, ${info.startPosition.y}, ${info.startPosition.z}<br>`;
            html += `<strong>Transparency:</strong> ${Math.round(info.transparency * 100)}%<br>`;
            
            // Show snapping information
            if (info.snap) {
                html += `<strong>Grid Snapping:</strong> ${info.snap.enabled ? 'Enabled' : 'Disabled'}<br>`;
                if (info.snap.enabled) {
                    html += `<strong>Snap Tolerance:</strong> ${info.snap.tolerance.toFixed(2)}m<br>`;
                }
            }
            
            // Show plane information
            if (info.planes && info.planeCount) {
                var activePlanes = [];
                if (info.planes.xz) activePlanes.push(`XZ(${info.planeCount.xz})`);
                if (info.planes.xy) activePlanes.push(`XY(${info.planeCount.xy})`);
                if (info.planes.yz) activePlanes.push(`YZ(${info.planeCount.yz})`);
                html += `<strong>Active Planes:</strong> ${activePlanes.join(', ')}<br>`;
            }
            
            // Performance warning
            if (estimatedNodes > 8000) {
                html += `<br><span style="color: #ff6b6b; font-weight: bold;">⚠️ Warning:</span><br>`;
                html += `${estimatedNodes} nodes may impact performance.<br>`;
                html += `<small>Consider increasing grid size.</small>`;
            } else if (estimatedNodes > 5000) {
                html += `<br><span style="color: #ffa726; font-weight: bold;">⚡ Performance:</span><br>`;
                html += `${estimatedNodes} nodes (high density)`;
            } else {
                html += `<br><span style="color: #4caf50; font-weight: bold;">✅ Performance:</span><br>`;
                html += `${estimatedNodes} nodes (optimal)`;
            }
        } else {
            // Show estimated nodes even when disabled
            var gridSizeEl = document.getElementById('gridSize');
            var totalSizeXEl = document.getElementById('totalSizeX');
            var totalSizeYEl = document.getElementById('totalSizeY');
            var totalSizeZEl = document.getElementById('totalSizeZ');
            
            var gridSize = (gridSizeEl && gridSizeEl.value) ? parseFloat(gridSizeEl.value) : 0.5;
            var totalSizeX = (totalSizeXEl && totalSizeXEl.value) ? parseFloat(totalSizeXEl.value) : 10;
            var totalSizeY = (totalSizeYEl && totalSizeYEl.value) ? parseFloat(totalSizeYEl.value) : 10;
            var totalSizeZ = (totalSizeZEl && totalSizeZEl.value) ? parseFloat(totalSizeZEl.value) : 10;
            
            var pointsX = Math.floor(totalSizeX / gridSize) + 1;
            var pointsY = Math.floor(totalSizeY / gridSize) + 1;
            var pointsZ = Math.floor(totalSizeZ / gridSize) + 1;
            var estimatedNodes = pointsX * pointsY * pointsZ;
            
            html = `<strong>Estimated Nodes:</strong> ${estimatedNodes}<br>`;
            html += `<strong>Grid Volume:</strong> ${totalSizeX} × ${totalSizeY} × ${totalSizeZ}m<br>`;
            html += `<strong>Grid Spacing:</strong> ${gridSize}m<br>`;
            html += 'Enable grid nodes to activate';
            
            if (estimatedNodes > 8000) {
                html += `<br><br><span style="color: #ff6b6b; font-weight: bold;">⚠️ Warning:</span><br>`;
                html += `Too many nodes! Increase grid size.`;
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