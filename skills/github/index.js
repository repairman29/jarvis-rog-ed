/**
 * GitHub skill — connect with PAT: repos, issues, PRs, workflow_dispatch (workers/subagents).
 * Requires: GITHUB_TOKEN in ~/.clawdbot/.env or environment.
 * API: https://api.github.com
 */

(function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const candidates = [
    path.join(home, '.clawdbot', '.env'),
    process.env.CLAWDBOT_ENV,
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(process.cwd(), '..', '..', '.env')
  ].filter(Boolean);
  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) {
          const val = m[2].replace(/^["']|["']$/g, '').replace(/\r/g, '').trim();
          if (!process.env[m[1]] || process.env[m[1]].startsWith('your_')) process.env[m[1]] = val;
        }
      });
    } catch (_) {}
  }
})();

const API_BASE = 'https://api.github.com';

function getToken() {
  const v = process.env.GITHUB_TOKEN;
  if (!v || v.startsWith('your_')) throw new Error('GITHUB_TOKEN not set. Add it to ~/.clawdbot/.env');
  return v;
}

async function ghFetch(path, options = {}) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...(options.body && typeof options.body === 'object' && !(options.body instanceof ArrayBuffer) ? { body: JSON.stringify(options.body) } : options.body ? { body: options.body } : {}),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || text || res.statusText;
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }
  return data;
}

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

module.exports = {
  async github_status() {
    try {
      getToken();
    } catch (e) {
      return { ok: false, error: e.message, hint: 'Add GITHUB_TOKEN to ~/.clawdbot/.env' };
    }
    try {
      await ghFetch('/user');
      return { ok: true, message: 'GitHub connected. PAT is valid.' };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async github_repos({ owner, type = 'all', sort = 'updated', per_page = 30 } = {}) {
    const path = owner ? `/orgs/${encodeURIComponent(owner)}/repos` : '/user/repos';
    const params = { sort, per_page };
    if (!owner) params.type = type;
    const data = await ghFetch(path + qs(params));
    return {
      success: true,
      owner: owner || 'current user',
      count: Array.isArray(data) ? data.length : 0,
      repos: (Array.isArray(data) ? data : []).map((r) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        default_branch: r.default_branch,
        html_url: r.html_url,
      })),
    };
  },

  async github_issues({ action = 'list', owner, repo, title, body, issue_number, state = 'open', labels, per_page = 20 } = {}) {
    if (action !== 'list' && (!owner || !repo)) {
      throw new Error('owner and repo are required for create, comment, get');
    }
    const slug = `${owner}/${repo}`;

    if (action === 'list') {
      const path = owner && repo ? `/repos/${slug}/issues` : '/user/issues';
      const params = { state, per_page };
      if (owner && repo) params.labels = Array.isArray(labels) ? labels.join(',') : undefined;
      const data = await ghFetch((owner && repo ? `/repos/${slug}/issues` : '/user/issues') + qs(params));
      return {
        success: true,
        action: 'list',
        count: Array.isArray(data) ? data.length : 0,
        issues: (Array.isArray(data) ? data : []).map((i) => ({
          number: i.number,
          title: i.title,
          state: i.state,
          html_url: i.html_url,
          user: i.user && i.user.login,
        })),
      };
    }

    if (action === 'create') {
      if (!title) throw new Error('title is required to create an issue');
      const data = await ghFetch(`/repos/${slug}/issues`, {
        method: 'POST',
        body: { title, body: body || '', labels: Array.isArray(labels) ? labels : undefined },
      });
      return {
        success: true,
        action: 'create',
        number: data.number,
        title: data.title,
        html_url: data.html_url,
      };
    }

    if (action === 'comment') {
      if (issue_number == null) throw new Error('issue_number is required to comment');
      if (!body) throw new Error('body is required to comment');
      const data = await ghFetch(`/repos/${slug}/issues/${issue_number}/comments`, {
        method: 'POST',
        body: { body },
      });
      return {
        success: true,
        action: 'comment',
        issue_number,
        comment_url: data.html_url,
      };
    }

    if (action === 'get') {
      if (issue_number == null) throw new Error('issue_number is required for get');
      const data = await ghFetch(`/repos/${slug}/issues/${issue_number}`);
      return {
        success: true,
        action: 'get',
        number: data.number,
        title: data.title,
        state: data.state,
        body: data.body,
        html_url: data.html_url,
        user: data.user && data.user.login,
      };
    }

    throw new Error(`Unknown action: ${action}`);
  },

  async github_pulls({ action = 'list', owner, repo, title, body, head, base = 'main', pull_number, state = 'open', per_page = 20 } = {}) {
    if (!owner || !repo) throw new Error('owner and repo are required');
    const slug = `${owner}/${repo}`;

    if (action === 'list') {
      const data = await ghFetch(`/repos/${slug}/pulls` + qs({ state, per_page }));
      return {
        success: true,
        action: 'list',
        count: Array.isArray(data) ? data.length : 0,
        pulls: (Array.isArray(data) ? data : []).map((p) => ({
          number: p.number,
          title: p.title,
          state: p.state,
          head: p.head && p.head.ref,
          base: p.base && p.base.ref,
          html_url: p.html_url,
        })),
      };
    }

    if (action === 'create') {
      if (!title || !head) throw new Error('title and head are required to create a PR');
      const data = await ghFetch(`/repos/${slug}/pulls`, {
        method: 'POST',
        body: { title, body: body || '', head, base },
      });
      return {
        success: true,
        action: 'create',
        number: data.number,
        title: data.title,
        html_url: data.html_url,
      };
    }

    if (action === 'get') {
      if (pull_number == null) throw new Error('pull_number is required for get');
      const data = await ghFetch(`/repos/${slug}/pulls/${pull_number}`);
      return {
        success: true,
        action: 'get',
        number: data.number,
        title: data.title,
        state: data.state,
        body: data.body,
        html_url: data.html_url,
        head: data.head && data.head.ref,
        base: data.base && data.base.ref,
      };
    }

    throw new Error(`Unknown action: ${action}`);
  },

  async github_workflow_dispatch({ owner, repo, workflow_id, ref = 'main', inputs } = {}) {
    if (!owner || !repo || !workflow_id) throw new Error('owner, repo, and workflow_id are required');
    await ghFetch(`/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow_id)}/dispatches`, {
      method: 'POST',
      body: { ref, inputs: inputs || {} },
    });
    return {
      success: true,
      message: `Workflow ${workflow_id} dispatched on ${ref}`,
      owner,
      repo,
      workflow_id,
      ref,
    };
  },

  async github_branches({ owner, repo, per_page = 30 } = {}) {
    if (!owner || !repo) throw new Error('owner and repo are required');
    const data = await ghFetch(`/repos/${owner}/${repo}/branches` + qs({ per_page }));
    return {
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      branches: (Array.isArray(data) ? data : []).map((b) => ({ name: b.name, protected: b.protected })),
    };
  },

  async github_workflows({ owner, repo, per_page = 30 } = {}) {
    if (!owner || !repo) throw new Error('owner and repo are required');
    const data = await ghFetch(`/repos/${owner}/${repo}/actions/workflows` + qs({ per_page }));
    const list = (data && data.workflows) || [];
    return {
      success: true,
      count: list.length,
      workflows: list.map((w) => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
      })),
    };
  },
};
