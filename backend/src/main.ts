import 'dotenv/config'
import path from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { json } from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import authRoutes from './routes/auth'
import postRoutes from './routes/posts'
import waterRoutes from './routes/water'
import screenTimeRoutes from './routes/screenTime'
import exerciseRoutes from './routes/exercises'
import profileRoutes from './routes/profile'

const PORT = process.env.PORT || 4000

const app = express()

const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((url) => url.trim()).filter(Boolean)

app.use(helmet())
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true
  })
)
app.use(json({ limit: '10mb' }))

const swaggerDocument = YAML.load(path.join(__dirname, '..', 'openapi.yaml'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/water', waterRoutes)
app.use('/api/screen-time', screenTimeRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api', profileRoutes)

app.get('/', (req, res) => res.json({ status: 'ok', name: 'Fit & Fails API' }))

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${PORT}`)
})
