import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { fetchUserProfile, getUserFiles } from '../services/api';
import NavigationBar from '../components/NavigationBar';
const Profile = () => {
  const [user, setUser] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [displayedFiles, setDisplayedFiles] = useState([]); // Files currently displayed
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoreCount, setShowMoreCount] = useState(5); // Number of files to show initially and increment

  // Fetch user profile and upload history
  const fetchData = async () => {
    setLoading(true);
    try {
      const userProfile = await fetchUserProfile();
      setUser(userProfile);

      const files = await getUserFiles();
      setUploadHistory(files.files || []);
      setDisplayedFiles(files.files.slice(0, showMoreCount)); // Show initial set of files
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update displayed files when showMoreCount changes
    setDisplayedFiles(uploadHistory.slice(0, showMoreCount));
  }, [showMoreCount, uploadHistory]);

  const handleShowMore = () => {
    // Increase the number of files to display
    setShowMoreCount((prevCount) => prevCount + 5);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ marginTop: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <NavigationBar>
    <Container
      maxWidth="md"
      sx={{
        marginTop: 4,
        bgcolor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Profile Section */}
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <Avatar
          sx={{
            width: 120,
            height: 120,
            margin: '0 auto 16px',
            bgcolor: user.avatarUrl ? 'transparent' : '#B82132',
            borderRadius: '12px',
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '12px',
              }}
            />
          ) : (
            <AccountCircleIcon sx={{ fontSize: 100, color: '#ffffff' }} />
          )}
        </Avatar>

        <Typography variant="h4" sx={{ color: '#2C3E50', fontWeight: 700 }}>
          {user.name || 'N/A'}
        </Typography>
        <Typography
          variant="subtitle1"
          color="textSecondary"
          sx={{ marginBottom: 1 }}
        >
          {user.company || 'No Company Info'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {user.email}
        </Typography>
      </Box>

      {/* Upload History Section */}
      <Card
        sx={{
          marginTop: 4,
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#2C3E50',
              marginBottom: 2,
            }}
          >
            Files History
          </Typography>

          {uploadHistory.length > 0 ? (
            <List>
              {displayedFiles.map((file, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, color: '#333333' }}
                      >
                        {file.fileName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontSize: '12px' }}
                      >
                        Type: {file.fileType || 'N/A'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontSize: '12px' }}
                      >
                        Uploaded on:{' '}
                        {file.uploadTime
                          ? new Date(file.uploadTime).toLocaleString()
                          : 'Unknown Date'}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#B82132',
                        borderColor: '#B82132',
                        borderRadius: '8px',
                        padding: '5px 15px',
                        fontSize: '12px',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#8E1A28',
                          color: '#8E1A28',
                        },
                      }}
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
          ) : (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ textAlign: 'center', marginTop: 2 }}
            >
              No upload history available.
            </Typography>
          )}

          {uploadHistory.length > displayedFiles.length && (
            <Button
              variant="outlined"
              sx={{
                marginTop: 2,
                borderRadius: '8px',
                color: '#B82132',
                borderColor: '#B82132',
                fontSize: '14px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#8E1A28',
                  color: '#8E1A28',
                },
              }}
              onClick={handleShowMore}
            >
              Show More
            </Button>
          )}
        </CardContent>
      </Card>
    </Container>
    </NavigationBar>

  );
};

export default Profile;
