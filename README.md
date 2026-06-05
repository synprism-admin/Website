# SynPrysm.io

**AI Systems in Perfect Synthesis**

Official website for [SynPrysm.io](https://synprism.io) — an AI integration and consulting firm bridging the gap between people and AI.

## Stack

- **Hosting:** GitHub Pages (free)
- **CDN / DNS / SSL:** Cloudflare (free)
- **No frameworks** — pure HTML, CSS, and vanilla JS for maximum performance and zero dependencies

## Local Development

Just open `index.html` in your browser. No build step required.

## Deployment

Pushes to `main` automatically deploy via GitHub Actions → GitHub Pages.

## Cloudflare Setup

1. In Cloudflare DNS, add a CNAME record:  
   `www` → `synprism-admin.github.io`
2. For apex domain (`synprism.io`), add A records pointing to GitHub Pages IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. In GitHub repo Settings → Pages → Custom domain: set `synprism.io`
4. Enable **Full (strict) SSL** in Cloudflare SSL/TLS settings
5. Enable **Always Use HTTPS** redirect rule in Cloudflare

## Contact Form

The contact form uses [Formspree](https://formspree.io) (free tier).  
Replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `index.html` with your Formspree endpoint after signup.

## Services

- AI Security
- AI Integration  
- AI Cold Callers
- AI Note Takers
- AI CRM
- AI Tools
- AI Professional Assistants
- Bespoke AI Solutions

---

*One lens. Infinite synchronization.*
