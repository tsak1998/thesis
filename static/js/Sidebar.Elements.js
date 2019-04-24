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
	function count_elem() {
		arr =  editor.scene.children
		for (i=0; i < arr.length; i++){
			if (arr[i].geometry.type=='SphereGeometry') {
				nodeCount+=1
			}else if (arr[i].type=='Line'){
				elemCount+=1
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

	}

	// materials

	node_material = new THREE.MeshStandardMaterial() 
	member_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

	//element type

	var elemTypeRow = new UI.Row();
	var elemType = new UI.Select().setWidth( '150px' );
	var elemTypeOpt = {
		'beam'  : 'BEAM',
		'truss' : 'TRUSS'
	}
	elemType.setOptions( elemTypeOpt )
	elemTypeRow.add (new UI.Text( 'Element Type' ).setWidth( '90px' ))
	elemTypeRow.add( elemType )
	container.add( elemTypeRow )

	//element section

	var elemSectRow = new UI.Row();
	var elemSect = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

		
	} );
	

	elemSectRow.add( new UI.Text( 'Section ID' ).setWidth( '90px' ) );
	elemSectRow.add( elemSect );

	container.add( elemSectRow );


	// nodes

	var node_iRow= new UI.Row();
	var node_i = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

		
	} );
	
	
	node_iRow.add( new UI.Text( 'Node i' ).setWidth( '90px' ) );
	node_iRow.add( node_i );

	container.add( node_iRow );

	var node_jRow= new UI.Row();
	var node_j = new UI.Input( '' ).setLeft( '100px' ).onChange( function () {

	} );
	

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
		
		line = new THREE.Line( geometry, member_material );
		line.extra = [];
		length = Math.sqrt((nodes[0].position.x-nodes[1].position.x)**2 + (nodes[0].position.y-nodes[1].position.y)**2 + (nodes[0].position.z-nodes[1].position.z)**2)
		
		line.material.linewidth = 3
		line.name = 'Element ' + String(elemCount);
		line.userData = {'en' : elemCount,
						 'type':  'element',
						 'nodei' : nodes[0].userData.nn,
						  'nodej' : nodes[1].userData.nn,
						  'elem_type': elemType.getValue(),
						  'length' : length ,
						  'section_id' : parseInt(elemSect.getValue()) }
		
		//line.position.set((parseFloat(nodes[0].position.x)+parseFloat(nodes[1].position.x))/2, (parseFloat(nodes[0].position.y)+parseFloat(nodes[1].position.y))/2, (parseFloat(nodes[0].position.z)+parseFloat(nodes[1].position.z))/2)
		
		let label = new SpriteText(line.userData.en, 0.025);
		label.color = 'red';
		label.name = line.name
		x_lbl = (parseFloat(nodes[0].position.x)+parseFloat(nodes[1].position.x))/2+0.1
		y_lbl = (parseFloat(nodes[0].position.y)+parseFloat(nodes[1].position.y))/2+0.2
		z_lbl = (parseFloat(nodes[0].position.z)+parseFloat(nodes[1].position.z))/2+0.1
		label.position.set( x_lbl, y_lbl, z_lbl)
		
		editor.execute( new AddObjectCommand( line ) );
		editor.sceneHelpers.add( label )
		render();
	
		elemCount+=1
		
		
	
		
	} );
	

	buttonRow.add( btn );

	container.add( buttonRow );


	return container;

};