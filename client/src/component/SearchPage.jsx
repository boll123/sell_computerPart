import { useSearchParams } from 'react-router-dom'
import useProducts from './useProducts'
import ProductList from './ProductList'
import { GREEN, BORDER } from './productUi'
import { matchProducts } from './searchUtils'

function SearchPage({ user, token }) {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { products, loading, error, reload } = useProducts()

  const results = matchProducts(products, q)

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
            <i className="bi bi-search"></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">{q ? `ผลการค้นหา “${q}”` : 'ค้นหาสินค้า'}</h2>
            <div className="small text-secondary">
              ค้นจากยี่ห้อ รุ่น สเปก หมวดหมู่ ผู้ขาย และสภาพสินค้า
            </div>
          </div>
        </div>
      </div>

      {q ? (
        // key={q} ทำให้แท็บหมวดหมู่รีเซ็ตเป็น "ทั้งหมด" เมื่อค้นคำใหม่
        <ProductList
          key={q}
          products={results}
          loading={loading}
          error={error}
          user={user}
          token={token}
          onReload={reload}
          emptyText={
            results.length === 0
              ? `ไม่พบสินค้าที่ตรงกับ “${q}” ลองใช้คำค้นอื่น`
              : 'ไม่มีสินค้าที่ตรงกับคำค้นในหมวดนี้'
          }
        />
      ) : (
        <p className="text-secondary text-center py-5">
          พิมพ์คำที่ต้องการค้นหาในช่องค้นหาด้านบน
        </p>
      )}
    </div>
  )
}

export default SearchPage