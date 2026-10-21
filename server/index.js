import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const JWT_SECRET = 'เปลี่ยนเป็นข้อความสุ่มยาวๆของคุณเอง'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ===== ตั้งค่าอัปโหลดรูป =====
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// เปิดให้เรียกดูรูปได้ที่ http://localhost:3001/uploads/ชื่อไฟล์
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  })
)

// ชนิดไฟล์ที่อนุญาต
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    // ตั้งชื่อไฟล์ใหม่เป็นรหัสสุ่ม ไม่ใช้ชื่อเดิมจากผู้ใช้
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true)
    else cb(new Error('INVALID_TYPE'))
  },
})

// ครอบ multer เพื่อให้ตอบ error เป็น JSON
function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'ไฟล์รูปต้องไม่เกิน 5 MB' })
    }
    if (err.message === 'INVALID_TYPE') {
      return res.status(400).json({ message: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP, GIF' })
    }
    console.error(err)
    return res.status(500).json({ message: 'อัปโหลดรูปไม่สำเร็จ' })
  })
}

// ===== เชื่อมต่อ MySQL ของ XAMPP =====
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sell_computerpart',
  charset: 'utf8mb4',
})

// ===== ตรวจ token ก่อนเข้า route ที่ต้องล็อกอิน =====
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' })
  }
}

// ส่วนดึงสินค้าที่ใช้ร่วมกัน: ผู้ขาย + ดาวเฉลี่ย + ยอดคนกดถูกใจ + ราคาปกติ
const PRODUCT_SELECT = `
  SELECT p.id, p.category, p.brand, p.model, p.\`condition\`, p.description,
         p.price, p.original_price, p.status, p.contact, p.image_url, p.created_at,
         u.username AS seller,
         COALESCE(rv.avg_rating, 0) AS avg_rating,
         COALESCE(rv.review_count, 0) AS review_count,
         COALESCE(fv.like_count, 0) AS like_count
  FROM products p
  JOIN users u ON p.seller_id = u.id
  LEFT JOIN (
    SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
    FROM reviews
    GROUP BY product_id
  ) rv ON rv.product_id = p.id
  LEFT JOIN (
    SELECT product_id, COUNT(*) AS like_count
    FROM favorites
    GROUP BY product_id
  ) fv ON fv.product_id = p.id
`

// แปลงค่าที่ MySQL คืนมาเป็นข้อความ ให้เป็นตัวเลข
const mapProduct = (r) => ({
  ...r,
  price: Number(r.price),
  original_price: r.original_price === null ? null : Number(r.original_price),
  avg_rating: Math.round(Number(r.avg_rating) * 10) / 10,
  review_count: Number(r.review_count),
  like_count: Number(r.like_count),
})

// ทดสอบว่า server ทำงาน
app.get('/', (req, res) => {
  res.send('Server is running')
})

// ===== สมัครสมาชิก =====
app.post('/api/register', async (req, res) => {
  const { username, email, phone, password, address } = req.body

  if (!username || !email || !phone || !password || !address) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  }

  // เบอร์โทรไทย: ขึ้นต้นด้วย 0 และมี 10 หลัก
  if (!/^0\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  try {
    const [exists] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )
    if (exists.length > 0) {
      return res.status(409).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว' })
    }

    const hashed = await bcrypt.hash(password, 10)

    await db.query(
      'INSERT INTO users (username, email, phone, password, address) VALUES (?, ?, ?, ?, ?)',
      [username, email, phone, hashed, address]
    )

    res.status(201).json({ message: 'ลงทะเบียนสำเร็จ' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== เข้าสู่ระบบ =====
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body

  if (!identifier || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  }

  try {
    // หาจาก username หรือ email
    const [rows] = await db.query(
      'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    )

    // ไม่เจอชื่อนี้ในระบบ = ยังไม่ได้ลงทะเบียน
    // ใช้ข้อความเดียวกับรหัสผิด เพื่อไม่ให้คนนอกเดาได้ว่ามีชื่อนี้ในระบบหรือไม่
    if (rows.length === 0) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // ส่งกลับเฉพาะข้อมูลที่จำเป็น ห้ามส่ง password
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== ดึงสินค้าที่ประกาศขายทั้งหมด (ใหม่สุดก่อน) พร้อมดาวเฉลี่ย ยอดถูกใจ และราคาปกติ =====
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query(
      PRODUCT_SELECT +
        ` WHERE p.status = 'available'
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT 200`
    )
    res.json(rows.map(mapProduct))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== ลงประกาศขายสินค้า (ต้องล็อกอิน) =====
const CATEGORIES = ['การ์ดจอ', 'CPU', 'Mainboard', 'RAM', 'SSD / Hard disk']

app.post('/api/products', auth, uploadImage, async (req, res) => {
  const { category, brand, model, condition, description, price, contact } = req.body

  // ถ้าข้อมูลไม่ผ่าน ให้ลบรูปที่เพิ่งอัปโหลดทิ้งด้วย ไม่ให้ไฟล์ค้างในโฟลเดอร์
  const fail = (status, message) => {
    if (req.file) fs.unlink(req.file.path, () => {})
    return res.status(status).json({ message })
  }

  if (!category || !brand || !model || !condition || !description || !price || !contact) {
    return fail(400, 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
  }

  if (!CATEGORIES.includes(category)) {
    return fail(400, 'หมวดหมู่ไม่ถูกต้อง')
  }

  if (!['new', 'used'].includes(condition)) {
    return fail(400, 'สภาพสินค้าไม่ถูกต้อง')
  }

  const priceNum = Number(price)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return fail(400, 'ราคาต้องเป็นตัวเลขมากกว่า 0')
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null

  try {
    // seller_id มาจาก token ที่ server ตรวจแล้ว ไม่รับจากหน้าเว็บ
    await db.query(
      `INSERT INTO products
        (seller_id, category, brand, model, \`condition\`, description, price, contact, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category, brand, model, condition, description, priceNum, contact, imagePath]
    )

    res.status(201).json({ message: 'ลงประกาศขายสำเร็จ' })
  } catch (err) {
    console.error(err)
    return fail(500, 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์')
  }
})

// ===== ดูรีวิวของสินค้า (ทุกคนดูได้) =====
app.get('/api/products/:id/reviews', async (req, res) => {
  const productId = Number(req.params.id)
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }

  try {
    const [rows] = await db.query(
      `SELECT r.id, r.user_id, r.rating, r.comment, r.created_at, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [productId]
    )

    const count = rows.length
    const average = count ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0

    res.json({ average: Math.round(average * 10) / 10, count, reviews: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== เขียน/แก้ไขรีวิว (ต้องล็อกอิน) =====
app.post('/api/products/:id/reviews', auth, async (req, res) => {
  const productId = Number(req.params.id)
  const rating = Number(req.body.rating)
  const comment = String(req.body.comment || '').trim()

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'กรุณาให้ดาว 1-5 ดาว' })
  }
  if (!comment) {
    return res.status(400).json({ message: 'กรุณาเขียนรีวิว' })
  }
  if (comment.length > 1000) {
    return res.status(400).json({ message: 'รีวิวต้องไม่เกิน 1,000 ตัวอักษร' })
  }

  try {
    const [prod] = await db.query('SELECT seller_id FROM products WHERE id = ?', [productId])
    if (prod.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' })
    }

    // ผู้ขายรีวิวสินค้าของตัวเองไม่ได้
    if (prod[0].seller_id === req.user.id) {
      return res.status(403).json({ message: 'ไม่สามารถรีวิวสินค้าของตัวเองได้' })
    }

    // ถ้าเคยรีวิวแล้วจะอัปเดตของเดิม
    await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [productId, req.user.id, rating, comment]
    )

    res.status(201).json({ message: 'บันทึกรีวิวสำเร็จ' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== รายการสินค้าที่ผู้ใช้กดถูกใจ (ต้องล็อกอิน) =====
app.get('/api/favorites', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      PRODUCT_SELECT +
        ` JOIN favorites f ON f.product_id = p.id
          WHERE f.user_id = ? AND p.status = 'available'
          ORDER BY f.created_at DESC`,
      [req.user.id]
    )
    res.json(rows.map(mapProduct))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== กดถูกใจสินค้า =====
app.post('/api/products/:id/favorite', auth, async (req, res) => {
  const productId = Number(req.params.id)
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }

  try {
    const [prod] = await db.query('SELECT id FROM products WHERE id = ?', [productId])
    if (prod.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' })
    }

    // INSERT IGNORE: ถ้าเคยกดแล้วจะไม่เพิ่มซ้ำ
    await db.query('INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)', [
      req.user.id,
      productId,
    ])

    const [[row]] = await db.query(
      'SELECT COUNT(*) AS n FROM favorites WHERE product_id = ?',
      [productId]
    )
    res.json({ liked: true, like_count: Number(row.n) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== เอาสินค้าออกจากรายการที่ถูกใจ =====
app.delete('/api/products/:id/favorite', auth, async (req, res) => {
  const productId = Number(req.params.id)
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }

  try {
    await db.query('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      productId,
    ])

    const [[row]] = await db.query(
      'SELECT COUNT(*) AS n FROM favorites WHERE product_id = ?',
      [productId]
    )
    res.json({ liked: false, like_count: Number(row.n) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== ข้อมูลของผู้ใช้ที่ล็อกอิน (ใช้ดึงที่อยู่จัดส่งอัตโนมัติ) =====
app.get('/api/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, phone, address FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== สร้างคำสั่งซื้อ (ต้องล็อกอิน) =====
const PAYMENT_METHODS = ['promptpay', 'card', 'cod']
const SHIPPING_FEE = 0 // ค่าจัดส่งฟรี

app.post('/api/orders', auth, async (req, res) => {
  const { items, address, payment_method } = req.body
  const addr = String(address || '').trim()

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ message: 'ตะกร้าสินค้าว่างเปล่า' })
  }
  if (!addr) {
    return res.status(400).json({ message: 'กรุณากรอกที่อยู่จัดส่ง' })
  }
  if (addr.length > 1000) {
    return res.status(400).json({ message: 'ที่อยู่ยาวเกินไป' })
  }
  if (!PAYMENT_METHODS.includes(payment_method)) {
    return res.status(400).json({ message: 'ช่องทางชำระเงินไม่ถูกต้อง' })
  }

  // รวมรายการซ้ำ และตรวจรหัสสินค้ากับจำนวน
  const qtyById = new Map()
  for (const it of items) {
    const id = Number(it.product_id)
    const qty = Number(it.quantity)
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ message: 'ข้อมูลสินค้าในตะกร้าไม่ถูกต้อง' })
    }
    qtyById.set(id, Math.min(99, (qtyById.get(id) || 0) + qty))
  }

  const conn = await db.getConnection()
  try {
    const [products] = await conn.query(
      'SELECT id, brand, model, price, seller_id, status FROM products WHERE id IN (?)',
      [[...qtyById.keys()]]
    )

    if (products.length !== qtyById.size || products.some((p) => p.status !== 'available')) {
      return res
        .status(400)
        .json({ message: 'สินค้าบางรายการไม่มีในระบบหรือปิดการขายแล้ว' })
    }
    if (products.some((p) => p.seller_id === req.user.id)) {
      return res.status(400).json({ message: 'ไม่สามารถสั่งซื้อสินค้าของตัวเองได้' })
    }

    // คำนวณราคาจากฐานข้อมูล ไม่เชื่อราคาที่ส่งมาจากหน้าเว็บ
    const subtotal = products.reduce((sum, p) => sum + Number(p.price) * qtyById.get(p.id), 0)
    const total = Math.round((subtotal + SHIPPING_FEE) * 100) / 100

    await conn.beginTransaction()

    const [result] = await conn.query(
      `INSERT INTO orders (user_id, total_price, shipping_fee, shipping_address, payment_method)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, total, SHIPPING_FEE, addr, payment_method]
    )
    const orderId = result.insertId

    await conn.query(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ?',
      [
        products.map((p) => [
          orderId,
          p.id,
          `${p.brand} ${p.model}`,
          qtyById.get(p.id),
          p.price,
        ]),
      ]
    )

    await conn.commit()
    res.status(201).json({ message: 'สั่งซื้อสำเร็จ', order_id: orderId, total })
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  } finally {
    conn.release()
  }
})

// ===== จำนวนสินค้าที่ผู้ใช้ประกาศขาย (Header ใช้ตัดสินใจแสดงเมนูแก้ไขสินค้า) =====
app.get('/api/my-products/count', auth, async (req, res) => {
  try {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS n FROM products WHERE seller_id = ?',
      [req.user.id]
    )
    res.json({ count: Number(row.n) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== สินค้าที่ผู้ใช้ประกาศขายทั้งหมด =====
app.get('/api/my-products', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      PRODUCT_SELECT +
        ` WHERE p.seller_id = ?
          ORDER BY p.created_at DESC, p.id DESC`,
      [req.user.id]
    )
    res.json(rows.map(mapProduct))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== ปรับราคา / ลดราคา (เฉพาะเจ้าของสินค้า) =====
app.patch('/api/products/:id', auth, async (req, res) => {
  const productId = Number(req.params.id)
  const newPrice = Math.round(Number(req.body.price) * 100) / 100

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }
  if (!Number.isFinite(newPrice) || newPrice <= 0 || newPrice > 99999999) {
    return res.status(400).json({ message: 'กรุณากรอกราคาเป็นตัวเลขที่มากกว่า 0' })
  }

  try {
    const [rows] = await db.query(
      'SELECT seller_id, price, original_price FROM products WHERE id = ?',
      [productId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' })
    }
    if (rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'แก้ไขได้เฉพาะสินค้าที่คุณประกาศขายเอง' })
    }

    // ราคาปกติที่ใช้เทียบ: ถ้าเคยลดราคาไว้แล้ว ให้ใช้ราคาปกติเดิม
    const base =
      rows[0].original_price !== null ? Number(rows[0].original_price) : Number(rows[0].price)

    // ต่ำกว่าราคาปกติ = ลดราคา, เท่ากับหรือสูงกว่า = ไม่มีส่วนลด
    const original = newPrice < base ? base : null

    await db.query('UPDATE products SET price = ?, original_price = ? WHERE id = ?', [
      newPrice,
      original,
      productId,
    ])

    res.json({
      message: original
        ? 'ลดราคาสำเร็จ สินค้าจะขึ้นป้ายลดราคาที่หน้าแรก'
        : 'อัปเดตราคาแล้ว (ไม่มีส่วนลด)',
      price: newPrice,
      original_price: original,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ===== ลบสินค้า (เฉพาะเจ้าของสินค้า) =====
app.delete('/api/products/:id', auth, async (req, res) => {
  const productId = Number(req.params.id)
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' })
  }

  try {
    const [rows] = await db.query('SELECT seller_id, image_url FROM products WHERE id = ?', [
      productId,
    ])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' })
    }
    if (rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'ลบได้เฉพาะสินค้าที่คุณประกาศขายเอง' })
    }

    // รีวิวและรายการถูกใจของสินค้านี้จะถูกลบตามอัตโนมัติ (ON DELETE CASCADE)
    await db.query('DELETE FROM products WHERE id = ?', [productId])

    // ลบไฟล์รูปที่อัปโหลดไว้ (ใช้ basename กันการอ้างพาธนอกโฟลเดอร์)
    const img = rows[0].image_url
    if (img && img.startsWith('/uploads/')) {
      fs.unlink(path.join(UPLOAD_DIR, path.basename(img)), () => {})
    }

    res.json({ message: 'ลบสินค้าแล้ว' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})
// ===== จำกัดจำนวนครั้งที่ลองรีเซ็ตรหัสผ่าน (เก็บในหน่วยความจำ) =====
const resetTries = new Map() // key -> { count, since }
const RESET_WINDOW = 15 * 60 * 1000 // 15 นาที

// คืน true ถ้าลองเกินจำนวนที่กำหนดภายในช่วงเวลา
function overLimit(key, max) {
  const now = Date.now()
  const rec = resetTries.get(key)
  if (!rec || now - rec.since > RESET_WINDOW) {
    resetTries.set(key, { count: 1, since: now })
    return false
  }
  rec.count += 1
  return rec.count > max
}

// ล้างข้อมูลที่หมดอายุทิ้งเป็นระยะ
setInterval(() => {
  const now = Date.now()
  for (const [key, rec] of resetTries) {
    if (now - rec.since > RESET_WINDOW) resetTries.delete(key)
  }
}, RESET_WINDOW).unref()

// ===== รีเซ็ตรหัสผ่าน (ยืนยันตัวตนด้วยอีเมล + เบอร์โทรที่ลงทะเบียนไว้) =====
app.post('/api/reset-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const phone = String(req.body.phone || '').trim()
  const newPassword = String(req.body.new_password || '')

  if (!email || !phone || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  }
  if (!/^0\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  // กันการเดาข้อมูลซ้ำๆ: ต่อ IP+อีเมล 5 ครั้ง และต่อ IP รวม 20 ครั้ง ภายใน 15 นาที
  if (overLimit(`ip:${req.ip}`, 20) || overLimit(`id:${req.ip}|${email}`, 5)) {
    return res
      .status(429)
      .json({ message: 'ลองหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' })
  }

  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = ? AND phone = ?',
      [email, phone]
    )

    // ใช้ข้อความเดียวกันไม่ว่าจะผิดที่อีเมลหรือเบอร์ เพื่อไม่บอกใบ้ว่ามีอีเมลนี้ในระบบ
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: 'อีเมลหรือเบอร์โทรศัพท์ไม่ตรงกับที่ลงทะเบียนไว้' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, rows[0].id])

    res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})