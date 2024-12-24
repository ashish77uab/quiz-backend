import cloudinary from "../middleware/cloudindary.js";
import fs from "fs";
import crypto from 'crypto' 
export const uploadImageToCloudinary = async (file, res) => {
    try {
        const result = await cloudinary.uploader.upload(file.path,{
            folder:'sharemarket',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' } // Resize and set quality
            ]
        });
        fs.unlinkSync("./public/uploads/" + file?.filename);
        return result?.url
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong during image upload.' });
    }
}
export const deleteFileFromCloudinary = async (url) => {
    try {
        const parts = url.split('/');
        const fileNameWithExtension = parts[parts.length - 1]; // "qjdj4lcwycq3tp0dkv5f.jpg"
        const publicId = fileNameWithExtension.split('.')[0]; // "qjdj4lcwycq3tp0dkv5f"
        const result = await cloudinary.uploader.destroy(`sharemarket/${publicId}`);
        return result?.result==='ok';
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        res.status(500).json({ message: 'Failed to delete the file.' });
    }
};

