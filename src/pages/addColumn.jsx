import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getUserFiles, getFileDetails, previewFileWithColumn } from "../services/api";

const AddColumn = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [columns, setColumns] = useState([]);
  const [operations, setOperations] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const response = await getUserFiles();
        if (response.files) {
          setFiles(response.files);
        } else {
          setError("No files found.");
        }
      } catch (err) {
        setError("Failed to fetch files.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const handleFileSelect = async (fileName) => {
    setSelectedFile(fileName);
    setSelectedSheet(null);
    setPreviewData(null);
    setColumns([]);
    setIsLoading(true);
    try {
      const response = await getFileDetails(fileName);
      setFileType(response.fileType);

      if (response.fileType === "Excel" && response.sheets) {
        setSheets(Object.keys(response.sheets));
      } else if (response.fileType === "CSV" && response.columns) {
        setColumns(response.columns);
      } else {
        setError("No sheets or columns found for the selected file.");
      }
    } catch (err) {
      setError("Failed to fetch file details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSelect = async (sheetName) => {
    setSelectedSheet(sheetName);
    setPreviewData(null);
    setIsLoading(true);
  
    try {
      const response = await getFileDetails(selectedFile, sheetName);
  
      console.log("Sheet Details Response:", response); // Debugging the response
  
      if (response && response.sheets && response.sheets[sheetName]) {
        // Access columns dynamically based on the selected sheet
        const sheetColumns = response.sheets[sheetName];
        setColumns(sheetColumns);
        console.log("Columns for Selected Sheet:", sheetColumns); // Debug columns
      } else {
        setError("No columns found for the selected sheet.");
        console.error("No columns found in response for the sheet:", sheetName);
      }
    } catch (err) {
      console.error("Error fetching sheet details:", err);
      setError("Failed to fetch sheet details.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handlePreviewFile = async () => {
    if (!selectedFile) {
        alert("Please select a file to preview.");
        return;
    }

    setIsLoading(true);
    try {
            const data = await previewFileWithColumn({
            fileName: selectedFile,
            selectedSheets: {}, // Add any selected sheet logic
            // Assuming `selectedFile` is an object with a `fileName` property
            newColumnName: newColumnName || "new_column", // Optional, defaults to "new_column"
            operations: operations.map(op => ({
              leftOperand: op.leftOperand,
              operator: op.operator,
              rightOperand: op.rightOperand,
              fixedValue: op.fixedValue || null,
            })),
          });
          const response = JSON.parse(data.replace(/\bNaN\b/g, "null"));
          console.log("type",typeof response)
        // Check the response
        if (response.success) {
            setPreviewData(response.previewData?.CSV || response.previewData); // Handle CSV-specific data
            setColumns(response.columns || []); // Update columns if provided
            setError(null); // Clear previous errors
        } else {
            // Log and set the error message if `success` is false
            console.error("API Response Error:", response.error || "Unknown error");
            setError(response.error || "Failed to load preview data.");
        }
    } catch (err) {
        console.error("Error in handlePreviewFile:", err);
        setError(err.message || "Failed to fetch preview.");
    } finally {
        setIsLoading(false);
    }
};


  const addOperation = () => {
    setOperations([...operations, { leftOperand: "", operator: "+", rightOperand: "", fixedValue: "" }]);
  };

  const handleOperationChange = (index, field, value) => {
    const updatedOperations = [...operations];
    updatedOperations[index][field] = value;
    if (field === "rightOperand" && value !== "Fixed Value") {
      updatedOperations[index].fixedValue = "";
    }
    setOperations(updatedOperations);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Add New Column
      </Typography>

      {isLoading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select a File</InputLabel>
          <Select value={selectedFile} onChange={(e) => handleFileSelect(e.target.value)} label="Select a File">
            {files.map((file) => (
              <MenuItem key={file.fileName} value={file.fileName}>
                {file.fileName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {fileType === "Excel" && sheets.length > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select a Sheet</InputLabel>
          <Select value={selectedSheet} onChange={(e) => handleSheetSelect(e.target.value)} label="Select a Sheet">
            {sheets.map((sheet) => (
              <MenuItem key={sheet} value={sheet}>
                {sheet}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {columns.length > 0 && (
        <>
          <TextField
            label="New Column Name"
            fullWidth
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            sx={{ mb: 2 }}
          />

          {operations.map((op, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel>Left Operand</InputLabel>
                  <Select
                    value={op.leftOperand}
                    onChange={(e) => handleOperationChange(index, "leftOperand", e.target.value)}
                  >
                    {columns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={op.operator}
                    onChange={(e) => handleOperationChange(index, "operator", e.target.value)}
                  >
                    <MenuItem value="+">+</MenuItem>
                    <MenuItem value="-">-</MenuItem>
                    <MenuItem value="*">*</MenuItem>
                    <MenuItem value="/">/</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel>Right Operand</InputLabel>
                  <Select
                    value={op.rightOperand}
                    onChange={(e) => handleOperationChange(index, "rightOperand", e.target.value)}
                  >
                    {columns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                    <MenuItem value="Fixed Value">Fixed Value</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {op.rightOperand === "Fixed Value" && (
                <Grid item xs={3}>
                  <TextField
                    label="Fixed Value"
                    fullWidth
                    value={op.fixedValue}
                    onChange={(e) => handleOperationChange(index, "fixedValue", e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          ))}

          <Button onClick={addOperation} variant="outlined" sx={{ mt: 2 }}>
            Add Operation
          </Button>
        </>
      )}

      {previewData && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Preview
          </Typography>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      backgroundColor: "#f2f2f2",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {row[col] !== undefined && row[col] !== null ? row[col] : "N/A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <pre>{JSON.stringify(previewData, null, 2)}</pre> {/* Debugging preview data */}
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePreviewFile}
          sx={{ mr: 2 }}
        >
          Preview File
        </Button>
        <Button variant="outlined" color="secondary">
          Submit
        </Button>
      </Box>
    </Container>
  );
};

export default AddColumn;
