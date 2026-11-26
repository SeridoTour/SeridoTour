import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  if (isPreview) {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
    let api: URL
    try {
      api = new URL(env.VITE_API_URL || '')
    } catch {
      throw new Error('Preview exige VITE_API_URL explícita com a URL HTTPS da API de desenvolvimento.')
    }
    if (
      api.protocol !== 'https:' || api.username || api.password ||
      ['northeastour.onrender.com', 'localhost', '127.0.0.1', '[::1]'].includes(api.hostname)
    ) {
      throw new Error('VITE_API_URL do preview deve apontar para a API HTTPS de desenvolvimento.')
    }
  }

  return {
    define: {
      'import.meta.env.VITE_GUIDE_SIGNUP_ENABLED': JSON.stringify(
        isPreview || (mode === 'development' && process.env.VITE_GUIDE_SIGNUP_ENABLED === 'true') ? 'true' : 'false',
      ),
    },
    // Preserva o suporte de navegadores usado pelo build anterior (Vite 5).
    build: { target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'] },
    plugins: [vue(), {
      name: 'preview-noindex',
      transformIndexHtml() {
        return isPreview ? [{
          tag: 'meta',
          attrs: { name: 'robots', content: 'noindex, nofollow, noarchive' },
          injectTo: 'head' as const,
        }] : []
      },
    }],
  }
})
