function GridSnap(editor, scene, renderer, camera, mesh, radius, hoverMesh, markerMesh) {
	this.markerMeshes = {}; // Store objects added by clicks
	this.intersectMesh = mesh;
	this.enabled = true;
	this.scene = scene;
	this.renderer = renderer;
	this.camera = camera;
	this.radius = radius;
	this.raycaster = new THREE.Raycaster();
	this.hoverMesh = hoverMesh;
	this.markerMesh = markerMesh;
	this.addMarkerOnMouseUp = false;
	
	if (this.hoverMesh) {
		//scene.add(this.hoverMesh); // Since clickMeshes are not adde by default, this shouldn't be either
		//editor.execute( new AddObjectCommand( hoverMesh ) )
		this.hoverMesh.renderOrder = 999; // hoverMesh will render above marker objects. TODO: improve this so it doesn't render above all objects in scene
		this.hoverMesh.visible = false
	}
	
	this.octree = new THREE.Octree({
		undeferred: true
	});

	 // TODO: support more than 1 mesh. Can probably use children?
	if (this.intersectMesh.isMesh) {
		this.octree.add(this.intersectMesh, {
			useVertices: true
		});
	}
}

GridSnap.prototype.getNearestVertexFromEvent = function(event) {
	var mouse = new THREE.Vector2();
	// Get bounding rect for our DOM element
	var rect = this.renderer.domElement.getBoundingClientRect();
	// Convert to THREE.Vector2
	mouse.fromArray( [ ( event.clientX - rect.left ) / rect.width, ( event.clientY - rect.top ) / rect.height ] );
	// Change coordinate system to [-1, +1]x[-1, +1]
	mouse.set( ( mouse.x * 2 ) - 1, - ( mouse.y * 2 ) + 1 );

	this.raycaster.setFromCamera(mouse, this.camera);
	var intersects = this.raycaster.intersectOctreeObject(this.intersectMesh, true);
	

	if (intersects.length > 0) {
		var nearestPoint = intersects[0].point;
		
		var closestVertex = this.octree.findClosestVertex(nearestPoint, this.radius);
	
		return closestVertex;
	}
	return null;
}

GridSnap.prototype.addOrRemoveMarker = function(vertex) {
	var hash = objectHash(vertex);
	if (this.markerMeshes[hash]) {
		// We already have added this and clicked again. Remove it
		// and remember to dispose material and geometry
		
		// TODO: replace this since it may break if octree is rebuilt or object rotates (anything that may alter position of vertex)
		// Should use a method that allows affine transformations on original mesh?

		//this.scene.remove(this.markerMeshes[hash]);
		
		//this.markerMeshes[hash].material.dispose();
		//this.markerMeshes[hash].geometry.dispose();
		//this.markerMeshes[hash] = undefined;
		return;
	}

	var markerMesh = this.markerMesh.clone();
	markerMesh.position.copy(vertex);
	this.markerMeshes[hash] = markerMesh;
	markerMesh.name = 'Sphere'+String(editor.scene.children.length+1);
	editor.execute( new AddObjectCommand( markerMesh ) )
}

GridSnap.prototype.mouseUp = function(event) {
	if(!this.addMarkerOnMouseUp) return;

	let nearestVertex = this.getNearestVertexFromEvent(event);
	if(nearestVertex) {
		this.addOrRemoveMarker(nearestVertex)
	}
	this.addMarkerOnMouseUp = false;
}

GridSnap.prototype.mouseDown = function(event) {
	this.addMarkerOnMouseUp = true
}

GridSnap.prototype.mouseMove = function(event) {
	// If we're moving while pressed, we are probably rotating camera. 
	// Skip adding markers.
	// TODO: it could make sense to add multiple markers this way, support this?

	this.addMarkerOnMouseUp = false;
	// Skip if not enabled or we haven't specified a markerMesh
	if (!this.enabled || !this.hoverMesh) return;

	let nearestVertex = this.getNearestVertexFromEvent(event);
	if (nearestVertex) {
		this.hoverMesh.position.copy(nearestVertex);
		this.hoverMesh.visible = true;
	} else {
		this.hoverMesh.visible = false;
	}
}

// Enhanced GridSnap with Grid Nodes integration
GridSnap.prototype.snapToGridNodes = function(event, gridNodes) {
	if (!gridNodes || !gridNodes.config.enabled || !gridNodes.config.snapEnabled) {
		return this.getNearestVertexFromEvent(event);
	}
	
	var mouse = new THREE.Vector2();
	var rect = this.renderer.domElement.getBoundingClientRect();
	mouse.fromArray([(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]);
	mouse.set((mouse.x * 2) - 1, -(mouse.y * 2) + 1);

	this.raycaster.setFromCamera(mouse, this.camera);
	var intersects = this.raycaster.intersectOctreeObject(this.intersectMesh, true);

	if (intersects.length > 0) {
		var intersectionPoint = intersects[0].point;
		
		// Try grid snapping first
		var snapResult = gridNodes.snapToGridWithFeedback(intersectionPoint, gridNodes.config.snapTolerance, true);
		
		if (snapResult.snapped) {
			return snapResult.snapPoint;
		}
		
		// Fall back to vertex snapping if grid snapping fails
		var closestVertex = this.octree.findClosestVertex(intersectionPoint, this.radius);
		return closestVertex;
	}
	
	return null;
};

// Enhanced mouse move with grid snapping
GridSnap.prototype.mouseMoveWithGridSnap = function(event, gridNodes) {
	this.addMarkerOnMouseUp = false;
	if (!this.enabled || !this.hoverMesh) return;

	let snapPoint = this.snapToGridNodes(event, gridNodes);
	if (snapPoint) {
		this.hoverMesh.position.copy(snapPoint);
		this.hoverMesh.visible = true;
	} else {
		this.hoverMesh.visible = false;
	}
};

// Enhanced mouse up with grid snapping
GridSnap.prototype.mouseUpWithGridSnap = function(event, gridNodes) {
	if (!this.addMarkerOnMouseUp) return;

	let snapPoint = this.snapToGridNodes(event, gridNodes);
	if (snapPoint) {
		this.addOrRemoveMarker(snapPoint);
	}
	this.addMarkerOnMouseUp = false;
};