/**
 * @author mrdoob / http://mrdoob.com/
 */

var Viewport = function ( editor ) {



    var signals = editor.signals;

    var container = new UI.Panel();
    container.setId( 'viewport' );
    container.setPosition( 'absolute' );
    container.add( new Viewport.Info( editor ) );
	//

    var renderer = null;

    var camera = editor.camera;
    var scene = editor.scene;
    var sceneHelpers = editor.sceneHelpers;

    var objects = [];

	// helpers

    var grid = new THREE.GridHelper( 30, 30, 0x444444, 0x888888 );
	//sceneHelpers.add( grid );
	var arrowHelper;
	var localAxes = new THREE.Object3D();
	var origin = new THREE.Vector3( 0,0,0 );        
	var alength = 2;
	var hex;

	
	hex = 0xff0000;
	arrowHelper = new THREE.ArrowHelper( new THREE.Vector3( 1,0,0 ), origin, alength, hex );
	localAxes.add ( arrowHelper );
	
	hex = 0x0000ff;
	arrowHelper = new THREE.ArrowHelper( new THREE.Vector3( 0,1,0 ), origin, alength, hex );
	localAxes.add ( arrowHelper );

	//var yDir = new THREE.Vector3().crossVectors( xDir, zDir );

	hex = 0x00ff00;
	arrowHelper = new THREE.ArrowHelper( new THREE.Vector3( 0,0,1 ), origin, alength, hex );
	localAxes.add ( arrowHelper );
	sceneHelpers.add(localAxes);
	
	
    var gridXZ = new THREE.GridHelper(20, 20);
    //gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
    gridXZ.position.set( 10,0,10 );
    sceneHelpers.add(gridXZ);
	
    

	var array = grid.geometry.attributes.color.array;

	for ( var i = 0; i < array.length; i += 60 ) {

		for ( var j = 0; j < 12; j ++ ) {

			array[ i + j ] = 0.26;

		}

	}
	//
	

	boxes_vert = [];
	for ( var i = 0; i <20; i ++ ) {

		for ( var j = 0; j < 20; j ++ ) {

			for ( var z = 0; j < 20; j ++ ) {
				
				boxes_vert.push(i,j,z)

			}


		}

	}
	//
	var box = new THREE.Box3();
	
	

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	selectionBox.name = 'Selection Box'
	selectionBox.matrixAutoUpdate = true
	sceneHelpers.add( selectionBox );
	
	var objectPositionOnDown = null;
	var objectRotationOnDown = null;
	var objectScaleOnDown = null;

	var transformControls = new THREE.TransformControls( camera, container.dom );


	//sceneHelpers.add( transformControls );

	// object picking

	var raycaster = new THREE.Raycaster();
	raycaster.linePrecision = 0.01
	var mouse = new THREE.Vector2();

	// events

	function getIntersects( point, objects ) {

		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

		raycaster.setFromCamera( mouse, camera );

		return raycaster.intersectObjects( objects );

	}

	var onDownPosition = new THREE.Vector2();
	var onUpPosition = new THREE.Vector2();
	var onDoubleClickPosition = new THREE.Vector2();

	function getMousePosition( dom, x, y ) {

		var rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

	}

	function handleClick() {

		if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
			
			var intersects = getIntersects( onUpPosition, objects );
			
			if ( intersects.length > 0 ) {

				var object = intersects[ 0 ].object;
				if (editor.selected!=null){
					if(object != editor.selected ){
						signals.objectDeselected.dispatch( editor.selected )
					}
					
				}
				editor.select( object );
				
					
				

			} else {
				if (editor.selected != null) {
					signals.objectDeselected.dispatch( editor.selected )
				}
				
				editor.select( null );
				
			}
			
		

		}

	}

	function onMouseDown( event ) {

		event.preventDefault();

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseUp( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'mouseup', onMouseUp, false );

	}

	function onTouchStart( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'touchend', onTouchEnd, false );

	}

	function onTouchEnd( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'touchend', onTouchEnd, false );

	}

	function onDoubleClick( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		var intersects = getIntersects( onDoubleClickPosition, objects );

		if ( intersects.length > 0 ) {

			var intersect = intersects[ 0 ];

			signals.objectFocused.dispatch( intersect.object );

		}

	}

	container.dom.addEventListener( 'mousedown', onMouseDown, false );
	container.dom.addEventListener( 'touchstart', onTouchStart, false );
	container.dom.addEventListener( 'dblclick', onDoubleClick, false );

	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	var controls = new THREE.EditorControls( camera, container.dom );
	controls.addEventListener( 'change', function () {

		signals.cameraChanged.dispatch( camera );

	} );

	// signals

	signals.editorCleared.add( function () {

		controls.center.set( 0, 0, 0 );
		render();

	} );

	signals.transformModeChanged.add( function ( mode ) {

		transformControls.setMode( mode );

	} );

	signals.snapChanged.add( function ( dist ) {

		transformControls.setTranslationSnap( dist );

	} );

	signals.spaceChanged.add( function ( space ) {

		transformControls.setSpace( space );

	} );

	signals.rendererChanged.add( function ( newRenderer ) {

		if ( renderer !== null ) {

			container.dom.removeChild( renderer.domElement );
			
			

		}

		renderer = newRenderer;
		editor.renderer = renderer;
		renderer.autoClear = false;
		renderer.autoUpdateScene = false;
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
		container.dom.appendChild( renderer.domElement );

		/*
		labelRenderer = new THREE.CSS2DRenderer();
		labelRenderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = 0;
		container.dom.appendChild( labelRenderer.domElement );
		*/


		render();

	} );

	signals.sceneGraphChanged.add( function () {

		render();

	} );

	signals.cameraChanged.add( function () {

		render();

	} );

	signals.objectSelected.add( function ( object ) {
		
		if ( object !== null && object !== scene && object !== camera ) {
			if (object.userData.type=='element'){
				if (object.material && object.material.color) {
					object.material.color.setHex( 0x00CCFF );
				}
			}else if (object.userData.type=='node'){
				if (object.material && object.material.emissive) {
					object.material.emissive.setHex( 0x00CCFF );
				}
			}else if (object.userData.type=='p_load'){
				if (object.material && object.material.color) {
					object.material.color.setHex( 0x00CCFF );
				}
			}else {
				if (object.material && object.material.color) {
					object.material.color.setHex( 0x00CCFF );
				}
			}

		} else if ( editor.selected == null) {

			
			
		}

		render();

	} );

	signals.objectDeselected.add( function ( object ) {
			if(editor.selected.name!='Scene'){
				if (object.userData.type=='element'){
					if (object.material && object.material.color) {
						object.material.color.setHex( 0x383838 );
					}
				}else if (object.userData.type=='node'){
					if (object.material && object.material.emissive) {
						object.material.emissive.setHex( 0x000066 );
					}
				}else if (object.userData.type=='p_load'){
					if (object.material && object.material.color) {
						object.material.color.setHex( 0xff0000 );
					}
				}else {
					if (object.material && object.material.color) {
						object.material.color.setHex( 0xD3D3D3 );
					}
				}
			}
		render();

	} );

	signals.objectFocused.add( function ( object ) {

		controls.focus( object );

	} );

	signals.geometryChanged.add( function ( object ) {

		if ( object !== undefined ) {

			selectionBox.setFromObject( object );

		}

		render();

	} );

	signals.objectAdded.add( function ( object ) {

		object.traverse( function ( child ) {

			objects.push( child );

		} );

	} );

	signals.objectChanged.add( function ( object ) {

		if ( editor.selected === object ) {

			selectionBox.setFromObject( object );

		}

		if ( object instanceof THREE.PerspectiveCamera || object instanceof THREE.OrthographicCamera ) {

			object.updateProjectionMatrix();

		}

		if ( editor.helpers[ object.id ] !== undefined ) {

			editor.helpers[ object.id ].update();

		}

		render();

	} );

	signals.objectRemoved.add( function ( object ) {

		if ( object === transformControls.object ) {

			transformControls.detach();

		}

		object.traverse( function ( child ) {

			objects.splice( objects.indexOf( child ), 1 );

		} );

	} );

	signals.helperAdded.add( function ( object ) {

		objects.push( object.getObjectByName( 'picker' ) );

	} );

	signals.helperRemoved.add( function ( object ) {

		objects.splice( objects.indexOf( object.getObjectByName( 'picker' ) ), 1 );

	} );

	signals.materialChanged.add( function ( material ) {

		render();

	} );

	// fog

	signals.sceneBackgroundChanged.add( function ( backgroundColor ) {

		scene.background.setHex( backgroundColor );

		render();

	} );

	var currentFogType = null;

	signals.sceneFogChanged.add( function ( fogType, fogColor, fogNear, fogFar, fogDensity ) {

		if ( currentFogType !== fogType ) {

			switch ( fogType ) {

				case 'None':
					scene.fog = null;
					break;
				case 'Fog':
					scene.fog = new THREE.Fog();
					break;
				case 'FogExp2':
					scene.fog = new THREE.FogExp2();
					break;

			}

			currentFogType = fogType;

		}

		if ( scene.fog instanceof THREE.Fog ) {

			scene.fog.color.setHex( fogColor );
			scene.fog.near = fogNear;
			scene.fog.far = fogFar;

		} else if ( scene.fog instanceof THREE.FogExp2 ) {

			scene.fog.color.setHex( fogColor );
			scene.fog.density = fogDensity;

		}

		render();

	} );

	//

	signals.windowResize.add( function () {

		// Handle window resize for perspective camera
		var aspect = container.dom.offsetWidth / container.dom.offsetHeight;

		editor.DEFAULT_CAMERA.aspect = aspect;
		editor.DEFAULT_CAMERA.updateProjectionMatrix();

		camera.aspect = aspect;
		camera.updateProjectionMatrix();

		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
		//labelRenderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		render();

	} );

	signals.showGridChanged.add( function ( showGrid ) {

		gridXZ.visible = showGrid;
		
		render();

	} );

	//

	function render() {

		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();

		renderer.render( scene, camera );
		//labelRenderer.render( scene, camera );

		if ( renderer instanceof THREE.RaytracingRenderer === false ) {

			renderer.render( sceneHelpers, camera );
			//labelRenderer.render( sceneHelpers, camera );
		}

	}
	
	return container;

};
