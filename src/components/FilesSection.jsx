import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  Checkbox,
  Alert,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const FilesSection = ({
  files,
  selectedFiles = [], // Parent-managed state for selected files
  onFileSelect = () => {}, // Callback to notify parent about selected files
  initialShowCount = 5,
  multiSelect = true, // Enable multi-select or single-select
  minSelection = 2, // Minimum number of files required
}) => {
  const [displayedFiles, setDisplayedFiles] = useState([]); // Files currently displayed
  const [showMoreCount, setShowMoreCount] = useState(initialShowCount);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWarning, setShowWarning] = useState(false); // Warning for insufficient selection

  useEffect(() => {
    // Filter files based on search query
    const filteredFiles = files.filter((file) =>
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedFiles(filteredFiles.slice(0, showMoreCount));
  }, [searchQuery, showMoreCount, files]);

  useEffect(() => {
    // Show or hide warning based on selection
    setShowWarning(selectedFiles.length < minSelection);
  }, [selectedFiles, minSelection]);

  const handleFileSelection = (file) => {
    let updatedSelection;

    if (multiSelect) {
      // Toggle selection for multi-select
      const isSelected = selectedFiles.some((selectedFile) => selectedFile.fileName === file.fileName);

      if (isSelected) {
        updatedSelection = selectedFiles.filter(
          (selectedFile) => selectedFile.fileName !== file.fileName
        );
      } else if (selectedFiles.length < minSelection) {
        updatedSelection = [...selectedFiles, file];
      } else {
        return; // Prevent selecting more than the required number of files
      }
    } else {
      // Replace selection for single-select
      updatedSelection = selectedFiles.some((selectedFile) => selectedFile.fileName === file.fileName)
        ? []
        : [file];
    }

    onFileSelect(updatedSelection); // Notify parent about selected files
  };

  const handleShowMore = () => {
    setShowMoreCount((prevCount) => prevCount + initialShowCount);
  };

  const handleShowLess = () => {
    setShowMoreCount(initialShowCount);
  };

  const clearSelection = () => {
    onFileSelect([]); // Reset selection via parent callback
  };

  return (
    <Box sx={{ marginTop: 4 }}>
      {/* Search Bar */}
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
          marginBottom: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f5f5f5',
            '&:hover': {
              backgroundColor: '#eeeeee',
            },
          }
        }}
      />

      {/* Warning for insufficient selection */}
      {showWarning && (
        <Alert severity="warning" sx={{ marginBottom: 2 }}>
          Please select exactly {minSelection} file{minSelection > 1 ? "s" : ""}.
        </Alert>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <Box sx={{ textAlign: "center", padding: 2 }}>
          <Typography variant="body2" color="textSecondary">
            No files available.
          </Typography>
        </Box>
      ) : displayedFiles.length > 0 ? (
        <List sx={{ backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          {files.map((file) => (
            <React.Fragment key={file.fileName}>
              <ListItem
                sx={{
                  display: "grid",
                  gridTemplateColumns: "48px minmax(200px, 1fr) 120px",
                  gap: 2,
                  padding: "8px 16px",
                  '&:hover': {
                    backgroundColor: '#eeeeee',
                  },
                }}
              >
                <Checkbox
                  checked={selectedFiles.some(
                    (selectedFile) => selectedFile.fileName === file.fileName
                  )}
                  onChange={() => handleFileSelection(file)}
                  sx={{
                    color: '#666666',
                    '&.Mui-checked': {
                      color: '#0066cc',
                    },
                  }}
                />
                <Tooltip title={file.fileName} arrow>
                  <Typography
                    variant="body1"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.fileName}
                  </Typography>
                </Tooltip>
                <Button
                  variant="outlined"
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: "8px",
                    color: "#0066cc",
                    borderColor: "#0066cc",
                    '&:hover': {
                      backgroundColor: 'rgba(0, 102, 204, 0.04)',
                      borderColor: "#0066cc",
                    },
                  }}
                >
                  Download
                </Button>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ textAlign: "center", marginTop: 2 }}
        >
          No files match your search.
        </Typography>
      )}

      {/* Show More / Show Less / Clear Selection Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          marginTop: 2,
        }}
      >
        {files.length > displayedFiles.length && (
          <Button
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#0066cc",
              borderColor: "#0066cc",
              fontSize: "14px",
              textTransform: "none",
            }}
            onClick={handleShowMore}
          >
            Show More
          </Button>
        )}
        {showMoreCount > initialShowCount && (
          <Button
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#cc3300",
              borderColor: "#cc3300",
              fontSize: "14px",
              textTransform: "none",
            }}
            onClick={handleShowLess}
          >
            Show Less
          </Button>
        )}
        {selectedFiles.length > 0 && (
          <Button
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#ff6600",
              borderColor: "#ff6600",
              fontSize: "14px",
              textTransform: "none",
            }}
            onClick={clearSelection}
          >
            Clear Selection
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default FilesSection;
