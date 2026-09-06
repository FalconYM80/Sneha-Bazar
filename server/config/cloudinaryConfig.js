import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image buffer to Cloudinary
export const uploadToCloudinary = async (buffer, folder = "products") => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
          max_file_size: 5 * 1024 * 1024, // 5MB
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      return;
    }
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image from Cloudinary: ${error.message}`);
    // Don't throw error - allow operation to continue even if deletion fails
  }
};

// Check if a URL is a Cloudinary URL
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes("cloudinary.com");
};

// Extract public_id from Cloudinary URL
export const extractPublicIdFromUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) {
    return null;
  }
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const urlParts = url.split("/");
    const versionIndex = urlParts.findIndex(part => part.startsWith("v"));
    
    if (versionIndex === -1 || versionIndex + 1 >= urlParts.length) {
      return null;
    }
    
    // Extract folder and public_id after version
    const publicIdWithExtension = urlParts.slice(versionIndex + 1).join("/");
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf("."));
    
    return publicId;
  } catch (error) {
    return null;
  }
};

export default cloudinary;