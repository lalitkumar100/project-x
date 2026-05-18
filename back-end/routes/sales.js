const express = require('express');
const {
  createRetailSaleController,
  createWholesaleSaleController,
  createWholesalerSaleController,
  resolveRequestController
} = require('../controllers/salesController');

const router = express.Router();

router.post('/retail', createRetailSaleController);
router.post('/wholesale', createWholesaleSaleController);
router.post('/wholesaler', createWholesalerSaleController);
router.post('/resolve-request', resolveRequestController);

module.exports = router;
