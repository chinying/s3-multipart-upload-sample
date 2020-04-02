import axios from 'axios'
import * as React from 'react'

type Props = {}
type State = {
  presignedUrl: string  | null,
  selectedFile: File | null,
}

interface PresignedUrlResponse {
  presignedUrl: string;
}

export default class Upload extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      presignedUrl: null,
      selectedFile: null,
    }
  }

  private async obtainPresignedUrl (mimeType: string): Promise<PresignedUrlResponse> {
    try {
      const resp = await axios.get(encodeURI(`http://localhost:4000/upload/presign-start?mimeType=${mimeType}`))
      return resp.data
    } catch (err) {
      throw err
    }
  }

  async fileChangeHandler (event: React.SyntheticEvent<HTMLInputElement>) {
    try {
      const file = event.currentTarget?.files?.[0]
      console.log(file)
      if (file === undefined) return
      this.setState({ selectedFile: file })

      const startUploadResponse = await this.obtainPresignedUrl(file.type)
      this.setState({
        presignedUrl: startUploadResponse.presignedUrl
      })
    } catch (err) {
      console.error(err)
    }
  }

  async uploadHandler (event: React.MouseEvent) {
    event.preventDefault()
    try {
      if (this.state.presignedUrl === null) throw new Error('Presigned Url not yet obtained')
      if (this.state.selectedFile === null) throw new Error('No file selected')
      const responseFromS3 = await axios.put(
        this.state.presignedUrl,
        this.state.selectedFile,
        { headers: { 'Content-Type': this.state.selectedFile.type }}
      )
      console.log(responseFromS3.data)
    } catch (err) {
      // handles axios error
      if (err && err.response) console.error(JSON.stringify(err.response.data))
      else console.log(err)
    }
  }

  render () {
    return (
      <>
        <form>
          <input
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
      </>
    )
  }
}