from pydantic import BaseModel
from typing import Optional

class ParticuleBase(BaseModel):
    nom_particule: str
    symbole: str
    masse_mev: Optional[float] = None
    spin: Optional[float] = None
    charge_e: Optional[float] = None
    duree_vie_s: Optional[float] = None
    nombre_baryonique_B: int = 0
    nombre_leptonique_L: int = 0
    est_elementaire: bool

class ParticuleCreate(ParticuleBase):
    pass

class ParticuleResponse(ParticuleBase):
    id_particule: int
    
    class Config:
        from_attributes = True
