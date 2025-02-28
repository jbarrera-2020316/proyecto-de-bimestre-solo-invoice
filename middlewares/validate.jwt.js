'use strict';

import jwt from "jsonwebtoken";
import { findUser } from "../helpers/db.validators.js";


export const validateJwt = async (req, res, next) => {
    try {
        let secretKey = process.env.SECRET_KEY;
        let { authorization } = req.headers;

        // Verifica si la autorización existe y tiene el formato correcto
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized. Token required" });
        }

        let token = authorization.split(" ")[1]; // Extrae el token de la cabecera
        let user = jwt.verify(token, secretKey); // Decodifica el token

        // Aquí suponemos que `user.uid` es un identificador único para el usuario
        // Verifica si el usuario existe en la base de datos
        const validateUser = await findUser(user.uid);
        if (!validateUser) {
            return res.status(404).send({
                success: false,
                message: 'User not found - Unauthorized'
            });
        }

        // Asignamos el usuario decodificado a req.user
        req.user = validateUser;  // Aquí nos aseguramos que req.user tenga toda la información del usuario
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        return res.status(403).json({ message: "Invalid token or expired" });
    }
};


// Middleware para validar que el usuario sea CLIENT
export const validateClient = (req, res, next) => {
    try {
        if (req.user.role !== "USER") {
            return res.status(403).json({ message: "Access denied. Only clients can create appointments" });
        }
        next();
    } catch (err) {
        console.error("Role validation error:", err);
        return res.status(500).json({ message: "Error validating role" });
    }
};

//Validacion por roles (Despues de la validacion del token)
export const isAdmin = async(req, res, next)=>{
    try{
        const{ user } = req
        if(!user || user.role !== 'ADMIN') return res.status(403).send(
            {
                success: false,
                message: `You dont have access | username ${user.username}`
            }
        )
        next()
    }catch(err){
        console.error(err)
        return res.status(403).send(
            {
                success: false,
                message: 'Unauthorized role'
            }
        )
    }
}
