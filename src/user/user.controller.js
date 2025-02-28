import argon2 from 'argon2';
import User from '../user/user.model.js';

// Admin: Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        // Verificar que el usuario sea admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const users = await User.find();
        return res.status(200).json({
            success: true,
            users,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching users', err });
    }
};

// Admin: Obtener un usuario por su ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario sea admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching user', err });
    }
};

// Admin: Cambiar el rol de un usuario
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Verificar que el rol sea válido
        if (role !== 'ADMIN' && role !== 'USER') {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        // Actualizar el rol
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating user role', err });
    }
};

// Admin: Editar la información de un usuario (solo admin puede editar otros usuarios)
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, surname, username, email, password, newPassword, confirmPassword } = req.body;

        // Verificar que el usuario sea admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Verificar si se envía nueva contraseña y si es igual en ambos campos
        if (newPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        // Si se está cambiando la contraseña, encriptarla
        let updatedData = { name, surname, username, email, password };
        if (newPassword) {
            const hashedPassword = await argon2.hash(newPassword);
            updatedData.password = hashedPassword;
        }

        // Actualizar los datos del perfil del usuario
        const user = await User.findByIdAndUpdate(
            userId,
            updatedData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User information updated successfully',
            user,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating user', err });
    }
};

// Admin: Eliminar un usuario
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario sea admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User account deleted successfully',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error deleting user account', err });
    }
};

// User: Editar su propio perfil (solo pueden editar sus propios datos)
export const updateProfile = async (req, res) => {
    try {
        const { name, surname, email, password, newPassword, confirmPassword } = req.body;

        // Verificar si el usuario está intentando editar su propio perfil
        if (req.user.uid !== req.params.userId) {  // Asegúrate de usar 'uid' en lugar de 'id'
            return res.status(403).json({ success: false, message: 'You don\'t have access | username ' + req.user.username });
        }

        // Verificar si se envía nueva contraseña y si es igual en ambos campos
        if (newPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        // Si se está cambiando la contraseña, encriptarla
        let updatedData = { name, surname, email, password };
        if (newPassword) {
            const hashedPassword = await argon2.hash(newPassword);
            updatedData.password = hashedPassword;
        }

        // Actualizar los datos del perfil
        const user = await User.findByIdAndUpdate(
            req.user.uid,  // Usamos el 'uid' para actualizar el perfil
            updatedData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating profile', err });
    }
};


// User: Eliminar su propia cuenta
export const deleteUserAccount = async (req, res) => {
    try {
        // Verificar que el usuario esté intentando eliminar su propia cuenta
        if (req.user.uid !== req.params.userId) {  // Aquí debe ser req.user.uid
            return res.status(403).json({ success: false, message: 'Cannot delete another user' });
        }

        // Intentar eliminar al usuario
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User account deleted successfully',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error deleting user account', err });
    }
};
