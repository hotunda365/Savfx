/**
 * import-activities.mjs
 * Imports migrated_activities.json directly into the running local server.
 * Usage: node scripts/import-activities.mjs [BASE_URL]
 * Default BASE_URL: http://localhost:3000
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'migrated_activities.json');

const raw = readFileSync(filePath, 'utf8');
const activities = JSON.parse(raw);

console.log(`📦 Loaded ${activities.length} activities from migrated_activities.json`);
console.log(`🔗 Posting to ${BASE_URL}/api/collections/activities/:id`);
console.log('');

let success = 0;
let failed = 0;
const errors = [];

for (let i = 0; i < activities.length; i++) {
  const item = activities[i];
  const id = String(item.id || `migrated-${i}`);

  try {
    const res = await fetch(`${BASE_URL}/api/collections/activities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    success++;
    if (success % 50 === 0 || i === activities.length - 1) {
      const pct = Math.round(((i + 1) / activities.length) * 100);
      process.stdout.write(`\r✅ ${success} imported, ❌ ${failed} failed — ${pct}% (${i + 1}/${activities.length})`);
    }
  } catch (err) {
    failed++;
    errors.push({ id, error: err.message });
  }
}

console.log('\n');
console.log(`✅ Done! ${success} imported, ${failed} failed.`);
if (errors.length > 0) {
  console.log('\nFailed records:');
  errors.slice(0, 10).forEach(e => console.log(`  id=${e.id}: ${e.error}`));
  if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);
}
