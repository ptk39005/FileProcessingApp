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
  InputLabel,
  Stepper,
  Step,
  StepLabel
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

const steps = [
  "Select Files",
  "Review & Submit"
];

const MergeFiles = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState({});
  const [mergeType, setMergeType] = useState("horizontal");
  const [mergeKeys, setMergeKeys] = useState([{ left: "", right: "" }]);
  const [showSummary, setShowSummary] = useState(false);
  const [mergeMethod, setMergeMethod] = useState("inner");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [verticalSheets, setVerticalSheets] = useState({ sheet1: "", sheet2: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [readyToProceed, setReadyToProceed] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");

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
    if (selectedFiles.length > 0) {
      setIsLoading(true);
      try {
        const detailsPromises = selectedFiles.map(file => 
          getFileDetails(file.fileName)
        );
        
        const details = await Promise.all(detailsPromises);
        
        const newFileDetails = {};
        selectedFiles.forEach((file, index) => {
          newFileDetails[file.fileName] = details[index]?.sheets || 
            { CSV: { columns: details[index]?.columns || [] } };
        });

        setFileDetails(newFileDetails);
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
      addNotification("error", "You can select maximum 2 files.");
      return prev;
    }

    // Add new file to selection
    return [...prev, file];
  });
};



const handleVerticalSheetChange = (fileIndex, sheet) => {
  setVerticalSheets((prev) => {
    const newSheets = {
      ...prev,
      [fileIndex === 0 ? "sheet1" : "sheet2"]: sheet,
    };

    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1] || file1;

    if (file1.fileName === file2.fileName && newSheets.sheet1 === newSheets.sheet2) {
      addNotification("error", "Please select different sheets when using the same file.");
      return prev;
    }

    return newSheets;
  });
};


// Add Merge Key
const addKeyPair = () => {
  setMergeKeys(prev => [...prev, { left: "", right: "" }]);
};

// Remove Merge Key
const removeMergeKey = (index) => {
  if (mergeKeys.length > 1) {
    setMergeKeys((prev) => prev.filter((_, i) => i !== index));
  }
};

// Handle Key Change for Horizontal Merge
const updateKeyPair = (index, side, value) => {
  setMergeKeys(prev => {
    const newKeys = [...prev];
    newKeys[index][side] = value;
    return newKeys;
  });
};

// Reset All Configurations
const resetConfiguration = () => {
  setSelectedFiles([]);
  setMergeKeys([{ left: "", right: "" }]);
  setMergeType("horizontal");
  setMergeMethod("inner");
  setFileDetails({});
  setNotifications([]);
  setPreviewData([]);
  setPreviewDialogOpen(false);
};

  const handlePreview = async () => {
    if (selectedFiles.length === 0) {
      addNotification("error", "Please select at least 1 file.");
      return;
    }

    // If only one file is selected, use it for both file1 and file2
    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1] || file1;  // Use file1 if file2 doesn't exist

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
      (!mergeKeys.length || mergeKeys.some((key) => !key.left || !key.right))
    ) {
      addNotification(
        "error",
        "Please ensure that all key pairs are selected for a horizontal merge."
      );
      return;
    }
  
    const payload = {
      file1Name: file1.fileName,
      file2Name: file2.fileName,  // This will be the same as file1Name if only one file selected
      mergeType,
      file1SheetName: verticalSheets.sheet1,
      file2SheetName: verticalSheets.sheet2,
      keyPairs: mergeType === "horizontal" 
        ? mergeKeys.map((key) => ({
            left: key.left,
            right: key.right,
          })) 
        : [],
      mergeMethod,
      outputFileName
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
    if (!outputFileName.trim()) {
      addNotification("error", "Please enter an output file name.");
      return;
    }

    if (selectedFiles.length === 0) {
      addNotification("error", "Please select at least 1 file.");
      return;
    }

    // If only one file is selected, use it for both file1 and file2
    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1] || file1;  // Use file1 if file2 doesn't exist

    const payload = {
      file1Name: file1.fileName,
      file2Name: file2.fileName,  // This will be the same as file1Name if only one file selected
      mergeType,
      file1SheetName: verticalSheets.sheet1,
      file2SheetName: verticalSheets.sheet2,
      keyPairs: mergeType === "horizontal" 
        ? mergeKeys.map((key) => ({
            left: key.left,
            right: key.right,
          })) 
        : [],
      mergeMethod,
      outputFileName
    };
    

    setIsLoading(true);
    try {
      const response = await saveMergedFile(payload);
      if (response?.success) {
        addNotification("success", "Merged file saved successfully.");
        setPreviewDialogOpen(false);
      } else {
        throw new Error(response?.error || "Failed to save merged file.");
      }
    } catch (error) {
      addNotification("error", error.message || "Error saving the merged file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle showing more/less files
  const displayedFiles = showAllFiles ? files : files.slice(0, 5);

  const handleProceedWithFiles = async () => {
    if (selectedFiles.length === 0) {
      addNotification("error", "Please select at least 1 file.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Get file details for selected files
      const detailsPromises = selectedFiles.map(file => 
        getFileDetails(file.fileName)
      );
      
      const details = await Promise.all(detailsPromises);
      
      // Update file details with sheet information
      const newFileDetails = {};
      selectedFiles.forEach((file, index) => {
        newFileDetails[file.fileName] = details[index]?.sheets || 
          { CSV: { columns: details[index]?.columns || [] } };
      });

      setFileDetails(newFileDetails);

      // Reset merge configuration when files change
      if (selectedFiles.length === 2) {
        // Reset vertical sheets
        setVerticalSheets({ sheet1: "", sheet2: "" });
        
        // Reset merge keys for horizontal merge
        setMergeKeys([{ left: "", right: "" }]);
        
        // Default to horizontal merge type
        setMergeType("horizontal");
        
        // Default to inner merge method
        setMergeMethod("inner");
      }

      setReadyToProceed(true);
      setActiveStep(1);
    } catch (error) {
      console.error("Error fetching file details:", error);
      addNotification("error", error.message || "Failed to fetch file details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this new function to fetch columns when a sheet is selected
  const fetchSheetColumns = async (fileName, sheetName) => {
    try {
      const response = await getFileDetails(fileName, sheetName);
      setFileDetails(prev => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          [sheetName]: {
            columns: response.columns || []
          }
        }
      }));
    } catch (error) {
      console.error("Error fetching sheet columns:", error);
      addNotification("error", "Failed to fetch column details.");
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Update sheet selection components
  const SheetSelectionSection = () => {
    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1] || file1;

    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Sheet from File 1</InputLabel>
          <Select
            value={verticalSheets.sheet1}
            onChange={(e) => handleVerticalSheetChange(0, e.target.value)}
            label="Sheet from File 1"
          >
            {Object.keys(fileDetails[file1?.fileName] || {}).map(sheet => (
              <MenuItem key={sheet} value={sheet}>{sheet}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Sheet from {selectedFiles.length === 2 ? 'File 2' : 'File 1'}</InputLabel>
          <Select
            value={verticalSheets.sheet2}
            onChange={(e) => handleVerticalSheetChange(1, e.target.value)}
            label={`Sheet from ${selectedFiles.length === 2 ? 'File 2' : 'File 1'}`}
          >
            {Object.keys(fileDetails[file2?.fileName] || {}).map(sheet => (
              <MenuItem key={sheet} value={sheet}>{sheet}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  // Update Key Selection Section to fetch columns after file details are fetched
  const KeySelectionSection = () => {
    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1] || file1;

    const getColumnsForFile = (fileName, sheetName) => {
      return fileDetails[fileName]?.[sheetName]?.columns || [];
    };

    const file1Columns = getColumnsForFile(file1.fileName, verticalSheets.sheet1);
    const file2Columns = getColumnsForFile(file2.fileName, verticalSheets.sheet2);

    console.log("File 1 Columns:", file1Columns);
    console.log("File 2 Columns:", file2Columns);

    return mergeKeys.map((keyPair, index) => (
      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>{`Key from File 1 - Pair ${index + 1}`}</InputLabel>
          <Select
            value={keyPair.left}
            onChange={(e) => updateKeyPair(index, "left", e.target.value)}
            label={`Key from File 1 - Pair ${index + 1}`}
          >
            {file1Columns.map(col => (
              <MenuItem key={col} value={col}>{col}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{`Key from ${selectedFiles.length === 2 ? 'File 2' : 'File 1'} - Pair ${index + 1}`}</InputLabel>
          <Select
            value={keyPair.right}
            onChange={(e) => updateKeyPair(index, "right", e.target.value)}
            label={`Key from ${selectedFiles.length === 2 ? 'File 2' : 'File 1'} - Pair ${index + 1}`}
          >
            {file2Columns.map(col => (
              <MenuItem key={col} value={col}>{col}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {index > 0 && (
          <IconButton 
            onClick={() => removeMergeKey(index)}
            sx={{ alignSelf: 'center' }}
          >
            <Delete />
          </IconButton>
        )}
      </Box>
    ));
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
  
    
  
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ 
        mb: 4,
        '& .MuiStepLabel-root .Mui-active': {
          color: '#B82132', // Primary color for active step
        },
        '& .MuiStepLabel-root .Mui-completed': {
          color: '#2C3E50', // Secondary color for completed step
        }
      }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
  
      {/* Step Content */}
      {activeStep === 0 ? (
        <>
          <Paper elevation={3} sx={{ 
            p: 3, 
            borderRadius: 2,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
              Select Files (1 or 2)
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Select one file to merge with itself, or two different files.
            </Typography>
  
            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <Box 
                      key={`${file.fileName}-${index}`}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {`${index + 1}. ${file.fileName}`}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          setReadyToProceed(false);
                          if (selectedFiles.length <= 2) {
                            setVerticalSheets({ sheet1: "", sheet2: "" });
                            setMergeKeys([{ left: "", right: "" }]);
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
  
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
              {displayedFiles
                .filter(file => file.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((file) => (
                  <React.Fragment key={file.fileName}>
                    <ListItem>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                        <Checkbox
                          checked={selectedFiles.some(f => f.fileName === file.fileName)}
                          onChange={() => handleFileSelection(file)}
                          sx={{
                            color: "#B82132",
                            '&.Mui-checked': {
                              color: "#B82132",
                            },
                          }}
                        />
                        <Typography>{file.fileName}</Typography>
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
  
            {/* Show More/Less Button */}
            {!searchQuery && files.length > 5 && (
              <Button
                onClick={() => setShowAllFiles(!showAllFiles)}
                sx={{ mt: 1 }}
                variant="text"
                fullWidth
              >
                {showAllFiles ? "Show Less" : `Show More (${files.length - 5} more)`}
              </Button>
            )}
  
            {/* Proceed Button */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleProceedWithFiles}
                disabled={selectedFiles.length === 0}
              >
                Proceed with Selected Files
              </Button>
            </Box>
          </Paper>
        </>
      ) : (
        <>
          {/* Merge Type Selection */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 2: Select Merge Type
            </Typography>
            <RadioGroup
              row
              value={mergeType}
              onChange={(e) => setMergeType(e.target.value)}
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
          </Paper>
    
          {/* Horizontal Merge Configuration */}
          {mergeType === "horizontal" && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Step 3: Select Sheets
              </Typography>
              
              <SheetSelectionSection />

              {verticalSheets.sheet1 && verticalSheets.sheet2 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Step 4: Select Keys for Horizontal Merge
                  </Typography>
                  
                  <KeySelectionSection />

                  <Button
                    variant="outlined"
                    onClick={addKeyPair}
                    startIcon={<Add />}
                    sx={{ mb: 3 }}
                  >
                    Add Keys
                  </Button>

                  <Typography variant="h6" gutterBottom>
                    Step 5: Merge Method
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select merge method</InputLabel>
                    <Select
                      value={mergeMethod}
                      onChange={(e) => setMergeMethod(e.target.value)}
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                      <MenuItem value="inner">Inner</MenuItem>
                      <MenuItem value="outer">Outer</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Paper>
          )}
        {mergeType === "vertical" && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 3: Vertical Merge Configuration
            </Typography>
            <Alert severity="info">
              Files will be concatenated vertically. Please ensure columns match between files.
            </Alert>
          </Paper>
        )}
        
    
        {/* Output File Name Input */}
        <Box sx={{ mt: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
            Output File Name
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter output file name"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            sx={{
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#B82132',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#B82132',
                },
              },
            }}
            helperText="The output file will be saved with .xlsx extension"
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack}>Back</Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={!mergeType || (mergeType === "horizontal" && mergeKeys.some(k => !k.left || !k.right))}
            >
              Preview Merge
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!outputFileName.trim() || !mergeType || (mergeType === "horizontal" && mergeKeys.some(k => !k.left || !k.right))}
            >
              Save Merge
            </Button>
          </Box>
        </Box>
      </>
    )}

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
  </Typography>
)}


    </Container>
  </NavigationBar>
  
  )
};

export default MergeFiles;
