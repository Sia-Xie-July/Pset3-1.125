// Exact original text guards make this data correction repeatable without overwriting edits.
const originals = new Map([
  [1, 'LUMI is located in Kajaani and provides an existing warm-water-cooling and heat-recovery example.'],
  [2, 'Fingrid reports regional connection queues; the proposed site has no confirmed connection offer.'],
]);
export function correctSeedClaims(db, claims, now) {
  return [...originals].map(([id, previous]) => {
    const row = claims.find(c => c.id === id);
    return db.prepare("UPDATE design_claims SET claim_text=?,claim_type=?,status=?,updated_at=? WHERE id=? AND design_id=1 AND source_id=? AND claim_type='evidence' AND claim_text=?")
      .bind(row.claim_text,row.claim_type,row.status,now,id,row.source_id,previous);
  });
}
