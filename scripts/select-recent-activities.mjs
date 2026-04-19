import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'migrated_activities.json');
const OUTPUT_FILE = path.join(__dirname, 'recent_100_activities.json');
const LIMIT = Number(process.env.ACTIVITY_REWRITE_LIMIT || 100);

function parseActivityDate(value) {
  const raw = String(value || '').trim();
  const zhMatch = raw.match(/(\d{4})年(?:\s*(\d{1,2})月)?(?:\s*(\d{1,2})日)?/);
  if (zhMatch) {
    const year = Number(zhMatch[1]);
    const month = Number(zhMatch[2] || 12);
    const day = Number(zhMatch[3] || 31);
    return new Date(Date.UTC(year, month - 1, day)).getTime();
  }

  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return new Date(Date.UTC(year, month - 1, day)).getTime();
  }

  const fallback = Date.parse(raw);
  return Number.isNaN(fallback) ? 0 : fallback;
}

function normalizeContent(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/#[^\s#\u3000]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  const raw = await readFile(INPUT_FILE, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items)) {
    throw new Error('migrated_activities.json must be an array');
  }

  const selected = items
    .map((item, index) => ({
      ...item,
      content: normalizeContent(item.content),
      _sortDate: parseActivityDate(item.date),
      _sourceIndex: index,
    }))
    .sort((left, right) => {
      if (right._sortDate !== left._sortDate) {
        return right._sortDate - left._sortDate;
      }
      return left._sourceIndex - right._sourceIndex;
    })
    .slice(0, LIMIT)
    .map(({ _sortDate, _sourceIndex, ...item }) => item);

  await writeFile(OUTPUT_FILE, `${JSON.stringify(selected, null, 2)}\n`, 'utf8');

  console.log(`Prepared ${selected.length} recent activities.`);
  if (selected.length > 0) {
    console.log(`Newest: ${selected[0].date} | ${selected[0].title}`);
    console.log(`Oldest in batch: ${selected[selected.length - 1].date} | ${selected[selected.length - 1].title}`);
  }
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});