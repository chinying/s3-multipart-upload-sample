import * as React from 'react'

type Props = {}
type State = {
  selectedFile: File | null
}

export default class Upload extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      selectedFile: null
    }
  }

  fileChangeHandler(event: React.SyntheticEvent<HTMLInputElement>) {
    const file = event.currentTarget?.files?.[0]
    console.log(file)
    if (file === undefined) return
    this.setState({ selectedFile: file })
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
        </form>
      </div>
    )
  }
}