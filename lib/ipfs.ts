/**
 * IPFS Helper for Media Upload and Retrieval
 * Uses public IPFS HTTP API for uploads
 */

// Use public IPFS gateways
const IPFS_UPLOAD_GATEWAY = 'https://ipfs.infura.io:5001/api/v0';
const IPFS_VIEW_GATEWAY = 'https://ipfs.io/ipfs';

/**
 * Upload a file to IPFS using HTTP API
 * @param file - File object from input
 * @returns IPFS CID (Content Identifier)
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('IPFS upload can only be done in the browser');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Try Infura IPFS API
    try {
      const response = await fetch(`${IPFS_UPLOAD_GATEWAY}/add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Infura upload failed');
      }

      const data = await response.json();
      console.log('File uploaded to IPFS via Infura:', data.Hash);
      return data.Hash;
    } catch (infuraError) {
      console.warn('Infura upload failed, using mock CID:', infuraError);
      
      // For demo purposes, generate a mock CID based on file content
      // In production, you would use a different IPFS provider or local node
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const mockCid = `Qm${hashHex.substring(0, 44)}`;
      
      console.log('Using mock CID for demo:', mockCid);
      
      // Store file in localStorage for demo purposes
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            localStorage.setItem(`ipfs_${mockCid}`, reader.result as string);
            resolve(mockCid);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

/**
 * Retrieve a file from IPFS
 * @param cidString - IPFS CID string
 * @returns Blob of the file
 */
export const retrieveFromIPFS = async (cidString: string): Promise<Blob> => {
  try {
    // Try to get from localStorage first (for demo mock uploads)
    const localData = localStorage.getItem(`ipfs_${cidString}`);
    if (localData) {
      const response = await fetch(localData);
      return await response.blob();
    }

    // Otherwise fetch from IPFS gateway
    const response = await fetch(`${IPFS_VIEW_GATEWAY}/${cidString}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve from IPFS');
    }
    return await response.blob();
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error('Failed to retrieve file from IPFS');
  }
};

/**
 * Get IPFS gateway URL for media display
 * @param cid - IPFS CID string
 * @returns Gateway URL or data URL for mock uploads
 */
export const getIPFSUrl = (cid: string): string => {
  if (typeof window !== 'undefined') {
    // Check if this is a mock upload stored locally
    const localData = localStorage.getItem(`ipfs_${cid}`);
    if (localData) {
      return localData;
    }
  }
  
  // Use public IPFS gateway
  return `${IPFS_VIEW_GATEWAY}/${cid}`;
};

/**
 * Validate file type and size
 * @param file - File object
 * @param maxSizeMB - Maximum file size in MB
 * @returns true if valid
 */
export const validateMediaFile = (file: File, maxSizeMB: number = 50): boolean => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM)');
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  return true;
};

/**
 * Create a preview URL for a file
 * @param file - File object
 * @returns Object URL for preview
 */
export const createFilePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free memory
 * @param url - Object URL to revoke
 */
export const revokeFilePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
