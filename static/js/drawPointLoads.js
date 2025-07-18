function drawPointLoads( editor, pointLoads ){
    for (a=0; a<pointLoads.length; a++) {
        
        var pLoad = pointLoads[a];
        var c = pLoad.c;
        
        var load_id = a+1;
        if (pLoad.p_x != 0){
            type = 'p_load';
            direction = 'x';
            value = pLoad.p_x
        }else if (pLoad.p_y != 0){
            type = 'p_load';
            direction = 'y';
            value = pLoad.p_y;
        }else if (pLoad.p_z != 0){
            type = 'p_load';
            direction = 'z';
            value = pLoad.p_z;
        }else if (pLoad.m_x != 0){
            type = 'm_load';
            direction = 'x';
            value = pLoad.m_x;
        }else if (pLoad.m_y != 0){
            type = 'm_load';
            direction = 'y';
            value = pLoad.m_y;
        }else {
            type = 'm_load';
            direction = 'z';
            value = pLoad.m_z;
        }

        if (c==99999) {
            var object = editor.scene.getObjectByName( 'Node '+String(pLoad.nn) );
            objectId = object.nn;
            m = new THREE.Matrix4();
            m.copyPosition( object.matrix );
            positionOffset = new THREE.Vector3( 0, 0, 0)
            
        }else {
           
            var object = editor.scene.getObjectByName( 'Element '+String(pLoad.nn) );
            objectId = object.en;
                    
            xDir = new THREE.Vector3()
            yDir = new THREE.Vector3()
            zDir = new THREE.Vector3()
            object.matrix.extractBasis( xDir, yDir, zDir)
            m = new THREE.Matrix4()
            m.copyPosition( object.matrix ) 
            positionOffset = new THREE.Vector3( xDir.x*c*object.userData.length, xDir.y*c*object.userData.length, xDir.z*c*object.userData.length)

        }
        

            if (type=='p_load') {
                var positions = [0, 0, 0, -0.07, -0.05, 0, 0.07, -0.05, 0, 0, 0, 0, 0, -1, 0];
                var material = new THREE.LineBasicMaterial({
                    color: 0x0000ff
                });
                
                var geometry = new THREE.BufferGeometry();

                // itemSize = 3 because there are 3 values (components) per vertex

                geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
                geometry.computeBoundingSphere();
                
                line = new THREE.Line( geometry, member_material );
                line.name = 'Point Load '+String(load_id)
                line.material.linewidth = 8
                line.applyMatrix(m)
                line.position.x += positionOffset.x
                line.position.y += positionOffset.y
                line.position.z += positionOffset.z
                if (direction=='x') {
                    if (value>0) {
                        line.rotateZ( -Math.PI/2 )
                    }else{
                        line.rotateZ( Math.PI/2 )
                    }
                } else if (direction=='y') {
                    if (value>0) {
                        line.rotateX( Math.PI/2 )
                    }else{
                        line.rotateX( -Math.PI/2 )
                    }
                } else {
                    if (value>0) {
                    
                    }else{
                        line.rotateX( Math.PI )
                    }
                }
                console.log( pLoad.nn );
                line.userData = {'nn' : pLoad.nn,
                            'type': 'p_load',
                            'c': c,
                            'direction' : direction,
                            'value': value}
                
            } else {
                var curve = new THREE.EllipseCurve(
                    0, 0,             // ax, aY
                    0.2, 0.2,            // xRadius, yRadius
                    0,  Math.PI, // aStartAngle, aEndAngle
                    true             // aClockwise
                );
                var points = curve.getSpacedPoints( 30 );
                t = points.length
                end = points[t-1]
                
                points.push(new THREE.Vector2(-0.13, -0.05))
                points.push(new THREE.Vector2(-0.27, -0.05))
                points.push(new THREE.Vector2(end.x, end.y))
                var geometry = new THREE.BufferGeometry().setFromPoints( points );
                var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
                var line = new THREE.Line( geometry, material );
                line.name = 'Moment Load '+String(load_id)
                line.applyMatrix(m)
                line.position.x += positionOffset.x
                line.position.y += positionOffset.y
                line.position.z += positionOffset.z
                if (direction=='x') {
                    if (value>0) {
                        line.rotateY( -Math.PI/2 )
                    }else{
                        line.rotateY( Math.PI/2 )
                    }
                } else if (direction=='y') {
                    if (value>0) {
                    
                    }else{
                        line.rotateX( Math.PI )
                    }
                } else {
                    if (value>0) {
                        line.rotateX( Math.PI/2 )
                    }else{
                        line.rotateX( -Math.PI/2 )
                    }
                }
                line.userData = {'nn' : pLoad.nn,
                                'type': 'p_moment',
                                'c': c,
                                'direction' : direction,
                                'value': value}
            }
            
            editor.execute( new AddObjectCommand(line) )
    };
};