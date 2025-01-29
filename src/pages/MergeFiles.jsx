import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Alert,
  Paper,
  Button,
  CircularProgress,
  Checkbox,
  TextField,
  InputAdornment,
  List,
  ListItem,
  Divider,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  InputLabel  
} from "@mui/material";
import { Search as SearchIcon, Add, Delete, Replay } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import {
  previewMergedFile,
  saveMergedFile,
  getUserFiles,
  getFileDetails,
} from "../services/api";
import NavigationBar from "../components/NavigationBar";
import PreviewComponent from "../components/PreviewComponent";


const MergeFiles = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState({});
  const [mergeType, setMergeType] = useState("horizontal");
  const [mergeKeys, setMergeKeys] = useState([{ sheet1: "", column1: "", sheet2: "", column2: "" }]);
  const [mergeMethod, setMergeMethod] = useState("inner");
  const [showCountSummary, setShowCountSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [verticalSheets, setVerticalSheets] = useState({ sheet1: "", sheet2: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  const addNotification = useCallback((type, text) => {
    enqueueSnackbar(text, { variant: type });
  }, [enqueueSnackbar]);

useEffect(() => {
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await getUserFiles();
      if (response?.files && Array.isArray(response.files)) {
        setFiles(response.files);
      } else {
        throw new Error(response?.message || "No valid files found in the response.");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      addNotification("error", "Failed to fetch files.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchFiles();
}, [addNotification]);



useEffect(() => {
  const fetchFileDetails = async () => {
    if (selectedFiles.length === 2) {
      setIsLoading(true);
      try {
        const [file1, file2] = selectedFiles;
        if (!file1?.fileName || !file2?.fileName) {
          throw new Error("Invalid selected files.");
        }

        const [details1, details2] = await Promise.all([
          getFileDetails(file1.fileName),
          getFileDetails(file2.fileName),
        ]);

        setFileDetails({
          [file1.fileName]: details1?.sheets || { CSV: { columns: details1?.columns || [] } },
          [file2.fileName]: details2?.sheets || { CSV: { columns: details2?.columns || [] } },
        });
      } catch (error) {
        console.error("Error fetching file details:", error);
        addNotification("error", error.message || "Failed to fetch file details.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setFileDetails({});
    }
  };

  fetchFileDetails();
}, [selectedFiles, addNotification]);

useEffect(() => {
  if (selectedFiles.length !== 2) {
    setVerticalSheets({ sheet1: "", sheet2: "" });
  }
}, [selectedFiles]);


const handleFileSelection = (file) => {
  if (!file?.fileName) {
    addNotification("error", "Invalid file selected.");
    return;
  }

  setSelectedFiles((prev) => {
    const isAlreadySelected = prev.some((selected) => selected.fileName === file.fileName);

    if (isAlreadySelected) {
      // Remove if already selected
      return prev.filter((selected) => selected.fileName !== file.fileName);
    }

    if (prev.length >= 2) {
      addNotification("error", "You can select only 2 files.");
      return prev; // Return unchanged state if limit is reached
    }

    // Add new file to selection
    return [...prev, file];
  });
};



const handleVerticalSheetChange = (fileIndex, sheet) => {
  setVerticalSheets((prev) => ({
    ...prev,
    [fileIndex === 0 ? "sheet1" : "sheet2"]: sheet,
  }));
};


// Add Merge Key
const addMergeKey = () => {
  setMergeKeys((prev) => [...prev, { sheet1: "", column1: "", sheet2: "", column2: "" }]);
};

// Remove Merge Key
const removeMergeKey = (index) => {
  if (mergeKeys.length > 1) {
    setMergeKeys((prev) => prev.filter((_, i) => i !== index));
  }
};

// Handle Key Change for Horizontal Merge
const handleKeyChange = (index, field, value) => {
  setMergeKeys((prev) => {
    const updatedKeys = [...prev];
    updatedKeys[index][field] = value;

    if (field === "sheet1") updatedKeys[index].column1 = "";
    if (field === "sheet2") updatedKeys[index].column2 = "";

    return updatedKeys;
  });
};

// Reset All Configurations
const resetConfiguration = () => {
  setSelectedFiles([]);
  setMergeKeys([{ sheet1: "", column1: "", sheet2: "", column2: "" }]);
  setMergeType("horizontal");
  setMergeMethod("inner");
  setFileDetails({});
  setNotifications([]);
  setPreviewData([]);
  setPreviewDialogOpen(false);
};

  const handlePreview = async () => {
    if (selectedFiles.length !== 2) {
      addNotification("error", "Please select exactly 2 files to preview.");
      return;
    }
  
    if (!mergeType) {
      addNotification("error", "Please select a merge type (horizontal or vertical).");
      return;
    }
  
    if (
      mergeType === "vertical" &&
      (!verticalSheets.sheet1 || !verticalSheets.sheet2)
    ) {
      addNotification(
        "error",
        "Please select sheets for both files for a vertical merge."
      );
      return;
    }
  
    if (
      mergeType === "horizontal" &&
      (!mergeKeys.length || mergeKeys.some((key) => !key.sheet1 || !key.sheet2 || !key.column1 || !key.column2))
    ) {
      addNotification(
        "error",
        "Please ensure that all key pairs and sheets are selected for a horizontal merge."
      );
      return;
    }
  
    const payload = {
      file1Name: selectedFiles[0].fileName,
      file2Name: selectedFiles[1].fileName,
      mergeType,
      file1SheetName: mergeType === "vertical" ? verticalSheets.sheet1 : mergeKeys[0]?.sheet1,
      file2SheetName: mergeType === "vertical" ? verticalSheets.sheet2 : mergeKeys[0]?.sheet2,
      keyPairs: mergeType === "horizontal" 
        ? mergeKeys.map((key) => ({
            left: key.column1,
            right: key.column2,
          })) 
        : [],
      mergeMethod,
      showCountSummary,
    };
  
    setIsLoading(true);
    try {
      const response = await previewMergedFile(payload);
  
      if (response?.success) {
        setPreviewData(response.previewData);
        setPreviewDialogOpen(true);
      } else {
        throw new Error(response?.error || "Failed to generate preview.");
      }
    } catch (error) {
      addNotification("error", error.message || "Error generating preview.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (selectedFiles.length !== 2) {
      addNotification("error", "Please select exactly 2 files to merge.");
      return;
    }

    const payload = {
      file1Name: selectedFiles[0].fileName,
      file2Name: selectedFiles[1].fileName,
      mergeType,
      file1SheetName: mergeType === "vertical" ? verticalSheets.sheet1 : mergeKeys[0]?.sheet1,
      file2SheetName: mergeType === "vertical" ? verticalSheets.sheet2 : mergeKeys[0]?.sheet2,
      keyPairs: mergeType === "horizontal" ? mergeKeys.map((key) => ({
        left: key.column1,
        right: key.column2,
      })) : [],
      mergeMethod,
      showCountSummary,
    };
    

    setIsLoading(true);
    try {
      const response = await saveMergedFile(payload);
      if (response?.success) {
        addNotification("success", "Merged file saved successfully.");
      } else {
        throw new Error(response?.error || "Unexpected error occurred while saving the merged file.");
      }
    } catch (error) {
      addNotification("error", error.message || "Error saving the merged file.");
    } finally {
      setIsLoading(false);
    }
  };

  
  

  return (
    <NavigationBar>
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Loading Indicator */}
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(255, 255, 255, 0.8)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Processing...
          </Typography>
        </Box>
      )}
  
      {/* Page Title */}
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center", mb: 4 }}>
        Merge Files
      </Typography>
  
    
  
      {/* File Selection Section */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Select Files (Exactly 2)
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Please select two files for merging.
        </Typography>
  
        {/* File Search */}
        <TextField
          fullWidth
          placeholder="Search files..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
  
        {/* File List */}
        <List>
          {files.map((file, index) => (
            <React.Fragment key={file.fileName || `file-${index}`}>
              <ListItem
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Checkbox
                    checked={selectedFiles.some(
                      (selectedFile) => selectedFile.fileName === file.fileName
                    )}
                    onChange={() => handleFileSelection(file)}
                  />
                  <Tooltip title={file.fileName} arrow>
                    <Typography
                      variant="body1"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "300px",
                      }}
                    >
                      {file.fileName}
                    </Typography>
                  </Tooltip>
                </Box>
                <Button
                  variant="outlined"
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </Button>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
  
      {/* Merge Type Selection */}
      {selectedFiles.length === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Merge Type
          </Typography>
          <FormControl>
            <RadioGroup
              value={mergeType}
              onChange={(e) => setMergeType(e.target.value)}
              row
            >
              <FormControlLabel
                value="horizontal"
                control={<Radio />}
                label="Horizontal"
              />
              <FormControlLabel
                value="vertical"
                control={<Radio />}
                label="Vertical"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      )}
  
      {/* Horizontal Merge Configuration */}
      {mergeType === "horizontal" && selectedFiles.length === 2 && (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" gutterBottom>
      Horizontal Merge Configuration
    </Typography>
    {mergeKeys.map((key, index) => (
      <Box key={index} sx={{ display: "flex", mb: 2, gap: 2 }}>
        {/* Sheet 1 */}
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Sheet for {selectedFiles[0]?.fileName}</InputLabel>
          <Select
            value={key.sheet1}
            onChange={(e) => handleKeyChange(index, "sheet1", e.target.value)}
          >
            {Object.keys(fileDetails[selectedFiles[0]?.fileName] || {}).map((sheet) => (
              <MenuItem key={sheet} value={sheet}>
                {sheet}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Column 1 */}
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Key for {selectedFiles[0]?.fileName}</InputLabel>
          <Select
            value={key.column1}
            onChange={(e) => handleKeyChange(index, "column1", e.target.value)}
            disabled={!key.sheet1}
          >
            {(fileDetails[selectedFiles[0]?.fileName]?.[key.sheet1]?.columns || []).map(
              (col) => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>

        {/* Sheet 2 */}
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Sheet for {selectedFiles[1]?.fileName}</InputLabel>
          <Select
            value={key.sheet2}
            onChange={(e) => handleKeyChange(index, "sheet2", e.target.value)}
          >
            {Object.keys(fileDetails[selectedFiles[1]?.fileName] || {}).map((sheet) => (
              <MenuItem key={sheet} value={sheet}>
                {sheet}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Column 2 */}
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Key for {selectedFiles[1]?.fileName}</InputLabel>
          <Select
            value={key.column2}
            onChange={(e) => handleKeyChange(index, "column2", e.target.value)}
            disabled={!key.sheet2}
          >
            {(fileDetails[selectedFiles[1]?.fileName]?.[key.sheet2]?.columns || []).map(
              (col) => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>

        {/* Remove Key Button */}
        <IconButton
          onClick={() => removeMergeKey(index)}
          disabled={mergeKeys.length === 1}
          sx={{ alignSelf: "center" }}
        >
          <Delete />
        </IconButton>
      </Box>
    ))}
    <Button onClick={addMergeKey} variant="outlined" startIcon={<Add />}>
      Add Key
    </Button>

    {/* Merge Method Dropdown */}
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Select Merge Method
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Merge Method</InputLabel>
        <Select
          value={mergeMethod}
          onChange={(e) => setMergeMethod(e.target.value)}
        >
          <MenuItem value="inner">Inner</MenuItem>
          <MenuItem value="left">Left</MenuItem>
          <MenuItem value="right">Right</MenuItem>
          <MenuItem value="outer">Outer</MenuItem>
        </Select>
      </FormControl>
    </Box>
  </Box>
)}{mergeType === "vertical" && selectedFiles.length === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Vertical Merge Configuration
          </Typography>
          <Box sx={{ display: "flex", mb: 2, gap: 2 }}>
            {/* Sheet 1 Selection */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Sheet for {selectedFiles[0]?.fileName}</InputLabel>
              <Select
                value={verticalSheets.sheet1}
                onChange={(e) => handleVerticalSheetChange(0, e.target.value)}
              >
                {Object.keys(fileDetails[selectedFiles[0]?.fileName] || {}).map((sheet) => (
                  <MenuItem key={sheet} value={sheet}>
                    {sheet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
      
            {/* Sheet 2 Selection */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Sheet for {selectedFiles[1]?.fileName}</InputLabel>
              <Select
                value={verticalSheets.sheet2}
                onChange={(e) => handleVerticalSheetChange(1, e.target.value)}
              >
                {Object.keys(fileDetails[selectedFiles[1]?.fileName] || {}).map((sheet) => (
                  <MenuItem key={sheet} value={sheet}>
                    {sheet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}
      
  
      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          onClick={resetConfiguration}
          variant="outlined"
          color="secondary"
          startIcon={<Replay />}
        >
          Reset
        </Button>
        <Button
          onClick={handlePreview}
          variant="contained"
          disabled={selectedFiles.length !== 2}
        >
          Preview
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={selectedFiles.length !== 2}
        >
          Save File
        </Button>
      </Box>
  
      {previewDialogOpen && previewData && Array.isArray(previewData) && previewData.length > 0 ? (
  <PreviewComponent
    previewData={previewData.map((sheet, index) => ({
      sheetName: sheet.sheetName || `Sheet ${index + 1}`,
      rows: Array.isArray(sheet.rows) ? sheet.rows : [],
      columns: Array.isArray(sheet.columns) ? sheet.columns : [],
    }))}
    open={previewDialogOpen}
    onClose={() => setPreviewDialogOpen(false)}
  />
) : (
  <Typography
    variant="body2"
    color="textSecondary"
    textAlign="center"
    sx={{ marginTop: 2 }}
  >
    No data available for preview. Please check your selection or data format.
  </Typography>
)}


    </Container>
  </NavigationBar>
  
  )
};

export default MergeFiles;
