import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

const ChartPreview = ({ streamlitUrl }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (streamlitUrl) {
            setLoading(false);
        }
    }, [streamlitUrl]);

    if (!streamlitUrl) {
        return null;
    }

    return (
        <Box sx={{ width: '100%', height: '500px', position: 'relative' }}>
            {loading && (
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            <iframe
                src={streamlitUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onLoad={() => setLoading(false)}
                style={{ visibility: loading ? 'hidden' : 'visible' }}
            />
        </Box>
    );
};

export default ChartPreview;