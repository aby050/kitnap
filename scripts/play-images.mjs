// Replaces the Play icon, feature graphic and phone screenshots on every listing language in one edit.
//   node scripts/play-images.mjs <icon.png> <feature.png> <screenshot dir>
import { createSign } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PKG = 'com.abhay.byre';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UP = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;
const [icon, feature, shotDir] = process.argv.slice(2);
const shots = readdirSync(shotDir).filter((f) => f.endsWith('.png')).sort().map((f) => join(shotDir, f));

const key = JSON.parse(readFileSync(`${homedir()}/.byre-secrets/play-publisher.json`, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri, iat: now, exp: now + 3600 })}`;
const sig = createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
const tok = (await (await fetch(key.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${body}.${sig}` })).json()).access_token;
const call = async (method, url, data, type = 'application/json') => {
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${tok}`, 'content-type': type }, body: data });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url.split('/edits/')[1] ?? url} -> ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
};
const edit = await call('POST', `${API}/edits`, '{}');
const E = `${API}/edits/${edit.id}`;
try {
  const { listings = [] } = await call('GET', `${E}/listings`);
  for (const { language: l } of listings) {
    const put = (type, file) => call('POST', `${UP}/edits/${edit.id}/listings/${l}/${type}?uploadType=media`, readFileSync(file), 'image/png');
    for (const type of ['icon', 'featureGraphic', 'phoneScreenshots']) await call('DELETE', `${E}/listings/${l}/${type}`);
    await put('icon', icon);
    await put('featureGraphic', feature);
    for (const s of shots) await put('phoneScreenshots', s);
    console.log(`${l}: icon, feature graphic, ${shots.length} screenshots`);
  }
  const done = await call('POST', `${E}:commit`);
  console.log(`committed edit ${done.id}`);
} catch (e) {
  await fetch(E, { method: 'DELETE', headers: { authorization: `Bearer ${tok}` } });
  console.error(`FAILED (edit discarded): ${e.message}`);
  process.exit(1);
}
