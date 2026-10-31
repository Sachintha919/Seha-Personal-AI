import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonDatabase } from '../src/database.js';

const originalFetch = globalThis.fetch;
const settings = {
  privateEnabled: true,
  groupsEnabled: false,
  onlyMe: false,
  welcomeEnabled: true,
  language: 'auto',
  maxMediaMb: 15
};

function mockGitHub(failUsers = false) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    calls.push({ url: String(url), method });
    if (String(url) === 'https://api.github.com/repos/test-owner/test-repo') {
      return new Response(JSON.stringify({ private: false }), { status: 200 });
    }
    if (String(url).endsWith('/contents/database/users.json') && method === 'GET') {
      if (failUsers) return new Response('Unavailable', { status: 503 });
      return new Response(JSON.stringify({
        sha: 'users-sha',
        content: Buffer.from('{}').toString('base64')
      }), { status: 200 });
    }
    if (String(url).endsWith('/contents/database/settings.json') && method === 'GET') {
      return new Response(JSON.stringify({
        sha: 'settings-sha',
        content: Buffer.from(JSON.stringify(settings)).toString('base64')
      }), { status: 200 });
    }
    if (String(url).includes('/contents/database/') && method === 'PUT') {
      return new Response(JSON.stringify({ content: { sha: 'new-sha' } }), { status: 200 });
    }
    return new Response('Unexpected request', { status: 500 });
  };
  return calls;
}

test('GitHub token is mandatory and no local database directory is configured', async () => {
  const db = new JsonDatabase({ owner: 'test-owner', repo: 'test-repo', token: '' });
  await assert.rejects(() => db.init(), /GitHub-only storage requires/);
  assert.equal(Object.hasOwn(db, 'baseDir'), false);
});

test('profiles and settings are written through GitHub API only', async () => {
  const calls = mockGitHub();
  try {
    const db = await new JsonDatabase({
      owner: 'test-owner', repo: 'test-repo', token: 'test-token'
    }).init();
    await db.setUser('12345@s.whatsapp.net', { name: 'Test User', age: 20 });
    await db.setSettings({ language: 'sinhala' });
    const writes = calls.filter((call) => call.method === 'PUT');
    assert.equal(writes.length, 2);
    assert.ok(writes.some((call) => call.url.endsWith('/contents/database/users.json')));
    assert.ok(writes.some((call) => call.url.endsWith('/contents/database/settings.json')));
    assert.equal(Object.hasOwn(db, 'baseDir'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GitHub read failures throw instead of falling back to local files', async () => {
  mockGitHub(true);
  try {
    const db = new JsonDatabase({
      owner: 'test-owner', repo: 'test-repo', token: 'test-token'
    });
    await assert.rejects(() => db.init(), /GitHub read failed for users.json/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
