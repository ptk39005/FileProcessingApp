import axios from 'axios';
import { storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// Create an Axios instance with base URL and common configurations
const API = axios.create({
   baseURL: 'https://backend-env.eba-sgvmg8bp.ap-south-1.elasticbeanstalk.com/',
  //baseURL : "http://127.0.0.1:5000",
    headers: {
        'Content-Type': 'application/json',
    },
   // withCredentials: true,
});

// Add a request interceptor to include token and email in the headers
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (email) {
            config.headers['X-User-Email'] = email;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Generalized Error Handler
const handleApiError = (error, action) => {
    let errorMessage = `An error occurred during ${action}.`;

    if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
        errorMessage = `No response received from server during ${action}.`;
    } else {
        errorMessage = error.message;
    }

    console.error(`${action} error:`, errorMessage);
    throw new Error(errorMessage);
};

// API Functions

/**
 * Login API
 * @param {Object} data - Login payload (email, password)
 * @returns {Object} Response data
 */
export const login = async (data) => {
    try {
        const response = await API.post('/api/login/', data);

        // Save the token and email in localStorage upon successful login
        if (response.data?.token && response.data?.email) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('email', response.data.email);
        }

        return response.data;
    } catch (error) {
        handleApiError(error, 'Login');
    }
};

/**
 * Logout API
 * Logs the user out by blacklisting the current token and clearing localStorage.
 * @returns {Object} Response data
 */
export const logout = async () => {
  try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
          throw new Error('No token found. User is not logged in.');
      }

      // Call the logout API
      const response = await API.post('/api/login/logout/', {}, {
          headers: {
              Authorization: `Bearer ${token}`,
          },
      });

      // Clear the token and email from localStorage on successful logout
      localStorage.removeItem('token');
      localStorage.removeItem('email');

      return response.data;
  } catch (error) {
      handleApiError(error, 'Logout');
  }
};


/**
 * Upload Files API
 * @param {FormData} formData - FormData containing files to upload
 * @returns {Object} Response data
 */
export const uploadFiles = async (formData) => {
    try {
        const response = await API.post('/api/upload_files/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'File Upload');
    }
};

/**
 * Upload file to Firebase Storage and return file name & download URL
 * @param {File} file - The file object to be uploaded
 * @returns {Object} { fileName, fileUrl }
 */
export const uploadFileToFirebase = async (file) => {
  try {
      if (!(file instanceof File)) {
          console.error("🚨 Invalid file type:", file);
          throw new Error("Invalid file provided for upload.");
      }

      // Get user email from local storage
      const email = localStorage.getItem('email');
      if (!email) throw new Error("User email not found in local storage");

      // Define the storage path
      const filePath = `${email}/uploaded_files/${file.name}`;
      const storageRef = ref(storage, filePath);

      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);

      // Get file URL after upload
      const fileUrl = await getDownloadURL(storageRef);

      // Return both file name (for backend) and file URL (for access)
      return { fileName: file.name, fileUrl };
  } catch (error) {
      console.error("🚨 Upload Error:", error);
      throw new Error("Failed to upload file to Firebase Storage");
  }
};


/**
 * Notify backend after file uploads to trigger metadata extraction
 * @param {Array} uploadedFiles - Array of objects containing { fileName, fileUrl }
 * @param {string} email - The user's email
 * @returns {Object} Response from the backend
 */
export const notifyBackendAfterUpload = async (uploadedFiles, email) => {
  try {
    console.log(uploadFiles);
    console.log(email);
    const response = await API.post(
      "/api/process_uploaded_files/",
      { uploadedFiles, email },
      { headers: { "Content-Type": "application/json" } } // Ensure JSON is sent
  );
  if (!response || response.status !== 200) {
    throw new Error(`Backend responded with status ${response.status}`);
}
      //return response.data;
  } catch (error) {
      console.error("Backend Notification Error:", error);
      throw new Error("Failed to notify backend after upload");
  }
};

/**
 * Select Sheets API
 * @param {Object} fileData - File data for selecting sheets
 * @returns {Object} Response data
 */
export const selectSheets = async (fileData) => {
    try {
        const response = await API.post('/api/select_sheets/', { file_data: fileData });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Select Sheets');
    }
};

/**
 * Column Selection API
 * @param {Object} fileData - File data for selecting columns
 * @returns {Object} Response data
 */
export const columnSelection = async (fileData) => {
    try {
        const response = await API.post('/api/column_selection/', { file_data: fileData });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Column Selection');
    }
};

/**
 * Final Upload API
 * @param {Object} fileData - File data for final upload
 * @param {string} email - User's email
 * @returns {Object} Response data
 */
export const finalUpload = async (fileData, email) => {
    try {
        const response = await API.post('/api/final_upload/', { file_data: fileData, email });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Final Upload');
    }
};

/**
 * Fetch Sheets and Columns API
 * @param {Object} fileData - Data for selecting sheets and columns
 * @returns {Object} Combined Response data
 */
export const fetchSheetsAndColumns = async (fileData) => {
    try {
        const sheetResponse = await API.post('/api/select_sheets/', { file_data: fileData });
        const columnResponse = await API.post('/api/column_selection/', { file_data: fileData });

        return {
            sheets: sheetResponse,
            columns: columnResponse,
        };
    } catch (error) {
        handleApiError(error, 'Fetch Sheets and Columns');
    }
};

/**
 * Upload Processed Files API
 * @param {Object} fileData - Data for uploading processed files
 * @param {string} email - User's email
 * @returns {Object} Response data
 */
export const uploadProcessedFiles = async (fileData, email) => {
    try {
        const response = await API.post('/api/upload_processed_files/', { file_data: fileData, email });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Upload Processed Files');
    }
};

// Additional Functions

/**
 * Register API
 * @param {Object} data - Registration payload
 * @returns {Object} Response data
 */
export const register = async (data) => {
    try {
        const response = await API.post('/api/register/', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Registration');
    }
};

/**
 * Reset Password API
 * @param {Object} data - Payload containing new password and confirmation
 * @returns {Object} Response data
 */
export const resetPassword = async (data) => {
    try {
        const response = await API.post('/api/reset-password/', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Reset Password');
    }
};
/**
 * Request Password Reset API
 * @param {Object} data - Email payload for password reset
 * @returns {Object} Response data
 */
export const requestPasswordReset = async (data) => {
    try {
        const response = await API.post('/api/forgot-password/', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Request Password Reset');
    }
};

/**
 * Validate Forgot Password OTP
 * @param {Object} data - OTP validation payload for password reset
 * @returns {Object} Response data
 */
export const validateForgotPasswordOtp = async (data) => {
    try {
        const response = await API.post('/api/validate-forgot-password-otp/', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Validate Forgot Password OTP');
    }
};

/**
 * Fetch Protected Home Content API
 * @returns {Object} Response data
 */
export const fetchHome = async () => {
    try {
        const response = await API.get('/api/home/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Home Content');
    }
};

/**
 * Fetch Uploaded Files for the User
 * @returns {Object} Response data containing the list of uploaded files
 */
export const getUserFiles = async () => {
    try {
        const response = await API.get('api/list-files/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Uploaded Files');
    }
};

/**
 * Fetch Processed Files for the User
 * @returns {Object} Response data containing the list of processed files
 */
export const getProcessedFiles = async () => {
    try {
        const response = await API.get('api/list-files/processed/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Processed Files');
    }
};


/**
 * Validate OTP API
 * @param {Object} data - OTP validation payload
 * @returns {Object} Response data
 */
export const validateOtp = async (data) => {
    try {
        const response = await API.post('/api/validate-otp/', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Validate OTP');
    }
};

export const getFileDetails = async (fileName) => {
    const email = localStorage.getItem('email');
    try {
      const response = await API.post('/api/get-file-details/', {
        fileName,
        email,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching file details:', error);
      throw error;
    }
};
  
export const saveUpdatedFile = async (payload) => {
    try {
        const email = localStorage.getItem('email');
        if (!email) {
            throw new Error('Email not found in local storage.');
        }
    
        const response = await API.post('/api/edit-file/process/', payload, {
            headers: {
                'X-User-Email': email, // Send email in headers
            },
        });
    
        return response.data;
    } catch (error) {
        console.error('Error saving the updated file:', error);
        throw error;
    }
};
  
/**
 * Fetch User Profile API
 * @returns {Object} Response data containing user profile information
 */
export const fetchUserProfile = async () => {
    const email = localStorage.getItem('email'); // Fetch email from local storage
    if (!email) {
        throw new Error('Email not found in local storage.');
    }

    try {
        const response = await API.get('/api/user/', {
            headers: {
                'X-User-Email': email, // Send email in headers
            },
        });
        return response.data; // Return the user profile data
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Generate Preview of File
 * @param {Object} payload - Contains fileName and selectedSheets/columns for preview generation.
 * @returns {Object} Response data with preview content.
 */
export const generatePreview = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/preview/generate/', payload, {
        headers: {
          'X-User-Email': email,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating file preview:', error);
      throw error;
    }
  };
  
/**
 * Generate Preview of File with New Column
 * @param {Object} payload - Contains fileName, newColumnName, and operations for preview generation.
 * @returns {Object} Response data with preview content.
 */
export const previewFileWithColumn = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/preview/generate/addColumn/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json', // Restricting to JSON
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating file preview with new column:', error);
      throw error;
    }
  };
  
  /**
 * Merge two files with selected options.
 * @param {Object} payload - Contains file names, merge type, keys, and merge method.
 * @returns {Object} Response data with the merged file details.
 */
export const mergeFiles = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/merge/files/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error merging files:', error);
      throw error;
    }
  };

  
  /**
 * Generate a preview of the merged file.
 * @param {Object} payload - Contains file names, merge type, keys, and merge method.
 * @returns {Object} Response data with preview content.
 */
export const previewMergedFile = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/merge_files/preview/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing merged file:', error);
      throw error;
    }
  };

  /**
 * Save the merged file to Firebase.
 * @param {Object} payload - Contains file names, merge type, keys, and merge method.
 * @returns {Object} Response data with saved file details.
 */
export const saveMergedFile = async (payload) => {
    try {
      const email = localStorage.getItem('email');
      if (!email) {
        throw new Error('Email not found in local storage.');
      }

      const response = await API.post('/api/merge_files/merge/', {
        ...payload,
        outputFileName: payload.outputFileName // Add this new field
      }, {
        headers: {
          'X-User-Email': email,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving merged file:', error);
      throw error;
    }
  };
  

  /**
 * Generate the pivot table based on user configuration.
 * @param {Object} payload - Contains file name, row index, column index, and pivot values.
 * @returns {Object} Response data with download URL for the pivot file.
 */
export const generatePivotTable = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/group_pivot/generate/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating pivot table:', error);
      throw error;
    }
  };

  /**
 * Generate a preview of the pivot table.
 * @param {Object} payload - Contains file name, row index, column index, and pivot values.
 * @returns {Object} Response data with preview content.
 */
export const previewPivotTable = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/group_pivot/preview/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing pivot table:', error.message || error);
      throw error;
    }
  };
  
  /**
 * Preview sorted data.
 * @param {Object} payload - Contains fileName and sortConfig.
 * @returns {Object} Response data with preview content.
 */
export const previewSortData = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/sort_filter/preview/sort/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing sorted data:', error.message || error);
      throw error;
    }
  };
  
  /**
   * Preview filtered data.
   * @param {Object} payload - Contains fileName and filterConfig.
   * @returns {Object} Response data with preview content.
   */
  export const previewFilterData = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/sort_filter/preview/filter/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing filtered data:', error.message || error);
      throw error;
    }
  };
  
  /**
   * Save sorted data and generate a download URL.
   * @param {Object} payload - Contains fileName and sortConfig.
   * @returns {Object} Response data with download URL.
   */
  export const saveSortedData = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/sort_filter/final/sort/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving sorted data:', error.message || error);
      throw error;
    }
  };
  
  /**
   * Save filtered data and generate a download URL.
   * @param {Object} payload - Contains fileName and filterConfig.
   * @returns {Object} Response data with download URL.
   */
  export const saveFilteredData = async (payload) => {
    const email = localStorage.getItem('email');
    if (!email) {
      throw new Error('Email not found in local storage.');
    }
  
    try {
      const response = await API.post('/api/sort_filter/final/filter/', payload, {
        headers: {
          'X-User-Email': email,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving filtered data:', error.message || error);
      throw error;
    }
  };

  // Preview combined sort and filter data
export const previewCombinedData = async (payload) => {
    try {
      const response = await API.post('api/sort_filter/preview/combined/', payload);
      return response.data;
    } catch (error) {
      console.error('Error previewing combined data:', error.message);
      throw error;
    }
  };
  
  // Save combined sort and filter data
  export const saveCombinedData = async (payload) => {
    try {
      const response = await API.post('api/sort_filter/final/combined/', payload);
      return response.data;
    } catch (error) {
      console.error('Error saving combined data:', error.message);
      throw error;
    }
  };

  /**
 * Generate Preview of File
 * @param {Object} payload - Contains fileName and selectedSheets/columns for preview generation.
 * @returns {Object} Response data with preview content.
 */
export const generateEditFilePreview = async (payload) => {
  const email = localStorage.getItem('email');
  if (!email) {
    throw new Error('Email not found in local storage.');
  }

  try {
    const response = await API.post('/api/edit-file/generate/', payload, {
      headers: {
        'X-User-Email': email,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error generating file preview:', error);
    throw error;
  }
};

/**
 * Submit all column operations for processing
 * @param {string} fileName - Name of the file
 * @param {string} sheet - Sheet name
 * @param {Array} operations - Array of operation configurations
 * @param {string} format - Output format (xlsx/csv)
 * @returns {Promise} - Response data with processing results
 */
export const submitColumnOperations = async (fileName, sheet, operations, format = 'xlsx') => {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email not found in local storage.');
    }

    try {
        const response = await API.post('/api/add_column/apply/', {
            fileName,
            sheet,
            operations,
            format
        }, {
            headers: {
                'X-User-Email': email,
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting column operations:', error);
        throw handleApiError(error);
    }
};

/**
 * Preview multiple column operations
 * @param {string} fileName - Name of the file
 * @param {string} sheet - Sheet name
 * @param {Array} operations - Array of operation configurations
 * @returns {Promise} - Preview data
 */
export const previewColumnOperations = async (fileName, sheet, operations) => {
  try {
      const response = await API.post('/api/add_column/preview/', {
          fileName,
          sheet,
          operations
      });
      return response.data;
  } catch (error) {
      throw handleApiError(error);
  }
};

/**
* Apply multiple column operations and save result
* @param {string} fileName - Name of the file
* @param {string} sheet - Sheet name
* @param {Array} operations - Array of operation configurations
* @param {string} format - Output format (xlsx/csv)
* @returns {Promise} - Download URL and filename
*/
export const applyColumnOperations = async (fileName, sheet, operations, format = 'xlsx') => {
  try {
      const response = await API.post('/api/add_column/apply/', {
          fileName,
          sheet,
          operations,
          format
      });
      return response.data;
  } catch (error) {
      throw handleApiError(error);
  }
};
/**
 * Preview formatting changes
 * @param {string} fileName - Name of the file
 * @param {string} sheet - Sheet name
 * @param {Object} formattingConfig - Formatting configuration
 * @returns {Promise} - Preview data
 */
export const previewFormatting = async (fileName, sheet, formattingConfig) => {
  const email = localStorage.getItem('email');
  if (!email) {
      throw new Error('Email not found in local storage.');
  }

  try {
      const response = await API.post('/api/formatting/preview/', {
          fileName,
          sheet,
          formattingConfig
      }, {
          headers: {
              'X-User-Email': email,
              'Accept': 'application/json',
          },
      });
      return response.data;
  } catch (error) {
      console.error('Preview formatting error:', error);
      throw error;
  }
};

/**
* Apply formatting changes and save result
* @param {string} fileName - Name of the file
* @param {string} sheet - Sheet name
* @param {Object} formattingConfig - Formatting configuration
* @returns {Promise} - Download URL and filename
*/
export const applyFormatting = async (fileName, sheet, formattingConfig) => {
  const email = localStorage.getItem('email');
  if (!email) {
      throw new Error('Email not found in local storage.');
  }

  try {
      const response = await API.post('/api/formatting/apply/', {
          fileName,
          sheet,
          formattingConfig
      }, {
          headers: {
              'X-User-Email': email,
              'Accept': 'application/json',
          },
      });
      return response.data;
  } catch (error) {
      console.error('Apply formatting error:', error);
      throw error;
  }
};


// Visualization endpoints
export const previewVisualization = async (data, userEmail) => {
    try {
        const response = await API.post('/api/visualization/preview/', data, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': userEmail
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to generate preview');
    }
};

export const saveVisualization = async (data) => {
  try {
      const response = await API.post('/api/visualization/save/', {
          fileName: data.fileName,
          visualizationConfig: {
              type: data.visualizationType,
              title: data.chartTitle,
              xAxis: data.xAxis,
              series: data.series,
              barType: data.barType,
              labels: data.labels,
              values: data.values,
              chartType: data.chartType,
              largestItems: data.largestItems,
              colorTheme: data.colorTheme
          }
      });
      return response.data;
  } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to save visualization');
  }
};

export const loadVisualization = async (fileName) => {
  try {
      const response = await API.get('/api/visualization/load/', {
          params: { fileName }
      });
      return response.data;
  } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load visualization');
  }
};

export const reconcileFiles = async (reconcileData) => {
  try {
    const response = await API.post('/api/merge_files/reconcile/', reconcileData, {
      headers: {
        'X-User-Email': localStorage.getItem('email'),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getFileColumns = async () => {
  try {
    const response = await API.get('/api/operations/columns/');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const performFileOperations = async (config) => {
  try {
    const response = await API.post('/api/operations/operations/', config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const previewFileOperations = async (config) => {
  try {
    const response = await API.post('/api/operations/preview/', config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteFile = async (fileName, folder) => {
  const email = localStorage.getItem('email');
  if (!email) {
    throw new Error('Email not found in local storage');
  }

  try {
    const response = await API.delete('/api/list-files/delete/', {
      data: {
        fileName,
        folder,
      },
      headers: {
        'X-User-Email': email,
        'Content-Type': 'application/json'
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}; 