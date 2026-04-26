import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { IPC } from '@shared/ipc/channels'
import { IpcValidationError, parseRequest, parseResponse } from './validate'

describe('IPC validation helpers', () => {
  it('adds channel context to request validation failures', () => {
    expect(() => parseRequest(IPC.draft.save, z.object({ id: z.string() }), {}))
      .toThrow(IpcValidationError)
    expect(() => parseRequest(IPC.draft.save, z.object({ id: z.string() }), {}))
      .toThrow(IPC.draft.save)
  })

  it('adds channel context to response validation failures', () => {
    expect(() => parseResponse(IPC.settings.get, z.object({ ok: z.literal(true) }), {}))
      .toThrow(`${IPC.settings.get}:response`)
  })
})
