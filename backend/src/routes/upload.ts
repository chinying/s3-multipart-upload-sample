import { Router, Request, Response } from 'express'

const router = Router()

const presignedUrlHandler = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      url: 'your url here'
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Unable to generate presigned url' })
  }
}

router.get('/start', presignedUrlHandler)

export const UploadRoutes = router