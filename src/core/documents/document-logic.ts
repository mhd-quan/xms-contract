import type { DocumentKind } from '@shared/schema/document-kind'

export interface DocumentReplacements<
  TClickReplacements = Record<string, string>,
  TSpecialTextReplacements = Record<string, string | null>
> {
  clickReplacements: TClickReplacements
  specialTextReplacements: TSpecialTextReplacements
}

export interface DocumentLogic<
  TForm,
  TPreview,
  TClickReplacements = Record<string, string>,
  TSpecialTextReplacements = Record<string, string | null>
> {
  readonly kind: DocumentKind
  normalizeFormData(input: unknown): TForm
  deriveDraftTitle(form: TForm): string
  buildPreviewModel(form: TForm): TPreview
  buildReplacements(
    form: TForm,
    preview: TPreview
  ): DocumentReplacements<TClickReplacements, TSpecialTextReplacements>
}
