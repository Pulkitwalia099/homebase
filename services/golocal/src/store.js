import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, open, rm } from 'node:fs/promises';
import { join } from 'node:path';

// Single process, single operator pilot. The lock prevents unsafe sharing between processes.
export class Store {
  constructor(dir, key) {
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('DATA_ENCRYPTION_KEY must contain 64 hex characters');
    this.dir = dir; this.key = Buffer.from(key, 'hex'); this.queue = Promise.resolve();
    this.state = { bookings: {}, quotes: {}, operations: {}, jobber: null, oauth: null };
  }
  async init() {
    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    try { this.lock = await open(join(this.dir, 'process.lock'), 'wx', 0o600); }
    catch { throw new Error('Data directory locked. Stop the other process; after a crash verify it stopped before deleting process.lock.'); }
    try {
      const payload = JSON.parse(await readFile(join(this.dir, 'state.enc.json'), 'utf8'));
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(payload.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
      this.state = JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.data, 'hex')), decipher.final()]).toString());
    } catch (e) {
      if (e.code !== 'ENOENT') { await this.close(); throw new Error('Unable to decrypt state. Restore the original encryption key.'); }
    }
    return this;
  }
  async persist(state) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(state)), cipher.final()]);
    const target = join(this.dir, 'state.enc.json');
    const tmp = `${target}.tmp`;
    await writeFile(tmp, JSON.stringify({ iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') }), { mode: 0o600 });
    const handle = await open(tmp, 'r'); await handle.sync(); await handle.close();
    await rename(tmp, target);
    const directory = await open(this.dir, 'r'); await directory.sync(); await directory.close();
  }
  async transaction(fn) {
    const run = this.queue.then(async () => {
      const next = structuredClone(this.state);
      const result = await fn(next);
      await this.persist(next); this.state = next;
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
  async close() {
    await this.queue;
    if (this.lock) { await this.lock.close(); await rm(join(this.dir, 'process.lock')); this.lock = null; }
  }
}
