const DEFAULT_SETTINGS = {
  privateEnabled: true,
  groupsEnabled: false,
  onlyMe: false,
  welcomeEnabled: true,
  language: 'auto',
  maxMediaMb: 15
};

const DATABASE_FILES = new Set(['users.json', 'settings.json']);

/**
 * GitHub-only JSON storage.
 * Profile/settings data is kept in process memory while Seha is running and
 * read/written directly through the GitHub Contents API. This module never
 * writes user data to the Kaggle filesystem and has no local fallback.
 */
export class JsonDatabase {
  constructor({ owner, repo, token }) {
    this.owner = String(owner || '').trim();
    this.repo = String(repo || '').trim();
    this.token = String(token || '').trim();
    this.cache = { users: {}, settings: { ...DEFAULT_SETTINGS } };
    this.sha = new Map();
    this.writeQueues = new Map();
    this.initialized = false;
  }

  assertConfigured() {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error(
        'GitHub-only storage requires GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN in the Kaggle configuration cell.'
      );
    }
  }

  getHeaders() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  repositoryUrl() {
    return `https://api.github.com/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`;
  }

  fileUrl(filename) {
    if (!DATABASE_FILES.has(filename)) {
      throw new Error(`Unsupported database file: ${filename}`);
    }
    return `${this.repositoryUrl()}/contents/database/${filename}`;
  }

  async init() {
    this.assertConfigured();

    // Verify the token can access the repository. Visibility does not change
    // the storage mode: the user explicitly selected this repository.
    const repoResponse = await fetch(this.repositoryUrl(), {
      headers: this.getHeaders()
    });
    if (!repoResponse.ok) {
      const detail = await repoResponse.text();
      throw new Error(`Cannot access GitHub repository (${repoResponse.status}): ${detail}`);
    }

    const [users, settings] = await Promise.all([
      this.readRemoteFile('users.json', {}),
      this.readRemoteFile('settings.json', DEFAULT_SETTINGS)
    ]);

    this.cache.users = users && typeof users === 'object' && !Array.isArray(users) ? users : {};
    this.cache.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    this.initialized = true;
    console.log(`[DB] GitHub-only storage connected: ${this.owner}/${this.repo}`);
    console.log('[DB] No profile or settings data will be written to Kaggle storage.');
    return this;
  }

  async readRemoteFile(filename, fallback) {
    const response = await fetch(this.fileUrl(filename), {
      headers: this.getHeaders()
    });

    if (response.status === 404) return fallback;
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub read failed for ${filename} (${response.status}): ${detail}`);
    }

    const item = await response.json();
    if (!item?.content || !item?.sha) {
      throw new Error(`GitHub returned an invalid file response for ${filename}.`);
    }

    this.sha.set(filename, item.sha);
    const decoded = Buffer.from(item.content.replace(/\s/g, ''), 'base64').toString('utf8');
    try {
      return JSON.parse(decoded);
    } catch {
      throw new Error(`GitHub file database/${filename} does not contain valid JSON.`);
    }
  }

  async writeRemoteFile(filename, value) {
    if (!this.initialized) throw new Error('GitHub database is not initialized.');
    const url = this.fileUrl(filename);
    const content = `${JSON.stringify(value, null, 2)}\n`;

    // Serialize writes to the same JSON file and retry GitHub SHA conflicts.
    const previous = this.writeQueues.get(filename) || Promise.resolve();
    const current = previous.then(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        let sha = this.sha.get(filename);

        if (attempt > 0 || !sha) {
          const latest = await fetch(url, { headers: this.getHeaders() });
          if (latest.ok) {
            const latestFile = await latest.json();
            sha = latestFile.sha;
            this.sha.set(filename, sha);
          } else if (latest.status === 404) {
            sha = undefined;
            this.sha.delete(filename);
          } else {
            const detail = await latest.text();
            throw new Error(`GitHub refresh failed for ${filename} (${latest.status}): ${detail}`);
          }
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message: `Update Seha database: ${filename}`,
            content: Buffer.from(content, 'utf8').toString('base64'),
            ...(sha ? { sha } : {})
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.content?.sha) this.sha.set(filename, result.content.sha);
          return true;
        }

        const detail = await response.text();
        if (![409, 422].includes(response.status) || attempt === 2) {
          throw new Error(`GitHub write failed for ${filename} (${response.status}): ${detail}`);
        }
      }
      throw new Error(`Could not save ${filename} to GitHub after three attempts.`);
    });

    this.writeQueues.set(filename, current.catch(() => {}));
    return current;
  }

  get settings() {
    return this.cache.settings;
  }

  get users() {
    return this.cache.users;
  }

  async setSettings(patch) {
    const next = { ...this.cache.settings, ...patch };
    if (JSON.stringify(next) === JSON.stringify(this.cache.settings)) return false;
    await this.writeRemoteFile('settings.json', next);
    this.cache.settings = next;
    return true;
  }

  async setUser(id, profile) {
    if (!id) return false;
    if (JSON.stringify(this.cache.users[id]) === JSON.stringify(profile)) return false;
    const next = { ...this.cache.users, [id]: profile };
    await this.writeRemoteFile('users.json', next);
    this.cache.users = next;
    return true;
  }

  async deleteUser(id) {
    if (!id || !this.cache.users[id]) return false;
    const next = { ...this.cache.users };
    delete next[id];
    await this.writeRemoteFile('users.json', next);
    this.cache.users = next;
    return true;
  }
}
