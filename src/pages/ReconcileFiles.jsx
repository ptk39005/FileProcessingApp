import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Checkbox,
  TextField,
  List,
  ListItem,
  Divider,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  FormControlLabel,
} from "@mui/material";
import { Search as SearchIcon, Add, Delete } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { getUserFiles, getFileDetails, reconcileFiles } from "../services/api";
import NavigationBar from "../components/NavigationBar";

const steps = [
  "Select Files",
  "Select Matching Keys",
  "Configure Matching",
  "Select Values",
  "Review & Submit"
];

const ReconcileFiles = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Matching Keys State
  const [matchingKeys, setMatchingKeys] = useState([{
    column1: "",
    column2: "",
    method: "exact",
    thresholdType: "value",
    thresholdValue: "",
    caseSensitive: false,
    ignoreSpecial: false
  }]);

  // One-to-Many Configuration State
  const [matchingConfig, setMatchingConfig] = useState({
    matchType: "one-to-one",
    duplicateHandling: "first",
    baseColumn: ""
  });

  // Selected Values State
  const [selectedValues, setSelectedValues] = useState([]);

  // Add these new state variables near the other state declarations
  const [newFileName, setNewFileName] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  // Fetch files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const response = await getUserFiles();
        if (response?.files && Array.isArray(response.files)) {
          setFiles(response.files);
        }
      } catch (error) {
        enqueueSnackbar("Failed to fetch files.", { variant: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  // Fetch file details when files are selected
  useEffect(() => {
    const fetchFileDetails = async () => {
      // Only fetch if we have exactly 2 files and at least one needs details
      if (selectedFiles.length === 2 && selectedFiles.some(file => !fileDetails[file.fileName])) {
        setIsLoading(true);
        try {
          const [file1, file2] = selectedFiles;
          const [details1, details2] = await Promise.all([
            getFileDetails(file1.fileName),
            getFileDetails(file2.fileName),
          ]);

          setFileDetails(prevDetails => ({
            ...prevDetails,
            [file1.fileName]: details1.fileType === "Excel" 
              ? details1?.sheets || {}
              : {
                  CSV: {
                    columnTypes: details1.columnTypes,
                    columns: details1.columns,
                  },
                },
            [file2.fileName]: details2.fileType === "Excel"
              ? details2?.sheets || {}
              : {
                  CSV: {
                    columnTypes: details2.columnTypes,
                    columns: details2.columns,
                  },
                },
          }));

          // Reset sheet selection for both files
          setSelectedFiles(prev => prev.map(f => ({ ...f, sheetName: "" })));

        } catch (error) {
          enqueueSnackbar("Failed to fetch file details.", { variant: "error" });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFileDetails();
  }, [selectedFiles]); // Only depend on selectedFiles changes

  const handleFileSelection = (file) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some(f => f.fileName === file.fileName);
      if (isSelected) {
        return prev.filter(f => f.fileName !== file.fileName);
      }
      if (prev.length >= 2) {
        enqueueSnackbar("You can select only 2 files.", { variant: "warning" });
        return prev;
      }
      return [...prev, file];
    });
  };

  const addMatchingKey = () => {
    setMatchingKeys(prev => [...prev, {
      column1: "",
      column2: "",
      method: "exact",
      thresholdType: "value",
      thresholdValue: "",
      caseSensitive: false,
      ignoreSpecial: false
    }]);
  };

  const removeMatchingKey = (index) => {
    setMatchingKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Prepare the request data
      const requestData = {
        files: selectedFiles.map((file, index) => ({
          file_name: file.fileName,
          sheet_name: file.sheetName || 'Sheet1' // Adjust based on your needs
        })),
        keys: matchingKeys.map(key => ({
          file1: key.column1,
          file2: key.column2,
          criteria: key.method,
          case_sensitive: key.caseSensitive ? 'yes' : 'no',
          ignore_special: key.ignoreSpecial ? 'yes' : 'no',
          threshold_type: key.method === 'threshold' ? key.thresholdType : null,
          threshold_value: key.method === 'threshold' ? parseFloat(key.thresholdValue) : null
        })),
        settings: {
          method: matchingConfig.matchType,
          duplicate: matchingConfig.matchType !== 'many-to-many' ? matchingConfig.duplicateHandling : null,
          basis_column: matchingConfig.matchType !== 'many-to-many' ? {
            file1: matchingConfig.baseColumn,
            file2: matchingConfig.baseColumn
          } : null,
          fuzzy_preference: matchingKeys
            .filter(key => key.method === 'fuzzy')
            .map(key => `${key.column1}-${key.column2}`)
        },
        values: selectedValues.map(value => ({
          file1: value,
          file2: value,
          threshold_type: null,
          threshold_value: null
        })),
        cross_reference: matchingKeys.map(key => ({
          file1: key.column1,
          file2: key.column2
        })),
        output_file: newFileName || `reconciliation-${new Date().getTime()}`,
        replace_existing: replaceExisting
      };

      const response = await reconcileFiles(requestData);
      
      if (response.success) {
        enqueueSnackbar("Reconciliation completed successfully!", { variant: "success" });
        // Handle the download URL if needed
        if (response.downloadUrl) {
          window.open(response.downloadUrl, '_blank');
        }
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to reconcile files", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Add sheet selection handler
  const handleSheetSelection = (fileName, sheetName) => {
    setSelectedFiles(prev => prev.map(file => 
      file.fileName === fileName 
        ? { ...file, sheetName } 
        : file
    ));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Files (Exactly 2)
            </Typography>
            <TextField
              fullWidth
              placeholder="Search files..."
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
            <List>
              {files.map((file) => (
                <React.Fragment key={file.fileName}>
                  <ListItem>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      <Checkbox
                        checked={selectedFiles.some(f => f.fileName === file.fileName)}
                        onChange={() => handleFileSelection(file)}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography>{file.fileName}</Typography>
                        {selectedFiles.some(f => f.fileName === file.fileName) && fileDetails[file.fileName] && (
                          <FormControl fullWidth sx={{ mt: 1 }}>
                            <InputLabel>Select Sheet</InputLabel>
                            <Select
                              value={selectedFiles.find(f => f.fileName === file.fileName)?.sheetName || ""}
                              onChange={(e) => handleSheetSelection(file.fileName, e.target.value)}
                              size="small"
                            >
                              {Object.keys(fileDetails[file.fileName]).map((sheet) => (
                                <MenuItem key={sheet} value={sheet}>
                                  {sheet}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        );

      case 1:
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            {matchingKeys.map((key, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Matching Key Set {index + 1}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[0]?.fileName}</InputLabel>
                    <Select
                      value={key.column1}
                      onChange={(e) => {
                        const newKeys = [...matchingKeys];
                        newKeys[index].column1 = e.target.value;
                        setMatchingKeys(newKeys);
                      }}
                    >
                      {Object.values(fileDetails[selectedFiles[0]?.fileName] || {})
                        .flatMap(sheet => sheet.columns || [])
                        .map(column => (
                          <MenuItem key={column} value={column}>{column}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[1]?.fileName}</InputLabel>
                    <Select
                      value={key.column2}
                      onChange={(e) => {
                        const newKeys = [...matchingKeys];
                        newKeys[index].column2 = e.target.value;
                        setMatchingKeys(newKeys);
                      }}
                    >
                      {Object.values(fileDetails[selectedFiles[1]?.fileName] || {})
                        .flatMap(sheet => sheet.columns || [])
                        .map(column => (
                          <MenuItem key={column} value={column}>{column}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={key.method}
                      onChange={(e) => {
                        const newKeys = [...matchingKeys];
                        newKeys[index].method = e.target.value;
                        setMatchingKeys(newKeys);
                      }}
                    >
                      <MenuItem value="exact">Exact</MenuItem>
                      <MenuItem value="fuzzy">Fuzzy</MenuItem>
                      <MenuItem value="threshold">Threshold</MenuItem>
                    </Select>
                  </FormControl>

                  {key.method === "threshold" && (
                    <>
                      <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Threshold Type</InputLabel>
                        <Select
                          value={key.thresholdType}
                          onChange={(e) => {
                            const newKeys = [...matchingKeys];
                            newKeys[index].thresholdType = e.target.value;
                            setMatchingKeys(newKeys);
                          }}
                        >
                          <MenuItem value="value">Value</MenuItem>
                          <MenuItem value="percent">Percent</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Threshold Value"
                        type="number"
                        value={key.thresholdValue}
                        onChange={(e) => {
                          const newKeys = [...matchingKeys];
                          newKeys[index].thresholdValue = e.target.value;
                          setMatchingKeys(newKeys);
                        }}
                        sx={{ width: 150 }}
                      />
                    </>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Tooltip title="Case Sensitive">
                      <Checkbox
                        checked={key.caseSensitive}
                        onChange={(e) => {
                          const newKeys = [...matchingKeys];
                          newKeys[index].caseSensitive = e.target.checked;
                          setMatchingKeys(newKeys);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Ignore Special Characters">
                      <Checkbox
                        checked={key.ignoreSpecial}
                        onChange={(e) => {
                          const newKeys = [...matchingKeys];
                          newKeys[index].ignoreSpecial = e.target.checked;
                          setMatchingKeys(newKeys);
                        }}
                      />
                    </Tooltip>
                    <IconButton
                      onClick={() => removeMatchingKey(index)}
                      disabled={matchingKeys.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
            <Button
              startIcon={<Add />}
              onClick={addMatchingKey}
              variant="outlined"
            >
              Add Matching Key
            </Button>
          </Paper>
        );

      case 2:
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure Matching
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Match Type</InputLabel>
                <Select
                  value={matchingConfig.matchType}
                  onChange={(e) => setMatchingConfig(prev => ({
                    ...prev,
                    matchType: e.target.value
                  }))}
                >
                  <MenuItem value="one-to-one">One-to-One</MenuItem>
                  <MenuItem value="one-to-many">One-to-Many</MenuItem>
                  <MenuItem value="many-to-one">Many-to-One</MenuItem>
                  <MenuItem value="many-to-many">Many-to-Many</MenuItem>
                </Select>
              </FormControl>

              {matchingConfig.matchType !== "many-to-many" && (
                <>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Duplicate Handling</InputLabel>
                    <Select
                      value={matchingConfig.duplicateHandling}
                      onChange={(e) => setMatchingConfig(prev => ({
                        ...prev,
                        duplicateHandling: e.target.value
                      }))}
                    >
                      <MenuItem value="first">First Occurrence</MenuItem>
                      <MenuItem value="last">Last Occurrence</MenuItem>
                      <MenuItem value="closest">Closest To</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Base Column</InputLabel>
                    <Select
                      value={matchingConfig.baseColumn}
                      onChange={(e) => setMatchingConfig(prev => ({
                        ...prev,
                        baseColumn: e.target.value
                      }))}
                    >
                      {Object.values(fileDetails[selectedFiles[0]?.fileName] || {})
                        .flatMap(sheet => sheet.columns || [])
                        .filter(column => !matchingKeys.some(key => key.column1 === column))
                        .map(column => (
                          <MenuItem key={column} value={column}>{column}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          </Paper>
        );

      case 3:
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Values
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Values to Compare</InputLabel>
              <Select
                multiple
                value={selectedValues}
                onChange={(e) => setSelectedValues(e.target.value)}
                renderValue={(selected) => selected.join(", ")}
              >
                {Object.values(fileDetails[selectedFiles[0]?.fileName] || {})
                  .flatMap(sheet => sheet.columns || [])
                  .filter(column => !matchingKeys.some(key => key.column1 === column))
                  .map(column => (
                    <MenuItem key={column} value={column}>
                      <Checkbox checked={selectedValues.indexOf(column) > -1} />
                      <Typography>{column}</Typography>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Paper>
        );

      case 4:
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Output File Configuration
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    sx={{
                      color: "#f44336",
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
              <Typography variant="body2" sx={{ color: "#616161", fontStyle: "italic", ml: 2 }}>
                {replaceExisting
                  ? "The selected files will be replaced with the reconciled version."
                  : "A new file will be created with the name specified below."}
              </Typography>
              
              <TextField
                label="Output File Name"
                variant="outlined"
                fullWidth
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={
                  replaceExisting
                    ? "Enter a new file name (optional)"
                    : "Enter a name for the reconciled file"
                }
                sx={{ mt: 2, maxWidth: 400 }}
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              Review Configuration
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Selected Files:</Typography>
              {selectedFiles.map((file, index) => (
                <Typography key={file.fileName} variant="body2">
                  File {index + 1}: {file.fileName}
                </Typography>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Matching Keys:</Typography>
              {matchingKeys.map((key, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body2">
                    {`${key.column1} (File 1) → ${key.column2} (File 2)`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Method: {key.method}
                    {key.method === 'threshold' && ` (${key.thresholdType}: ${key.thresholdValue})`}
                    {key.caseSensitive && ' | Case Sensitive'}
                    {key.ignoreSpecial && ' | Ignore Special Characters'}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Matching Configuration:</Typography>
              <Typography variant="body2">
                Match Type: {matchingConfig.matchType}
              </Typography>
              {matchingConfig.matchType !== 'many-to-many' && (
                <>
                  <Typography variant="body2">
                    Duplicate Handling: {matchingConfig.duplicateHandling}
                  </Typography>
                  <Typography variant="body2">
                    Base Column: {matchingConfig.baseColumn}
                  </Typography>
                </>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Selected Values:</Typography>
              {selectedValues.map((value, index) => (
                <Typography key={index} variant="body2">
                  • {value}
                </Typography>
              ))}
            </Box>
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <NavigationBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {isLoading && (
          <Box sx={{
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
          }}>
            <CircularProgress />
          </Box>
        )}

        <Typography variant="h4" gutterBottom sx={{ textAlign: "center", mb: 4 }}>
          Reconcile Files
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            variant="contained"
            disabled={
              (activeStep === 0 && selectedFiles.length !== 2) ||
              (activeStep === steps.length - 1 && isLoading)
            }
          >
            {activeStep === steps.length - 1 ? (
              isLoading ? <CircularProgress size={24} /> : "Submit"
            ) : (
              "Next"
            )}
          </Button>
        </Box>
      </Container>
    </NavigationBar>
  );
};

export default ReconcileFiles; 