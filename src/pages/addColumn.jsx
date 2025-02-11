import React, { useState, useEffect, useCallback } from "react";
import {
    Container,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField,
    IconButton,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormHelperText,
    List,
    ListItem,
    Divider,
    Checkbox,
    Tooltip,
    InputAdornment,
    CircularProgress
} from "@mui/material";
import { 
    Add as AddIcon, 
    RemoveCircle as DeleteIcon, 
    Download as DownloadIcon, 
    Preview as PreviewIcon,
    Delete as RemoveStepIcon 
} from "@mui/icons-material";
import { getUserFiles, getFileDetails} from "../services/api";
import NavigationBar from "../components/NavigationBar";
import SearchIcon from '@mui/icons-material/Search';
import { applyColumnOperations } from "../services/api";
import { previewColumnOperations } from "../services/api";
import { useSnackbar } from "notistack";
import { submitColumnOperations } from "../services/api";
const FileColumnOperations = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDetails, setFileDetails] = useState({});
    const [selectedSheet, setSelectedSheet] = useState("");
    const [columns, setColumns] = useState([]);
    const [newColumns, setNewColumns] = useState([]);
    const [newColumnName, setNewColumnName] = useState("");
    const [calculationSteps, setCalculationSteps] = useState([]);
    const [concatSteps, setConcatSteps] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [residualValue, setResidualValue] = useState("");
    const [regexPattern, setRegexPattern] = useState("");
    const [selectedColumn, setSelectedColumn] = useState("");
    const [previewData, setPreviewData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState("xlsx");
    const [downloadFileName, setDownloadFileName] = useState("");
    const [currentColumnIndex, setCurrentColumnIndex] = useState(null);
    const { enqueueSnackbar } = useSnackbar();
    const [errors, setErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newFileName, setNewFileName] = useState('');

    const addNotification = useCallback((type, message) => {
        enqueueSnackbar(message, { variant: type });
    }, [enqueueSnackbar]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await getUserFiles();
                setFiles(response.files || []);
            } catch (error) {
                enqueueSnackbar("Failed to fetch files.", { variant: "error" });
            }
        };
        fetchFiles();
    }, []);

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

                    // Generate new filename
                    const baseFileName = details.fileName.replace(/\.[^/.]+$/, "");
                    const fileExtension = details.fileName.split(".").pop();
                    setNewFileName(`${baseFileName}_EditedFile.${fileExtension}`);

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
    }, [selectedSheet]);

    const handleAddColumn = () => {
        setNewColumns([...newColumns, { 
            name: "", 
            type: "calculate",
            params: [],
            sourceColumn: "",
            pattern: "",
            residualValue: ""
        }]);
    };

    const handleUpdateColumn = (index, field, value) => {
        const updatedColumns = [...newColumns];
        updatedColumns[index][field] = value;
        setNewColumns(updatedColumns);
    };

    const handleRemoveColumn = (index) => {
        setNewColumns(newColumns.filter((_, i) => i !== index));
    };

    const handleOperationTypeChange = (index, value) => {
        const updatedColumns = [...newColumns];
        updatedColumns[index] = {
            name: "",
            type: value,
            params: [],
            sourceColumn: "",
            pattern: "",
            residualValue: ""
        };
        setNewColumns(updatedColumns);
    };

    const handleAddCalculationStep = (columnIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.push({
            col1: "",
            operator: "+",
            col2: "",
            value: null
        });
        setNewColumns(updatedColumns);
    };

    const handleAddConcatStep = (columnIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.push({
            column: "",
            type: "Full text",
            chars: null
        });
        setNewColumns(updatedColumns);
    };

    const handleAddCondition = (columnIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.push({
            column: "",
            operator: "equals",
            referenceValue: "",
            conditionalValue: ""
        });
        setNewColumns(updatedColumns);
    };

    const handleRemoveCalculationStep = (columnIndex, stepIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.splice(stepIndex, 1);
        setNewColumns(updatedColumns);
    };

    const handleRemoveConcatStep = (columnIndex, stepIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.splice(stepIndex, 1);
        setNewColumns(updatedColumns);
    };

    const handleRemoveCondition = (columnIndex, condIndex) => {
        const updatedColumns = [...newColumns];
        updatedColumns[columnIndex].params.splice(condIndex, 1);
        setNewColumns(updatedColumns);
    };

    const validateOperation = (column) => {
        const newErrors = {};

        if (!column.name) {
            newErrors.name = "Column name is required";
        }

        if (column.type === "conditional") {
            if (column.residualValue === undefined || column.residualValue === "") {
                newErrors.residualValue = "Residual value is required";
            }
            if (!column.params || column.params.length === 0) {
                newErrors.params = "At least one condition is required";
            } else {
                column.params.forEach((param, index) => {
                    if (!param.column) newErrors[`param${index}_column`] = "Column is required";
                    if (!param.referenceValue) newErrors[`param${index}_reference`] = "Reference value is required";
                    if (!param.conditionalValue) newErrors[`param${index}_conditional`] = "Conditional value is required";
                });
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setCurrentColumnIndex(null);
    };
    const handlePreview = async () => {
        try {
            if (newColumns.length === 0) {
                addNotification('error', 'No column operations added');
                return;
            }

            setIsSubmitting(true);
            
            // Format all operations
            const operations = newColumns.map(column => ({
                type: column.type,
                newColumnName: column.name,
                params: column.params || [],
                sourceColumn: column.sourceColumn || '',
                pattern: column.pattern || '',
                residualValue: column.residualValue || ''
            }));
    
            const result = await previewColumnOperations(
                selectedFile.fileName,
                selectedSheet,
                operations
            );
    
            if (result.success) {
                setPreviewData(result.preview);
                setPreviewOpen(true);
            } else {
                throw new Error(result.error || 'Preview failed');
            }
        } catch (error) {
            addNotification('error', error.message || 'Failed to generate preview');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSubmitOperations = async () => {
        try {
            // Validate all operations first
            for (const column of newColumns) {
                if (!validateOperation(column)) {
                    addNotification('error', 'Please fix the errors before submitting');
                    return;
                }
            }

            setIsSubmitting(true);
            
            // Format all operations
            const operations = newColumns.map(column => ({
                type: column.type,
                newColumnName: column.name,
                params: column.params || [],
                sourceColumn: column.sourceColumn || '',
                pattern: column.pattern || '',
                residualValue: column.residualValue || ''
            }));

            const result = await submitColumnOperations(
                selectedFile.fileName,
                selectedSheet,
                operations,
                downloadFormat
            );

            if (result.success) {
                addNotification('success', 'All operations applied successfully');
                
                if (result.fileName && result.downloadUrl) {
                    setFiles(prevFiles => [...prevFiles, {
                        fileName: result.fileName,
                        downloadUrl: result.downloadUrl
                    }]);
                }
                
                // Clear all operations after successful application
                setNewColumns([]);
                setErrors({});
            } else {
                throw new Error(result.error || 'Operation failed');
            }
        } catch (error) {
            addNotification('error', error.message || 'Failed to apply operations');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Add a new button to apply all operations at once
    const renderApplyAllButton = () => {
        if (newColumns.length > 1) {
            return (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSubmitOperations()}
                    disabled={isSubmitting}
                    sx={{ mt: 2, mb: 2 }}
                    startIcon={<AddIcon />}
                    aria-label="Apply all column operations"
                >
                    Apply All Column Operations
                </Button>
            );
        }
        return null;
    };
    const handleDownload = async (columnIndex) => {
        try {
            setIsSubmitting(true);
            const column = newColumns[columnIndex];
            
            const operation = {
                fileName: selectedFile,
                sheetName: selectedSheet,
                operation: {
                    type: column.type,
                    newColumnName: column.name,
                    params: column.params,
                    sourceColumn: column.sourceColumn,
                    pattern: column.pattern,
                    residualValue: column.residualValue
                },
                format: downloadFormat
            };

            const result = await submitColumnOperations(selectedFile, operation);
            
            const url = window.URL.createObjectURL(new Blob([result.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedFile}_updated.${downloadFormat}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            enqueueSnackbar('File downloaded successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to download file', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderColumnParameters = (column, columnIndex) => {
        switch (column.type) {
            case "calculate":
                return (
                    <>
                        <TextField
                            fullWidth
                            label="New Column Name"
                            value={column.name}
                            onChange={(e) => handleUpdateColumn(columnIndex, "name", e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        {column.params.map((step, stepIndex) => (
                            <Grid container spacing={2} key={stepIndex} sx={{ mb: 2 }}>
                                <Grid item xs={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Column</InputLabel>
                                        <Select
                                            value={step.col1}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].col1 = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                        >
                                            {columns.map((col) => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Operator</InputLabel>
                                        <Select
                                            value={step.operator}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].operator = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                        >
                                            {["+", "-", "*", "/"].map((op) => (
                                                <MenuItem key={op} value={op}>{op}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Other Column or Fixed Value</InputLabel>
                                        <Select
                                            value={step.col2}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].col2 = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                        >
                                            {[...columns, "Fixed Value"].map((col) => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {step.col2 === "Fixed Value" && (
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Value"
                                            value={step.value || ""}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].value = parseFloat(e.target.value);
                                                setNewColumns(updatedColumns);
                                            }}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={1}>
                                    <IconButton 
                                        onClick={() => handleRemoveCalculationStep(columnIndex, stepIndex)}
                                        color="error"
                                        aria-label="Remove calculation step"
                                        title="Remove calculation step"
                                    >
                                        <RemoveStepIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={() => handleAddCalculationStep(columnIndex)}
                            startIcon={<AddIcon />}
                            sx={{ mt: 1 }}
                            aria-label="Add calculation step"
                        >
                            Add Calculation Step
                        </Button>
                    </>
                );

            case "concatenate":
                return (
                    <>
                        <TextField
                            fullWidth
                            label="New Column Name"
                            value={column.name}
                            onChange={(e) => handleUpdateColumn(columnIndex, "name", e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        {column.params.map((step, stepIndex) => (
                            <Grid container spacing={2} key={stepIndex} sx={{ mb: 2 }}>
                                <Grid item xs={5}>
                                    <FormControl fullWidth>
                                        <InputLabel>Column</InputLabel>
                                        <Select
                                            value={step.column || ""}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].column = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                        >
                                            {columns.map((col) => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={step.type || "Full text"}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].type = e.target.value;
                                                if (e.target.value === "Full text") {
                                                    updatedColumns[columnIndex].params[stepIndex].chars = null;
                                                }
                                                setNewColumns(updatedColumns);
                                            }}
                                        >
                                            <MenuItem value="Full text">Full text</MenuItem>
                                            <MenuItem value="Left">Left</MenuItem>
                                            <MenuItem value="Right">Right</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {step.type !== "Full text" && (
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Number of Characters"
                                            value={step.chars || ""}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[stepIndex].chars = parseInt(e.target.value, 10);
                                                setNewColumns(updatedColumns);
                                            }}
                                            InputProps={{
                                                inputProps: { min: 1 }
                                            }}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={1}>
                                    <IconButton 
                                        onClick={() => handleRemoveConcatStep(columnIndex, stepIndex)}
                                        color="error"
                                        aria-label="Remove concatenation step"
                                        title="Remove concatenation step"
                                    >
                                        <RemoveStepIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={() => handleAddConcatStep(columnIndex)}
                            startIcon={<AddIcon />}
                            sx={{ mt: 1 }}
                            aria-label="Add concatenation step"
                        >
                            Add Text Part
                        </Button>
                    </>
                );

            case "conditional":
                return (
                    <>
                        <TextField
                            fullWidth
                            label="New Column Name"
                            value={column.name}
                            onChange={(e) => handleUpdateColumn(columnIndex, "name", e.target.value)}
                            sx={{ mb: 2 }}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            fullWidth
                            label="Residual Value (if no conditions are met)"
                            value={column.residualValue || ""}
                            onChange={(e) => handleUpdateColumn(columnIndex, "residualValue", e.target.value)}
                            sx={{ mb: 3 }}
                            error={!!errors.residualValue}
                            helperText={errors.residualValue || "This value will be used if none of the conditions match"}
                        />
                        
                        {errors.params && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {errors.params}
                            </Typography>
                        )}
                        
                        {column.params.map((condition, condIndex) => (
                            <Box key={condIndex} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                    Condition {condIndex + 1}
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <FormControl fullWidth error={!!errors[`param${condIndex}_column`]}>
                                            <InputLabel>Column</InputLabel>
                                            <Select
                                                value={condition.column || ""}
                                                onChange={(e) => {
                                                    const updatedColumns = [...newColumns];
                                                    updatedColumns[columnIndex].params[condIndex].column = e.target.value;
                                                    setNewColumns(updatedColumns);
                                                }}
                                            >
                                                {columns.map((col) => (
                                                    <MenuItem key={col} value={col}>{col}</MenuItem>
                                                ))}
                                            </Select>
                                            {errors[`param${condIndex}_column`] && (
                                                <FormHelperText>{errors[`param${condIndex}_column`]}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <FormControl fullWidth>
                                            <InputLabel>Operator</InputLabel>
                                            <Select
                                                value={condition.operator || "equals"}
                                                onChange={(e) => {
                                                    const updatedColumns = [...newColumns];
                                                    updatedColumns[columnIndex].params[condIndex].operator = e.target.value;
                                                    setNewColumns(updatedColumns);
                                                }}
                                            >
                                                <MenuItem value="equals">equals</MenuItem>
                                                <MenuItem value="does not equal">does not equal</MenuItem>
                                                <MenuItem value="greater than">greater than</MenuItem>
                                                <MenuItem value="greater than or equal to">greater than or equal to</MenuItem>
                                                <MenuItem value="less than">less than</MenuItem>
                                                <MenuItem value="less than or equal to">less than or equal to</MenuItem>
                                                <MenuItem value="begins with">begins with</MenuItem>
                                                <MenuItem value="does not begin with">does not begin with</MenuItem>
                                                <MenuItem value="ends with">ends with</MenuItem>
                                                <MenuItem value="does not end with">does not end with</MenuItem>
                                                <MenuItem value="contains">contains</MenuItem>
                                                <MenuItem value="does not contain">does not contain</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            fullWidth
                                            label="Reference Value"
                                            value={condition.referenceValue || ""}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[condIndex].referenceValue = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Conditional Value"
                                            value={condition.conditionalValue || ""}
                                            onChange={(e) => {
                                                const updatedColumns = [...newColumns];
                                                updatedColumns[columnIndex].params[condIndex].conditionalValue = e.target.value;
                                                setNewColumns(updatedColumns);
                                            }}
                                            helperText="Value if condition is true"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        <IconButton 
                                            onClick={() => handleRemoveCondition(columnIndex, condIndex)}
                                            color="error"
                                            aria-label="Remove condition"
                                            title="Remove condition"
                                        >
                                            <RemoveStepIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        
                        <Button
                            variant="outlined"
                            onClick={() => handleAddCondition(columnIndex)}
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                            aria-label="Add condition"
                        >
                            Add Condition Rule
                        </Button>
                    </>
                );

            case "pattern":
                return (
                    <>
                        <TextField
                            fullWidth
                            label="New Column Name"
                            value={column.name}
                            onChange={(e) => handleUpdateColumn(columnIndex, "name", e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Column</InputLabel>
                                    <Select
                                        value={column.sourceColumn || ""}
                                        onChange={(e) => handleUpdateColumn(columnIndex, "sourceColumn", e.target.value)}
                                    >
                                        {columns.map((col) => (
                                            <MenuItem key={col} value={col}>{col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Regex Pattern"
                                    value={column.pattern || ""}
                                    onChange={(e) => handleUpdateColumn(columnIndex, "pattern", e.target.value)}
                                    helperText="Enter a regular expression pattern"
                                />
                            </Grid>
                        </Grid>
                    </>
                );

            default:
                return null;
        }
    };

    const PreviewDialog = () => (
        <Dialog 
            open={previewOpen} 
            onClose={handleClosePreview}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>Preview Results</DialogTitle>
            <DialogContent>
                {previewData && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {Object.keys(previewData[0] || {}).map((key) => (
                                        <TableCell key={key}>{key}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewData.slice(0, 10).map((row, index) => (
                                    <TableRow key={index}>
                                        {Object.values(row).map((value, i) => (
                                            <TableCell key={i}>{value}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <InputLabel>Format</InputLabel>
                    <Select
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                        size="small"
                    >
                        <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                        <MenuItem value="csv">CSV (.csv)</MenuItem>
                    </Select>
                </FormControl>
                <Button onClick={handleClosePreview}>Close</Button>
                <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(currentColumnIndex)}
                    disabled={currentColumnIndex === null}
                    aria-label="Download modified file"
                >
                    Download Modified File
                </Button>
            </DialogActions>
        </Dialog>
    );

    const handleFileSelection = (file) => {
        setSelectedFile(file);
        addNotification("success", "File selected successfully");
    };

    const filteredFiles = files.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <NavigationBar>
        <Container maxWidth="lg" sx={{ padding: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Select File
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please select a file to add new columns.
                </Typography>

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

                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <List>
                            {filteredFiles.map((file, index) => (
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
                                                checked={selectedFile?.fileName === file.fileName}
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
                                            color="#B82132"
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

                        {selectedFile && (
                            <TextField
                                fullWidth
                                label="Output File Name"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                sx={{ mt: 2 }}
                                helperText="Enter the name for the output file"
                            />
                        )}
                    </>
                )}
            </Paper>

            {selectedFile && !isLoading && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select Sheet
                    </Typography>
                    <FormControl 
                        fullWidth 
                        sx={{ mb: 3 }}
                    >
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

            {selectedSheet && (
                <Box sx={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: 3
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <Typography variant="h6" sx={{ 
                            color: "#2C3E50",
                            borderBottom: '3px solid #B82132',
                            display: 'inline-block',
                            paddingBottom: '8px'
                        }}>
                            Column Operations
                        </Typography>
                        
                        <Button 
                            onClick={handleAddColumn}
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                backgroundColor: "#B82132",
                                '&:hover': {
                                    backgroundColor: "#961a28",
                                },
                            }}
                        >
                            Add New Column Operation
                        </Button>
                    </Box>

                    {newColumns.length === 0 ? (
                        <Box sx={{ 
                            textAlign: 'center', 
                            py: 4,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: 1
                        }}>
                            <Typography color="textSecondary">
                                No column operations added yet. Click "Add New Column Operation" to begin.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {newColumns.map((col, index) => (
                                <Card 
                                    key={index} 
                                    sx={{ 
                                        mb: 3,
                                        border: '1px solid #eee',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ mb: 2 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Operation Type</InputLabel>
                                                <Select
                                                    value={col.type}
                                                    onChange={(e) => handleOperationTypeChange(index, e.target.value)}
                                                    sx={{
                                                        mb: 2,
                                                        '&.MuiOutlinedInput-root': {
                                                            '&:hover fieldset': {
                                                                borderColor: '#B82132',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#B82132',
                                                            },
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="calculate">Calculate</MenuItem>
                                                    <MenuItem value="concatenate">Concatenate</MenuItem>
                                                    <MenuItem value="conditional">Conditional</MenuItem>
                                                    <MenuItem value="pattern">Pattern</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        {renderColumnParameters(col, index)}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                        <IconButton 
                                            onClick={() => handleRemoveColumn(index)}
                                            color="error"
                                            aria-label="Remove operation"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            ))}

                            {/* Action Buttons */}
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 2, 
                                justifyContent: 'flex-end',
                                mt: 3 
                            }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<PreviewIcon />}
                                    onClick={handlePreview}
                                    disabled={isSubmitting}
                                    sx={{
                                        color: '#2C3E50',
                                        borderColor: '#2C3E50',
                                        '&:hover': {
                                            borderColor: '#B82132',
                                            color: '#B82132'
                                        }
                                    }}
                                >
                                    Preview All Changes
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitOperations}
                                    disabled={isSubmitting}
                                    sx={{
                                        backgroundColor: "#B82132",
                                        '&:hover': {
                                            backgroundColor: "#961a28",
                                        },
                                    }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Apply All Changes'
                                    )}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            )}

            <PreviewDialog />
        </Container>
        </NavigationBar>
    );
};

export default FileColumnOperations;
