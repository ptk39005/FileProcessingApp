import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  Checkbox,
  Divider,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { getFileColumns, performFileOperations, previewFileOperations, getUserFiles, getFileDetails } from "../services/api";
import NavigationBar from "../components/NavigationBar";
import PreviewComponent from "../components/PreviewComponent";

const FileOperations = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const [replaceConfig, setReplaceConfig] = useState({
    selectedColumns: [],
    oldValue: "",
    newValue: "",
  });

  const [renameConfigs, setRenameConfigs] = useState([
    { column: "", newName: "" },
  ]);

  const [reorderConfigs, setReorderConfigs] = useState([
    { column: "", positions: 0 },
  ]);

  const [previewData, setPreviewData] = useState(null);

  const [fileDetails, setFileDetails] = useState({});

  const [customFileName, setCustomFileName] = useState("");

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

  useEffect(() => {
    fetchColumns();
  }, [selectedFile]);

  useEffect(() => {
    const fetchFileDetails = async () => {
      if (selectedFile?.fileName) {
        setIsLoading(true);
        try {
          const response = await getFileDetails(selectedFile.fileName);
          setFileDetails(prev => ({
            ...prev,
            [selectedFile.fileName]: response.fileType === "Excel" 
              ? response?.sheets || {}
              : { CSV: { columns: response.columns || [] } }
          }));
        } catch (error) {
          enqueueSnackbar("Failed to fetch file details", { variant: "error" });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFileDetails();
  }, [selectedFile?.fileName]);

  const fetchColumns = async () => {
    if (!selectedFile?.fileName) return;
    
    setIsLoading(true);
    try {
      const response = await getFileDetails(selectedFile.fileName);
      const fileColumns = response.fileType === "Excel" 
        ? response?.sheets?.[selectedFile.sheetName]?.columns || []
        : response.columns || [];
      
      setColumns(fileColumns);
    } catch (error) {
      enqueueSnackbar("Failed to fetch columns", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(prev => prev?.fileName === file.fileName ? null : file);
  };

  const handleSheetSelection = (fileName, sheetName) => {
    setSelectedFile(prev => prev?.fileName === fileName 
      ? { ...prev, sheetName }
      : prev
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile?.fileName) {
      enqueueSnackbar("Please select a file first", { variant: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const operationType = ["replace", "rename", "reorder"][activeTab];
      const config = {
        file_name: selectedFile.fileName,
        sheet_name: selectedFile.sheetName,
        operation: operationType,
        data: activeTab === 0 
          ? replaceConfig 
          : activeTab === 1 
            ? { columns: renameConfigs }
            : { columns: reorderConfigs },
        replace_existing: true,
        custom_file_name: customFileName.trim() || undefined
      };

      const response = await performFileOperations(config);
      if (response.success) {
        enqueueSnackbar("Operation completed successfully", { variant: "success" });
        fetchColumns();
        setCustomFileName("");
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Operation failed", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile?.fileName) {
      enqueueSnackbar("Please select a file first", { variant: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const operationType = ["replace", "rename", "reorder"][activeTab];
      const config = {
        file_name: selectedFile.fileName,
        sheet_name: selectedFile.sheetName,
        operation: operationType,
        data: activeTab === 0 
          ? replaceConfig 
          : activeTab === 1 
            ? { columns: renameConfigs }
            : { columns: reorderConfigs }
      };

      const response = await previewFileOperations(config);
      if (response?.success && response?.data) {
        setPreviewData([{
          sheetName: selectedFile.sheetName || 'Preview',
          rows: response.data.rows || [],
          columns: response.data.columns || []
        }]);
        enqueueSnackbar("Preview generated successfully", { variant: "success" });
      }
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to generate preview", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewData(null);
  };

  const renderFileSelection = () => (
    <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select File
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
        {files
          .filter(file => file.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((file, index) => (
            <React.Fragment key={`${file.fileName}-${index}`}>
              <ListItem>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Checkbox
                    checked={selectedFile?.fileName === file.fileName}
                    onChange={() => handleFileSelection(file)}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography>{file.fileName}</Typography>
                    {selectedFile?.fileName === file.fileName && (
                      <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Select Sheet</InputLabel>
                        <Select
                          value={selectedFile.sheetName || ""}
                          onChange={(e) => handleSheetSelection(file.fileName, e.target.value)}
                          size="small"
                        >
                          {Object.keys(fileDetails[file.fileName] || {}).map((sheet, sheetIndex) => (
                            <MenuItem key={`${sheet}-${sheetIndex}`} value={sheet}>
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

  const renderReplaceValues = () => (
    <Box sx={{ p: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Columns</InputLabel>
        <Select
          multiple
          value={replaceConfig.selectedColumns}
          onChange={(e) => setReplaceConfig(prev => ({
            ...prev,
            selectedColumns: e.target.value
          }))}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          <MenuItem value="All">All Columns</MenuItem>
          {columns.map((column) => (
            <MenuItem key={column} value={column}>{column}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Value to Replace"
        value={replaceConfig.oldValue}
        onChange={(e) => setReplaceConfig(prev => ({
          ...prev,
          oldValue: e.target.value
        }))}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="New Value"
        value={replaceConfig.newValue}
        onChange={(e) => setReplaceConfig(prev => ({
          ...prev,
          newValue: e.target.value
        }))}
      />
    </Box>
  );

  const renderRenameColumns = () => (
    <Box sx={{ p: 2 }}>
      {renameConfigs.map((config, index) => (
        <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Column</InputLabel>
            <Select
              value={config.column}
              onChange={(e) => {
                const newConfigs = [...renameConfigs];
                newConfigs[index].column = e.target.value;
                setRenameConfigs(newConfigs);
              }}
            >
              {columns.map((column) => (
                <MenuItem key={column} value={column}>{column}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="New Name"
            value={config.newName}
            onChange={(e) => {
              const newConfigs = [...renameConfigs];
              newConfigs[index].newName = e.target.value;
              setRenameConfigs(newConfigs);
            }}
          />

          <IconButton 
            onClick={() => setRenameConfigs(prev => prev.filter((_, i) => i !== index))}
            disabled={renameConfigs.length === 1}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={() => setRenameConfigs(prev => [...prev, { column: "", newName: "" }])}
      >
        Add Column
      </Button>
    </Box>
  );

  const renderReorderColumns = () => (
    <Box sx={{ p: 2 }}>
      {reorderConfigs.map((config, index) => (
        <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Column</InputLabel>
            <Select
              value={config.column}
              onChange={(e) => {
                const newConfigs = [...reorderConfigs];
                newConfigs[index].column = e.target.value;
                setReorderConfigs(newConfigs);
              }}
            >
              {columns.map((column) => (
                <MenuItem key={column} value={column}>{column}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Positions to Move"
            value={config.positions}
            onChange={(e) => {
              const newConfigs = [...reorderConfigs];
              newConfigs[index].positions = parseInt(e.target.value);
              setReorderConfigs(newConfigs);
            }}
          />

          <IconButton 
            onClick={() => setReorderConfigs(prev => prev.filter((_, i) => i !== index))}
            disabled={reorderConfigs.length === 1}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={() => setReorderConfigs(prev => [...prev, { column: "", positions: 0 }])}
      >
        Add Column
      </Button>
    </Box>
  );

  const renderCustomFileName = () => (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <TextField
        fullWidth
        label="Custom File Name (optional)"
        value={customFileName}
        onChange={(e) => setCustomFileName(e.target.value)}
        placeholder="Leave empty to use default naming pattern"
        helperText="If left empty, the file will be saved as: originalName_operation_YYYYMM"
        sx={{ mb: 2 }}
      />
    </Box>
  );

  const isSubmitDisabled = () => {
    if (!selectedFile?.fileName) return true;
    if (isLoading) return true;

    switch (activeTab) {
      case 0: // Replace
        return !replaceConfig.selectedColumns.length || 
               replaceConfig.oldValue === "" || 
               replaceConfig.newValue === "";
      case 1: // Rename
        return !renameConfigs.some(config => config.column && config.newName);
      case 2: // Reorder
        return !reorderConfigs.some(config => config.column && config.positions !== 0);
      default:
        return true;
    }
  };

  return (
    <NavigationBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: "center", mb: 4 }}>
          File Operations
        </Typography>

        {renderFileSelection()}

        <Paper elevation={3}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            centered
          >
            <Tab label="Replace Values" />
            <Tab label="Rename Columns" />
            <Tab label="Reorder Columns" />
          </Tabs>

          {activeTab === 0 && renderReplaceValues()}
          {activeTab === 1 && renderRenameColumns()}
          {activeTab === 2 && renderReorderColumns()}

          {renderCustomFileName()}

          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={isSubmitDisabled()}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
            >
              {isLoading ? <CircularProgress size={24} /> : "Submit"}
            </Button>
          </Box>
        </Paper>

        {previewData && (
          <PreviewComponent
            previewData={previewData}
            open={!!previewData}
            onClose={handleClosePreview}
          />
        )}
      </Container>
    </NavigationBar>
  );
};

export default FileOperations; 