import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { handle } from 'https://deno.land/x/hono/adapter/netlify/mod.ts'

const app = new Hono()

app.get('/download/:repo/:owner/:version', (c) => {
  const repo = c.req.param('repo')
  const owner = c.req.param('owner')
  const cur_version = c.req.param('version')

  // Check if valid repo
  const isInIndex = (repo: string): Promise<{ ok: boolean, data: any }> => {
    const url = `https://index.winchteam.dev/${repo.toLowerCase()}/`;
    return fetch(url)
      .then((response: Response) =>
        response.json().then(data => ({ ok: response.ok, data }))
      );
  }

  const isValidRepo = (owner: string, repo: string): Promise<{ ok: boolean, data: any }> => {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    return fetch(url)
      .then((response: Response) =>
        response.json().then(data => ({ ok: response.ok, data }))
      );
  };

  const isWinchRepo = (owner: string, repo: string): Promise<{ ok: boolean, data: any }> => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/.winch`;
    return fetch(url)
      .then((response: Response) =>
        response.json().then(data => ({ ok: response.ok, data }))
      );
  }

  return Promise.all([isValidRepo(owner, repo), isWinchRepo(owner, repo), isInIndex(repo)])
    .then(([isValid, isWinch, isInIndex]) => {
      if (!isInIndex.ok) {
        return c.json({ message: 'Could not find package in repo', owner: owner, repo: repo, data: isInIndex.data });
      }
      if (!isValid.ok) {
        return c.json({ message: 'Invalid repo', owner: owner, repo: repo, data: isValid.data });
      }
      if (!isWinch.ok) {
        return c.json({ message: 'Not a Winch repo', owner: owner, repo: repo, data: isWinch.data });
      }
      return c.json({ 
        message: 'Success!',
        repo: repo,
        owner: owner, 
        version: cur_version, 
        download_url: `https://api.github.com/repos/${owner}/${repo}/releases/tags/${cur_version}`
      });
    });
})

export default handle(app)
