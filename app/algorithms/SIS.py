import networkx as nx
import ndlib.models.ModelConfig as mc
import ndlib.models.epidemics as ep
import json
import pandas as pd
import app

class Model():
    def __init__(self, G, beta=0.01, lambda_param=0.005,seeds=None, fraction_infected=None, iterations = 10):
        self.config = mc.Configuration()
        self.model = ep.SISModel(G)
        self.iterations = iterations
        if seeds is not None and len(seeds)!=0:
            for i in range(len(seeds)):
                seedNodes[i] = app.models.Node.query.filter_by(label = seedNodes[i]).first().id
            self.config.add_model_initial_configuration("Infected", seedNodes)
        else:
            try:
                fraction_infected = float(fraction_infected)
            except:
                fraction_infected = 0.1
            self.config.add_model_parameter("fraction_infected", fraction_infected)
        self.config.add_model_parameter("beta",beta)
        self.config.add_model_parameter("lambda",lambda_param)
        self.model.set_initial_status(self.config)
    
    def run_model(self):
        iteration_results = self.model.iteration_bunch(self.iterations)
        return iteration_results