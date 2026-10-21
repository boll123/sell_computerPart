import { useFavorites } from './FavoritesContext'

const RED = '#ff4d5e'

// ปุ่มหัวใจ + จำนวนคนที่กดถูกใจ (หัวใจแดงเต็มเมื่อคุณกดถูกใจแล้ว)
function LikeButton({ product, size = 16, className = '', style = {} }) {
  const { isLiked, likeCount, toggleLike } = useFavorites()
  const liked = isLiked(product.id)

  return (
    <button
      type="button"
      title={liked ? 'เอาออกจากรายการที่ถูกใจ' : 'กดถูกใจ'}
      aria-pressed={liked}
      onClick={(e) => {
        e.stopPropagation()
        toggleLike(product)
      }}
      className={`btn d-inline-flex align-items-center gap-1 lh-1 ${className}`}
      style={{ color: RED, fontSize: size, ...style }}
    >
      <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
      <span className="fw-semibold" style={{ fontSize: size - 2, color: '#fff' }}>
        {likeCount(product)}
      </span>
    </button>
  )
}

export default LikeButton