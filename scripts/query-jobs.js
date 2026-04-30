const Database = require('better-sqlite3')
try {
  const db = new Database('data/app.db', { readonly: true })
  const rows = db
    .prepare(
      "SELECT id, status, attempts, max_attempts, payload, created_at FROM jobs WHERE status != 'completed' ORDER BY created_at DESC LIMIT 10;"
    )
    .all()
  console.log(JSON.stringify(rows, null, 2))
  db.close()
} catch (err) {
  console.error('ERROR', err && err.message, err && err.stack)
  process.exit(1)
}
