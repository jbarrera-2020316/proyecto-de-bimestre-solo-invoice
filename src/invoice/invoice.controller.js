import Invoice from "../invoice/invoice.model.js";
import Product from "../product/product.model.js"; // Import for product validation and stock update
import Cart from "../cart/cart.model.js"; // Import to get products from the cart

// Create a new invoice from the user's cart
export const createInvoice = async (req, res) => {
    try {
      // Use the userId from req.user (comes from the JWT middleware)
      const userId = req.user._id;  // Ensure req.user is available
  
      // Get the user's cart with populated products
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      console.log('Cart with products:', cart);  // Add log to see the cart
  
      // Check if the cart exists and contains products
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "There are no products in the cart to create an invoice",
        });
      }
  
      // Calculate the total amount for the invoice
      const totalAmount = cart.items.reduce((total, item) => {
        if (item.product) {
          return total + item.product.price * item.quantity; // Ensure quantity is properly defined
        }
        return total;
      }, 0);
  
      // Create the new invoice
      const newInvoice = new Invoice({
        user: userId,
        products: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        totalAmount,
      });
  
      await newInvoice.save();
  
      // Empty the cart after creating the invoice
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
  
      return res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        invoice: newInvoice,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message || "General error creating the invoice",
      });
    }
  };
  

// Get all invoices for a user
export const getInvoicesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const invoices = await Invoice.find({ user: userId })
            .populate('products.product', 'name price stock');  // Correctly referencing 'products.product'
        
        return res.status(200).json({
            success: true,
            invoices,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Error fetching invoices",
        });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user._id;  // Ensure this is the ID of the authenticated user
  
      console.log('Request to get invoice with ID:', invoiceId);  // Check if invoiceId is received correctly
      console.log('User ID from JWT:', userId);  // Check if userId is received correctly
  
      // Find the invoice by ID and also check that the user requesting it owns the invoice
      const invoice = await Invoice.findOne({ _id: invoiceId, user: userId })
        .populate('products.product', 'name price stock'); // Correctly populate products
  
      console.log('Invoice found:', invoice); // Check if the invoice was found
  
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found or does not belong to this user",
        });
      }
  
      return res.status(200).json({
        success: true,
        invoice,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message || "Error fetching the invoice",
      });
    }
  };
  

// Edit an invoice (only for Admin)
export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status, product1, quantity1, product2, quantity2, product3, quantity3 } = req.body;

    // Verify that the user is Admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can edit invoices",
      });
    }

    // Ensure that at least one product and its quantity are received
    if ((!product1 || !quantity1) && (!product2 || !quantity2) && (!product3 || !quantity3)) {
      return res.status(400).json({
        success: false,
        message: "At least one product with its quantity must be provided",
      });
    }

    // Create an array of products and quantities from the received fields
    const products = [];

    if (product1 && quantity1) {
      products.push({ product: product1, quantity: quantity1 });
    }
    if (product2 && quantity2) {
      products.push({ product: product2, quantity: quantity2 });
    }
    if (product3 && quantity3) {
      products.push({ product: product3, quantity: quantity3 });
    }

    // Product and stock validation
    const productPromises = products.map(async (productData) => {
      if (!productData.product || !productData.quantity) {
        throw new Error("Each product must have a 'product' (ID) and 'quantity'");
      }

      const product = await Product.findById(productData.product);
      if (!product) {
        throw new Error(`Product with ID ${productData.product} not found`);
      }

      if (product.stock < productData.quantity) {
        throw new Error(`Not enough stock for product ${product.name}`);
      }

      return product;
    });

    // Wait for all products to be validated
    await Promise.all(productPromises);

    // Update the invoice with the products and status
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status, products }, // Update products and status
      { new: true } // Return the updated document
    );

    // If the invoice is not found
    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Respond with the updated invoice
    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error updating the invoice",
    });
  }
};

// Delete an invoice (only for Admin)
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Verify that the user is Admin (this should be validated in some authentication middleware)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators can delete invoices",
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Return stock of the products
    await Promise.all(invoice.products.map(async (item) => {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;  // Increase stock
        await product.save();
      }
    }));

    // Delete the invoice
    await Invoice.findByIdAndDelete(invoiceId);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error deleting the invoice",
    });
  }
};
