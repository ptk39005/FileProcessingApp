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
    CircularProgress,
    Paper,
    IconButton,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    List,
    ListItem,
    Divider,
    Tooltip,
    FormControlLabel,
    Grid,
    CardContent,
    Card,
    CardActions
} from "@mui/material";
import { Add, RemoveCircle } from "@mui/icons-material";
import {
    getUserFiles,
    getFileDetails,
    previewCombinedData,
    saveCombinedData,
} from "../services/api";
import NavigationBar from "../components/NavigationBar";
import PreviewComponent from "../components/PreviewComponent";
import { useSnackbar } from "notistack";

const SortAndFilter = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDetails, setFileDetails] = useState({});
    const [selectedSheet, setSelectedSheet] = useState("");
    const [columns, setColumns] = useState([]);
    const [comparableColumns, setComparableColumns] = useState([]);
    const [sortConfig, setSortConfig] = useState([]);
    const [filterConfig, setFilterConfig] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [fileName, setFileName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [newFileName, setNewFileName] = useState("");

    const handleSearch = () => {
        const filteredFiles = files.filter((file) =>
            file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFiles(filteredFiles);
    };

    const { enqueueSnackbar } = useSnackbar();

    const addNotification = useCallback(
        (type, text) => {
            enqueueSnackbar(text, { variant: type });
        },
        [enqueueSnackbar]
    );

    useEffect(() => {
        const fetchFiles = async () => {
            setIsLoading(true);
            try {
                const response = await getUserFiles();
                if (response.files) {
                    const sortedFiles = response.files.sort(
                        (a, b) => new Date(b.uploadTime) - new Date(a.uploadTime)
                    );
                    setFiles(sortedFiles);
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

    useEffect(() => {
        if (selectedFile) {
            const fetchFileDetails = async () => {
                setIsLoading(true);
                try {
                    console.log(`Fetching details for file: ${selectedFile}`);
                    const details = await getFileDetails(selectedFile); // API call
    
                    console.log("File details response:", details);
    
                    // Check file type and structure the response accordingly
                    if (details.fileType === "Excel") {
                        setFileDetails(details?.sheets || {}); // Handle Excel sheets
                    } else if (details.fileType === "CSV") {
                        setFileDetails({
                            CSV: {
                                columnTypes: details.columnTypes,
                                columns: details.columns,
                            },
                        }); // Handle CSV with a consistent structure
                    }
    
                    // Reset sheet and column selections
                    setSelectedSheet("");
                    setColumns([]);
                    setComparableColumns([]);
    
                    // Automatically generate a new file name
                    const baseFileName = details.fileName.replace(/\.[^/.]+$/, ""); // Remove the extension
                    const fileExtension = details.fileName.split(".").pop(); // Get the extension
                    setNewFileName(`${baseFileName}_EditedFile.${fileExtension}`);
                } catch (error) {
                    console.error("Error fetching file details:", error);
                    addNotification("error", error.message || "Failed to fetch file details.");
                } finally {
                    setIsLoading(false);
                }
            };
    
            fetchFileDetails();
        }
    }, [selectedFile, addNotification]);
    
    useEffect(() => {
        if (selectedSheet) {
            console.log("Selected sheet:", selectedSheet);
            const sheetData = fileDetails[selectedSheet];
            if (sheetData) {
                console.log("Sheet data:", sheetData);
                const columnTypes = sheetData.columnTypes;

                const comparableCols = Object.entries(columnTypes)
                    .filter(([_, type]) => ["int", "float", "datetime"].includes(type))
                    .map(([col]) => col);

                setColumns(sheetData.columns || []);
                setComparableColumns(comparableCols);
                console.log("Columns:", sheetData.columns);
                console.log("Comparable columns:", comparableCols);
            } else {
                console.warn("Sheet data not found for selected sheet:", selectedSheet);
            }
        }
    }, [selectedSheet, fileDetails]);


    const handleAddSortConfig = () => {
        setSortConfig((prev) => [...prev, { column: "", order: "asc" }]);
    };

    const handleUpdateSortConfig = (index, field, value) => {
        setSortConfig((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleRemoveSortConfig = (index) => {
        setSortConfig((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddFilterConfig = () => {
        setFilterConfig((prev) => [...prev, { column: "", criteria: "equals", value: "" }]);
    };

    const handleUpdateFilterConfig = (index, field, value) => {
        setFilterConfig((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleRemoveFilterConfig = (index) => {
        setFilterConfig((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePreviewCombined = async () => {
        if (!selectedFile || !selectedSheet) {
            addNotification("error", "Please select a file and a sheet for previewing combined operations.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = { fileName: selectedFile, sheet: selectedSheet, sortConfig, filterConfig };
            const response = await previewCombinedData(payload);

            if (response?.success && response?.data) {
                setResultData([
                    {
                        sheetName: selectedSheet,
                        rows: response.data.rows || [],
                        columns: response.data.columns || [],
                    },
                ]);
                addNotification("success", "Combined preview generated successfully.");
            } else {
                throw new Error("Invalid response format.");
            }
        } catch (error) {
            addNotification("error", error.message || "Error generating combined preview.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleSaveCombined = async () => {
        if (!selectedFile || !selectedSheet) {
            addNotification("error", "Please select a file and a sheet for saving combined operations.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = { fileName: selectedFile, sheet: selectedSheet, sortConfig, filterConfig };
            const response = await saveCombinedData(payload);
            addNotification("success", `Combined data saved successfully. Download URL: ${response.downloadUrl}`);
        } catch (error) {
            addNotification("error", error.message || "Error saving combined data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClosePreview = () => {
        setResultData(null);
    };

    return (
        <NavigationBar>
            <Container maxWidth="md" sx={{ py: 4 }}>
                {isLoading && (
                    <Box
                        sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            zIndex: 2000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}


                <Typography variant="h4" textAlign="center" gutterBottom sx={{ 
                    mb: 4,
                    color: '#2C3E50'
                }}>
                    Sort & Filter
                </Typography>

                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>

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


                    {/* File Selection */}
                    <Typography variant="h6" gutterBottom>
                        Available Files
                    </Typography>

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
                                                    onClick={() => setSelectedFile(file.fileName)}
                                                >
                                                    Select File
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
                    </Box>

                    {selectedFile && Object.keys(fileDetails).length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            {/* File Name Header */}
                            <Typography
                                variant="h5"
                                gutterBottom
                                sx={{ fontWeight: "bold", color: "primary.main" }}
                            >
                                Editing File: {typeof selectedFile === "string" ? selectedFile : selectedFile.fileName}
                            </Typography>
                        </Box>
                    )}



                    {/* Sheet Selection */}
                    {selectedFile && Object.keys(fileDetails).length > 0 && (


                        <FormControl fullWidth sx={{ mt: 3 }}>
                            <InputLabel>Select Sheet</InputLabel>
                            <Select
                                value={selectedSheet}
                                onChange={(e) => setSelectedSheet(e.target.value)}
                            >
                                {Object.keys(fileDetails).map((sheetName) => (
                                    <MenuItem key={sheetName} value={sheetName}>
                                        {sheetName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {selectedSheet && (
                        <>
                            {/* Sorting Section */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" gutterBottom>
                                    Sorting Configuration
                                </Typography>
                                {sortConfig.map((config, index) => (
                                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                                        <FormControl sx={{ flex: 1 }}>
                                            <InputLabel>Column</InputLabel>
                                            <Select
                                                value={config.column}
                                                onChange={(e) =>
                                                    handleUpdateSortConfig(index, "column", e.target.value)
                                                }
                                                sx={{
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#B82132',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#B82132',
                                                    },
                                                }}
                                            >
                                                {columns.map((col) => (
                                                    <MenuItem key={col} value={col}>
                                                        {col}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl sx={{ flex: 1 }}>
                                            <InputLabel>Order</InputLabel>
                                            <Select
                                                value={config.order}
                                                onChange={(e) =>
                                                    handleUpdateSortConfig(index, "order", e.target.value)
                                                }
                                            >
                                                <MenuItem value="asc">Ascending</MenuItem>
                                                <MenuItem value="desc">Descending</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <IconButton onClick={() => handleRemoveSortConfig(index)}>
                                            <RemoveCircle />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    onClick={handleAddSortConfig}
                                    variant="outlined"
                                    startIcon={<Add />}
                                    sx={{
                                        borderColor: '#B82132',
                                        color: '#B82132',
                                        '&:hover': {
                                            borderColor: '#8E1A28',
                                            backgroundColor: 'rgba(184, 33, 50, 0.04)',
                                        },
                                    }}
                                >
                                    Add Sort Rule
                                </Button>
                            </Box>

                            {/* Filtering Section */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" gutterBottom>
                                    Filtering Configuration
                                </Typography>
                                {filterConfig.map((config, index) => (
                                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                                        <FormControl sx={{ flex: 1 }}>
                                            <InputLabel>Column</InputLabel>
                                            <Select
                                                value={config.column}
                                                onChange={(e) =>
                                                    handleUpdateFilterConfig(index, "column", e.target.value)
                                                }
                                                sx={{
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#B82132',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#B82132',
                                                    },
                                                }}
                                            >
                                                {columns.map((col) => (
                                                    <MenuItem key={col} value={col}>
                                                        {col}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl sx={{ flex: 1 }}>
                                            <InputLabel>Criteria</InputLabel>
                                            <Select
                                                value={config.criteria}
                                                onChange={(e) =>
                                                    handleUpdateFilterConfig(index, "criteria", e.target.value)
                                                }
                                            >
                                                {[
                                                    "equals",
                                                    "does not equal",
                                                    "greater than",
                                                    "greater than or equal to",
                                                    "less than",
                                                    "less than or equal to",
                                                    "begins with",
                                                    "does not begin with",
                                                    "ends with",
                                                    "does not end with",
                                                    "contains",
                                                    "does not contain",
                                                ].map((crit) => (
                                                    <MenuItem key={crit} value={crit}>
                                                        {crit}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            label="Value"
                                            value={config.value}
                                            onChange={(e) =>
                                                handleUpdateFilterConfig(index, "value", e.target.value)
                                            }
                                        />
                                        <IconButton onClick={() => handleRemoveFilterConfig(index)}>
                                            <RemoveCircle />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    onClick={handleAddFilterConfig}
                                    variant="outlined"
                                    startIcon={<Add />}
                                >
                                    Add Filter Rule
                                </Button>
                            </Box>
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
                                </Box>

                                {/* File Name Input */}
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
                            </Box>

                            {/* Combined Actions */}
                            <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                                <Button 
                                    onClick={handlePreviewCombined} 
                                    variant="outlined"
                                    sx={{
                                        borderColor: '#B82132',
                                        color: '#B82132',
                                        '&:hover': {
                                            borderColor: '#8E1A28',
                                            backgroundColor: 'rgba(184, 33, 50, 0.04)',
                                        },
                                    }}
                                >
                                    Preview Combined
                                </Button>
                                <Button 
                                    onClick={handleSaveCombined} 
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#B82132',
                                        '&:hover': {
                                            backgroundColor: '#8E1A28',
                                        },
                                    }}
                                >
                                    Save Combined
                                </Button>
                            </Box>

                            {/* Preview Component */}
                            {resultData && Array.isArray(resultData) && resultData.length > 0 ? (
                                <PreviewComponent
                                    previewData={resultData}
                                    open={!!resultData}
                                    onClose={handleClosePreview}
                                />
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    textAlign="center"
                                    sx={{ mt: 2 }}
                                >
                                </Typography>
                            )}
                        </>
                    )}
                </Paper>


            </Container>
        </NavigationBar>
    );
};

export default SortAndFilter;
