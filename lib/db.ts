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
    
    // Gun configuration with relay peers for synchronization
    gunInstance = Gun({
      peers: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://gun-us.herokuapp.com/gun',
      ],
      localStorage: true,
      radisk: true,
    });
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
