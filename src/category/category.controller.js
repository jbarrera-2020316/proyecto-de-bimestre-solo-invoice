import Category from "../category/category.model.js"
import Product from '../product/product.model.js' //cambie este import antes era '../category/category.model.js' si no funciona hoy solo cambialo a este jp de lunes
import mongoose from "mongoose"

export const defaultCategory = async () => {
  try {
    // Check if the default category already exists
    const defaultCategory = await Category.findOne({ defaultCat: true });

    if (defaultCategory) {
      console.log('The default category already exists.');
      return;  // If it exists, do nothing more
    }

    // If it doesn't exist, create the default category
    console.log('Creating the default category...');

    const newCategory = new Category({
      name: 'Default Category',
      description: 'This is the default category',
      defaultCat: true, // Ensure this category is the default
    });

    await newCategory.save(); // Save the new category to the database
    console.log('Default category created successfully');
  } catch (error) {
    console.error('Error creating the default category:', error);
  }
};

export const createCategory = async (req, res) => {
    try {
      const { name, description } = req.body;
  
      const newCategory = new Category({ name, description });
      await newCategory.save();
  
      return res.status(201).json({ success: true, message: 'Category added successfully', category: newCategory });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error adding category', err });
    }
  };

// Admin: Edit a category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const { name, description } = req.body;

        const category = await Category.findByIdAndUpdate(
            id, 
            { name, description },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({ success: true, message: 'Category updated successfully', category });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error updating category', err });
    }
};

// Admin: Delete a category and reassign products to the default category
export const deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
  
    try {
      // Check if the category exists
      const category = await Category.findById(categoryId);
  
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }
  
      // Check if it is the default category
      if (category.defaultCat) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the default category',
        });
      }
  
      // Find the default category
      const defaultCategory = await Category.findOne({ defaultCat: true });
  
      if (!defaultCategory) {
        return res.status(404).json({
          success: false,
          message: 'Default category not found',
        });
      }
  
      // Update all products in this category to belong to the default category
      const updatedProducts = await Product.updateMany(
        { category: categoryId }, // Filter products by the category we're deleting
        { $set: { category: defaultCategory._id } } // Replace the category with the default category
      );
  
      console.log(`Updated ${updatedProducts.nModified} products`); // To see how many products were updated
  
      // Delete the category
      await Category.findByIdAndDelete(categoryId);
  
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully and products reassigned',
      });
    } catch (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting category',
        err,
      });
    }
  };

// Admin and User: Get all categories
export const getAllCategory = async (req, res) => {
    try {
      const categories = await Category.find();
      return res.status(200).json({ success: true, categories });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error fetching categories', err });
    }
  };

// Admin: Get a category by its ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;  // Using 'id' because in the route it's ':id'
        console.log("received id:", id);  // Check that 'id' is coming correctly

        // Check that the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'The category ID is not valid' });
        }

        // Find the category by ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Return the found category
        return res.status(200).json({
            success: true,
            category
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching category by ID', err });
    }
};
