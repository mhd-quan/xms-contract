import { DocumentKind } from '@shared/schema/document-kind'
import type { DocumentLogic } from '../document-logic'
import { buildPreviewModel } from './build-preview-model'
import { buildClickReplacements, buildSpecialTextReplacements, type SpecialTextReplacements } from './build-replacements'
import { deriveDraftTitle } from './derive-draft-title'
import { normalizeContractFullrightForm } from './normalize-form-data'
import type { ContractFullrightForm, ContractPreviewModel } from './types'

export * from './build-preview-model'
export * from './build-replacements'
export * from './derive-draft-title'
export * from './normalize-form-data'
export * from './types'
export { formatDate, formatDateLong } from '../../date'
export { formatMoney } from '../../pricing'

function buildContractFullrightReplacements(
  form: ContractFullrightForm,
  preview: ContractPreviewModel
) {
  void preview
  return {
    clickReplacements: buildClickReplacements(form),
    specialTextReplacements: buildSpecialTextReplacements(form)
  }
}

export const contractFullrightLogic = {
  kind: DocumentKind.ContractFullright,
  normalizeFormData: normalizeContractFullrightForm,
  deriveDraftTitle,
  buildPreviewModel,
  buildReplacements: buildContractFullrightReplacements
} satisfies DocumentLogic<
  ContractFullrightForm,
  ContractPreviewModel,
  string[],
  SpecialTextReplacements
>
