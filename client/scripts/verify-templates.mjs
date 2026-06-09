#!/usr/bin/env node
/**
 * Ensures every template in templateLibrary.ts has a matching case in processTemplate.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libSrc = readFileSync(join(root, 'src/data/templateLibrary.ts'), 'utf8');
const builderSrc = readFileSync(join(root, 'src/pages/JourneyBuilder.tsx'), 'utf8');

const libIds = [...libSrc.matchAll(/^\s+id: '([^']+)'/gm)].map((m) => m[1]);
const caseIds = [...builderSrc.matchAll(/case '([^']+)':/g)].map((m) => m[1]);
const hasDefault = /default:\s*\{/.test(builderSrc) || /default:/.test(builderSrc);

const missing = libIds.filter((id) => !caseIds.includes(id));
const extra = caseIds.filter((id) => !libIds.includes(id));

let failed = false;

if (missing.length) {
    console.error('Templates missing flow cases:', missing.join(', '));
    failed = true;
}
if (extra.length) {
    console.error('Flow cases without library metadata:', extra.join(', '));
    failed = true;
}
if (!hasDefault) {
    console.error('processTemplate is missing a default fallback case.');
    failed = true;
}

if (failed) {
    process.exit(1);
}

console.log(`OK: All ${libIds.length} templates have dedicated or default flow builders.`);
