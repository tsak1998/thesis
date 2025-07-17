/**
 * @author mrdoob / http://mrdoob.com/
 */


Sidebar.Elements = function ( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;
	var nodeCount = 1;
	var elemCount = 1;

	var container = new UI.Panel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	//count lines and nodes

	
	//labels for objects

	
	// materials

	node_material = new THREE.MeshStandardMaterial() 
	member_material = new THREE.LineBasicMaterial( {'color' : 0x404040} );
	
	//element section

	var elemSectRow = new UI.Row();
	var elemSect = new UI.Input( '' ).setLeft( '10px' ).setWidth( '40px' );

	elemSectRow.add( new UI.Text( 'Section ID' ).setWidth( '90px' ) );
	elemSectRow.add( elemSect );

	container.add( elemSectRow );


	// nodes

	var node_iRow= new UI.Row();
	var node_i = new UI.Input( '' ).setLeft( '100px' ).setWidth( '40px' );
	
	
	
	node_iRow.add( new UI.Text( 'Node i' ).setWidth( '90px' ) );
	node_iRow.add( node_i );

	container.add( node_iRow );

	var node_jRow= new UI.Row();
	var node_j = new UI.Input( '' ).setLeft( '100px' ).setWidth( '40px' );
	

	node_jRow.add( new UI.Text( 'Node j' ).setWidth( '90px' ) );
	node_jRow.add( node_j );

	container.add( node_jRow );

	nodes  = [];
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
				if (nodes.length ==1){
					node_i.dom.value = nodes[0].userData.nn}
				else {
					node_j.dom.value = nodes[1].userData.nn}
				
				}
				
			}
		else {
			document.removeEventListener( "click", onMouseUp, false );
			
		}
	}
		
	} );

	buttonRow.add( btn );

	//container.add( buttonRow );

	//

	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Create Element' ).onClick( function () {
		nodes = [];
		node_I = editor.scene.getObjectByName( 'Node ' + node_i.getValue() );
		nodes.push(node_I)
		node_J = editor.scene.getObjectByName( 'Node ' + node_j.getValue() );
		nodes.push(node_J)
		console.log(nodes)
		xi = nodes[0].position.x
		yi = nodes[0].position.y
		zi = nodes[0].position.z
		xj = nodes[1].position.x
		yj = nodes[1].position.y
		zj = nodes[1].position.z

		xHelp = xi
		yHelp = 0
		zHelp = zi

		// dummy line for calculations
		helpLine = new THREE.Line3(new THREE.Vector3(xi, yi, zi), new THREE.Vector3(xj, yj, zj))
		length = helpLine.distance()
		dirVector = new THREE.Vector3()
		helpLine.delta( dirVector )
		dirVector.normalize()
		middle = new THREE.Vector3()
		helpLine.delta( middle )
		// helper vector
		helpVector = new THREE.Vector3(0, 1, 0)
		//calculate the desired axis
		if (dirVector.x==0 & dirVector.z==0){
			zLocal = new THREE.Vector3(0,0,-1)
			yLocal = new THREE.Vector3(-1,0,0)
		} else if(dirVector.x!=0 & dirVector.y!=0 & dirVector.z==0){
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(helpVector, dirVector)
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, zLocal)
		} else if(dirVector.x==0 & dirVector.y!=0 & dirVector.z!=0){
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, helpVector)
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(yLocal, dirVector)
		}else if(dirVector.y==0){
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(dirVector, helpVector)
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, zLocal)
		}else{
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(helpVector, dirVector)
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, zLocal)
		}
		transformMatrix = new THREE.Matrix4()
		transformMatrix.makeBasis(dirVector, yLocal, zLocal)	
		transformMatrix.setPosition(new THREE.Vector3(xi, yi, zi))

		var xm = (xi + xj) / 2;
        var ym = (yi + yj) / 2;
        var zm = (zi + zj) / 2;

		var arrowHelper;
        var localAxes = new THREE.Object3D();
        var origin = new THREE.Vector3( xm, ym, zm );        
        var alength = 0.5;
		var hex;

		axesMatrix = new THREE.Matrix4()
		axesMatrix.makeBasis(dirVector, yLocal, zLocal)	
		axesMatrix.setPosition(new THREE.Vector3(xm, ym, zm)) 
		
        hex = 0xff0000;
        arrowHelper = new THREE.ArrowHelper( dirVector, origin, alength, hex );
        localAxes.add ( arrowHelper );
         
        hex = 0x0000ff;
        arrowHelper = new THREE.ArrowHelper( yLocal, origin, alength, hex );
        localAxes.add ( arrowHelper );

        //var yDir = new THREE.Vector3().crossVectors( xDir, zDir );
       
        hex = 0x00ff00;
        arrowHelper = new THREE.ArrowHelper( zLocal, origin, alength, hex );
		localAxes.add ( arrowHelper );
		
		var positions = [];
		positions.push(0, 0, 0, length, 0, 0)
		var geometry = new THREE.BufferGeometry();
		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
		
		line = new THREE.Line( geometry, member_material );
		line.material.linewidth = 1
		line.name = 'Element ' + String(elemCount);
		line.userData = {'en' : 9,
						 'type':  'element',
						 'nodei' : node_I.userData.nn,
						  'nodej' : node_J.userData.nn,
						  'elem_type': 'beam',
						  'length' : length ,
						  'section_id' : parseInt(sectId.getValue()),
						  'fixity_dx_i': 0,
						  'fixity_dy_i': 0,
						  'fixity_dz_i': 0,
						  'fixity_rx_i': 0,
						  'fixity_ry_i': 0,
						  'fixity_rz_i': 0,
						  'fixity_dx_j': 0,
						  'fixity_dy_j': 0,
						  'fixity_dz_j': 0,
						  'fixity_rx_j': 0,
						  'fixity_ry_j': 0,
						  'fixity_rz_j': 0,

						  'label_position' : new THREE.Vector3( xm, ym, zm),
						  'xLocal' : dirVector,
						  'yLocal' : yLocal,
						  'zLocal': zLocal,

						 };
				
		line.applyMatrix( transformMatrix )
	
		editor.execute( new AddObjectCommand( line ) );
		
		
	
		elemCount+=1
		
		
	
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );
	
	// Add interactive element creation button
	var interactiveButtonRow = new UI.Row();
	var interactiveBtn = new UI.Button( '🔗 Interactive Mode' ).onClick( function () {
		// Toggle interactive element creation
		if (window.cadToolbar) {
			window.cadToolbar.toggleElementCreation();
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

		if (valueId == Elements.id){

        }else{
           editor.selectById( valueId );
           updateElementProperties(editor.selected.userData)

        }

		ignoreObjectSelectedSignal = false;

	} );

	outliner.onDblClick( function () {
        valueId = parseInt( outliner.getValue())
        if (valueId == Elements.id){

        }else{
			
		   editor.focusById( valueId );
		   if ( editor.selected != null){
			signals.objectSelected.dispatch( editor.selected )
		};
        }

	} );

	container.add( outliner );
	container.add( new UI.Break() );

    var elementIdRow = new UI.Row();
	var elementId = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	elementId.dom.disabled = true;
	elementId.dom.value = '';

	elementIdRow.add( new UI.Text( 'Element Id').setWidth( '90px' ) );
	elementIdRow.add( elementId );

	container.add( elementIdRow );

    var sectIdRow = new UI.Row();
	var sectId = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	sectId.min = 1;
	sectId.max = 100;
	sectId.step = 100;
	sectId.dom.value = '';

	sectIdRow.add( new UI.Text( 'Section Id').setWidth( '90px' ) );
	sectIdRow.add( sectId );

	container.add( sectIdRow );
	// position

	var nodeIRow = new UI.Row();
	var nodeI = new UI.Number().setPrecision( 1 ).setWidth( '50px' )//.onChange( update );
	nodeI.dom.disabled = true;
	nodeI.dom.value = '';
	nodeIRow.add( new UI.Text( 'Node i').setWidth( '90px' ) );
	nodeIRow.add( nodeI );

	container.add(nodeIRow)

	var nodeJRow = new UI.Row();
	var nodeJ = new UI.Number().setPrecision( 1 ).setWidth( '50px' )//.onChange( update );
	nodeJ.dom.disabled = true;
	nodeJ.dom.value = '';
	nodeJRow.add( new UI.Text( 'Node j').setWidth( '90px' ) );
	nodeJRow.add( nodeJ );

    container.add(nodeJRow)

    var lengthRow = new UI.Row();
	var length = new UI.Number().setPrecision( 1 ).setWidth( '50px' )//.onChange( update );
	length.dom.disabled = true;
	length.dom.value = '';
	lengthRow.add( new UI.Text( 'Length').setWidth( '90px' ) );
	lengthRow.add( length );

	container.add(lengthRow);
	
	var fixityIRow = new UI.Row();
	var fixityIX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIX.max = 1;
	fixityIX.min = 0;
	fixityIX.dom.value = '';
	fixityIX.step =100;
	var fixityIY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIY.max = 1;
	fixityIY.min = 0;
	fixityIY.dom.value = '';
	fixityIY.step =100;
	var fixityIZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIZ.max = 1;
	fixityIZ.min = 0;
	fixityIZ.dom.value = '';
	fixityIZ.step =100;
	var fixityIRX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIRX.max = 1;
	fixityIRX.min = 0;
	fixityIRX.dom.value = '';
	fixityIRX.step =100;
	var fixityIRY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIRY.max = 1;
	fixityIRY.min = 0;
	fixityIRY.dom.value = '';
	fixityIRY.step =100;
	var fixityIRZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityIRZ.max = 1;
	fixityIRZ.min = 0;
	fixityIRZ.dom.value = '';
	fixityIRZ.step =100;
	fixityIRow.add(  new UI.Text( 'fixity I').setWidth( '90px' ) );
	fixityIRow.add( fixityIX, fixityIY, fixityIZ, fixityIRX, fixityIRY, fixityIRZ);

	container.add(fixityIRow);

	var fixityJRow = new UI.Row();
	var fixityJX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJX.max = 1;
	fixityJX.min = 0;
	fixityJX.dom.value = '';
	fixityJX.step =100;
	var fixityJY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJY.max = 1;
	fixityJY.min = 0;
	fixityJY.dom.value = '';
	fixityJY.step =100;
	var fixityJZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJZ.max = 1;
	fixityJZ.min = 0;
	fixityJZ.dom.value = '';
	fixityJZ.step =100;
	var fixityJRX = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJRX.max = 1;
	fixityJRX.min = 0;
	fixityJRX.dom.value = '';
	fixityJRX.step =100;
	var fixityJRY = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJRY.max = 1;
	fixityJRY.min = 0;
	fixityJRY.dom.value = '';
	fixityJRY.step =100;
	var fixityJRZ = new UI.Number().setPrecision( 0 ).setWidth( '30px' )//.onChange( update );
	fixityJRZ.max = 1;
	fixityJRZ.min = 0;
	fixityJRZ.dom.value = '';
	fixityJRZ.step =100;
	console.log(fixityJRZ)
	fixityJRow.add(  new UI.Text( 'fixity J').setWidth( '90px' ) );
	fixityJRow.add( fixityJX, fixityJY, fixityJZ, fixityJRX, fixityJRY, fixityJRZ);

	container.add(fixityJRow);

	//releases button
	var buttonRow = new UI.Row();
	var btn = new UI.Button( 'Update Element' ).onClick( function () {
		valueId = parseInt( outliner.getValue());
		elmnt = editor.scene.getObjectById( valueId );
		elmnt.userData.section_id = sectId.dom.value
		elmnt.userData.fixity_dx_i = fixityIX.dom.value
		elmnt.userData.fixity_dy_i = fixityIY.dom.value
		elmnt.userData.fixity_dz_i = fixityIZ.dom.value
		elmnt.userData.fixity_rx_i = fixityIRX.dom.value
		elmnt.userData.fixity_ry_i = fixityIRY.dom.value
		elmnt.userData.fixity_rz_i = fixityIRZ.dom.value
		elmnt.userData.fixity_dx_j = fixityJX.dom.value
		elmnt.userData.fixity_dy_j = fixityJY.dom.value
		elmnt.userData.fixity_dz_j = fixityJZ.dom.value
		elmnt.userData.fixity_rx_j = fixityJRX.dom.value
		elmnt.userData.fixity_ry_j = fixityJRY.dom.value
		elmnt.userData.fixity_rz_j = fixityJRZ.dom.value
		editor.storage.set( editor.toJSON() );
        editor.signals.savingFinished.dispatch();
	});

	buttonRow.add( btn );

	container.add( buttonRow );

    var updateElementProperties = function(values){
		elementId.dom.value = values.en;
		sectId.dom.value = values.section_id;
        nodeI.dom.value = values.nodei;
        nodeJ.dom.value = values.nodej;
		length.dom.value = values.length;
		fixityIX.dom.value = values.fixity_dx_i;
		fixityIY.dom.value = values.fixity_dy_i;
		fixityIZ.dom.value = values.fixity_dz_i;
		fixityIRX.dom.value = values.fixity_rx_i;
		fixityIRY.dom.value = values.fixity_ry_i;
		fixityIRZ.dom.value = values.fixity_rz_i;
		fixityJX.dom.value = values.fixity_dx_j;
		fixityJY.dom.value = values.fixity_dy_j;
		fixityJZ.dom.value = values.fixity_dz_j;
		fixityJRX.dom.value = values.fixity_rx_j;
		fixityJRY.dom.value = values.fixity_ry_j;
		fixityJRZ.dom.value = values.fixity_rz_j;
        
    };

    var Elements = new THREE.Object3D()
    Elements.name = 'Elements'
	function refreshUI() {
		var array = editor.scene.children
		var len = array.length
	    nodes_ = []
        for (i=0; i<len; i++){
			obj = array[i]
			if (obj.userData.type == 'element') {
				nodes_.push( obj );
			}
		}
		
		var options = [];


		options.push( buildOption( Elements, false ) );

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




	}
	signals.editorCleared.add( refreshUI );

	signals.sceneGraphChanged.add( refreshUI );

	signals.objectChanged.add( function ( object ) {

		var options = outliner.options;

		for ( var i = 0; i < options.length; i ++ ) {

			var option = options[ i ];

			if ( option.value === object.id ) {

				option.inumbererHTML = buildHTML( object );
				return;

			}

		}

	} );

	signals.objectSelected.add( function ( object ) {

	    if (object!=null){

	        if(object.userData.type == 'element'){
                updateElementProperties(object.userData)
            }
        }
		if ( ignoreObjectSelectedSignal === true ) return;

		outliner.setValue( object !== null ? object.id : null );

	} );
	

	refreshUI();
	
	
	return container;

};
