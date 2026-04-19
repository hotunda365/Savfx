import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'recent_100_activities.json');
const OUTPUT_FILE = path.join(__dirname, 'recent_100_activities_rewritten.json');
const BATCH_SIZE = Number(process.env.ACTIVITY_REWRITE_BATCH_SIZE || 20);
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const apiKey = process.env.GEMINI_API_KEY;

function stripCodeFence(value) {
  return String(value || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function contentExcerpt(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function chunk(array, size) {
  const batches = [];
  for (let index = 0; index < array.length; index += size) {
    batches.push(array.slice(index, index + size));
  }
  return batches;
}

function validateBatchResult(parsed, expectedIds) {
  if (!Array.isArray(parsed)) {
    throw new Error('Model output is not an array');
  }

  const byId = new Map(parsed.map((item) => [item.id, item]));
  return expectedIds.map((id) => {
    const item = byId.get(id);
    if (!item || typeof item.title !== 'string' || typeof item.summary !== 'string') {
      throw new Error(`Missing rewritten result for ${id}`);
    }
    return {
      id,
      title: item.title.trim(),
      summary: item.summary.trim(),
    };
  });
}

async function loadExistingOutput() {
  try {
    const raw = await readFile(OUTPUT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Put it in .env.local or your environment before running this script.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const source = JSON.parse(await readFile(INPUT_FILE, 'utf8'));
  if (!Array.isArray(source)) {
    throw new Error('recent_100_activities.json must be an array');
  }

  const existing = await loadExistingOutput();
  const completedIds = new Set(existing.map((item) => item.id));
  const pending = source.filter((item) => !completedIds.has(item.id));
  const output = [...existing];

  if (pending.length === 0) {
    console.log(`No pending items. Output already exists at ${OUTPUT_FILE}`);
    return;
  }

  const batches = chunk(pending, BATCH_SIZE);
  console.log(`Rewriting ${pending.length} activities in ${batches.length} batches using ${MODEL}.`);

  for (const [batchIndex, batch] of batches.entries()) {
    const compactItems = batch.map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      content: contentExcerpt(item.content),
    }));

    const prompt = [
      'You rewrite SAVFX activity posts in Traditional Chinese.',
      'Rewrite only the title and add a short summary.',
      'Rules:',
      '- Keep facts, dates, names, and claims accurate. Do not invent new facts.',
      '- Title should be clear, professional, and concise. Avoid clickbait and hashtags.',
      '- Summary should be one sentence in Traditional Chinese, max 70 Chinese characters.',
      '- Keep the tone factual and readable for a school website.',
      '- Return JSON only, no markdown fences, no extra commentary.',
      '- Output format: [{"id":"...","title":"...","summary":"..."}]',
      '',
      JSON.stringify(compactItems, null, 2),
    ].join('\n');

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const parsed = JSON.parse(stripCodeFence(response.text));
    const rewritten = validateBatchResult(
      parsed,
      batch.map((item) => item.id)
    );

    for (const result of rewritten) {
      const sourceItem = source.find((item) => item.id === result.id);
      output.push({
        id: result.id,
        date: sourceItem?.date || '',
        originalTitle: sourceItem?.title || '',
        rewrittenTitle: result.title,
        summary: result.summary,
        img: sourceItem?.img || '',
        tags: sourceItem?.tags || [],
      });
    }

    output.sort((left, right) => left.date < right.date ? 1 : -1);
    await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`Finished batch ${batchIndex + 1}/${batches.length}. Saved ${output.length} rewrites.`);
  }

  console.log(`Done. Output: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});