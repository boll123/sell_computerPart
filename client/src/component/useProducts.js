import { useState, useEffect, useCallback } from 'react'
import { API } from './productUi'

// ดึงสินค้าทั้งหมดจาก server (เรียก reload ซ้ำได้ เช่น หลังมีคนส่งรีวิวใหม่)
export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(
    () =>
      fetch(`${API}/api/products`)
        .then((r) => {
          if (!r.ok) throw new Error('fail')
          return r.json()
        })
        .then((data) => {
          setProducts(data)
          setError('')
        })
        .catch(() => setError('โหลดสินค้าไม่สำเร็จ ตรวจสอบว่า server ทำงานอยู่'))
        .finally(() => setLoading(false)),
    []
  )

  useEffect(() => {
    reload()
  }, [reload])

  return { products, loading, error, reload }
}