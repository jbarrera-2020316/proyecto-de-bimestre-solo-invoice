import Invoice from "../invoice/invoice.model.js";
import Product from "../product/product.model.js"; // Importación para validar productos y actualizar stock
import Cart from "../cart/cart.model.js"; // Importación para obtener los productos del carrito

// Crear una nueva factura desde el carrito del usuario
// Crear una nueva factura desde el carrito del usuario
export const createInvoice = async (req, res) => {
    try {
      // Usa el userId desde req.user (viene del middleware JWT)
      const userId = req.user._id;  // Asegúrate de que req.user esté disponible
  
      // Obtener el carrito del usuario con los productos poblados
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      console.log('Carrito con productos:', cart);  // Añadir log para ver el carrito
  
      // Verificar si el carrito existe y contiene productos
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No hay productos en el carrito para crear una factura",
        });
      }
  
      // Calcular el monto total de la factura
      const totalAmount = cart.items.reduce((total, item) => {
        if (item.product) {
          return total + item.product.price * item.quantity; // Asegúrate de que quantity esté bien definido
        }
        return total;
      }, 0);
  
      // Crear la nueva factura
      const newInvoice = new Invoice({
        user: userId,
        products: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        totalAmount,
      });
  
      await newInvoice.save();
  
      // Vaciar el carrito después de crear la factura
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
  
      return res.status(201).json({
        success: true,
        message: "Factura creada exitosamente",
        invoice: newInvoice,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message || "Error general al crear la factura",
      });
    }
  };
  


// Obtener todas las facturas de un usuario
export const getInvoicesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const invoices = await Invoice.find({ user: userId })
            .populate('products.product', 'name price stock');  // Correctamente referenciando 'products.product'
        
        return res.status(200).json({
            success: true,
            invoices,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Error al obtener facturas",
        });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user._id;  // Asegúrate de que este es el ID del usuario autenticado
  
      console.log('Request to get invoice with ID:', invoiceId);  // Verificamos que invoiceId llega bien
      console.log('User ID from JWT:', userId);  // Verificamos que el userId llega bien
  
      // Buscar la factura por ID y también verificar que el usuario que hace la solicitud sea el dueño de la factura
      const invoice = await Invoice.findOne({ _id: invoiceId, user: userId })
        .populate('products.product', 'name price stock'); // Poblar productos correctamente
  
      console.log('Invoice found:', invoice); // Verificamos si la factura fue encontrada
  
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Factura no encontrada o no pertenece a este usuario",
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
        message: err.message || "Error al obtener la factura",
      });
    }
  };
  
  
  

// Editar una factura (solo para Admin)
export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { products, status } = req.body;

    // Verificar que el usuario sea Admin (esto debería ser validado en algún middleware de autenticación)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Solo los administradores pueden editar facturas",
      });
    }

    // Validación: Asegurarse de que los productos existan y verificar el stock
    const productPromises = products.map(async (productId) => {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Producto con ID ${productId} no encontrado`);
      }
      return product;
    });

    const validProducts = await Promise.all(productPromises);

    // Validación de stock: Verificar que haya suficiente cantidad de productos en inventario
    validProducts.forEach((product) => {
      if (product.stock <= 0) {
        throw new Error(`No hay stock disponible para el producto ${product.name}`);
      }
    });

    // Actualizar la factura
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { products, status },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Factura actualizada exitosamente",
      invoice: updatedInvoice,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error al actualizar la factura",
    });
  }
};

// Eliminar una factura (solo para Admin)
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Verificar que el usuario sea Admin (esto debería ser validado en algún middleware de autenticación)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Solo los administradores pueden eliminar facturas",
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Devolver stock de los productos
    await Promise.all(invoice.products.map(async (item) => {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;  // Aumentar el stock
        await product.save();
      }
    }));

    // Eliminar la factura
    await Invoice.findByIdAndDelete(invoiceId);

    return res.status(200).json({
      success: true,
      message: "Factura eliminada exitosamente",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error al eliminar la factura",
    });
  }
};
