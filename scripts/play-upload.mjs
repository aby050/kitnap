// Uploads an AAB to a Play track with release notes, in 8 MB resumable chunks
// (a single-shot POST of a large bundle drops on this connection).
//   node scripts/play-upload.mjs <aab> <track> "<notes>"
import { createSign } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { homedir } from 'os';

const [aab, track = 'production', notes = ''] = process.argv.slice(2);
const PKG = 'com.abhay.byre';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UP = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;
const key = JSON.parse(readFileSync(`${homedir()}/.byre-secrets/play-publisher.json`, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri, iat: now, exp: now + 3600 })}`;
const sig = createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
const tok = (await (await fetch(key.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${body}.${sig}` })).json()).access_token;
const auth = { authorization: `Bearer ${tok}` };
const json = { ...auth, 'content-type': 'application/json' };
const call = async (method, url, data) => {
  const r = await fetch(url, { method, headers: json, body: data });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} -> ${r.status} ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : {};
};

const edit = await call('POST', `${API}/edits`, '{}');
const E = `${API}/edits/${edit.id}`;
try {
  const size = statSync(aab).size;
  const start = await fetch(`${UP}/edits/${edit.id}/bundles?uploadType=resumable`, {
    method: 'POST',
    headers: { ...auth, 'x-upload-content-type': 'application/octet-stream', 'x-upload-content-length': String(size) },
  });
  if (!start.ok) throw new Error(`resumable start ${start.status} ${await start.text()}`);
  const session = start.headers.get('location');
  const buf = readFileSync(aab);
  const CHUNK = 8 * 1024 * 1024;
  let bundle;
  for (let off = 0; off < size; off += CHUNK) {
    const end = Math.min(off + CHUNK, size);
    const r = await fetch(session, { method: 'PUT', headers: { 'content-range': `bytes ${off}-${end - 1}/${size}` }, body: buf.subarray(off, end) });
    if (r.status === 200 || r.status === 201) bundle = await r.json();
    else if (r.status !== 308) throw new Error(`chunk ${off} -> ${r.status} ${await r.text()}`);
    process.stdout.write(`\ruploaded ${Math.round((end / size) * 100)}%`);
  }
  console.log(`\nbundle versionCode ${bundle.versionCode}`);
  await call('PUT', `${E}/tracks/${track}`, JSON.stringify({
    track,
    releases: [{ versionCodes: [String(bundle.versionCode)], status: 'completed', releaseNotes: [{ language: 'en-US', text: notes }] }],
  }));
  const done = await call('POST', `${E}:commit?changesNotSentForReview=${process.env.NOT_SENT === '1'}`);
  console.log(`committed edit ${done.id} to ${track}`);
} catch (e) {
  await fetch(E, { method: 'DELETE', headers: json });
  console.error(`FAILED (edit discarded): ${e.message}`);
  process.exit(1);
}
