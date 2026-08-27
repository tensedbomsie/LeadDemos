const fs = require('fs')
const path = require('path')

const leadsDir = path.join(__dirname, 'leads')
const distDir = path.join(__dirname, 'dist')
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8')

fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const files = fs.readdirSync(leadsDir).filter(f => f.endsWith('.json'))
const built = []

for (const file of files) {
  const lead = JSON.parse(fs.readFileSync(path.join(leadsDir, file), 'utf8'))
  const slug = lead.slug || path.basename(file, '.json')

  const servicesHtml = (lead.services || [])
    .map(s => `<div class="service-row"><span>${escapeHtml(s.name)}</span><span class="price">${escapeHtml(s.price)}</span></div>`)
    .join('\n      ')

  const ogTitle = escapeHtml(lead.tagline || `Custom booking system for ${lead.shopName}`)
  const ogDescription = escapeHtml(lead.painPoint || '')
  const ogImageTag = lead.ogImage
    ? `<meta property="og:image" content="${escapeHtml(lead.ogImage)}">`
    : ''

  const defaultFeatures = [
    'Clients book 24/7, no missed calls',
    'One-time cost, no monthly fee',
    'You still confirm details by call/text',
    'Payments land straight in your account',
  ]
  const featuresHtml = (lead.features || defaultFeatures)
    .map(f => `<div class="feature"><span class="dot"></span>${escapeHtml(f)}</div>`)
    .join('\n      ')

  const accent = lead.accentColor || '#D6552B'
  const accentDark = lead.accentColorDark || accent
  const separator = lead.demoUrl.includes('?') ? '&' : '?'
  const demoUrlWithLead = `${lead.demoUrl}${separator}lead=${encodeURIComponent(slug)}`

  let html = template
    .replaceAll('{{ACCENT}}', accent)
    .replaceAll('{{ACCENT_DARK}}', accentDark)
    .replaceAll('{{SHOP_NAME}}', escapeHtml(lead.shopName))
    .replaceAll('{{TAGLINE}}', ogTitle)
    .replaceAll('{{PAIN_POINT}}', escapeHtml(lead.painPoint || ''))
    .replaceAll('{{SERVICES_HTML}}', servicesHtml)
    .replaceAll('{{FEATURES_HTML}}', featuresHtml)
    .replaceAll('{{DEMO_URL}}', escapeHtml(demoUrlWithLead))
    .replaceAll('{{OG_TITLE}}', ogTitle)
    .replaceAll('{{OG_DESCRIPTION}}', ogDescription)
    .replaceAll('{{OG_IMAGE_TAG}}', ogImageTag)

  const outDir = path.join(distDir, slug)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html)

  const leadsOutDir = path.join(distDir, 'leads')
  fs.mkdirSync(leadsOutDir, { recursive: true })
  fs.writeFileSync(path.join(leadsOutDir, `${slug}.json`), JSON.stringify({
    businessName: lead.shopName,
    phone: lead.phone || null,
  }))

  built.push(slug)
}

console.log(`Built ${built.length} lead page(s): ${built.join(', ')}`)
