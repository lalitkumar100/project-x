const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { RandomForestRegression } = require('ml-random-forest');
const pool = require('../config/db');

// =========================
// SIMPLE LABEL ENCODER
// =========================

class LabelEncoder {
  constructor() {
    this.classes = [];
    this.classMap = {};
  }

  fit(values) {
    this.classes = [...new Set(values)].sort();
    this.classMap = {};
    this.classes.forEach((cls, idx) => {
      this.classMap[cls] = idx;
    });
    return this;
  }

  transform(values) {
    return values.map(v => {
      if (this.classMap[v] === undefined) {
        throw new Error(`Unknown label: "${v}". Known labels: ${this.classes.join(', ')}`);
      }
      return this.classMap[v];
    });
  }

  fitTransform(values) {
    this.fit(values);
    return this.transform(values);
  }
}

// =========================
// FESTIVAL CALENDAR
// =========================

const festivalCalendar = {
  "2025-03-14": "Holi",
  "2025-10-20": "Diwali",
  "2025-12-25": "Christmas",
  "2026-03-03": "Holi",
  "2026-10-10": "Diwali",
  "2026-12-25": "Christmas"
};

// =========================
// HELPER FUNCTIONS
// =========================

function getSeason(month) {
  if ([3, 4, 5, 6].includes(month)) return "summer";
  if ([7, 8, 9].includes(month)) return "monsoon";
  if ([10, 11].includes(month)) return "autumn";
  return "winter";
}

function getTemp(season) {
  const tempMap = {
    summer: 42, monsoon: 30, autumn: 28, winter: 16
  };
  return tempMap[season];
}

function getRainDays(season) {
  const rainMap = {
    summer: 1, monsoon: 5, autumn: 2, winter: 0
  };
  return rainMap[season];
}

function getEventInfo(date) {
  for (const [festDateStr, festName] of Object.entries(festivalCalendar)) {
    const festDate = new Date(festDateStr);
    const diffMs = date.getTime() - festDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === -7) return { eventName: festName, eventWindow: "before", eventWeight: 0.4 };
    if (diffDays === 0) return { eventName: festName, eventWindow: "during", eventWeight: 0.7 };
    if (diffDays === 7) return { eventName: festName, eventWindow: "after", eventWeight: 0.3 };
  }
  return { eventName: "none", eventWindow: "none", eventWeight: 0.1 };
}

// =========================
// CSV PARSER
// =========================

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Dataset file not found: ${filePath}`));
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push({
          week_date: row.week_date,
          item_id: row.item_id,
          units_sold: parseFloat(row.units_sold),
          season: row.season,
          avg_temp: parseFloat(row.avg_temp),
          rain_days: parseFloat(row.rain_days),
          event_name: row.event_name,
          event_window: row.event_window,
          promotion: parseFloat(row.promotion),
          price: parseFloat(row.price),
          last_week_sales: parseFloat(row.last_week_sales),
          season_weight: parseFloat(row.season_weight),
          event_weight: parseFloat(row.event_weight)
        });
      })
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// =========================
// MAE CALCULATOR
// =========================

function meanAbsoluteError(actual, predicted) {
  const n = actual.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.abs(actual[i] - predicted[i]);
  }
  return sum / n;
}

// =========================
// GET ITEM STOCK FROM DB
// =========================

async function getItemStock(itemId) {
  const { rows } = await pool.query(
    `SELECT i.id, i.name, i.quantity AS current_stock, i.reorder_level,
            b.name AS brand, s.name AS subcategory
     FROM items i
     LEFT JOIN brands b ON i.brand_id = b.id
     LEFT JOIN subcategories s ON i.subcategory_id = s.id
     WHERE i.id = $1`,
    [itemId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

// =========================
// TRAIN & PREDICT
// =========================

async function trainAndPredict(datasetPath, startDate, endDate, itemId = null, safetyBufferPercent = 15) {

  // --- Load dataset ---
  const resolvedPath = path.resolve(datasetPath);
  const rows = await loadCSV(resolvedPath);

  if (rows.length < 5) {
    throw new Error('Dataset too small to train a model. Need at least 5 rows.');
  }

  // --- Encode categoricals ---
  const encoders = {};
  const categoricalCols = ['season', 'event_name', 'event_window'];

  for (const col of categoricalCols) {
    const le = new LabelEncoder();
    const rawValues = rows.map(r => r[col]);
    const encoded = le.fitTransform(rawValues);
    rows.forEach((r, i) => { r[`${col}_enc`] = encoded[i]; });
    encoders[col] = le;
  }

  // --- Prepare features & target ---
  const featureKeys = [
    'avg_temp', 'rain_days', 'promotion', 'price',
    'last_week_sales', 'season_weight', 'event_weight',
    'season_enc', 'event_name_enc', 'event_window_enc'
  ];

  const X = rows.map(r => featureKeys.map(k => r[k]));
  const y = rows.map(r => r.units_sold);

  // --- Train/test split (80/20) ---
  const splitIdx = Math.floor(rows.length * 0.8);

  const X_train = X.slice(0, splitIdx);
  const X_test = X.slice(splitIdx);
  const y_train = y.slice(0, splitIdx);
  const y_test = y.slice(splitIdx);

  // --- Train model ---
  const model = new RandomForestRegression({
    nEstimators: 100,
    maxFeatures: 1.0,
    seed: 42,
    useSampleBagging: true
  });

  model.train(X_train, y_train);

  // --- Evaluate ---
  const testPredictions = X_test.map(row => model.predict([row])[0]);
  const mae = meanAbsoluteError(y_test, testPredictions);

  // --- Future prediction ---
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  if (start > end) {
    throw new Error('start_date must be before or equal to end_date.');
  }

  let lastSales = rows[rows.length - 1].units_sold;
  let current = new Date(start);
  const results = [];

  while (current <= end) {
    const month = current.getMonth() + 1; // JS months are 0-indexed
    const season = getSeason(month);
    const avgTemp = getTemp(season);
    const rainDays = getRainDays(season);
    const { eventName, eventWindow, eventWeight } = getEventInfo(current);
    const seasonWeight = season === "summer" ? 0.95 : 0.7;

    // Encode with trained encoders
    let seasonEnc, eventNameEnc, eventWindowEnc;

    try {
      seasonEnc = encoders['season'].transform([season])[0];
    } catch {
      seasonEnc = 0;
    }
    try {
      eventNameEnc = encoders['event_name'].transform([eventName])[0];
    } catch {
      eventNameEnc = 0;
    }
    try {
      eventWindowEnc = encoders['event_window'].transform([eventWindow])[0];
    } catch {
      eventWindowEnc = 0;
    }

    const inputRow = [
      avgTemp,
      rainDays,
      eventName !== "none" ? 1 : 0, // promotion
      2600, // default price
      lastSales,
      seasonWeight,
      eventWeight,
      seasonEnc,
      eventNameEnc,
      eventWindowEnc
    ];

    const predictedSales = Math.round(model.predict([inputRow])[0]);

    results.push({
      week_date: current.toISOString().split('T')[0],
      season: season,
      event: eventName,
      event_window: eventWindow,
      predicted_sales: predictedSales
    });

    lastSales = predictedSales;
    current.setDate(current.getDate() + 7);
  }

  // --- Order quantity calculation ---
  const totalPredictedDemand = results.reduce((sum, r) => sum + r.predicted_sales, 0);

  const orderSummary = {
    total_predicted_demand: totalPredictedDemand,
    period_weeks: results.length,
    avg_weekly_demand: Math.round(totalPredictedDemand / results.length),
    safety_buffer_percent: safetyBufferPercent
  };

  // If item_id is provided, fetch current stock and compute order qty
  if (itemId) {
    const itemInfo = await getItemStock(itemId);

    if (itemInfo) {
      const currentStock = itemInfo.current_stock || 0;
      const safetyBuffer = Math.ceil(totalPredictedDemand * (safetyBufferPercent / 100));
      const demandWithBuffer = totalPredictedDemand + safetyBuffer;
      const orderQty = Math.max(0, demandWithBuffer - currentStock);

      orderSummary.item = {
        id: itemInfo.id,
        name: itemInfo.name,
        brand: itemInfo.brand,
        subcategory: itemInfo.subcategory,
        current_stock: currentStock,
        reorder_level: itemInfo.reorder_level
      };
      orderSummary.safety_buffer_units = safetyBuffer;
      orderSummary.demand_with_buffer = demandWithBuffer;
      orderSummary.recommended_order_quantity = orderQty;
      orderSummary.stock_after_order = currentStock + orderQty;
      orderSummary.stock_status = currentStock >= totalPredictedDemand
        ? 'SUFFICIENT'
        : currentStock >= totalPredictedDemand * 0.5
          ? 'LOW'
          : 'CRITICAL';
    } else {
      orderSummary.item = null;
      orderSummary.item_error = `Item with id ${itemId} not found in database`;
      // Still give order recommendation without stock adjustment
      const safetyBuffer = Math.ceil(totalPredictedDemand * (safetyBufferPercent / 100));
      orderSummary.recommended_order_quantity = totalPredictedDemand + safetyBuffer;
      orderSummary.safety_buffer_units = safetyBuffer;
    }
  } else {
    // No item_id — just recommend total demand + buffer
    const safetyBuffer = Math.ceil(totalPredictedDemand * (safetyBufferPercent / 100));
    orderSummary.recommended_order_quantity = totalPredictedDemand + safetyBuffer;
    orderSummary.safety_buffer_units = safetyBuffer;
  }

  return {
    model_mae: parseFloat(mae.toFixed(2)),
    total_predictions: results.length,
    order_summary: orderSummary,
    predictions: results
  };
}

module.exports = { trainAndPredict };
