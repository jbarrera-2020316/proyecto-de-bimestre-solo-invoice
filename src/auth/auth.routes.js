// Rutas de autenticacion
import { Router } from "express"
import { login, register, test } from "./auth.controller.js"
import { validateJwt } from "../../../../arreglar invoice para que funcione en el postman/proyecto-de-bimestre-solo-invoice/middlewares/validate.jwt.js";
import { LoginValidator, registerValidator } from "../../../../arreglar invoice para que funcione en el postman/proyecto-de-bimestre-solo-invoice/helpers/validators.js";
import { uploadProfilePicture } from "../../../../arreglar invoice para que funcione en el postman/proyecto-de-bimestre-solo-invoice/middlewares/multer.uploads.js";
import { deleteFileError } from "../../../../arreglar invoice para que funcione en el postman/proyecto-de-bimestre-solo-invoice/middlewares/delete.file.on.errors.js";
const api = Router()

// Rutas publicas
api.post('/register',
    [
        uploadProfilePicture.single('profilePicture'),
        registerValidator,
        deleteFileError
    ],
    register
)

api.post(
    '/login',
    [
        LoginValidator
    ],
    login
)

//Rutas privadas
                //Middleware
api.get('/test', validateJwt, test)

// Exportar
export default api