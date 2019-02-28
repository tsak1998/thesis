import numpy as np
import math
import pandas as pd
from sqlalchemy import create_engine
import time


def load_data(user_id):
    engine = create_engine("mysql+pymysql://root:password@localhost:3306/_0000125")
    elements = pd.read_sql('elements', engine)
    elements = elements.loc[elements['user_id'] == user_id]
    truss_elements = elements.loc[elements['elem_type'] == 'truss']
    nodes = pd.read_sql('nodes', engine)
    nodes = nodes.loc[nodes['user_id'] == user_id]
    sections = pd.read_sql('sections', engine)
    sections = sections.loc[sections['user_id'] == user_id]
    point_loads = pd.read_sql('loads_nodal', engine)
    point_loads = point_loads.loc[point_loads['user_id'] == user_id]
    dist_loads = pd.read_sql('loads_nodal', engine)
    dist_loads = dist_loads.loc[dist_loads['user_id'] == user_id]

    elements.to_csv('elements.csv')
    truss_elements.to_csv('truss_elements.csv')
    nodes.to_csv('nodes')
    sections.to_csv('sections.csv')

    return elements, nodes, sections, point_loads, dist_loads, truss_elements


# calculate DOFS
def dofs(nodes):
    t1 = time.time()
    nodes_n = len(nodes)
    #   #get 1D array of the constraints
    constraints = nodes.iloc[:, [6, 7, 8, 9, 10, 11]].get_values().flatten(order='C')
    #   #argsort returns the indexes to sort the constraints to free and sup
    dofs = constraints.argsort()
    node_dofs = pd.DataFrame(np.reshape(np.sort(dofs), (nodes_n, 6)))
    node_dofs['nn'] = nodes['nn']
    node_dofs.columns = ['dofx', 'dofy', 'dofz', 'dofrx', 'dofry', 'dofrz', 'nn']
    a = constraints[constraints.argsort()]
    temp = np.where(a == 0)
    slice = temp[0][len(temp[0]) - 1] + 1
    sup_dofs = sorted(dofs[:slice].tolist())
    free_dofs = sorted(dofs[slice:].tolist())
    arranged_dofs = free_dofs + sup_dofs
    print('DOFS: ', time.time() - t1)
    return arranged_dofs, free_dofs, sup_dofs, node_dofs


def stifness_array(dofs, elements, nodes, sections, node_dofs, truss_elements):
    t1 = time.time()
    local_stifness = []
    transf_arrays = []
    step = len(nodes) * 6
    K_ol = np.zeros((step, step))
    for i in range(len(elements)):
        elm = elements.iloc[i]
        nodei = nodes.loc[nodes.nn == elm.nodei]
        nodej = nodes.loc[nodes.nn == elm.nodej]
        sect = sections.loc[sections.section_id == elm.section_id]
        k = local_stif(elm, sect)
        local_stifness.append(k)
        rot = transformation_array(elm, nodei, nodej)
        transf_arrays.append(rot)
        t = np.transpose(rot).dot(k).dot(rot)
        i = nodei.nn.get_values()[0]
        j = nodej.nn.get_values()[0]
        if elm.elem_type == 'beam':
            dofs_i = node_dofs.loc[node_dofs.nn == i]
            dofs_j = node_dofs.loc[node_dofs.nn == j]
            dof_a, dof_b = dofs_i['dofx'].get_values()[0], \
                           dofs_i['dofrz'].get_values()[0] + 1
            dof_c, dof_d = dofs_j['dofx'].get_values()[0], \
                           dofs_j['dofrz'].get_values()[0] + 1
            K_ol[dof_a:dof_b, dof_a:dof_b] += t[:6, :6]
            K_ol[dof_a:dof_b, dof_c:dof_d] += t[:6, 6:]
            K_ol[dof_c:dof_d, dof_a:dof_b] += t[6:, :6]
            K_ol[dof_c:dof_d, dof_c:dof_d] += t[6:, 6:]
        else:
            dof_a, dof_b = node_dofs.loc[node_dofs.nn == nodei.nn]['dofx'].get_values()[0], \
                           node_dofs.loc[node_dofs.nn == nodei.nn]['dofz'].get_values()[0] + 1
            dof_c, dof_d = node_dofs.loc[node_dofs.nn == nodej.nn]['dofx'].get_values()[0], \
                           node_dofs.loc[node_dofs.nn == nodej.nn]['dofz'].get_values()[0] + 1
            K_ol[dof_a:dof_b, dof_a:dof_b] += t[:3, :3]
            K_ol[dof_a:dof_b, dof_c:dof_d] += t[:3, 3:]
            K_ol[dof_c:dof_d, dof_a:dof_b] += t[3:, :3]
            K_ol[dof_c:dof_d, dof_c:dof_d] += t[3:, 3:]


    i_uper = np.triu_indices(step, 0)

    K_ol[i_uper] = K_ol.T[i_uper]
    print('arrays: ', time.time() - t1)
    return local_stifness, transf_arrays, K_ol


def local_stif(element, sect):
    L = element.length
    elem_type = element.elem_type

    A, E = sect.A, sect.E
    A = 0.2090318
    E = 199948023.75
    if elem_type == 'beam':
        Iy, Iz, G, J = sect.Ix, sect.Iy, sect.G, sect.Iz
        Iy = 0.00364
        Iz = 0.00364
        G = 76904146.79
        J = 0.00614
        w1 = E * A / L
        w2 = 12 * E * Iz / (L * L * L)
        w3 = 6 * E * Iz / (L * L)
        w4 = 4 * E * Iz / L
        w5 = 2 * E * Iz / L
        w6 = 12 * E * Iy / (L * L * L)
        w7 = 6 * E * Iy / (L * L)
        w8 = 4 * E * Iy / L
        w9 = 2 * E * Iy / L
        w10 = G * J / L

        y = np.zeros((12, 12))
        # creates half the stifness matrix
        precision = 3
        y[0, 0] = w1
        y[6, 0] = -w1
        y[1, 1] = w2
        y[5, 1] = w3
        y[7, 1] = -w2
        y[11, 1] = w3
        y[2, 2] = w6
        y[4, 2] = -w7
        y[8, 2] = -w6
        y[10, 2] = -w7
        y[3, 3] = w10
        y[9, 3] = -w10
        y[4, 4] = w8
        y[8, 4] = w7
        y[10, 4] = w9
        y[5, 5] = w4
        y[11, 5] = w5
        y[6, 6] = w1
        y[7, 5] = w7
        y[7, 7] = w2
        y[11, 7] = -w3
        y[8, 8] = w6
        y[10, 8] = w7
        y[9, 9] = w10
        y[10, 10] = w8
        y[11, 11] = w4


        #y = np.round(y, precision)
        y = np.array([[w1, 0, 0, 0, 0, 0, -w1, 0, 0, 0, 0, 0],
                      [0, w2, 0, 0, 0, w3, 0, -w2, 0, 0, 0, w3],
                      [0, 0, w6, 0, -w7, 0, 0, 0, -w6, 0, -w7, 0],
                      [0, 0, 0, w10, 0, 0, 0, 0, 0, -w10, 0, 0],
                      [0, 0, -w7, 0, w8, 0, 0, 0, w7, 0, w9, 0],
                      [0, w3, 0, 0, 0, w4, 0, -w3, 0, 0, 0, w5],
                      [-w1, 0, 0, 0, 0, 0, w1, 0, 0, 0, 0, 0],
                      [0, -w2, 0, 0, 0, -w3, 0, w2, 0, 0, 0, -w3],
                      [0, 0, -w6, 0, w7, 0, 0, 0, w6, 0, w7, 0],
                      [0, 0, 0, -w10, 0, 0, 0, 0, 0, w10, 0, 0],
                      [0, 0, -w7, 0, w9, 0, 0, 0, w7, 0, w8, 0],
                      [0, w3, 0, 0, 0, w5, 0, -w3, 0, 0, 0, w4]])


    else:
        w1 = E * A / L
        y = np.array([[w1, 0, 0, -w1, 0, 0],
                      [0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0],
                      [-w1, 0, 0, w1, 0, 0],
                      [0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0]])

    return y


def transformation_array(element, nodei, nodej):
    L = element.length
    i, j = element.nodei, element.nodej

    x1, x2 = nodei.coord_x.get_values(), nodej.coord_x.get_values()
    y1, y2 = nodei.coord_y.get_values(), nodej.coord_y.get_values()
    z1, z2 = nodei.coord_z.get_values(), nodej.coord_z.get_values()

    xR, yR, zR = 63,432,4

    cx = (x2 - x1) / L
    cy = (y2 - y1) / L
    cz = (z2 - z1) / L
    Lambda = np.zeros((3, 3))
    if element.elem_type == 'beam':
        if (math.sqrt(cx ** 2 + cz ** 2) != 0):
            Lambda[0, 0] = cx
            Lambda[0, 1] = cy
            Lambda[0, 2] = cz
            Lambda[1, 0] = (-cx * cy) / math.sqrt(cx ** 2 + cz ** 2)
            Lambda[1, 1] = math.sqrt(cx ** 2 + cz ** 2)
            Lambda[1, 2] = (-cy * cz) / math.sqrt(cx ** 2 + cz ** 2)
            Lambda[2, 0] = (-cz) / math.sqrt(cx ** 2 + cz ** 2)
            Lambda[2, 1] = 0
            Lambda[2, 2] = (cx) / math.sqrt(cx ** 2 + cz ** 2)
        else:
            Lambda[0, 0] = 0
            Lambda[0, 1] = cy
            Lambda[0, 2] = 0
            Lambda[1, 0] = -cy
            Lambda[1, 1] = 0
            Lambda[1, 2] = 0
            Lambda[2, 0] = 0
            Lambda[2, 1] = 0
            Lambda[2, 2] = 1

        LAMDA = np.zeros((12, 12))
        zeroes = np.array([0, 0, 0])

        LAMDA[:3, :3], LAMDA[3:6, 3:6] = Lambda, Lambda
        LAMDA[6:9, 6:9], LAMDA[9:, 9:] = Lambda, Lambda
    else:
        dx, dy, dz = x2 - x1, y2 - y1, z2 - z1
        cosx, cosy, cosz = dx / L, dy / L, dz / L

        LAMDA = np.array([[cosx, cosy, cosz, 0, 0, 0],
                          [0, 0, 0, 0, 0, 0],
                          [0, 0, 0, 0, 0, 0],
                          [0, 0, 0, cosx, cosy, cosz],
                          [0, 0, 0, 0, 0, 0],
                          [0, 0, 0, 0, 0, 0]])

    return LAMDA


def nodal_forces(point_loads, elem_loads, node_dofs, tranf_arrays, arranged_dofs):
    P_nodal = np.zeros((len(arranged_dofs), 1))
    # diaforopoiisi gia truss elements
    for i in range(len(point_loads)):
        node = point_loads.iloc[i].nn
        a, b = node_dofs.loc[node_dofs.nn == node]['dofx'].get_values()[0], \
               node_dofs.loc[node_dofs.nn == node]['dofrz'].get_values()[0] + 1
        P_nodal[a:b] = [[point_loads.iloc[i].p_x], [point_loads.iloc[i].p_y], [point_loads.iloc[i].p_z],
                        [point_loads.iloc[i].m_x], [point_loads.iloc[i].m_y], [point_loads.iloc[i].m_z]]

    '''
    for r in elem_loads:
        a, b = int(dofs_element[r.en-1,1])-1, int(dofs_element[r.en-1,6])
        c ,d = int(dofs_element[r.en-1,7])-1, int(dofs_element[r.en-1,12])
        if r.p1==r.p2:
            Ar = np.array([[0], [0], [r.p1*r.c/2], [0], [-r.p1*r.l**2/12], [0],
                           [0], [0], [-r.p1*r.c/2], [0], [r.p1*r.l**2/12], [0]])

            #Ar = np.transpose(transform[r.en-1]).dot(Ar)
            P_nodal[a:b] += Ar[:6]
            P_nodal[c:d] += Ar[6:]
            '''
    return P_nodal


def solver(K, P_nodal, dofs, dofs_arranged, free):
    # rearagment of the arrays
    K_m = rearrangment(K, dofs_arranged)
    P_m = rearrangment(P_nodal, dofs_arranged)

    P_f = P_m[:free]

    Kff = K_m[:free, :free]
    Ksf = K_m[free:, :free]

    D_f = np.linalg.inv(Kff).dot(P_f)
    P_s = np.dot(Ksf, D_f)
    P_s = np.round(P_s, decimals=2)

    D = np.zeros((len(dofs), 1))
    i = 0
    for r in dofs_arranged[:free]:
        D[r] = D_f[i]
        i += 1

    return P_s, D


def rearrangment(array, dofs):
    step = len(dofs)
    anad = np.zeros((step, step))
    for i in range(len(dofs)):
        anad[i, dofs[i]] = 1
    if array.shape[1] == 1:
        a = anad.dot(array)
    else:
        a = anad.dot(array).dot(np.transpose(anad))

    return a


def nodal_mqn(K, Lamda, displacments, elements, node_dofs):
    step = len(K)
    mqn_element = np.zeros((step, 13))

    for i in range(step):
        mqn_element[i, 0] = i + 1
        elm = elements.iloc[i]
        if elm.elem_type == "beam":
            nodei = elm.nodei
            nodej = elm.nodej
            a, b = node_dofs.loc[node_dofs.nn == nodei]['dofx'].get_values()[0], \
                           node_dofs.loc[node_dofs.nn == nodei]['dofrz'].get_values()[0] + 1
            c, d = node_dofs.loc[node_dofs.nn == nodej]['dofx'].get_values()[0], \
                           node_dofs.loc[node_dofs.nn == nodej]['dofrz'].get_values()[0] + 1
            d_elem = np.zeros((12, 1))
            d_elem[:6], d_elem[6:] = displacments[a:b], displacments[c:d]
            mqn_element[i, 1:] = np.reshape(K[i].dot(np.dot(Lamda[i], d_elem)), (1, 12))
        else:
            d_elem = np.zeros((6, 1))
            a, b, c, d = int(dofs[i, 1]) - 1, int(dofs[i, 3]), int(dofs[i, 7]) - 1, int(dofs[i, 9])
            d_elem[:3], d_elem[3:] = displacments[a:b], displacments[c:d]

            mqn_element[i, 1:7] = np.reshape(K[i].dot(np.dot(Lamda[i], d_elem)), (1, 6))
            mqn_element[i, 6:9] = copy.copy(mqn_element[i, 3:6])
            mqn_element[i, 3:6] = [0, 0, 0]
    mqn_element = np.round(mqn_element, 2)
    return mqn_element


def mqn_member():
    pass

def main(user_id):
    elements, nodes, sections, point_loads, dist_loads, truss_elements = load_data(user_id)
    arranged_dofs, free_dofs, sup_dofs, node_dofs = dofs(nodes)
    local_stifness, transf_arrays, K_ol = stifness_array(dofs, elements, nodes, sections, node_dofs, truss_elements)
    P_nodal = nodal_forces(point_loads, dist_loads, node_dofs, transf_arrays, arranged_dofs)
    P_s, D = solver(K_ol, P_nodal, arranged_dofs, arranged_dofs, len(free_dofs))
    MQN = nodal_mqn(local_stifness, transf_arrays, D, elements, node_dofs)
    print(P_s)
    print(MQN)

t1 = time.time()
main('cv13116')
print('Run: ', time.time() - t1)
