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
    Paper,
    List,
    ListItem,
    Divider,
    Checkbox,
    Tooltip,
    InputAdornment,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Chip,
} from "@mui/material";
import { getUserFiles, getFileDetails } from "../services/api";
import { useSnackbar } from "notistack";
import SearchIcon from "@mui/icons-material/Search";
import NavigationBar from "../components/NavigationBar";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import { previewVisualization, saveVisualization, loadVisualization } from "../services/api";
//import ChartPreview from "../components/ChartPreview";

const Visualization = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDetails, setFileDetails] = useState({});
    const [selectedSheet, setSelectedSheet] = useState("");
    const [columns, setColumns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visualizationType, setVisualizationType] = useState('line-bar');
    const { enqueueSnackbar } = useSnackbar();
    const [chartTitle, setChartTitle] = useState('');
    const [xAxis, setXAxis] = useState('');
    const [series, setSeries] = useState([]);
    const [barType, setBarType] = useState('stacked');
    const [chartType, setChartType] = useState('donut');
    const [labels, setLabels] = useState('');
    const [values, setValues] = useState('');
    const [largestItems, setLargestItems] = useState(1);
    const [colorTheme, setColorTheme] = useState('Blue-Grey');
    const [previewData, setPreviewData] = useState(null);
    const [streamlitUrl, setStreamlitUrl] = useState(null);

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
                    const details = await getFileDetails(selectedFile.fileName);

                    // Handle both Excel and CSV files
                    if (details.fileType === "Excel") {
                        setFileDetails(details?.sheets || {});
                        // Select first sheet by default
                        const firstSheet = Object.keys(details?.sheets || {})[0];
                        setSelectedSheet(firstSheet);
                        setColumns(details?.sheets[firstSheet]?.columns || []);
                    } else if (details.fileType === "CSV") {
                        const csvSheet = {
                            CSV: {
                                columnTypes: details.columnTypes,
                                columns: details.columns,
                            },
                        };
                        setFileDetails(csvSheet);
                        setSelectedSheet("CSV");
                        setColumns(details.columns || []);
                    }

                    addNotification("success", "File details loaded successfully");
                } catch (error) {
                    console.error("Error fetching file details:", error);
                    addNotification("error", error.message || "Failed to fetch file details");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchFileDetails();
        } else {
            setFileDetails({});
            setSelectedSheet("");
            setColumns([]);
        }
    }, [selectedFile, addNotification]);

    useEffect(() => {
        if (selectedSheet) {
            const sheetData = fileDetails[selectedSheet];
            setColumns(sheetData?.columns || []);
        }
    }, [selectedSheet]);

    const handleFileSelection = (file) => {
        setSelectedFile(file);
        addNotification("success", "File selected successfully");
    };

    const filteredFiles = files.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateNew = () => {
        setChartTitle('');
        setXAxis('');
        setSeries([]);
        setBarType('stacked');
        setChartType('donut');
        setLabels('');
        setValues('');
        setLargestItems(1);
        setColorTheme('Blue-Grey');
    };

    const handleSave = async () => {
        if (visualizationType === 'donut-pie') {
            if (!chartTitle || !labels || !values) {
                addNotification('error', 'Please fill in all required fields');
                return;
            }
        } else {
            if (!chartTitle || !xAxis || series.some(s => !s.column)) {
                addNotification('error', 'Please fill in all required fields');
                return;
            }
        }
        
        try {
            const data = {
                fileName: selectedFile.fileName,
                visualizationConfig: {
                    type: visualizationType,
                    title: chartTitle,
                    xAxis,
                    series,
                    barType,
                    labels,
                    values,
                    chartType,
                    largestItems,
                    colorTheme
                }
            };

            await saveVisualization(data);
            addNotification('success', 'Visualization saved successfully');
            handlePreview();
        } catch (error) {
            addNotification('error', error.message);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile || !selectedSheet) {
            addNotification('error', 'Please select a file and sheet');
            return;
        }
    
        let mappedVisualizationType;
        switch (visualizationType) {
            case 'line-bar':
                mappedVisualizationType = "Line / Vertical Bars / Stacked Vertical Bars / Combination";
                break;
            case 'horizontal-bar':
                mappedVisualizationType = "Horizontal Bars / Stacked Horizontal Bars";
                break;
            case 'donut-pie':
                mappedVisualizationType = "Donut / Pie";
                break;
            default:
                addNotification('error', 'Invalid visualization type');
                return;
        }
    
        try {
            setIsLoading(true);
            const visualizationConfig = mappedVisualizationType === "Donut / Pie" 
                ? {
                    type: mappedVisualizationType,
                    title: chartTitle,
                    labels,
                    values,
                    chartType,
                    largestItems: parseInt(largestItems) || 1,
                    colorTheme
                }
                : {
                    type: mappedVisualizationType,
                    title: chartTitle,
                    xAxis,
                    series: series.map(s => ({
                        column: s.column,
                        type: s.type || 'Bar',
                        axis: s.axis || 'Left',
                        color: s.color || '#000000'
                    })),
                    barType: barType || 'side-by-side'
                };
    
            const data = {
                fileName: selectedFile.fileName,
                sheet: selectedSheet,
                visualizationConfig
            };
    
            const userEmail = localStorage.getItem('userEmail');
            const response = await previewVisualization(data, userEmail);
            
            if (response.success && response.streamlit_url) {
                setStreamlitUrl(response.streamlit_url);
                window.open(response.streamlit_url, '_blank');
                addNotification('success', 'Preview generated successfully');
            } else {
                throw new Error('Failed to generate preview');
            }
        } catch (error) {
            console.error('Preview error:', error);
            addNotification('error', error.message || 'Failed to generate preview');
        } finally {
            setIsLoading(false);
        }
    };
   
    

    const renderPreviewButton = () => {
        if (streamlitUrl) {
            return (
                <Box sx={{ mt: 3 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => window.open(streamlitUrl, '_blank')}
                    >
                        View Preview
                    </Button>
                </Box>
            );
        }
        return null;
    };

    const handleRemoveSeries = (indexToRemove) => {
        if (series.length > 1) {
            setSeries(series.filter((_, index) => index !== indexToRemove));
        }
    };

    const renderVisualizationOptions = () => {
        if (!selectedSheet) return null;

        return (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Visualization Options
                </Typography>

                <RadioGroup
                    value={visualizationType}
                    onChange={(e) => {
                        setVisualizationType(e.target.value);
                        // Reset series when changing visualization type
                        setSeries([]);
                    }}
                    sx={{ mb: 3 }}
                >
                    <FormControlLabel 
                        value="line-bar" 
                        control={<Radio />} 
                        label="Line / Vertical Bars / Stacked Vertical Bars / Combination" 
                    />
                    <FormControlLabel 
                        value="horizontal-bar" 
                        control={<Radio />} 
                        label="Horizontal Bars / Stacked Horizontal Bars" 
                    />
                    <FormControlLabel 
                        value="donut-pie" 
                        control={<Radio />} 
                        label="Donut / Pie" 
                    />
                </RadioGroup>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <TextField
                            required
                            fullWidth
                            label="Chart Title"
                            value={chartTitle}
                            onChange={(e) => setChartTitle(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        {visualizationType === 'donut-pie' ? (
                            <>
                                <RadioGroup
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    sx={{ mb: 2 }}
                                >
                                    <FormControlLabel value="donut" control={<Radio />} label="Donut" />
                                    <FormControlLabel value="pie" control={<Radio />} label="Pie" />
                                </RadioGroup>

                                <FormControl required fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Labels</InputLabel>
                                    <Select
                                        value={labels}
                                        onChange={(e) => setLabels(e.target.value)}
                                    >
                                        {columns.map((col) => (
                                            <MenuItem key={col} value={col}>{col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl required fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Values</InputLabel>
                                    <Select
                                        value={values}
                                        onChange={(e) => setValues(e.target.value)}
                                    >
                                        {columns
                                            .filter(col => col !== labels)
                                            .map((col) => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    type="number"
                                    fullWidth
                                    label="Number of Largest Items to Show"
                                    value={largestItems}
                                    onChange={(e) => setLargestItems(Math.max(1, parseInt(e.target.value)))}
                                    inputProps={{ min: 1 }}
                                    sx={{ mb: 2 }}
                                />

                                <FormControl required fullWidth>
                                    <InputLabel>Color Theme</InputLabel>
                                    <Select
                                        value={colorTheme}
                                        onChange={(e) => setColorTheme(e.target.value)}
                                    >
                                        <MenuItem value="Blue-Grey">Blue-Grey</MenuItem>
                                        <MenuItem value="Yellow-Green">Yellow-Green</MenuItem>
                                        <MenuItem value="Red-Orange">Red-Orange</MenuItem>
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <>
                                <FormControl required fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>X Axis</InputLabel>
                                    <Select
                                        value={xAxis}
                                        onChange={(e) => setXAxis(e.target.value)}
                                    >
                                        {columns.map((col) => (
                                            <MenuItem key={col} value={col}>{col}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {series.map((item, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2 }} alignItems="center">
                                        <Grid item xs={visualizationType === 'line-bar' ? 3 : 6}>
                                            <FormControl required fullWidth>
                                                <InputLabel>Series {index + 1}</InputLabel>
                                                <Select
                                                    value={item.column}
                                                    onChange={(e) => {
                                                        const newSeries = [...series];
                                                        newSeries[index] = {
                                                            ...newSeries[index],
                                                            column: e.target.value
                                                        };
                                                        setSeries(newSeries);
                                                    }}
                                                >
                                                    {columns.map((col) => (
                                                        <MenuItem key={col} value={col}>{col}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {visualizationType === 'line-bar' && (
                                            <>
                                                <Grid item xs={3}>
                                                    <FormControl required fullWidth>
                                                        <InputLabel>Type</InputLabel>
                                                        <Select
                                                            value={item.type || 'Line'}
                                                            onChange={(e) => {
                                                                const newSeries = [...series];
                                                                newSeries[index] = {
                                                                    ...newSeries[index],
                                                                    type: e.target.value
                                                                };
                                                                setSeries(newSeries);
                                                            }}
                                                        >
                                                            <MenuItem value="Line">Line</MenuItem>
                                                            <MenuItem value="Bar">Bar</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <FormControl required fullWidth>
                                                        <InputLabel>Axis</InputLabel>
                                                        <Select
                                                            value={item.axis || 'Left'}
                                                            onChange={(e) => {
                                                                const newSeries = [...series];
                                                                newSeries[index] = {
                                                                    ...newSeries[index],
                                                                    axis: e.target.value
                                                                };
                                                                setSeries(newSeries);
                                                            }}
                                                        >
                                                            <MenuItem value="Left">Left</MenuItem>
                                                            <MenuItem value="Right">Right</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                            </>
                                        )}

                                        <Grid item xs={2}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Color (Hex)"
                                                value={item.color || ''}
                                                onChange={(e) => {
                                                    const newSeries = [...series];
                                                    newSeries[index] = {
                                                        ...newSeries[index],
                                                        color: e.target.value
                                                    };
                                                    setSeries(newSeries);
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={1}>
                                            <Tooltip title={series.length <= 1 ? "Cannot remove last series" : "Remove series"}>
                                                <span>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleRemoveSeries(index)}
                                                        disabled={series.length <= 1}
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                ))}

                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setSeries([...series, { 
                                        column: '', 
                                        type: visualizationType === 'line-bar' ? 'Line' : 'Bar', 
                                        axis: 'Left', 
                                        color: '#000000' 
                                    }])}
                                >
                                    Add Series
                                </Button>

                                {series.some(item => item.type === 'Bar') && (
                                    <RadioGroup
                                        value={barType}
                                        onChange={(e) => setBarType(e.target.value)}
                                        sx={{ mt: 2 }}
                                    >
                                        <FormControlLabel value="stacked" control={<Radio />} label="Stacked Bars" />
                                        <FormControlLabel value="side-by-side" control={<Radio />} label="Side-by-Side Bars" />
                                    </RadioGroup>
                                )}
                            </>
                        )}
                    </CardContent>
                    <CardActions>
                    <Button 
                        variant="contained"
                        color="secondary"
                        onClick={handlePreview}
                    >
                        Preview
                    </Button>
                    <Button 
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleCreateNew}
                    >
                        Create New Visualization
                    </Button>
                    {streamlitUrl && (
        <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.open(streamlitUrl, '_blank')}
        >
            View Preview
        </Button>
    )}
                </CardActions>
                </Card>
                
            </Paper>

            
        );
    };

    return (
        <NavigationBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* File Selection Section */}
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select File for Visualization
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Please select a file to create visualizations.
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
                            Sheet Selection
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Select a sheet from the file to create visualizations.
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Sheet</InputLabel>
                            <Select 
                                value={selectedSheet} 
                                onChange={(e) => {
                                    setSelectedSheet(e.target.value);
                                    // Update columns when sheet changes
                                    const sheetData = fileDetails[e.target.value];
                                    setColumns(sheetData?.columns || []);
                                }}
                            >
                                {Object.keys(fileDetails).map((sheet) => (
                                    <MenuItem key={sheet} value={sheet}>
                                        {sheet}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedSheet && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Available Columns: {columns.length}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {columns.map((column) => (
                                        <Chip 
                                            key={column} 
                                            label={column} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Paper>
                )}

                {renderVisualizationOptions()}
            </Container>
        </NavigationBar>
    );
};

export default Visualization; 