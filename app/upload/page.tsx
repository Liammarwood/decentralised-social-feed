'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  CardMedia,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import { initGun, getCurrentUser, createPost } from '@/lib/db';
import {
  uploadToIPFS,
  validateMediaFile,
  createFilePreview,
  revokeFilePreview,
} from '@/lib/ipfs';

export default function UploadPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Gun.js and check authentication
    const init = async () => {
      await initGun();
      
      // Check authentication
      const user = getCurrentUser();
      if (!user?.is) {
        router.push('/auth');
        return;
      }

      setIsAuthenticated(true);
      setUsername(user.is.alias || 'Anonymous');
    };
    
    init();
  }, [router]);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) {
        revokeFilePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      validateMediaFile(selectedFile);
      setFile(selectedFile);
      setError(null);

      // Create preview
      if (previewUrl) {
        revokeFilePreview(previewUrl);
      }
      const preview = createFilePreview(selectedFile);
      setPreviewUrl(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate file');
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!content.trim() && !file) {
      setError('Please add content or upload a file');
      return;
    }

    try {
      setLoading(true);

      let mediaHash: string | undefined;
      let mediaType: 'image' | 'video' | undefined;

      // Upload file to IPFS if present
      if (file) {
        mediaHash = await uploadToIPFS(file);
        mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      }

      // Create post in Gun.js
      await createPost({
        author: username,
        content: content.trim(),
        mediaHash,
        mediaType,
      });

      setSuccess(true);
      setContent('');
      setFile(null);
      if (previewUrl) {
        revokeFilePreview(previewUrl);
      }
      setPreviewUrl(null);

      // Redirect to feed after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create Post
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success">
                Post created successfully! Redirecting to feed...
              </Alert>
            )}

            <TextField
              label="What's on your mind?"
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              fullWidth
            />

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Upload Image or Video
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </Button>

              {file && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Selected: {file.name}
                </Typography>
              )}
            </Box>

            {previewUrl && file && (
              <Card variant="outlined">
                {file.type.startsWith('image/') ? (
                  <CardMedia
                    component="img"
                    image={previewUrl}
                    alt="Preview"
                    sx={{ maxHeight: 400, objectFit: 'contain' }}
                  />
                ) : (
                  <CardMedia
                    component="video"
                    src={previewUrl}
                    controls
                    sx={{ maxHeight: 400, objectFit: 'contain' }}
                  />
                )}
              </Card>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={loading || (!content.trim() && !file)}
              fullWidth
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
