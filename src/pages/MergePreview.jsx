import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";

const MergePreview = ({ previewData, savedFile }) => {
  if (!previewData && !savedFile) return null;

  return (
    <Box sx={{ mt: 4 }}>
      {previewData && (
        <>
          <Typography variant="h6">Preview</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0] || {}).map((col) => (
                    <TableCell key={col}><strong>{col}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{value !== null ? value : "N/A"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {savedFile && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Saved File</Typography>
          <Typography>
            <strong>Name:</strong> {savedFile.name}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.open(savedFile.downloadUrl, "_blank")}
          >
            Download File
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MergePreview;
