import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  Grid,
  TextField,
  Card,
  CardContent,
  Tooltip,
  CardActions,

} from "@mui/material";
import { Add, Replay } from "@mui/icons-material";
import { getUserFiles, getFileDetails, generatePivotTable, previewPivotTable } from "../services/api";
import PreviewComponent from "../components/PreviewComponent";
import NavigationBar from "../components/NavigationBar";

const GroupAndPivot = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileDetails, setFileDetails] = useState({});
  const [rowIndex, setRowIndex] = useState([]);
  const [columnIndex, setColumnIndex] = useState([]);
  const [pivotValues, setPivotValues] = useState([]);
  const [aggregationFunctions, setAggregationFunctions] = useState([]);
  const [pivotConfig, setPivotConfig] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [columns, setColumns] = useState([]);

  const addNotification = useCallback((type, text) => {
    setNotifications((prev) => [...prev, { type, text }]);
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const response = await getUserFiles();
        if (response?.files) {
          setFiles(response.files);
        } else {
          throw new Error("No files found.");
        }
      } catch (error) {
        addNotification("error", error.message || "Failed to fetch files.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, [addNotification]);

  const handleSearch = () => {
    const filteredFiles = files.filter((file) =>
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFiles(filteredFiles);
  };

  useEffect(() => {
    if (selectedFile) {
      const fetchFileDetails = async () => {
        setIsLoading(true);
        try {
          console.log(`Fetching details for file: ${selectedFile.fileName}`);
          const details = await getFileDetails(selectedFile.fileName);

          console.log("File details response:", details);

          if (details.fileType === "Excel") {
            setFileDetails(details?.sheets || {});
          } else if (details.fileType === "CSV") {
            setFileDetails({
              CSV: {
                columnTypes: details.columnTypes,
                columns: details.columns,
              },
            });
          }

          // Reset selections
          setSelectedSheet("");
          setColumns([]);
          addNotification("success", "File details loaded successfully");
        } catch (error) {
          console.error("Error fetching file details:", error);
          addNotification("error", error.message || "Failed to fetch file details");
        } finally {
          setIsLoading(false);
        }
      };

      fetchFileDetails();
    }
  }, [selectedFile, addNotification]);

  useEffect(() => {
    if (selectedSheet) {
      const sheetData = fileDetails[selectedSheet];
      setColumns(sheetData?.columns || []);
    }
  }, [selectedSheet, fileDetails]);

  const handleFileSelection = (file) => {
    setSelectedFile(file);
    addNotification("success", "File selected successfully");
  };

  const handleAddPivotConfig = () => {
    setPivotConfig((prev) => [...prev, { column: "", function: "sum" }]);
  };

  const handleUpdatePivotConfig = (index, field, value) => {
    setPivotConfig((prev) => {
      const updatedConfig = [...prev];
      updatedConfig[index][field] = value;
      return updatedConfig;
    });
  };

  const handleRemovePivotConfig = (index) => {
    setPivotConfig((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePivot = async () => {
    if (!selectedFile) {
      addNotification("error", "Please select a file to generate the pivot table.");
      return;
    }

    if (rowIndex.length === 0 || pivotConfig.length === 0) {
      addNotification("error", "Please configure the row index and pivot values.");
      return;
    }

    const payload = {
      fileName: selectedFile.fileName,
      rowIndex,
      columnIndex: columnIndex.length > 0 ? columnIndex : null,
      pivotValues: pivotConfig,
    };

    setIsLoading(true);
    try {
      const response = await generatePivotTable(payload);
      if (response?.success) {
        addNotification("success", "Pivot table generated successfully.");
      } else {
        throw new Error(response?.error || "Failed to generate pivot table.");
      }
    } catch (error) {
      addNotification("error", error.message || "Error generating pivot table.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewPivot = async () => {
    if (!selectedFile) {
      addNotification("error", "Please select a file to preview the pivot table.");
      return;
    }

    if (rowIndex.length === 0 || pivotConfig.length === 0) {
      addNotification("error", "Please configure the row index and pivot values for preview.");
      return;
    }

    const payload = {
      fileName: selectedFile.fileName,
      rowIndex,
      columnIndex: columnIndex.length > 0 ? columnIndex : null,
      pivotValues: pivotConfig,
    };

    setIsLoading(true);
    try {
      const response = await previewPivotTable(payload);
      if (response?.success) {
        const sanitizedData = {
          columns: response.data.columns,
          rows: response.data.rows.map((row) => {
            const formattedRow = {};
            response.data.columns.forEach((col) => {
              formattedRow[col] = row[col] === null || row[col] === undefined ? "N/A" : row[col];
            });
            return formattedRow;
          }),
        };
        setPreviewData(sanitizedData);
        setPreviewDialogOpen(true);
        addNotification("success", "Preview generated successfully.");
      } else {
        throw new Error(response?.error || "Failed to generate preview.");
      }
    } catch (error) {
      addNotification("error", error.message || "Error generating preview.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <NavigationBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {isLoading && (
          <Box
            sx={{
              position: "fixed",
              top: 10,
              right: 10,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CircularProgress size={30} />
            <Typography variant="body2">Processing...</Typography>
          </Box>
        )}

        <Typography variant="h4" gutterBottom sx={{ 
          textAlign: "center", 
          mb: 4,
          color: '#2C3E50'
        }}>
          Group and Pivot
        </Typography>

        {notifications.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {notifications.map((note, idx) => (
              <Alert key={idx} severity={note.type} sx={{ mb: 1 }}>
                {note.text}
              </Alert>
            ))}
          </Box>
        )}

        {/* Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <TextField
            label="Search Files"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            sx={{ 
              marginRight: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#B82132',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#B82132',
                },
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{
              backgroundColor: '#B82132',
              '&:hover': {
                backgroundColor: '#8E1A28',
              },
            }}
          >
            Search
          </Button>
        </Box>

        {/* File Selection Paper */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select File
          </Typography>
          
          {/* File Selection Grid */}
          <Box sx={{ marginBottom: 3 }}>
            {isLoading ? (
              <Box sx={{ textAlign: "center", marginY: 4 }}>
                <CircularProgress />
              </Box>
            ) : files.length > 0 ? (
              <Grid container spacing={3}>
                {files.map((file, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Checkbox
                            checked={selectedFile?.fileName === file.fileName}
                            onChange={() => handleFileSelection(file)}
                          />
                          <Tooltip title={file.fileName}>
                            <Typography
                              variant="h6"
                              noWrap
                              sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
                            >
                              {file.fileName}
                            </Typography>
                          </Tooltip>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Uploaded: {new Date(file.uploadTime).toLocaleString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="textSecondary" textAlign="center">
                No files found.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Sheet Selection Paper */}
        {selectedFile && !isLoading && (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Sheet
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Sheet</InputLabel>
              <Select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
              >
                {Object.keys(fileDetails).map((sheet) => (
                  <MenuItem key={sheet} value={sheet}>
                    {sheet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}

        {/* Pivot Configuration - Only show when sheet is selected */}
        {selectedSheet && (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pivot Configuration
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              Select Row Index (checkbox):
            </Typography>
            <Box sx={{ mb: 2 }}>
              {columns.map((col) => (
                <Box key={col}>
                  <Checkbox
                    checked={rowIndex.includes(col)}
                    onChange={(e) =>
                      setRowIndex((prev) =>
                        e.target.checked
                          ? [...prev, col]
                          : prev.filter((item) => item !== col)
                      )
                    }
                    sx={{
                      color: "#B82132",
                      '&.Mui-checked': {
                        color: "#B82132",
                      },
                    }}
                  />
                  {col}
                </Box>
              ))}
            </Box>

            <Typography variant="body2" gutterBottom>
              Select Column Index (optional):
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Select
                multiple
                value={columnIndex}
                onChange={(e) => {
                  const selectedValues = e.target.value;

                  // If "None" is selected, clear other selections
                  if (selectedValues.includes("None")) {
                    setColumnIndex(["None"]);
                  } else {
                    // Remove "None" if any other value is selected
                    setColumnIndex(selectedValues.filter((value) => value !== "None"));
                  }
                }}
                renderValue={(selected) => {
                  // Customize the display for selected values
                  if (selected.includes("None")) {
                    return "None";
                  }
                  return selected.join(", ");
                }}
              >
                <MenuItem value={"None"}>None</MenuItem>
                {columns
                  .filter((col) => !rowIndex.includes(col))
                  .map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>


            <Typography variant="body2" gutterBottom>
              Pivot Values:
            </Typography>
            {pivotConfig.map((config, index) => (
              <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Column</InputLabel>
                  <Select
                    value={config.column}
                    onChange={(e) =>
                      handleUpdatePivotConfig(index, "column", e.target.value)
                    }
                  >
                    {columns
                      .filter((col) =>
                        !rowIndex.includes(col) &&
                        !columnIndex.includes(col)
                      )
                      .map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Function</InputLabel>
                  <Select
                    value={config.function}
                    onChange={(e) =>
                      handleUpdatePivotConfig(index, "function", e.target.value)
                    }
                  >
                    {["count", "sum", "mean", "first", "last", "max", "min"].map((func) => (
                      <MenuItem key={func} value={func}>
                        {func}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  onClick={() => handleRemovePivotConfig(index)}
                  sx={{ alignSelf: "center" }}
                >
                  <Replay />
                </IconButton>
              </Box>
            ))}

            <Button onClick={handleAddPivotConfig} variant="outlined" startIcon={<Add />}>
              Add Column
            </Button>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                onClick={() => {
                  setRowIndex([]);
                  setColumnIndex([]);
                  setPivotConfig([]);
                }}
                variant="outlined"
                color="secondary"
                startIcon={<Replay />}
              >
                Reset
              </Button>
              <Button onClick={handlePreviewPivot} variant="outlined">
                Preview Pivot Table
              </Button>
              <Button 
                variant="contained"
                onClick={handleGeneratePivot}
                sx={{
                  backgroundColor: '#B82132',
                  '&:hover': {
                    backgroundColor: '#8E1A28',
                  },
                }}
              >
                Generate Pivot Table
              </Button>

            </Box>
            {previewDialogOpen && previewData && (
              <PreviewComponent
                previewData={[
                  {
                    sheetName: "Pivot Preview",
                    rows: previewData.rows,
                    columns: previewData.columns,
                  },
                ]}
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
              />
            )}
          </Paper>
        )}
      </Container>
    </NavigationBar>
  );
};

export default GroupAndPivot;
