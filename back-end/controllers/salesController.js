const asyncHandler = require('../utils/asyncHandler');
const {
  createRetailSale,
  createWholesaleSale,
  createWholesalerSale
} = require('../services/salesService');

const createRetailSaleController = asyncHandler(async (req, res) => {
  const sale = await createRetailSale(req.body);

  res.status(201).json({
    success: true,
    ...sale
  });
});

const createWholesalerSaleController = asyncHandler(async (req, res) => {
  const sale = await createWholesalerSale(req.body);

  res.status(201).json({
    success: true,
    ...sale
  });
});

const createWholesaleSaleController = asyncHandler(async (req, res) => {
  const sale = await createWholesaleSale(req.body);

  res.status(201).json({
    success: true,
    ...sale
  });
});

module.exports = {
  createRetailSaleController,
  createWholesalerSaleController,
  createWholesaleSaleController
};
