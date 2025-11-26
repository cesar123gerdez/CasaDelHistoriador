const { pool } = require('../config/database');

class Category {
	static async getAll() {
		try {
			const [rows] = await pool.execute('SELECT id, name, color, created_at FROM categories ORDER BY id DESC');
			return rows;
		} catch (error) {
			throw error;
		}
	}

	static async create(name, color) {
		try {
			const [result] = await pool.execute(
				'INSERT INTO categories (name, color) VALUES (?, ?)',
				[name, color]
			);
			return result.insertId;
		} catch (error) {
			throw error;
		}
	}

	static async getById(id) {
		try {
			const [rows] = await pool.execute(
				'SELECT id, name, color, created_at FROM categories WHERE id = ?',
				[id]
			);
			return rows[0];
		} catch (error) {
			throw error;
		}
	}

	static async update(id, name, color) {
		try {
			const [result] = await pool.execute(
				'UPDATE categories SET name = ?, color = ? WHERE id = ?',
				[name, color, id]
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}

	static async delete(id) {
		try {
			const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}
}

module.exports = Category;