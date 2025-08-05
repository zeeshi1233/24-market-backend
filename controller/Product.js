import Joi from "joi";
import cloudinary from "../cloudinaryConfig.js";
import ProductSchema from "../model/ProductSchema.js";
import User from "../model/UserSchema.js";

export const productValidationSchema = Joi.object({
  category: Joi.string().required(),
  brand: Joi.string().required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).required(),
  location: Joi.string().required(),
  price: Joi.number().positive().required(),
  sellerName: Joi.string().min(3).required(),
  sellerPhone: Joi.string()
    .pattern(/^\+?\d{10,15}$/)
    .required(),
  showPhone: Joi.boolean().required(),
});

const productUpdateSchema = Joi.object({
  category: Joi.string(),
  brand: Joi.string(),
  title: Joi.string().min(3).max(100),
  description: Joi.string().min(10),
  location: Joi.string(),
  price: Joi.number().positive(),
  sellerName: Joi.string().min(3),
  sellerPhone: Joi.string().pattern(/^\+?\d{10,15}$/),
  showPhone: Joi.boolean(),
});

export const postProductAd = async (req, res) => {
  try {
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // STEP 1: Upload multiple images to Cloudinary
    const images = req.files;

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded." });
    }

    const uploadPromises = images.map((image) => {
      return new Promise((resolve, reject) => {
        if (!image.buffer || image.buffer.length === 0) {
          return reject(new Error("Invalid image buffer."));
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (image.size > MAX_FILE_SIZE) {
          return reject(new Error("File size exceeds 10MB limit."));
        }

        cloudinary.uploader
          .upload_stream({ folder: "24-market" }, (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(new Error("Error uploading to Cloudinary."));
            }
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          })
          .end(image.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // STEP 2: Save product with uploaded image URLs
    const {
      category,
      brand,
      title,
      description,
      location,
      price,
      sellerName,
      sellerPhone,
      showPhone,
    } = req.body;

    const newProduct = new ProductSchema({
      category,
      images: uploadedImages,
      brand,
      title,
      description,
      location,
      price,
      sellerName,
      sellerPhone,
      showPhone,
      seller: req.user.id,
    });

    await newProduct.save();
    await User.findByIdAndUpdate(req.user.id, {
      $push: { postedProducts: newProduct._id },
    });
    res.status(200).json({
      message: "Product posted successfully",
      data: newProduct,
    });
  } catch (err) {
    console.error("Post Product Error:", err.message);
    res.status(500).json({ error: "Failed to post product." });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await ProductSchema.find({ status: "available" })
      .populate({
        path: "seller",
        select: "firstName lastName email phoneNumber profilePic",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSingleProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductSchema.findById(id).populate({
      path: "seller",
      select: "firstName lastName email phoneNumber profilePic",
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Error fetching single product:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductSchema.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Validate only known fields (ignore "file")
    const { error } = productUpdateSchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // STEP 1: Separate existing image URLs and new binary files
    const files = req.files || [];

    let existingImageUrls = [];
    if (req.body.file) {
      if (Array.isArray(req.body.file)) {
        // Multiple file[] fields
        req.body.file.forEach((item) => {
          if (typeof item === "string" && item.startsWith("http")) {
            existingImageUrls.push(item);
          }
        });
      } else {
        // Single file[] field
        if (typeof req.body.file === "string" && req.body.file.startsWith("http")) {
          existingImageUrls.push(req.body.file);
        }
      }
    }

    // STEP 2: Upload new binary files to Cloudinary
    let uploadedNewImages = [];

    if (files.length > 0) {
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          if (!file.buffer || file.size > 10 * 1024 * 1024) {
            return reject(new Error("Invalid or too large image file."));
          }

          const stream = cloudinary.uploader.upload_stream(
            { folder: "24-market" },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                return reject(new Error("Image upload failed."));
              }
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );

          stream.end(file.buffer);
        });
      });

      uploadedNewImages = await Promise.all(uploadPromises);
    }

    // STEP 3: Combine existing image URLs and newly uploaded ones
    let finalImages = [];

    for (let url of existingImageUrls) {
      finalImages.push({
        url,
        public_id: "", // No public_id for existing URLs
      });
    }

    finalImages = [...finalImages, ...uploadedNewImages];

    // STEP 4: Update other product fields
    const {
      category,
      brand,
      title,
      description,
      location,
      price,
      sellerName,
      sellerPhone,
      showPhone,
    } = req.body;

    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.title = title || product.title;
    product.description = description || product.description;
    product.location = location || product.location;
    product.price = price || product.price;
    product.sellerName = sellerName || product.sellerName;
    product.sellerPhone = sellerPhone || product.sellerPhone;
    product.showPhone = showPhone ?? product.showPhone;

    if (finalImages.length > 0) {
      product.images = finalImages;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductSchema.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized: Not your product" });
    }

    await product.deleteOne();

    // Optionally remove from user's postedProducts
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { postedProducts: id },
    });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
