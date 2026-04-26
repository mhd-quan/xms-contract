import type { AnnexNewstore } from '@shared/schema/annex-newstore'
import { DocumentKind } from '@shared/schema/document-kind'
import type { DocumentLogic } from '../document-logic'

export type AnnexNewstoreForm = Readonly<AnnexNewstore>
export type AnnexNewstorePreviewModel = Record<string, never>

function normalizeFormData(_input: unknown): AnnexNewstoreForm {
  void _input
  return {}
}

function deriveDraftTitle(_form: AnnexNewstoreForm): string {
  void _form
  return 'Annex New Store'
}

function buildPreviewModel(_form: AnnexNewstoreForm): AnnexNewstorePreviewModel {
  void _form
  return {}
}

function buildReplacements(_form: AnnexNewstoreForm, _preview: AnnexNewstorePreviewModel) {
  void _form
  void _preview
  return {
    clickReplacements: {},
    specialTextReplacements: {}
  }
}

export const annexNewstoreLogic = {
  kind: DocumentKind.AnnexNewstore,
  normalizeFormData,
  deriveDraftTitle,
  buildPreviewModel,
  buildReplacements
} satisfies DocumentLogic<
  AnnexNewstoreForm,
  AnnexNewstorePreviewModel,
  Record<string, string>,
  Record<string, string>
>
