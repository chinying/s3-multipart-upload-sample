import { promisify } from 'util'

import S3 = require('aws-sdk/clients/s3')
import { celebrate, Joi, Segments } from 'celebrate'
import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'

const AWS_REGION = process.env.AWS_REGION as string
const FILE_STORAGE_BUCKET_NAME = process.env.FILE_STORAGE_BUCKET_NAME as string

const router = Router()

const s3 = new S3({
  signatureVersion: 'v4',
  region: AWS_REGION
})

const createMultipartUpload = promisify(s3.createMultipartUpload.bind(s3))
const completeMultipartUpload = promisify(s3.completeMultipartUpload.bind(s3))
const uploadPart = promisify(s3.getSignedUrl.bind(s3))

// validators
const presignedUrlValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    mimeType: Joi.string().required()
  })
})

const getMultipartUrlValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    partNumber: Joi
      .number()
      .integer()
      .min(1)
      .max(10000)
      .required(),
    s3Key: Joi.string().required(),
    uploadId: Joi.string().required(),
  })
})

const completeMultipartUploadValidator = celebrate({
  [Segments.BODY]: Joi.object({
    params: Joi.object({
      parts: Joi
        .array()
        .items(Joi.object({
          ETag: Joi.string().required(),
          PartNumber: Joi
            .number()
            .integer()
            .min(1)
            .max(10000)
            .required(),
        })),
      s3Key: Joi.string().required(),
      uploadId: Joi.string().required()
    })
  })
})

// here be handlers
const presignedUrlHandler = async (req: Request, res: Response) => {
  try {
    const s3Key = uuid()
    const params = {
      Bucket: FILE_STORAGE_BUCKET_NAME,
      Key: s3Key,
      ContentType: req.query.mimeType
    }

    // @ts-ignore
    const uploadedData = await createMultipartUpload(params)
    res.status(200).json({
      s3Key: uploadedData.Key,
      uploadId: uploadedData.UploadId
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Unable to generate presigned url' })
  }
}

const getMultipartUrlHandler = async (req: Request, res: Response) => {
  try {
    const { uploadId, s3Key, partNumber }: {uploadId: string, s3Key: string, partNumber: number } = req.query
    const params = {
      Bucket: FILE_STORAGE_BUCKET_NAME,
      Key: s3Key,
      PartNumber: partNumber,
      UploadId: uploadId
    }

    // @ts-ignore
    const presignedUrl = await uploadPart('uploadPart', params)
    res.status(200).json({ presignedUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to generate multipart url.' })
  }
}

const completeMultipartUploadHandler = async (req: Request, res: Response) => {
  try {
    const params = {
      Bucket: FILE_STORAGE_BUCKET_NAME,
      Key: req.body.params.s3Key,
      MultipartUpload: {
        Parts: req.body.params.parts
      },
      UploadId: req.body.params.uploadId
    }

    // @ts-ignore
    const data = await completeMultipartUpload(params)
    res.status(200).json({ data })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '' })
  }
}

// non multipart
const getPresignedUrlHandler = async (req: Request, res: Response) => {
  try {
    const s3Key = uuid()
    const params = {
      Bucket: FILE_STORAGE_BUCKET_NAME,
      Key: s3Key,
      ContentType: req.query.mimeType,
      Expires: 180 // seconds
    }

    const presignedUrl = await s3.getSignedUrlPromise('putObject', params)
    res.status(200).json({ presignedUrl })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to generate presigned URL' })
  }
}

router.get('/start', presignedUrlValidator, presignedUrlHandler)
router.get('/get-multipart-url', getMultipartUrlValidator, getMultipartUrlHandler)
router.post('/complete', completeMultipartUploadValidator, completeMultipartUploadHandler)

router.get('/presign-start', getPresignedUrlHandler)

export const UploadRoutes = router