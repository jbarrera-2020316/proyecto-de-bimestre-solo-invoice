import { Router } from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getBestSellingProducts, getProductsOutOfStock, exploreProducts, getProductsInStock } from '../product/product.controller.js';
import { isAdmin, validateJwt } from '../../middlewares/validate.jwt.js';

const api = Router();

// Rutas para productos
// Solo el admin puede crear productos
api.post('/', [validateJwt, isAdmin], createProduct); 
// Todos pueden ver los productos
api.get('/', getAllProducts); 
// Solo el admin puede editar productos
api.put('/:productId', [validateJwt, isAdmin], updateProduct);
// Solo el admin puede eliminar productos
api.delete('/:productId', [validateJwt, isAdmin], deleteProduct);
// Solo el admin puede ver los productos más vendidos
api.get('/bestselling', [validateJwt, isAdmin], getBestSellingProducts);
// Solo el admin puede verificar el stock antes de procesar una factura
api.get('/outofstock', [validateJwt], getProductsOutOfStock);
//los prodructos que estan en stock
api.get('/instock',[validateJwt], getProductsInStock);
// Los usuarios pueden explorar productos sin necesidad de autenticación
api.get('/explore/:id', exploreProducts); 

export default api;
