# ETL PDG - Modele Standard des Particules
# FICHIER LOCAL UNIQUEMENT - Ne pas commit sur GitHub

import psycopg2
from psycopg2.extras import RealDictCursor

# === CONFIGURATION ===
# Remplace par ta NOUVELLE DATABASE_URL Neon (apres reset password)
DATABASE_URL = "postgresql://neondb_owner:npg_kLrYwFa6jv2S@ep-sparkling-glade-b1cq2v0r-pooler.c-5.eu-central-1.aws.neon.tech/sg_msp?sslmode=require&channel_binding=require"
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
    {"nom": "omega-", "symbole": "Omega-", "masse": 1672.45, "spin": 1.5, "charge