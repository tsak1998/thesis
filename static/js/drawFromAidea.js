function drawFromAidea(editor, nodes, elements) {
    const labelSize = 0.0125;
    var i;
    var showLabels = 1;

    var model = new THREE.Object3D();
    var labels = new THREE.Object3D();
    var nlabels = new THREE.Object3D();
    var blabels = new THREE.Object3D();
    var clabels = new THREE.Object3D();

    var geometry = new THREE.SphereBufferGeometry(0.035, 8, 8, 0, Math.PI * 2, 0, Math.PI);
    var sphereMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    model.name = 'Two-Storey Building from AIDEA';
    
    console.log('AIDEA Nodes:', nodes);
    console.log('AIDEA Elements:', elements);
    
    // Draw nodes
    for (i = 0; i < nodes.data.length; i++) {
        var mesh = new THREE.Mesh(geometry, sphereMat);
        mesh.name = 'Node ' + nodes.data[i].nn;
        
        mesh.position.x = parseFloat(nodes.data[i].coord_x);
        mesh.position.y = parseFloat(nodes.data[i].coord_y);
        mesh.position.z = parseFloat(nodes.data[i].coord_z);
        
        // Add node metadata
        mesh.userData = {
            type: 'node',
            nn: nodes.data[i].nn,
            label_position: {
                x: parseFloat(nodes.data[i].coord_x),
                y: parseFloat(nodes.data[i].coord_y),
                z: parseFloat(nodes.data[i].coord_z)
            }
        };
        
        model.add(mesh);
        
        if (showLabels == 1) {
            let sprite = new SpriteText(nodes.data[i].nn.toString(), labelSize);
            sprite.color = 'red';
            sprite.position.set(
                nodes.data[i].coord_x + 0.1, 
                nodes.data[i].coord_y + 0.2, 
                nodes.data[i].coord_z + 0.1
            );
            nlabels.add(sprite);
        }
        
        if (parseInt(i / 100) == i / 100) {
            console.log('importing node', i, 'of', nodes.data.length);
        }
    }

    // Draw elements (members)
    var bColor = new THREE.Color(0x0000ff); // Blue for beams
    var cColor = new THREE.Color(0x008080); // Teal for columns
    
    for (i = 0; i < elements.data.length; i++) {
        var element = elements.data[i];
        
        // Find start and end nodes
        var nodeI = nodes.data.find(n => n.nn === element.nodei);
        var nodeJ = nodes.data.find(n => n.nn === element.nodej);
        
        if (!nodeI || !nodeJ) {
            console.warn('Could not find nodes for element', element.en);
            continue;
        }
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(
            parseFloat(nodeI.coord_x), 
            parseFloat(nodeI.coord_y), 
            parseFloat(nodeI.coord_z)
        ));
        geometry.vertices.push(new THREE.Vector3(
            parseFloat(nodeJ.coord_x), 
            parseFloat(nodeJ.coord_y), 
            parseFloat(nodeJ.coord_z)
        ));
        
        var mesh = LineUtils.createLineMesh(geometry, {
            elementType: element.elem_type,
            lineWidth: 12.0
        });
        mesh.name = 'Element ' + element.en;
        
        // Calculate element center for label positioning
        var centerX = (geometry.vertices[0].x + geometry.vertices[1].x) / 2;
        var centerY = (geometry.vertices[0].y + geometry.vertices[1].y) / 2;
        var centerZ = (geometry.vertices[0].z + geometry.vertices[1].z) / 2;
        
        // Calculate local axes for the element
        var elementVector = new THREE.Vector3().subVectors(geometry.vertices[1], geometry.vertices[0]).normalize();
        var upVector = new THREE.Vector3(0, 0, 1);
        var localY = new THREE.Vector3().crossVectors(elementVector, upVector).normalize();
        var localZ = new THREE.Vector3().crossVectors(elementVector, localY).normalize();
        
        // Add element metadata
        mesh.userData = {
            type: 'element',
            en: element.en,
            elem_type: element.elem_type,
            nodei: element.nodei,
            nodej: element.nodej,
            section_id: element.section_id,
            label_position: {
                x: centerX,
                y: centerY,
                z: centerZ
            },
            xLocal: elementVector,
            yLocal: localY,
            zLocal: localZ
        };

        if (showLabels == 1) {
            var xm = centerX;
            var ym = centerY;
            var zm = centerZ;
            
            if (element.elem_type == 'column') {
                xm += 0.2;
                zm -= 0.2;
            }

            let sprite = new SpriteText(element.en.toString(), labelSize);
            sprite.color = (element.elem_type === 'beam' ? '#0000ff' : '#008080');
            sprite.position.set(xm, ym + 0.2, zm);
            
            if (element.elem_type == 'beam') {
                blabels.add(sprite);
            } else {
                clabels.add(sprite);
            }
        }
        
        model.add(mesh);
        
        if (parseInt(i / 100) == i / 100) {
            console.log('importing element', i, 'of', elements.data.length);
        }
    }
    
    // Add labels to scene
    if (showLabels == 1) {
        nlabels.name = 'nlabels';
        blabels.name = 'blabels';
        clabels.name = 'clabels';
        nlabels.visible = false;
        blabels.visible = false;
        clabels.visible = false;
        labels.add(nlabels);
        labels.add(blabels);
        labels.add(clabels);
        labels.name = 'nelabels';
        editor.sceneHelpers.add(labels);
    }
    
    editor.execute(new AddObjectCommand(model));
    editor.focus(model);
    
    console.log('Two-storey building loaded successfully!');
    console.log('- Nodes:', nodes.data.length);
    console.log('- Elements:', elements.data.length);
    console.log('- Columns:', elements.data.filter(e => e.elem_type === 'column').length);
    console.log('- Beams:', elements.data.filter(e => e.elem_type === 'beam').length);
}

// Function to load and display the two-storey building
function loadTwoStoreyBuilding(editor) {
    console.log('Loading two-storey building from AIDEA models...');
    
    $.ajax({
        type: "POST",
        url: "/load",
        data: JSON.stringify({}),
        contentType: "application/json; charset=utf-8",
        dataType: 'text',
        success: function(response) {
            console.log('Received data from server:', response);
            
            try {
                // Parse the response (format: nodes|elements|point_loads|dist_loads|materials|sections|mqn)
                var parts = response.split('|');
                if (parts.length >= 6) {
                    var nodes = JSON.parse(parts[0]);
                    var elements = JSON.parse(parts[1]);
                    var point_loads = JSON.parse(parts[2]);
                    var dist_loads = JSON.parse(parts[3]);
                    var materials = JSON.parse(parts[4]);
                    var sections = JSON.parse(parts[5]);
                    
                    console.log('Parsed data successfully');
                    console.log('Nodes:', nodes.data.length);
                    console.log('Elements:', elements.data.length);
                    
                    // Clear existing model
                    editor.clear();
                    
                    // Draw the structure
                    drawFromAidea(editor, nodes, elements);
                    
                    // Store data globally for other functions
                    window.currentNodes = nodes;
                    window.currentElements = elements;
                    window.currentPointLoads = point_loads;
                    window.currentDistLoads = dist_loads;
                    window.currentMaterials = materials;
                    window.currentSections = sections;
                    
                } else {
                    console.error('Invalid response format from server');
                }
            } catch (e) {
                console.error('Error parsing server response:', e);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading model:', xhr, status, error);
        }
    });
}

// Function to run structural analysis
function runStructuralAnalysis(editor) {
    console.log('Running structural analysis...');
    
    $.ajax({
        type: "POST",
        url: "/yellow",
        data: JSON.stringify({}),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function(response) {
            console.log('Analysis completed successfully');
            console.log('Results:', response);
            
            if (response.error) {
                console.error('Analysis error:', response.error);
                alert('Analysis failed: ' + response.error);
                return;
            }
            
            // Store results globally
            window.analysisResults = response;
            
            // Display results summary
            displayAnalysisResults(response);
            
            // Enable results visualization
            enableResultsVisualization(editor, response);
            
        },
        error: function(xhr, status, error) {
            console.error('Error running analysis:', xhr, status, error);
            alert('Analysis failed: ' + error);
        }
    });
}

// Function to display analysis results
function displayAnalysisResults(results) {
    console.log('Displaying analysis results...');
    
    var summary = 'Analysis Results Summary:\n\n';
    
    // Count results
    var nodeCount = Object.keys(results.displ || {}).length;
    var memberCount = Object.keys(results.mqn || {}).length;
    
    summary += `Nodes analyzed: ${nodeCount}\n`;
    summary += `Members analyzed: ${memberCount}\n\n`;
    
    // Find maximum displacements
    var maxDisp = 0;
    var maxDispNode = '';
    
    for (var nodeId in results.displ) {
        var disp = results.displ[nodeId];
        if (disp.ux && disp.ux.length > 0) {
            var totalDisp = Math.sqrt(disp.ux[0]**2 + disp.uy[0]**2 + disp.uz[0]**2);
            if (totalDisp > maxDisp) {
                maxDisp = totalDisp;
                maxDispNode = nodeId;
            }
        }
    }
    
    summary += `Maximum displacement: ${maxDisp.toFixed(6)} m at node ${maxDispNode}\n`;
    
    // Show reactions summary
    if (results.reactions) {
        try {
            var reactionsData = JSON.parse(results.reactions);
            if (reactionsData.data && reactionsData.data.length > 0) {
                summary += `\nSupport reactions calculated for ${reactionsData.data.length} supports\n`;
            }
        } catch (e) {
            console.warn('Could not parse reactions data');
        }
    }
    
    console.log(summary);
    alert(summary);
}

// Function to enable results visualization
function enableResultsVisualization(editor, results) {
    console.log('Enabling results visualization...');
    
    // Add buttons or menu items for result visualization
    // This would integrate with the existing UI framework
    
    // For now, just log that results are available
    console.log('Results visualization enabled');
    console.log('Available result types:');
    console.log('- Displacements:', Object.keys(results.displ || {}).length, 'nodes');
    console.log('- Member forces:', Object.keys(results.mqn || {}).length, 'members');
    console.log('- Reactions available:', !!results.reactions);
    console.log('- Deformed shape available:', !!results.deformed);
}

// Export functions for global use
window.loadTwoStoreyBuilding = loadTwoStoreyBuilding;
window.runStructuralAnalysis = runStructuralAnalysis;
window.drawFromAidea = drawFromAidea;