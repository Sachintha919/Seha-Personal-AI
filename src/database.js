import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SETTINGS = {
  privateEnabled: true,
  groupsEnabled: false,
  onlyMe: false,
  welcomeEnabled: true,
  language: 'auto',
  maxMediaMb: 15
};

export class JsonDatabase {
  constructor({ owner, repo, token, baseDir = 'database' }) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.baseDir = baseDir;
    this.cache = { users: {}, settings: { ...DEFAULT_SETTINGS } };
    this.sha = new Map();
    this.writeQueues = new Map();
    this.remoteEnabled = Boolean(owner && repo && token);
  }

  async init() {
    await fs.mkdir(this.baseDir, { recursive: true });
    const [users, settings] = await Promise.all([
      this.readFile('users.json', {}),
      this.readFile('settings.json', DEFAULT_SETTINGS)
    ]);
    this.cache.users = users && typeof users === 'object' && !Array.isArray(users) ? users : {};
    this.cache.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    return this;
  }

  getHeaders() {
    return {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  async readFile(filename, fallback) {
    if (this.remoteEnabled) {
      try {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/database/${filename}`;
        const response = await fetch(url, { headers: this.getHeaders() });
        if (response.status === 404) return fallback;
        if (!response.ok) throw new Error(`GitHub read failed (${response.status}): ${await response.text()}`);
        const item = await response.json();
        this.sha.set(filename, item.sha);
        return JSON.parse(Buffer.from(item.content.replace(/\n/g, ''), 'base64').toString('utf8'));
      } catch (error) {
        console.error(`[DB] GitHub read failed for ${filename}; using local database: ${error.message}`);
      }
    }
    try {
      return JSON.parse(await fs.readFile(path.join(this.baseDir, filename), 'utf8'));
    } catch {
      return fallback;
    }
  }

  async writeFile(filename, value) {
    const previous = this.writeQueues.get(filename) || Promise.resolve();
    const current = previous.then(() => this.#writeFileUnlocked(filename, value));
    this.writeQueues.set(filename, current.catch(() => {}));
    return current.catch((error) => {
      console.error(`[DB] Save failed for ${filename}; local copy is kept: ${error.message}`);
      return false;
    });
  }

  async #writeFileUnlocked(filename, value) {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    await fs.writeFile(path.join(this.baseDir, filename), content, 'utf8');
    if (!this.remoteEnabled) return;

    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/database/${filename}`;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let sha = this.sha.get(filename);
      if (attempt > 0 || !sha) {
        const latest = await fetch(url, { headers: this.getHeaders() });
        if (latest.ok) {
          const latestJson = await latest.json();
          sha = latestJson.sha;
          this.sha.set(filename, sha);
        } else if (latest.status !== 404) {
          throw new Error(`GitHub refresh failed (${latest.status}): ${await latest.text()}`);
        }
      }
      const body = {
        message: `Update Seha database: ${filename}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        ...(sha ? { sha } : {})
      };
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const result = await response.json();
        if (result.content?.sha) this.sha.set(filename, result.content.sha);
        return;
      }
      const errorText = await response.text();
      if (![409, 422].includes(response.status) || attempt === 2) {
        throw new Error(`GitHub write failed (${response.status}): ${errorText}`);
      }
    }
  }

  get settings() { return this.cache.settings; }
  get users() { return this.cache.users; }

  async setSettings(patch) {
    const next = { ...this.cache.settings, ...patch };
    if (JSON.stringify(next) === JSON.stringify(this.cache.settings)) return false;
    this.cache.settings = next;
    await this.writeFile('settings.json', next);
    return true;
  }

  async setUser(id, profile) {
    if (!id) return false;
    const previous = this.cache.users[id];
    if (JSON.stringify(previous) === JSON.stringify(profile)) return false;
    this.cache.users[id] = profile;
    await this.writeFile('users.json', this.cache.users);
    return true;
  }

  async deleteUser(id) {
    if (!id || !this.cache.users[id]) return false;
    delete this.cache.users[id];
    await this.writeFile('users.json', this.cache.users);
    return true;
  }
}
