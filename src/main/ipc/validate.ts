import type { z } from 'zod'

export class IpcValidationError extends Error {
  constructor(
    readonly channel: string,
    readonly issues: z.ZodIssue[]
  ) {
    super(`Invalid IPC payload for ${channel}: ${issues.map((issue) => issue.message).join('; ')}`)
    this.name = 'IpcValidationError'
  }
}

export function parseRequest<TSchema extends z.ZodTypeAny>(
  channel: string,
  schema: TSchema,
  payload: unknown
): z.output<TSchema> {
  const result = schema.safeParse(payload)
  if (!result.success) throw new IpcValidationError(channel, result.error.issues)
  return result.data
}

export function parseResponse<TSchema extends z.ZodTypeAny>(
  channel: string,
  schema: TSchema,
  payload: unknown
): z.output<TSchema> {
  const result = schema.safeParse(payload)
  if (!result.success) throw new IpcValidationError(`${channel}:response`, result.error.issues)
  return result.data
}
