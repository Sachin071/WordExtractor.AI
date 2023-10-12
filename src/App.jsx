import React, { useRef, useState } from "react";

import FileUploadButton from "./FileUploadButton";
import mammoth from "mammoth";
import Navbar from "./components/Navbar";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
// import jsPDF from "jspdf";
// import WebViewer from "@pdftron/webviewer";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultData, setResultData] = useState([]);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  // Create a reference to the div you want to print
  const printableDivRef = useRef(null);

  // Function to trigger the download of the content as a PDF
  const handleDownloadAsPDF = () => {
    const printableDiv = printableDivRef.current;

    if (printableDiv) {
      const pdfOptions = {
        margin: 10,
        filename: "document.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .from(printableDiv)
        .set(pdfOptions)
        .outputPdf((pdf) => {
          const blob = new Blob([pdf], { type: "application/pdf" });
          saveAs(blob, "document.pdf");
        });
    }
  };

  // Function to trigger the download of the content as a DOC
  const handleDownloadAsDOC = () => {
    // Create a new window to open the content as a data URL
    const printableDiv = printableDivRef.current;

    if (printableDiv) {
      const content = printableDiv.innerHTML;
      const dataUri =
        "data:text/doc;charset=UTF-8," + encodeURIComponent(content);
      saveAs(dataUri, "document.doc");
    }
  };

  // const handleDownloadPDF = () => {
  //   const pdf = new jsPDF();
  //   const printableDiv = printableDivRef.current;

  //   if (printableDiv) {
  //     pdf.text(printableDiv, 15, 15);
  //     pdf.save("document.pdf");
  //   }
  // };

  // Function to trigger the print dialog
  // const handlePrint = () => {
  //   const printableDiv = printableDivRef.current;

  //   if (printableDiv) {
  //     // Create a copy of the div content to avoid modifying the original
  //     const printableContent = printableDiv.cloneNode(true);

  //     // Create a new window to print the content
  //     const printWindow = window.open("", "", "width=600,height=600");
  //     printWindow.document.open();
  //     printWindow.document.write(
  //       "<html><head><title>Print</title></head><body>"
  //     );
  //     printWindow.document.write(printableContent.outerHTML);
  //     printWindow.document.write("</body></html>");
  //     printWindow.document.close();

  //     // Trigger the print dialog
  //     printWindow.print();
  //     printWindow.close();
  //   }
  // };

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
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "user",
          content:
            filteredText +
            " Prompt: From a medical document with sections like HPI, ASSESSMENT, PATIENT ACTIVE PROBLEM LIST, PHYSICAL EXAM, PAST HISTORY, PROBLEM LIST, etc., extract complete diagnosis details including the diagnosis name, ICD-10 code, treatment, and visit date from each section. Present this information in a table format. table should be complete and dont include anything other than table in response",
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
        console.log("result -- ", result);
        console.log(result.choices[0].message.content);
        const dataString = result.choices[0].message.content;
        // Parse the data string into an array of objects
        const rows = dataString.split("\n");
        const headerRow = rows[0].split("|").map((header) => header.trim());
        setHeaders(headerRow);
        const parsedData = [];

        // for (let i = 2; i < rows.length; i++) {
        //   const rowData = rows[i].split('|').map((cell) => cell.trim());
        //   const rowDataObject = {};
        //   headers.forEach((header, index) => {
        //     rowDataObject[header] = rowData[index];
        //   });
        //   parsedData.push(rowDataObject);
        // }

        // Loop through lines, skipping the header
        for (var i = 2; i < rows.length; i++) {
          // Split each line by the delimiter (|) and remove any leading/trailing spaces
          var columns = rows[i].split("|").map(function (column) {
            return column.trim();
          });

          // Create an object with the specified headers
          var entry = {
            "Visit Date": columns[1],
            "Diagnosis Name": columns[2],
            "ICD-10 Code": columns[3],
            Treatment: columns[4],
            Section: columns[5],
          };

          // Add the entry to the tableData array
          parsedData.push(entry);
        }

        console.log("parseData --", parsedData);

        await setResultData(parsedData);

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
      lines = await text.split("\n");

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

      setData(filteredText);

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
        {selectedFile && (
          <>
            <p>Selected File: {selectedFile.name}</p> <br />{" "}
            {/* <div>
              <h1>After removing credential Data before send API.</h1>
              {data}
            </div> */}
          </>
        )}

        {selectedFile === null ? (
          ""
        ) : (
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
                        // border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={40} />
                    </th>
                    <th
                      style={{
                        // border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={40} />
                    </th>
                    <th
                      style={{
                        // border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={40} />
                    </th>
                    <th
                      style={{
                        // border: "1px solid #00bfff",
                        padding: "8px",
                      }}
                    >
                      <Skeleton height={40} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((index) => (
                    <tr key={index}>
                      <td
                        style={{
                          // border: "1px solid #00bfff",
                          padding: "8px",
                        }}
                      >
                        <Skeleton height={40} />
                      </td>
                      <td
                        style={{
                          // border: "1px solid #00bfff",
                          padding: "8px",
                        }}
                      >
                        <Skeleton height={40} />
                      </td>
                      <td
                        style={{
                          // border: "1px solid #00bfff",
                          padding: "8px",
                        }}
                      >
                        <Skeleton height={40} />
                      </td>
                      <td
                        style={{
                          // border: "1px solid #00bfff",
                          padding: "8px",
                        }}
                      >
                        <Skeleton height={40} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // Render the actual data when loading is false
              <>
                <div ref={printableDivRef}>
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
                        {headers.map((header) => (
                          <th
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                            key={header}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {resultData.map((entry, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          ></td>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          >
                            {entry["Visit Date"]}
                          </td>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          >
                            {entry["Diagnosis Name"]}
                          </td>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          >
                            {entry["ICD-10 Code"]}
                          </td>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          >
                            {entry["Treatment"]}
                          </td>
                          <td
                            style={{
                              border: "2px solid black",
                              padding: "8px",
                            }}
                          >
                            {entry["Section"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* <button onClick={handlePrint}>Print</button>{" "} */}
                </div>
                {/* <button onClick={handleDownloadAsPDF}>Download as PDF</button>
                <button onClick={handleDownloadAsDOC}>Download as DOC</button> */}
              </>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
