/**
 * Gun.js Decentralized Database Layer
 * Provides local-first, peer-to-peer data storage and synchronization
 */

// Initialize Gun instance
let gunInstance: any = null;
let Gun: any = null;

export const initGun = async () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!gunInstance) {
    // Dynamic import to avoid SSR issues
    if (!Gun) {
      Gun = (await import('gun')).default;
      await import('gun/sea'); // For encryption and authentication
    }
    
    // Gun configuration - works fully locally without external peers
    // This enables offline-first, local-only operation
    gunInstance = Gun({
      localStorage: true,
      radisk: true,
      // No external peers - fully local operation
      peers: [],
    });
    
    console.log('Gun.js initialized in local-only mode');
  }
  return gunInstance;
};

export const getGun = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!gunInstance) {
    // Return a promise that will be resolved when Gun is initialized
    return null;
  }
  return gunInstance;
};

// User authentication helpers
export const createUser = async (username: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const gun = getGun();
    gun.user().create(username, password, (ack: any) => {
      if (ack.err) {
        reject(ack.err);
      } else {
        resolve(ack);
      }
    });
  });
};

export const loginUser = async (username: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const gun = getGun();
    gun.user().auth(username, password, (ack: any) => {
      if (ack.err) {
        reject(ack.err);
      } else {
        resolve(ack);
      }
    });
  });
};

export const logoutUser = () => {
  const gun = getGun();
  gun.user().leave();
};

export const getCurrentUser = () => {
  const gun = getGun();
  if (!gun) return null;
  return gun.user();
};

// Post management
export interface Post {
  id: string;
  author: string;
  content: string;
  mediaHash?: string; // IPFS hash for media
  mediaType?: 'image' | 'video';
  timestamp: number;
  likes: number;
}

export const createPost = async (post: Omit<Post, 'id' | 'timestamp' | 'likes'>): Promise<string> => {
  const gun = getGun();
  const user = gun.user();
  
  if (!user.is) {
    throw new Error('User must be authenticated');
  }

  const postData: Post = {
    ...post,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    likes: 0,
  };

  return new Promise((resolve, reject) => {
    user.get('posts').get(postData.id).put(postData, (ack: any) => {
      if (ack.err) {
        reject(ack.err);
      } else {
        resolve(postData.id);
      }
    });
  });
};

export const getPosts = (callback: (posts: Post[]) => void) => {
  const gun = getGun();
  if (!gun) {
    callback([]);
    return;
  }
  
  const posts: Post[] = [];

  gun.get('posts').map().on((post: Post) => {
    if (post) {
      const index = posts.findIndex(p => p.id === post.id);
      if (index >= 0) {
        posts[index] = post;
      } else {
        posts.push(post);
      }
      callback([...posts].sort((a, b) => b.timestamp - a.timestamp));
    }
  });
};

export const getUserPosts = (callback: (posts: Post[]) => void) => {
  const gun = getGun();
  const user = gun.user();
  const posts: Post[] = [];

  if (!user.is) {
    callback([]);
    return;
  }

  user.get('posts').map().on((post: Post) => {
    if (post) {
      const index = posts.findIndex(p => p.id === post.id);
      if (index >= 0) {
        posts[index] = post;
      } else {
        posts.push(post);
      }
      callback([...posts].sort((a, b) => b.timestamp - a.timestamp));
    }
  });
};

export const likePost = async (postId: string, authorPubKey: string): Promise<void> => {
  const gun = getGun();
  const user = gun.user();

  if (!user.is) {
    throw new Error('User must be authenticated');
  }

  return new Promise((resolve, reject) => {
    gun.user(authorPubKey).get('posts').get(postId).get('likes').once((likes: number) => {
      const newLikes = (likes || 0) + 1;
      gun.user(authorPubKey).get('posts').get(postId).get('likes').put(newLikes, (ack: any) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          resolve();
        }
      });
    });
  });
};

// Follow system
export const followUser = async (targetPubKey: string): Promise<void> => {
  const gun = getGun();
  const user = gun.user();

  if (!user.is) {
    throw new Error('User must be authenticated');
  }

  return new Promise((resolve, reject) => {
    user.get('following').get(targetPubKey).put({ following: true, timestamp: Date.now() }, (ack: any) => {
      if (ack.err) {
        reject(ack.err);
      } else {
        resolve();
      }
    });
  });
};

export const unfollowUser = async (targetPubKey: string): Promise<void> => {
  const gun = getGun();
  const user = gun.user();

  if (!user.is) {
    throw new Error('User must be authenticated');
  }

  return new Promise((resolve, reject) => {
    user.get('following').get(targetPubKey).put(null, (ack: any) => {
      if (ack.err) {
        reject(ack.err);
      } else {
        resolve();
      }
    });
  });
};

export const getFollowing = (callback: (following: string[]) => void) => {
  const gun = getGun();
  const user = gun.user();
  const following: string[] = [];

  if (!user.is) {
    callback([]);
    return;
  }

  user.get('following').map().on((data: any, key: string) => {
    if (data && data.following) {
      if (!following.includes(key)) {
        following.push(key);
      }
    } else if (data === null) {
      const index = following.indexOf(key);
      if (index >= 0) {
        following.splice(index, 1);
      }
    }
    callback([...following]);
  });
};

/**
 * Seed demo posts for demonstration purposes
 * This creates sample posts in the public feed to show how the app works
 */
export const seedDemoPosts = async (): Promise<void> => {
  const gun = getGun();
  if (!gun) {
    console.log('Gun not initialized, skipping demo posts');
    return;
  }

  // Check if demo posts already exist
  const demoKey = 'demo_posts_seeded';
  const alreadySeeded = localStorage.getItem(demoKey);
  
  if (alreadySeeded === 'true') {
    console.log('Demo posts already seeded');
    return;
  }

  // Give Gun a moment to be ready
  await new Promise(resolve => setTimeout(resolve, 500));

  const demoPosts: Post[] = [
    {
      id: 'demo-1',
      author: 'Alice',
      content: '🎉 Welcome to Decentralized Social! This is a local-first, peer-to-peer social network where you own your data. No central servers needed!',
      timestamp: Date.now() - 3600000, // 1 hour ago
      likes: 5,
    },
    {
      id: 'demo-2',
      author: 'Bob',
      content: 'Just tried the new PWA features - works great offline! 📱 You can install this app on your device and it will work even without internet.',
      timestamp: Date.now() - 7200000, // 2 hours ago
      likes: 3,
    },
    {
      id: 'demo-3',
      author: 'Charlie',
      content: 'Loving the decentralized approach! 🚀 All my data is stored locally in my browser and syncs peer-to-peer. No one can censor or control my posts.',
      timestamp: Date.now() - 10800000, // 3 hours ago
      likes: 8,
    },
    {
      id: 'demo-4',
      author: 'Diana',
      content: 'The Material-UI design looks fantastic! 🎨 Great work on making decentralization beautiful and easy to use.',
      timestamp: Date.now() - 14400000, // 4 hours ago
      likes: 12,
    },
    {
      id: 'demo-5',
      author: 'Eve',
      content: 'Just created my first post! This is so cool - knowing that I truly own my content and identity. 🔐',
      timestamp: Date.now() - 18000000, // 5 hours ago
      likes: 6,
    },
  ];

  // Add demo posts to Gun
  demoPosts.forEach((post) => {
    gun.get('posts').get(post.id).put(post);
  });

  // Mark as seeded
  localStorage.setItem(demoKey, 'true');
  console.log('Demo posts seeded successfully!');
};
