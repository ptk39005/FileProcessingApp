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
    TableCell
} from '@mui/material';
import { useSnackbar } from 'notistack';
import NavigationBar from '../components/NavigationBar';
import { getUserFiles, getFileDetails } from "../services/api";
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import { previewFormatting, applyFormatting } from "../services/api";
import { reconcileFiles } from "../services/api";

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
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
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
                addNotification("error", "Failed to fetch files");
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

                    addNotification("success", "File details loaded successfully");
                } catch (error) {
                    console.error("Error fetching file details:", error);
                    addNotification("error", "Failed to fetch file details");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchFileDetails();
        }
    }, [selectedFile, addNotification]);

    const handleFileSelection = (file) => {
        setSelectedFile(file);
        addNotification("success", "File selected successfully");
    };

    const filteredFiles = files.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePreview = async () => {
        if (!selectedFile) {
            addNotification('warning', 'Please select a file first');
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
                setPreviewData(response.data);
                setPreviewOpen(true);
                addNotification('success', 'Preview generated successfully');
            } else {
                addNotification('error', response.error || 'Failed to generate preview');
            }
        } catch (error) {
            console.error('Preview error:', error);
            addNotification('error', error.message || 'Failed to generate preview');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = async () => {
        if (!selectedFile) {
            addNotification('warning', 'Please select a file first');
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
                addNotification('success', 'Formatting applied successfully');
                setPreviewOpen(false);
                setPreviewData(null);
                
                if (response.downloadUrl) {
                    window.open(response.downloadUrl, '_blank');
                }
    
                // Refresh file list
                const filesResponse = await getUserFiles();
                setFiles(filesResponse.files || []);
            } else {
                addNotification('error', response.error || 'Failed to apply formatting');
            }
        } catch (error) {
            console.error('Apply formatting error:', error);
            addNotification('error', error.message || 'Failed to apply formatting');
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

    const PreviewDialog = () => {
        const renderCell = (value, formatting, columnIndex) => {
            if (!formatting || !formatting.affected_columns.includes(columnIndex)) {
                return value;
            }

            let style = {};
            
            switch (formatting.type) {
                case 'font':
                    style = { color: formatting.color };
                    break;
                case 'fill':
                    style = { backgroundColor: formatting.color };
                    break;
                case 'bold':
                    style = { fontWeight: 'bold' };
                    break;
                case 'conditional':
                    const cellValue = String(value).toLowerCase();
                    const compareValue = String(formatting.value).toLowerCase();
                    let matches = false;

                    switch (formatting.operator) {
                        case 'equals':
                            matches = cellValue === compareValue;
                            break;
                        case 'does not equal':
                            matches = cellValue !== compareValue;
                            break;
                        case 'greater than':
                            matches = parseFloat(cellValue) > parseFloat(compareValue);
                            break;
                        case 'greater than or equal to':
                            matches = parseFloat(cellValue) >= parseFloat(compareValue);
                            break;
                        case 'less than':
                            matches = parseFloat(cellValue) < parseFloat(compareValue);
                            break;
                        case 'less than or equal to':
                            matches = parseFloat(cellValue) <= parseFloat(compareValue);
                            break;
                        case 'begins with':
                            matches = cellValue.startsWith(compareValue);
                            break;
                        case 'does not begin with':
                            matches = !cellValue.startsWith(compareValue);
                            break;
                        case 'ends with':
                            matches = cellValue.endsWith(compareValue);
                            break;
                        case 'does not end with':
                            matches = !cellValue.endsWith(compareValue);
                            break;
                        case 'contains':
                            matches = cellValue.includes(compareValue);
                            break;
                        case 'does not contain':
                            matches = !cellValue.includes(compareValue);
                            break;
                    }
                    style = { 
                        backgroundColor: matches ? formatting.trueColor : formatting.falseColor 
                    };
                    break;
                case 'number':
                    // Format numbers based on the specified format
                    switch (formatting.format) {
                        case 'currency':
                            value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                            break;
                        case 'percentage':
                            value = new Intl.NumberFormat('en-US', { style: 'percent' }).format(value / 100);
                            break;
                        case 'number':
                            value = new Intl.NumberFormat('en-US').format(value);
                            break;
                        case 'scientific':
                            value = Number(value).toExponential();
                            break;
                        // Add other number formats as needed
                    }
                    break;
                case 'width':
                    style = { width: `${formatting.width}px` };
                    break;
                default:
                    break;
            }

            return <span style={style}>{value}</span>;
        };

        return (
            <Dialog 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)}
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
                                        {Object.keys(previewData[0]?.values || {}).map((key, index) => (
                                            <TableCell 
                                                key={key}
                                                style={{
                                                    width: previewData[0]?.formatting?.type === 'width' &&
                                                           previewData[0]?.formatting?.affected_columns.includes(index)
                                                        ? `${previewData[0].formatting.width}px`
                                                        : 'auto',
                                                    minWidth: previewData[0]?.formatting?.type === 'width' &&
                                                             previewData[0]?.formatting?.affected_columns.includes(index)
                                                        ? `${previewData[0].formatting.width}px`
                                                        : 'auto',
                                                    maxWidth: previewData[0]?.formatting?.type === 'width' &&
                                                             previewData[0]?.formatting?.affected_columns.includes(index)
                                                        ? `${previewData[0].formatting.width}px`
                                                        : 'auto',
                                                }}
                                            >
                                                {key}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {Object.entries(row.values).map(([key, value], columnIndex) => (
                                                <TableCell 
                                                    key={`${rowIndex}-${key}`}
                                                    style={{
                                                        width: row.formatting?.type === 'width' &&
                                                               row.formatting?.affected_columns.includes(columnIndex)
                                                            ? `${row.formatting.width}px`
                                                            : 'auto',
                                                        minWidth: row.formatting?.type === 'width' &&
                                                                 row.formatting?.affected_columns.includes(columnIndex)
                                                            ? `${row.formatting.width}px`
                                                            : 'auto',
                                                        maxWidth: row.formatting?.type === 'width' &&
                                                                 row.formatting?.affected_columns.includes(columnIndex)
                                                            ? `${row.formatting.width}px`
                                                            : 'auto',
                                                    }}
                                                >
                                                    {renderCell(value, row.formatting, columnIndex)}
                                                </TableCell>
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
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<DownloadIcon />}
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        Apply & Download
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <NavigationBar>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                {/* File Selection Section */}
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select File
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
                        <List>
                            {filteredFiles.map((file, index) => (
                                <React.Fragment key={file.fileName || `file-${index}`}>
                                    <ListItem sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
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

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                            >
                                Apply & Download
                            </Button>
                        </Box>
                    </Paper>
                )}

                <PreviewDialog />
            </Container>
        </NavigationBar>
    );
};

export default ApplyFormatting;