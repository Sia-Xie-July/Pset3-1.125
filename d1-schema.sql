-- Canonical working schema for Pset3-1.125. Maintain this file for schema changes.
-- Retains the assignment's six content tables and adds website account/session storage.
-- Schema only: source registrations and observations belong in separate seed/import data.
-- Published 2026-10-05. Generate site/db/schema.ts via sync_schema.py and append migrations.
-- Once deployed, keep applied migrations immutable and append new migrations.
-- Backend-generated timestamps use UTC ISO 8601; raw source dates retain their timezone context.

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authenticated_user_id TEXT NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    password_hash TEXT,
    team_id INTEGER,
    role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('viewer', 'editor', 'team_admin')),
    registered_at TEXT NOT NULL,
    CHECK (password_hash IS NULL OR email IS NOT NULL)
);

CREATE UNIQUE INDEX idx_users_email ON users(email);

CREATE TABLE sessions (
    session_hash TEXT PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE auth_limits (
    bucket_key TEXT PRIMARY KEY NOT NULL,
    attempts INTEGER NOT NULL CHECK (attempts > 0),
    expires_at INTEGER NOT NULL
);

CREATE INDEX idx_auth_limits_expiry ON auth_limits(expires_at);

CREATE TABLE countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    region TEXT
);

CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publisher TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL
        CHECK (source_type IN ('webpage', 'report', 'dataset', 'api')),
    publication_date TEXT,
    accessed_at TEXT NOT NULL,
    documentation_url TEXT,
    dataset_id TEXT,
    endpoint_url TEXT,
    auth_type TEXT NOT NULL DEFAULT 'unknown'
        CHECK (auth_type IN ('none', 'api_key', 'unknown')),
    auth_header TEXT,
    license TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified', 'documented', 'tested', 'needs_key')),
    verified_at TEXT,
    last_refresh_at TEXT,
    last_refresh_status TEXT NOT NULL DEFAULT 'never'
        CHECK (last_refresh_status IN ('never', 'succeeded', 'failed')),
    last_refresh_error TEXT,
    notes TEXT,
    CHECK (auth_type <> 'api_key' OR (auth_header IS NOT NULL AND length(trim(auth_header)) > 0)),
    CHECK (verification_status <> 'tested' OR (endpoint_url IS NOT NULL AND verified_at IS NOT NULL)),
    CHECK (last_refresh_status = 'never' OR last_refresh_at IS NOT NULL)
);

CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_id INTEGER NOT NULL REFERENCES countries(id),
    metric_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    value REAL CHECK (value IS NULL OR typeof(value) IN ('integer', 'real')),
    value_kind TEXT NOT NULL
        CHECK (value_kind IN ('reported', 'estimate', 'forecast', 'calculated')),
    unit TEXT NOT NULL,
    geographic_scope TEXT NOT NULL,
    reporting_period TEXT,
    source_timestamp TEXT,
    source_timezone TEXT,
    source_record_id TEXT,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    retrieved_at TEXT NOT NULL,
    confidence TEXT NOT NULL
        CHECK (confidence IN ('high', 'medium', 'low', 'unassessed')),
    notes TEXT NOT NULL CHECK (length(trim(notes)) > 0)
);

CREATE TABLE designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    selected_country_id INTEGER REFERENCES countries(id),
    it_load_mw REAL NOT NULL
        CHECK (typeof(it_load_mw) IN ('integer', 'real') AND it_load_mw > 0),
    pue REAL NOT NULL
        CHECK (typeof(pue) IN ('integer', 'real') AND pue >= 1),
    annual_operating_hours REAL NOT NULL
        CHECK (typeof(annual_operating_hours) IN ('integer', 'real')
            AND annual_operating_hours > 0 AND annual_operating_hours <= 8784),
    cooling_strategy TEXT,
    backup_strategy TEXT,
    design_summary TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE design_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    design_id INTEGER NOT NULL REFERENCES designs(id),
    claim_text TEXT NOT NULL,
    claim_type TEXT NOT NULL
        CHECK (claim_type IN (
            'evidence', 'assumption', 'calculation', 'design_decision', 'unknown'
        )),
    source_id INTEGER REFERENCES sources(id),
    status TEXT NOT NULL
        CHECK (status IN ('draft', 'verified', 'proposed', 'calculated', 'unresolved')),
    notes TEXT,
    updated_at TEXT NOT NULL,
    CHECK (claim_type <> 'evidence' OR source_id IS NOT NULL),
    CHECK (status <> 'verified' OR claim_type = 'evidence')
);

CREATE INDEX idx_metrics_country_metric
ON metrics(country_id, metric_name);

CREATE INDEX idx_claims_design
ON design_claims(design_id);

-- The UNIQUE authenticated_user_id already has an index.
PRAGMA optimize;

-- Verified integration mappings, checked 2026-10-05. Details: d1-schema.md.
-- Hydro-Quebec demand: endpoint_url =
-- https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/demande.json
-- details[].valeurs.demandeTotal -> electricity_demand, category='', unit='MW'.
-- details[].date -> source_timestamp; geographic_scope='Quebec, excluding off-grid regions'.
-- Source timestamps have no UTC offset; keep source_timezone NULL until confirmed.
-- Exclude missing values and future placeholders beyond recentHour.
-- Hydro-Quebec generation: endpoint_url =
-- https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/production.json
-- details[].valeurs.{total,hydraulique,eolien,autres,solaire,thermique}
-- -> electricity_generation, category=original field name, unit='MW'.
-- Provider reports a mix of real and estimated power; retain this limitation.
-- Do not import future total=0 placeholders as measured zero generation.
-- Singapore API: https://data.gov.sg/api/action/datastore_search?resource_id=<dataset_id>
-- Fuel mix dataset d_dec34f3ed7daeb6429c8d8b7c36852d2:
-- result.records[].{year,energy_products,percentage}
-- -> electricity_generation_fuel_share, category=energy_products, unit='%'.
-- Coverage ends Jun 2021; 2021 is a partial year.
-- Peak demand dataset d_926d3e304c0b41e56d4cbd3304acf105:
-- {year,mth,peak_system_demand_mw} -> electricity_peak_demand, unit='MW'.
-- Coverage ends Jul 2021. Paginate: first response has 100 of 199 records.
-- Carbon dataset d_bc140b67a8708ba19c39d69182893f31:
-- Publisher is NEA, NOT EMA; {year,carbon_intensity_of_electricity_generation}
-- -> electricity_generation_carbon_intensity, unit='kgCO2/kWh'; 2007-2013 only.
-- Fingrid: official API base is https://data.fingrid.fi/api, not the listed api.fingrid.fi.
-- Consumption latest endpoint verified with HTTP 200 on 2026-10-05:
-- https://data.fingrid.fi/api/datasets/124/data/latest
-- {datasetId,startTime,endTime,value,modifiedAtUTC} -> national quarter-hour average.
-- The other Fingrid endpoints remain NULL until independently verified.
-- auth_type='api_key', auth_header='x-api-key'; never store the key itself.
-- Dataset 124: electricity_consumption, unit='MWh/h', 15-minute national data.
-- Dataset 266: electricity_generation_carbon_intensity, unit='gCO2/kWh', value_kind='estimate'.
-- Dataset 241: electricity_production, unit='MW', value_kind='forecast'.
-- Optional Epoch CSV: https://epoch.ai/data/data_centers/data_centers.csv
-- Current power (MW) and Current total capital cost (2025 USD billions) are estimates.
-- Keep value_kind='estimate' and use assumption claims for estimated design inputs.
-- Source verification != website integration, and reported national data != site capability.
-- Validated refresh writes must be atomic; preserve old metrics on any failed refresh.
-- Source refresh status/error fields record freshness but do not implement that behavior.
