import mongoose from 'mongoose'

const activeWorkoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.ActiveWorkoutSession || mongoose.model('ActiveWorkoutSession', activeWorkoutSessionSchema)
