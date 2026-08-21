import { v2 as cloudinary } from "cloudinary";

export const uploadImage = async (image) => {
    const uploadedResponse = await cloudinary.uploader.upload(image);
    return uploadedResponse?.secure_url;
};

export const destroyImageByUrl = async (url) => {
    const publicId = url.split("/").pop().split(".")[0];
    return cloudinary.uploader.destroy(publicId);
};
