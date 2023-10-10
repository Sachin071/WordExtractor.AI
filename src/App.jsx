import React, { useState } from "react";

import FileUploadButton from "./FileUploadButton";
import mammoth from "mammoth";
import Navbar from "./components/Navbar";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultData, setResultData] = useState([]);

  var lines = {};

  const PostFetchData = async (filteredText) => {
    // FilteredData();

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      "Bearer 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"
    );

    // console.log("daaa", extractData);

    var raw = JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content:
            filteredText +
            "Prompt: From a medical document with sections like HPI, ASSESSMENT, PATIENT ACTIVE PROBLEM LIST, PHYSICAL EXAM, PAST HISTORY, PROBLEM LIST, etc., extract diagnosis details including the diagnosis name, ICD-10 code, treatment, and visit date. Present this information in a table format.",
        },
      ],
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch("https://api.openai.com/v1/chat/completions", requestOptions)
      .then((response) => response.json())
      .then(async (result) => {
        console.log(result.choices[0].message.content);
        const dataString = result.choices[0].message.content;
        // Parse the data string into an array of objects
        const lines1 = dataString.split("\n");
        var tableData = [];

        // Loop through lines, skipping the header
        for (var i = 2; i < lines1.length; i++) {
          // Split each line by the delimiter (|) and remove any leading/trailing spaces
          var columns = lines1[i].split("|").map(function (column) {
            return column.trim();
          });

          // Create an object with the specified headers
          var entry = {
            "Visit Date": columns[1],
            "Diagnosis Name": columns[2],
            "ICD-10 Code": columns[3],
            Treatment: columns[4],
          };

          // Add the entry to the tableData array
          tableData.push(entry);
        }

        console.log("parseData --", tableData);

        await setResultData(tableData);

        console.log("resultData --", resultData);
      })
      .catch((error) => console.log("error", error));
  };

  const extractDocxData = async (docxFile) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result;
      const result = await mammoth.extractRawText({ arrayBuffer: content });
      let text = result.value;
      console.log(text);

      // // Split the text into lines
      // lines = await text.split("\n");

      const filteredLines = await lines.filter((line) => {
        return !(
          line.includes("Acc No.") ||
          line.includes("Name:") ||
          line.includes("Age:") ||
          line.includes("Sex:") ||
          line.includes("SSS Num:") ||
          line.includes("Address:")
        );
      });

      // Join the filtered lines back into a single string
      const filteredText = await filteredLines.join("\n");

      // Output the result
      console.log("filtred data -- ", filteredText);

      PostFetchData(filteredText);
    };

    reader.readAsArrayBuffer(docxFile);
  };

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    if (file) {
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        console.log("file type is doc");
        await extractDocxData(file);
      } else {
        console.error("Unsupported file format");
      }
    }
  };

  return (
    <div className="App">
      <Navbar />
      <header className="App-header">
        <FileUploadButton onFileSelect={handleFileSelect} />
        {selectedFile && <p>Selected File: {selectedFile.name}</p>}
        <div style={{ padding: "15px 10px" }}>
          {resultData.length === 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                // border: "2px solid black",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #00bfff",
                      padding: "8px",
                    }}
                  >
                    <Skeleton height={20} />
                  </th>
                  <th
                    style={{
                      border: "1px solid #00bfff",
                      padding: "8px",
                    }}
                  >
                    <Skeleton height={20} />
                  </th>
                  <th
                    style={{
                      border: "1px solid #00bfff",
                      padding: "8px",
                    }}
                  >
                    <Skeleton height={20} />
                  </th>
                  <th
                    style={{
                      border: "1px solid #00bfff",
                      padding: "8px",
                    }}
                  >
                    <Skeleton height={20} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((index) => (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={20} />
                    </td>
                    <td
                      style={{
                        border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={20} />
                    </td>
                    <td
                      style={{
                        border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={20} />
                    </td>
                    <td
                      style={{
                        border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Render the actual data when loading is false
            <table
              style={{
                border: "2px solid black",
                borderCollapse: "collapse",
                width: "100%",
                textAlign: "left",
              }}
            >
              {/* ... (your table headers) */}

              <thead>
                <tr>
                  <th style={{ border: "2px solid black", padding: "8px" }}>
                    Visit Date
                  </th>
                  <th style={{ border: "2px solid black", padding: "8px" }}>
                    Diagnosis Name
                  </th>
                  <th style={{ border: "2px solid black", padding: "8px" }}>
                    ICD-10 Code
                  </th>
                  <th style={{ border: "2px solid black", padding: "8px" }}>
                    Treatment
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultData.map((entry, index) => (
                  <tr key={index}>
                    <td style={{ border: "2px solid black", padding: "8px" }}>
                      {entry["Visit Date"]}
                    </td>
                    <td style={{ border: "2px solid black", padding: "8px" }}>
                      {entry["Diagnosis Name"]}
                    </td>
                    <td style={{ border: "2px solid black", padding: "8px" }}>
                      {entry["ICD-10 Code"]}
                    </td>
                    <td style={{ border: "2px solid black", padding: "8px" }}>
                      {entry["Treatment"]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
