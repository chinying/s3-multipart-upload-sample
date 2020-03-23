import express from 'express'
require('dotenv').config()

import { UploadRoutes } from './routes/upload'

const port = 4000
const app: express.Application = express()
const start = async (): Promise<void> => {
  app.use('/upload/', UploadRoutes)
  app.listen(port, () => console.log(`Listening on port ${port}!`))
}

start()