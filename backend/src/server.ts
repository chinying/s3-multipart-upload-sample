import cors from 'cors'
import express from 'express'
require('dotenv').config()

import { UploadRoutes } from './routes/upload'

const FRONTEND_URL = process.env.FRONTEND_URL as string

const port = 4000
const app: express.Application = express()
const start = async (): Promise<void> => {
  app.use(cors({
    'origin': FRONTEND_URL
  }))
  app.use('/upload/', UploadRoutes)
  app.listen(port, () => console.log(`Listening on port ${port}!`))
}

start()