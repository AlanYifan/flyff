import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = path.resolve(process.cwd())
const srcRoot = path.join(projectRoot, 'src')

const tryResolveWithExtension = resolvedPath => {
  if (path.extname(resolvedPath)) {
    return fs.existsSync(resolvedPath) ? resolvedPath : null
  }

  const candidates = [
    `${resolvedPath}.js`,
    `${resolvedPath}.mjs`,
    `${resolvedPath}.cjs`,
    path.join(resolvedPath, 'index.js'),
    path.join(resolvedPath, 'index.mjs'),
    path.join(resolvedPath, 'index.cjs')
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

export async function resolve (specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const requestPath = specifier.slice(2)
    const resolvedPath = path.join(srcRoot, requestPath)
    const filePath = tryResolveWithExtension(resolvedPath)
    if (filePath) {
      return { url: pathToFileURL(filePath).href, shortCircuit: true }
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !path.extname(specifier)) {
    try {
      const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : projectRoot
      const resolvedPath = path.resolve(path.dirname(parentPath), specifier)
      const filePath = tryResolveWithExtension(resolvedPath)
      if (filePath) {
        return { url: pathToFileURL(filePath).href, shortCircuit: true }
      }
    } catch {
      // ignore
    }
  }

  return nextResolve(specifier, context)
}

