import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { handle } from 'https://deno.land/x/hono/adapter/netlify/mod.ts'

const app = new Hono()

app.get('/download/:repo/:owner/:version', async (c) => {
  const repo = c.req.param('repo')
  const owner = c.req.param('owner')
  const cur_version = c.req.param('version')

  // Check if valid repo
  const isInIndex = async (repo: string): Promise<{ ok: boolean, data?: any }> => {
    const url = `https://index.winchteam.dev/${repo.toLowerCase()}/`;
    try {
      const response = await fetch(url)
      const data = await response.json().catch(() => null)
      return { ok: response.ok, data }
    } catch (error) {
      return { ok: false, data: error }
    }
  }

  const isValidRepo = async (owner: string, repo: string): Promise<{ ok: boolean, data?: any }> => {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    try {
      const response = await fetch(url)
      const data = await response.json().catch(() => null)
      return { ok: response.ok, data }
    } catch (error) {
      return { ok: false, data: error }
    }
  }

  const isWinchRepo = async (owner: string, repo: string): Promise<{ ok: boolean, data?: any }> => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/.winch`;
    try {
      const response = await fetch(url)
      const data = await response.json().catch(() => null)
      return { ok: response.ok, data }
    } catch (error) {
      return { ok: false, data: error }
    }
  }

  try {
    const [isValid, isWinch, isInIndexResult] = await Promise.all([
      isValidRepo(owner, repo),
      isWinchRepo(owner, repo),
      isInIndex(repo)
    ])

    if (!isInIndexResult.ok) {
      return c.json({ message: 'Could not find package in repo', owner: owner, repo: repo, data: isInIndexResult.data })
    }
    if (!isValid.ok) {
      return c.json({ message: 'Invalid repo', owner: owner, repo: repo, data: isValid.data })
    }
    if (!isWinch.ok) {
      return c.json({ message: 'Not a Winch repo', owner: owner, repo: repo, data: isWinch.data })
    }

    return c.json({
      message: 'Success!',
      repo: repo,
      owner: owner,
      version: cur_version,
      download_url: `https://api.github.com/repos/${owner}/${repo}/releases/tags/${cur_version}`
    })
  } catch (error) {
    return c.json({ message: 'Internal Server Error', error: error.message }, 500)
  }
})

app.get("/getUser/:repo", async (c) => {
  const repo = c.req.params.repo;
  const url = `https://index.winchteam.dev/${repo.toLowerCase()}/`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const authorElement = doc.getElementsByClassName("elem")[0];
    const author = authorElement ? authorElement.innerText.replace("Author :", "").trim() : null;

    return c.json({ author });
  } catch (error) {
    console.error('Error fetching author:', error);
    return c.json({ error: 'Unable to fetch author' }, 500);
  }
});


export default handle(app)
