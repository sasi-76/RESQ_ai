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
  // Groq (Ultra-fast LPU inference)
  GROQ: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    models: {
      fast:      'qwen/qwen3.8-27b',       // Fast, 131K ctx
      smart:     'openai/gpt-oss-20b',     // Efficient reasoning
      reasoning: 'openai/gpt-oss-120b',   // Flagship reasoning, 131K ctx
      vision:    'llama-3.2-90b-vision-preview',
    },
  },

  // Google Gemini
  GEMINI: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    models: {
      fast:      'gemini-2.5-flash',       // Fast, latest stable
      smart:     'gemini-2.5-pro',         // Best quality
      reasoning: 'gemini-2.5-pro',         // Reasoning/thinking
      vision:    'gemini-2.5-flash',       // Image + text
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
// REASONING HELPERS
// ============================================================================

/**
 * Strip <think>...</think> chain-of-thought block from DeepSeek-R1 / Gemini
 * Thinking responses so only the final answer text is returned.
 */
function stripThinkingTags(text) {
  if (!text) return text;
  // Remove <think> ... </think> blocks (possibly multiline)
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Strip markdown syntax so plain-text chat bubbles look clean.
 * Converts: **bold**, *italic*, # headers, --- rules, `code`, > quotes
 */
function stripMarkdown(text) {
  if (!text) return text;
  return text
    // Remove fenced code blocks (```...```)
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').trim())
    // Bold + italic (***text*** or ___text___)
    .replace(/\*{3}(.+?)\*{3}/g, '$1')
    .replace(/_{3}(.+?)_{3}/g, '$1')
    // Bold (**text** or __text__)
    .replace(/\*{2}(.+?)\*{2}/g, '$1')
    .replace(/_{2}(.+?)_{2}/g, '$1')
    // Italic (*text* or _text_) — only single
    .replace(/\*(.+?)\*/g, '$1')
    // Inline code (`code`)
    .replace(/`(.+?)`/g, '$1')
    // Headings (## Heading → Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Horizontal rules (--- or ***)
    .replace(/^[-*_]{3,}\s*$/gm, '─────────────────────')
    // Blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Trim extra blank lines (3+ → 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

/**
 * Call Groq with the DeepSeek-R1 reasoning model.
 * Automatically strips <think> chain-of-thought blocks from the response.
 */
export async function callGroqReasoning(prompt, systemPrompt = null, temperature = 0.6) {
  const apiKey = LLM_CONFIG.GROQ.apiKey;
  if (!apiKey) {
    throw new Error('GROQ API key not found in environment variables');
  }

  const modelName = LLM_CONFIG.GROQ.models.reasoning;

  const messages = [
    {
      role: 'system',
      content: systemPrompt ||
        'You are ResQ Copilot, an expert AI assistant specializing in disaster management and emergency response for Tamil Nadu, India. ' +
        'Provide clear, structured, and actionable answers. Be concise but thorough. ' +
        'Use relevant emojis to improve readability. Format responses with bullet points when listing items.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const response = await fetch(`${LLM_CONFIG.GROQ.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Reasoning API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    // Strip internal chain-of-thought before returning
    return stripThinkingTags(rawContent);
  } catch (error) {
    console.error('Groq Reasoning error:', error);
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
 * 7. Conversational AI for operators (standard)
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
 * 7b. Conversational AI using DeepSeek-R1 reasoning model
 * Provides deeper, more analytical responses for complex emergency queries.
 * Falls back to Gemini flash if Groq fails.
 */
export async function chatWithAIReasoning(message, contextData = {}) {
  const {
    disasters = [],
    teams = [],
    hospitals = [],
    sosBeacons = [],
    stats = {},
    completedMissions = [],
  } = contextData;

  const systemPrompt =
    'You are ResQ Copilot, an expert AI assistant specializing in disaster management and emergency response for Tamil Nadu, India. ' +
    'You have access to real-time operational data. Provide clear, structured, and actionable answers. ' +
    'Be concise but thorough. Use relevant emojis to improve readability. ' +
    'Format responses with bullet points when listing items. Never include raw JSON in your answer.';

  const contextBlock = `
=== LIVE OPERATIONAL DATA ===
Active Disasters: ${disasters.length}
${disasters.map(d => `  • ${d.type} at ${d.areaName} — Severity: ${d.severity}, Risk: ${d.riskPercent}%`).join('\n')}

Response Teams: ${teams.length} total
${teams.map(t => `  • ${t.name}: ${t.status} (${t.members} members)`).join('\n')}

Hospitals: ${hospitals.length} networked
${hospitals.map(h => `  • ${h.name}: ${h.ambulances || 0} ambulances, ${h.distance} km away`).join('\n')}

Pending SOS Signals: ${sosBeacons.filter(b => b.status === 'pending').length}
Overall Risk Index: ${stats.overallRiskPercent || 0}%
Completed Missions: ${completedMissions.length}
=== END DATA ===
`;

  const fullPrompt = `${contextBlock}\nOperator Query: ${message}`;

  // ── Level 1: DeepSeek-R1 on Groq ──────────────────────────────────────────
  try {
    console.log('[ResQ] Trying DeepSeek-R1 (Groq)...');
    const result = await callGroqReasoning(fullPrompt, systemPrompt, 0.6);
    console.log('[ResQ] GPT-OSS 120B succeeded ✓');
    return stripMarkdown(result);
  } catch (e1) {
    console.warn('[ResQ] GPT-OSS 120B failed:', e1.message);
  }

  // ── Level 2: Llama 3.3 70B on Groq ────────────────────────────────────────
  try {
    console.log('[ResQ] Trying Llama 3.3 70B (Groq)...');
    const apiKey = LLM_CONFIG.GROQ.apiKey;
    if (!apiKey) throw new Error('No Groq API key');
    const resp = await fetch(`${LLM_CONFIG.GROQ.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_CONFIG.GROQ.models.smart,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: fullPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });
    if (!resp.ok) throw new Error(`Groq ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    console.log('[ResQ] GPT-OSS 20B succeeded ✓');
    return stripMarkdown(data.choices[0].message.content);
  } catch (e2) {
    console.warn('[ResQ] GPT-OSS 20B failed:', e2.message);
  }

  // ── Level 3: Gemini 2.5 Flash ─────────────────────────────────────────────
  try {
    console.log('[ResQ] Trying Gemini 2.5 Flash...');
    const apiKey = LLM_CONFIG.GEMINI.apiKey;
    if (!apiKey) throw new Error('No Gemini API key');
    const resp = await fetch(
      `${LLM_CONFIG.GEMINI.baseUrl}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${fullPrompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );
    if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    console.log('[ResQ] Gemini 2.5 Flash succeeded ✓');
    return stripMarkdown(stripThinkingTags(data.candidates[0].content.parts[0].text));
  } catch (e3) {
    console.error('[ResQ] All providers failed. Last error:', e3.message);
    throw new Error('All AI providers failed. Open DevTools (F12 → Console) to see the exact errors.');
  }
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
// AI DECISION ENGINE — Real AI-powered disaster decisions for Admin Dashboard
// ============================================================================

/**
 * Analyze a disaster and generate a structured AI decision.
 * Used by the AI Admin Dashboard for real AI-powered decision-making.
 */
export async function analyzeDisasterWithAI(disaster, contextData = {}) {
  const {
    monitoredAreas = [],
    teams = [],
    hospitals = [],
  } = contextData;

  const availableTeams = teams.filter(t => t.status === 'standby');
  const nearbyHospitals = hospitals.slice(0, 5);

  const prompt = `
You are the AI Decision Engine for ResQAI, a disaster management system for Tamil Nadu, India.
Analyze this disaster event and produce a structured emergency response decision.

=== DISASTER EVENT ===
Type: ${disaster.type || 'Unknown'}
Area: ${disaster.areaName || 'Unknown'}
District: ${disaster.district || 'Unknown'}
Severity: ${disaster.severity || 'Unknown'}
Risk Level: ${disaster.riskPercent || 0}%
Coordinates: ${disaster.lat}, ${disaster.lng}
Description: ${disaster.description || 'No description'}
Timestamp: ${disaster.timestamp || new Date().toISOString()}

=== AVAILABLE RESOURCES ===
Standby Teams: ${availableTeams.length} (${availableTeams.map(t => t.name + ' - ' + t.members + ' members').join(', ') || 'None'})
Nearby Hospitals: ${nearbyHospitals.map(h => h.name + ' (' + (h.ambulances || 0) + ' ambulances)').join(', ') || 'None'}

=== INSTRUCTIONS ===
Provide your analysis as JSON with these exact fields:
{
  "decision": "One-line action statement (e.g., 'Deploy Alpha Response Unit for flood rescue in Cuddalore')",
  "confidence": <number 0-100>,
  "reasoning": "2-3 sentence explanation of why this decision was made, citing specific data points",
  "riskTrend": "increasing|decreasing|stable",
  "recommendedTeams": <number 1-5>,
  "estimatedAffectedPopulation": <number>,
  "priorityActions": ["action1", "action2", "action3"],
  "evacuationNeeded": true|false,
  "alertLevel": "P1|P2|P3|P4",
  "estimatedResponseTime": "e.g., 45 minutes"
}

Be specific to Tamil Nadu geography and disaster patterns. Base confidence on data completeness and disaster severity.
Return ONLY the JSON object, no extra text.
`;

  try {
    const response = await callLLM(prompt, { model: 'fast', temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        decision: parsed.decision || `Deploy response to ${disaster.areaName}`,
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
        reasoning: parsed.reasoning || 'AI analysis completed.',
        riskTrend: parsed.riskTrend || 'stable',
        recommendedTeams: Number(parsed.recommendedTeams) || 1,
        estimatedAffectedPopulation: Number(parsed.estimatedAffectedPopulation) || 10000,
        priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
        evacuationNeeded: Boolean(parsed.evacuationNeeded),
        alertLevel: parsed.alertLevel || 'P2',
        estimatedResponseTime: parsed.estimatedResponseTime || 'Unknown',
      };
    }
    return { success: false, raw: response };
  } catch (error) {
    console.error('AI Decision Engine error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Re-analyze a pending decision with updated context.
 */
export async function reanalyzeDecision(decision, contextData = {}) {
  const prompt = `
You are the AI Decision Engine for ResQAI. Re-evaluate this pending disaster decision with fresh analysis.

=== CURRENT DECISION ===
Area: ${decision.area}
Type: ${decision.type || 'disaster'}
Original Decision: ${decision.decision}
Original Confidence: ${decision.confidence}%
Original Reasoning: ${decision.reasoning}

=== INSTRUCTIONS ===
Provide an updated analysis as JSON:
{
  "decision": "Updated one-line action statement",
  "confidence": <number 0-100>,
  "reasoning": "Updated 2-3 sentence reasoning with current assessment",
  "riskTrend": "increasing|decreasing|stable",
  "recommendedTeams": <number 1-5>,
  "priorityActions": ["action1", "action2", "action3"],
  "evacuationNeeded": true|false,
  "alertLevel": "P1|P2|P3|P4"
}

Return ONLY the JSON object.
`;

  try {
    const response = await callLLM(prompt, { model: 'fast', temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        decision: parsed.decision || decision.decision,
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
        reasoning: parsed.reasoning || 'Re-analysis completed.',
        riskTrend: parsed.riskTrend || 'stable',
        recommendedTeams: Number(parsed.recommendedTeams) || 1,
        priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
        evacuationNeeded: Boolean(parsed.evacuationNeeded),
        alertLevel: parsed.alertLevel || 'P2',
      };
    }
    return { success: false, raw: response };
  } catch (error) {
    console.error('AI Re-analysis error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// AI FIELD TASK GENERATOR — LLM-powered task creation for approved decisions
// ============================================================================

/**
 * Generate detailed field tasks using AI when a decision is approved.
 * Returns structured task objects ready for the Field Tasks page.
 */
export async function generateFieldTasksWithAI(decision, contextData = {}) {
  const {
    teams = [],
    area = decision.area || 'Unknown',
    type = decision.type || 'disaster',
    alertLevel = decision.alertLevel || 'P2',
    deployedTeamNames = [],
  } = contextData;

  const prompt = `
You are the ResQAI Task Engine for Tamil Nadu disaster management.
An AI decision has been APPROVED by the controller. Generate detailed field tasks for the response teams.

=== APPROVED DECISION ===
Decision: ${decision.decision}
Area: ${area}
Disaster Type: ${type}
Alert Level: ${alertLevel}
AI Reasoning: ${decision.reasoning || 'N/A'}
Confidence: ${decision.confidence || 0}%
Estimated Affected Population: ${decision.affectedPopulation || 'Unknown'}
Evacuation Needed: ${decision.evacuationNeeded ? 'YES' : 'NO'}
Recommended Teams: ${decision.recommendedTeams || 1}

=== DEPLOYED TEAMS ===
${deployedTeamNames.length > 0 ? deployedTeamNames.join(', ') : 'No teams deployed yet'}

=== INSTRUCTIONS ===
Generate 3-5 detailed field tasks. Each task must be specific, actionable, and tailored to this exact disaster scenario in Tamil Nadu.

Return a JSON array of tasks:
[
  {
    "title": "Short clear task title (5-10 words, e.g., 'Evacuate low-lying Velachery households to relief camp')",
    "description": "Detailed 2-3 sentence description with specific instructions, locations, and expected outcomes",
    "category": "Evacuation|Medical|Relief|Infrastructure|Communication|Reconnaissance",
    "priority": "immediate|high|medium",
    "estimatedDuration": "e.g., 2 hours, 45 minutes",
    "personnelNeeded": <number>,
    "equipment": "specific equipment needed",
    "notes": "any special instructions or safety warnings"
  }
]

Rules:
- Use real Tamil Nadu area names and landmarks relevant to "${area}"
- First task should address the most urgent need
- If evacuation is needed, make it the first task
- Include at least one Medical and one Communication task
- Be specific about routes, shelters, hospitals, and equipment
- Return ONLY the JSON array, no extra text
`;

  try {
    const response = await callLLM(prompt, { model: 'fast', temperature: 0.4 });
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          success: true,
          tasks: parsed.map((t) => ({
            title: t.title || 'Unnamed Task',
            description: t.description || '',
            category: ['Evacuation', 'Medical', 'Relief', 'Infrastructure', 'Communication', 'Reconnaissance'].includes(t.category) ? t.category : 'Reconnaissance',
            priority: ['immediate', 'high', 'medium'].includes(t.priority) ? t.priority : 'medium',
            estimatedDuration: t.estimatedDuration || '',
            personnelNeeded: Number(t.personnelNeeded) || 0,
            equipment: t.equipment || '',
            notes: t.notes || '',
          })),
        };
      }
    }
    return { success: false, raw: response };
  } catch (error) {
    console.error('AI Field Task Generator error:', error);
    return { success: false, error: error.message };
  }
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
  callGroqReasoning,
  callGemini,
  callLLM,

  // AI Decision Engine
  analyzeDisasterWithAI,
  reanalyzeDecision,
  generateFieldTasksWithAI,

  // Disaster management use cases
  analyzeDisasterReport,
  generateAlert,
  summarizeWeatherBulletin,
  extractDisasterInfoFromText,
  recommendTeamDeployment,
  analyzeDisasterImagery,
  chatWithAI,
  chatWithAIReasoning,
  predictRiskEscalation,
  generateSituationReport,
  explainAIDecision,
  batchAnalyzeTexts,
};
