import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import JSZip from 'jszip'
import mammoth from 'mammoth'

const root = resolve(import.meta.dirname, '..')
const sourcePath = resolve(root, 'contract-fullright.dotx')
const templatePath = resolve(root, 'templates/contract-fullright/contract-fullright.template.docx')
const skeletonPath = resolve(root, 'templates/contract-fullright/skeleton.html')

function convertDotxContentTypes(xml) {
  return xml.replace(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
  )
}

function wrapSkeletonHtml(body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 32px; background: #f8f8f6; color: #111; font-family: "Times New Roman", serif; line-height: 1.45; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #888; padding: 4px 6px; vertical-align: top; }
    p { margin: 0 0 8px; }
  </style>
</head>
<body>
${body}
</body>
</html>
`
}

async function generateTemplateDocx() {
  const source = await readFile(sourcePath)
  const zip = await JSZip.loadAsync(source)
  const contentTypes = zip.file('[Content_Types].xml')

  if (contentTypes) {
    const xml = await contentTypes.async('string')
    zip.file('[Content_Types].xml', convertDotxContentTypes(xml))
  }

  await mkdir(dirname(templatePath), { recursive: true })
  const output = await zip.generateAsync({ type: 'nodebuffer' })
  await writeFile(templatePath, output)
}

async function generateSkeleton() {
  const result = await mammoth.convertToHtml({ path: sourcePath })
  await mkdir(dirname(skeletonPath), { recursive: true })
  await writeFile(skeletonPath, wrapSkeletonHtml(result.value), 'utf8')
}

await generateTemplateDocx()
await generateSkeleton()
