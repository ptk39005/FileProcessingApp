import React, { useState } from "react";
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
import { uploadFiles } from "../services/api";
import NavigationBar from "../components/NavigationBar";

const FileUploadFlow = () => {
  const [fileDetails, setFileDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      name: file.name,
      finalized: false,
    }));
    setFileDetails((prev) => [...prev, ...newFiles]);
  };

  const handleFileNameChange = (index, newName) => {
    setFileDetails((prev) =>
      prev.map((fileDetail, i) =>
        i === index ? { ...fileDetail, name: newName } : fileDetail
      )
    );
  };

  const handleFileFinalization = (index, finalized) => {
    setFileDetails((prev) =>
      prev.map((fileDetail, i) =>
        i === index ? { ...fileDetail, finalized } : fileDetail
      )
    );
  };

  const handleUpload = async () => {
    const finalizedFiles = fileDetails.filter((file) => file.finalized);

    if (finalizedFiles.length === 0) {
      setNotifications([
        { type: "error", text: "Please finalize at least one file for upload." },
      ]);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    finalizedFiles.forEach((fileDetail) => {
      formData.append("files", fileDetail.file, fileDetail.name); // Use renamed file names
    });

    try {
      const response = await uploadFiles(formData);
      if (response.success) {
        setNotifications([
          { type: "success", text: "Files uploaded successfully!" },
        ]);
        setFileDetails([]);
      } else {
        setNotifications([
          { type: "error", text: "Error uploading files. Please try again." },
        ]);
      }
    } catch (error) {
      setNotifications([{ type: "error", text: "Error uploading files." }]);
    } finally {
      setIsLoading(false);
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
          Enhanced File Upload Flow
        </Typography>

        {notifications.map((notification, index) => (
          <Alert key={index} severity={notification.type} sx={{ marginBottom: 2 }}>
            {notification.text}
          </Alert>
        ))}

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
                          onChange={(e) =>
                            handleFileFinalization(index, e.target.checked)
                          }
                        />
                      }
                      label="Finalize"
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={isLoading}
                sx={{ px: 4, py: 1.5 }}
              >
                Upload Finalized Files
              </Button>
            </Box>
          </Box>
        )}

        {isLoading && <LinearProgress sx={{ marginTop: 2 }} />}
      </Container>
    </NavigationBar>
  );
};

export default FileUploadFlow;
