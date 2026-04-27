import { memo, useMemo } from 'react'
import { buildPreviewModel, formatMoney } from '@core/documents/contract-fullright'
import { ContractFullrightSchema } from '@shared/schema/contract-fullright'
import { useDraftStore } from '../stores/draft-store'

interface Props {
  activeTab: 'main' | 'app1' | 'app2'
  onTabChange: (tab: 'main' | 'app1' | 'app2') => void
}

function PreviewPane({ activeTab, onTabChange }: Props) {
  const formData = useDraftStore((state) => state.formData)
  const stores = useDraftStore((state) => state.stores)
  const model = useMemo(() => {
    const parsed = ContractFullrightSchema.parse({ ...formData, stores })
    return buildPreviewModel(parsed)
  }, [formData, stores])

  return (
    <div className="preview-pane">
      <div className="preview-tabs">
        {(['main','app1','app2'] as const).map(t => (
          <button key={t} className={`preview-tab${activeTab === t ? ' active' : ''}`} onClick={() => onTabChange(t)}>
            {t === 'main' ? 'Main Contract' : t === 'app1' ? 'Appendix 1' : 'Appendix 2'}
          </button>
        ))}
      </div>
      <div className="preview-frame">
        <article className="live-doc">
          {activeTab === 'main' && (
            <>
              <header className="live-doc-header">
                <span>HỢP ĐỒNG DỊCH VỤ NHẠC NỀN</span>
                <strong>{model.contractNo}</strong>
              </header>
              <section className="live-doc-section">
                <h3>Party B</h3>
                <dl className="live-doc-grid">
                  <dt>Tên công ty</dt><dd>{model.partyBName}</dd>
                  <dt>Địa chỉ</dt><dd>{model.partyBAddress}</dd>
                  <dt>Mã số thuế</dt><dd>{model.partyBTaxCode}</dd>
                  <dt>Điện thoại</dt><dd>{model.partyBPhone}</dd>
                  <dt>Đại diện</dt><dd>{model.partyBRepresentative}</dd>
                  <dt>Chức vụ</dt><dd>{model.partyBPosition}</dd>
                </dl>
              </section>
              <section className="live-doc-section">
                <h3>Contract Terms</h3>
                <p>Ngày ký: <strong>{model.signedDate}</strong></p>
                <p>Thời hạn sử dụng: <strong>{model.termRange}</strong></p>
              </section>
            </>
          )}

          {activeTab === 'app1' && (
            <>
              <header className="live-doc-header">
                <span>PHỤ LỤC 1 · DANH SÁCH CỬA HÀNG</span>
                <strong>{model.stores.length} rows</strong>
              </header>
              <table className="live-doc-table">
                <thead><tr><th>#</th><th>Cửa hàng</th><th>Địa chỉ</th><th>Thời hạn</th><th>Tháng</th></tr></thead>
                <tbody>
                  {model.stores.length === 0 ? (
                    <tr><td colSpan={5}>Chưa có cửa hàng nào.</td></tr>
                  ) : model.stores.map((store, index) => (
                    <tr key={store.id || index}>
                      <td>{index + 1}</td>
                      <td>{store.name || '................'}</td>
                      <td>{store.address || '................'}</td>
                      <td>{store.usingTerm || '................'}</td>
                      <td>{store.months || '...'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={4}>Tổng số tháng</td><td>{model.totalMonths || '...'}</td></tr></tfoot>
              </table>
            </>
          )}

          {activeTab === 'app2' && (
            <>
              <header className="live-doc-header">
                <span>PHỤ LỤC 2 · PHÍ DỊCH VỤ</span>
                <strong>{formatMoney(model.grandTotal)}</strong>
              </header>
              <table className="live-doc-table">
                <thead><tr><th>Nội dung</th><th>Đơn giá</th><th>Cửa hàng</th><th>Tháng</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {model.feeRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{formatMoney(row.unitPrice)}</td>
                      <td>{row.storeCount || '...'}</td>
                      <td>{row.months || '...'}</td>
                      <td>{formatMoney(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4}>Subtotal</td><td>{formatMoney(model.subtotal)}</td></tr>
                  <tr><td colSpan={4}>VAT {model.vatPct}%</td><td>{formatMoney(model.vatAmount)}</td></tr>
                  <tr><td colSpan={4}>Total</td><td>{formatMoney(model.grandTotal)}</td></tr>
                </tfoot>
              </table>
              <p className="live-doc-words">{model.grandTotalWords}</p>
            </>
          )}
        </article>
      </div>
    </div>
  )
}

export default memo(PreviewPane)
