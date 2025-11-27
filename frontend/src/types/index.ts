export type PostType = 'water' | 'screen_time' | 'exercise' | 'shame' | 'healthy_food'

export type Post = {
  id: string
  type: PostType
  text?: string
  imageUrl?: string
  videoUrl?: string
  badgeType?: string
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl?: string | null
  }
  likes: {
    total: number
    likedByViewer: boolean
  }
  comments: {
    total: number
    items: Comment[]
  }
}

export type Comment = {
  id: string
  text: string
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

export type WaterSnapshot = {
  goalMl: number
  totalMl: number
  progress: number
  pendingMl: number
  canCelebrate: boolean
  logs: Array<{
    id: string
    amountMl: number
    dailyGoalMl?: number
    date: string
  }>
}

export type ScreenTimeSummary = {
  current: {
    totalMinutes: number
    averageMinutes: number
    logs: Array<{
      id: string
      date: string
      minutes: number
    }>
  }
  previous: {
    totalMinutes: number
    averageMinutes: number
  }
  improvementMinutes: number
  trend: 'down' | 'up' | 'flat'
}

export type ExerciseSession = {
  id: string
  type: string
  startTime: string
  endTime: string
  durationMinutes?: number
  notes?: string
  mediaUrls?: string[]
}

export type PostsByDayResponse = {
  day: string
  posts: Post[]
  previousDay: string | null
  nextDay: string | null
}
