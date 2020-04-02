import * as React from 'react'
import axios from 'axios'
import Bluebird from 'bluebird'

const FILE_CHUNK_SIZE = 5500000 // 5.5MB, which is the lowest allowable
const FILE_UPLOAD_CONCURRENCY = 10

type Props = {}
type State = {
  s3Key: string | null,
  selectedFile: File | null,
  uploadId: string | null,
}

interface StartUploadResponse {
  s3Key: string;
  uploadId: string;
}

interface GetMulitpartUrlResponse {
  presignedUrl: string;
}

export default class Upload extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      s3Key: null,
      selectedFile: null,
      uploadId: null,
    }
  }

  private async obtainUploadId(mimeType: string): Promise<StartUploadResponse> {
    try {
      const resp = await axios.get(encodeURI(`http://localhost:4000/upload/start?mimeType=${mimeType}`))
      return resp.data
    } catch (err) {
      throw err
    }
  }

  private async getMultipartPresignedUrl({s3Key, partNumber, uploadId}: {s3Key: string, partNumber: number, uploadId: string}): Promise<GetMulitpartUrlResponse> {
    try {
      const resp = await axios.get(
        encodeURI(`http://localhost:4000/upload/get-multipart-url`),
        {
          params: {
            s3Key,
            partNumber,
            uploadId
          }
        }
      )
      return resp.data
    } catch (err) {
      throw err
    }
  }

  async fileChangeHandler(event: React.SyntheticEvent<HTMLInputElement>) {
    try {
      const file = event.currentTarget?.files?.[0]
      console.log(file)
      if (file === undefined) return
      this.setState({ selectedFile: file })

      const startUploadResponse = await this.obtainUploadId(file.type)
      this.setState({
        s3Key: startUploadResponse.s3Key,
        uploadId: startUploadResponse.uploadId
      })
    } catch (err) {
      console.error(err)
    }
  }

  async uploadHandler(event: React.MouseEvent) {
    event.preventDefault()
    try {
      await this.upload(
        this.state.selectedFile!
      )
    } catch (err) {
      console.error(err)
    }
  }

  private async upload(file: File) {
    // TODO
    try {
      // 1. split file into chunks
      const fileSize = file.size
      const NUM_CHUNKS = Math.floor(fileSize / FILE_CHUNK_SIZE) + 1
      const chunks = new Array(NUM_CHUNKS)

      const uploadPartsArray = await Bluebird.map(
        chunks,
        async (_, index: number) => {
          const startByte = index * FILE_CHUNK_SIZE
          const endByte = (index + 1) * FILE_CHUNK_SIZE

          const blob = index < NUM_CHUNKS ? file.slice(startByte, endByte) : file.slice(startByte)

          const presignedUrlResp = await this.getMultipartPresignedUrl({
            s3Key: this.state.s3Key!,
            uploadId: this.state.uploadId!,
            partNumber: index + 1
          })

          // upload to s3
          const uploadResponse = await axios.put(
            presignedUrlResp.presignedUrl,
            blob,
            { headers: { 'Content-Type': file.type } }
          )

          return {
            ETag: uploadResponse.headers.etag,
            PartNumber: index + 1
          }

        },
        { concurrency: FILE_UPLOAD_CONCURRENCY }
      )
      const completeUploadResp = await axios.post(`http://localhost:4000/upload/complete`, {
        params: {
          s3Key: this.state.s3Key,
          parts: uploadPartsArray,
          uploadId: this.state.uploadId
        }
      })
      console.log(completeUploadResp.data)
    } catch (err) {
      if (err && err.response) console.error(JSON.stringify(err.response.data))
      else console.log(err)
    }
  }

  render () {
    return (
      <div>
        <form>
          <input
            id="fileToUpload"
            type="file"
            onChange={this.fileChangeHandler.bind(this)}
          />

          <button
            type="submit"
            onClick={this.uploadHandler.bind(this)}
          >
            Upload
          </button>
        </form>
      </div>
    )
  }
}