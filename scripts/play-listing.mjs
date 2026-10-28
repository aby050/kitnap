// Pushes store/play/LISTING-kitnap.md (title, short, full description) and the
// contact details to the Play listing in one edit. Sent to Google review on commit.
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const PKG = 'com.abhay.byre';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const ROOT = new URL('..', import.meta.url).pathname;
const md = readFileSync(`${ROOT}store/play/LISTING-kitnap.md`, 'utf8');
const title = md.match(/\*\*Title \(30\):\*\* (.+)/)[1].trim();
const shortDescription = md.match(/\*\*Short description \(80\):\*\* (.+)/)[1].trim();
const fullDescription = md.split('**Full description:**\n')[1].trim();
if (title.length > 30 || shortDescription.length > 80 || fullDescription.length > 4000) throw new Error('listing too long');

const key = JSON.parse(readFileSync(`${homedir()}/.byre-secrets/play-publisher.json`, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri, iat: now, exp: now + 3600 })}`;
const sig = createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
const tok = (await (await fetch(key.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${body}.${sig}` })).json()).access_token;
const json = { authorization: `Bearer ${tok}`, 'content-type': 'application/json' };
const call = async (method, url, data) => {
  const r = await fetch(url, { method, headers: json, body: data });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} -> ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
};
const edit = await call('POST', `${API}/edits`, '{}');
const E = `${API}/edits/${edit.id}`;
try {
  const cur = await call('GET', `${E}/listings/en-US`);
  await call('PUT', `${E}/listings/en-US`, JSON.stringify({ ...cur, title, shortDescription, fullDescription }));
  const d = await call('GET', `${E}/details`);
  await call('PUT', `${E}/details`, JSON.stringify({ ...d, contactEmail: 'work@rvastudio.in', contactWebsite: 'https://phonewise.rvastudio.in' }));
  const done = await call('POST', `${E}:commit`);
  console.log(`listing "${title}" committed in edit ${done.id}`);
} catch (e) {
  await fetch(E, { method: 'DELETE', headers: json });
  console.error(`FAILED (edit discarded): ${e.message}`);
  process.exit(1);
}
