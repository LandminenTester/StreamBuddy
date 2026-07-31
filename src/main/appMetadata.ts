import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppMetadata } from '@shared/types/appInfo'
import { logger } from './logger'

interface PackageJsonShape {
  author?: string
  license?: string
  repository?: { url?: string }
}

const FALLBACK_METADATA: AppMetadata = {
  author: 'Unbekannt',
  license: 'Unbekannt',
  repositoryUrl: null
}

function normalizeRepositoryUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null
  return rawUrl.replace(/^git\+/, '').replace(/\.git$/, '')
}

/** Liest Autor/Lizenz/Repo-URL aus der mitgelieferten package.json (Dev und gepackt: beide im App-Root). */
export function getAppMetadata(): AppMetadata {
  try {
    const path = join(app.getAppPath(), 'package.json')
    const pkg = JSON.parse(readFileSync(path, 'utf-8')) as PackageJsonShape
    return {
      author: pkg.author ?? FALLBACK_METADATA.author,
      license: pkg.license ?? FALLBACK_METADATA.license,
      repositoryUrl: normalizeRepositoryUrl(pkg.repository?.url)
    }
  } catch (error) {
    logger.warn('Konnte package.json nicht lesen/parsen', error)
    return FALLBACK_METADATA
  }
}
