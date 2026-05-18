const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const setupController = require('../controllers/setupController');

const upload = multer({ dest: path.join(__dirname, '../dataset/temp') });

router.post('/clear-data', setupController.clearData);
router.post('/drop-schema', setupController.dropSchema);
router.post('/add-schema', setupController.addSchema);
router.post('/reset-all', setupController.resetAll);
router.post('/import-items-csv', upload.single('file'), setupController.importItemsCsv);

module.exports = router;
