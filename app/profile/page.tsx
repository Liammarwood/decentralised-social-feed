'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Avatar,
  Box,
  CircularProgress,
  Paper,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { initGun, getCurrentUser, getUserPosts, type Post } from '@/lib/db';
import { getIPFSUrl } from '@/lib/ipfs';

export default function ProfilePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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

      // Subscribe to user's posts
      getUserPosts((newPosts) => {
        setPosts(newPosts);
        setLoading(false);
      });
    };
    
    init();
  }, [router]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            {username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Your Posts
      </Typography>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You haven&apos;t posted anything yet. Create your first post!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={username}
                subheader={formatTimestamp(post.timestamp)}
              />

              {post.mediaHash && post.mediaType === 'image' && (
                <CardMedia
                  component="img"
                  image={getIPFSUrl(post.mediaHash)}
                  alt="Post media"
                  sx={{ maxHeight: 600, objectFit: 'contain' }}
                />
              )}

              {post.mediaHash && post.mediaType === 'video' && (
                <CardMedia
                  component="video"
                  src={getIPFSUrl(post.mediaHash)}
                  controls
                  sx={{ maxHeight: 600, objectFit: 'contain' }}
                />
              )}

              <CardContent>
                <Typography variant="body1" color="text.primary">
                  {post.content}
                </Typography>
              </CardContent>

              <CardActions disableSpacing>
                <IconButton aria-label="like">
                  <FavoriteIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  {post.likes || 0} likes
                </Typography>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
