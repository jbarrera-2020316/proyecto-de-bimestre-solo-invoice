import Product from '../product/product.model.js';
import Category from '../category/category.model.js';


export const createProduct = async (req, res) => {
    try {
        console.log("Request Body:", req.body);  // Verifica el contenido de req.body

        const { name, description, price, stock, categoryId } = req.body;

        // Verificar si categoryId no está vacío o undefined
        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category ID is required' });
        }

        // Verificar que la categoría exista
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Crear nuevo producto
        const product = new Product({
            name,
            description,
            price,
            stock,
            category: categoryId,
        });

        await product.save();
        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error creating product', err });
    }
};



// Admin: Obtener todos los productos
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name');
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching products', err });
    }
};


// Admin: Editar un producto
export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, description, price, stock, categoryId } = req.body;

        // Verificar si el producto existe antes de actualizarlo
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Si el usuario envía un categoryId, validar si existe
        if (categoryId) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
        }

        // Actualizar el producto con los datos enviados
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { name, description, price, stock, ...(categoryId && { category: categoryId }) },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating product', err });
    }
};


// Admin: Eliminar un producto
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Buscar el producto por ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Eliminar el producto
        await product.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error deleting product', err });
    }
};

// Admin: Obtener los productos más vendidos
export const getBestSellingProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ sold: -1 }).limit(5); // Asumiendo que tienes un campo 'sold' para llevar el conteo
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching most sold products', err });
    }
};




export const getProductsInStock = async (req, res) => {
    try {
        console.log('Fetching products in stock...');
        const productsInStock = await Product.find({ stock: { $gt: 0 } });

        if (productsInStock.length === 0) {
            console.log('No products in stock');
            return res.status(404).json({
                success: false,
                message: 'No products in stock',
            });
        }

        console.log('Products in stock:', productsInStock);
        return res.status(200).json({
            success: true,
            message: 'Products in stock',
            products: productsInStock,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products in stock',
            err,
        });
    }
};


// Controlador para obtener productos fuera de stock
export const getProductsOutOfStock = async (req, res) => {
    try {
        // Filtramos los productos donde el stock es 0 o menor
        const productsOutOfStock = await Product.find({ stock: { $lte: 0 } });

        if (productsOutOfStock.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products out of stock',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Products out of stock',
            products: productsOutOfStock,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products out of stock',
            err,
        });
    }
};


// User: Explorar productos (sin necesidad de autenticación)
export const exploreProducts = async (req, res) => {
    try {
        const { categoryId, searchQuery } = req.query;
        const filter = {};

        if (categoryId) {
            filter.category = categoryId;
        }

        if (searchQuery) {
            filter.name = { $regex: searchQuery, $options: 'i' }; // Búsqueda por nombre
        }

        const products = await Product.find(filter).populate('category', 'name');
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error exploring products', err });
    }
};
