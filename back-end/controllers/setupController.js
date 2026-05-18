const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db');
const dbManager = require('../setup/db_manager');

const clearData = async (req, res) => {
    try {
        await dbManager.clearDataOnly();
        res.status(200).json({ message: "Successfully truncated all data in tables." });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear data", error: error.message });
    }
};

const dropSchema = async (req, res) => {
    try {
        await dbManager.dropSchemaAndData();
        res.status(200).json({ message: "Public schema dropped and recreated empty." });
    } catch (error) {
        res.status(500).json({ message: "Failed to drop schema", error: error.message });
    }
};

const addSchema = async (req, res) => {
    try {
        await dbManager.addSchema();
        res.status(200).json({ message: "Schema added successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to add schema", error: error.message });
    }
};

const resetAll = async (req, res) => {
    try {
        await dbManager.dropSchemaAndData();
        await dbManager.addSchema();
        res.status(200).json({ message: "Schema fully reset and created successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset schema", error: error.message });
    }
};

const importItemsCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded." });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const brandMap = {}; 
                const categoryMap = {}; 
                const subcategoryMap = {}; 

                const getOrCreateBrand = async (name) => {
                    if (!name) return null;
                    if (brandMap[name]) return brandMap[name];
                    const res = await client.query('SELECT id FROM brands WHERE name = $1', [name]);
                    if (res.rows.length > 0) {
                        brandMap[name] = res.rows[0].id;
                        return brandMap[name];
                    }
                    const ins = await client.query('INSERT INTO brands (name) VALUES ($1) RETURNING id', [name]);
                    brandMap[name] = ins.rows[0].id;
                    return brandMap[name];
                };

                const getOrCreateCategory = async (name) => {
                    if (!name) return null;
                    if (categoryMap[name]) return categoryMap[name];
                    const res = await client.query('SELECT id FROM categories WHERE name = $1', [name]);
                    if (res.rows.length > 0) {
                        categoryMap[name] = res.rows[0].id;
                        return categoryMap[name];
                    }
                    const ins = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [name]);
                    categoryMap[name] = ins.rows[0].id;
                    return categoryMap[name];
                };

                const getOrCreateSubcategory = async (name, catId) => {
                    if (!name || !catId) return null;
                    const key = catId + '_' + name;
                    if (subcategoryMap[key]) return subcategoryMap[key];
                    const res = await client.query('SELECT id FROM subcategories WHERE name = $1 AND category_id = $2', [name, catId]);
                    if (res.rows.length > 0) {
                        subcategoryMap[key] = res.rows[0].id;
                        return subcategoryMap[key];
                    }
                    const ins = await client.query('INSERT INTO subcategories (name, category_id) VALUES ($1, $2) RETURNING id', [name, catId]);
                    subcategoryMap[key] = ins.rows[0].id;
                    return subcategoryMap[key];
                };

                let importedCount = 0;
                for (const row of results) {
                    const itemName = row['Item Name']?.trim();
                    if (!itemName) continue;

                    const brandName = row['Brand Name']?.trim();
                    const catName = row['Category Name']?.trim();
                    const subcatName = row['Subcategory Name']?.trim();
                    
                    const qty = parseInt(row['Quantity']) || 0;
                    const reorder = parseInt(row['Reorder Level']) || null;
                    const mrp = parseFloat(row['MRP']) || null;
                    const netBuy = parseFloat(row['Net Buy Price']) || null;
                    const warranty = parseInt(row['Warranty Months']) || null;
                    const desc = row['Description']?.trim() || null;

                    const brandId = await getOrCreateBrand(brandName);
                    const categoryId = await getOrCreateCategory(catName);
                    const subcategoryId = await getOrCreateSubcategory(subcatName, categoryId);

                    await client.query(
                        `INSERT INTO items 
                         (name, brand_id, category_id, subcategory_id, quantity, reorder_level, mrp, net_buy_price, warranty_months, description)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [itemName, brandId, categoryId, subcategoryId, qty, reorder, mrp, netBuy, warranty, desc]
                    );
                    importedCount++;
                }

                await client.query('COMMIT');
                
                try { fs.unlinkSync(req.file.path); } catch (e) {}
                
                res.status(200).json({ message: `Successfully imported ${importedCount} items!`, count: importedCount });
            } catch (error) {
                await client.query('ROLLBACK');
                try { fs.unlinkSync(req.file.path); } catch (e) {}
                console.error("CSV Import Error:", error);
                res.status(500).json({ message: "Failed to import items", error: error.message });
            } finally {
                client.release();
            }
        });
};

module.exports = {
    clearData,
    dropSchema,
    addSchema,
    resetAll,
    importItemsCsv
};
