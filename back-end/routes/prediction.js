const express = require('express');
const multer = require('multer');
const { predictDemandController, readDatasetController, uploadDatasetController, associateDatasetController, getItemDatasetController, getDatasetsListController } = require('../controllers/predictionController');

const router = express.Router();

// Multer config
const upload = multer({ dest: 'dataset/' });

// POST /v1/api/prediction/demand
router.post('/demand', predictDemandController);

// POST /v1/api/prediction/dataset
router.post('/dataset', readDatasetController);

// POST /v1/api/prediction/upload-dataset
router.post('/upload-dataset', upload.single('file'), uploadDatasetController);

// POST /v1/api/prediction/associate-dataset
router.post('/associate-dataset', associateDatasetController);

// GET /v1/api/prediction/item-dataset/:item_id
router.get('/item-dataset/:item_id', getItemDatasetController);

// GET /v1/api/prediction/datasets
router.get('/datasets', getDatasetsListController);

module.exports = router;
