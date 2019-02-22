/**
 * @author mrdoob / http://mrdoob.com/
 */


Sidebar.Project = function ( editor ) {
	console.log(editor);

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;
	var nodeCount = 1;
	var elemCount = 1;
	

	var rendererTypes = {

		'WebGLRenderer': THREE.WebGLRenderer,

	};

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	//count lines and nodes
	function count_elem() {
		arr =  editor.scene.children;
		for (i=0; i < arr.length; i++){
			if (arr[i].geometry.type=='SphereGeometry') {
				nodeCount+=1;
			}else if (arr[i].type=='Line'){
				elemCount+=1;
			}
	}
	
	
	//labels for objects

	function render() {

		editor.sceneHelpers.updateMatrixWorld();
		editor.scene.updateMatrixWorld();

		editor.renderer.render( editor.scene, editor.camera );

		if ( editor.renderer instanceof THREE.RaytracingRenderer === false ) {

			editor.renderer.render( editor.sceneHelpers, editor.camera );

		}

	}

	makeTextSprite = function ( message, parameters ){
		if ( parameters === undefined ) parameters = {};
		var fontface = parameters.hasOwnProperty("fontface") ? parameters["font.face"] : "Arial";
		var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["font.size"] : 30;
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["border.Thickness"] : 0;
		var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["border.Color"] : { r:0, g:0, b:0, a:0 };
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["background.Color"] : { r:255, g:255, b:255, a:1.0 };
		var textColor = parameters.hasOwnProperty("textColor") ?parameters["text.Color"] : { r:0, g:0, b:0, a:1.0 };

		var canvas = document.createElement('canvas');
		//canvas.id = 'myCanvas';
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
		var metrics = context.measureText( message );
		var textWidth = metrics.width;

		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = 0;
		//roundRect(context, borderThickness/2, borderThickness/2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

		context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
		context.fillText( message, borderThickness, fontsize + borderThickness);

		/*
		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearMipMapLinearFilter;
		*/

		var spriteMaterial = new THREE.SpriteMaterial( { color: rgba(255,255,255,1), sizeAttenuation: true } );
		var sprite = new THREE.Sprite( spriteMaterial );
		sprite.scale.set(1, 1, 1);
		return sprite;  
	};


	// materials

	node_material = new THREE.MeshStandardMaterial();
	member_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

	// coordinates

	var xRow = new UI.Row();
	var x = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

		config.setKey( 'project/x', this.getValue() );

	} );
	

	xRow.add( new UI.Text( 'x').setWidth( '90px' ) );
	xRow.add( x );

	container.add( xRow );

	var yRow = new UI.Row();
	var y = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

		

	} );
	

	yRow.add( new UI.Text('y').setWidth( '90px' ) );
	yRow.add( y );

	container.add( yRow );


	var zRow = new UI.Row();
	var z = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

		 

	} );
	
	

	zRow.add( new UI.Text('z').setWidth( '90px' ) );
	zRow.add( z );

	container.add( zRow );


	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Define Node' ).onClick( function () {
		

		var coords = {

			coord_x  : x.getValue(),
			coord_y : y.getValue(),
			coord_z  : z.getValue()



};	
		
		var geometry = new THREE.SphereGeometry( 0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI );
		var mesh = new THREE.Mesh( geometry, node_material );
		mesh.extra = [];
		//mesh.matrixAutoUpdate = false;
		mesh.name = 'Node_' + String(nodeCount);
		mesh.userData = {'nn' : nodeCount,
						 'type': 'node',
						 'coord_x': coords.coord_x,
						 'coord_y' : coords.coord_y, 
						 'coord_z' : coords.coord_z};

		mesh.userData.dof_dx = 1;
		mesh.userData.dof_dy = 1;
		mesh.userData.dof_dz = 1;
		mesh.userData.dof_rx = 1;
		mesh.userData.dof_ry = 1;
		mesh.userData.dof_rz = 1;

		mesh.position.set(coords.coord_x, coords.coord_y, coords.coord_z);
		mesh.updateMatrix();

		//var txt_sprt = makeTextSprite( String(nodeCount) );
		//txt_sprt.parent = mesh;
		//txt_sprt.name = 'yellow';
		//txt_sprt.position.set(coords.coord_x, coords.coord_y, coords.coord_z);
		//mesh.extra.push( txt_sprt );
		
		editor.execute( new AddObjectCommand( mesh ) );

		//editor.execute( new AddObjectCommand( txt_sprt ) );
		
		//editor.sceneHelpers.add( txt_sprt );
		render();
		nodeCount +=1;
		
		x.value = '';
		y.value = '';
		z.value = '';
		

	} );
	

	//console.log(Viewport.transformControls.object)
	
	nodes = [];

	buttonRow.add( btn );

	container.add( buttonRow );
/*
	
	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Pick Nodes' ).onClick( function () {
		nodes=[]

		{

		//document.addEventListener( "mousedown", onMouseDown, false );
		
		document.addEventListener( "click", onMouseUp, false );
		

	}

	function onMouseUp(event){
		if ( editor.selected == null ) {


		}else if(nodes.length<2) {
			if (nodes[0]==editor.selected){
				
			}else{
				nodes.push(editor.selected)
				console.log(nodes)
				}
				
			}
		else {
			document.removeEventListener( "click", onMouseUp, false );
		
		
		}

	}
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );

	//

	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Create Element' ).onClick( function () {
		positions = []

		var geometry = new THREE.BufferGeometry();
		
		positions.push(nodes[0].position.x, nodes[0].position.y, nodes[0].position.z,
		nodes[1].position.x, nodes[1].position.y, nodes[1].position.z)

		// itemSize = 3 because there are 3 values (components) per vertex

		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
		geometry.computeBoundingSphere();

		line.extra = [];
		
		line = new THREE.Line( geometry, member_material );
		
		line.material.linewidth = 3
		line.name = 'Element_' + String(elemCount);
		
		var txt_sprt = makeTextSprite( String(elemCount) )
		
		txt_sprt.position.set((nodes[0].position.x+nodes[1].position.x)/2, (nodes[0].position.y+nodes[1].position.y)/2, (nodes[0].position.z+nodes[1].position.z)/2)
		line.position.set((nodes[0].position.x+nodes[1].position.x)/2, (nodes[0].position.y+nodes[1].position.y)/2, (nodes[0].position.z+nodes[1].position.z)/2)

		//line.children.add( txt_sprt )
		line.extra.push( txt_sprt )

		editor.execute( new AddObjectCommand( line ) );
		
		render();

		elemCount+=1
		
		
	
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );

	//

	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Draw Nodes On Grid' ).onClick( function () {
		var geometry = new THREE.PlaneGeometry( 20, 20, 20, 20 );
		var material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide, wireframe: true} );
		var plane = new THREE.Mesh( geometry, material );
		plane.position.set( 10,10,0 );
		plane.visible = true;


		editor.sceneHelpers.add( plane )


		var hoverMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), new THREE.MeshStandardMaterial({ color: 0x0000ff}));
		var markerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), new THREE.MeshStandardMaterial({ color: 0xff0000}));
		
		let snapRadius = 0.5; // How big radius we search for vertices near the mouse click
		let snap = new GridSnap(editor, editor.scene, editor.renderer, editor.camera, plane, snapRadius, hoverMesh, markerMesh);
		
		
		document.addEventListener('mousemove', onMouseMove, false );
		document.addEventListener('mousedown', onMouseDown, false );
		document.addEventListener('mouseup', onMouseUp, false );

		function onMouseDown( event ) {
			snap.mouseDown(event);
		}

		function onMouseUp( event ) {
			snap.mouseUp(event);
		}

		function onMouseMove( event ) {
			snap.mouseMove(event);
		}

		
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );

	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Done' ).onClick( function () {

	var selectedObject = editor.sceneHelpers.getObjectByName('yellow');
	editor.sceneHelpers.remove( selectedObject );


	function onMouseDown( event ) {
	snap.mouseDown(event);
	}

	function onMouseUp( event ) {
		snap.mouseUp(event);
	}

	function onMouseMove( event ) {
		snap.mouseMove(event);
	}
		
	document.removeEventListener('mousemove', onMouseMove, false );
	document.removeEventListener('mousedown', onMouseDown, false );
	document.removeEventListener('mouseup', onMouseUp, false );
	
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );
	*/
	


	//

	function updateRenderer() {

		createRenderer( THREE.WebGLRenderer, true, false, false, false);

	}

	function createRenderer( type, antialias, shadows, gammaIn, gammaOut ) {



		var renderer = new rendererTypes[ type ]( { antialias: antialias} );
		renderer.gammaInput = gammaIn;
		renderer.gammaOutput = gammaOut;
		if ( shadows && renderer.shadowMap ) {

			renderer.shadowMap.enabled = true;
			// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		}

		signals.rendererChanged.dispatch( renderer );

	}

	createRenderer( config.getKey( 'project/renderer' ), config.getKey( 'project/renderer/antialias' ), config.getKey( 'project/renderer/shadows' ), config.getKey( 'project/renderer/gammaInput' ), config.getKey( 'project/renderer/gammaOutput' ) );

	return container;

};
