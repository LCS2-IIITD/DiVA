from app import db

class Node(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(64), index=True, unique=True)
    info = db.Column(db.JSON)
    # edges = db.relationship('Edge', backref='edges', lazy='dynamic')

    def __repr__(self):
        return '<User {0} {1}>'.format(self.id, self.info)    

class Edge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    u = db.Column(db.Integer, db.ForeignKey('node.id'))
    v = db.Column(db.Integer, db.ForeignKey('node.id'))
    def __repr__(self):
        return '<Edge {0} {1}>'.format(self.u,self.v)   
    
class DiffusionModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(10), index=True, unique=True)
    iteration = db.Column(db.JSON)
    seeds = db.Column(db.JSON)

    def __repr__(self):
        return '<Model {}>'.format(self.label)