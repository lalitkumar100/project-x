const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { findCustomerByPhone } = require('../services/customerServices');

const getCustomerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;

  if (!phone || !phone.trim()) {
    throw new AppError('Phone query is required', 400);
  }

  const customer = await findCustomerByPhone(phone.trim());

  if (!customer) {
    return res.json({ found: false });
  }

  res.json({
    found: true,
    customer
  });
});

module.exports = {
  getCustomerByPhone
};
