import React from 'react';
import logo from './logo.svg';
import './App.css';
import MultipartUpload from './components/Upload'
import PresignedUpload from './components/SingleUpload'

function App() {
  return (
    <div className="App">
      <h1>Multipart</h1>
      <MultipartUpload></MultipartUpload>
      <hr/>
      <h1>Single presigned url</h1>
      <PresignedUpload></PresignedUpload>
    </div>
  );
}

export default App;
