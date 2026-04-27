import { coerceDocumentKind, DocumentKind } from '@shared/schema/document-kind'
import AnnexNewstoreFormView from './forms/annex-newstore/AnnexNewstoreFormView'
import ContractFullrightFormView from './forms/contract-fullright/ContractFullrightFormView'

interface Props {
  draftId: string
  templateId: string
  onBack: () => void
  onOpenSettings: () => void
}

export default function FormView(props: Props) {
  const kind = coerceDocumentKind(props.templateId)

  if (kind === DocumentKind.AnnexNewstore) {
    return <AnnexNewstoreFormView {...props} documentKind={kind} />
  }

  return <ContractFullrightFormView {...props} documentKind={DocumentKind.ContractFullright} />
}
