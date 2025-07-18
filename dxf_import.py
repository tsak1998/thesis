def dxf_import(dxf):
    import time
    import math
    t1 = time.time()
    # DXFin: Read lines from DXF and returns two DataFrames: nodes_df & elements_df

    # Debug: Print all entity types in the DXF file
    entity_types = set()
    for entity in dxf.entities:
        entity_types.add(entity.dxftype())  # Call the method to get the string
    print(f"DXF entity types found: {entity_types}")
    
    # Read lines and other linear entities from DXF
    all_lines = []
    
    # Get LINE entities
    lines = [entity for entity in dxf.entities if entity.dxftype() == 'LINE']
    all_lines.extend(lines)
    print(f"Found {len(lines)} LINE entities")
    
    # Get LWPOLYLINE entities and convert to line segments
    lwpolylines = [entity for entity in dxf.entities if entity.dxftype() == 'LWPOLYLINE']
    print(f"Found {len(lwpolylines)} LWPOLYLINE entities")
    for poly in lwpolylines:
        # Convert polyline vertices to line segments
        vertices = list(poly.vertices_in_wcs())
        for i in range(len(vertices) - 1):
            # Create a simple line-like object
            class SimpleLine:
                def __init__(self, start, end):
                    self.start = start
                    self.end = end
            
            start_point = vertices[i]
            end_point = vertices[i + 1]
            # Add Z coordinate if missing
            if len(start_point) == 2:
                start_point = (start_point[0], start_point[1], 0.0)
            if len(end_point) == 2:
                end_point = (end_point[0], end_point[1], 0.0)
            
            line = SimpleLine(start_point, end_point)
            all_lines.append(line)
    
    # Get POLYLINE entities and convert to line segments
    polylines = [entity for entity in dxf.entities if entity.dxftype() == 'POLYLINE']
    print(f"Found {len(polylines)} POLYLINE entities")
    for poly in polylines:
        vertices = list(poly.vertices())
        for i in range(len(vertices) - 1):
            class SimpleLine:
                def __init__(self, start, end):
                    self.start = start
                    self.end = end
            
            start_vertex = vertices[i]
            end_vertex = vertices[i + 1]
            
            # Extract coordinates from vertex entities
            start_point = (start_vertex.dxf.location[0], start_vertex.dxf.location[1], start_vertex.dxf.location[2])
            end_point = (end_vertex.dxf.location[0], end_vertex.dxf.location[1], end_vertex.dxf.location[2])
            
            line = SimpleLine(start_point, end_point)
            all_lines.append(line)
    
    # Check if there are any lines in the DXF file
    if not all_lines:
        print("Warning: No linear entities found in DXF file")
        print(f"Available entity types: {entity_types}")
        # Return empty DataFrames with proper structure
        try:
            import pandas as pd
            nodes_df = pd.DataFrame(columns=['coord_x', 'coord_y', 'coord_z', 'id', 'nn', 'dof_dx', 'dof_dy', 'dof_dz', 'dof_rx', 'dof_ry', 'dof_rz'])
            elements_df = pd.DataFrame(columns=['nodei', 'nodej', 'id', 'en', 'section_id', 'elem_type', 'length'])
        except ImportError:
            # Create simple fallback structures
            class SimpleDataFrame:
                def __init__(self, data=None):
                    self.data = data or []
                def iterrows(self):
                    return iter([])
            nodes_df = SimpleDataFrame()
            elements_df = SimpleDataFrame()
        return nodes_df, elements_df
    
    print(f"Total linear entities to process: {len(all_lines)}")

    # Set the precision to prcs
    prcs = 10

    # Store coordinates (precision prcs) of start & end of each line into the LIST NODES
    NODES = []
    ELMS = []

    for line in all_lines:
        # For ezdxf Line entities, use dxf.start and dxf.end
        start_point = line.dxf.start
        end_point = line.dxf.end
        
        nodei = (round(start_point[0], prcs),
                 round(start_point[1], prcs),
                 round(start_point[2], prcs))
        nodej = (round(end_point[0], prcs),
                 round(end_point[1], prcs),
                 round(end_point[2], prcs))
        
        # Find or add nodei
        try:
            i = NODES.index(nodei) + 1
        except ValueError:
            NODES.append(nodei)
            i = len(NODES)

        # Find or add nodej
        try:
            j = NODES.index(nodej) + 1
        except ValueError:
            NODES.append(nodej)
            j = len(NODES)
        
        ELMS.append((i, j))

    # Create DataFrames without pandas dependency initially
    # Convert to simple data structures first
    nodes_data = []
    for idx, node in enumerate(NODES):
        nodes_data.append({
            'coord_x': node[0],
            'coord_y': node[1],
            'coord_z': node[2],
            'id': idx + 1,
            'nn': idx + 1,
            'dof_dx': 1,
            'dof_dy': 1,
            'dof_dz': 1,
            'dof_rx': 1,
            'dof_ry': 1,
            'dof_rz': 1
        })
    
    elements_data = []
    for idx, elem in enumerate(ELMS):
        elements_data.append({
            'nodei': elem[0],
            'nodej': elem[1],
            'id': idx + 1,
            'en': idx + 1,
            'section_id': 1,
            'elem_type': 'beam',
            'length': 1
        })

    # Now create pandas DataFrames
    try:
        import pandas as pd
        nodes_df = pd.DataFrame(nodes_data)
        elements_df = pd.DataFrame(elements_data)
    except ImportError:
        # If pandas is not available, create a simple class that mimics DataFrame behavior
        class SimpleDataFrame:
            def __init__(self, data):
                self.data = data
                self._index = list(range(len(data))) if data else []
            
            def iterrows(self):
                for i, row in enumerate(self.data):
                    yield i, SimpleRow(row)
            
            @property
            def index(self):
                return self._index
        
        class SimpleRow:
            def __init__(self, data):
                for key, value in data.items():
                    setattr(self, key, value)
                self._data = data
            
            def __getitem__(self, key):
                return self._data[key]
        
        nodes_df = SimpleDataFrame(nodes_data)
        elements_df = SimpleDataFrame(elements_data)

    print('DXF processing time:', time.time() - t1)
    print(f'Processed {len(NODES)} nodes and {len(ELMS)} elements')
    return nodes_df, elements_df


'''
import pandas as pd

# DXFin: Read lines from DXF and returns two LISTs: NDS[X,Y,Z] & ELMS[NDSi,NDSj]

# Read lines and store them into LIST all_lines
all_lines = [entity for entity in dxf.entities if entity.dxftype == 'LINE']

# Set the precision to prcs
prcs=4

# Store coordinates (precision prcs) of start & end of each line into the LIST NODES
NODES=[]
for line in all_lines:
    NODES.append([round(line.start[0], prcs),round(line.start[1], prcs),round(line.start[2], prcs)])
    NODES.append([round(line.end[0], prcs),round(line.end[1], prcs),round(line.end[2], prcs)])

# Store unique coordinates of LIST NODES into LIST NDS
NDS=[]
[NDS.append(x) for x in NODES if x not in NDS]

# Store index from NDS of start & end node for each line into the LIST ELMS
ELMS=[]
for line in all_lines:
    ndi=[round(line.start[0], prcs),round(line.start[1], prcs),round(line.start[2], prcs)]
    ndj=[round(line.end[0], prcs),round(line.end[1], prcs),round(line.end[2], prcs)]
    ELMS.append([NDS.index(ndi),NDS.index(ndj)])
'''
