# ETL PDG - Modele Standard des Particules
# Remplit PARTICULE et REFERENCE_EXTERNE

import psycopg2
from psycopg2.extras import RealDictCursor

# === CONFIGURATION ===
# Remplace par ta DATABASE_URL Neon
DATABASE_URL = "postgresql://neondb_owner:npg_oBdNcmHUhZ27@ep-sparkling-glade-b1cq2v0r-pooler.c-5.eu-central-1.aws.neon.tech/sg_msp?sslmode=require&channel_binding=require"
# =====================

PARTICULES = [
    # QUARKS
    {"nom": "quark up", "symbole": "u", "masse": 2.16, "spin": 0.5, "charge": 0.67, "duree": None, "B": 0.33, "L": 0, "elementaire": True},
    {"nom": "quark down", "symbole": "d", "masse": 4.67, "spin": 0.5, "charge": -0.33, "duree": None, "B": 0.33, "L": 0, "elementaire": True},
    {"nom": "quark charm", "symbole": "c", "masse": 1270.0, "spin": 0.5, "charge": 0.67, "duree": None, "B": 0.33, "L": 0, "elementaire": True},
    {"nom": "quark strange", "symbole": "s", "masse": 93.0, "spin": 0.5, "charge": -0.33, "duree": None, "B": 0.33, "L": 0, "elementaire": True},
    {"nom": "quark top", "symbole": "t", "masse": 173100.0, "spin": 0.5, "charge": 0.67, "duree": 5e-25, "B": 0.33, "L": 0, "elementaire": True},
    {"nom": "quark bottom", "symbole": "b", "masse": 4180.0, "spin": 0.5, "charge": -0.33, "duree": None, "B": 0.33, "L": 0, "elementaire": True},
    # LEPTONS
    {"nom": "muon", "symbole": "mu-", "masse": 105.658, "spin": 0.5, "charge": -1, "duree": 2.197e-6, "B": 0, "L": 1, "elementaire": True},
    {"nom": "tau", "symbole": "tau-", "masse": 1776.86, "spin": 0.5, "charge": -1, "duree": 2.903e-13, "B": 0, "L": 1, "elementaire": True},
    # NEUTRINOS
    {"nom": "neutrino electron", "symbole": "nu_e", "masse": 0.0, "spin": 0.5, "charge": 0, "duree": None, "B": 0, "L": 1, "elementaire": True},
    {"nom": "neutrino muon", "symbole": "nu_mu", "masse": 0.0, "spin": 0.5, "charge": 0, "duree": None, "B": 0, "L": 1, "elementaire": True},
    {"nom": "neutrino tau", "symbole": "nu_tau", "masse": 0.0, "spin": 0.5, "charge": 0, "duree": None, "B": 0, "L": 1, "elementaire": True},
    # BOSONS
    {"nom": "photon", "symbole": "gamma", "masse": 0.0, "spin": 1, "charge": 0, "duree": None, "B": 0, "L": 0, "elementaire": True},
    {"nom": "boson W+", "symbole": "W+", "masse": 80377.0, "spin": 1, "charge": 1, "duree": 3.21e-25, "B": 0, "L": 0, "elementaire": True},
    {"nom": "boson Z", "symbole": "Z0", "masse": 91187.6, "spin": 1, "charge": 0, "duree": 3.0e-25, "B": 0, "L": 0, "elementaire": True},
    {"nom": "gluon", "symbole": "g", "masse": 0.0, "spin": 1, "charge": 0, "duree": None, "B": 0, "L": 0, "elementaire": True},
    {"nom": "boson de Higgs", "symbole": "H0", "masse": 125250.0, "spin": 0, "charge": 0, "duree": 1.56e-22, "B": 0, "L": 0, "elementaire": True},
    # MESONS LEGERS
    {"nom": "pion+", "symbole": "pi+", "masse": 139.570, "spin": 0, "charge": 1, "duree": 2.603e-8, "B": 0, "L": 0, "elementaire": False},
    {"nom": "pion0", "symbole": "pi0", "masse": 134.977, "spin": 0, "charge": 0, "duree": 8.52e-17, "B": 0, "L": 0, "elementaire": False},
    {"nom": "pion-", "symbole": "pi-", "masse": 139.570, "spin": 0, "charge": -1, "duree": 2.603e-8, "B": 0, "L": 0, "elementaire": False},
    {"nom": "kaon+", "symbole": "K+", "masse": 493.677, "spin": 0, "charge": 1, "duree": 1.238e-8, "B": 0, "L": 0, "elementaire": False},
    {"nom": "kaon0", "symbole": "K0", "masse": 497.611, "spin": 0, "charge": 0, "duree": None, "B": 0, "L": 0, "elementaire": False},
    {"nom": "kaon-", "symbole": "K-", "masse": 493.677, "spin": 0, "charge": -1, "duree": 1.238e-8, "B": 0, "L": 0, "elementaire": False},
    {"nom": "eta", "symbole": "eta", "masse": 547.862, "spin": 0, "charge": 0, "duree": 5.0e-19, "B": 0, "L": 0, "elementaire": False},
    {"nom": "eta prime", "symbole": "eta'", "masse": 957.78, "spin": 0, "charge": 0, "duree": 3.32e-21, "B": 0, "L": 0, "elementaire": False},
    # BARYONS LEGERS
    {"nom": "proton", "symbole": "p+", "masse": 938.272, "spin": 0.5, "charge": 1, "duree": None, "B": 1, "L": 0, "elementaire": False},
    {"nom": "neutron", "symbole": "n", "masse": 939.565, "spin": 0.5, "charge": 0, "duree": 879.4, "B": 1, "L": 0, "elementaire": False},
    {"nom": "lambda", "symbole": "Lambda0", "masse": 1115.683, "spin": 0.5, "charge": 0, "duree": 2.632e-10, "B": 1, "L": 0, "elementaire": False},
    {"nom": "sigma+", "symbole": "Sigma+", "masse": 1189.37, "spin": 0.5, "charge": 1, "duree": 8.018e-11, "B": 1, "L": 0, "elementaire": False},
    {"nom": "sigma0", "symbole": "Sigma0", "masse": 1192.642, "spin": 0.5, "charge": 0, "duree": 7.4e-20, "B": 1, "L": 0, "elementaire": False},
    {"nom": "sigma-", "symbole": "Sigma-", "masse": 1197.449, "spin": 0.5, "charge": -1, "duree": 1.479e-10, "B": 1, "L": 0, "elementaire": False},
    {"nom": "cascade0", "symbole": "Xi0", "masse": 1314.86, "spin": 0.5, "charge": 0, "duree": 2.90e-10, "B": 1, "L": 0, "elementaire": False},
    {"nom": "cascade-", "symbole": "Xi-", "masse": 1321.71, "spin": 0.5, "charge": -1, "duree": 1.639e-10, "B": 1, "L": 0, "elementaire": False},
    {"nom": "omega-", "symbole": "Omega-", "masse": 1672.45, "spin": 1.5, "charge": -1, "duree": 8.21e-11, "B": 1, "L": 0, "elementaire": False},
    # MESONS VECTEURS
    {"nom": "rho+", "symbole": "rho+", "masse": 775.26, "spin": 1, "charge": 1, "duree": 4.41e-24, "B": 0, "L": 0, "elementaire": False},
    {"nom": "rho0", "symbole": "rho0", "masse": 775.26, "spin": 1, "charge": 0, "duree": 4.41e-24, "B": 0, "L": 0, "elementaire": False},
    {"nom": "phi", "symbole": "phi", "masse": 1019.461, "spin": 1, "charge": 0, "duree": 1.55e-22, "B": 0, "L": 0, "elementaire": False},
    {"nom": "J/psi", "symbole": "J/psi", "masse": 3096.900, "spin": 1, "charge": 0, "duree": 7.09e-21, "B": 0, "L": 0, "elementaire": False},
    {"nom": "Upsilon", "symbole": "Upsilon", "masse": 9460.30, "spin": 1, "charge": 0, "duree": 1.22e-20, "B": 0, "L": 0, "elementaire": False},
    # MESONS CHARMES
    {"nom": "D+", "symbole": "D+", "masse": 1869.65, "spin": 0, "charge": 1, "duree": 1.040e-12, "B": 0, "L": 0, "elementaire": False},
    {"nom": "D0", "symbole": "D0", "masse": 1864.84, "spin": 0, "charge": 0, "duree": 4.101e-13, "B": 0, "L": 0, "elementaire": False},
    {"nom": "D_s+", "symbole": "D_s+", "masse": 1968.35, "spin": 0, "charge": 1, "duree": 5.04e-13, "B": 0, "L": 0, "elementaire": False},
    # MESONS BEAUTE
    {"nom": "B+", "symbole": "B+", "masse": 5279.34, "spin": 0, "charge": 1, "duree": 1.638e-12, "B": 0, "L": 0, "elementaire": False},
    {"nom": "B0", "symbole": "B0", "masse": 5279.65, "spin": 0, "charge": 0, "duree": 1.520e-12, "B": 0, "L": 0, "elementaire": False},
    {"nom": "B_s0", "symbole": "B_s0", "masse": 5366.92, "spin": 0, "charge": 0, "duree": 1.510e-12, "B": 0, "L": 0, "elementaire": False},
    # BARYONS CHARMES
    {"nom": "lambda_c+", "symbole": "Lambda_c+", "masse": 2286.46, "spin": 0.5, "charge": 1, "duree": 2.00e-13, "B": 1, "L": 0, "elementaire": False},
    {"nom": "sigma_c++", "symbole": "Sigma_c++", "masse": 2453.97, "spin": 0.5, "charge": 2, "duree": 1.43e-22, "B": 1, "L": 0, "elementaire": False},
    {"nom": "xi_c+", "symbole": "Xi_c+", "masse": 2467.94, "spin": 0.5, "charge": 1, "duree": 4.42e-13, "B": 1, "L": 0, "elementaire": False},
    {"nom": "omega_c0", "symbole": "Omega_c0", "masse": 2695.2, "spin": 0.5, "charge": 0, "duree": 2.68e-13, "B": 1, "L": 0, "elementaire": False},
]


def connect():
    print("Connexion a la base Neon...")
    conn = psycopg2.connect(DATABASE_URL)
    print("Connecte.")
    return conn


def insert_particules(conn):
    cur = conn.cursor()
    inserted = 0
    skipped = 0

    for p in PARTICULES:
        cur.execute("SELECT id_particule FROM particule WHERE nom_particule = %s", (p["nom"],))
        if cur.fetchone():
            print("  [SKIP] {} existe deja".format(p["nom"]))
            skipped += 1
            continue

        cur.execute("""
            INSERT INTO particule (
                nom_particule, symbole, masse_mev, spin, charge_e,
                duree_vie_s, nombre_baryonique_B, nombre_leptonique_L,
                est_elementaire, est_actif
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id_particule
        """, (
            p["nom"], p["symbole"], p["masse"], p["spin"], p["charge"],
            p["duree"], p["B"], p["L"], p["elementaire"]
        ))
        id_particule = cur.fetchone()[0]
        inserted += 1
        print("  [OK] {} (id={})".format(p["nom"], id_particule))

        pdg_url = "https://pdg.lbl.gov/2024/listings/rpp2024-list-{}.pdf".format(p["nom"].replace(" ", "-"))
        cur.execute("""
            INSERT INTO reference_externe (
                entite_cible, id_cible, source, url, type_contenu, fiabilite
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, ('PARTICULE', id_particule, 'pdg', pdg_url, 'propriete', 'officiel'))

    conn.commit()
    cur.close()
    print("\nResume : {} inserees, {} ignorees".format(inserted, skipped))


def show_stats(conn):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT COUNT(*) as total FROM particule")
    total = cur.fetchone()["total"]
    cur.execute("SELECT COUNT(*) as total FROM reference_externe")
    refs = cur.fetchone()["total"]
    cur.close()
    print("Base actuelle : {} particules, {} references".format(total, refs))


if __name__ == "__main__":
    print("=" * 50)
    print("ETL PDG - Modele Standard")
    print("=" * 50)

    conn = connect()
    try:
        insert_particules(conn)
        show_stats(conn)
    except Exception as e:
        print("Erreur : {}".format(e))
        conn.rollback()
    finally:
        conn.close()
        print("Termine.")