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
        
        // Size Controls
        var sizeGroup = this.createParameterGroup('Grid Size (Design Units)', [
            { label: 'X', id: 'sizeX', value: 50, min: 1, max: 1000 },
            { label: 'Y', id: 'sizeY', value: 50, min: 1, max: 1000 },
            { label: 'Z', id: 'sizeZ', value: 50, min: 1, max: 1000 }
        ]);
        body.appendChild(sizeGroup);
        
        // Spacing Controls
        var spacingGroup = this.createParameterGroup('Node Spacing', [
            { label: 'X', id: 'spacingX', value: 1, min: 0.1, max: 10, step: 0.1 },
            { label: 'Y', id: 'spacingY', value: 1, min: 0.1, max: 10, step: 0.1 },
            { label: 'Z', id: 'spacingZ', value: 1, min: 0.1, max: 10, step: 0.1 }
        ]);
        body.appendChild(spacingGroup);
        
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
        this.transparencySlider.value = '0.3';
        this.transparencySlider.oninput = function() {
            scope.updateTransparency();
        };
        
        var transparencyValue = document.createElement('span');
        transparencyValue.id = 'transparencyValue';
        transparencyValue.textContent = '30%';
        transparencyValue.style.fontSize = '12px';
        transparencyValue.style.color = '#666';
        transparencyValue.style.marginTop = '4px';
        transparencyValue.style.display = 'block';
        
        transparencyContainer.appendChild(this.transparencySlider);
        transparencyContainer.appendChild(transparencyValue);
        transparencyGroup.appendChild(transparencyContainer);
        body.appendChild(transparencyGroup);
        
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
            { name: 'Fine', size: [20, 20, 20], spacing: [0.5, 0.5, 0.5] },
            { name: 'Medium', size: [50, 50, 50], spacing: [1, 1, 1] },
            { name: 'Coarse', size: [100, 100, 100], spacing: [2, 2, 2] }
        ];
        
        presets.forEach(function(preset) {
            var btn = document.createElement('button');
            btn.className = 'modern-btn btn-secondary';
            btn.style.flex = '1';
            btn.style.fontSize = '12px';
            btn.style.padding = '6px 8px';
            btn.textContent = preset.name;
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
    
    updateParameters: function() {
        var sizeX = document.getElementById('sizeX').value;
        var sizeY = document.getElementById('sizeY').value;
        var sizeZ = document.getElementById('sizeZ').value;
        
        var spacingX = document.getElementById('spacingX').value;
        var spacingY = document.getElementById('spacingY').value;
        var spacingZ = document.getElementById('spacingZ').value;
        
        this.gridNodes.updateSize(sizeX, sizeY, sizeZ);
        this.gridNodes.updateSpacing(spacingX, spacingY, spacingZ);
        
        this.updateInfoDisplay();
    },
    
    updateTransparency: function() {
        var value = this.transparencySlider.value;
        this.gridNodes.updateTransparency(value);
        
        var percentage = Math.round(value * 100);
        document.getElementById('transparencyValue').textContent = percentage + '%';
    },
    
    applyPreset: function(preset) {
        document.getElementById('sizeX').value = preset.size[0];
        document.getElementById('sizeY').value = preset.size[1];
        document.getElementById('sizeZ').value = preset.size[2];
        
        document.getElementById('spacingX').value = preset.spacing[0];
        document.getElementById('spacingY').value = preset.spacing[1];
        document.getElementById('spacingZ').value = preset.spacing[2];
        
        this.updateParameters();
        
        // Visual feedback
        var buttons = this.container.querySelectorAll('.modern-btn.btn-secondary');
        buttons.forEach(function(btn) {
            btn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
            btn.style.color = 'white';
            setTimeout(function() {
                btn.style.background = '';
                btn.style.color = '';
            }, 200);
        });
    },
    
    updateInfoDisplay: function() {
        var info = this.gridNodes.getGridInfo();
        
        var html = '';
        if (info.enabled) {
            html += `<strong>Nodes:</strong> ${info.nodeCount}<br>`;
            html += `<strong>Dimensions:</strong> ${info.size.x} × ${info.size.y} × ${info.size.z}<br>`;
            html += `<strong>Spacing:</strong> ${info.spacing.x} × ${info.spacing.y} × ${info.spacing.z}<br>`;
            html += `<strong>Transparency:</strong> ${Math.round(info.transparency * 100)}%`;
        } else {
            html = 'Enable grid nodes to see information';
        }
        
        this.infoDisplay.innerHTML = html;
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