import sharp from 'sharp'
import { readFileSync } from 'fs'
import path from 'path'

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public/icon-source.svg')
  const svg = readFileSync(svgPath)

  // Generate 192x192 (PWA manifest)
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png')
  console.log('✅ icon-192.png')

  // Generate 512x512 (PWA manifest)
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png')
  console.log('✅ icon-512.png')

  // Generate Apple touch icon (180x180)
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png')
  console.log('✅ apple-touch-icon.png')

  // Generate favicon (32x32)
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png')
  console.log('✅ favicon-32x32.png')

  // Generate favicon.ico size (16x16)
  await sharp(svg)
    .resize(16, 16)
    .png()
    .toFile('public/favicon-16x16.png')
  console.log('✅ favicon-16x16.png')

  console.log('\n🎉 All icons generated!')
}

generateIcons().catch(console.error)
