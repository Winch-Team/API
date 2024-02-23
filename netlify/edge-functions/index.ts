import { handle } from 'hono/netlify'
import { Hono } from 'hono'

const app = new Hono()

app.get('/download/:repo/:owner/:version', (c) => {
  const repo = c.req.param('repo')
  const owner = c.req.param('owner')
  const cur_version = c.req.param('version')

  return c.json({ 
    repo: repo,
    owner: owner, 
    version: cur_version, 
    download_url: `https://api.github.com/repos/${owner}/${repo}/releases/tags/${cur_version}`
  })
})

export default app as never

export const GET = handle(app)
