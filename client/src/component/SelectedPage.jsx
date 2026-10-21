import { useSearchParams } from 'react-router-dom'
import useProducts from './useProducts'
import ProductList from './ProductList'
import { GREEN, BORDER } from './productUi'

function SelectedPage({ user, token }) {
  const [params] = useSearchParams()
  const { products, loading, error, reload } = useProducts()

  // อ่านรหัสสินค้าที่ติ๊กจาก URL เช่น /selected?ids=3,5,8
  const idsText = params.get('ids') || ''
  const ids = idsText
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)

  const results = products.filter((p) => ids.includes(p.id))

  return (
    <div className="text-white">
      {/* หัวข้อหน้า */}
      <div className="container-fluid px-3 px-lg-5 pt-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 52,
              height: 52,
              fontSize: 24,
              color: GREEN,
              backgroundColor: '#141922',
              border: `1px solid ${BORDER}`,
            }}
          >
            <i className="bi bi-check2-square"></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">รายการที่เลือก</h2>
            <div className="small text-secondary">
              สินค้าที่คุณติ๊กเลือกจากเมนูหมวดหมู่
            </div>
          </div>
        </div>
      </div>

      {ids.length > 0 ? (
        // key ทำให้แท็บหมวดหมู่รีเซ็ตเมื่อรายการที่เลือกเปลี่ยน
        <ProductList
          key={idsText}
          products={results}
          loading={loading}
          error={error}
          user={user}
          token={token}
          onReload={reload}
          emptyText="ไม่พบสินค้าที่เลือก (สินค้าอาจถูกลบไปแล้ว)"
        />
      ) : (
        <p className="text-secondary text-center py-5">
          ยังไม่ได้เลือกสินค้า กดปุ่มเมนู ☰ แล้วเลือกหมวดหมู่เพื่อติ๊กสินค้า
        </p>
      )}
    </div>
  )
}

export default SelectedPage