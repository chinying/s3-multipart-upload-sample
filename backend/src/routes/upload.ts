import { promisify } from 'util'
import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import S3 = require('aws-sdk/clients/s3')

const AWS_REGION = process.env.AWS_REGION as string
const FILE_STORAGE_BUCKET_NAME = process.env.FILE_STORAGE_BUCKET_NAME as string

const router = Router()

const s3 = new S3({
  signatureVersion: 'v4',
  region: AWS_REGION
})

const createMultipartUpload = promisify(s3.createMultipartUpload.bind(s3))

// here be handlers
const presignedUrlHandler = async (_req: Request, res: Response) => {
  try {
    const s3Key = uuid()
    const params = {
      Bucket: FILE_STORAGE_BUCKET_NAME,
      Key: s3Key,
      ContentType: 'text/csv'
    }

    // @ts-ignore
    const uploadedData = await createMultipartUpload(params)
    res.status(200).json({ uploadedData })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Unable to generate presigned url' })
  }
}

router.get('/start', presignedUrlHandler)

export const UploadRoutes = router