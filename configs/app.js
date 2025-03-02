import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from '../src/auth/auth.routes.js';
import { limiter } from '../middlewares/rate.limit.js';
import userRoutes from '../src/user/user.routes.js';
import productRoutes from '../src/product/product.routes.js';
import categoryRoutes from '../src/category/category.routes.js';
import cartRoutes from '../src/cart/cart.routes.js';
import invoiceRoutes from '../src/invoice/invoice.routes.js';
import { defaultCategory } from '../src/category/category.controller.js';

let categoryCreated = false; // Bandera para asegurarse de que la categoría solo se cree una vez

const configs = (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors());
    app.use(helmet());
    app.use(limiter);
    app.use(morgan('dev'));
};

const routes = (app) => {
    app.use(authRoutes);
    app.use('/v1/user', userRoutes);
    app.use('/v1/product', productRoutes);
    app.use('/v1/category', categoryRoutes);
    app.use('/v1/cart', cartRoutes);
    app.use('/v1/invoice', invoiceRoutes);
};

export const initServer = async () => {
    const app = express();
    try {
        configs(app);
        routes(app);

        // Verificamos si la categoría predeterminada ya ha sido creada antes de llamarla
        if (!categoryCreated) {
            await defaultCategory(); // Solo creamos la categoría una vez
            categoryCreated = true;   // Establecemos la bandera para evitar la creación múltiple
        }

        app.listen(process.env.PORT, () => {
            console.log(`Server running in port ${process.env.PORT}`);
        });
    } catch (err) {
        console.log('Server init failed', err);
    }
};
