const asyncHandler = require('../utils/asyncHandler');
const { trainAndPredict } = require('../services/predictionService');
const pool = require('../config/db');

// =========================
// POST /v1/api/prediction/demand
// =========================
// Body: { dataset_path, start_date, end_date, item_id?, safety_buffer_percent? }

const predictDemandController = asyncHandler(async (req, res) => {
  const { dataset_path, start_date, end_date, item_id, safety_buffer_percent } = req.body;

  // --- Validate required fields ---
  if (!dataset_path || !start_date || !end_date) {
    const error = new Error('Missing required fields: dataset_path, start_date, end_date');
    error.status = 400;
    throw error;
  }

  // --- Run training + prediction + order calculation ---
  const result = await trainAndPredict(
    dataset_path,
    start_date,
    end_date,
    item_id || null,
    safety_buffer_percent || 15
  );

  res.status(200).json({
    success: true,
    message: 'Demand prediction generated successfully',
    model_mae: result.model_mae,
    total_predictions: result.total_predictions,
    order_summary: result.order_summary,
    predictions: result.predictions
  });
});

// =========================
// POST /v1/api/prediction/dataset
// =========================
// Body: { dataset_path }

const readDatasetController = asyncHandler(async (req, res) => {
  const { dataset_path } = req.body;

  if (!dataset_path) {
    const error = new Error('Missing required field: dataset_path');
    error.status = 400;
    throw error;
  }

  const fs = require('fs');
  const path = require('path');
  const csv = require('csv-parser');

  const resolvedPath = path.resolve(dataset_path);

  if (!fs.existsSync(resolvedPath)) {
    const error = new Error(`Dataset file not found: ${resolvedPath}`);
    error.status = 404;
    throw error;
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(resolvedPath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push({
          week_date: row.week_date,
          units_sold: parseInt(row.units_sold),
          season: row.season,
          avg_temp: parseFloat(row.avg_temp),
          event_name: row.event_name,
          price: parseFloat(row.price),
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  res.status(200).json({
    success: true,
    total_rows: rows.length,
    data: rows
  });
});

// =========================
// GET /v1/api/prediction/item-dataset/:item_id
// =========================
const getItemDatasetController = asyncHandler(async (req, res) => {
  const { item_id } = req.params;
  
  if (!item_id) {
    const error = new Error('Missing item_id parameter');
    error.status = 400;
    throw error;
  }

  const query = 'SELECT * FROM item_datasets WHERE item_id = $1';
  const result = await pool.query(query, [item_id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'No dataset found for this item' });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
});

// =========================
// POST /v1/api/prediction/upload-dataset
// =========================
const uploadDatasetController = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No file uploaded');
    error.status = 400;
    throw error;
  }
  
  // The file is saved in 'dataset/' directory by multer.
  // We can return the path relative to the backend root or absolute.
  const dataset_path = `dataset/${req.file.filename}`;
  
  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    dataset_path,
    original_name: req.file.originalname
  });
});

// =========================
// POST /v1/api/prediction/associate-dataset
// =========================
const associateDatasetController = asyncHandler(async (req, res) => {
  const { item_id, dataset_path, dataset_name } = req.body;

  if (!item_id || !dataset_path || !dataset_name) {
    const error = new Error('Missing required fields: item_id, dataset_path, dataset_name');
    error.status = 400;
    throw error;
  }

  // Insert or update the association
  const query = `
    INSERT INTO item_datasets (item_id, dataset_name, dataset_path)
    VALUES ($1, $2, $3)
    ON CONFLICT (item_id)
    DO UPDATE SET dataset_name = EXCLUDED.dataset_name, dataset_path = EXCLUDED.dataset_path, uploaded_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const result = await pool.query(query, [item_id, dataset_name, dataset_path]);

  res.status(200).json({
    success: true,
    message: 'Dataset associated with item successfully',
    data: result.rows[0]
  });
});

// =========================
// GET /v1/api/prediction/datasets
// =========================
const getDatasetsListController = asyncHandler(async (req, res) => {
  const query = `
    SELECT d.id AS dataset_id, d.dataset_name, d.dataset_path, d.uploaded_at, 
           i.id AS item_id, i.name AS item_name, i.quantity, i.mrp
    FROM item_datasets d
    JOIN items i ON d.item_id = i.id
    ORDER BY d.uploaded_at DESC;
  `;
  const result = await pool.query(query);
  
  res.status(200).json({
    success: true,
    data: result.rows
  });
});

module.exports = { predictDemandController, readDatasetController, uploadDatasetController, associateDatasetController, getItemDatasetController, getDatasetsListController };
