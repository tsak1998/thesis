/**
 * @author mrdoob / http://mrdoob.com/
 */


Sidebar.Nodes = function ( editor ) {
	

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
	}
	
	
	//labels for objects

	function render() {

		editor.sceneHelpers.updateMatrixWorld();
		editor.scene.updateMatrixWorld();

		editor.renderer.render( editor.scene, editor.camera );

		if ( editor.renderer instanceof THREE.RaytracingRenderer === false ) {

			editor.renderer.render( editor.sceneHelpers, editor.camera );

		}

	};



	function makeTextSprite( message, parameters )
    {
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 70;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
        var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:0, g:0, b:200, a:0.5 };
        var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;

        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText( message, borderThickness, fontsize + borderThickness);

        var texture = new THREE.Texture(canvas) 
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.4, 0.4,0.4);
        return sprite;  
    }
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
			coord_y : z.getValue(),
			coord_z  : y.getValue()



		};	
		
		var geometry = new THREE.SphereGeometry( 0.05, 12, 12, 0, Math.PI * 2, 0, Math.PI );
		var mesh = new THREE.Mesh( geometry, node_material );
		mesh.extra = [];
		//mesh.matrixAutoUpdate = false;
		mesh.name = 'Node ' + String(nodeCount);
		mesh.userData = {'nn' : nodeCount,
						 'type': 'node',
						 'coord_x': coords.coord_x,
						 'coord_y' : coords.coord_z, 
						 'coord_z' : coords.coord_y};

		mesh.userData.dof_dx = 1;
		mesh.userData.dof_dy = 1;
		mesh.userData.dof_dz = 1;
		mesh.userData.dof_rx = 1;
		mesh.userData.dof_ry = 1;
		mesh.userData.dof_rz = 1;
		

		mesh.position.set(coords.coord_x, coords.coord_y, coords.coord_z);
		geometry.computeBoundingSphere();
		//mesh.updateMatrix();
		
		let label = new makeTextSprite(mesh.userData.nn, );
		
		label.name = mesh.name
		
		console.log(label)
		mesh.add(label)
		editor.execute( new AddObjectCommand( mesh ) );
	
		//editor.sceneHelpers.add( label );
		
		render();
		nodeCount +=1;
		
		x.value = '';
		y.value = '';
		z.value = '';
		

	} );
	
	
	nodes = [];

	buttonRow.add( btn );

	container.add( buttonRow );
	
	// Add interactive node creation button
	var interactiveButtonRow = new UI.Row();
	var interactiveBtn = new UI.Button( '🎯 Interactive Mode' ).onClick( function () {
		// Toggle interactive node creation
		if (window.cadToolbar) {
			window.cadToolbar.toggleNodeCreation();
		} else {
			console.warn('CAD Toolbar not available');
		}
	} );
	
	interactiveButtonRow.add( interactiveBtn );
	container.add( interactiveButtonRow );

    function buildOption( object, draggable ) {

		var option = document.createElement( 'div' );
		option.draggable = draggable;
		option.innerHTML = buildHTML( object );
		option.value = object.id;

		return option;

	}

	function escapeHTML( html ) {

		return html
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#39;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );

	}

	function getMaterialName( material ) {

		if ( Array.isArray( material ) ) {

			var array = [];

			for ( var i = 0; i < material.length; i ++ ) {

				array.push( material[ i ].name );

			}

			return array.join( ',' );

		}

		return material.name;

	}

	function getScript( uuid ) {

		if ( editor.scripts[ uuid ] !== undefined ) {

			return ' <span class="type Script"></span>';

		}

		return '';

	}

	var ignoreObjectSelectedSignal = false;

	function buildHTML( object ) {

		var html = '<span class="type ' + object.type + '"></span> ' + escapeHTML( object.name );

		if ( object instanceof THREE.Mesh ) {

			var geometry = object.geometry;
			var material = object.material;

			html += ' <span class="type ' + geometry.type + '"></span> ' + escapeHTML( geometry.name );
			html += ' <span class="type ' + material.type + '"></span> ' + escapeHTML( getMaterialName( material ) );

		}

		html += getScript( object.uuid );

		return html;

	}

	var outliner = new UI.Outliner( editor );
	outliner.setId( 'outliner' );
	outliner.onChange( function () {
		if ( editor.selected != null){
			signals.objectDeselected.dispatch( editor.selected )
		};
		ignoreObjectSelectedSignal = true;
        valueId = parseInt( outliner.getValue())

		 if (valueId == Nodes.id){

        }else{
           editor.selectById( valueId );
           updateNodeProperties(editor.selected.userData)

        }

		ignoreObjectSelectedSignal = false;

	} );

	outliner.onDblClick( function () {
        valueId = parseInt( outliner.getValue())
        if (valueId == Nodes.id){

        }else{
		   editor.focusById( valueId );
		   if ( editor.selected != null){
				signals.objectSelected.dispatch( editor.selected )
			};
        }

	} );

	container.add( outliner );
	container.add( new UI.Break() );


    /*
	var nodeXRow = new UI.Row();
	var nodeX = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {



	} );


	nodeXRow.add( new UI.Text('x').setWidth( '90px' ) );
	nodeXRow.add( nodeX );

	container.add( nodeXRow );
	*/


    var Nodes = new THREE.Object3D()
    Nodes.name = 'Nodes'
	function refreshUI() {
	    nodes_ = []
        for (i=0; i<editor.scene.children.length; i++){
			obj = editor.scene.children[i]
			if (obj.userData.type == 'node') {
				nodes_.push( obj );
			}
		}
		var camera = editor.camera;
		var scene = editor.scene;

		var options = [];


		options.push( buildOption( Nodes, false ) );

		( function addObjects( objects, pad ) {

			for ( var i = 0, l = objects.length; i < l; i ++ ) {

				var object = objects[ i ];

				var option = buildOption( object, true );
				option.style.paddingLeft = ( pad * 10 ) + 'px';
				options.push( option );

				// addObjects( object.children, pad + 1 );

			}

		} )
		(nodes_, 1 );

		outliner.setOptions( options );

		if ( editor.selected !== null ) {

			outliner.setValue( editor.selected.id );

		}

		if ( scene.background ) {

			//backgroundColor.setHexValue( scene.background.getHex() );

		}



	}

	var nodeIdRow = new UI.Row();
	var nodeId = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	nodeId.dom.disabled = true;
	nodeId.dom.value = '';

	nodeIdRow.add( new UI.Text( 'Node Id').setWidth( '90px' ) );
	nodeIdRow.add( nodeId );

	container.add( nodeIdRow );

	// position

	var objectPositionRow = new UI.Row();
	var objectPositionX = new UI.Number().setPrecision( 3 ).setWidth( '50px' )//.onChange( update );
	objectPositionX.dom.disabled = true;
	objectPositionX.dom.value = '';
	var objectPositionY = new UI.Number().setPrecision( 3 ).setWidth( '50px' )//.onChange( update );
	objectPositionY.dom.disabled = true;
	objectPositionY.dom.value = '';
	var objectPositionZ = new UI.Number().setPrecision( 3 ).setWidth( '50px' )//.onChange( update );
    objectPositionZ.dom.disabled = true;
    objectPositionZ.dom.value = '';
	objectPositionRow.add(  new UI.Text( 'Coordinates').setWidth( '90px' ) );
	objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );

    container.add(objectPositionRow)

    //dofs

    var dofsRow = new UI.Row();
	var dofX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	dofX.max = 1;
	dofX.min = 0;
	dofX.step = 1;
	dofX.dom.value = '';
	var dofY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	dofY.max = 1;
	dofY.min = 0;
	dofY.step = 1;
	dofY.dom.value = '';
	var dofZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
    dofZ.step = 1;
    dofZ.max = 1;
	dofZ.min = 0;
	dofZ.dom.value = '';
    var dofRX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	dofRX.step = 1;
    dofRX.max = 1;
	dofRX.min = 0;
	dofRX.dom.value = '';
	var dofRY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	dofRY.step = 1;
	dofRY.max = 1;
	dofRY.min = 0;
	dofRY.dom.value = '';
	var dofRZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
    dofRZ.step = 1;
    dofRZ.max = 1;
	dofRZ.min = 0;
	dofRZ.dom.value = '';
	dofsRow.add(  new UI.Text( 'Dofs').setWidth( '90px' ) );
	dofsRow.add( dofX, dofY, dofZ, dofRX, dofRY, dofRZ);

	container.add(dofsRow)
	
	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Update Supports' ).onClick( function () {
		valueId = parseInt( outliner.getValue());
		nod = editor.scene.getObjectById( valueId );
		nod.userData.dof_dx = dofX.dom.value
		nod.userData.dof_dy = dofY.dom.value
		nod.userData.dof_dz = dofZ.dom.value
		nod.userData.dof_rx = dofRX.dom.value
		nod.userData.dof_ry = dofRY.dom.value
		nod.userData.dof_rz = dofRZ.dom.value
		
		editor.storage.set( editor.toJSON() );
        editor.signals.savingFinished.dispatch();
	});

	buttonRow.add( btn );
	
	container.add( buttonRow );

    refreshUI();

    var updateNodeProperties = function(values){
        nodeId.dom.value = values.nn
        objectPositionX.dom.value = values.coord_x
        objectPositionY.dom.value = values.coord_y
        objectPositionZ.dom.value = values.coord_z
        dofX.dom.value = values.dof_dx
        dofY.dom.value = values.dof_dy
        dofZ.dom.value = values.dof_dz
        dofRX.dom.value = values.dof_rx
        dofRY.dom.value = values.dof_ry
        dofRZ.dom.value = values.dof_rz
    }

    signals.editorCleared.add( refreshUI );

	signals.sceneGraphChanged.add( refreshUI );

	signals.objectChanged.add( function ( object ) {

		var options = outliner.options;

		for ( var i = 0; i < options.length; i ++ ) {

			var option = options[ i ];

			if ( option.value === object.id ) {

				option.innerHTML = buildHTML( object );
				return;

			}

		}

	} );

	signals.objectSelected.add( function ( object ) {

	    if (object!=null){

	        if(object.userData.type == 'node'){
                updateNodeProperties(object.userData)
            }
        }
		if ( ignoreObjectSelectedSignal === true ) return;

		outliner.setValue( object !== null ? object.id : null );

	} );


	signals.objectSelected.add( function ( object ) {

	    if (object!=null){

	        if(object.userData.type == 'element'){
                updateNodeProperties(object.userData)
            }
        }
		if ( ignoreObjectSelectedSignal === true ) return;

		outliner.setValue( object !== null ? object.id : null );

	} );

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
