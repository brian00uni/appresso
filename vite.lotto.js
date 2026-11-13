import handler from './api/lotto.js'
export function lottoApi() {
  function install(server) {
    server.middlewares.use('/api/lotto', (req,res,next) => {
      const url = new URL(req.url, 'http://localhost')
      if (url.pathname !== '/' && url.pathname !== '') return next()
      req.query = Object.fromEntries(url.searchParams)
      res.status = code => { res.statusCode = code; return res }
      res.json = body => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); return res }
      handler(req,res).catch(next)
    })
  }
  return { name:'lotto-api', configureServer: install, configurePreviewServer: install }
}
