// Owner-configured, verified stable identity; never take provisioning input from a browser.
export async function provisionInitialAdmin(db, userId, configuration) {
  if (!configuration) return;
  let identity;
  try { identity = JSON.parse(configuration); } catch { return; }
  if (!Number.isSafeInteger(identity?.id) || identity.id < 1 ||
      typeof identity.authenticated_user_id !== 'string' || !userId ||
      identity.authenticated_user_id !== userId) return;
  await db.batch([
    db.prepare(`UPDATE users SET role='team_admin',team_id=1
      WHERE id=? AND authenticated_user_id=? AND role='viewer' AND team_id IS NULL
      AND NOT EXISTS(SELECT 1 FROM users WHERE role='team_admin' AND team_id=1)
      AND NOT EXISTS(SELECT 1 FROM project_audit WHERE action='provision-initial-admin')`)
      .bind(identity.id,userId),
    db.prepare(`INSERT INTO project_audit(user_id,action,details,created_at)
      SELECT ?,'provision-initial-admin',?,? WHERE changes()=1`)
      .bind(identity.id,'Site owner authorized initial team administrator for this verified registered identity.',new Date().toISOString()),
  ]);
}
