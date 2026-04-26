import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, JsonSettingsRepository } from './settings-repository'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'xms-settings-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('JsonSettingsRepository', () => {
  it('loads defaults when file is missing', async () => {
    const repo = new JsonSettingsRepository({ settingsPath: join(dir, 'settings.json') })

    await expect(repo.load()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('loads valid settings from disk', async () => {
    const settingsPath = join(dir, 'settings.json')
    await writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS), 'utf-8')

    await expect(new JsonSettingsRepository({ settingsPath }).load()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('falls back to defaults when JSON is corrupt', async () => {
    const settingsPath = join(dir, 'settings.json')
    await writeFile(settingsPath, '{bad-json', 'utf-8')

    await expect(new JsonSettingsRepository({ settingsPath }).load()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('saves settings round-trip', async () => {
    const settingsPath = join(dir, 'nested/settings.json')
    const repo = new JsonSettingsRepository({ settingsPath })
    const settings = {
      ...DEFAULT_SETTINGS,
      defaults: { ...DEFAULT_SETTINGS.defaults, vatPct: 8 }
    }

    await repo.save(settings)

    expect(JSON.parse(await readFile(settingsPath, 'utf-8'))).toEqual(settings)
    await expect(repo.load()).resolves.toEqual(settings)
  })
})
