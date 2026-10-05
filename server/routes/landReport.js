/**
 * RESQAI Land & Soil Safety Report API
 * POST /api/land-report
 *
 * For home buyers and banks evaluating plots.
 * Returns a comprehensive report: soil quality, old lakebed detection,
 * flood risk, legal/RERA guidance, and overall land safety rating.
 * Price: ₹500–₹1,000 per report.
 */

const express = require('express');
const router = express.Router();
const { computeRiskScore, SOIL_DATABASE, FLOOD_ZONES, CHENNAI_LAKEBEDS } = require('../services/riskEngine');

// ── Report ID generator ───────────────────────────────────────────────────────
function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LSR-${ts}-${rand}`;
}

// ── POST /api/land-report ─────────────────────────────────────────────────────
// Body: { lat, lng, plotArea?, plotValue?, buyerName?, propertyAddress? }
router.post('/', async (req, res) => {
  const { lat, lng, plotArea, plotValue, buyerName, propertyAddress } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'lat and lng are required.' });
  }

  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);

  if (isNaN(latN) || isNaN(lngN)) {
    return res.status(400).json({ success: false, error: 'lat and lng must be numeric.' });
  }
  if (latN < 8.0 || latN > 14.0 || lngN < 76.0 || lngN > 81.0) {
    return res.status(400).json({ success: false, error: 'Coordinates outside Tamil Nadu bounds.' });
  }

  const t0 = Date.now();
  try {
    const riskData = await computeRiskScore(latN, lngN);
    const ms = Date.now() - t0;
    const report = buildLandReport(riskData, { lat: latN, lng: lngN, plotArea, plotValue, buyerName, propertyAddress, ms });

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/land-report (quick demo) ────────────────────────────────────────
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng query params required.' });
  }

  const t0 = Date.now();
  try {
    const riskData = await computeRiskScore(lat, lng);
    const ms = Date.now() - t0;
    const report = buildLandReport(riskData, { lat, lng, ms });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Report Builder ────────────────────────────────────────────────────────────
function buildLandReport(riskData, meta) {
  const { lat, lng, plotArea, plotValue, buyerName, propertyAddress, ms } = meta;
  const b = riskData.breakdown;
  const district = riskData.location.district;

  // ── Overall Land Safety Rating ────────────────────────────────────────────
  const score = riskData.riskScore;
  let safetyRating, safetyLabel, safetyColor, buyRecommendation;

  if (score <= 15) {
    safetyRating = 'AAA'; safetyLabel = 'Excellent – Safest Zone';
    safetyColor = 'green';
    buyRecommendation = 'SAFE TO BUY';
  } else if (score <= 25) {
    safetyRating = 'AA'; safetyLabel = 'Very Good – Minor Precautions';
    safetyColor = 'green';
    buyRecommendation = 'SAFE TO BUY';
  } else if (score <= 40) {
    safetyRating = 'A'; safetyLabel = 'Good – Standard Safeguards Apply';
    safetyColor = 'yellow';
    buyRecommendation = 'BUY WITH CONDITIONS';
  } else if (score <= 55) {
    safetyRating = 'B'; safetyLabel = 'Moderate Risk – Extra Precautions Needed';
    safetyColor = 'orange';
    buyRecommendation = 'PROCEED WITH CAUTION';
  } else if (score <= 70) {
    safetyRating = 'C'; safetyLabel = 'High Risk – Significant Concerns';
    safetyColor = 'red';
    buyRecommendation = 'NOT RECOMMENDED';
  } else {
    safetyRating = 'D'; safetyLabel = 'Extreme Risk – Dangerous Location';
    safetyColor = 'crimson';
    buyRecommendation = 'DO NOT BUY';
  }

  // ── Flood Assessment ──────────────────────────────────────────────────────
  const floodFindings = [];
  if (b.lakebed.isOnLakebed) {
    const lakes = b.lakebed.lakebeds || [];
    floodFindings.push({
      type: 'CRITICAL',
      title: 'Built on Encroached Lakebed',
      detail: `This plot overlaps with ${lakes.map(l => l.name).join(', ')}. Tamil Nadu's Supreme Court mandates restoration. Encroached lake beds are NOT legally purchasable and carry extreme flood risk during monsoons.`,
    });
  }
  if (b.floodZone.score >= 15) {
    floodFindings.push({ type: 'HIGH', title: 'High Flood Zone', detail: `Located in active flood zone. Previous flood events recorded within ${Math.min(5, b.floodZone.zones?.length || 0)} km. Expect annual waterlogging during heavy rain.` });
  } else if (b.floodZone.score >= 8) {
    floodFindings.push({ type: 'MODERATE', title: 'Moderate Flood Risk', detail: 'Property is near flood-prone areas. Seasonal risk during Northeast Monsoon (Oct–Dec). Proper drainage and elevated foundation recommended.' });
  } else {
    floodFindings.push({ type: 'LOW', title: 'Low Flood Risk', detail: 'No major flood zones within 5 km. Standard drainage provisions sufficient.' });
  }
  if (b.damProximity.score >= 15) {
    floodFindings.push({ type: 'HIGH', title: 'Near High-Capacity Dam', detail: `Within risk radius of ${b.damProximity.details?.[0]?.damName || 'a major dam'}. In a dam-break scenario, this area could be inundated within hours.` });
  }

  // ── Soil Assessment ───────────────────────────────────────────────────────
  const soilInfo = b.soil;
  const soilFindings = [];

  if (soilInfo.score >= 10) {
    soilFindings.push({ type: 'HIGH', title: 'Poor Soil Bearing Capacity', detail: `${soilInfo.soilType}. High risk of settlement and foundation failure. Requires deep pile foundation (min 15m). Construction cost 40–60% higher than normal.` });
  } else if (soilInfo.score >= 6) {
    soilFindings.push({ type: 'MODERATE', title: 'Moderate Soil Conditions', detail: `${soilInfo.soilType}. ${soilInfo.description} Raft foundation or deep footings recommended.` });
  } else {
    soilFindings.push({ type: 'LOW', title: 'Good Soil Conditions', detail: `${soilInfo.soilType}. ${soilInfo.description} Standard strip or isolated footings suitable.` });
  }

  // Water table info
  soilFindings.push({
    type: soilInfo.score >= 9 ? 'HIGH' : soilInfo.score >= 5 ? 'MODERATE' : 'INFO',
    title: `Water Table: ${soilInfo.waterTable}`,
    detail: soilInfo.waterTable.includes('High') || soilInfo.waterTable.includes('Very High')
      ? 'High water table increases risk of basement flooding and dampness. Waterproofing mandatory. Borewells may have salinity issues.'
      : 'Water table is at a manageable depth. Standard waterproofing for basements sufficient.',
  });

  // ── Coastal/Seismic ───────────────────────────────────────────────────────
  const otherFindings = [];
  if (b.coastal.score >= 7) {
    otherFindings.push({ type: 'HIGH', title: `Coastal Risk: ${b.coastal.coastalExposure}`, detail: `~${b.coastal.distanceToCoastKm} km from coast. Cyclone exposure is significant. Structures must follow Coastal Regulation Zone (CRZ) norms. Corrosion of RCC structures is accelerated.` });
  }
  if (b.earthquake.score >= 6) {
    otherFindings.push({ type: 'MODERATE', title: `Seismic Zone ${b.earthquake.seismicZone}`, detail: `${b.earthquake.zoneLabel}. Earthquake-resistant design (IS 13920) is mandatory. Ensure builder follows seismic detailing in columns, beams, and joints.` });
  }
  if (b.weather.score >= 8) {
    otherFindings.push({ type: 'MODERATE', title: 'Adverse Weather Pattern', detail: `Current weather analysis shows elevated rainfall/wind forecast. ${b.weather.details?.forecastRainfall7d ? `7-day forecast: ${b.weather.details.forecastRainfall7d} mm rainfall.` : ''}` });
  }

  // ── Legal / RERA Guidance ─────────────────────────────────────────────────
  const legalAdvisory = buildLegalAdvisory(b, district);

  // ── Construction Recommendations ──────────────────────────────────────────
  const constructionRecommendations = buildConstructionRecommendations(b, soilInfo);

  // ── Loan Eligibility Hint ─────────────────────────────────────────────────
  let loanNote = null;
  if (plotValue) {
    const val = parseFloat(plotValue);
    if (!isNaN(val)) {
      let loanRatio, loanNote_detail;
      if (score <= 25) {
        loanRatio = 0.80;
        loanNote_detail = 'Standard LTV. Banks typically offer up to 80% for low-risk plots.';
      } else if (score <= 45) {
        loanRatio = 0.70;
        loanNote_detail = 'Moderate risk. Banks may limit LTV to 70%. Demand soil test report.';
      } else if (score <= 65) {
        loanRatio = 0.55;
        loanNote_detail = 'High risk. Banks heavily scrutinize. LTV reduced to 55%. Requires additional collateral.';
      } else {
        loanRatio = 0;
        loanNote_detail = 'Extreme risk. Most banks will reject home loan application for this plot.';
      }
      loanNote = {
        estimatedLoanAmount: Math.round(val * loanRatio),
        estimatedLTV: `${Math.round(loanRatio * 100)}%`,
        note: loanNote_detail,
      };
    }
  }

  return {
    reportId: generateReportId(),
    generatedAt: new Date().toISOString(),
    computeTimeMs: ms,
    subject: {
      lat, lng,
      district: district.charAt(0).toUpperCase() + district.slice(1),
      elevation: riskData.location.elevation ? `${Math.round(riskData.location.elevation)} m ASL` : 'Unknown',
      propertyAddress: propertyAddress || null,
      plotAreaSqFt: plotArea || null,
      declaredValueINR: plotValue || null,
      buyerName: buyerName || null,
    },
    verdict: {
      safetyRating,
      safetyLabel,
      safetyColor,
      riskScore: score,
      riskGrade: riskData.riskGrade,
      buyRecommendation,
      floodZoneClass: riskData.floodZoneClass,
      summary: buildVerdictSummary(score, b, district),
    },
    sections: {
      flood: { title: 'Flood & Water Risk', findings: floodFindings },
      soil:  { title: 'Soil & Foundation Assessment', findings: soilFindings },
      other: { title: 'Other Geological & Environmental Risks', findings: otherFindings },
      legal: { title: 'Legal & Regulatory Advisory', advisories: legalAdvisory },
      construction: { title: 'Construction Recommendations', recommendations: constructionRecommendations },
    },
    loanHint: loanNote,
    rawScores: {
      damProximity:   { score: b.damProximity.score,   max: 25 },
      floodZone:      { score: b.floodZone.score,      max: 20 },
      lakebed:        { score: b.lakebed.score,         max: 15 },
      earthquake:     { score: b.earthquake.score,     max: 15 },
      weather:        { score: b.weather.score,        max: 15 },
      soil:           { score: b.soil.score,           max: 12 },
      coastal:        { score: b.coastal.score,        max: 10 },
      infrastructure: { score: b.infrastructure.score, max: 10 },
    },
    disclaimer: 'This report is based on publicly available geospatial data, RESQAI dam telemetry, Open-Meteo weather forecasts, USGS seismic data, and BIS soil classifications. It is advisory in nature. Buyers should also obtain an independent soil test (IS 2131) and structural engineer assessment before purchase. RESQAI is not liable for financial decisions made solely on this report.',
    poweredBy: 'RESQAI Risk Engine v1.0 — Tamil Nadu Flood & Disaster Intelligence Platform',
  };
}

function buildVerdictSummary(score, b, district) {
  const parts = [];
  if (b.lakebed.isOnLakebed) parts.push('plot is on an encroached lakebed');
  if (b.floodZone.score >= 12) parts.push('located in a high flood zone');
  if (b.damProximity.score >= 12) parts.push('within dam-break risk radius');
  if (b.soil.score >= 9) parts.push('poor soil bearing capacity');
  if (b.coastal.score >= 7) parts.push('significant coastal exposure');
  if (b.earthquake.score >= 8) parts.push('elevated seismic zone');

  if (parts.length === 0) {
    return `This plot in ${district} district shows low overall risk. Soil, flood, and seismic conditions are within acceptable limits for residential or commercial construction.`;
  }
  return `RESQAI has identified ${parts.length} major concern(s) for this plot in ${district}: ${parts.join(', ')}. Combined risk score is ${score}/100. Detailed findings are listed below.`;
}

function buildLegalAdvisory(b, district) {
  const advisories = [];

  if (b.lakebed.isOnLakebed) {
    advisories.push({
      type: 'CRITICAL',
      authority: 'Tamil Nadu Water Bodies Act & Supreme Court',
      title: 'Encroached Lakebed — ILLEGAL PURCHASE',
      detail: 'Properties on encroached lake beds cannot be legally sold per Tamil Nadu Water Bodies Conservation Act, 2007. Verify EC (Encumbrance Certificate) and Survey of India maps. Do NOT purchase without legal clearance.',
    });
  }

  if (b.coastal.score >= 5) {
    advisories.push({
      type: 'HIGH',
      authority: 'MoEFCC / Coastal Regulation Zone Rules 2019',
      title: 'CRZ Compliance Required',
      detail: `Coastal zone property. Verify CRZ classification (CRZ-I, II, III, or IV). Construction within 200m of HTL (High Tide Line) is restricted. Obtain NOC from Tamil Nadu Coastal Zone Management Authority before construction.`,
    });
  }

  advisories.push({
    type: 'INFO',
    authority: 'Tamil Nadu RERA',
    title: 'RERA Registration Check',
    detail: 'Verify builder/developer RERA registration at tnrera.in. For any project with >8 apartments or >500 sqm, RERA registration is mandatory under RERA Act, 2016.',
  });

  advisories.push({
    type: 'INFO',
    authority: 'DTCP / Local Municipality',
    title: 'Building Plan Approval',
    detail: 'Verify planning permission from CMDA (Chennai) or DTCP (other districts). Check if land is in approved layout per local development plan. Avoid unapproved panchayat layouts.',
  });

  if (b.floodZone.score >= 10 || b.lakebed.isOnLakebed) {
    advisories.push({
      type: 'HIGH',
      authority: 'NDMA / TN SDMA',
      title: 'Flood Plain Regulation',
      detail: 'Check if plot falls within designated flood plain under NDMA guidelines. Construction on flood plains requires special clearance. Ground Floor levels must be above maximum flood level.',
    });
  }

  return advisories;
}

function buildConstructionRecommendations(b, soilInfo) {
  const recs = [];

  // Foundation type
  if (soilInfo.score >= 10) {
    recs.push({ priority: 'CRITICAL', category: 'Foundation', recommendation: 'Deep pile foundation (bored/driven piles, min 15m depth) mandatory. Conduct IS 2131 soil investigation before design. Hire a licensed geotechnical engineer.' });
  } else if (soilInfo.score >= 6) {
    recs.push({ priority: 'HIGH', category: 'Foundation', recommendation: 'Raft foundation or well foundation recommended. Conduct standard plate load test. Minimum 600mm wide strip footing at 1.5m depth.' });
  } else {
    recs.push({ priority: 'STANDARD', category: 'Foundation', recommendation: 'Standard isolated or strip footing adequate. Minimum 900mm depth below natural ground level.' });
  }

  // Waterproofing
  if (soilInfo.waterTable?.includes('High') || soilInfo.waterTable?.includes('Very High') || b.lakebed?.isOnLakebed) {
    recs.push({ priority: 'CRITICAL', category: 'Waterproofing', recommendation: 'Crystalline waterproofing (Xypex/Kryton) mandatory on all below-grade surfaces. No basements recommended. Terrace waterproofing with thermal insulation.' });
  } else {
    recs.push({ priority: 'STANDARD', category: 'Waterproofing', recommendation: 'Standard cement-based waterproofing for terraces. Bituminous coating for external walls below plinth.' });
  }

  // Seismic
  if (b.earthquake.score >= 5) {
    recs.push({ priority: 'HIGH', category: 'Seismic Design', recommendation: `IS 13920 ductile detailing mandatory (Zone ${b.earthquake.seismicZone}). Use M25 concrete minimum. Column ties spacing ≤ 150mm in confinement zones. Consult a licensed structural engineer.` });
  }

  // Coastal
  if (b.coastal.score >= 5) {
    recs.push({ priority: 'HIGH', category: 'Corrosion Protection', recommendation: 'Use M30 concrete (min) with sulphate-resistant cement. Cover to reinforcement: 50mm (external). Epoxy-coated TMT bars for coastal exposure. Annual structural inspection recommended.' });
  }

  // Plinth
  if (b.floodZone.score >= 8 || b.lakebed?.isOnLakebed) {
    recs.push({ priority: 'HIGH', category: 'Plinth Level', recommendation: 'Raise plinth level minimum 600mm–900mm above road level. Ensure site grading slopes away from building. Construct boundary wall with proper drainage weep holes.' });
  }

  return recs;
}

module.exports = router;
