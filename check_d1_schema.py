"""Run with Python 3. Uses in-memory SQLite; never changes a hosted database."""

import json
import sqlite3
from pathlib import Path


def check():
    root = Path(__file__).parent
    db = sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys = ON')
    db.executescript((root / 'd1-schema.sql').read_text())
    timestamp = '2026-10-05T00:00:00Z'

    def rejects(sql, params=()):
        try:
            db.execute(sql, params)
        except sqlite3.IntegrityError:
            return
        raise AssertionError('Expected invalid data to be rejected')

    db.executemany('INSERT INTO countries (id, name, region) VALUES (?, ?, ?)', [
        (1, 'Finland', 'Kainuu'), (2, 'Canada', 'Québec'), (3, 'Singapore', None),
    ])
    source_sql = (
        'INSERT INTO sources (publisher, title, url, source_type, accessed_at, '
        'endpoint_url, auth_type, auth_header, verification_status, verified_at) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    fixture = ('Test publisher', 'Test source', 'https://example.com', 'api', timestamp)
    rejects(source_sql, (*fixture, None, 'none', None, 'tested', timestamp))
    rejects(source_sql, (*fixture, 'https://example.com/api', 'none', None, 'tested', None))
    rejects(source_sql, (*fixture, None, 'api_key', None, 'needs_key', None))
    db.execute(source_sql, (*fixture, None, 'api_key', 'x-api-key', 'needs_key', None))

    user_sql = 'INSERT INTO users (authenticated_user_id, role, registered_at) VALUES (?, ?, ?)'
    db.execute(user_sql, ('test-user', 'viewer', timestamp))
    rejects(user_sql, ('test-user', 'viewer', timestamp))
    rejects(user_sql, ('other-user', 'superuser', timestamp))

    design_sql = (
        'INSERT INTO designs (team_id, selected_country_id, it_load_mw, pue, '
        'annual_operating_hours, updated_at) VALUES (1, 1, ?, ?, ?, ?)'
    )
    design_id = db.execute(design_sql, (20, 1.25, 8760, timestamp)).lastrowid
    for inputs in ((-20, 1.25, 8760), (20, 0.9, 8760), (20, 1.25, 9000), (20, 'bad', 8760)):
        rejects(design_sql, (*inputs, timestamp))
    result = db.execute(
        'SELECT it_load_mw * pue, it_load_mw * pue * annual_operating_hours / 1000 '
        'FROM designs WHERE id = ?', (design_id,)
    ).fetchone()
    assert result == (25, 219)

    # The stored API samples provide a real field-to-column mapping check.
    checks = json.loads((root / 'api-verification.json').read_text())['results']
    by_name = {record['source']: record for record in checks}
    api = by_name['singapore_fuel_mix']
    sample = api['sample_records'][0]
    source_id = db.execute(source_sql, (
        'EMA', 'Fuel mix',
        'https://data.gov.sg/datasets/d_dec34f3ed7daeb6429c8d8b7c36852d2/view',
        'api', api['checked_at'], api['request_url'], 'none', None, 'tested', api['checked_at'],
    )).lastrowid
    metric_sql = (
        'INSERT INTO metrics (country_id, metric_name, category, value, value_kind, unit, '
        'geographic_scope, reporting_period, source_record_id, source_id, retrieved_at, '
        'confidence, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    metric = (
        3, 'electricity_generation_fuel_share', sample['energy_products'],
        float(sample['percentage']), 'reported', '%', 'Singapore', str(sample['year']),
        str(sample['_id']), source_id, api['checked_at'], 'medium', 'Historical EMA sample; not current supply',
    )
    db.execute(metric_sql, metric)
    assert db.execute('SELECT category, value, unit, reporting_period FROM metrics').fetchone() == (
        'Petroleum Products', 23.1, '%', '2005',
    )
    for index, invalid in ((0, 999), (3, 'bad'), (4, 'fact'), (9, 999), (11, 'certain'), (12, '')):
        bad = list(metric)
        bad[index] = invalid
        rejects(metric_sql, bad)
    missing = list(metric)
    missing[3], missing[12] = None, 'Value not established'
    db.execute(metric_sql, missing)
    zero = list(metric)
    zero[3], zero[12] = 0, 'Synthetic reported zero'
    db.execute(metric_sql, zero)
    assert db.execute('SELECT value FROM metrics ORDER BY id').fetchall() == [(23.1,), (None,), (0.0,)]

    claim_sql = (
        'INSERT INTO design_claims (design_id, claim_text, claim_type, source_id, status, '
        'updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    for kind, status in (
        ('evidence', 'verified'), ('assumption', 'proposed'), ('calculation', 'calculated'),
        ('design_decision', 'proposed'), ('unknown', 'unresolved'),
    ):
        db.execute(claim_sql, (design_id, 'Test statement', kind,
                              source_id if kind == 'evidence' else None, status, timestamp))
    rejects(claim_sql, (design_id, 'Missing citation', 'evidence', None, 'verified', timestamp))
    rejects(claim_sql, (design_id, 'PUE target', 'assumption', None, 'verified', timestamp))
    rejects('DELETE FROM sources WHERE id = ?', (source_id,))
    rejects('UPDATE sources SET last_refresh_status = ? WHERE id = ?', ('failed', source_id))
    before = db.execute('SELECT value FROM metrics ORDER BY id').fetchall()
    db.execute(
        'UPDATE sources SET last_refresh_at = ?, last_refresh_status = ?, last_refresh_error = ? '
        'WHERE id = ?', (timestamp, 'failed', 'Synthetic timeout', source_id),
    )
    assert db.execute('SELECT value FROM metrics ORDER BY id').fetchall() == before
    assert db.execute('PRAGMA foreign_key_check').fetchall() == []
    plan = db.execute(
        'EXPLAIN QUERY PLAN SELECT * FROM metrics WHERE country_id = ? AND metric_name = ?',
        (3, 'electricity_generation_fuel_share'),
    ).fetchall()
    assert any('idx_metrics_country_metric' in row[3] for row in plan)
    db.close()
    print('PASS: schema constraints, source metadata, real API sample mapping, NULL/zero, baseline, and refresh-status isolation')
    print('Local SQLite only; deployed API refresh and authorization are not tested.')


if __name__ == '__main__':
    check()
