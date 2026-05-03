const express = require('express');
const { tcgLogin } = require('../controllers/TCGControllers');

const router = express.Router();

/**
 * @route   POST /v1/api/tcg/login
 * @desc    Login to TCG API and persist the returned JWT to frontend .env
 * @access  Public
 */
router.post('/login', tcgLogin);

module.exports = router;
