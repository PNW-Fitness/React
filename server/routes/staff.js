import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET /api/staff?role=personal_trainer|group_instructor
router.get('/', async (req, res) => {
  const { role } = req.query
  try {
    if (role) {
      const { rows } = await pool.query(
        `SELECT s.*, sr.role, sr.display_order, sr.classes_taught
           FROM staff s
           JOIN staff_roles sr ON sr.staff_id = s.id
          WHERE s.active = true AND sr.role = $1
          ORDER BY sr.display_order`,
        [role]
      )
      return res.json(rows)
    }
    const { rows } = await pool.query(
      `SELECT s.*, sr.role, sr.display_order, sr.classes_taught
         FROM staff s
         JOIN staff_roles sr ON sr.staff_id = s.id
        WHERE s.active = true
        ORDER BY sr.role, sr.display_order`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/staff/:id — full detail with all roles
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'role', sr.role,
                    'display_order', sr.display_order,
                    'classes_taught', sr.classes_taught
                  )
                ) FILTER (WHERE sr.role IS NOT NULL),
                '[]'
              ) AS roles
         FROM staff s
         LEFT JOIN staff_roles sr ON sr.staff_id = s.id
        WHERE s.id = $1
        GROUP BY s.id`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/staff
// TODO: add authentication before enabling in production
router.post('/', async (req, res) => {
  const { name, photo_url, initial, cert, specialty, bio, tags } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO staff (name, photo_url, initial, cert, specialty, bio, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, photo_url, initial, cert, specialty, bio, tags ?? []]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// PATCH /api/staff/:id
// TODO: add authentication before enabling in production
router.patch('/:id', async (req, res) => {
  const allowed = ['name', 'photo_url', 'initial', 'cert', 'specialty', 'bio', 'tags', 'active']
  const sets = []
  const values = []
  let i = 1
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      sets.push(`${field} = $${i++}`)
      values.push(req.body[field])
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' })
  sets.push('updated_at = NOW()')
  values.push(req.params.id)
  try {
    const { rows } = await pool.query(
      `UPDATE staff SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// DELETE /api/staff/:id
// TODO: add authentication before enabling in production
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM staff WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
