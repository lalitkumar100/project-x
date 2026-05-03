const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

/**
 * Absolute path to the shared runtime token store.
 * Located at the project root so every service can reach it.
 * Read fresh on every call — no server restart needed when token changes.
 */
const TCG_CONFIG_PATH = path.resolve(__dirname, '../../tcg_config.json');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read the current TCG token from the JSON file at runtime.
 * Returns an empty string if the file is missing or the token is not set.
 *
 * @returns {string} The stored JWT token, or '' if not set.
 */
function getTCGToken() {
  try {
    const raw  = fs.readFileSync(TCG_CONFIG_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return data.TCG_TOKEN || '';
  } catch {
    return '';
  }
}

/**
 * Write a new token to the JSON config file.
 * Overwrites the previous value immediately — the running server picks it up
 * on the very next call to getTCGToken(), with zero restart required.
 *
 * @param {string} token - The JWT token to persist.
 */
function saveTCGToken(token) {
  const payload = {
    TCG_TOKEN:  token,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(TCG_CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf-8');
}

// ─── Controller ────────────────────────────────────────────────────────────────

/**
 * TCG Login Controller
 * Authenticates with the TCG API using credentials from the request body,
 * extracts the JWT token from the response, and persists it to
 * tcg_config.json (project root) so the running server can use it
 * immediately without restarting.
 *
 * @route   POST /v1/api/tcg/login
 * @access  Public
 */
const tcgLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate input ─────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const tcgBaseUrl = process.env.TCG_URL;
    if (!tcgBaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'TCG_URL is not configured in the environment.',
      });
    }

    // ── Call TCG Auth API ──────────────────────────────────────────────────
    const tcgResponse = await axios.post(`${tcgBaseUrl}/auth/login`, {
      email,
      password,
    });

    const { token } = tcgResponse.data;

    if (!token) {
      return res.status(502).json({
        success: false,
        message: 'TCG API did not return a token.',
      });
    }

    // ── Persist token to tcg_config.json (runtime, no restart needed) ──────
    saveTCGToken(token);

    console.log('[TCGControllers] Token refreshed and saved to tcg_config.json');

    // ── Respond ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully. Token saved to tcg_config.json.',
      token,
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'TCG API returned an error.',
        error: error.response.data,
      });
    }

    console.error('[TCGControllers] tcgLogin error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while logging in to TCG.',
    });
  }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  tcgLogin,
  getTCGToken,   // ← import this wherever you need the live token
  saveTCGToken,
};
