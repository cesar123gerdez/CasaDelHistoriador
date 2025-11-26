const { pool } = require('../config/database');

class File {
    static async getAll(search = '', categoryId = null) {
        try {
            let query = `
                SELECT f.*, c.name as category_name, c.color as category_color,
                       u.name as user_name, u.username as user_username
                FROM files f
                LEFT JOIN categories c ON f.category_id = c.id
                LEFT JOIN users u ON f.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (search) {
                query += ' AND (f.name LIKE ? OR f.description LIKE ? OR f.original_name LIKE ?)';
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam);
            }

            if (categoryId && categoryId !== 'all') {
                query += ' AND f.category_id = ?';
                params.push(categoryId);
            }

            query += ' ORDER BY f.created_at DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async create(fileData) {
        try {
            const { name, original_name, file_path, file_type, file_size, description, category_id, user_id } = fileData;
            
            const [result] = await pool.execute(
                `INSERT INTO files (name, original_name, file_path, file_type, file_size, description, category_id, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, original_name, file_path, file_type, file_size, description, category_id, user_id]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT f.*, c.name as category_name, c.color as category_color,
                        u.name as user_name, u.username as user_username
                 FROM files f
                 LEFT JOIN categories c ON f.category_id = c.id
                 LEFT JOIN users u ON f.user_id = u.id
                 WHERE f.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updates) {
        try {
            const allowedFields = ['name', 'description', 'category_id'];
            const setClause = [];
            const params = [];

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    setClause.push(`${field} = ?`);
                    params.push(updates[field]);
                }
            }

            if (setClause.length === 0) {
                return false;
            }

            params.push(id);
            const query = `UPDATE files SET ${setClause.join(', ')} WHERE id = ?`;
            
            const [result] = await pool.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM files WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async incrementDownloads(id) {
        try {
            await pool.execute(
                'UPDATE files SET downloads = downloads + 1 WHERE id = ?',
                [id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async getByCategory(categoryId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM files WHERE category_id = ? ORDER BY created_at DESC',
                [categoryId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = File;