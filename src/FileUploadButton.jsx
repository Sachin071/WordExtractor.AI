// src/components/FileUploadButton.js
import React, { useRef } from "react";

function FileUploadButton({ onFileSelect }) {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    onFileSelect(selectedFile);
  };

  return (
    <div style={{ paddingTop: "8%" }}>
      <h2>File Upload</h2>
      <input
        type="file"
        // accept=".doc .pdf" // Specify allowed file types if needed
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button onClick={handleButtonClick}>Select File</button>
    </div>
  );
}

export default FileUploadButton;
