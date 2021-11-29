# Imports
from flask import Flask, request, render_template, jsonify, send_file, Response, session, redirect, url_for
from flask import g
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_session import Session
from flask_cors import CORS

import sqlite3
import networkx as nx
import os
import zipfile
import pathlib

import io
import json

from tqdm import tqdm
import importlib
from datetime import datetime
import csv
from random import randint

from app import google_auth
from app.algorithms import IndependentCascades, SIR, SIS, SI, CustomAlgo #, SEIR, SEIS, SWIR, Threshold, GeneralThreshold, KerteszThreshold, Profile

DATABASE = '/session/database.db'

# Initializations
REDIRECT_URI = '/'
SECRET_KEY = 'diva'
SESSION_TYPE = 'filesystem'

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = 'diva'
CORS(app)
app.config.from_object(Config)
Session(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
app.register_blueprint(google_auth.app)

from app import models

# UTILITY FUNCTIONS DB
db.create_all()


# GLOBALS
# G = None
# seedNodes = []
# relabel_dict = {}
# filename = ""
# positioned_data = None
# positioned = "false"
# reverse_relabel = []


# Routes
@app.route('/')
def index():
    if google_auth.is_logged_in():
        user_info = google_auth.get_user_info()
        session[user_info['id']] = {}
        session[user_info['id']]['G'] = None
        session[user_info['id']]['seedNodes'] = []
        session[user_info['id']]['relabel_dict'] = {}
        session[user_info['id']]['filename'] = ""
        session[user_info['id']]['positioned_data'] = None
        session[user_info['id']]['positioned'] = 'false'
        session[user_info['id']]['reverse_relabel'] = []
        return render_template('home.html', name = user_info['name'], pic_link = user_info['picture'])
    return redirect(url_for('google_auth.login'))

@app.route('/temp')
def temp():
    user_info = google_auth.get_user_info()
    return render_template('graph.html', name = user_info['name'], pic_link = user_info['picture'])


@app.route('/user_eval')
def user_eval():
    user_info = google_auth.get_user_info()
    session[user_info['id']]['G'] = None
    session[user_info['id']]['filename'] = ""
    session[user_info['id']]['positioned_data'] = None
    session[user_info['id']]['positioned'] = 'false'
    session[user_info['id']]['relabel_dict'] = {}
    session[user_info['id']]['reverse_relabel'] = []
    # global G
    # global filename
    # global positioned_data
    # global positioned
    # global relabel_dict
    # global reverse_relabel
    # G = None
    # filename = ""
    # positioned_data = None
    # positioned = 'false'
    # relabel_dict = {}
    # reverse_relabel = []
    with zipfile.ZipFile('./app/static/network.diva','r') as zipped:
        with zipped.open("network_obj.graphml") as network_obj:
            session[user_info['id']]['G'] = nx.read_graphml(network_obj)
        remove_prev_data()
        for i in zipped.namelist():
            if i.startswith('data'):
                session[user_info['id']]['filename'] = i
                zipped.extract(i,'./app/static/js/')
        with zipped.open("network_layout.json") as network_layout:
            session[user_info['id']]['positioned_data'] = json.load(network_layout)
            session[user_info['id']]['positioned_data'] = json.dumps(session[user_info['id']]['positioned_data'])
            session[user_info['id']]['positioned'] = 'true'
        with zipped.open("relabel_dict.json") as relabelling:
            session[user_info['id']]['relabel_dict'] = json.load(relabelling)
        with zipped.open("reverse_relabel.jsonl") as reversing:
            session[user_info['id']]['reverse_relabel'] = json.load(reversing)
    return render_template('index.html', filename = session[user_info['id']]['filename'], positioned_data = session[user_info['id']]['positioned_data'], positioned = session[user_info['id']]['positioned'], name = user_info['name'], pic_link = user_info['picture'])

@app.route('/graph',methods=['POST'])
def loadGraph():
    user_info = google_auth.get_user_info()
    session[user_info['id']]['G'] = None
    session[user_info['id']]['filename'] = ""
    session[user_info['id']]['positioned_data'] = None
    session[user_info['id']]['positioned'] = 'false'
    session[user_info['id']]['relabel_dict'] = {}
    session[user_info['id']]['reverse_relabel'] = []
    # global G
    # global filename
    # global positioned_data
    # global positioned
    # global relabel_dict
    # global reverse_relabel
    # G = None
    # filename = ""
    # positioned_data = None
    # positioned = 'false'
    # relabel_dict = {}
    # reverse_relabel = []
    data = request.form
    graphFormat = data.get('format')
    isFile = data.get('isFile')
    if isFile == "true":
        uploadFile = request.files['graph']
        session[user_info['id']]['G'] = nx.DiGraph()
        if graphFormat == 'edgelist':
            session[user_info['id']]['G'] = nx.read_edgelist(uploadFile, create_using = nx.DiGraph)
            
        if graphFormat == 'adjlist':
            session[user_info['id']]['G'] = nx.read_adjlist(uploadFile, create_using = nx.DiGraph)
        if graphFormat == 'GEFX':
            session[user_info['id']]['G'] = nx.read_gexf(uploadFile)
        if graphFormat == 'GraphML':
            session[user_info['id']]['G'] = nx.read_graphml(uploadFile)
        if graphFormat == 'JSON':
            session[user_info['id']]['G'] = nx.read_adjlist(uploadFile, create_using = nx.DiGraph)
        if graphFormat == 'saved_network':
            with zipfile.ZipFile(uploadFile, 'r') as zip_uploaded:
                with zip_uploaded.open("network_obj.graphml") as network_obj:
                    session[user_info['id']]['G'] = nx.read_graphml(network_obj)
                remove_prev_data()
                for i in zip_uploaded.namelist():
                    if i.startswith('data'):
                        session[user_info['id']]['filename'] = i
                        zip_uploaded.extract(i,'./app/static/js/')
                with zip_uploaded.open("network_layout.json") as network_layout:
                    session[user_info['id']]['positioned_data'] = json.load(network_layout)
                    session[user_info['id']]['positioned_data'] = json.dumps(session[user_info['id']]['positioned_data'])
                    session[user_info['id']]['positioned'] = 'true'
                with zip_uploaded.open("relabel_dict.json") as relabelling:
                    session[user_info['id']]['relabel_dict'] = json.load(relabelling)
                with zip_uploaded.open("reverse_relabel.jsonl") as reversing:
                    session[user_info['id']]['reverse_relabel'] = json.load(reversing)
            return render_template('index.html', filename = session[user_info['id']]['filename'], positioned_data = session[user_info['id']]['positioned_data'], positioned = session[user_info['id']]['positioned'], name = user_info['name'], pic_link = user_info['picture'])
        
    else:
        # Design Custom Graph
        nodes = data.get('nodes')
        edges = data.get('edges')
        seed = data.get('seed', 100)
        session[user_info['id']]['G'] = nx.gnm_random_graph(int(nodes), int(edges), int(seed), False)

    models.Node.query.delete()
    models.Edge.query.delete()

    db.session.commit()
    # max_degree = 0
    # for i in G.nodes:
    #     max_degree = max(max_degree, G.degree(i))
    count = 0
    # print(session[user_info['id']]['G'].nodes)
    for i in tqdm(session[user_info['id']]['G'].nodes):
        # node = models.Node()
        # node.label = i
        # nodeinfo = {}
        # nodeinfo['degree'] = G.degree(i)
        # nodeinfo['size'] =  G.degree(i) / (max_degree) * 10
        # nodeinfo['max_degree'] = max_degree
        # node.info = nodeinfo
        # db.session.add(node)
        # db.session.commit()
        session[user_info['id']]['relabel_dict'][i] = str(count)
        session[user_info['id']]['reverse_relabel'].append(i)
        count+=1
    # print(session[user_info['id']]['reverse_relabel'])
    # print(session[user_info['id']]['relabel_dict'])
    session[user_info['id']]['G'] = nx.relabel_nodes(session[user_info['id']]['G'], session[user_info['id']]['relabel_dict'])
    # print(session[user_info['id']]['G'].nodes)
    session[user_info['id']]['filename'] = "data_"+str(int(datetime.now().timestamp()))+".csv"
    write_csv(session[user_info['id']]['filename'])
    # print('written csv')
    # print(session[user_info['id']]['positioned'])
    return render_template('index.html', filename = session[user_info['id']]['filename'], positioned = session[user_info['id']]['positioned'], name = user_info['name'], pic_link = user_info['picture'])

@app.route('/runmodel', methods = ['GET','POST'])
def runmodel():
    user_info = google_auth.get_user_info()
    # global G
    # global seedNodes
    # temp_G = nx.DiGraph()
    # nodes = models.Node.query.all()
    # for i in nodes:
    #     temp_G.add_node(i.id)
    # edges = models.Edge.query.all()
    # for i in edges:
    #     temp_G.add_edge(i.u,i.v)
    # G = temp_G
    #
    data = request.form
    #
    model = data.get('model')
    isSeedNodes = data.get('is_seed_nodes')
    useUploaded = data.get('use_uploaded')
    maxIterations = int(data.get('iterations'))
    modelToRun = []
    fractionInfected = None
    print(isSeedNodes)
    if isSeedNodes == 'false':
        fractionInfected = data.get('fraction_infected')
        print(fractionInfected)
        
    # Other params
    try:
        if model == 'PTH': #
            thresholdFile = request.files['threshold']
            profileFile = request.files['profile']
            blocked = data.get('blocked')
            adopterRate = data.get('adopter_rate')
            modelToRun = ProfileThresholdHate(thresholdFile, profileFile, blockedFile, adopterRate, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected)
        elif model == 'IC': #
            # edgeThresholdFile = request.files['edgeThreshold']
            thresholdInitial = data.get('edge_threshold')
            modelToRun = IndependentCascades.Model(session[user_info['id']]['G'], None, thresholdInitial, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
        elif model == 'SIR': #
            beta = float(data.get('beta'))
            gamma = float(data.get('gamma'))
            modelToRun = SIR.Model(session[user_info['id']]['G'], beta, gamma, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
        elif model == 'SIS': #
            beta = float(data.get('beta'))
            lambda_param = float(data.get('lambda'))
            modelToRun = SIS.Model(session[user_info['id']]['G'], beta, lambda_param, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
        elif model == 'SI': #
            beta = float(data.get('beta'))
            modelToRun = SI.Model(session[user_info['id']]['G'], beta, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
        elif model == 'SEIR': #
            beta = data.get('beta')
            gamma = data.get('gamma')
            alpha = data.get('alpha')
            modelToRun = SEIR(beta, gamma, alpha, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'SEIS': #
            beta = data.get('beta')
            lambda_param = data.get('lambda')
            alpha = data.get('alpha')
            modelToRun = SEIS(beta, lambda_param, alpha, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'SWIR': #
            kappa = data.get('kappa')
            mu = data.get('mu')
            nu = data.get('nu')
            modelToRun = SWIR(kappa, mu, nu, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'threshold': #
            thresholdFile = request.files['threshold']
            modelToRun = Threshold(thresholdFile, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'gen_threshold': #
            thresholdFile = request.files['threshold']
            tau = data.get('tau')
            mu = data.get('mu')
            modelToRun = GeneralThreshold(thresholdFile,tau, mu, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'kert_threshold': #
            thresholdFile = request.files['threshold']
            adopter_rate = data.get('adopter_rate')
            percentage_blocked = data.get('percentage_blocked')
            modelToRun = KerteszThreshold(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'profile': #
            profileFile = request.files['profile']
            adopter_rate = data.get('adopter_rate')
            percentage_blocked = data.get('percentage_blocked')
            modelToRun = Profile(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
        elif model == 'custom_algo':
            if useUploaded == 'false':
                custom_algo_file = request.files['custom_algo_file']
                custom_algo_file.save('./app/algorithms/CustomAlgo.py')
            importlib.reload(CustomAlgo)
            modelToRun = CustomAlgo.Model(session[user_info['id']]['G'], seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
        iterations = modelToRun.run_model()
        print(iterations)
    except:
        return jsonify({'success': 1, 'msg': "Some error occured, please check your settings."})
    # print(iterations)
    return jsonify({'success': 0, 'msg': model, 'iterations': outputIterations(iterations)})

@app.route('/compareModel', methods = ['GET','POST'])
def comparemodel():
    user_info = google_auth.get_user_info()
    # global G
    # global seedNodes
    #
    formData = request.form
    #
    isCustom = formData.get('is_custom')
    model1 = formData.get('model_1')
    model2 = formData.get('model_2')
    
    isSeedNodes = formData.get('is_seed_nodes')
    maxIterations = int(formData.get('iterations'))
    modelToRun = []
    fractionInfected = None
    if isSeedNodes == 'false':
        fractionInfected = float(formData.get('fraction_infected'))
    
    data = json.loads(formData.get('params1'))
    model = formData.get('model_1')
    # print(data)
    # print(request.files)
    # Other params
    if model == 'PTH': #
        thresholdFile = request.files['threshold']
        profileFile = request.files['profile']
        blocked = data.get('blocked')
        adopterRate = data.get('adopter_rate')
        modelToRun = ProfileThresholdHate(thresholdFile, profileFile, blockedFile, adopterRate, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected)
    elif model == 'IC': #
        # edgeThresholdFile = request.files['edgeThreshold']
        thresholdInitial = data.get('edge_threshold')
        modelToRun = IndependentCascades.Model(session[user_info['id']]['G'], None, thresholdInitial, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SIR': #
        beta = float(data.get('beta'))
        gamma = float(data.get('gamma'))
        modelToRun = SIR.Model(session[user_info['id']]['G'], beta, gamma, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SIS': #
        beta = float(data.get('beta'))
        lambda_param = float(data.get('lambda'))
        modelToRun = SIS.Model(session[user_info['id']]['G'], beta, lambda_param, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SI': #
        beta = float(data.get('beta'))
        modelToRun = SI.Model(session[user_info['id']]['G'], beta, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SEIR': #
        beta = data.get('beta')
        gamma = data.get('gamma')
        alpha = data.get('alpha')
        modelToRun = SEIR(beta, gamma, alpha, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'SEIS': #
        beta = data.get('beta')
        lambda_param = data.get('lambda')
        alpha = data.get('alpha')
        modelToRun = SEIS(beta, lambda_param, alpha, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'SWIR': #
        kappa = data.get('kappa')
        mu = data.get('mu')
        nu = data.get('nu')
        modelToRun = SWIR(kappa, mu, nu, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'threshold': #
        thresholdFile = request.files['threshold']
        modelToRun = Threshold(thresholdFile, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'gen_threshold': #
        thresholdFile = request.files['threshold']
        tau = data.get('tau')
        mu = data.get('mu')
        modelToRun = GeneralThreshold(thresholdFile,tau, mu, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'kert_threshold': #
        thresholdFile = request.files['threshold']
        adopter_rate = data.get('adopter_rate')
        percentage_blocked = data.get('percentage_blocked')
        modelToRun = KerteszThreshold(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'profile': #
        profileFile = request.files['profile']
        adopter_rate = data.get('adopter_rate')
        percentage_blocked = data.get('percentage_blocked')
        modelToRun = Profile(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'custom_algo':
        custom_algo_file = request.files['custom_algo_file']
        custom_algo_file.save('./app/algorithms/CustomAlgo.py')
        importlib.reload(CustomAlgo)
        modelToRun = CustomAlgo.Model(G, seeds = seedNodes, fraction_infected = fractionInfected, iterations = maxIterations)
        # modelToRun = SI.Model(session[user_info['id']]['G'], seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    if model != "ground":
        iterations1 = modelToRun.run_model()
    else:
        iterations1 = json.load(request.files['ground_truth_file'])

    model = formData.get('model_2')
    data = json.loads(formData.get('params2'))
    # Other params
    if model == 'PTH': #
        thresholdFile = request.files['threshold']
        profileFile = request.files['profile']
        blocked = data.get('blocked')
        adopterRate = data.get('adopter_rate')
        modelToRun = ProfileThresholdHate(thresholdFile, profileFile, blockedFile, adopterRate, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected)
    elif model == 'IC': #
        # edgeThresholdFile = request.files['edgeThreshold']
        thresholdInitial = data.get('edge_threshold')
        modelToRun = IndependentCascades.Model(session[user_info['id']]['G'], None, thresholdInitial, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SIR': #
        beta = float(data.get('beta'))
        gamma = float(data.get('gamma'))
        modelToRun = SIR.Model(session[user_info['id']]['G'], beta, gamma, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SIS': #
        beta = float(data.get('beta'))
        lambda_param = float(data.get('lambda'))
        modelToRun = SIS.Model(session[user_info['id']]['G'], beta, lambda_param, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SI': #
        beta = float(data.get('beta'))
        modelToRun = SI.Model(session[user_info['id']]['G'], beta, seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    elif model == 'SEIR': #
        beta = data.get('beta')
        gamma = data.get('gamma')
        alpha = data.get('alpha')
        modelToRun = SEIR(beta, gamma, alpha, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'SEIS': #
        beta = data.get('beta')
        lambda_param = data.get('lambda')
        alpha = data.get('alpha')
        modelToRun = SEIS(beta, lambda_param, alpha, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'SWIR': #
        kappa = data.get('kappa')
        mu = data.get('mu')
        nu = data.get('nu')
        modelToRun = SWIR(kappa, mu, nu, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'threshold': #
        thresholdFile = request.files['threshold']
        modelToRun = Threshold(thresholdFile, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'gen_threshold': #
        thresholdFile = request.files['threshold']
        tau = data.get('tau')
        mu = data.get('mu')
        modelToRun = GeneralThreshold(thresholdFile,tau, mu, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'kert_threshold': #
        thresholdFile = request.files['threshold']
        adopter_rate = data.get('adopter_rate')
        percentage_blocked = data.get('percentage_blocked')
        modelToRun = KerteszThreshold(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'profile': #
        profileFile = request.files['profile']
        adopter_rate = data.get('adopter_rate')
        percentage_blocked = data.get('percentage_blocked')
        modelToRun = Profile(thresholdFile, adopter_rate, percentage_blocked, seeds = seedFile, fraction_infected = fractionInfected)
    elif model == 'custom_algo':
        custom_algo_file = request.files['custom_algo_file']
        custom_algo_file.save('./app/algorithms/CustomAlgo.py')
        importlib.reload(CustomAlgo)
        modelToRun = CustomAlgo.Model(session[user_info['id']]['G'], seeds = session[user_info['id']]['seedNodes'], fraction_infected = fractionInfected, iterations = maxIterations)
    if model != "ground":
        iterations2 = modelToRun.run_model()
    else:
        iterations2 = json.load(request.files['ground_truth_file'])
    return jsonify({'success': 0, 'msg': 'success', 'iterations1': outputIterations(iterations1), 'iterations2': outputIterations(iterations2), 'model1': formData.get('model_1'), 'model2': formData.get('model_2')})


@app.route('/api/getGraph')
def getGraph():
    user_info = google_auth.get_user_info()
    # global G
    if session[user_info['id']]['G'] == None:
        return jsonify({'success': 1, 'msg': "Network doesn't exist"})
    else:
        cy = nx.readwrite.json_graph.cytoscape_data(session[user_info['id']]['G'])
        return jsonify({'success': 0, 'msg': 'Sending Network', "graph": cy})

@app.route('/custom_algorithm')
def viewCustomAlgorithm():
    user_info = google_auth.get_user_info()
    with open('./app/algorithms/CustomAlgo.py','r') as f:
        text = f.read()
    return render_template("custom_file_view.html",content = text, name = user_info['name'], pic_link = user_info['picture'])

@app.route('/custom_algo_structure')
def viewAlgorithmStructure():
    user_info = google_auth.get_user_info()
    with open('./app/algorithms/AlgoStructure.py','r') as f:
        text = f.read()
    return render_template("custom_file_view.html",content = text, name = user_info['name'], pic_link = user_info['picture'])

@app.route('/statistics', methods = ['GET','POST'])
def statistics():
    return

@app.route('/compare')
def compare():
    user_info = google_auth.get_user_info()
    # global filename
    # global positioned
    # global positioned_data
    if session[user_info['id']]['positioned'] == 'true':
        return render_template('compare.html', filename = session[user_info['id']]['filename'], positioned = session[user_info['id']]['positioned'], positioned_data = session[user_info['id']]['positioned_data'], name = user_info['name'], pic_link = user_info['picture'])
    else:
        return render_template('compare.html', filename = session[user_info['id']]['filename'], positioned = session[user_info['id']]['positioned'], name = user_info['name'], pic_link = user_info['picture'])

@app.route('/api/diffusion', methods=['POST'])
def runDiffusion():
    # global G

    data = request.form
    algo = data.get('algo', None)
    if (algo == None):
        return jsonify({'success': 1, 'msg': "Need to specify the algorithm"})
    else:
        return jsonify({'success': 0, 'msg': algo})

@app.route('/download_network', methods=['POST'])
def request_zip():
    user_info = google_auth.get_user_info()
    # global G
    # global relabel_dict
    # global reverse_relabel
    form_data = request.form
    session[user_info['id']]['positioned'] = form_data.get('positioned')
    base_path = pathlib.Path('./app/static/js/')
    data = io.BytesIO()
    nx.write_graphml(session[user_info['id']]['G'],'./app/static/js/network_G_obj.graphml')
    with zipfile.ZipFile(data, mode='w') as z:
        for f in base_path.iterdir():
            if f.name.startswith("data_"):
                z.write(f, arcname="data_"+str(int(datetime.now().timestamp()))+".csv")
            elif f.name == 'network_G_obj.graphml':
                z.write(f, arcname="network_obj.graphml")
        z.writestr("network_layout.json", session[user_info['id']]['positioned'])
        z.writestr("relabel_dict.json", json.dumps(session[user_info['id']]['relabel_dict']))
        z.writestr("reverse_relabel.jsonl", json.dumps(session[user_info['id']]['reverse_relabel']))
    data.seek(0)
    os.remove('./app/static/js/network_G_obj.graphml')
    return send_file(
        data,
        mimetype='application/zip',
        as_attachment=True,
        attachment_filename='network.diva'
    )

@app.route('/viewData')
def viewData():
    user_info = google_auth.get_user_info()
    return render_template('viewData.html', name = user_info['name'], pic_link = user_info['picture'])

def outputIterations(iteration_results):
    output = {}
    nodes_iter = {}
    for keys in iteration_results[0]['node_count']:
        output[keys]=[]
        nodes_iter[keys] = []
    for iteration in iteration_results:
        for keys in nodes_iter:
            nodes_iter[keys] = []
        status = iteration['status']
        for node in status:
            nodes_iter[status[node]].append(node)
        for keys in nodes_iter:
            output[keys].append(nodes_iter[keys])

    return output

def store_diffusion(label, iterations, params):
    diffusion = models.DiffusionModel()
    diffusion.seeds = params
    diffusion.iterations = iterations
    diffusion.label = label
    db.session.add(diffusion)
    db.session.commit()

def remove_prev_data():
    for i in os.listdir("./app/static/js"):
        if i.startswith("data"):
            os.remove("./app/static/js/"+i)

def write_csv(filename):
    user_info = google_auth.get_user_info()
    # global G
    # global reverse_relabel
    # global relabel_dict
    remove_prev_data()
    with open('./app/static/js/'+filename,'w') as dataf:
        dataf.write('id,label,degree,edges\n')
        for i in session[user_info['id']]['G'].nodes:
            dataf.write('{0},{1},{2},'.format(i, session[user_info['id']]['reverse_relabel'][int(i)], session[user_info['id']]['G'].degree(i)))
            edges = list(session[user_info['id']]['G'].edges(i))
            for j in range(len(edges)-1):
                dataf.write('{0} '.format(edges[j][1]))
            if len(edges)>0:
                dataf.write('{0} \n'.format(edges[-1][1]))
            else:
                dataf.write('\n')
    # for i in G.nodes:
    #     for j,k in G.edges(i):

    # with open('./app/static/js/data.csv','w') as nodef:
    #     nodef.write('id,label,\n')
    #     for i in G.nodes:
    #         nodef.write('{0},{1},{2},{3}\n'.format(i, reverse_relabel[i], G.degree(i)))

@app.route('/api/getNodeInfo', methods=['GET', 'POST'])
def getNodeInformation():
    user_info = google_auth.get_user_info()
    # global G
    # TO be implemented
    if request.method == 'GET':
        data = request.args
    else:
        data = request.form
    # Use the data attribute to fetch the desired ID and send
    json_to_return = session[user_info['id']]['G'].nodes[data.get('id')]
    json_to_return['Label'] = session[user_info['id']]['reverse_relabel'][int(data.get('id'))]
    json_to_return['Degree'] = session[user_info['id']]['G'].degree(data.get('id'))
    try:
        json_to_return['Out Degree'] = session[user_info['id']]['G'].out_degree(data.get('id'))
        json_to_return['In Degree'] = session[user_info['id']]['G'].in_degree(data.get('id'))
    except:
        pass
    # print(json_to_return)
    return json_to_return

@app.route('/api/getAllNodeInfo', methods=['GET', 'POST'])
def getNodeInformationAll():
    user_info = google_auth.get_user_info()
    # TO be implemented
    if request.method == 'GET':
        data = request.args
    else:
        data = request.form
    # Use the data attribute to fetch the desired ID and send
    json_to_return = list(session[user_info['id']]['G'].nodes(data=True))
    # print(reverse_relabel)
    for node in json_to_return:
        # print(node[0])
        node[1]['Label'] = session[user_info['id']]['reverse_relabel'][int(node[0])]
        node[1]['Degree'] = session[user_info['id']]['G'].degree(node[0])
        try:
            node[1]['Out Degree'] = session[user_info['id']]['G'].out_degree(node[0])
            node[1]['In Degree'] = session[user_info['id']]['G'].in_degree(node[0])
        except:
    #print(json_to_return)
            pass
    return jsonify({'success': 1, 'data': json_to_return})

@app.route('/api/uploadSeedNodes', methods=['POST'])
def uploadSeedNodes():
    user_info = google_auth.get_user_info()
    # Need to read seed node file which is a csv and send the nodes 
    # global seedNodes
    seedFile = request.files['seeds']
    if seedFile.filename != '':
        session[user_info['id']]['seedNodes'] = seedFile.read().decode('utf-8').split(',')
        flag_seednodes = 0
        relabelled_seednodes = []
        for i in session[user_info['id']]['seedNodes']:
            if session[user_info['id']]['relabel_dict'].get(i, False):
                relabelled_seednodes.append(session[user_info['id']]['relabel_dict'][i])
            else:
                return jsonify({'success': 1, 'msg': 'Some seednodes not found. Please check the uploaded file.'})
        # We might need to shift this to label based searching instead of ID but can leave to ID for the timebeing
        return jsonify({'success': 0, 'msg': 'Seed Nodes read and sent', 'seeds': session[user_info['id']]['seedNodes']})

    return jsonify({'success': 1, 'msg': 'There was some error in sending seed nodes'})

@app.route('/api/runStats', methods=['POST'])
def runContext():
    # Will be sending some keyword of stats based on algorithms decided tomorrow to run and return result
    contextName = request.form('stat')
    if (contextName == None):
        return jsonify({'success': 1, 'msg': 'No Context Name Found'})
    # RUN THE CONTEXT ALGO AND RETURN AND STORE RESULT IN DB - THESE ARE FOR WHOLE GRAPHS
    return jsonify({'success': 0, 'msg': 'Stats for the requested value', 'stat': 'Some value after computation'})

@app.route('/api/runFilter', methods=['POST'])
def runFilter():
    user_info = google_auth.get_user_info()
    target = request.form.get('filter')
    # Most probably this target will be indegree or something similar to run on graph
    # Will return result of each filter for the computation and used to display some form of graph
    if (target == None):
        return jsonify({'success': 1, 'msg': 'No Filter Found'})
    # RUN THE FILTER AND SEND DATA
    answer = None
    # try:
    if (target == 'diameter'):
        components = nx.connected_components(session[user_info['id']]['G'])
        largest_component = max(components, key=len)
        subgraph = session[user_info['id']]['G'].subgraph(largest_component)
        diameter = nx.diameter(subgraph)
        answer = diameter
    elif (target == 'transitivity'):
        triadic_closure = nx.transitivity(session[user_info['id']]['G'])
        answer = triadic_closure
    elif (target == 'reciprocity'):
        reciprocity = nx.reciprocity(session[user_info['id']]['G'])
        answer = reciprocity
    elif (target == 'average-clustering'):
        average_clustering = nx.average_clustering(session[user_info['id']]['G'])
        answer = average_clustering
    elif (target == 'average-node-connectivity'):
        average_node_connectivity = nx.average_node_connectivity(session[user_info['id']]['G'])
        answer = average_node_connectivity
    elif (target == 'degree-assortativity'):
        r = nx.degree_pearson_correlation_coefficient(session[user_info['id']]['G'])
        answer = r
    elif (target == 'page-rank'):
        r = nx.pagerank(session[user_info['id']]['G'])
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Page Rank")
        answer = 'Calculated'
    elif (target == 'clustering'):
        r = nx.clustering(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Clustering Coefficient")
        answer = 'Calculated'
    elif (target == 'closeness-centrality'):
        r = nx.closeness_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Closeness Centrality")
        # print(G.nodes[1]["closeness_centrality"])
        answer = 'Calculated'
    elif (target == 'betweenness-centrality'):
        r = nx.betweenness_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Betweenness Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'current-flow-closeness-centrality'):
        r = nx.current_flow_closeness_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Current flow closeness Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'current-flow-betweenness-centrality'):
        r = nx.current_flow_betweenness_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Current flow betweenness Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'percolation-centrality'):
        r = nx.percolation_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Percolation Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'harmonic-centrality'):
        r = nx.harmonic_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Harmonic Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'second-order-centrality'):
        r = nx.second_order_centrality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Second Order Centrality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'trophic-levels'):
        r = nx.trophic_levels(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Trophic Levels")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'eccentricity'):
        r = nx.eccentricity(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Eccentricity")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    elif (target == 'closeness-vitality'):
        r = nx.closeness_vitality(session[user_info['id']]['G'])
        #print(r)
        nx.set_node_attributes(session[user_info['id']]['G'], r, "Closeness Vitality")
        # print(G.nodes[1]["betweenness_centrality"])
        answer = 'Calculated'
    # except: 
    #     return jsonify({'success': 1, 'msg': 'Some error has occured'})
    return jsonify({'success': 0, 'msg': 'Filter run successfully', 'filter': answer, 'tagret': target})

@app.route('/api/basicInfo', methods=['POST'])
def getBasicInfo():
    user_info = google_auth.get_user_info()
    # global G
    if session[user_info['id']]['G'] == None:
        return jsonify({'success': 1, 'msg': 'No Graph Found'})
    numNodes = nx.number_of_nodes(session[user_info['id']]['G'])
    numEdges = nx.number_of_edges(session[user_info['id']]['G'])
    degree = nx.degree(session[user_info['id']]['G'])
    avgDegree = 0
    for d in degree:
        avgDegree += d[1]
    avgDegree /= numNodes
    density = nx.density(session[user_info['id']]['G'])
    degree_histogram = nx.degree_histogram(session[user_info['id']]['G'])
     
    dict_degree = {}
    for d_h in range(len(degree_histogram)):
        dict_degree[d_h] = degree_histogram[d_h]
    info = nx.info(session[user_info['id']]['G'])  
    return jsonify({'success': 0, 'msg': 'Basic info fetched', 'numNodes': numNodes, 'numEdges': numEdges, 'degree': avgDegree, 'density': density, 'description': info, 'degree_hist': degree_histogram})