/**
 * LLM Integration Service for Disaster Management
 * Supports: Groq, Gemini, OpenAI
 *
 * Use Cases:
 * - Analyze unstructured disaster reports
 * - Process news articles for early warning
 * - Generate natural language alerts
 * - Summarize weather bulletins
 * - Extract disaster info from social media
 * - Conversational AI for operators
 */

// ============================================================================
// API CONFIGURATION
// ============================================================================

const LLM_CONFIG = {
  // Groq (Ultra-fast inference)
  GROQ: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    models: {
      fast: 'llama-3.1-70b-versatile', // Fast, good quality
      smart: 'llama-3.3-70b-versatile', // Best reasoning
      vision: 'llama-3.2-90b-vision-preview', // Image analysis
    },
  },

  // Google Gemini
  GEMINI: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    models: {
      fast: 'gemini-1.5-flash', // Fast, efficient
      smart: 'gemini-1.5-pro', // Best quality
      vision: 'gemini-1.5-pro-vision', // Image + text
    },
  },

  // OpenAI (Optional backup)
  OPENAI: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    models: {
      fast: 'gpt-4o-mini',
      smart: 'gpt-4o',
    },
  },
};

// ============================================================================
// GROQ LLM FUNCTIONS
// ============================================================================

/**
 * Call Groq API for fast LLM inference
 */
export async function callGroq(prompt, model = 'fast', temperature = 0.7) {
  const apiKey = LLM_CONFIG.GROQ.apiKey;
  if (!apiKey) {
    throw new Error('GROQ API key not found in environment variables');
  }

  const modelName = LLM_CONFIG.GROQ.models[model] || LLM_CONFIG.GROQ.models.fast;

  try {
    const response = await fetch(`${LLM_CONFIG.GROQ.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in disaster management and emergency response. Provide clear, accurate, and actionable information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

// ============================================================================
// GEMINI LLM FUNCTIONS
// ============================================================================

/**
 * Call Google Gemini API
 */
export async function callGemini(prompt, model = 'fast', temperature = 0.7) {
  const apiKey = LLM_CONFIG.GEMINI.apiKey;
  if (!apiKey) {
    throw new Error('GEMINI API key not found in environment variables');
  }

  const modelName = LLM_CONFIG.GEMINI.models[model] || LLM_CONFIG.GEMINI.models.fast;

  try {
    const response = await fetch(
      `${LLM_CONFIG.GEMINI.baseUrl}/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI assistant specialized in disaster management and emergency response. Provide clear, accurate, and actionable information.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// ============================================================================
// UNIFIED LLM FUNCTION (Auto-select available API)
// ============================================================================

/**
 * Call LLM with automatic fallback
 * Tries: Groq -> Gemini -> Error
 */
export async function callLLM(prompt, options = {}) {
  const { provider = 'groq', model = 'fast', temperature = 0.7 } = options;

  try {
    if (provider === 'groq' && LLM_CONFIG.GROQ.apiKey) {
      return await callGroq(prompt, model, temperature);
    } else if (provider === 'gemini' && LLM_CONFIG.GEMINI.apiKey) {
      return await callGemini(prompt, model, temperature);
    } else {
      // Try fallback
      if (LLM_CONFIG.GROQ.apiKey) {
        return await callGroq(prompt, model, temperature);
      } else if (LLM_CONFIG.GEMINI.apiKey) {
        return await callGemini(prompt, model, temperature);
      } else {
        throw new Error('No LLM API key configured. Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY to .env');
      }
    }
  } catch (error) {
    console.error('LLM call failed:', error);
    throw error;
  }
}

// ============================================================================
// DISASTER MANAGEMENT USE CASES
// ============================================================================

/**
 * 1. Analyze unstructured disaster report
 */
export async function analyzeDisasterReport(reportText) {
  const prompt = `
Analyze this disaster report and extract key information:

Report:
"""
${reportText}
"""

Extract and provide in JSON format:
{
  "disasterType": "flood/cyclone/earthquake/fire/other",
  "severity": "low/medium/high/critical",
  "location": "specific location mentioned",
  "casualties": "number or estimated range",
  "infrastructure": "affected infrastructure",
  "urgentNeeds": ["list of immediate needs"],
  "recommendedActions": ["list of recommended actions"]
}
`;

  const response = await callLLM(prompt, { temperature: 0.3 });

  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw: response };
  } catch (error) {
    return { raw: response };
  }
}

/**
 * 2. Generate natural language alert from data
 */
export async function generateAlert(areaData) {
  const prompt = `
You are generating an emergency alert for the public.

Area: ${areaData.areaName}
Risk Level: ${areaData.riskPercent}%
Weather Conditions:
- Rainfall: ${areaData.rainfall}mm
- Wind Speed: ${areaData.windSpeed} km/h
- Water Level: ${areaData.waterLevel}m (Danger level: ${areaData.dangerLevel}m)

Generate a clear, concise public alert message (max 200 words) that:
1. States the hazard type and severity
2. Explains the immediate risks
3. Provides 3-4 specific safety actions
4. Mentions emergency contact: 112

Format: Plain text, urgent but not panic-inducing tone.
`;

  return await callLLM(prompt, { temperature: 0.7 });
}

/**
 * 3. Summarize weather bulletin
 */
export async function summarizeWeatherBulletin(bulletin) {
  const prompt = `
Summarize this weather bulletin for emergency operators. Focus on actionable threats.

Bulletin:
"""
${bulletin}
"""

Provide:
1. Key threats (1 sentence each)
2. Affected areas
3. Timeline
4. Recommended preparedness actions
`;

  return await callLLM(prompt, { temperature: 0.5 });
}

/**
 * 4. Extract disaster info from news/social media
 */
export async function extractDisasterInfoFromText(text) {
  const prompt = `
Extract disaster-related information from this text:

Text:
"""
${text}
"""

Identify:
- Is this about a disaster? (yes/no)
- If yes, what type?
- Location mentioned?
- Severity indicators?
- Any numbers (casualties, affected people)?
- Credibility: high/medium/low (based on specificity and detail)

Format as JSON:
{
  "isDisaster": true/false,
  "type": "disaster type",
  "location": "location",
  "severity": "low/medium/high",
  "details": "brief summary",
  "credibility": "high/medium/low"
}
`;

  const response = await callLLM(prompt, { temperature: 0.3 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw: response };
  } catch (error) {
    return { raw: response };
  }
}

/**
 * 5. Recommend team deployment based on situation
 */
export async function recommendTeamDeployment(situation) {
  const prompt = `
Based on this situation, recommend optimal RESQ team deployment:

Situation:
- Area: ${situation.area}
- Disaster Type: ${situation.disasterType}
- Severity: ${situation.severity}
- Population Affected: ${situation.population}
- Access Issues: ${situation.accessIssues || 'None'}

Available teams:
1. Alpha Response Unit (12 members) - Water rescue, boats, medical
2. Bravo Medical Team (8 members) - Ambulances, medical supplies
3. Charlie Search Unit (10 members) - Search dogs, thermal camera
4. Delta Relief Squad (15 members) - Relief supplies, tents, food
5. Echo Aerial Unit (6 members) - Drones, aerial surveillance

Recommend:
1. Which teams to deploy
2. Priority order
3. Estimated personnel needed
4. Special equipment required
5. Estimated response time

Format as structured list.
`;

  return await callLLM(prompt, { temperature: 0.5 });
}

/**
 * 6. Analyze satellite/drone imagery (if using vision models)
 */
export async function analyzeDisasterImagery(imageBase64, context) {
  // Note: Requires vision model support
  // For Groq: llama-3.2-90b-vision-preview
  // For Gemini: gemini-1.5-pro-vision

  const prompt = `
Analyze this disaster imagery and identify:
1. Type of disaster visible
2. Severity assessment
3. Affected infrastructure
4. Accessibility of area
5. Urgent needs visible

Context: ${context}
`;

  // This is a simplified example - actual vision API calls need different structure
  // Would need to send image data properly formatted
  console.log('Vision analysis would be performed here with:', prompt);
  return 'Vision analysis feature - implement based on provider';
}

/**
 * 7. Conversational AI for operators
 */
export async function chatWithAI(message, conversationHistory = []) {
  const historyText = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const prompt = `
You are an AI assistant helping emergency operators during disaster response.

Conversation history:
${historyText}

Operator: ${message}

Provide helpful, accurate information. If you need more details, ask clarifying questions.
`;

  return await callLLM(prompt, { temperature: 0.8 });
}

/**
 * 8. Predict risk escalation
 */
export async function predictRiskEscalation(historicalData, currentData) {
  const prompt = `
Based on this data, predict if the risk will escalate:

Historical pattern:
${JSON.stringify(historicalData, null, 2)}

Current conditions:
${JSON.stringify(currentData, null, 2)}

Analyze:
1. Is risk increasing or decreasing?
2. What's the likely peak risk level?
3. When might it occur?
4. What factors are driving the change?
5. Confidence level in prediction (0-100%)

Format as JSON:
{
  "trend": "increasing/decreasing/stable",
  "peakRisk": 85,
  "estimatedPeakTime": "2 hours",
  "drivingFactors": ["factor1", "factor2"],
  "confidence": 85
}
`;

  const response = await callLLM(prompt, { model: 'smart', temperature: 0.3 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw: response };
  } catch (error) {
    return { raw: response };
  }
}

/**
 * 9. Generate situation report
 */
export async function generateSituationReport(allAreasData) {
  const prompt = `
Generate a comprehensive situation report based on this data:

${JSON.stringify(allAreasData, null, 2)}

Create a report with:
1. Executive Summary (2-3 sentences)
2. Current Status (by area, prioritized by risk)
3. Active Hazards
4. Resources Deployed
5. Immediate Recommendations
6. Next 6-hour Forecast

Format as markdown for easy reading.
`;

  return await callLLM(prompt, { model: 'smart', temperature: 0.6 });
}

/**
 * 10. Explain AI decision to operators
 */
export async function explainAIDecision(decision, data) {
  const prompt = `
Explain this AI decision in simple terms for emergency operators:

Decision: ${decision.action}
Confidence: ${decision.confidence}%
Data used: ${JSON.stringify(data, null, 2)}

Explain:
1. Why did the AI make this decision? (in plain English)
2. What data points were most important?
3. What could go wrong if we don't follow this recommendation?
4. What should operators monitor next?

Keep explanation under 150 words.
`;

  return await callLLM(prompt, { temperature: 0.6 });
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process multiple texts in parallel (e.g., monitoring social media)
 */
export async function batchAnalyzeTexts(texts, maxConcurrent = 5) {
  const results = [];

  for (let i = 0; i < texts.length; i += maxConcurrent) {
    const batch = texts.slice(i, i + maxConcurrent);
    const promises = batch.map(text => extractDisasterInfoFromText(text));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Small delay to avoid rate limiting
    if (i + maxConcurrent < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
  // Core LLM functions
  callGroq,
  callGemini,
  callLLM,

  // Disaster management use cases
  analyzeDisasterReport,
  generateAlert,
  summarizeWeatherBulletin,
  extractDisasterInfoFromText,
  recommendTeamDeployment,
  analyzeDisasterImagery,
  chatWithAI,
  predictRiskEscalation,
  generateSituationReport,
  explainAIDecision,
  batchAnalyzeTexts,
};
