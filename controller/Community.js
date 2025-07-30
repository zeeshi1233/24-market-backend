import { Community } from "../model/CommunitySchema.js";
import Joi from "joi";
import cloudinary from "../cloudinaryConfig.js";
import User from "../model/UserSchema.js";

const communityValidationSchema = Joi.object({
    description: Joi.string().required().trim(),
    user: Joi.string().required().trim(),
});

export const CreateCommunity = async (req, res) => {
    try {
        const { error } = communityValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { description, user } = req.body;
        const images = req.files;

        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "No image file uploaded." });
        }

        // ✅ Fetch user details
        const userDoc = await User.findById(user);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // ✅ Upload images to Cloudinary
        const uploadPromises = images.map((image) => {
            return new Promise((resolve, reject) => {
                if (!image.buffer || image.size > 10 * 1024 * 1024) {
                    return reject(new Error("Invalid or oversized image file."));
                }

                cloudinary.uploader
                    .upload_stream({ folder: "bees/community" }, (error, result) => {
                        if (error) return reject(new Error("Cloudinary upload error."));
                        resolve({ src: result.secure_url });
                    })
                    .end(image.buffer);
            });
        });

        const uploadedImages = await Promise.all(uploadPromises);

        // ✅ Create community record
        const communityRecord = new Community({
            description,
            user, // reference
            userDetails: {
                name: userDoc.firstName + " " + userDoc.lastName,
                email: userDoc.email,
                image: userDoc.image || "", // Optional
            },
            image: uploadedImages[0].src,
        });

        await communityRecord.save();

        return res.status(200).json({
            success: true,
            message: "Community created successfully.",
            community: communityRecord,
        });
    } catch (error) {
        console.error("CreateCommunity error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};


export const GetCommunity = async (req, res) => {
    try {
        const { id } = req.params;

        if (id) {
            // Get single community
            const community = await Community.findById(id);
            if (!community) {
                return res.status(404).json({ success: false, message: "Community not found." });
            }
            return res.status(200).json({ success: true, community });
        } else {
            // Get all communities
            const communities = await Community.find().sort({ createdAt: -1 });
            return res.status(200).json({ success: true, communities });
        }
    } catch (error) {
        console.error("GetCommunity error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const UpdateCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const images = req.files;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: "Community not found." });
        }

        if (description) {
            community.description = description;
        }

        if (images && images.length > 0) {
            const uploadPromises = images.map((image) => {
                return new Promise((resolve, reject) => {
                    if (!image.buffer || image.size > 10 * 1024 * 1024) {
                        return reject(new Error("Invalid or oversized image file."));
                    }

                    cloudinary.uploader
                        .upload_stream({ folder: "bees/community" }, (error, result) => {
                            if (error) return reject(new Error("Cloudinary upload error."));
                            resolve({ src: result.secure_url });
                        })
                        .end(image.buffer);
                });
            });

            const uploadedImages = await Promise.all(uploadPromises);
            community.image = uploadedImages[0].src;
        }

        await community.save();

        return res.status(200).json({ success: true, message: "Community updated.", community });
    } catch (error) {
        console.error("UpdateCommunity error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


export const DeleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await Community.findByIdAndDelete(id);

        if (!community) {
            return res.status(404).json({ success: false, message: "Community not found." });
        }

        return res.status(200).json({ success: true, message: "Community deleted successfully." });
    } catch (error) {
        console.error("DeleteCommunity error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
