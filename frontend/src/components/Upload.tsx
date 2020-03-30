import * as React from 'react'
import axios from 'axios'

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
      await this.upload()
    } catch (err) {
      console.error(err)
    }
  }

  private async upload() {
    // TODO
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
            onClick={this.uploadHandler}
          >
            Upload
          </button>
        </form>
      </div>
    )
  }
}