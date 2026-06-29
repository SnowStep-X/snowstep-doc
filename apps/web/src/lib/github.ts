const REPO_OWNER = 'SnowStep-X'
const REPO_NAME = 'snowstep-doc'
const BRANCH = 'main'
const CONTENT_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`

export interface GithubConfig {
  token: string
}

export interface ArticleFile {
  path: string          // e.g. "apps/web/src/content/articles/welcome.md"
  sha: string | null    // null when creating new
  content: string       // base64
  size: number
}

export class GithubError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function readArticle(slug: string, token: string): Promise<ArticleFile | null> {
  const path = `apps/web/src/content/articles/${slug}.md`
  const url = `${CONTENT_BASE}/${path}?ref=${BRANCH}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (res.status === 404) return null
  if (!res.ok) throw new GithubError(`read failed: ${res.statusText}`, res.status)
  const json = await res.json()
  return {
    path: json.path,
    sha: json.sha,
    content: json.content,
    size: json.size,
  }
}

export interface WriteResult {
  commitSha: string
  path: string
}

export async function createOrUpdateArticle(
  slug: string,
  markdown: string,
  existingSha: string | null,
  commitMessage: string,
  token: string,
): Promise<WriteResult> {
  const path = `apps/web/src/content/articles/${slug}.md`
  const url = `${CONTENT_BASE}/${path}`
  const body: Record<string, unknown> = {
    message: commitMessage,
    branch: BRANCH,
    content: btoa(unescape(encodeURIComponent(markdown))),
  }
  if (existingSha) body.sha = existingSha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    throw new GithubError('conflict: file changed on GitHub, please reload and retry', 409)
  }
  if (res.status === 401 || res.status === 403) {
    throw new GithubError('auth failed: check your token in /settings', res.status)
  }
  if (!res.ok) {
    const text = await res.text()
    throw new GithubError(`write failed: ${res.statusText} - ${text}`, res.status)
  }
  const json = await res.json()
  return { commitSha: json.commit.sha, path: json.content.path }
}

export async function deleteArticle(
  slug: string,
  sha: string,
  commitMessage: string,
  token: string,
): Promise<void> {
  const path = `apps/web/src/content/articles/${slug}.md`
  const url = `${CONTENT_BASE}/${path}`
  const body = {
    message: commitMessage,
    branch: BRANCH,
    sha,
  }
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new GithubError(`delete failed: ${res.statusText}`, res.status)
  }
}

export function loadToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('snowstep:github_token')
}

export function saveToken(token: string) {
  localStorage.setItem('snowstep:github_token', token)
}

export function clearToken() {
  localStorage.removeItem('snowstep:github_token')
}
