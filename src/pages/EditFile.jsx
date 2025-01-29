import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { getUserFiles, getFileDetails, saveUpdatedFile, generateEditFilePreview } from "../services/api";
import NavigationBar from "../components/NavigationBar";
import PreviewComponent from "../components/PreviewComponent";
import { useSnackbar } from "notistack";

const EditFile = () => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedFiles, setDisplayedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [columnTypes, setColumnTypes] = useState({});
  const [newFileName, setNewFileName] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [showCount, setShowCount] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState({});
  const [selectedSheets, setSelectedSheets] = useState({});
  const [selectedDateFormats, setSelectedDateFormats] = useState({});
  const [fileName, setFileName] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  const toggleSheetSelection = (sheetName) => {
    setSelectedSheets((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        selected: !prev[sheetName].selected,
        columns: !prev[sheetName].selected ? [...fileDetails.sheets[sheetName].columns] : [],
      },
    }));
  };

  const toggleColumnSelection = (sheetName, columnName) => {
    setSelectedSheets((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        columns: prev[sheetName].columns.includes(columnName)
          ? prev[sheetName].columns.filter((col) => col !== columnName)
          : [...prev[sheetName].columns, columnName],
      },
    }));
  };

  // Rest of the component

  // Fetch files from backend
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await getUserFiles();
      if (response.files) {
        const sortedFiles = response.files.sort(
          (a, b) => new Date(b.uploadTime) - new Date(a.uploadTime)
        );
        setFiles(sortedFiles);
        setDisplayedFiles(sortedFiles.slice(0, showCount));
      } else {
        setNotifications([{ type: "error", text: "Error fetching files." }]);
      }
    } catch (error) {
      setNotifications([{ type: "error", text: "Error fetching files." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSearch = () => {
    const filteredFiles = files.filter((file) =>
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedFiles(filteredFiles.slice(0, showCount));
  };

  const handleDataTypeChange = (sheetName, columnName, newType) => {
    setColumnTypes((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        [columnName]: newType,
      },
    }));
  };

  const handleDateFormatChange = (sheetName, columnName, format) => {
    setSelectedDateFormats((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        [columnName]: format,
      },
    }));
  };


  const handleShowMore = () => {
    const newCount = showCount + 6;
    setShowCount(newCount);
    setDisplayedFiles(files.slice(0, newCount));
  };

  const handleShowLess = () => {
    const newCount = Math.max(6, showCount - 6);
    setShowCount(newCount);
    setDisplayedFiles(files.slice(0, newCount));
  };

  const handleFileEdit = async (file) => {
    setSelectedFile(file);
    setIsLoading(true);
    try {
      const response = await getFileDetails(file.fileName);

      if (response.fileType === "Excel" && response.sheets) {
        setFileDetails(response);
        const initialSelections = Object.keys(response.sheets).reduce((acc, sheetName) => {
          acc[sheetName] = {
            selected: true,
            columns: [...response.sheets[sheetName].columns],
          };
          return acc;
        }, {});
        setSelectedSheets(initialSelections);
      } else if (response.fileType === "CSV" && response.columns) {
        setFileDetails({
          ...response,
          sheets: { CSV: { columns: response.columns, columnTypes: response.columnTypes || {} } },
        });
        setSelectedSheets({
          CSV: {
            selected: true,
            columns: [...response.columns],
          },
        });
      } else {
        setNotifications([{ type: "error", text: "Invalid file details received." }]);
      }

      // Automatically set the default new filename
      const baseFileName = file.fileName.replace(/\.[^/.]+$/, ""); // Remove the extension
      const fileExtension = file.fileName.split(".").pop();
      setNewFileName(`${baseFileName}_EditedFile.${fileExtension}`);
      setEditDialogOpen(true);
    } catch (error) {
      setNotifications([{ type: "error", text: "Error fetching file details." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewFile = async () => {
    const sanitizedSelectedSheets = Object.entries(selectedSheets).reduce((acc, [sheetName, sheetData]) => {
      if (sheetData.selected && sheetData.columns.length > 0) {
        acc[sheetName] = {
          columns: sheetData.columns,
          columnTypes: columnTypes[sheetName] || {},
        };
      }
      return acc;
    }, {});

    // const datetimeFormats = Object.entries(columnTypes).reduce((acc, [sheetName, types]) => {
    //   acc[sheetName] = Object.entries(types).reduce((innerAcc, [column, type]) => {
    //     if (type === "datetime") {
    //       innerAcc[column] = selectedDateFormats[sheetName]?.[column] || "";
    //     }
    //     return innerAcc;
    //   }, {});
    //   return acc;
    // }, {});

    if (Object.keys(sanitizedSelectedSheets).length === 0) {
      setNotifications([{ type: "error", text: "No sheets or columns selected." }]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await generateEditFilePreview({
        fileName: selectedFile.fileName,
        selectedSheets: sanitizedSelectedSheets,
        //datetimeFormats,
      });

      if (response.success && response.previewData) {
        const { previewData, columnTypes: apiColumnTypes } = response;

        const sanitizedPreviewData = {};
        Object.entries(previewData).forEach(([sheetName, rows]) => {
          sanitizedPreviewData[sheetName] = rows.map((row) => {
            const sanitizedRow = {};
            Object.entries(row).forEach(([key, value]) => {
              sanitizedRow[key] =
                value === null || value === undefined || Number.isNaN(value)
                  ? "N/A"
                  : value;
            });
            return sanitizedRow;
          });
        });

        const updatedColumnTypes = { ...columnTypes };
        Object.entries(apiColumnTypes || {}).forEach(([sheetName, columns]) => {
          updatedColumnTypes[sheetName] = {
            ...updatedColumnTypes[sheetName],
            ...columns,
          };
        });

        setPreviewData(sanitizedPreviewData);
        //setColumnTypes(updatedColumnTypes);
        setPreviewDialogOpen(true);
      } else {
        setNotifications([{ type: "error", text: response.error || "Failed to generate preview." }]);
      }
    } catch (error) {
      setNotifications([{ type: "error", text: "Error generating preview." }]);
      console.error("Error in handlePreviewFile:", error);
    } finally {
      setIsLoading(false);
    }
  };




  const handleSaveFile = async () => {
    const sanitizedSelectedSheets = Object.entries(selectedSheets).reduce((acc, [sheetName, sheetData]) => {
      if (sheetData.selected && sheetData.columns.length > 0) {
        acc[sheetName] = {
          columns: sheetData.columns,
          columnTypes: columnTypes[sheetName], // Include column types for the selected sheet
        };
      }
      return acc;
    }, {});

    if (Object.keys(sanitizedSelectedSheets).length === 0) {
      setNotifications([{ type: "error", text: "No sheets or columns selected." }]);
      return;
    }

    const fileExtension = selectedFile.fileName.split(".").pop();
    const baseFileName = selectedFile.fileName.replace(/\.[^/.]+$/, ""); // Remove the extension
    const newFileNameWithExtension = replaceExisting
      ? selectedFile.fileName
      : newFileName || `${baseFileName}_EditedFile.${fileExtension}`;

    const payload = {
      fileName: selectedFile.fileName,
      newFileName: newFileNameWithExtension,
      replaceExisting,
      selectedSheets: sanitizedSelectedSheets,
    };

    try {
      setIsLoading(true);
      const response = await saveUpdatedFile(payload);

      if (response.success) {
        setNotifications([{ type: "success", text: "File updated successfully!" }]);
        setEditDialogOpen(false);
        fetchFiles();
      } else {
        setNotifications([{ type: "error", text: "Error saving the file." }]);
      }
    } catch (error) {
      setNotifications([{ type: "error", text: "Error saving the file." }]);
      console.error("Save File Error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <NavigationBar>
      <Container maxWidth="lg" sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Files
        </Typography>

        {/* Notifications */}
        {notifications.map((notification, index) => (
          <Alert key={index} severity={notification.type} sx={{ marginBottom: 2 }}>
            {notification.text}
          </Alert>
        ))}

        {/* Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <TextField
            label="Search Files"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ marginRight: 2 }}
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>

        {/* Files Display */}
        {isLoading ? (
          <Box sx={{ textAlign: "center", marginY: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayedFiles.length > 0 ? (
          <Grid container spacing={3}>
            {displayedFiles.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Tooltip title={file.fileName}>
                      <Typography
                        variant="h6"
                        noWrap
                        sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
                      >
                        {file.fileName}
                      </Typography>
                    </Tooltip>
                    <Typography variant="body2" color="textSecondary">
                      Uploaded: {new Date(file.uploadTime).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => handleFileEdit(file)}
                    >
                      Edit File
                    </Button>
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
        {selectedFile && (
          <Box sx={{ marginTop: 4 }}>
            {/* File Name Header */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "primary.main" }}>
              Editing File: {selectedFile.fileName}
            </Typography>

            {/* Sheet and Column Selections */}
            <Typography variant="h6" gutterBottom>
              Sheet and Column Selections
            </Typography>
            <Box>
              {fileDetails?.fileType === "Excel" && fileDetails.sheets
                ? Object.entries(fileDetails.sheets).map(([sheetName, sheetData]) => (
                  <Box key={sheetName} sx={{ marginBottom: 4 }}>
                    {/* Sheet Selection */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSheets[sheetName]?.selected}
                          onChange={() => toggleSheetSelection(sheetName)}
                        />
                      }
                      label={<Typography variant="h6">Sheet: {sheetName}</Typography>}
                    />
                    <Box sx={{ marginLeft: 4 }}>
                      {/* Column Selection */}
                      {sheetData.columns.map((column) => (
                        <Box
                          key={column}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            mb: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedSheets[sheetName]?.columns.includes(column)}
                                onChange={() => toggleColumnSelection(sheetName, column)}
                                disabled={!selectedSheets[sheetName]?.selected}
                              />
                            }
                            label={column}
                          />
                          {/* Data Type Dropdown */}
                          {selectedSheets[sheetName]?.columns.includes(column) && (
                            <FormControl sx={{ minWidth: 180 }}>
                              <InputLabel>Data Type</InputLabel>
                              <Select
                                value={columnTypes[sheetName]?.[column] || "string"}
                                onChange={(e) =>
                                  handleDataTypeChange(sheetName, column, e.target.value)
                                }
                              >
                                <MenuItem value="string">String</MenuItem>
                                <MenuItem value="integer">Integer</MenuItem>
                                <MenuItem value="float">Float</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))
                : fileDetails?.fileType === "CSV" &&
                fileDetails.columns.map((column) => (
                  <Box
                    key={column}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      mb: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSheets.CSV?.columns.includes(column)}
                          onChange={() => toggleColumnSelection("CSV", column)}
                        />
                      }
                      label={column}
                    />
                    {/* Data Type Dropdown */}
                    {selectedSheets.CSV?.columns.includes(column) && (
                      <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel>Data Type</InputLabel>
                        <Select
                          value={columnTypes.CSV?.[column] || "string"}
                          onChange={(e) =>
                            handleDataTypeChange("CSV", column, e.target.value)
                          }
                        >
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="integer">Integer</MenuItem>
                          <MenuItem value="float">Float</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                          <MenuItem value="date">Date</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                ))}
            </Box>

            {/* Action Section */}
            <Box sx={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Replace Existing Option */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={replaceExisting}
                      onChange={() => setReplaceExisting(!replaceExisting)}
                      sx={{
                        color: "#f44336", // Red for destructive actions
                        "&.Mui-checked": {
                          color: "#f44336",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: "#424242" }}>
                      Replace Existing File
                    </Typography>
                  }
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#616161", fontStyle: "italic", maxWidth: 300 }}
                >
                  {replaceExisting
                    ? "The selected file will be replaced with the new version. You can still provide a new file name."
                    : "A new file will be created with the name specified below."}
                </Typography>
              </Box>
                      
              {/* New File Name Input */}
              <TextField
                label="New File Name"
                variant="outlined"
                fullWidth
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={
                  replaceExisting
                    ? "Enter a new file name (optional)"
                    : "Enter a new file name for the saved file"
                }
                sx={{ maxWidth: 400 }}
              />

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handlePreviewFile}>
                  Preview File
                </Button>
                <Button variant="contained" color="success" onClick={handleSaveFile}>
                  Save File
                </Button>
              </Box>
            </Box>



          </Box>
        )}


        {/* Preview Section */}
        {previewDialogOpen && previewData && columnTypes && (
          <PreviewComponent
            previewData={Object.keys(previewData).map((sheetName) => {
              const rows = previewData[sheetName] || [];
              const columns = selectedSheets[sheetName]?.columns || []; // Use selected columns
              return {
                sheetName,
                rows: rows.map((row) => {
                  const formattedRow = {};
                  columns.forEach((col) => {
                    const value = row[col];
                    formattedRow[col] =
                      value === null || value === undefined || Number.isNaN(value)
                        ? "N/A"
                        : value;
                  });
                  return formattedRow;
                }),
                columns, // Include all selected columns
              };
            })}
            open={previewDialogOpen}
            onClose={() => setPreviewDialogOpen(false)}
          />

        )}

        {/* Backup Preview Section */}
        {previewData && previewData.columns && previewData.rows && (
          <PreviewComponent
            previewData={previewData.rows.map((row) => {
              const formattedRow = {};
              previewData.columns.forEach((col) => {
                formattedRow[col] = row[col] || "-"; // Replace null/undefined values
              });
              return formattedRow;
            })}
            open={true}
            onClose={() => setPreviewDialogOpen(false)}
          />
        )}

      </Container>
    </NavigationBar>
  );
};

export default EditFile;
