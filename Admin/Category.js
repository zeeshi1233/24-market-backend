import { Category, SubCategory } from "../model/Category.js";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
console.log(req.user,"req")
    const category = await Category.create({
      name,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;
     console.log(name,categoryId)
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

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubCategoriesByCategory = async (req, res) => {
  try {
    const { id } = req.params; // category id URL se milegi

    const subCategories = await SubCategory.find({ category: id })
      .populate("category", "name") // parent category ka naam bhi dega
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subCategories.length,
      subCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};