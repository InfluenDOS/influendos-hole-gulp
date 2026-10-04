import { defineConfig, type Plugin } from 'vite'

function portalHtml(portal: string, gdGameId: string, gmGameId: string): Plugin {
  return {
    name: 'portal-html',
    transformIndexHtml(html) {
      if (portal === 'none') return html
      let next = html
        .replace('<html lang="zh-CN">', '<html lang="en">')
        .replace('<title>黑洞一口吞</title>', '<title>Table Gulp</title>')
        .replace(
          'content="黑洞一口吞：拖动地面上的黑洞，把立体食物吞进洞里。"',
          'content="Table Gulp: drag a hole across the table and swallow the snacks."',
        )
      const sdk =
        portal === 'crazygames'
          ? `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js" async onload="window.__portalSdk='crazygames'" onerror="window.__portalSdk='failed'"></script>`
          : portal === 'gamedistribution'
            ? `<script>window.GD_OPTIONS={gameId:${JSON.stringify(gdGameId)},advertisementSettings:{autoplay:false},onEvent:function(event){window.__gdOnEvent&&window.__gdOnEvent(event)}};</script><script src="https://html5.api.gamedistribution.com/main.min.js" async onload="window.__portalSdk='gamedistribution'" onerror="window.__portalSdk='failed'"></script>`
            : portal === 'gamemonetize'
              ? `<script>window.SDK_OPTIONS={gameId:${JSON.stringify(gmGameId)},onEvent:function(event){window.__gmOnEvent&&window.__gmOnEvent(event)}};</script><script id="gamemonetize-sdk" src="https://api.gamemonetize.com/sdk.js" async onload="window.__portalSdk='gamemonetize'" onerror="window.__portalSdk='failed'"></script>`
              : ''
      if (!sdk) return next
      return next.replace('</head>', `    ${sdk}\n  </head>`)
    },
  }
}

export default defineConfig(() => {
  const requested = process.env.VITE_PORTAL || 'none'
  const portal =
    requested === 'crazygames' || requested === 'gamedistribution' || requested === 'gamemonetize' ? requested : 'none'
  const gdGameId = process.env.VITE_GD_GAME_ID || ''
  const gmGameId = process.env.VITE_GM_GAME_ID || ''
  return {
    base: './',
    // A shell VITE_* variable is visible here, but Vite does not copy it into
    // import.meta.env unless it is also listed in an env file. Inject it directly.
    define: {
      __PORTAL_ID__: JSON.stringify(portal),
    },
    plugins: [portalHtml(portal, gdGameId, gmGameId)],
    server: {
      host: '0.0.0.0',
      port: 4317,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4317,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      target: 'es2022',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 800,
    },
  }
})
