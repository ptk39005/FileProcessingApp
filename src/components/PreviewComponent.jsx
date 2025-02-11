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
      <div key={sheetName} style={{ marginBottom: "2.5rem" }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            color: '#262730',
            fontSize: '1.25rem',
            fontWeight: 600,
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              left: -16,
              top: '50%',
              width: 4,
              height: '70%',
              backgroundColor: theme.palette.primary.main,
              transform: 'translateY(-50%)',
              borderRadius: 4
            }
          }}
        >
          {sheetName}
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: 'rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px',
            '& .MuiTable-root': {
              borderCollapse: 'separate',
              borderSpacing: '0px 4px',
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col, index) => (
                  <TableCell 
                    key={index} 
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: '#f0f2f6',
                      borderBottom: 'none',
                      color: '#262730',
                      fontSize: '0.875rem'
                    }}
                  >
                    <Tooltip title={col} arrow>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
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
                <TableRow 
                  key={rowIndex} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    },
                    '& td': {
                      borderBottom: '1px solid rgba(224, 224, 224, 0.4)',
                    }
                  }}
                >
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 300px)',
          boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(231, 235, 241, 0.8)',
          minHeight: '60vh',
          maxHeight: '85vh',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #4F46E5 100%)',
          }
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(4px)',
        },
        '& .MuiDialog-container': {
          padding: '24px',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'transparent',
          color: '#0F172A',
          textAlign: 'left',
          py: 3,
          px: 4,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography 
          variant="h5" 
          sx={{
            fontWeight: 700,
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            letterSpacing: '-0.02em',
            '& svg': {
              color: '#3B82F6',
              fontSize: '1.75rem'
            }
          }}
        >
        Data Preview
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 4,
          backgroundColor: 'transparent',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
            borderRadius: '100vh',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '100vh',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
          }
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
          backgroundColor: '#ffffff',
          py: 2.5,
          px: 4,
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Typography variant="caption" sx={{ 
          color: 'rgba(15, 23, 42, 0.6)',
          fontSize: '0.85rem'
        }}>
          Rendered at: {new Date().toLocaleString()}
        </Typography>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{
            backgroundColor: '#EF4444',
            '&:hover': {
              backgroundColor: '#DC2626',
            },
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewComponent;
