import networkx as nx
import json
import pandas as pd
import app
## Other imports needed .....
## ...
## ...

class Model():
    def __init__(self, G, seeds=None, fraction_infected=None, iterations = 10):
        """ 
            G -> Network X graph of the created graph on the visualizer
            seeds -> An array of actual labels of the seed nodes uploaded on the visualizer
            fraction_infected -> float[0,1] integer as fed through the visualizer 
            iterations -> Number of max_iterations for the model as fed through the visualizer
            
            You may change the default values, but make sure to keep these as parameters.

            Use this function preferably to perform any processing you need to on the graph.
            You may implement your algorithm here.

            Returns -> null
        """
    def run_model(self):
        """
            This function must return the iterations in the same format as ndlib does. 
            Check out https://ndlib.readthedocs.io/ for the format.

            Returns -> Dictionary
        """
    ### Other functions needed .....
    ### ...
    ### ...