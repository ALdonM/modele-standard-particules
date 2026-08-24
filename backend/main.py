from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import os

# Configuration base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/sg_msp")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="SG-MSP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dépendance pour obtenir une session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schémas Pydantic
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

# Endpoints
@app.get("/")
def root():
    return {"message": "SG-MSP API is running", "version": "0.1.0", "database": "connected"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "sg-msp-api"}

@app.get("/particules", response_model=List[ParticuleResponse])
def list_particules(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM particule WHERE est_actif = TRUE ORDER BY id_particule"))
    rows = result.mappings().all()
    return [dict(row) for row in rows]

@app.get("/particules/{id_particule}", response_model=ParticuleResponse)
def get_particule(id_particule: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM particule WHERE id_particule = :id"), {"id": id_particule})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Particule non trouvée")
    return dict(row)

@app.post("/particules", response_model=ParticuleResponse)
def create_particule(particule: ParticuleCreate, db: Session = Depends(get_db)):
    result = db.execute(text("""
        INSERT INTO particule (nom_particule, symbole, masse_mev, spin, charge_e, 
                               duree_vie_s, nombre_baryonique_B, nombre_leptonique_L, est_elementaire)
        VALUES (:nom, :symbole, :masse, :spin, :charge, :duree, :B, :L, :elementaire)
        RETURNING *
    """), {
        "nom": particule.nom_particule,
        "symbole": particule.symbole,
        "masse": particule.masse_mev,
        "spin": particule.spin,
        "charge": particule.charge_e,
        "duree": particule.duree_vie_s,
        "B": particule.nombre_baryonique_B,
        "L": particule.nombre_leptonique_L,
        "elementaire": particule.est_elementaire
    })
    db.commit()
    row = result.mappings().first()
    return dict(row)

@app.get("/groupes")
def list_groupes(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM groupe ORDER BY id_groupe"))
    rows = result.mappings().all()
    return [dict(row) for row in rows]

@app.get("/interactions")
def list_interactions(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM interaction_fondamentale ORDER BY id_interaction"))
    rows = result.mappings().all()
    return [dict(row) for row in rows]

@app.get("/references")
def get_references(entite_cible: str, id_cible: int, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT id_reference, source, url, type_contenu, fiabilite, date_acces 
        FROM reference_externe 
        WHERE entite_cible = :entite AND id_cible = :id
        ORDER BY source
    """), {"entite": entite_cible, "id": id_cible})
    rows = result.mappings().all()
    return [dict(row) for row in rows]

# ========== NOUVEAUX ENDPOINTS ==========

@app.get("/proprietes")
def get_proprietes(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM propriete_quantique ORDER BY nom_propriete"))
    return [dict(row) for row in result.mappings().all()]

@app.get("/regles")
def get_regles(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM regle_conservation ORDER BY nom_regle"))
    return [dict(row) for row in result.mappings().all()]

@app.get("/processus")
def get_processus(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM processus_dynamique ORDER BY nom_processus"))
    return [dict(row) for row in result.mappings().all()]