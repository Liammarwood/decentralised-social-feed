'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { initGun, getPosts, seedDemoPosts, type Post } from '@/lib/db';
import { getIPFSUrl } from '@/lib/ipfs';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Gun.js and subscribe to posts
    const init = async () => {
      await initGun();
      
      // Seed demo posts for demonstration
      await seedDemoPosts();
      
      // Subscribe to posts (Gun works reactively)
      getPosts((newPosts) => {
        setPosts(newPosts);
      });
    };
    
    init();
  }, []);

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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Feed
      </Typography>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
              No posts yet. Be the first to share something!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <IconButton 
                color="primary" 
                onClick={async () => {
                  await seedDemoPosts();
                  window.location.reload();
                }}
                aria-label="Load demo posts"
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  px: 2
                }}
              >
                <Typography variant="button" sx={{ mr: 1 }}>Load Demo Posts</Typography>
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {post.author.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={post.author}
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
