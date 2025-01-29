import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tooltip,
  useTheme,
} from "@mui/material";

const PreviewComponent = ({ previewData, open, onClose }) => {
  const theme = useTheme();

  // Helper function to render a table
  const renderTable = (sheet) => {
    const { rows, columns, sheetName } = sheet;

    if (!rows || !columns) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center">
          No data available for {sheetName}.
        </Typography>
      );
    }

    return (
      <div key={sheetName} style={{ marginBottom: "2rem" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {sheetName}
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 400,
            borderRadius: 1,
            boxShadow: theme.shadows[1],
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: "bold" }}>
                    <Tooltip title={col} arrow>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {col}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      <Tooltip title={String(row[col] || "-")} arrow>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row[col] !== undefined && row[col] !== null
                            ? row[col].toString()
                            : "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: "white",
          textAlign: "center",
          py: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold" component="div">
          📊 Data Preview
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.default,
        }}
      >
        {Array.isArray(previewData) && previewData.length > 0 ? (
          previewData.map((sheet) => renderTable(sheet))
        ) : (
          <Typography variant="body2" color="textSecondary" textAlign="center">
            No preview data available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: theme.palette.grey[200],
          py: 1,
          px: 3,
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" sx={{ color: theme.palette.grey[600] }}>
          Rendered at: {new Date().toLocaleString()}
        </Typography>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewComponent;
