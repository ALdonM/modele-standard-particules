from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Particule(Base):
    __tablename__ = "particule"
    
    id_particule = Column(Integer, primary_key=True, index=True)
    nom_particule = Column(String(100), nullable=False)
    symbole = Column(String(20), nullable=False, unique=True)
    masse_mev = Column(Float)
    spin = Column(Float)
    charge_e = Column(Float)
    duree_vie_s = Column(Float)
    nombre_baryonique_B = Column(Integer, default=0)
    nombre_leptonique_L = Column(Integer, default=0)
    est_elementaire = Column(Boolean, nullable=False)
    est_actif = Column(Boolean, default=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
