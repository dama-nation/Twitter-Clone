import { v2 as cloudinary } from "cloudinary";
import { httpError } from "./httpError.js";

export const isCloudinaryConfigured = () =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

const publicIdFromUrl = (url) => url.split("/").pop().split(".")[0];

export const uploadImage = async (image) => {
    if (!isCloudinaryConfigured()) {
        throw httpError(503, "Image uploads are not configured on this server");
    }

    let response;
    try {
        response = await cloudinary.uploader.upload(image);
    } catch (error) {
        throw httpError(502, error?.message || "Image upload failed", { cause: error });
    }

    if (!response?.secure_url) {
        throw httpError(502, "Image upload failed");
    }
    return response.secure_url;
};

/**
 * Best-effort deletion of a previously uploaded image. A failure here must not
 * abort the surrounding operation (deleting a post, replacing an avatar), but
 * it is logged so the orphaned asset is traceable.
 */
export const destroyImage = async (url) => {
    if (!url || !isCloudinaryConfigured()) return false;
    try {
        await cloudinary.uploader.destroy(publicIdFromUrl(url));
        return true;
    } catch (error) {
        console.error(`Failed to delete Cloudinary image ${url}:`, error);
        return false;
    }
};
