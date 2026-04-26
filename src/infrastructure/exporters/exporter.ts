export interface Exporter<TInput, TOutput = Uint8Array> {
  readonly id: string
  readonly fileExtension: string
  export(input: TInput): Promise<TOutput>
}
