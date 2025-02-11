import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  Grid,
  Paper,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import NavigationBar from "../components/NavigationBar";
import { uploadFileToFirebase, notifyBackendAfterUpload } from "../services/api";

// Updated theme constants to match NavigationBar
const THEME_COLORS = {
  primary: "#2C3E50",      // Dark blue from navbar
  secondary: "#B82132",    // Brand red
  background: "#ffffff",   // Clean white
  secondaryBackground: "rgba(44, 62, 80, 0.04)", // Light blue-grey
  text: "#2C3E50",        // Dark blue text
  hover: "rgba(184, 33, 50, 0.08)" // Light red hover effect
};

const FileUploadFlow = () => {
  const [fileDetails, setFileDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({}); // Track individual file upload status
  const [notifications, setNotifications] = useState([]);

  const email = localStorage.getItem('email');

  const theme = THEME_COLORS;

  const handleUpload = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      setNotifications([{ type: "error", text: "User email not found. Please log in." }]);
      return;
    }

    const finalizedFiles = fileDetails.filter((file) => file.finalized);
    if (finalizedFiles.length === 0) {
      setNotifications([{ type: "error", text: "Please finalize at least one file for upload." }]);
      return;
    }

    setIsLoading(true);
    const uploadedFiles = {};

    try {
      for (const fileDetail of finalizedFiles) {
        const { file, name } = fileDetail;
        setUploadingFiles(prev => ({ ...prev, [name]: true }));

        // Step 1: Upload file to Firebase Storage
        const { fileName, fileUrl } = await uploadFileToFirebase(file);
        
        // Store in an object using fileName as the key
        uploadedFiles[fileName] = { fileName, fileUrl };
        
        setUploadingFiles(prev => ({ ...prev, [name]: false }));
        setNotifications(prev => [...prev, { 
          type: "success", 
          text: `${fileName} uploaded successfully!` 
        }]);
      }

      // Step 2: Notify backend after all uploads
      await notifyBackendAfterUpload(uploadedFiles, email);
      setNotifications(prev => [...prev, { 
        type: "info", 
        text: "All files are being processed. Please wait 2 minutes before performing any operations." 
      }]);

      // Clear the file details after successful upload
      setFileDetails([]);
      setUploadingFiles({});

    } catch (error) {
      console.error("Upload error:", error);
      setNotifications([{ type: "error", text: error.message || "Error uploading files." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle File Selection
  const handleDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      name: file.name,
      finalized: false,
    }));
    setFileDetails((prev) => [...prev, ...newFiles]);
  };

  // Update File Name
  const handleFileNameChange = (index, newName) => {
    setFileDetails((prev) =>
      prev.map((fileDetail, i) =>
        i === index ? { ...fileDetail, name: newName } : fileDetail
      )
    );
  };

  // Toggle File Finalization
  const handleFileFinalization = (index, finalized) => {
    setFileDetails((prev) =>
      prev.map((fileDetail, i) =>
        i === index ? { ...fileDetail, finalized } : fileDetail
      )
    );
  };

  // Upload Large File in 5MB Chunks
  const uploadLargeFile = async (file, name) => {
    try {
      // Step 1: Request a Resumable Upload URL from Flask API
      const { data } = await axios.post("/api/gcs_resumable_url", {
        fileName: name,
        fileType: file.type,
      });

      if (!data.uploadUrl) {
        throw new Error("Failed to get resumable upload URL");
      }

      const uploadUrl = data.uploadUrl;
      const chunkSize = 5 * 1024 * 1024; // 5MB chunk size
      let start = 0;

      while (start < file.size) {
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // Step 2: Upload the Chunk
        const response = await fetch(uploadUrl, {
          method: "PUT",
          body: chunk,
          headers: {
            "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
            "Content-Type": file.type,
          },
        });

        if (!response.ok && response.status !== 308) {
          throw new Error(`Upload failed for ${name}`);
        }

        start = end;
      }

      setNotifications([{ type: "success", text: `File ${name} uploaded successfully!` }]);
    } catch (error) {
      console.error("Upload error:", error);
      setNotifications([{ type: "error", text: "Error uploading files." }]);
    }
  };


  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDropRejected: (fileRejections) => {
      setNotifications([{ 
        type: "error", 
        text: "Only CSV and Excel files (*.csv, *.xls, *.xlsx) are allowed." 
      }]);
    }
  });

  return (
    <NavigationBar>
      <Container 
        maxWidth="lg" 
        sx={{ 
          padding: 4,
          backgroundColor: theme.background,
          color: theme.text,
          minHeight: '100vh'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              textAlign: "center", 
              color: theme.text,
              fontWeight: 600,
              borderBottom: `3px solid ${theme.secondary}`,
              display: 'inline-block',
              paddingBottom: '8px'
            }}
          >
            Upload Files
          </Typography>
        </Box>

        {/* Notifications */}
        {notifications.map((notification, index) => (
          <Alert key={index} severity={notification.type} sx={{ marginBottom: 2 }}>
            {notification.text}
          </Alert>
        ))}

        {/* Updated Paper styles for drag & drop */}
        <Paper
          {...getRootProps()}
          elevation={3}
          sx={{
            border: `2px dashed ${theme.secondary}`,
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            backgroundColor: isDragActive ? 
              theme.secondaryBackground : 
              theme.background,
            transition: "all 0.3s ease",
            color: theme.text,
            '&:hover': {
              backgroundColor: theme.hover
            }
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography variant="h6" color="primary">
              Drop your files here!
            </Typography>
          ) : (
            <>
              <Typography variant="h6" color="textSecondary">
                Drag & Drop your files here
              </Typography>
              <Typography variant="body2" color="textSecondary">
                or click to browse your files
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  mt: 2,
                  backgroundColor: theme.secondary,
                  '&:hover': {
                    backgroundColor: '#961a28' // Darker red on hover
                  }
                }}
              >
                Select Files
              </Button>
            </>
          )}
        </Paper>

        {/* File List & Finalization */}
        {fileDetails.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.text }}>
              Selected Files
            </Typography>
            <Grid container spacing={2}>
              {fileDetails.map((fileDetail, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      backgroundColor: theme.background,
                      border: `1px solid rgba(0, 0, 0, 0.08)`,
                      color: theme.text,
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <TextField
                      label="File Name"
                      variant="outlined"
                      value={fileDetail.name}
                      onChange={(e) => handleFileNameChange(index, e.target.value)}
                      fullWidth
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: theme.text,
                          '& fieldset': {
                            borderColor: theme.text + '40',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: theme.text + '99',
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={fileDetail.finalized}
                          onChange={(e) => handleFileFinalization(index, e.target.checked)}
                          sx={{
                            color: theme.primary,
                            '&.Mui-checked': {
                              color: theme.primary,
                            },
                          }}
                        />
                      }
                      label="Finalize"
                      sx={{ color: theme.text }}
                    />
                    {uploadingFiles[fileDetail.name] && (
                      <LinearProgress 
                        sx={{ 
                          width: '100%', 
                          mt: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.primary
                          }
                        }} 
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Updated Upload Button */}
            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={isLoading}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  backgroundColor: theme.secondary,
                  '&:hover': {
                    backgroundColor: '#961a28'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(184, 33, 50, 0.5)'
                  }
                }}
              >
                Upload Files
              </Button>
            </Box>
          </Box>
        )}

        {/* Updated Progress Bar */}
        {isLoading && (
          <LinearProgress 
            sx={{ 
              marginTop: 2,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.secondary
              }
            }} 
          />
        )}
      </Container>
    </NavigationBar>
  );
};

export default FileUploadFlow;
