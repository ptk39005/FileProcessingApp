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

const FileUploadFlow = () => {
  const [fileDetails, setFileDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const email = localStorage.getItem('email');

  const handleUpload = async () => {
    const email = localStorage.getItem("email"); // Get user email
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
    const uploadedFiles = {}; // Object to store files with keys

    try {
        for (const fileDetail of finalizedFiles) {
            const { file } = fileDetail;

            // Step 1: Upload file to Firebase Storage
            const { fileName, fileUrl } = await uploadFileToFirebase(file);
            console.log(`File uploaded: ${fileName}, URL: ${fileUrl}`);

            // Store in an object using fileName as the key
            uploadedFiles[fileName] = { fileName, fileUrl };
        }

        console.log("✅ All Files Uploaded. Final Payload:", uploadedFiles);

        // Step 2: Notify backend after all uploads
        await notifyBackendAfterUpload(uploadedFiles, email);
        setNotifications([{ type: "success", text: "Files uploaded & processing started successfully!" }]);

    } catch (error) {
        console.error("🚨 Upload error:", error);
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
        console.log(`Uploaded ${Math.round((start / file.size) * 100)}% of ${name}`);
      }

      setNotifications([{ type: "success", text: `File ${name} uploaded successfully!` }]);
    } catch (error) {
      console.error("Upload error:", error);
      setNotifications([{ type: "error", text: "Error uploading files." }]);
    }
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ".xls,.xlsx,.csv",
  });

  return (
    <NavigationBar>
      <Container maxWidth="lg" sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: "center", mb: 4 }}>
          Google Cloud Storage File Upload
        </Typography>

        {/* Notifications */}
        {notifications.map((notification, index) => (
          <Alert key={index} severity={notification.type} sx={{ marginBottom: 2 }}>
            {notification.text}
          </Alert>
        ))}

        {/* Drag & Drop File Upload UI */}
        <Paper
          {...getRootProps()}
          elevation={3}
          sx={{
            border: "2px dashed #1976d2",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            backgroundColor: isDragActive ? "#e3f2fd" : "#f5f5f5",
            transition: "background-color 0.3s ease",
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
                sx={{ mt: 2 }}
              >
                Browse Files
              </Button>
            </>
          )}
        </Paper>

        {/* File List & Finalization */}
        {fileDetails.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" sx={{ mb: 2 }}>
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
                    }}
                  >
                    <TextField
                      label="File Name"
                      variant="outlined"
                      value={fileDetail.name}
                      onChange={(e) => handleFileNameChange(index, e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={fileDetail.finalized}
                          onChange={(e) => handleFileFinalization(index, e.target.checked)}
                        />
                      }
                      label="Finalize"
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Upload Button */}
            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={isLoading}
                sx={{ px: 4, py: 1.5 }}
              >
                Upload to Google Cloud Storage
              </Button>
            </Box>
          </Box>
        )}

        {/* Loading Indicator */}
        {isLoading && <LinearProgress sx={{ marginTop: 2 }} />}
      </Container>
    </NavigationBar>
  );
};

export default FileUploadFlow;
