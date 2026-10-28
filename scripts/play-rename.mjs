// Renames the Play listing in every language: "Phonewise" -> "Kitnap" in title, short
// and full description, and uploads the Kitnap icon. `node scripts/play-rename.mjs` is a
// dry run; add `apply` to commit the edit (which sends it to Google review).
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const PKG = 'com.abhay.byre';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UP = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;
const APPLY = process.argv[2] === 'apply';
const key = JSON.parse(readFileSync(`${homedir()}/.byre-secrets/play-publisher.json`, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri, iat: now, exp: now + 3600 })}`;
const sig = createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
const tok = (await (await fetch(key.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${body}.${sig}` })).json()).access_token;
const json = { authorization: `Bearer ${tok}`, 'content-type': 'application/json' };
const call = async (method, url, data, headers = json) => {
  const r = await fetch(url, { method, headers, body: data });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} -> ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
};
const swap = (s = '') => s.replace(/Phonewise/g, 'Kitnap').replace(/phonewise/g, 'kitnap');

const edit = await call('POST', `${API}/edits`, '{}');
const E = `${API}/edits/${edit.id}`;
try {
  const { listings = [] } = await call('GET', `${E}/listings`);
  for (const l of listings) {
    const next = { ...l, title: swap(l.title), shortDescription: swap(l.shortDescription), fullDescription: swap(l.fullDescription) };
    if (next.title.length > 30) throw new Error(`${l.language} title too long: ${next.title}`);
    console.log(`${l.language}: "${l.title}" -> "${next.title}"`);
    if (APPLY) await call('PUT', `${E}/listings/${l.language}`, JSON.stringify(next));
  }
  if (!APPLY) { await fetch(E, { method: 'DELETE', headers: json }); console.log('dry run, nothing changed'); process.exit(0); }
  await call('DELETE', `${E}/listings/en-US/icon`).catch(() => {});
  await call('POST', `${UP}/edits/${edit.id}/listings/en-US/icon?uploadType=media`, readFileSync(process.env.ICON), { authorization: `Bearer ${tok}`, 'content-type': 'image/png' });
  console.log('icon uploaded');
  const done = await call('POST', `${E}:commit`);
  console.log(`committed edit ${done.id}`);
} catch (e) {
  await fetch(E, { method: 'DELETE', headers: json });
  console.error(`FAILED (edit discarded): ${e.message}`);
  process.exit(1);
}
