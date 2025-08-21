// ImgBB API configuration
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY'; // You'll need to replace this with your actual ImgBB API key
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url: string;
    display_url: string;
    size: number;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export const uploadToImgBB = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result: ImgBBResponse = await response.json();

    if (!result.success) {
      throw new Error('ImgBB upload failed');
    }

    return result.data.url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};

export const uploadMultipleToImgBB = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadToImgBB(file));
  return Promise.all(uploadPromises);
};
