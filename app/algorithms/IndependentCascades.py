import networkx as nx
import ndlib.models.ModelConfig as mc
import ndlib.models.epidemics as ep
import json
import pandas as pd
import app

class Model():
    def __init__(self, G, edgeThresholdFile = None, thresholdInitial = 0.1, seeds=None, fraction_infected=None, iterations = 10):
        print("IC")
        self.config = mc.Configuration()
        self.model = ep.IndependentCascadesModel(G)
        self.iterations = iterations
        self.thresholdInitial = thresholdInitial
        if seeds is not None and len(seeds)!=0:
            for i in range(len(seeds)):
                seedNodes[i] = app.models.Node.query.filter_by(label = seedNodes[i]).first().id
            self.config.add_model_initial_configuration("Infected", seedNodes)
        else:
            try:
                fraction_infected = float(fraction_infected)
            except:
                fraction_infected = 0.1
            print("finf",fraction_infected)
            self.config.add_model_parameter("fraction_infected", fraction_infected)
        if edgeThresholdFile is not None:
            self.edgeThresholds = pd.read_csv(edgeThresholdFile)
            for index,row in self.edgeThresholds.iterrows():
                u = models.Node.query.filter_by(label = row['u']).first().id
                v = models.Node.query.filter_by(label = row['v']).first().id
                try:
                    threshold = float(row['threshold'])
                except:
                    threshold = self.thresholdInitial
                self.config.add_edge_configuration("threshold",(u,v),threshold)
        else:
            for e in G:
                self.config.add_edge_configuration("threshold", e, self.thresholdInitial)
        self.model.set_initial_status(self.config)
    
    def run_model(self):
        iteration_results = self.model.iteration_bunch(self.iterations)
        print(iteration_results)
        return iteration_results