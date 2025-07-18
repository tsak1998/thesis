function drawElements( editor, elements ){
    for (a=0; a<elements.length; a++){
		var element = elements[a];
		
        var node_I = editor.scene.getObjectByName( 'Node '+ String(element.nodei) );
        var node_J = editor.scene.getObjectByName( 'Node '+ String(element.nodej) );
        xi = node_I.position.x
		yi = node_I.position.y
		zi = node_I.position.z
		xj = node_J.position.x
		yj = node_J.position.y
		zj = node_J.position.z


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
			zLocal = new THREE.Vector3(0,0,1)
			yLocal = new THREE.Vector3(1,0,0)
		} else if(dirVector.y==0){
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(helpVector, dirVector)
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, zLocal)
		} else {
			zLocal = new THREE.Vector3()
			zLocal.crossVectors(dirVector, helpVector)
			yLocal = new THREE.Vector3()
			yLocal.crossVectors(dirVector, zLocal)
		}
		transformMatrix = new THREE.Matrix4()
		 
		matrixTemp = transform(xi, yi, zi, xj, yj, zj, 0, length)
		console.log(matrixTemp.elements[0])
		dirVector1 = new THREE.Vector3(matrixTemp.elements[0],matrixTemp.elements[3],matrixTemp.elements[6])
		dirVector2 = new THREE.Vector3(matrixTemp.elements[1],matrixTemp.elements[4],matrixTemp.elements[7])
		dirVector3 = new THREE.Vector3(matrixTemp.elements[2],matrixTemp.elements[5],matrixTemp.elements[8])

		//transformMatrix.makeBasis(dirVector, yLocal, zLocal)
		transformMatrix.makeBasis(dirVector1, dirVector2, dirVector3)	
		transformMatrix.setPosition(new THREE.Vector3(xi, yi, zi))
		console.log(dirVector)

		
		// Create geometry for MeshLine
		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(length, 0, 0));
		
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
		      arrowHelper = new THREE.ArrowHelper( dirVector1, origin, alength, hex );
		      localAxes.add ( arrowHelper );
		       
		      hex = 0x0000ff;
		      arrowHelper = new THREE.ArrowHelper( dirVector2, origin, alength, hex );
		      localAxes.add ( arrowHelper );

		      //var yDir = new THREE.Vector3().crossVectors( xDir, zDir );
		     
		      hex = 0x00ff00;
		      arrowHelper = new THREE.ArrowHelper( dirVector3, origin, alength, hex );
		localAxes.add ( arrowHelper );
		//axes matrix
		
		

		line = LineUtils.createLineMesh(lineGeometry, {
			color: 0x404040,
			lineWidth: 8.0
		});
		line.name = 'Element ' + String(element.en);
		localAxes.name = line.name+'axis';
		line.userData = {'en' : element.en,
						 'type':  'element',
						 'nodei' : node_I.userData.nn,
						  'nodej' : node_J.userData.nn,
						  'elem_type': 'beam',
						  'length' : length ,
						  'section_id' : element.section_id,
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
						  'xLocal' : dirVector1,
						  'yLocal' : dirVector2,
						  'zLocal': dirVector3,

						 };

		
	
		line.applyMatrix( transformMatrix )
		editor.execute( new AddObjectCommand( line ) );
		


		
    }
};

function transform( xi, yi, zi, xj, yj, zj, bt, length ) {

    var mt3 = new THREE.Matrix3();
   
    var xl = xj - xi;
    var yl = yj - yi;
    var zl = zj - zi;

    var cx = xl / length;
    var cy = yl / length;
    var cz = zl / length;
    
    coa = Math.cos( bt );
    sia = -Math.pow( Math.pow( 1 - coa, 2 ) ,0.5 );

    var up = Math.pow ( Math.pow( cx,2 ) + Math.pow( cz, 2 ) ,0.5 );

    var m11, m12, m13, m21, m22, m23, m31, m32, m33

    if (up !== 0 )
    {
        m11 = cx;
        m12 = cy;
        m13 = cz;
        m21 = (-cx * cy * coa - cz * sia) / up;
        m22 = up * coa;
        m23 = (-cy * cz * coa + cx * sia) / up;
        m31 = (cx * cy * sia - cz * coa) / up;
        m32 = -up * sia;
        m33 = (cy * cz * sia + cx * coa) / up;
    } else {
        m11 = 0;
        m12 = cy;
        m13 = 0;
        m21 = -cy * coa;
        m22 = 0;
        m23 = sia;
        m31 = cy * sia;
        m32 = 0;
        m33 = coa;
        }  

    mt3.set( m11, m12, m13,
             m21, m22, m23,
             m31, m32, m33);

    return mt3;
}