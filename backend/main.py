import logging
import os
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

logger = logging.getLogger("sg-msp")

# --- Base de données -------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Plus de valeur par défaut "localhost" : on veut une erreur claire dans les logs.
    raise RuntimeError("Variable d'environnement DATABASE_URL manquante")

# SQLAlchemy 2.x ne reconnaît pas le schéma "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="SG-MSP API", version="0.1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # incompatible avec allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Schémas ---------------------------------------------------------------
class ParticuleBase(BaseModel):
    nom_particule: str
    symbole: str
    masse_mev: Optional[float] = None
    spin: Optional[float] = None
    charge_e: Optional[float] = None
    duree_vie_s: Optional[float] = None
    # float : l'ETL insère 0.33 pour les quarks (un int ferait planter la validation)
    # AliasChoices : PostgreSQL met en minuscules les colonnes non quotées (..._b)
    nombre_baryonique_B: float = Field(
        default=0, validation_alias=AliasChoices("nombre_baryonique_B", "nombre_baryonique_b")
    )
    nombre_leptonique_L: float = Field(
        default=0, validation_alias=AliasChoices("nombre_leptonique_L", "nombre_leptonique_l")
    )
    est_elementaire: bool


class ParticuleCreate(ParticuleBase):
    pass


class ParticuleResponse(ParticuleBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id_particule: int


# --- Endpoints -------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "SG-MSP API is running", "version": "0.1.1"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "sg-msp-api"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    """Teste réellement la connexion à Neon (utile pour diagnostiquer)."""
    try:
        db.execute(text("SELECT 1"))
        return {"database": "connected"}
    except SQLAlchemyError as exc:
        logger.exception("DB indisponible")
        raise HTTPException(status_code=503, detail=f"DB error: {type(exc).__name__}")


@app.get("/particules", response_model=List[ParticuleResponse])
def list_particules(db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT * FROM particule WHERE est_actif = TRUE ORDER BY id_particule")
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/particules/{id_particule}", response_model=ParticuleResponse)
def get_particule(id_particule: int, db: Session = Depends(get_db)):
    row = db.execute(
        text("SELECT * FROM particule WHERE id_particule = :id"), {"id": id_particule}
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Particule non trouvée")
    return dict(row)


@app.post("/particules", response_model=ParticuleResponse)
def create_particule(particule: ParticuleCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text(
                """
                INSERT INTO particule (nom_particule, symbole, masse_mev, spin, charge_e,
                                       duree_vie_s, nombre_baryonique_B, nombre_leptonique_L,
                                       est_elementaire)
                VALUES (:nom, :symbole, :masse, :spin, :charge, :duree, :B, :L, :elementaire)
                RETURNING *
                """
            ),
            {
                "nom": particule.nom_particule,
                "symbole": particule.symbole,
                "masse": particule.masse_mev,
                "spin": particule.spin,
                "charge": particule.charge_e,
                "duree": particule.duree_vie_s,
                "B": particule.nombre_baryonique_B,
                "L": particule.nombre_leptonique_L,
                "elementaire": particule.est_elementaire,
            },
        )
        row = result.mappings().first()
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    return dict(row)


@app.get("/groupes")
def list_groupes(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM groupe ORDER BY id_groupe")).mappings().all()
    return [dict(r) for r in rows]


@app.get("/interactions")
def list_interactions(db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT * FROM interaction_fondamentale ORDER BY id_interaction")
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/references")
def get_references(entite_cible: str, id_cible: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT id_reference, source, url, type_contenu, fiabilite, date_acces
            FROM reference_externe
            WHERE entite_cible = :entite AND id_cible = :id
            ORDER BY source
            """
        ),
        {"entite": entite_cible, "id": id_cible},
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/proprietes")
def get_proprietes(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM propriete_quantique ORDER BY nom_propriete")).mappings().all()
    return [dict(r) for r in rows]


@app.get("/regles")
def get_regles(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM regle_conservation ORDER BY nom_regle")).mappings().all()
    return [dict(r) for r in rows]


@app.get("/processus")
def get_processus(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM processus_dynamique ORDER BY nom_processus")).mappings().all()
    return [dict(r) for r in rows]
