/**
 * Modern Elements Sidebar with Enhanced UI
 * Replaces old clunky forms with beautiful modern components
 */

Sidebar.Elements.Modern = function ( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;
	var nodeCount = 1;
	var elemCount = 1;

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );
	container.setClass('modern-panel');

	// Materials
	node_material = new THREE.MeshStandardMaterial() 
	member_material = new THREE.LineBasicMaterial( {'color' : 0x404040} );
	
	// Modern Header
	var headerContainer = document.createElement('div');
	headerContainer.className = 'modern-panel-header';
	headerContainer.innerHTML = '<span>🔗</span> Element Creation';
	container.dom.appendChild(headerContainer);

	var bodyContainer = document.createElement('div');
	bodyContainer.className = 'modern-panel-body';

	// Modern Section ID Input
	var sectionGroup = document.createElement('div');
	sectionGroup.className = 'modern-form-group';
	
	var sectionLabel = document.createElement('label');
	sectionLabel.className = 'modern-form-label';
	sectionLabel.textContent = 'Section ID';
	sectionGroup.appendChild(sectionLabel);

	var elemSect = document.createElement('input');
	elemSect.type = 'number';
	elemSect.className = 'modern-input';
	elemSect.placeholder = 'Enter section ID';
	elemSect.value = '1';
	elemSect.min = '1';
	elemSect.max = '100';
	sectionGroup.appendChild(elemSect);

	bodyContainer.appendChild(sectionGroup);

	// Modern Node Selection
	var nodeSelectionCard = document.createElement('div');
	nodeSelectionCard.className = 'modern-card';
	
	var nodeCardHeader = document.createElement('div');
	nodeCardHeader.className = 'modern-card-header';
	nodeCardHeader.innerHTML = '<span>📍</span> Node Selection';
	nodeSelectionCard.appendChild(nodeCardHeader);

	var nodeCardBody = document.createElement('div');
	nodeCardBody.className = 'modern-card-body';

	// Node I Input
	var nodeIGroup = document.createElement('div');
	nodeIGroup.className = 'modern-form-group';
	
	var nodeILabel = document.createElement('label');
	nodeILabel.className = 'modern-form-label';
	nodeILabel.textContent = 'Node I';
	nodeIGroup.appendChild(nodeILabel);

	var node_i = document.createElement('input');
	node_i.type = 'number';
	node_i.className = 'modern-input';
	node_i.placeholder = 'Start node';
	node_i.min = '1';
	nodeIGroup.appendChild(node_i);

	nodeCardBody.appendChild(nodeIGroup);

	// Node J Input
	var nodeJGroup = document.createElement('div');
	nodeJGroup.className = 'modern-form-group';
	
	var nodeJLabel = document.createElement('label');
	nodeJLabel.className = 'modern-form-label';
	nodeJLabel.textContent = 'Node J';
	nodeJGroup.appendChild(nodeJLabel);

	var node_j = document.createElement('input');
	node_j.type = 'number';
	node_j.className = 'modern-input';
	node_j.placeholder = 'End node';
	node_j.min = '1';
	nodeJGroup.appendChild(node_j);

	nodeCardBody.appendChild(nodeJGroup);

	// Modern Button Row
	var buttonRow = document.createElement('div');
	buttonRow.className = 'modern-form-row';
	buttonRow.style.marginTop = '16px';

	var pickNodesBtn = document.createElement('button');
	pickNodesBtn.className = 'modern-btn';
	pickNodesBtn.innerHTML = '<span>🎯</span> Pick Nodes';
	pickNodesBtn.style.flex = '1';
	pickNodesBtn.style.marginRight = '8px';

	var createElementBtn = document.createElement('button');
	createElementBtn.className = 'modern-btn btn-success';
	createElementBtn.innerHTML = '<span>🔗</span> Create Element';
	createElementBtn.style.flex = '1';

	buttonRow.appendChild(pickNodesBtn);
	buttonRow.appendChild(createElementBtn);
	nodeCardBody.appendChild(buttonRow);

	nodeSelectionCard.appendChild(nodeCardBody);
	bodyContainer.appendChild(nodeSelectionCard);

	// Interactive Creation Card
	var interactiveCard = document.createElement('div');
	interactiveCard.className = 'modern-card';
	
	var interactiveHeader = document.createElement('div');
	interactiveHeader.className = 'modern-card-header';
	interactiveHeader.innerHTML = '<span>⚡</span> Interactive Tools';
	interactiveCard.appendChild(interactiveHeader);

	var interactiveBody = document.createElement('div');
	interactiveBody.className = 'modern-card-body';

	var interactiveBtn = document.createElement('button');
	interactiveBtn.className = 'modern-btn btn-warning';
	interactiveBtn.innerHTML = '<span>🔗</span> Interactive Mode';
	interactiveBtn.style.width = '100%';
	interactiveBtn.onclick = function() {
		if (window.cadToolbar) {
			window.cadToolbar.toggleElementCreation();
		} else {
			console.warn('CAD Toolbar not available');
		}
	};

	interactiveBody.appendChild(interactiveBtn);
	interactiveCard.appendChild(interactiveBody);
	bodyContainer.appendChild(interactiveCard);

	container.dom.appendChild(bodyContainer);

	// Variables for node selection
	var nodes = [];

	// Pick Nodes functionality
	pickNodesBtn.onclick = function() {
		nodes = [];
		pickNodesBtn.innerHTML = '<span>🎯</span> Picking... (Click nodes)';
		pickNodesBtn.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
		
		document.addEventListener("click", onMouseUp, false);
	};

	function onMouseUp(event) {
		if (editor.selected == null) {
			// No selection
		} else if (nodes.length < 2) {
			if (nodes[0] == editor.selected) {
				// Same node selected
			} else {
				nodes.push(editor.selected);
				if (nodes.length == 1) {
					node_i.value = nodes[0].userData.nn;
					pickNodesBtn.innerHTML = '<span>🎯</span> Pick Node J';
				} else {
					node_j.value = nodes[1].userData.nn;
					pickNodesBtn.innerHTML = '<span>✅</span> Nodes Selected';
					pickNodesBtn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
					document.removeEventListener("click", onMouseUp, false);
					
					// Reset button after delay
					setTimeout(function() {
						pickNodesBtn.innerHTML = '<span>🎯</span> Pick Nodes';
						pickNodesBtn.style.background = '';
					}, 2000);
				}
			}
		} else {
			document.removeEventListener("click", onMouseUp, false);
		}
	}

	// Create Element functionality
	createElementBtn.onclick = function() {
		nodes = [];
		var nodeI = editor.scene.getObjectByName('Node ' + node_i.value);
		var nodeJ = editor.scene.getObjectByName('Node ' + node_j.value);
		
		if (!nodeI || !nodeJ) {
			// Show error with modern styling
			showNotification('Error: Could not find specified nodes', 'error');
			return;
		}

		nodes.push(nodeI);
		nodes.push(nodeJ);

		var xi = nodes[0].position.x;
		var yi = nodes[0].position.y;
		var zi = nodes[0].position.z;
		var xj = nodes[1].position.x;
		var yj = nodes[1].position.y;
		var zj = nodes[1].position.z;

		// Calculate element properties (same logic as original)
		var helpLine = new THREE.Line3(new THREE.Vector3(xi, yi, zi), new THREE.Vector3(xj, yj, zj));
		var length = helpLine.distance();
		var dirVector = new THREE.Vector3();
		helpLine.delta(dirVector);
		dirVector.normalize();
		
		var helpVector = new THREE.Vector3(0, 1, 0);
		var zLocal, yLocal;
		
		if (dirVector.x == 0 && dirVector.z == 0) {
			zLocal = new THREE.Vector3(0, 0, -1);
			yLocal = new THREE.Vector3(-1, 0, 0);
		} else if (dirVector.x != 0 && dirVector.y != 0 && dirVector.z == 0) {
			zLocal = new THREE.Vector3();
			zLocal.crossVectors(helpVector, dirVector);
			yLocal = new THREE.Vector3();
			yLocal.crossVectors(dirVector, zLocal);
		} else if (dirVector.x == 0 && dirVector.y != 0 && dirVector.z != 0) {
			yLocal = new THREE.Vector3();
			yLocal.crossVectors(dirVector, helpVector);
			zLocal = new THREE.Vector3();
			zLocal.crossVectors(yLocal, dirVector);
		} else if (dirVector.y == 0) {
			zLocal = new THREE.Vector3();
			zLocal.crossVectors(dirVector, helpVector);
			yLocal = new THREE.Vector3();
			yLocal.crossVectors(dirVector, zLocal);
		} else {
			zLocal = new THREE.Vector3();
			zLocal.crossVectors(helpVector, dirVector);
			yLocal = new THREE.Vector3();
			yLocal.crossVectors(dirVector, zLocal);
		}

		var transformMatrix = new THREE.Matrix4();
		transformMatrix.makeBasis(dirVector, yLocal, zLocal);
		transformMatrix.setPosition(new THREE.Vector3(xi, yi, zi));

		var xm = (xi + xj) / 2;
		var ym = (yi + yj) / 2;
		var zm = (zi + zj) / 2;

		var positions = [];
		positions.push(0, 0, 0, length, 0, 0);
		var geometry = new THREE.BufferGeometry();
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

		var line = new THREE.Line(geometry, member_material);
		line.material.linewidth = 12;
		line.name = 'Element ' + String(elemCount);
		line.userData = {
			'en': elemCount,
			'type': 'element',
			'nodei': nodeI.userData.nn,
			'nodej': nodeJ.userData.nn,
			'elem_type': 'beam',
			'length': length,
			'section_id': parseInt(elemSect.value),
			'fixity_dx_i': 0, 'fixity_dy_i': 0, 'fixity_dz_i': 0,
			'fixity_rx_i': 0, 'fixity_ry_i': 0, 'fixity_rz_i': 0,
			'fixity_dx_j': 0, 'fixity_dy_j': 0, 'fixity_dz_j': 0,
			'fixity_rx_j': 0, 'fixity_ry_j': 0, 'fixity_rz_j': 0,
			'label_position': new THREE.Vector3(xm, ym, zm),
			'xLocal': dirVector,
			'yLocal': yLocal,
			'zLocal': zLocal
		};

		line.applyMatrix(transformMatrix);
		editor.execute(new AddObjectCommand(line));

		elemCount += 1;

		// Show success notification
		showNotification(`Element ${elemCount - 1} created successfully!`, 'success');
		
		// Visual feedback
		createElementBtn.innerHTML = '<span>✅</span> Element Created!';
		createElementBtn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
		setTimeout(function() {
			createElementBtn.innerHTML = '<span>🔗</span> Create Element';
			createElementBtn.style.background = '';
		}, 2000);
	};

	// Element Properties Panel
	var propertiesCard = document.createElement('div');
	propertiesCard.className = 'modern-card';
	
	var propertiesHeader = document.createElement('div');
	propertiesHeader.className = 'modern-card-header';
	propertiesHeader.innerHTML = '<span>⚙️</span> Element Properties';
	propertiesCard.appendChild(propertiesHeader);

	var propertiesBody = document.createElement('div');
	propertiesBody.className = 'modern-card-body';

	// Element outliner
	var outliner = new UI.Outliner(editor);
	outliner.setId('outliner');
	outliner.onChange(function() {
		if (editor.selected != null) {
			signals.objectDeselected.dispatch(editor.selected);
		}
		ignoreObjectSelectedSignal = true;
		var valueId = parseInt(outliner.getValue());

		if (valueId == Elements.id) {
			// Handle Elements selection
		} else {
			editor.selectById(valueId);
			updateElementProperties(editor.selected.userData);
		}
		ignoreObjectSelectedSignal = false;
	});

	outliner.onDblClick(function() {
		var valueId = parseInt(outliner.getValue());
		if (valueId == Elements.id) {
			// Handle Elements double-click
		} else {
			editor.focusById(valueId);
			if (editor.selected != null) {
				signals.objectSelected.dispatch(editor.selected);
			}
		}
	});

	propertiesBody.appendChild(outliner.dom);
	propertiesCard.appendChild(propertiesBody);
	bodyContainer.appendChild(propertiesCard);

	// Property inputs (simplified for now)
	var elementIdGroup = document.createElement('div');
	elementIdGroup.className = 'modern-form-group';
	
	var elementIdLabel = document.createElement('label');
	elementIdLabel.className = 'modern-form-label';
	elementIdLabel.textContent = 'Element ID';
	elementIdGroup.appendChild(elementIdLabel);

	var elementId = document.createElement('input');
	elementId.type = 'number';
	elementId.className = 'modern-input';
	elementId.disabled = true;
	elementIdGroup.appendChild(elementId);

	propertiesBody.appendChild(elementIdGroup);

	// Utility functions
	function showNotification(message, type) {
		var notification = document.createElement('div');
		notification.style.position = 'fixed';
		notification.style.top = '20px';
		notification.style.right = '20px';
		notification.style.padding = '12px 16px';
		notification.style.borderRadius = '6px';
		notification.style.color = 'white';
		notification.style.fontWeight = '500';
		notification.style.zIndex = '10000';
		notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
		notification.textContent = message;

		if (type === 'success') {
			notification.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
		} else if (type === 'error') {
			notification.style.background = 'linear-gradient(135deg, #dc3545, #bd2130)';
		}

		document.body.appendChild(notification);

		setTimeout(function() {
			notification.style.opacity = '0';
			notification.style.transform = 'translateY(-20px)';
			notification.style.transition = 'all 0.3s ease-in-out';
			setTimeout(function() {
				document.body.removeChild(notification);
			}, 300);
		}, 3000);
	}

	// Rest of the original functionality (simplified)
	var ignoreObjectSelectedSignal = false;
	var Elements = new THREE.Object3D();
	Elements.name = 'Elements';

	function updateElementProperties(values) {
		if (elementId) {
			elementId.value = values.en || '';
		}
	}

	function refreshUI() {
		var array = editor.scene.children;
		var len = array.length;
		var nodes_ = [];
		
		for (var i = 0; i < len; i++) {
			var obj = array[i];
			if (obj.userData.type == 'element') {
				nodes_.push(obj);
			}
		}

		var options = [];
		options.push(buildOption(Elements, false));

		(function addObjects(objects, pad) {
			for (var i = 0, l = objects.length; i < l; i++) {
				var object = objects[i];
				var option = buildOption(object, true);
				option.style.paddingLeft = (pad * 10) + 'px';
				options.push(option);
			}
		})(nodes_, 1);

		outliner.setOptions(options);

		if (editor.selected !== null) {
			outliner.setValue(editor.selected.id);
		}
	}

	function buildOption(object, draggable) {
		var option = document.createElement('div');
		option.draggable = draggable;
		option.innerHTML = buildHTML(object);
		option.value = object.id;
		return option;
	}

	function buildHTML(object) {
		var html = '<span class="type ' + object.type + '"></span> ' + escapeHTML(object.name);
		return html;
	}

	function escapeHTML(html) {
		return html
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	// Event listeners
	signals.editorCleared.add(refreshUI);
	signals.sceneGraphChanged.add(refreshUI);
	signals.objectSelected.add(function(object) {
		if (object != null && object.userData.type == 'element') {
			updateElementProperties(object.userData);
		}
		if (ignoreObjectSelectedSignal === true) return;
		outliner.setValue(object !== null ? object.id : null);
	});

	refreshUI();

	return container;
};