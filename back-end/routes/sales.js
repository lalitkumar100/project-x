const express = require('express');
const {
  createRetailSaleController,
  createWholesaleSaleController,
  createWholesalerSaleController
} = require('../controllers/salesController');

const router = express.Router();

router.post('/retail', createRetailSaleController);
router.post('/wholesale', createWholesaleSaleController);
router.post('/wholesaler', createWholesalerSaleController);

module.exports = router;
