const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Acceso denegado. Token no proporcionado.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        // Normalizar payload para que req.user.id exista (el token usa userId)
        req.user = {
            id: decoded.userId || decoded.id || null,
            username: decoded.username || null,
            role: decoded.role || null
        };
        next();
        
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token inválido.' 
        });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Se requieren privilegios de administrador.' 
            });
        }
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Error de autorización.' 
        });
    }
};

module.exports = { auth, adminAuth };