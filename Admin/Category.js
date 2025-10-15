import { Category, SubCategory } from "../model/Category.js";

// 🟢 CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const category = await Category.create({
      name,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🟢 CREATE SUB-CATEGORY
export const createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Name and categoryId are required" });
    }

    const subCategory = await SubCategory.create({
      name,
      category: categoryId,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, subCategory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🟢 GET ALL CATEGORIES
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("subCategories", "name _id")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 GET SUB-CATEGORIES BY CATEGORY
export const getSubCategoriesByCategory = async (req, res) => {
  try {
    const { id } = req.params; // category id
    const subCategories = await SubCategory.find({ category: id })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: subCategories.length, subCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔵 UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category updated", category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🔵 UPDATE SUB-CATEGORY
export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    const subCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, category: categoryId },
      { new: true, runValidators: true }
    );

    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-category not found" });
    }

    res.json({ success: true, message: "Sub-category updated", subCategory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🔴 DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Optional: Delete related subcategories
    await SubCategory.deleteMany({ category: id });

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category and its subcategories deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔴 DELETE SUB-CATEGORY
export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-category not found" });
    }

    await subCategory.deleteOne();

    res.json({ success: true, message: "Sub-category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
