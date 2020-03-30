import { Router, Request, Response } from 'express'
import S3 = require('aws-sdk/clients/s3')

const FILE_STORAGE_BUCKET_NAME = process.env.FILE_STORAGE_BUCKET_NAME as string

const router = Router()

const s3 = new S3({
  signatureVersion: 'v4',
  endpoint: FILE_STORAGE_BUCKET_NAME, // FIXME: change to envvar
  s3BucketEndpoint: true
})

// here be handlers
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