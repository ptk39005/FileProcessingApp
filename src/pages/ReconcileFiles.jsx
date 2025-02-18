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
  "Select Values",
  "Reconciliation Settings",
  "Select Cross Reference",
  "Review & Submit",
];

const ReconcileFiles = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Matching Keys State
  const [matchingKeys, setMatchingKeys] = useState([
    {
      column1: "",
      column2: "",
      method: "exact",
      thresholdType: "",
      thresholdValue: "",
      caseSensitive: false,
      ignoreSpecial: false,
      dtype1: "",
      dtype2: "",
    },
  ]);

  // Values State
  const [selectedValues, setSelectedValues] = useState([
    {
      column1: "",
      column2: "",
      setThreshold: false,
      thresholdType: "",
      thresholdValue: "",
      dtype1: "",
      dtype2: "",
    },
  ]);

  // Reconciliation Settings State
  const [reconciliationSettings, setReconciliationSettings] = useState({
    method: "one-to-one",
    duplicateHandling: "",
    baseColumn1: "",
    baseColumn2: "",
  });

  // Cross Reference State
  const [crossReference, setCrossReference] = useState({
    column1: "",
    column2: "",
    customReference: false,
  });

  // Additional State Variables
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
  }, [enqueueSnackbar]);

  // Fetch file details when files are selected
  useEffect(() => {
    const fetchFileDetails = async () => {
      if (
        selectedFiles.length === 2 &&
        selectedFiles.some((file) => !fileDetails[file.fileName])
      ) {
        setIsLoading(true);
        try {
          const [file1, file2] = selectedFiles;
          const [details1, details2] = await Promise.all([
            getFileDetails(file1.fileName),
            getFileDetails(file2.fileName),
          ]);

          setFileDetails((prevDetails) => ({
            ...prevDetails,
            [file1.fileName]:
              details1.fileType === "Excel"
                ? details1?.sheets || {}
                : {
                    CSV: {
                      columnTypes: details1.columnTypes,
                      columns: details1.columns,
                    },
                  },
            [file2.fileName]:
              details2.fileType === "Excel"
                ? details2?.sheets || {}
                : {
                    CSV: {
                      columnTypes: details2.columnTypes,
                      columns: details2.columns,
                    },
                  },
          }));

          // Reset sheet selection for both files
          setSelectedFiles((prev) =>
            prev.map((f) => ({ ...f, sheetName: "" }))
          );
        } catch (error) {
          enqueueSnackbar("Failed to fetch file details.", { variant: "error" });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFileDetails();
  }, [selectedFiles, fileDetails, enqueueSnackbar]);

  const handleFileSelection = (file) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.fileName === file.fileName);
      if (isSelected) {
        return prev.filter((f) => f.fileName !== file.fileName);
      }
      if (prev.length >= 2) {
        enqueueSnackbar("You can select only 2 files.", { variant: "warning" });
        return prev;
      }
      return [...prev, file];
    });
  };

  // Helper function to determine cardinality based on method
  const getCardinality = (method) => {
    switch (method) {
      case "one-to-one":
        return { file1: "one", file2: "one" };
      case "one-to-many":
        return { file1: "one", file2: "many" };
      case "many-to-one":
        return { file1: "many", file2: "one" };
      case "many-to-many":
        return { file1: "many", file2: "many" };
      default:
        return { file1: "one", file2: "one" };
    }
  };

  const cardinality = getCardinality(reconciliationSettings.method);

  // Matching Keys Handlers
  const addMatchingKey = () => {
    setMatchingKeys((prev) => [
      ...prev,
      {
        column1: "",
        column2: "",
        method: "exact",
        thresholdType: "",
        thresholdValue: "",
        caseSensitive: false,
        ignoreSpecial: false,
        dtype1: "",
        dtype2: "",
      },
    ]);
  };

  const removeMatchingKey = (index) => {
    setMatchingKeys((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMatchingKeyChange = (index, field, value) => {
    const newKeys = [...matchingKeys];
    newKeys[index][field] = value;

    // Update dtype based on selected columns
    if (field === "column1") {
      const sheetName = selectedFiles[0]?.sheetName || "Sheet1";
      const dtype =
        fileDetails[selectedFiles[0].fileName]?.[sheetName]?.columnTypes?.[
          value
        ];
      newKeys[index].dtype1 = dtype;
    }
    if (field === "column2") {
      const sheetName = selectedFiles[1]?.sheetName || "Sheet1";
      const dtype =
        fileDetails[selectedFiles[1].fileName]?.[sheetName]?.columnTypes?.[
          value
        ];
      newKeys[index].dtype2 = dtype;
    }

    // If dtype is not text, set method to exact and disable method change
    if (
      newKeys[index].dtype1 &&
      newKeys[index].dtype2 &&
      !["text", "string"].includes(newKeys[index].dtype1.toLowerCase()) &&
      !["text", "string"].includes(newKeys[index].dtype2.toLowerCase())
    ) {
      newKeys[index].method = "exact";
    }

    setMatchingKeys(newKeys);
  };

  // Values Handlers
  const addSelectedValue = () => {
    setSelectedValues((prev) => [
      ...prev,
      {
        column1: "",
        column2: "",
        setThreshold: false,
        thresholdType: "",
        thresholdValue: "",
        dtype1: "",
        dtype2: "",
      },
    ]);
  };

  const removeSelectedValue = (index) => {
    setSelectedValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectedValueChange = (index, field, value) => {
    const newValues = [...selectedValues];
    newValues[index][field] = value;

    // Update dtype based on selected columns
    if (field === "column1") {
      const sheetName = selectedFiles[0]?.sheetName || "Sheet1";
      const dtype =
        fileDetails[selectedFiles[0].fileName]?.[sheetName]?.columnTypes?.[
          value
        ];
      newValues[index].dtype1 = dtype;
    }
    if (field === "column2") {
      const sheetName = selectedFiles[1]?.sheetName || "Sheet1";
      const dtype =
        fileDetails[selectedFiles[1].fileName]?.[sheetName]?.columnTypes?.[
          value
        ];
      newValues[index].dtype2 = dtype;
    }

    // Ensure that selected value is not a key
    // Remove the selected value if it's now a key
    if (field === "column1") {
      const isKey = matchingKeys.some((key) => key.column1 === value);
      if (isKey) {
        newValues[index].column1 = "";
        newValues[index].setThreshold = false;
        newValues[index].thresholdType = "";
        newValues[index].thresholdValue = "";
        enqueueSnackbar(
          `Selected value column '${value}' is a key and has been deselected.`,
          { variant: "warning" }
        );
      }
    }
    if (field === "column2") {
      const isKey = matchingKeys.some((key) => key.column2 === value);
      if (isKey) {
        newValues[index].column2 = "";
        newValues[index].setThreshold = false;
        newValues[index].thresholdType = "";
        newValues[index].thresholdValue = "";
        enqueueSnackbar(
          `Selected value column '${value}' is a key and has been deselected.`,
          { variant: "warning" }
        );
      }
    }

    setSelectedValues(newValues);
  };

  // Reconciliation Settings Handlers
  const handleReconciliationSettingChange = (field, value) => {
    setReconciliationSettings((prev) => ({
      ...prev,
      [field]: value,
      // Reset dependent fields when method changes
      ...(field === "method"
        ? {
            duplicateHandling: "",
            baseColumn1: "",
            baseColumn2: "",
          }
        : {}),
    }));
  };

  // Cross Reference Handlers
  const handleCrossReferenceChange = (field, value) => {
    setCrossReference((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      // Prepare the request data based on the updated states
      const requestData = {
        files: selectedFiles.map((file) => ({
          file_name: file.fileName,
          sheet_name: file.sheetName || "Sheet1",
        })),
        matching_keys: matchingKeys.map((key) => ({
          file1_column: key.column1,
          file2_column: key.column2,
          method:
            key.dtype1 &&
            key.dtype2 &&
            !["text", "string"].includes(key.dtype1.toLowerCase()) &&
            !["text", "string"].includes(key.dtype2.toLowerCase())
              ? "exact"
              : key.method === "non-exact"
              ? "fuzzy"
              : key.method,
          case_sensitive: key.caseSensitive,
          ignore_special_characters: key.ignoreSpecial,
        })),
        keys: matchingKeys.map((key) => ({
          file1: key.column1,
          file2: key.column2,
          criteria: key.method === "exact" ? "exact" : "fuzzy",
          case_sensitive: key.caseSensitive ? 'yes' : 'no',
          ignore_special: key.ignoreSpecial ? 'yes' : 'no',
        })),
        values: selectedValues.map((val) => ({
          file1_column: val.column1,
          file2_column: val.column2,
          set_threshold: val.setThreshold,
          threshold_type: val.setThreshold ? val.thresholdType : null,
          threshold_value: val.setThreshold ? parseFloat(val.thresholdValue) : null,
          file2: val.file2 || "", // Ensure file2 is included
        })),
        reconciliation_settings: {
          method: reconciliationSettings.method,
          handling_duplicate_matches:
            reconciliationSettings.method !== "many-to-many"
              ? reconciliationSettings.duplicateHandling
              : null,
          based_on_columns:
            reconciliationSettings.method !== "many-to-many"
              ? {
                  file1: reconciliationSettings.baseColumn1,
                  file2: reconciliationSettings.baseColumn2,
                }
              : null,
        },
        cross_reference: {
          file1_column: crossReference.column1,
          file2_column:
            cardinality.file2 === "many" && crossReference.customReference
              ? null
              : crossReference.column2 || null,
        },
        output_file: newFileName || `reconciliation-${new Date().getTime()}`,
        replace_existing: replaceExisting,
        settings: reconciliationSettings,
      };

      const response = await reconcileFiles(requestData);

      if (response.success) {
        enqueueSnackbar("Reconciliation completed successfully!", {
          variant: "success",
        });
        if (response.downloadUrl) {
          window.open(response.downloadUrl, "_blank");
        }
      } else {
        enqueueSnackbar("Reconciliation failed.", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to reconcile files", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get key and value columns for filtering
  const getKeyValueColumns = (fileIndex) => {
    const keys = matchingKeys.map(
      (key) => (fileIndex === 1 ? key.column1 : key.column2)
    );
    const values = selectedValues.map(
      (val) => (fileIndex === 1 ? val.column1 : val.column2)
    );
    return [...new Set([...keys, ...values])];
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Select Files
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
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#B82132",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#B82132",
                  },
                },
              }}
            />
            <List>
              {files
                .filter((file) =>
                  file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                  <React.Fragment key={file.fileName}>
                    <ListItem>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
                      >
                        <Checkbox
                          checked={selectedFiles.some(
                            (f) => f.fileName === file.fileName
                          )}
                          onChange={() => handleFileSelection(file)}
                          sx={{
                            color: "#B82132",
                            "&.Mui-checked": {
                              color: "#B82132",
                            },
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography>{file.fileName}</Typography>
                          {selectedFiles.some(
                            (f) => f.fileName === file.fileName
                          ) &&
                            fileDetails[file.fileName] && (
                              <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel>Select Sheet</InputLabel>
                                <Select
                                  value={
                                    selectedFiles.find(
                                      (f) => f.fileName === file.fileName
                                    )?.sheetName || ""
                                  }
                                  onChange={(e) =>
                                    handleSheetSelection(file.fileName, e.target.value)
                                  }
                                  size="small"
                                >
                                  {Object.keys(fileDetails[file.fileName]).map(
                                    (sheet) => (
                                      <MenuItem key={sheet} value={sheet}>
                                        {sheet}
                                      </MenuItem>
                                    )
                                  )}
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
        // Select Matching Keys
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Matching Keys
            </Typography>
            {matchingKeys.map((key, index) => (
              <Box key={index} sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Matching Key Set {index + 1}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {/* Column from File 1 */}
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[0]?.fileName}</InputLabel>
                    <Select
                      value={key.column1}
                      onChange={(e) =>
                        handleMatchingKeyChange(index, "column1", e.target.value)
                      }
                      required
                    >
                      {fileDetails[selectedFiles[0]?.fileName]?.[
                        selectedFiles[0]?.sheetName || "Sheet1"
                      ]?.columns.map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Column from File 2 */}
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[1]?.fileName}</InputLabel>
                    <Select
                      value={key.column2}
                      onChange={(e) =>
                        handleMatchingKeyChange(index, "column2", e.target.value)
                      }
                      required
                    >
                      {fileDetails[selectedFiles[1]?.fileName]?.[
                        selectedFiles[1]?.sheetName || "Sheet1"
                      ]?.columns.map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Matching Criteria */}
                  {key.dtype1 &&
                    key.dtype2 &&
                    ["text", "string"].includes(key.dtype1.toLowerCase()) &&
                    ["text", "string"].includes(key.dtype2.toLowerCase()) && (
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Matching Criteria</InputLabel>
                        <Select
                          value={key.method}
                          onChange={(e) =>
                            handleMatchingKeyChange(index, "method", e.target.value)
                          }
                          required
                        >
                          <MenuItem value="exact">Exact</MenuItem>
                          <MenuItem value="non-exact">Non-exact</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                  {/* Thresholds are only applicable for numerical types */}
                  {key.dtype1 &&
                    key.dtype2 &&
                    (["int", "float", "double"].includes(key.dtype1.toLowerCase()) ||
                      ["int", "float", "double"].includes(key.dtype2.toLowerCase())) && (
                        <Typography variant="body2" sx={{ alignSelf: "center" }}>
                          Method: Exact
                        </Typography>
                      )}

                  {/* Case Sensitive */}
                  {key.method === "non-exact" && (
                    <Tooltip title="Case Sensitive">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={key.caseSensitive}
                            onChange={(e) =>
                              handleMatchingKeyChange(
                                index,
                                "caseSensitive",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "#B82132",
                              "&.Mui-checked": {
                                color: "#B82132",
                              },
                            }}
                          />
                        }
                        label="Case Sensitive"
                      />
                    </Tooltip>
                  )}

                  {/* Ignore Special Characters */}
                  {key.method === "non-exact" && (
                    <Tooltip title="Ignore Special Characters">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={key.ignoreSpecial}
                            onChange={(e) =>
                              handleMatchingKeyChange(
                                index,
                                "ignoreSpecial",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "#B82132",
                              "&.Mui-checked": {
                                color: "#B82132",
                              },
                            }}
                          />
                        }
                        label="Ignore Special Characters"
                      />
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton
                    color="error"
                    onClick={() => removeMatchingKey(index)}
                    disabled={matchingKeys.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addMatchingKey}
              sx={{ mt: 2 }}
            >
              Add Keys
            </Button>
          </Paper>
        );

      case 2:
        // Select Values
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Values
            </Typography>
            {selectedValues.map((val, index) => (
              <Box key={index} sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Value Set {index + 1}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {/* Column from File 1 */}
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[0]?.fileName}</InputLabel>
                    <Select
                      value={val.column1}
                      onChange={(e) =>
                        handleSelectedValueChange(index, "column1", e.target.value)
                      }
                      required
                    >
                      {fileDetails[selectedFiles[0]?.fileName]?.[
                        selectedFiles[0]?.sheetName || "Sheet1"
                      ]?.columns
                        .filter(
                          (col) =>
                            !matchingKeys.some((k) => k.column1 === col) &&
                            !selectedValues.some((v, i) => v.column1 === col && i !== index)
                        )
                        .map((column) => (
                          <MenuItem key={column} value={column}>
                            {column}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  {/* Column from File 2 */}
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Column from {selectedFiles[1]?.fileName}</InputLabel>
                    <Select
                      value={val.column2}
                      onChange={(e) =>
                        handleSelectedValueChange(index, "column2", e.target.value)
                      }
                      required
                    >
                      {fileDetails[selectedFiles[1]?.fileName]?.[
                        selectedFiles[1]?.sheetName || "Sheet1"
                      ]?.columns
                        .filter(
                          (col) =>
                            !matchingKeys.some((k) => k.column2 === col) &&
                            !selectedValues.some((v, i) => v.column2 === col && i !== index)
                        )
                        .map((column) => (
                          <MenuItem key={column} value={column}>
                            {column}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  {/* Set Threshold */}
                  {val.dtype1 && val.dtype2 && (["int", "float"].includes(val.dtype1.toLowerCase()) || ["int", "float"].includes(val.dtype2.toLowerCase())) && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={val.setThreshold}
                          onChange={(e) =>
                            handleSelectedValueChange(
                              index,
                              "setThreshold",
                              e.target.checked
                            )
                          }
                          sx={{
                            color: "#B82132",
                            "&.Mui-checked": {
                              color: "#B82132",
                            },
                          }}
                        />
                      }
                      label="Set Threshold?"
                    />
                  )}

                  {/* Threshold Type */}
                  {val.setThreshold && (
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Threshold Type</InputLabel>
                      <Select
                        value={val.thresholdType}
                        onChange={(e) =>
                          handleSelectedValueChange(index, "thresholdType", e.target.value)
                        }
                        required
                      >
                        <MenuItem value="Percent">Percent</MenuItem>
                        <MenuItem value="Amount">Amount</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Threshold Value */}
                  {val.setThreshold && (
                    <TextField
                      label="Threshold Value"
                      type="number"
                      value={val.thresholdValue}
                      onChange={(e) =>
                        handleSelectedValueChange(index, "thresholdValue", e.target.value)
                      }
                      required
                      sx={{ minWidth: 200 }}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton
                    color="error"
                    onClick={() => removeSelectedValue(index)}
                    disabled={selectedValues.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addSelectedValue}
              sx={{ mt: 2 }}
            >
              Add Values
            </Button>
          </Paper>
        );

      case 3:
        // Reconciliation Settings
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reconciliation Settings
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {/* Method Selection */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Method</InputLabel>
                <Select
                  value={reconciliationSettings.method}
                  onChange={(e) =>
                    handleReconciliationSettingChange("method", e.target.value)
                  }
                  required
                >
                  <MenuItem value="one-to-one">One-to-One</MenuItem>
                  <MenuItem value="one-to-many">One-to-Many</MenuItem>
                  <MenuItem value="many-to-one">Many-to-One</MenuItem>
                  <MenuItem value="many-to-many">Many-to-Many</MenuItem>
                </Select>
              </FormControl>

              {/* Handling Duplicate Matches */}
              {reconciliationSettings.method !== "many-to-many" && (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Handling Duplicate Matches</InputLabel>
                  <Select
                    value={reconciliationSettings.duplicateHandling}
                    onChange={(e) =>
                      handleReconciliationSettingChange("duplicateHandling", e.target.value)
                    }
                    required
                  >
                    <MenuItem value="first_occurrence">First Occurrence</MenuItem>
                    <MenuItem value="immediately_before">Immediately Before</MenuItem>
                    <MenuItem value="immediately_after">Immediately After</MenuItem>
                    <MenuItem value="closest_to">Closest To</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Based on Columns for File 1 */}
              {reconciliationSettings.method !== "many-to-many" && (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>
                    Based on Column from {selectedFiles[0]?.fileName}
                  </InputLabel>
                  <Select
                    value={reconciliationSettings.baseColumn1}
                    onChange={(e) =>
                      handleReconciliationSettingChange(
                        "baseColumn1",
                        e.target.value
                      )
                    }
                    required
                  >
                    {fileDetails[selectedFiles[0]?.fileName]?.[
                      selectedFiles[0]?.sheetName || "Sheet1"
                    ]?.columns
                      .filter((col) => {
                        // Exclude key and value columns if file is on the "one" side
                        if (cardinality.file1 === "many") {
                          // Allow only key or value columns
                          const allowedColumns = getKeyValueColumns(1);
                          return allowedColumns.includes(col);
                        }
                        // If "one", exclude keys and values
                        const excludedColumns = getKeyValueColumns(1);
                        return !excludedColumns.includes(col);
                      })
                      .map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              {/* Based on Columns for File 2 */}
              {reconciliationSettings.method !== "many-to-many" && (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>
                    Based on Column from {selectedFiles[1]?.fileName}
                  </InputLabel>
                  <Select
                    value={reconciliationSettings.baseColumn2}
                    onChange={(e) =>
                      handleReconciliationSettingChange(
                        "baseColumn2",
                        e.target.value
                      )
                    }
                    required
                  >
                    {fileDetails[selectedFiles[1]?.fileName]?.[
                      selectedFiles[1]?.sheetName || "Sheet1"
                    ]?.columns
                      .filter((col) => {
                        // Exclude key and value columns if file is on the "one" side
                        if (cardinality.file2 === "many") {
                          // Allow only key or value columns
                          const allowedColumns = getKeyValueColumns(2);
                          return allowedColumns.includes(col);
                        }
                        // If "one", exclude keys and values
                        const excludedColumns = getKeyValueColumns(2);
                        return !excludedColumns.includes(col);
                      })
                      .map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Paper>
        );

      case 4:
        // Select Cross Reference
        return (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Cross Reference
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {/* Column from File 1 */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Column from {selectedFiles[0]?.fileName}</InputLabel>
                <Select
                  value={crossReference.column1}
                  onChange={(e) =>
                    handleCrossReferenceChange("column1", e.target.value)
                  }
                  required
                >
                  {fileDetails[selectedFiles[0]?.fileName]?.[
                    selectedFiles[0]?.sheetName || "Sheet1"
                  ]?.columns
                    .filter((col) => {
                      if (cardinality.file1 === "many") {
                        return (
                          matchingKeys.some((key) => key.column1 === col) ||
                          selectedValues.some((val) => val.column1 === col)
                        );
                      }
                      return true;
                    })
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Column from File 2 */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Column from {selectedFiles[1]?.fileName}</InputLabel>
                <Select
                  value={crossReference.column2}
                  onChange={(e) =>
                    handleCrossReferenceChange("column2", e.target.value)
                  }
                  required
                >
                  {fileDetails[selectedFiles[1]?.fileName]?.[
                    selectedFiles[1]?.sheetName || "Sheet1"
                  ]?.columns
                    .filter((col) => {
                      if (cardinality.file2 === "many") {
                        return (
                          matchingKeys.some((key) => key.column2 === col) ||
                          selectedValues.some((val) => val.column2 === col)
                        );
                      }
                      return true;
                    })
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  {(cardinality.file1 === "many" || cardinality.file2 === "many") && (
                    <MenuItem value={0}>Custom Reference</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Custom Reference for many */}
              {(cardinality.file1 === "many" || cardinality.file2 === "many") && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={crossReference.customReference}
                      onChange={(e) =>
                        handleCrossReferenceChange(
                          "customReference",
                          e.target.checked
                        )
                      }
                      sx={{
                        color: "#B82132",
                        "&.Mui-checked": {
                          color: "#B82132",
                        },
                      }}
                    />
                  }
                  label="Custom Reference"
                />
              )}
            </Box>
          </Paper>
        );

      case 5:
        // Review & Submit
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
              <Typography
                variant="body2"
                sx={{ color: "#616161", fontStyle: "italic", ml: 2 }}
              >
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
              <Typography variant="subtitle1" gutterBottom>
                Selected Files:
              </Typography>
              {selectedFiles.map((file, index) => (
                <Typography key={file.fileName} variant="body2">
                  File {index + 1}: {file.fileName}{" "}
                  {file.sheetName && `(Sheet: ${file.sheetName})`}
                </Typography>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Matching Keys:
              </Typography>
              {matchingKeys.map((key, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body2">
                    {`${key.column1} (File 1) → ${key.column2} (File 2)`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Method: {key.method}
                    {key.method === "non-exact" && " (Fuzzy)"}
                    {key.caseSensitive && " | Case Sensitive"}
                    {key.ignoreSpecial && " | Ignore Special Characters"}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Values:
              </Typography>
              {selectedValues.map((val, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body2">
                    {`${val.column1} (File 1) → ${val.column2} (File 2)`}
                  </Typography>
                  {val.setThreshold && (
                    <Typography variant="body2" color="textSecondary">
                      Threshold: {val.thresholdType} - {val.thresholdValue}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Reconciliation Settings:
              </Typography>
              <Typography variant="body2">
                Method: {reconciliationSettings.method.replace(/-/g, " ")}
              </Typography>
              {reconciliationSettings.method !== "many-to-many" && (
                <>
                  <Typography variant="body2">
                    Handling Duplicate Matches: {reconciliationSettings.duplicateHandling}
                  </Typography>
                  <Typography variant="body2">
                    Based on Column from {selectedFiles[0]?.fileName}: {reconciliationSettings.baseColumn1}
                  </Typography>
                  <Typography variant="body2">
                    Based on Column from {selectedFiles[1]?.fileName}: {reconciliationSettings.baseColumn2}
                  </Typography>
                </>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Cross Reference:
              </Typography>
              <Typography variant="body2">
                File 1 Column: {crossReference.column1}
              </Typography>
              <Typography variant="body2">
                File 2 Column:{" "}
                {cardinality.file2 === "many" && crossReference.customReference
                  ? "Custom Reference (null)"
                  : crossReference.column2 || "null"}
              </Typography>
            </Box>
          </Paper>
        );

      default:
        return null;
    }
  };

  const handleSheetSelection = (fileName, sheetName) => {
    setSelectedFiles((prev) =>
      prev.map((file) =>
        file.fileName === fileName ? { ...file, sheetName } : file
      )
    );
  };

  return (
    <NavigationBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            <CircularProgress />
          </Box>
        )}

        <Typography
          variant="h4"
          gutterBottom
          sx={{ textAlign: "center", mb: 4, color: "#2C3E50" }}
        >
          Reconcile Files
        </Typography>

        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 4,
            "& .MuiStepIcon-root.Mui-active": {
              color: "#B82132",
            },
            "& .MuiStepIcon-root.Mui-completed": {
              color: "#B82132",
            },
          }}
        >
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
            variant="contained"
            onClick={
              activeStep === steps.length - 1 ? handleSubmit : handleNext
            }
            disabled={
              (activeStep === 0 && selectedFiles.length !== 2) ||
              (activeStep === 1 &&
                matchingKeys.some(
                  (key) =>
                    !key.column1 ||
                    !key.column2 ||
                    (["text", "string"].includes(key.dtype1.toLowerCase()) &&
                      !key.method) ||
                    (key.method === "non-exact" &&
                      (!key.caseSensitive && !key.ignoreSpecial))
                )) ||
              (activeStep === 2 &&
                selectedValues.some(
                  (val) =>
                    !val.column1 ||
                    !val.column2 ||
                    (val.setThreshold &&
                      (!val.thresholdType || !val.thresholdValue))
                )) ||
              (activeStep === 3 &&
                reconciliationSettings.method !== "many-to-many" &&
                (!reconciliationSettings.duplicateHandling ||
                  !reconciliationSettings.baseColumn1 ||
                  !reconciliationSettings.baseColumn2)) ||
              (activeStep === 4 &&
                (!crossReference.column1 ||
                  (!crossReference.column2 &&
                    !(cardinality.file2 === "many" && crossReference.customReference)))) ||
              (activeStep === steps.length - 1 && isLoading)
            }
            sx={{
              backgroundColor: "#B82132",
              "&:hover": {
                backgroundColor: "#8E1A28",
              },
            }}
          >
            {activeStep === steps.length - 1
              ? isLoading
                ? <CircularProgress size={24} />
                : "Submit"
              : "Next"}
          </Button>
        </Box>
      </Container>
    </NavigationBar>
  );
};

export default ReconcileFiles; 