function drawFromDB(editor, nodes, elements) {

    const labelSize = 0.0125;
    var i;
    var showLabels = 1;

    var model = new THREE.Object3D();
    var labels = new THREE.Object3D();
    var nlabels = new THREE.Object3D();
    var blabels = new THREE.Object3D();
    var clabels = new THREE.Object3D();

    var geometry = new THREE.SphereBufferGeometry( 0.035, 8, 8, 0, Math.PI * 2, 0, Math.PI );
    var sphereMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    model.name = 'New Structure from DXF';
    console.log(nodes)
    console.log(elements)
    for (i = 0; i < nodes.data.length; i++) {
        //console.log(nodes.data[i].nn, nodes.data[i].coord_x,nodes.data[i].coord_y,nodes.data[i].coord_z);
        
        var mesh = new THREE.Mesh( geometry, sphereMat);
        mesh.name = 'Node ' + nodes.data[i].nn;
        
        mesh.position.x = parseFloat(nodes.data[i].coord_x);
        mesh.position.y = parseFloat(nodes.data[i].coord_y);
        mesh.position.z = parseFloat(nodes.data[i].coord_z); 
        
        model.add(mesh);
        //editor.execute( new AddObjectCommand( mesh ) );
        
        if (showLabels == 1) {
             let sprite = new SpriteText(nodes.data[i].nn.toString(), labelSize);
             sprite.color = 'red';
             sprite.position.set( nodes.data[i].coord_x + 0.1, nodes.data[i].coord_y + 0.2, nodes.data[i].coord_z + 0.1);
             nlabels.add(sprite);
        }            
        //console.log(mesh)  
        if (parseInt(i / 100) == i / 100) {
            console.log('importing node', i, 'of', nodes.data.length);
        }
    }

    var bColor = new THREE.Color(0x0000ff);
    var cColor = new THREE.Color(0x008080);
    for (i = 0; i < elements.data.length; i++) {
        
        var geometry = new THREE.Geometry();     
        geometry.vertices.push(new THREE.Vector3( parseFloat(nodes.data[parseInt(elements.data[i].nodei)-1].coord_x), parseFloat(nodes.data[parseInt(elements.data[i].nodei)-1].coord_y),  parseFloat(nodes.data[parseInt(elements.data[i].nodei)-1].coord_z)));
        geometry.vertices.push(new THREE.Vector3( parseFloat(nodes.data[parseInt(elements.data[i].nodej)-1].coord_x), parseFloat(nodes.data[parseInt(elements.data[i].nodej)-1].coord_y),  parseFloat(nodes.data[parseInt(elements.data[i].nodej)-1].coord_z)));
        var mesh = LineUtils.createLineMesh(geometry, {
            elementType: elements.data[i].elem_type,
            lineWidth: 8.0
        });
        mesh.name = 'Element ' + elements.data[i].en;
        //mesh.something = 'abc';

        if (showLabels == 1) {
            var xm = (geometry.vertices[0].x + geometry.vertices[1].x) / 2;
            var ym = (geometry.vertices[0].y + geometry.vertices[1].y) / 2;
            var zm = (geometry.vertices[0].z + geometry.vertices[1].z) / 2;
            if (elements.data[i].elem_type == 'column') {
                xm += 0.2;
                zm -= 0.2;
            }  

            let sprite = new SpriteText(elements.data[i].en.toString(), labelSize);
            sprite.color = (elements.data[i].elem_type === 'beam' ?  '#0000ff' : '#008080');
            sprite.position.set(xm, ym + 0.2, zm);           
            //mesh.add( elemLabel );
            if (elements.data[i].elem_type == 'beam') {
                blabels.add(sprite);
            } else {
                clabels.add(sprite);
            }
            //editor.sceneHelpers.add( elemLabel );
        }
        model.add(mesh);
        //editor.execute( new AddObjectCommand( mesh ) );
       if (parseInt(i / 100) == i / 100) {
           console.log('importing element', i, 'of', elements.data.length);
       }
    }
    if (showLabels == 1) {
        nlabels.name = 'nlabels';
        blabels.name = 'blabels';
        clabels.name = 'clabels';
        nlabels.visible = false;
        blabels.visible = false;
        clabels.visible = false;
        labels.add (nlabels);
        labels.add (blabels);
        labels.add (clabels);
        labels.name = 'nelabels';
        editor.sceneHelpers.add( labels );
    }
    editor.execute( new AddObjectCommand( model ) );
    editor.focus (model);
}




