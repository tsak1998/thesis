/**
 * Model Metadata Panel - Modern replacement for old native forms
 * Handles Materials and Sections with modern UI components
 */

var ModelMetadata = function(editor) {
    var scope = this;
    this.editor = editor;
    this.signals = editor.signals;
    
    // Panel state
    this.isVisible = false;
    this.currentTab = 'materials'; // 'materials' or 'sections'
    
    // Data storage
    this.materials = [];
    this.sections = [];
    
    // Initialize
    this.init();
};

ModelMetadata.prototype = {
    
    init: function() {
        this.createPanel();
        this.setupEventListeners();
        console.log('Model Metadata panel initialized');
    },
    
    createPanel: function() {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'model-metadata-panel';
        this.container.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            width: 320px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: none;
            max-height: 80vh;
            overflow: hidden;
        `;
        
        // Header
        this.createHeader();
        
        // Tab navigation
        this.createTabNavigation();
        
        // Content area
        this.createContentArea();
        
        document.body.appendChild(this.container);
    },
    
    createHeader: function() {
        var header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px 12px 0 0;
        `;
        
        var title = document.createElement('h3');
        title.textContent = 'Model Metadata';
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        title.innerHTML = '📋 Model Metadata';
        
        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s;
        `;
        closeBtn.onmouseover = function() { this.style.backgroundColor = 'rgba(255,255,255,0.2)'; };
        closeBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);
    },
    
    createTabNavigation: function() {
        this.tabContainer = document.createElement('div');
        this.tabContainer.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.05);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        `;
        
        // Materials tab
        this.materialsTab = this.createTab('Materials', 'materials', '🔧');
        this.sectionsTab = this.createTab('Sections', 'sections', '📐');
        
        this.tabContainer.appendChild(this.materialsTab);
        this.tabContainer.appendChild(this.sectionsTab);
        this.container.appendChild(this.tabContainer);
        
        // Set initial active tab
        this.setActiveTab('materials');
    },
    
    createTab: function(label, id, icon) {
        var tab = document.createElement('button');
        tab.className = 'metadata-tab';
        tab.dataset.tab = id;
        tab.innerHTML = `${icon} ${label}`;
        tab.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            color: #666;
        `;
        
        tab.onclick = () => this.setActiveTab(id);
        
        return tab;
    },
    
    setActiveTab: function(tabId) {
        this.currentTab = tabId;
        
        // Update tab styles
        var tabs = this.tabContainer.querySelectorAll('.metadata-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.style.cssText += `
                    background: white;
                    color: #333;
                    border-bottom: 2px solid #667eea;
                `;
            } else {
                tab.style.cssText = tab.style.cssText.replace(/background: white;|color: #333;|border-bottom: 2px solid #667eea;/g, '');
                tab.style.color = '#666';
                tab.style.background = 'none';
            }
        });
        
        // Update content
        this.updateContent();
    },
    
    createContentArea: function() {
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
        `;
        this.container.appendChild(this.contentArea);
    },
    
    updateContent: function() {
        this.contentArea.innerHTML = '';
        
        if (this.currentTab === 'materials') {
            this.createMaterialsContent();
        } else if (this.currentTab === 'sections') {
            this.createSectionsContent();
        }
    },
    
    createMaterialsContent: function() {
        // Materials form
        var form = this.createForm();
        
        // E (Young's Modulus)
        var eField = this.createField('E (kPa)', 'number', '200000000', 'Young\'s Modulus');
        form.appendChild(eField);
        
        // G (Shear Modulus)
        var gField = this.createField('G (kPa)', 'number', '80000000', 'Shear Modulus');
        form.appendChild(gField);
        
        // Add Material button
        var addBtn = this.createButton('Define Material', '🔧', () => {
            this.addMaterial(eField.querySelector('input').value, gField.querySelector('input').value);
        });
        form.appendChild(addBtn);
        
        this.contentArea.appendChild(form);
        
        // Materials list
        this.createMaterialsList();
    },
    
    createSectionsContent: function() {
        // Sections form
        var form = this.createForm();
        
        // Material ID
        var materialField = this.createField('Material ID', 'number', '1', 'Reference to material');
        form.appendChild(materialField);
        
        // Area
        var areaField = this.createField('A (m²)', 'number', '0.01', 'Cross-sectional area');
        form.appendChild(areaField);
        
        // Moment of inertia fields
        var ixField = this.createField('Ix (m⁴)', 'number', '0.0001', 'Moment of inertia about X-axis');
        form.appendChild(ixField);
        
        var iyField = this.createField('Iy (m⁴)', 'number', '0.0001', 'Moment of inertia about Y-axis');
        form.appendChild(iyField);
        
        var izField = this.createField('Iz (m⁴)', 'number', '0.0001', 'Moment of inertia about Z-axis');
        form.appendChild(izField);
        
        // Add Section button
        var addBtn = this.createButton('Define Section', '📐', () => {
            this.addSection(
                materialField.querySelector('input').value,
                areaField.querySelector('input').value,
                ixField.querySelector('input').value,
                iyField.querySelector('input').value,
                izField.querySelector('input').value
            );
        });
        form.appendChild(addBtn);
        
        this.contentArea.appendChild(form);
        
        // Sections list
        this.createSectionsList();
    },
    
    createForm: function() {
        var form = document.createElement('div');
        form.style.cssText = `
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
        `;
        return form;
    },
    
    createField: function(label, type, defaultValue, tooltip) {
        var field = document.createElement('div');
        field.style.cssText = `
            margin-bottom: 12px;
        `;
        
        var labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #333;
            font-size: 13px;
        `;
        
        var input = document.createElement('input');
        input.type = type;
        input.value = defaultValue;
        input.title = tooltip;
        input.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
            box-sizing: border-box;
        `;
        
        input.onfocus = function() { this.style.borderColor = '#667eea'; };
        input.onblur = function() { this.style.borderColor = '#ddd'; };
        
        field.appendChild(labelEl);
        field.appendChild(input);
        
        return field;
    },
    
    createButton: function(text, icon, onClick) {
        var button = document.createElement('button');
        button.innerHTML = `${icon} ${text}`;
        button.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 8px;
        `;
        
        button.onmouseover = function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        };
        button.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };
        
        button.onclick = onClick;
        
        return button;
    },
    
    createMaterialsList: function() {
        var listContainer = this.createListContainer('Materials');
        
        // Get materials from editor
        if (this.editor.sectMaterials && this.editor.sectMaterials.children) {
            this.editor.sectMaterials.children.forEach((material, index) => {
                var item = this.createListItem(
                    material.name,
                    `E: ${material.userData.E} kPa, G: ${material.userData.G} kPa`,
                    () => this.removeMaterial(material.userData.id)
                );
                listContainer.appendChild(item);
            });
        }
        
        this.contentArea.appendChild(listContainer);
    },
    
    createSectionsList: function() {
        var listContainer = this.createListContainer('Sections');
        
        // Get sections from editor
        if (this.editor.sections && this.editor.sections.children) {
            this.editor.sections.children.forEach((section, index) => {
                var item = this.createListItem(
                    section.name,
                    `Material: ${section.userData.material}, A: ${section.userData.A} m²`,
                    () => this.removeSection(section.userData.id)
                );
                listContainer.appendChild(item);
            });
        }
        
        this.contentArea.appendChild(listContainer);
    },
    
    createListContainer: function(title) {
        var container = document.createElement('div');
        container.style.cssText = `
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            padding: 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
        `;
        
        var titleEl = document.createElement('h4');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #333;
        `;
        
        container.appendChild(titleEl);
        return container;
    },
    
    createListItem: function(name, details, onRemove) {
        var item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            margin-bottom: 8px;
            border: 1px solid #eee;
        `;
        
        var info = document.createElement('div');
        info.innerHTML = `
            <div style="font-weight: 500; color: #333; font-size: 13px;">${name}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">${details}</div>
        `;
        
        var removeBtn = document.createElement('button');
        removeBtn.innerHTML = '🗑️';
        removeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
        `;
        removeBtn.onmouseover = function() { this.style.backgroundColor = '#ffebee'; };
        removeBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
        removeBtn.onclick = onRemove;
        
        item.appendChild(info);
        item.appendChild(removeBtn);
        
        return item;
    },
    
    addMaterial: function(E, G) {
        if (!E || !G) {
            alert('Please fill in all material properties');
            return;
        }
        
        var material = new THREE.Object3D();
        material.name = 'Material ' + String(this.editor.sectMaterials.children.length + 1);
        material.userData = {
            'id': this.editor.sectMaterials.children.length + 1,
            'material_id': this.editor.sectMaterials.children.length + 1,
            'type': 'custom',
            'E': parseFloat(E),
            'G': parseFloat(G)
        };
        
        this.editor.sectMaterials.add(material);
        this.editor.storage.set(this.editor.toJSON());
        this.editor.signals.savingFinished.dispatch();
        
        // Refresh the display
        this.updateContent();
        
        console.log('Material added:', material.name);
    },
    
    addSection: function(materialId, area, ix, iy, iz) {
        if (!materialId || !area || !ix || !iy || !iz) {
            alert('Please fill in all section properties');
            return;
        }
        
        var section = new THREE.Object3D();
        section.name = 'Section ' + String(this.editor.sections.children.length + 1);
        section.userData = {
            'id': this.editor.sections.children.length + 1,
            'section_id': this.editor.sections.children.length + 1,
            'material': parseInt(materialId),
            'dimensions': 'custom',
            'type': 'custom',
            'A': parseFloat(area),
            'Ix': parseFloat(ix),
            'Iy': parseFloat(iy),
            'Iz': parseFloat(iz)
        };
        
        this.editor.sections.add(section);
        this.editor.storage.set(this.editor.toJSON());
        this.editor.signals.savingFinished.dispatch();
        
        // Refresh the display
        this.updateContent();
        
        console.log('Section added:', section.name);
    },
    
    removeMaterial: function(id) {
        if (confirm('Are you sure you want to remove this material?')) {
            var material = this.editor.sectMaterials.getObjectById(id);
            if (material) {
                this.editor.sectMaterials.remove(material);
                this.editor.storage.set(this.editor.toJSON());
                this.editor.signals.savingFinished.dispatch();
                this.updateContent();
            }
        }
    },
    
    removeSection: function(id) {
        if (confirm('Are you sure you want to remove this section?')) {
            var section = this.editor.sections.getObjectById(id);
            if (section) {
                this.editor.sections.remove(section);
                this.editor.storage.set(this.editor.toJSON());
                this.editor.signals.savingFinished.dispatch();
                this.updateContent();
            }
        }
    },
    
    show: function() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.updateContent();
    },
    
    hide: function() {
        this.isVisible = false;
        this.container.style.display = 'none';
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
        
        // Listen for editor clear events
        if (this.editor.signals && this.editor.signals.editorCleared) {
            this.editor.signals.editorCleared.add(function() {
                scope.updateContent();
            });
        }
        
        // Listen for saving events
        if (this.editor.signals && this.editor.signals.savingFinished) {
            this.editor.signals.savingFinished.add(function() {
                if (scope.isVisible) {
                    scope.updateContent();
                }
            });
        }
    }
};

// Export for global use
window.ModelMetadata = ModelMetadata;