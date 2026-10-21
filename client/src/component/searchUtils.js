// รวมข้อความของสินค้าที่ใช้ค้นหา (ตัวพิมพ์เล็กทั้งหมด)
export const searchText = (p) =>
  [
    p.brand,
    p.model,
    p.description,
    p.category,
    p.seller,
    p.condition === 'new' ? 'มือ 1 มือ1 มือหนึ่ง new' : 'มือ 2 มือ2 มือสอง used',
  ]
    .join(' ')
    .toLowerCase()

// แยกคำค้นเป็นคำๆ
export const splitWords = (q) => q.toLowerCase().split(/\s+/).filter(Boolean)

// สินค้าต้องมีครบทุกคำที่พิมพ์
export const matchProducts = (products, q) => {
  const words = splitWords(q)
  if (!words.length) return []
  return products.filter((p) => {
    const text = searchText(p)
    return words.every((w) => text.includes(w))
  })
}