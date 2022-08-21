import pickle
import networkx as nx
from copy import deepcopy
import os
import sys
import json
import numpy as np
import argparse

parser = argparse.ArgumentParser(description='Convert ICDE to DiVA Formats')
parser.add_argument(
    '--icde_type',
    default="dyanmic",
    help='Use either "dynamic" or "static" results (default: dyanmic)')

args = parser.parse_args()
print(args.icde_type)
# sys.exit(0)


def get_pickle_data(file_name):
    final_path = os.path.join(base_folder, file_name)
    with open(final_path, "rb") as f:
        data = pickle.load(f)
    return data


def save_json_data(data, file_name):
    final_path = os.path.join(base_folder, file_name)
    with open(final_path, "w") as f:
        json.dump(data, f)


def save_file_data(data, file_name):
    final_path = os.path.join(base_folder, file_name)
    with open(final_path, "w") as f:
        f.write(data)


def get_network_id_map(id_, test=False):
    global network_id_counter
    if id_ not in network_id_map and test:
        return None
    elif id_ not in network_id_map and not test:
        network_id_map[id_] = network_id_counter
        network_id_counter += 1
    return network_id_map[id_]


def populate_graph_dynamic(test_ids, root_ids_dynamic):
    total = len(test_ids)
    for i in range(total):
        u_id = test_ids[i]
        u_id = int(u_id)
        source = get_network_id_map(u_id)
        g.add_node(source, ntype="seed")
        followers_timestamps = root_ids_dynamic[i]
        foll_count = followers_timestamps.shape[0]
        for j in range(foll_count):
            foll_check = set(followers_timestamps[j])
            assert len(foll_check) == 1
            foll_id = foll_check.pop()
            foll_id = int(foll_id)
            if foll_id == -11:
                continue
            target = get_network_id_map(foll_id)
            g.add_node(target, ntype="follower")
            g.add_edge(source, target)

    seed_list = []
    check_seed = 0
    for node in g.nodes(data=True):
        if node[1]['ntype'] == 'seed':
            check_seed += 1
            seed_list.append([node[0]])
    assert check_seed == total

    check_foll = 0
    for node in g.nodes(data=True):
        if node[1]['ntype'] != 'seed':
            check_foll += 1
    print(nx.info(g))
    print("Number of Seeds:  {}".format(check_seed))
    print("Number of Followers:  {}".format(check_foll))
    return seed_list


def populate_graph_static(test_ids, root_ids_dynamic):
    total = len(test_ids)
    for i in range(total):
        u_id = test_ids[i]
        u_id = int(u_id)
        source = get_network_id_map(u_id)
        g.add_node(source, ntype="seed")
        followers_timestamps = root_ids_dynamic[i]
        foll_count = followers_timestamps.shape[0]
        for j in range(foll_count):
            foll_id = followers_timestamps[j]
            foll_id = int(foll_id)
            if foll_id == -11:
                continue
            target = get_network_id_map(foll_id)
            g.add_node(target, ntype="follower")
            g.add_edge(source, target)

    seed_list = []
    check_seed = 0
    for node in g.nodes(data=True):
        if node[1]['ntype'] == 'seed':
            check_seed += 1
            seed_list.append([node[0]])
    assert check_seed == total

    check_foll = 0
    for node in g.nodes(data=True):
        if node[1]['ntype'] != 'seed':
            check_foll += 1
    print(nx.info(g))
    print("Number of Seeds:  {}".format(check_seed))
    print("Number of Followers:  {}".format(check_foll))
    return seed_list


def convert_seed_list_to_csv(seed_list):
    new_seed_list = ""
    for seed in seed_list:
        new_seed_list += str(seed[0]) + ","
    new_seed_list = new_seed_list[:-1]  # remove the extra comma at the end
    return new_seed_list


def get_init_inter_dict(iter_number):
    node_count = {c: 0 for c in range(num_classes)}
    status_delta = {c: 0 for c in range(num_classes)}
    iteration_dict = {
        'iteration': iter_number,
        'status': {},
        'node_count': node_count,
        'status_delta': status_delta
    }
    return iteration_dict


def get_zero_timestamp():
    iteration_dict = get_init_inter_dict(0)
    for node in g.nodes(data=True):
        id_ = node[0]
        ntype = node[1]['ntype']
        init_status = init_status_set[ntype]
        iteration_dict['node_count'][init_status] += 1
        iteration_dict['status'][id_] = str(init_status)
    assert sum(iteration_dict['node_count'].values()) == g.number_of_nodes()
    assert sum(iteration_dict['status_delta'].values()) == 0
    return iteration_dict


def get_pred_label(y_label):
    y_pred = float(y_label)
    return int(y_label > 0.5)


def is_status_change(foll_id, y_label, prev_iter):
    if foll_id in prev_iter['status']:
        if y_label == prev_iter['status'][foll_id]:
            return False
    return True


def get_updated_node_sum(prev_iter, curr_iter):
    curr_iter['node_count'] = deepcopy(prev_iter['node_count'])
    return curr_iter


def get_dynamic_iteration_list(root_ids_dynamic, y_label_data_dynamic):
    zero_iter = get_zero_timestamp()
    prev_iter = zero_iter
    num_samples, num_followers, num_timestamps = root_ids_dynamic.shape
    iteration_list = []
    iteration_list.append(zero_iter)
    for k in range(num_timestamps):
        curr_timestamp = k + 1
        curr_iter = get_init_inter_dict(curr_timestamp)
        curr_iter = get_updated_node_sum(prev_iter, curr_iter)
        for i in range(num_samples):
            for j in range(num_followers):
                foll_id = root_ids_dynamic[i][j][k]
                foll_id = int(foll_id)
                if foll_id == -11:
                    continue
                foll_id = get_network_id_map(foll_id, test=True)
                y_label = y_label_data_dynamic[i][j][k]
                y_label = get_pred_label(y_label)
                change_status = is_status_change(foll_id, y_label, prev_iter)
                if y_label and change_status:
                    curr_iter['status'][foll_id] = str(1)
                    curr_iter['node_count'][0] -= 1
                    curr_iter['node_count'][1] += 1
                    curr_iter['status_delta'][0] -= 1
                    curr_iter['status_delta'][1] += 1
        assert sum(curr_iter['node_count'].values()) == g.number_of_nodes()
        assert sum(curr_iter['status_delta'].values()) == 0
        iteration_list.append(curr_iter)
        prev_iter = deepcopy(curr_iter)
    assert len(iteration_list) == num_timestamps + 1
    return iteration_list


def get_static_iteration_list(root_ids_static, y_label_data_static):
    zero_iter = get_zero_timestamp()
    prev_iter = zero_iter
    num_samples, num_followers = root_ids_static.shape
    iteration_list = []
    iteration_list.append(zero_iter)
    curr_timestamp = 1
    curr_iter = get_init_inter_dict(curr_timestamp)
    curr_iter = get_updated_node_sum(prev_iter, curr_iter)
    for i in range(num_samples):
        for j in range(num_followers):
            foll_id = root_ids_static[i][j]
            foll_id = int(foll_id)
            if foll_id == -11:
                continue
            foll_id = get_network_id_map(foll_id, test=True)
            y_label = y_label_data_static[i][j]
            y_label = get_pred_label(y_label)
            change_status = is_status_change(foll_id, y_label, prev_iter)
            if y_label and change_status:
                curr_iter['status'][foll_id] = str(1)
                curr_iter['node_count'][0] -= 1
                curr_iter['node_count'][1] += 1
                curr_iter['status_delta'][0] -= 1
                curr_iter['status_delta'][1] += 1
    assert sum(curr_iter['node_count'].values()) == g.number_of_nodes()
    assert sum(curr_iter['status_delta'].values()) == 0
    iteration_list.append(curr_iter)
    assert len(iteration_list) == 2
    return iteration_list


g = nx.DiGraph()
network_id_map = {}
network_id_counter = 0
num_classes = 2
init_status_set = {"seed": 1, "follower": 0, "retweeter": 1}

base_folder = os.path.join(".", "retina_output")
test_ids = get_pickle_data("tweet_ids_test.pkl")
retina_type = args.icde_type
# retina_type = "dynamic"  # or "dynamic"
if retina_type not in {"static", "dynamic"}:
    print("We support only dynamic and static forms")
    sys.exit(1)

print("---RETINA TYPE----  ", retina_type)
base_folder = os.path.join(base_folder, retina_type)
y_pred = get_pickle_data(retina_type + "_prediction.pkl")
y_ground = get_pickle_data("test_" + retina_type + "_label_47_100.pickle")
root_ids = get_pickle_data("test_" + retina_type + "_root_id_47_100.pickle")
print("Y pred  \tY Ground  Root Followers")
print(y_pred.shape, y_ground.shape, root_ids.shape)

if retina_type == "dynamic":
    seed_list = populate_graph_dynamic(test_ids, root_ids)
    iteration_list_pred = get_dynamic_iteration_list(root_ids, y_pred)
    iteration_list_ground = get_dynamic_iteration_list(root_ids, y_ground)
elif retina_type == "static":
    seed_list = populate_graph_static(test_ids, root_ids)
    iteration_list_pred = get_static_iteration_list(root_ids, y_pred)
    iteration_list_ground = get_static_iteration_list(root_ids, y_ground)
else:
    print("We support only dynamic and static forms")
    sys.exit(1)
seed_list = convert_seed_list_to_csv(seed_list)
print("Seed List: ", seed_list)
save_file_data(seed_list, "diva_data_" + retina_type + "_seed_list.csv")
save_json_data(iteration_list_pred,
               "diva_data_" + retina_type + "_iteration_list_pred.json")
save_json_data(iteration_list_ground,
               "diva_data_" + retina_type + "_iteration_list_ground.json")
with open(
        os.path.join(base_folder,
                     "diva_data_" + retina_type + "_graph.edgelist"),
        "wb") as f:
    nx.write_edgelist(g, f)
print("---Done---")
