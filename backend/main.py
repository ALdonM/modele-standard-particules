import logging
import os
import unicodedata
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from decimal import Decimal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator
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

app = FastAPI(title="SG-MSP API", version="0.4.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # incompatible avec allow_origins=["*"]
    allow_methods=["GET"],  # API en lecture seule
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Schémas ---------------------------------------------------------------
_VIDES = {"", "?", "-", "—", "n/a", "na", "null", "none", "inconnu", "stable"}


def _vers_float(v):
    """Convertit une valeur de la base (nombre, texte '1/2', '?', '1,5'...) en float ou None."""
    if v is None:
        return None
    if isinstance(v, (int, float, Decimal)):
        return float(v)
    s = str(v).strip().replace(",", ".")
    if s.lower() in _VIDES:
        return None
    try:
        return float(s)
    except ValueError:
        pass
    if "/" in s:  # fractions : 1/2, -1/3, 3/2
        try:
            num, den = s.split("/", 1)
            return float(num) / float(den)
        except (ValueError, ZeroDivisionError):
            return None
    return None


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

    # Certaines colonnes sont stockées en texte dans la base ('?', '1/2'...) :
    # on les normalise avant la validation au lieu de planter.
    @field_validator(
        "masse_mev", "spin", "charge_e", "duree_vie_s",
        "nombre_baryonique_B", "nombre_leptonique_L",
        mode="before",
    )
    @classmethod
    def _normaliser_nombres(cls, v, info):
        valeur = _vers_float(v)
        if valeur is None and info.field_name in ("nombre_baryonique_B", "nombre_leptonique_L"):
            return 0.0
        return valeur


class ParticuleCreate(ParticuleBase):
    pass


# Colonnes et relations ajoutées en lecture seule (v0.2.0)
SELECT_PARTICULE = """
    SELECT p.*,
      (SELECT array_agg(g.nom_groupe ORDER BY g.id_groupe)
         FROM appartient_groupe ag JOIN groupe g ON g.id_groupe = ag.id_groupe
        WHERE ag.id_particule = p.id_particule) AS groupes,
      (SELECT MIN(id_generation) FROM appartient_generation ag2
        WHERE ag2.id_particule = p.id_particule) AS generation,
      (SELECT a.id_antiparticule FROM antiparticule a
        WHERE a.id_particule = p.id_particule LIMIT 1) AS id_antiparticule,
      (SELECT a.type_lien FROM antiparticule a
        WHERE a.id_particule = p.id_particule LIMIT 1) AS type_antiparticule
    FROM particule p
"""


class ParticuleResponse(ParticuleBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id_particule: int
    pdg_id: Optional[str] = None
    categorie: Optional[str] = None
    lien_pdg_listing: Optional[str] = None
    lien_pdg_table: Optional[str] = None
    groupes: List[str] = []
    generation: Optional[int] = None
    id_antiparticule: Optional[int] = None
    type_antiparticule: Optional[str] = None
    composition: Optional[str] = None

    @field_validator("pdg_id", mode="before")
    @classmethod
    def _pdg_en_texte(cls, v):
        return None if v is None else str(v)

    @field_validator("groupes", mode="before")
    @classmethod
    def _groupes_vide(cls, v):
        return v or []


# --- Endpoints -------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "SG-MSP API is running", "version": "0.3.0"}


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
def list_particules(
    groupe: Optional[str] = None,
    generation: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Liste les particules actives. Filtres optionnels : ?groupe=boson_jauge&generation=1"""
    sql = "SELECT * FROM (" + SELECT_PARTICULE + ") t WHERE est_actif = TRUE"
    params = {}
    if groupe:
        sql += " AND :groupe = ANY(groupes)"
        params["groupe"] = groupe
    if generation:
        sql += " AND generation = :generation"
        params["generation"] = generation
    sql += " ORDER BY id_particule"
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


@app.get("/particules/{id_particule}", response_model=ParticuleResponse)
def get_particule(id_particule: int, db: Session = Depends(get_db)):
    row = db.execute(
        text(SELECT_PARTICULE + " WHERE p.id_particule = :id"), {"id": id_particule}
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Particule non trouvée")
    return dict(row)


@app.get("/particules/{id_particule}/antiparticule")
def get_antiparticule(id_particule: int, db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT a.type_lien, q.id_particule, q.nom_particule, q.symbole
            FROM antiparticule a JOIN particule q ON q.id_particule = a.id_antiparticule
            WHERE a.id_particule = :id
            """
        ),
        {"id": id_particule},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Pas d'antiparticule renseignée")
    return dict(row)


@app.get("/particules/{id_particule}/fiche")
def get_fiche(id_particule: int, db: Session = Depends(get_db)):
    """Tout ce qu'il faut pour la fiche d'une particule, en un seul appel."""
    row = db.execute(
        text(SELECT_PARTICULE + " WHERE p.id_particule = :id"), {"id": id_particule}
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Particule non trouvée")
    particule = ParticuleResponse.model_validate(dict(row)).model_dump()

    anti = db.execute(
        text(
            """
            SELECT q.id_particule, q.nom_particule, q.symbole, a.type_lien
            FROM antiparticule a JOIN particule q ON q.id_particule = a.id_antiparticule
            WHERE a.id_particule = :id
            """
        ),
        {"id": id_particule},
    ).mappings().first()

    constituants = db.execute(
        text(
            """
            SELECT q.id_particule, q.nom_particule, q.symbole, c.nombre_constituants, c.type_hadron
            FROM composition c JOIN particule q ON q.id_particule = c.id_constituant
            WHERE c.id_hadron = :id
            ORDER BY q.id_particule
            """
        ),
        {"id": id_particule},
    ).mappings().all()

    references = db.execute(
        text(
            """
            SELECT id_reference, source, url, type_contenu, fiabilite, libelle
            FROM reference_externe
            WHERE entite_cible = 'PARTICULE' AND id_cible = :id
            ORDER BY source
            """
        ),
        {"id": id_particule},
    ).mappings().all()

    return {
        "particule": particule,
        "antiparticule": dict(anti) if anti else None,
        "constituants": [dict(r) for r in constituants],
        "references": [dict(r) for r in references],
    }


@app.get("/generations")
def list_generations(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM generation ORDER BY id_generation")).mappings().all()
    return [dict(r) for r in rows]


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


# --- Particules (ou processus) concernés par chaque entité -------------------
# Les liens sont CALCULÉS à partir des colonnes de la table particule et des
# groupes (aucun stockage redondant). Les processus lisent participer (exemple
# représentatif rédigé à la main) et les règles lisent conserve. Chaque résultat
# porte son critère en français et en anglais, affiché sous la cellule.
_HYPOTHETIQUES = {"graviton"}


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return s.lower().replace("_", " ").strip()


def _dans_groupe(*noms):
    liste = ", ".join("'" + n + "'" for n in noms)  # constantes écrites ici, jamais de saisie externe
    return (
        "EXISTS (SELECT 1 FROM appartient_groupe ag JOIN groupe g ON g.id_groupe = ag.id_groupe "
        "WHERE ag.id_particule = p.id_particule AND g.nom_groupe IN (" + liste + "))"
    )


_UNIVERSEL = "UNIVERSEL"  # concerne toutes les particules : pas de liste
_AUCUNE = "FALSE"         # donnée non disponible

# nom normalisé -> (condition SQL, mode, critère FR, critère EN)
# mode "presque" : presque toutes les particules, on affiche seulement le nombre
_PROPRIETE = {
    "masse": ("p.masse_mev IS NOT NULL AND p.masse_mev > 0", "presque",
              "Particules de masse non nulle (presque toutes).",
              "Particles with non-zero mass (almost all)."),
    "charge electrique": ("p.charge_e <> 0", "liste",
              "Particules de charge électrique non nulle.",
              "Particles with non-zero electric charge."),
    "spin": ("p.spin IS NOT NULL AND p.spin NOT IN ('?', '')", "presque",
              "Particules dont le spin est renseigné (presque toutes).",
              "Particles whose spin is given (almost all)."),
    "nombre baryonique": ("p.nombre_baryonique_b <> 0", "liste",
              "Particules de nombre baryonique B non nul.",
              "Particles with non-zero baryon number B."),
    "nombre leptonique": ("p.nombre_leptonique_l <> 0", "liste",
              "Particules de nombre leptonique L non nul.",
              "Particles with non-zero lepton number L."),
    "etrangete": ("p.nombre_etrangete_s <> 0", "liste",
              "Particules d'étrangeté S non nulle.",
              "Particles with non-zero strangeness S."),
    "charme": ("p.nombre_charme_c <> 0", "liste",
              "Particules de charme C non nul.",
              "Particles with non-zero charm C."),
    "beaute": ("p.nombre_beaute_b <> 0", "liste",
              "Particules de beauté non nulle.",
              "Particles with non-zero beauty."),
    "isospin": ("p.isospin_i IS NOT NULL AND p.isospin_i NOT IN ('?', '')", "liste",
              "Particules dont l'isospin est renseigné (la valeur peut être nulle).",
              "Particles whose isospin is given (the value may be zero)."),
    "parite": ("p.parite_p IS NOT NULL AND p.parite_p NOT IN ('?', '')", "liste",
              "Particules dont la parité P est renseignée.",
              "Particles whose parity P is given."),
    "saveur": (_dans_groupe("quark", "lepton"), "liste",
              "Quarks et leptons.", "Quarks and leptons."),
    "couleur": ("(" + _dans_groupe("quark") + " OR p.nom_particule = 'gluon')", "liste",
              "Quarks et gluon (les hadrons sont de couleur neutre).",
              "Quarks and gluon (hadrons are colour-neutral)."),
}
_PROPRIETE_VIDE = (_AUCUNE, "liste", "Donnée non disponible dans la base.", "Data not available in the database.")

# nom normalisé -> (critère FR, critère EN) ; la liste vient de la table conserve
_REGLE = {
    "parite": ("Processus qui conservent la parité (électromagnétiques et forts) ; elle est violée par l'interaction faible.",
               "Processes that conserve parity (electromagnetic and strong); it is violated by the weak interaction."),
}
_REGLE_DEFAUT = ("Processus qui respectent cette règle.", "Processes that obey this rule.")

_MEDIATEUR = (
    "EXISTS (SELECT 1 FROM boson_mediateur b WHERE b.id_boson = p.id_particule "
    "AND b.id_interaction_mediee = :cible)"
)


def _interaction(nom):
    """(condition, critère FR, critère EN) d'une interaction, d'après son nom."""
    n = _norm(nom)
    if "gravit" in n:
        return (_UNIVERSEL, "Toutes les particules : la gravitation se couple à l'énergie.",
                "All particles: gravity couples to energy.")
    if "electromag" in n:
        return ("p.charge_e <> 0", "Particules de charge électrique non nulle. Les hadrons neutres (ex. le neutron) "
                "interagissent aussi, via leurs constituants.",
                "Particles with non-zero electric charge. Neutral hadrons (e.g. the neutron) also interact, "
                "through their constituents.")
    if "faible" in n:
        return (_dans_groupe("quark", "lepton", "hadron", "boson_higgs") + " OR " + _MEDIATEUR,
                "Quarks, leptons, hadrons, bosons W et Z et boson de Higgs (photon, gluon et graviton exclus).",
                "Quarks, leptons, hadrons, W and Z bosons and the Higgs boson (photon, gluon and graviton excluded).")
    if "forte" in n:
        return (_dans_groupe("quark", "hadron") + " OR " + _MEDIATEUR,
                "Quarks, hadrons et gluon.", "Quarks, hadrons and gluon.")
    return (_AUCUNE, "", "")


def _item(r, role=None):
    d = {"id": r["id_particule"], "nom": r["nom_particule"], "symbole": r["symbole"]}
    if r["nom_particule"] in _HYPOTHETIQUES:
        d["hypothetique"] = True
    if role:
        d["role"] = role
    return d


def _liste(db, cond, cible=None):
    rows = db.execute(
        text("SELECT p.id_particule, p.nom_particule, p.symbole FROM particule p "
             "WHERE p.est_actif AND (" + cond + ") ORDER BY p.id_particule"),
        {"cible": cible} if ":cible" in cond else {},
    ).mappings().all()
    return [_item(r) for r in rows]


def _resultat(db, cond, total, fr, en, mode="liste", cible=None):
    base = {"critere_fr": fr, "critere_en": en, "sur": total}
    if cond == _UNIVERSEL:
        return {**base, "mode": "toutes", "total": total, "particules": []}
    items = _liste(db, cond, cible)
    if mode == "presque":
        return {**base, "mode": "presque", "total": len(items), "particules": []}
    return {**base, "mode": "liste", "total": len(items), "particules": items}


@app.get("/entites/{entite}/particules")
def particules_par_entite(entite: str, db: Session = Depends(get_db)):
    """Pour chaque ligne d'une entité (groupes, interactions, proprietes, regles,
    processus) : les particules concernées (processus concernés pour les règles).
    Clé du résultat = identifiant de la ligne."""
    total = db.execute(text("SELECT count(*) FROM particule WHERE est_actif")).scalar()
    out = {}
    if entite == "groupes":
        cond = ("EXISTS (SELECT 1 FROM appartient_groupe ag WHERE ag.id_particule = p.id_particule "
                "AND ag.id_groupe = :cible)")
        for r in db.execute(text("SELECT id_groupe FROM groupe")).mappings().all():
            out[str(r["id_groupe"])] = _resultat(
                db, cond, total, "Particules appartenant à ce groupe.", "Particles belonging to this group.",
                cible=r["id_groupe"])
    elif entite == "interactions":
        for r in db.execute(text("SELECT id_interaction, nom_interaction FROM interaction_fondamentale")).mappings().all():
            cond, fr, en = _interaction(r["nom_interaction"])
            res = _resultat(db, cond, total, fr, en, cible=r["id_interaction"])
            med = db.execute(
                text("SELECT p.id_particule, p.nom_particule, p.symbole FROM boson_mediateur b "
                     "JOIN particule p ON p.id_particule = b.id_boson "
                     "WHERE b.id_interaction_mediee = :i ORDER BY p.id_particule"),
                {"i": r["id_interaction"]},
            ).mappings().all()
            res["mediateurs"] = [_item(m) for m in med]
            out[str(r["id_interaction"])] = res
    elif entite == "proprietes":
        for r in db.execute(text("SELECT id_propriete, nom_propriete FROM propriete_quantique")).mappings().all():
            cond, mode, fr, en = _PROPRIETE.get(_norm(r["nom_propriete"]), _PROPRIETE_VIDE)
            out[str(r["id_propriete"])] = _resultat(db, cond, total, fr, en, mode)
    elif entite == "regles":
        nb_proc = db.execute(text("SELECT count(*) FROM processus_dynamique")).scalar()
        for r in db.execute(text("SELECT id_regle, nom_regle FROM regle_conservation")).mappings().all():
            procs = db.execute(
                text("SELECT d.id_processus, d.nom_processus FROM conserve c "
                     "JOIN processus_dynamique d ON d.id_processus = c.id_processus "
                     "WHERE c.id_regle = :i ORDER BY d.id_processus"),
                {"i": r["id_regle"]},
            ).mappings().all()
            fr, en = _REGLE.get(_norm(r["nom_regle"]), _REGLE_DEFAUT)
            out[str(r["id_regle"])] = {
                "mode": "tous" if nb_proc and len(procs) == nb_proc else "liste",
                "total": len(procs),
                "processus": [{"id": x["id_processus"], "nom": x["nom_processus"]} for x in procs],
                "critere_fr": fr, "critere_en": en,
            }
    elif entite == "processus":
        for r in db.execute(text("SELECT id_processus FROM processus_dynamique")).mappings().all():
            rows = db.execute(
                text("SELECT p.id_particule, p.nom_particule, p.symbole, x.role FROM participer x "
                     "JOIN particule p ON p.id_particule = x.id_particule WHERE x.id_processus = :i "
                     "ORDER BY x.ordre_temporal NULLS LAST, x.role, p.id_particule"),
                {"i": r["id_processus"]},
            ).mappings().all()
            regles = db.execute(
                text("SELECT g.id_regle, g.nom_regle FROM conserve c "
                     "JOIN regle_conservation g ON g.id_regle = c.id_regle "
                     "WHERE c.id_processus = :i ORDER BY g.id_regle"),
                {"i": r["id_processus"]},
            ).mappings().all()
            items = [_item(m, m["role"]) for m in rows]
            if items:
                fr, en = ("Réaction type donnée en exemple (liste non exhaustive).",
                          "Typical reaction given as an example (not exhaustive).")
            else:
                fr, en = ("Aucune réaction type renseignée dans la base.", "No typical reaction in the database.")
            out[str(r["id_processus"])] = {
                "mode": "liste", "total": len(items), "particules": items,
                "regles": [{"id": g["id_regle"], "nom": g["nom_regle"]} for g in regles],
                "critere_fr": fr, "critere_en": en,
            }
    else:
        raise HTTPException(status_code=404, detail="Entité inconnue")
    return out


@app.get("/references")
def get_references(entite_cible: str, id_cible: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT id_reference, source, url, type_contenu, fiabilite, date_acces, libelle
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
