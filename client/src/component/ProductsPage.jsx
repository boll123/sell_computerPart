import useProducts from './useProducts'
import ProductList from './ProductList'
import { GREEN, BORDER } from './productUi'

const PAGES = {
  new: {
    title: 'สินค้ามือ 1',
    desc: 'สินค้าใหม่ ไม่เคยผ่านการใช้งาน',
    icon: 'bi-gift-fill',
    color: GREEN,
    empty: 'ยังไม่มีสินค้ามือ 1 ในหมวดนี้',
  },
  used: {
    title: 'สินค้ามือ 2',
    desc: 'สินค้าผ่านการใช้งาน ราคาประหยัด',
    icon: 'bi-recycle',
    color: '#ffc107',
    empty: 'ยังไม่มีสินค้ามือ 2 ในหมวดนี้',
  },
}

// condition: 'new' = มือ 1, 'used' = มือ 2
function ProductsPage({ condition, user, token }) {
  const { products, loading, error, reload } = useProducts()
  const page = PAGES[condition]

  // เอาเฉพาะสินค้าตามสภาพที่เลือก
  const list = products.filter((p) => p.condition === condition)

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
              fontSize: 26,
              color: page.color,
              backgroundColor: '#141922',
              border: `1px solid ${BORDER}`,
            }}
          >
            <i className={`bi ${page.icon}`}></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">{page.title}</h2>
            <div className="small text-secondary">{page.desc}</div>
          </div>
        </div>
      </div>

      <ProductList
        products={list}
        loading={loading}
        error={error}
        user={user}
        token={token}
        onReload={reload}
        emptyText={page.empty}
      />
    </div>
  )
}

export default ProductsPage