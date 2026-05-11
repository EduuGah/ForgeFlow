import express from 'express'
import ActiveWorkoutSession from '../models/ActiveWorkoutSession.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/active-workout', authMiddleware, async (req, res) => {
  const record = await ActiveWorkoutSession.findOne({ user: req.user.id }).lean()

  if (!record) {
    return res.json({ session: null })
  }

  return res.json({ session: record.session })
})

router.put('/active-workout', authMiddleware, async (req, res) => {
  const { session } = req.body

  if (!session) {
    await ActiveWorkoutSession.deleteOne({ user: req.user.id })
    return res.json({ session: null })
  }

  const record = await ActiveWorkoutSession.findOneAndUpdate(
    { user: req.user.id },
    { session },
    { new: true, upsert: true }
  ).lean()

  return res.json({ session: record.session })
})

router.delete('/active-workout', authMiddleware, async (req, res) => {
  await ActiveWorkoutSession.deleteOne({ user: req.user.id })

  return res.json({ ok: true })
})

export default router
