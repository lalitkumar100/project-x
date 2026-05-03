const express = require('express');
const { getCustomerByPhone } = require('../controllers/custmerController');

const router = express.Router();

router.get('/', getCustomerByPhone);

module.exports = router;
