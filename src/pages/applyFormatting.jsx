import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    FormControl,
    RadioGroup,
    Radio,
    FormControlLabel,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    Button,
    Grid,
    List,
    ListItem,
    Divider,
    Checkbox,
    Tooltip,
    InputAdornment,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import { useSnackbar } from 'notistack';
import NavigationBar from '../components/NavigationBar';
import { getUserFiles, getFileDetails } from "../services/api";
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import { previewFormatting, applyFormatting } from "../services/api";
import { reconcileFiles } from "../services/api";
import PreviewComponent from "../components/PreviewComponent";

const ApplyFormatting = () => {
    // File and Sheet Selection States
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDetails, setFileDetails] = useState({});
    const [selectedSheet, setSelectedSheet] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newFileName, setNewFileName] = useState('');

    // Formatting States
    const [formattingType, setFormattingType] = useState('Font Colour');
    const [locationType, setLocationType] = useState('Columns');
    const [columnRange, setColumnRange] = useState('');
    const [rowRange, setRowRange] = useState('');
    const [cellRange, setCellRange] = useState('');
    const [fontColor, setFontColor] = useState('');
    const [fillColor, setFillColor] = useState('');
    const [numberFormat, setNumberFormat] = useState('');
    const [columnWidth, setColumnWidth] = useState('');
    const [conditionOperator, setConditionOperator] = useState('equals');
    const [conditionValue, setConditionValue] = useState('');
    const [trueFormat, setTrueFormat] = useState('');
    const [falseFormat, setFalseFormat] = useState('');

    // Preview States
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [downloadFormat, setDownloadFormat] = useState('xlsx');

    const { enqueueSnackbar } = useSnackbar();

    const addNotification = useCallback((type, message) => {
        enqueueSnackbar(message, { variant: type });
    }, [enqueueSnackbar]);

    // Fetch files on component mount
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await getUserFiles();
                setFiles(response.files || []);
            } catch (error) {
                addNotification("error", "Unable to load your files. Please try again later.");
            }
        };
        fetchFiles();
    }, [addNotification]);

    // Fetch file details when a file is selected
    useEffect(() => {
        if (selectedFile) {
            const fetchFileDetails = async () => {
                setIsLoading(true);
                try {
                    const details = await getFileDetails(selectedFile.fileName);

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

                    setSelectedSheet("");
                    const baseFileName = details.fileName.replace(/\.[^/.]+$/, "");
                    const fileExtension = details.fileName.split(".").pop();
                    setNewFileName(`${baseFileName}_Formatted.${fileExtension}`);

                    addNotification("success", `Successfully loaded details for ${details.fileName}`);
                } catch (error) {
                    console.error("Error fetching file details:", error);
                    addNotification("error", "Unable to load file details. Please ensure the file is accessible.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchFileDetails();
        }
    }, [selectedFile, addNotification]);

    const handleFileSelection = (file) => {
        setSelectedFile(file);
        addNotification("success", `Selected file: ${file.fileName}`);
    };

    const filteredFiles = files.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePreview = async () => {
        if (!selectedFile) {
            addNotification('warning', 'Please select a file before generating a preview');
            return;
        }
    
        setIsLoading(true);
        try {
            const formattingConfig = {
                type: formattingType,
                location: {
                    type: locationType,
                    range: locationType === 'Columns' ? columnRange : 
                           locationType === 'Rows' ? rowRange : cellRange
                },
                format: {
                    fontColor: formattingType === 'Font Colour' ? fontColor : undefined,
                    fillColor: formattingType === 'Fill Colour' ? fillColor : undefined,
                    numberFormat: formattingType === 'Cell Number Format' ? numberFormat : undefined,
                    columnWidth: formattingType === 'Column Width' ? parseInt(columnWidth) : undefined,
                    bold: formattingType === 'Bold' ? true : undefined,
                    conditional: formattingType === 'Conditional Formatting' ? {
                        operator: conditionOperator,
                        value: conditionValue,
                        trueFormat: trueFormat,
                        falseFormat: falseFormat
                    } : undefined
                }
            };
    
            const response = await previewFormatting(
                selectedFile.fileName,
                selectedSheet,
                formattingConfig
            );
            
            if (response.success) {
                // Transform the data to match PreviewComponent structure
                const transformedData = {
                    rows: response.data.map(row => row.values),
                    columns: Object.keys(response.data[0]?.values || {})
                };
                
                setPreviewData([{
                    sheetName: "Formatting Preview",
                    rows: transformedData.rows,
                    columns: transformedData.columns
                }]);
                setPreviewDialogOpen(true);
                addNotification('success', 'Preview generated successfully. You can now review the changes.');
            } else {
                addNotification('error', response.error || 'Unable to generate preview. Please check your formatting settings.');
            }
        } catch (error) {
            console.error('Preview error:', error);
            addNotification('error', 'Failed to generate preview. Please try again or contact support if the issue persists.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = async () => {
        if (!selectedFile) {
            addNotification('warning', 'Please select a file before applying formatting');
            return;
        }
    
        setIsLoading(true);
        try {
            const formattingConfig = {
                type: formattingType,
                location: {
                    type: locationType,
                    range: locationType === 'Columns' ? columnRange : 
                           locationType === 'Rows' ? rowRange : cellRange
                },
                format: {
                    fontColor: formattingType === 'Font Colour' ? fontColor : undefined,
                    fillColor: formattingType === 'Fill Colour' ? fillColor : undefined,
                    numberFormat: formattingType === 'Cell Number Format' ? numberFormat : undefined,
                    columnWidth: formattingType === 'Column Width' ? parseInt(columnWidth) : undefined,
                    bold: formattingType === 'Bold' ? true : undefined,
                    conditional: formattingType === 'Conditional Formatting' ? {
                        operator: conditionOperator,
                        value: conditionValue,
                        trueFormat: trueFormat,
                        falseFormat: falseFormat
                    } : undefined
                },
                outputFormat: downloadFormat
            };
    
            const response = await applyFormatting(
                selectedFile.fileName,
                selectedSheet,
                formattingConfig
            );
    
            if (response.success) {
                addNotification('success', 'Formatting applied successfully. Your download will begin shortly.');
                setPreviewDialogOpen(false);
                setPreviewData(null);
                
                if (response.downloadUrl) {
                    window.open(response.downloadUrl, '_blank');
                }
    
                // Refresh file list
                const filesResponse = await getUserFiles();
                setFiles(filesResponse.files || []);
            } else {
                addNotification('error', response.error || 'Unable to apply formatting. Please check your settings and try again.');
            }
        } catch (error) {
            console.error('Apply formatting error:', error);
            addNotification('error', 'Failed to apply formatting. Please try again or contact support if the issue persists.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormattingOptions = () => {
        switch (formattingType) {
            case 'Font Colour':
            case 'Fill Colour':
                return (
                    <TextField
                        fullWidth
                        label={`${formattingType} (Hex)`}
                        value={formattingType === 'Font Colour' ? fontColor : fillColor}
                        onChange={(e) => formattingType === 'Font Colour' 
                            ? setFontColor(e.target.value) 
                            : setFillColor(e.target.value)}
                        placeholder="#FFFFFF"
                        sx={{ mt: 2 }}
                    />
                );
            case 'Cell Number Format':
                return (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Number Format</InputLabel>
                        <Select
                            value={numberFormat}
                            onChange={(e) => setNumberFormat(e.target.value)}
                        >
                            <MenuItem value="general">General</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="currency">Currency</MenuItem>
                            <MenuItem value="accounting">Accounting</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="percentage">Percentage</MenuItem>
                            <MenuItem value="fraction">Fraction</MenuItem>
                            <MenuItem value="scientific">Scientific</MenuItem>
                            <MenuItem value="text">Text</MenuItem>
                        </Select>
                    </FormControl>
                );
            case 'Column Width':
                return (
                    <TextField
                        fullWidth
                        type="number"
                        label="Width"
                        value={columnWidth}
                        onChange={(e) => setColumnWidth(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                );
            case 'Conditional Formatting':
                return (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Condition</InputLabel>
                                <Select
                                    value={conditionOperator}
                                    onChange={(e) => setConditionOperator(e.target.value)}
                                >
                                    <MenuItem value="equals">Equals</MenuItem>
                                    <MenuItem value="does not equal">Does Not Equal</MenuItem>
                                    <MenuItem value="greater than">Greater Than</MenuItem>
                                    <MenuItem value="greater than or equal to">Greater Than or Equal To</MenuItem>
                                    <MenuItem value="less than">Less Than</MenuItem>
                                    <MenuItem value="less than or equal to">Less Than or Equal To</MenuItem>
                                    <MenuItem value="begins with">Begins With</MenuItem>
                                    <MenuItem value="does not begin with">Does Not Begin With</MenuItem>
                                    <MenuItem value="ends with">Ends With</MenuItem>
                                    <MenuItem value="does not end with">Does Not End With</MenuItem>
                                    <MenuItem value="contains">Contains</MenuItem>
                                    <MenuItem value="does not contain">Does Not Contain</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Value"
                                value={conditionValue}
                                onChange={(e) => setConditionValue(e.target.value)}
                                type={['equals', 'does not equal', 'greater than', 'greater than or equal to', 
                                       'less than', 'less than or equal to'].includes(conditionOperator) ? 'number' : 'text'}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="True Format (Hex)"
                                value={trueFormat}
                                onChange={(e) => setTrueFormat(e.target.value)}
                                placeholder="#FFFFFF"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="False Format (Hex)"
                                value={falseFormat}
                                onChange={(e) => setFalseFormat(e.target.value)}
                                placeholder="#FFFFFF"
                            />
                        </Grid>
                    </Grid>
                );
            default:
                return null;
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
                    Apply Formatting
                </Typography>

                {/* Search Bar */}
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
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
                </Box>

                {/* File Selection Paper */}
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select File
                    </Typography>
                    
                    {isLoading ? (
                        <Box sx={{ textAlign: "center", marginY: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredFiles.map((file, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Checkbox
                                                    checked={selectedFile?.fileName === file.fileName}
                                                    onChange={() => handleFileSelection(file)}
                                                    sx={{
                                                        color: "#B82132",
                                                        '&.Mui-checked': {
                                                            color: "#B82132",
                                                        },
                                                    }}
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
                    )}
                </Paper>

                {/* Sheet Selection Section */}
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

                {/* Formatting Options Section */}
                {selectedSheet && (
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Formatting Options
                        </Typography>

                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <RadioGroup
                                value={formattingType}
                                onChange={(e) => setFormattingType(e.target.value)}
                            >
                                {[
                                    'Font Colour',
                                    'Fill Colour',
                                    'Cell Number Format',
                                    'Bold',
                                    'Column Width',
                                    'Conditional Formatting'
                                ].map((type) => (
                                    <FormControlLabel
                                        key={type}
                                        value={type}
                                        control={<Radio />}
                                        label={type}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>

                        {formattingType !== 'Column Width' && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Apply formatting to</InputLabel>
                                <Select
                                    value={locationType}
                                    onChange={(e) => setLocationType(e.target.value)}
                                >
                                    {["Columns", "Rows", "Cells"].map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {locationType === 'Columns' && (
                            <TextField
                                fullWidth
                                label="Column Range"
                                value={columnRange}
                                onChange={(e) => setColumnRange(e.target.value)}
                                placeholder="e.g., A:C or A,C,E"
                                sx={{ mb: 2 }}
                            />
                        )}

                        {locationType === 'Rows' && (
                            <TextField
                                fullWidth
                                label="Row Range"
                                value={rowRange}
                                onChange={(e) => setRowRange(e.target.value)}
                                placeholder="e.g., 1:3 or 1,3,5"
                                sx={{ mb: 2 }}
                            />
                        )}

                        {locationType === 'Cells' && (
                            <TextField
                                fullWidth
                                label="Cell Range"
                                value={cellRange}
                                onChange={(e) => setCellRange(e.target.value)}
                                placeholder="e.g., A1:C3 or A1,B2,C3"
                                sx={{ mb: 2 }}
                            />
                        )}

                        {renderFormattingOptions()}

                        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handlePreview}
                                disabled={isLoading}
                                startIcon={<PreviewIcon />}
                            >
                                Preview
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                startIcon={<DownloadIcon />}
                                sx={{
                                    backgroundColor: '#B82132',
                                    '&:hover': {
                                        backgroundColor: '#8E1A28',
                                    },
                                }}
                            >
                                Apply & Download
                            </Button>
                        </Box>
                    </Paper>
                )}

                {previewDialogOpen && previewData && (
                    <PreviewComponent
                        previewData={previewData}
                        open={previewDialogOpen}
                        onClose={() => setPreviewDialogOpen(false)}
                    />
                )}
            </Container>
        </NavigationBar>
    );
};

export default ApplyFormatting;