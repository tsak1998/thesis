/**
 * Modern Toolbar Component
 * Provides a beautiful floating toolbar with Grid Nodes and other modern tools
 */

var ModernToolbar = function(editor) {
    var scope = this;
    this.editor = editor;
    this.isVisible = true;
    
    this.createToolbar();
    this.setupEventListeners();
};

ModernToolbar.prototype = {
    
    createToolbar: function() {
        var scope = this;
        
        // Main toolbar container
        this.container = document.createElement('div');
        this.container.className = 'modern-toolbar';
        this.container.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            border: 1px solid #e9ecef;
            padding: 12px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 200px;
            transition: all 0.3s ease-in-out;
        `;
        
        // Toolbar header
        var header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 4px;
        `;
        
        var title = document.createElement('span');
        title.textContent = '🛠️ CAD Tools';
        title.style.cssText = `
            font-weight: 600;
            color: #343a40;
            font-size: 14px;
        `;
        
        var minimizeBtn = document.createElement('button');
        minimizeBtn.textContent = '−';
        minimizeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: #6c757d;
            padding: 2px 6px;
            border-radius: 4px;
        `;
        minimizeBtn.onclick = function() {
            scope.toggleMinimize();
        };
        
        header.appendChild(title);
        header.appendChild(minimizeBtn);
        this.container.appendChild(header);
        
        // Toolbar body
        this.toolbarBody = document.createElement('div');
        this.toolbarBody.className = 'toolbar-body';
        
        // Grid Nodes Section
        var gridSection = this.createToolSection('🔲 Grid Nodes', [
            {
                text: 'Toggle Grid',
                icon: '🔲',
                action: function() {
                    if (window.gridNodesUI) {
                        window.gridNodesUI.toggleGrid();
                    }
                },
                className: 'modern-btn'
            },
            {
                text: 'Grid Settings',
                icon: '⚙️',
                action: function() {
                    if (window.gridNodesUI) {
                        window.gridNodesUI.toggle();
                    }
                },
                className: 'modern-btn btn-secondary'
            }
        ]);
        this.toolbarBody.appendChild(gridSection);
        
        // Creation Tools Section
        var creationSection = this.createToolSection('🔧 Creation Tools', [
            {
                text: 'Add Node',
                icon: '📍',
                action: function() {
                    scope.showNodeCreationDialog();
                },
                className: 'modern-btn btn-success'
            },
            {
                text: 'Interactive Mode',
                icon: '⚡',
                action: function() {
                    if (window.cadToolbar) {
                        window.cadToolbar.toggleElementCreation();
                    }
                },
                className: 'modern-btn btn-warning'
            }
        ]);
        this.toolbarBody.appendChild(creationSection);
        
        // View Tools Section
        var viewSection = this.createToolSection('👁️ View Tools', [
            {
                text: 'Fit All',
                icon: '🔍',
                action: function() {
                    scope.fitAllObjects();
                },
                className: 'modern-btn btn-secondary'
            },
            {
                text: 'Reset View',
                icon: '🏠',
                action: function() {
                    scope.resetView();
                },
                className: 'modern-btn btn-secondary'
            }
        ]);
        this.toolbarBody.appendChild(viewSection);
        
        // Quick Actions Section
        var actionsSection = this.createToolSection('⚡ Quick Actions', [
            {
                text: 'Clear All',
                icon: '🗑️',
                action: function() {
                    if (confirm('Are you sure you want to clear all objects?')) {
                        scope.editor.clear();
                    }
                },
                className: 'modern-btn btn-danger'
            },
            {
                text: 'Undo',
                icon: '↶',
                action: function() {
                    scope.editor.undo();
                },
                className: 'modern-btn btn-secondary'
            }
        ]);
        this.toolbarBody.appendChild(actionsSection);
        
        this.container.appendChild(this.toolbarBody);
        
        // Add to document
        document.body.appendChild(this.container);
    },
    
    createToolSection: function(title, tools) {
        var section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 12px;
        `;
        
        var sectionTitle = document.createElement('div');
        sectionTitle.textContent = title;
        sectionTitle.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: #6c757d;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        section.appendChild(sectionTitle);
        
        var toolsContainer = document.createElement('div');
        toolsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;
        
        tools.forEach(function(tool) {
            var button = document.createElement('button');
            button.className = tool.className;
            button.innerHTML = `<span>${tool.icon}</span> ${tool.text}`;
            button.style.cssText = `
                width: 100%;
                text-align: left;
                font-size: 13px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            button.onclick = tool.action;
            toolsContainer.appendChild(button);
        });
        
        section.appendChild(toolsContainer);
        return section;
    },
    
    showNodeCreationDialog: function() {
        var modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        var dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            min-width: 300px;
        `;
        
        var title = document.createElement('h3');
        title.textContent = '📍 Create Node';
        title.style.cssText = `
            margin: 0 0 16px 0;
            color: #343a40;
            font-size: 18px;
        `;
        dialog.appendChild(title);
        
        // Coordinate inputs
        var coords = ['X', 'Y', 'Z'];
        var inputs = {};
        
        coords.forEach(function(coord) {
            var group = document.createElement('div');
            group.style.marginBottom = '12px';
            
            var label = document.createElement('label');
            label.textContent = coord + ':';
            label.style.cssText = `
                display: block;
                margin-bottom: 4px;
                font-weight: 500;
                color: #343a40;
            `;
            
            var input = document.createElement('input');
            input.type = 'number';
            input.step = '0.1';
            input.value = '0';
            input.style.cssText = `
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #e9ecef;
                border-radius: 6px;
                font-size: 14px;
            `;
            inputs[coord] = input;
            
            group.appendChild(label);
            group.appendChild(input);
            dialog.appendChild(group);
        });
        
        // Buttons
        var buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 20px;
        `;
        
        var createBtn = document.createElement('button');
        createBtn.className = 'modern-btn btn-success';
        createBtn.textContent = 'Create Node';
        createBtn.style.flex = '1';
        createBtn.onclick = function() {
            var position = new THREE.Vector3(
                parseFloat(inputs.X.value),
                parseFloat(inputs.Y.value),
                parseFloat(inputs.Z.value)
            );
            // Create node logic would go here
            console.log('Creating node at:', position);
            document.body.removeChild(modal);
        };
        
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'modern-btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.flex = '1';
        cancelBtn.onclick = function() {
            document.body.removeChild(modal);
        };
        
        buttonRow.appendChild(createBtn);
        buttonRow.appendChild(cancelBtn);
        dialog.appendChild(buttonRow);
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Close on background click
        modal.onclick = function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    },
    
    fitAllObjects: function() {
        // Basic fit all implementation
        if (this.editor.scene.children.length > 0) {
            var box = new THREE.Box3();
            this.editor.scene.traverse(function(object) {
                if (object.geometry) {
                    box.expandByObject(object);
                }
            });
            
            if (!box.isEmpty()) {
                var center = box.getCenter(new THREE.Vector3());
                var size = box.getSize(new THREE.Vector3());
                var maxDim = Math.max(size.x, size.y, size.z);
                
                this.editor.camera.position.set(
                    center.x + maxDim,
                    center.y + maxDim,
                    center.z + maxDim
                );
                this.editor.camera.lookAt(center);
            }
        }
    },
    
    resetView: function() {
        this.editor.camera.position.set(0, 5, 10);
        this.editor.camera.lookAt(new THREE.Vector3(0, 0, 0));
    },
    
    toggleMinimize: function() {
        if (this.toolbarBody.style.display === 'none') {
            this.toolbarBody.style.display = 'block';
            this.container.querySelector('button').textContent = '−';
        } else {
            this.toolbarBody.style.display = 'none';
            this.container.querySelector('button').textContent = '+';
        }
    },
    
    show: function() {
        this.container.style.display = 'flex';
        this.isVisible = true;
    },
    
    hide: function() {
        this.container.style.display = 'none';
        this.isVisible = false;
    },
    
    toggle: function() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    setupEventListeners: function() {
        var scope = this;
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Ctrl+T to toggle toolbar
            if (event.ctrlKey && event.key === 't') {
                event.preventDefault();
                scope.toggle();
            }
        });
        
        // Make toolbar draggable
        this.makeDraggable();
    },
    
    makeDraggable: function() {
        var scope = this;
        var isDragging = false;
        var startX, startY, startLeft, startTop;
        
        var header = this.container.querySelector('div');
        header.style.cursor = 'move';
        
        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(scope.container.style.left);
            startTop = parseInt(scope.container.style.top);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            var deltaX = e.clientX - startX;
            var deltaY = e.clientY - startY;
            
            scope.container.style.left = (startLeft + deltaX) + 'px';
            scope.container.style.top = (startTop + deltaY) + 'px';
        }
        
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
};

// Export for global use
window.ModernToolbar = ModernToolbar;