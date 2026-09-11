# 🤖 LLM Integration Guide for RESQAI

## Overview

RESQAI now supports **Large Language Models (LLMs)** to intelligently process disaster data, generate alerts, and assist emergency operators. Supports **Groq** (ultra-fast) and **Gemini** (Google AI).

---

## 🎯 Why Use LLMs in Disaster Management?

### **10 Powerful Use Cases:**

1. **Analyze Unstructured Reports** - Extract key info from text reports
2. **Generate Natural Language Alerts** - Create public-friendly warnings
3. **Summarize Weather Bulletins** - Condense technical reports
4. **Monitor Social Media** - Detect disasters from Twitter/news
5. **Recommend Team Deployment** - Optimize resource allocation
6. **Analyze Imagery** - Assess damage from satellite/drone photos
7. **Conversational AI** - Chat assistant for operators
8. **Predict Risk Escalation** - Forecast if situation will worsen
9. **Generate Situation Reports** - Auto-create status reports
10. **Explain AI Decisions** - Make AI transparent to humans

---

## 🚀 Quick Start

### Step 1: Get API Keys (FREE)

#### **Option A: Groq (Recommended - Fast & Free)**
1. Go to: https://console.groq.com
2. Sign up (free account)
3. Create API key
4. Copy key

**Pricing:** FREE tier includes generous quota  
**Speed:** Extremely fast (300+ tokens/second)  
**Models:** Llama 3.1 70B, Llama 3.2 90B Vision

#### **Option B: Google Gemini (Free Tier)**
1. Go to: https://ai.google.dev
2. Get API key
3. Copy key

**Pricing:** FREE tier: 15 requests/minute  
**Models:** Gemini 1.5 Flash (fast), Gemini 1.5 Pro (smart)

### Step 2: Add to .env File

Create/edit `C:\Users\tamil\Desktop\cit\.env`:

```bash
# Groq API (Recommended)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Google Gemini API (Alternative)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Both can be used - system will auto-fallback
```

### Step 3: Restart Server

```bash
# Stop server: Ctrl+C
npm run dev
```

### Step 4: Test LLM

Open browser console (F12) and run:

```javascript
import('./src/services/llmIntegration.js').then(mod => {
  mod.callLLM('Explain what causes floods in Tamil Nadu').then(response => {
    console.log('LLM Response:', response);
  });
});
```

---

## 📚 Complete Function Reference

### 1. **Analyze Disaster Report**

Extract structured data from unstructured text:

```javascript
import { analyzeDisasterReport } from '../services/llmIntegration';

const report = `
Heavy rainfall in Cuddalore district has caused severe flooding. 
Water levels have risen 2 meters above normal. Approximately 5,000 
people are affected. Roads are impassable. Need immediate rescue 
boats and medical supplies.
`;

const analysis = await analyzeDisasterReport(report);

console.log(analysis);
// Output:
// {
//   disasterType: "flood",
//   severity: "high",
//   location: "Cuddalore district",
//   casualties: "5,000 people affected",
//   infrastructure: "Roads impassable",
//   urgentNeeds: ["rescue boats", "medical supplies"],
//   recommendedActions: ["Deploy water rescue teams", "Evacuate low-lying areas"]
// }
```

### 2. **Generate Public Alert**

Create natural language alerts:

```javascript
import { generateAlert } from '../services/llmIntegration';

const areaData = {
  areaName: 'Cuddalore',
  riskPercent: 76,
  rainfall: 145,
  windSpeed: 65,
  waterLevel: 4.8,
  dangerLevel: 6.0,
};

const alert = await generateAlert(areaData);

console.log(alert);
// Output:
// "FLOOD WARNING FOR CUDDALORE
//  
// Heavy rainfall (145mm) and rising water levels pose an immediate 
// flood risk. Water is at 4.8m and approaching danger level.
//
// SAFETY ACTIONS:
// 1. Move to higher ground immediately
// 2. Avoid flooded areas and roads
// 3. Keep emergency kit ready
// 4. Call 112 for emergencies
//
// Stay informed through official channels."
```

### 3. **Summarize Weather Bulletin**

Condense technical reports:

```javascript
import { summarizeWeatherBulletin } from '../services/llmIntegration';

const bulletin = `
Meteorological Bulletin No. 245
Date: 11-Sep-2026
Low pressure area over Bay of Bengal intensifying into depression.
Wind speed: 55-65 kmph gusting to 75 kmph
Rainfall: Heavy to very heavy (115-204mm) expected in coastal districts
Sea condition: Rough to very rough
Warnings: Orange alert for Cuddalore, Chidambaram, Puducherry
`;

const summary = await summarizeWeatherBulletin(bulletin);
```

### 4. **Extract Disaster Info from Social Media**

Monitor Twitter/news for early warnings:

```javascript
import { extractDisasterInfoFromText } from '../services/llmIntegration';

const tweet = "Heavy flooding near Cuddalore bus stand. Water up to waist level. Many cars stuck. #CuddaloreFloods";

const info = await extractDisasterInfoFromText(tweet);

console.log(info);
// {
//   isDisaster: true,
//   type: "flood",
//   location: "Cuddalore bus stand",
//   severity: "high",
//   details: "Waist-level water, vehicles stuck",
//   credibility: "medium"
// }
```

### 5. **Recommend Team Deployment**

AI-powered resource allocation:

```javascript
import { recommendTeamDeployment } from '../services/llmIntegration';

const situation = {
  area: 'Cuddalore',
  disasterType: 'flood',
  severity: 'high',
  population: 173676,
  accessIssues: 'Roads flooded, only boat access',
};

const recommendation = await recommendTeamDeployment(situation);
// Returns detailed deployment plan with teams, equipment, timeline
```

### 6. **Conversational AI Assistant**

Chat with AI for help:

```javascript
import { chatWithAI } from '../services/llmIntegration';

const response = await chatWithAI(
  "What should I do if we receive reports of collapsed buildings?",
  [
    { role: 'operator', content: 'We have flooding in Cuddalore' },
    { role: 'ai', content: 'I see. What is the current water level?' },
    { role: 'operator', content: '4.8 meters and rising' },
  ]
);
```

### 7. **Predict Risk Escalation**

Forecast if situation will worsen:

```javascript
import { predictRiskEscalation } from '../services/llmIntegration';

const prediction = await predictRiskEscalation(
  { pastRisks: [45, 52, 58, 65] }, // Historical trend
  { currentRisk: 76, rainfall: 145, windSpeed: 65 } // Current
);

console.log(prediction);
// {
//   trend: "increasing",
//   peakRisk: 85,
//   estimatedPeakTime: "2 hours",
//   drivingFactors: ["Heavy rainfall continuing", "Water level rising"],
//   confidence: 85
// }
```

### 8. **Generate Situation Report**

Auto-create status reports:

```javascript
import { generateSituationReport } from '../services/llmIntegration';

const report = await generateSituationReport(allAreasData);
// Returns markdown-formatted comprehensive report
```

### 9. **Explain AI Decision**

Make AI transparent:

```javascript
import { explainAIDecision } from '../services/llmIntegration';

const decision = {
  action: 'Deploy RESQ-01 Alpha to Cuddalore',
  confidence: 94,
};

const explanation = await explainAIDecision(decision, areaData);
// Returns plain-English explanation of why AI made this decision
```

### 10. **Batch Process Multiple Texts**

Analyze many social media posts at once:

```javascript
import { batchAnalyzeTexts } from '../services/llmIntegration';

const tweets = [
  "Flooding near Cuddalore market...",
  "Strong winds in Chidambaram...",
  "Power outage in Panruti...",
];

const results = await batchAnalyzeTexts(tweets);
// Returns array of extracted disaster info
```

---

## 🎮 Complete Example: AI-Enhanced Dashboard

```javascript
import { useEffect, useState } from 'react';
import { 
  generateAlert, 
  predictRiskEscalation,
  generateSituationReport 
} from '../services/llmIntegration';

function AIDashboard() {
  const [aiAlert, setAiAlert] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate AI alert when risk increases
  const handleGenerateAlert = async (areaData) => {
    setIsLoading(true);
    try {
      const alert = await generateAlert(areaData);
      setAiAlert(alert);
    } catch (error) {
      console.error('Error generating alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Predict risk escalation
  const handlePredictRisk = async () => {
    const prediction = await predictRiskEscalation(
      historicalData,
      currentData
    );
    setPrediction(prediction);
  };

  return (
    <div>
      <button onClick={handleGenerateAlert}>
        🤖 Generate AI Alert
      </button>

      {aiAlert && (
        <div className="ai-alert">
          <h3>AI-Generated Alert</h3>
          <p>{aiAlert}</p>
        </div>
      )}

      {prediction && (
        <div className="ai-prediction">
          <h3>Risk Prediction</h3>
          <p>Trend: {prediction.trend}</p>
          <p>Peak Risk: {prediction.peakRisk}%</p>
          <p>Confidence: {prediction.confidence}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔥 Real-World Use Case: Social Media Monitoring

Monitor Twitter for disaster reports:

```javascript
import { extractDisasterInfoFromText, batchAnalyzeTexts } from '../services/llmIntegration';

// Simulated Twitter stream
const tweets = [
  "Major flooding in Cuddalore! Water entering homes. #TamilNaduFloods",
  "Strong winds damaged my roof in Chidambaram. Power lines down.",
  "Anyone have info on road conditions to Panruti? Hearing about flooding",
  "Beautiful sunset today in Chennai 🌅", // Not disaster-related
];

// Analyze all tweets
const results = await batchAnalyzeTexts(tweets);

// Filter for actual disasters
const disasters = results.filter(r => r.isDisaster && r.credibility !== 'low');

console.log('Detected disasters:', disasters);

// Auto-create alerts for high-credibility reports
disasters
  .filter(d => d.credibility === 'high' && d.severity === 'high')
  .forEach(d => {
    console.log(`⚠️ Alert: ${d.type} in ${d.location}`);
  });
```

---

## ⚡ Performance & Cost

### **Groq (Recommended)**
- **Speed:** 300+ tokens/second (3-5x faster than OpenAI)
- **Cost:** FREE tier is generous
- **Models:** Llama 3.1 70B, Llama 3.2 90B
- **Best for:** Real-time responses, high volume

### **Google Gemini**
- **Speed:** Fast (similar to GPT-4)
- **Cost:** FREE tier: 15 requests/minute
- **Models:** Gemini 1.5 Flash, Gemini 1.5 Pro
- **Best for:** Complex analysis, vision tasks

### **Cost Comparison (Example)**
Analyzing 1,000 disaster reports:
- **Groq:** ~$0 (within free tier)
- **OpenAI GPT-4:** ~$30
- **Gemini:** ~$0 (within free tier)

---

## 🛡️ Best Practices

### 1. **Cache Responses**
```javascript
const cache = new Map();

async function cachedLLMCall(prompt) {
  if (cache.has(prompt)) return cache.get(prompt);
  const response = await callLLM(prompt);
  cache.set(prompt, response);
  return response;
}
```

### 2. **Rate Limiting**
```javascript
import pLimit from 'p-limit';
const limit = pLimit(5); // Max 5 concurrent calls

const promises = texts.map(text => 
  limit(() => extractDisasterInfoFromText(text))
);
const results = await Promise.all(promises);
```

### 3. **Error Handling**
```javascript
try {
  const response = await callLLM(prompt);
  return response;
} catch (error) {
  console.error('LLM error:', error);
  // Fall back to rule-based system
  return generateAlertFallback(data);
}
```

### 4. **Temperature Settings**
```javascript
// Factual extraction: Low temperature
const analysis = await callLLM(prompt, { temperature: 0.3 });

// Creative alerts: Medium temperature
const alert = await callLLM(prompt, { temperature: 0.7 });

// Conversational AI: Higher temperature
const chat = await callLLM(prompt, { temperature: 0.8 });
```

---

## 🧪 Testing

### Test in Browser Console

```javascript
// Test 1: Basic LLM call
import('./src/services/llmIntegration.js').then(mod => {
  mod.callLLM('What are the main types of natural disasters in India?')
    .then(console.log);
});

// Test 2: Analyze disaster report
import('./src/services/llmIntegration.js').then(mod => {
  const report = 'Severe flooding in Cuddalore. 5000 people affected.';
  mod.analyzeDisasterReport(report).then(console.log);
});

// Test 3: Generate alert
import('./src/services/llmIntegration.js').then(mod => {
  const data = {
    areaName: 'Cuddalore',
    riskPercent: 76,
    rainfall: 145,
    windSpeed: 65
  };
  mod.generateAlert(data).then(console.log);
});
```

---

## 🚀 Production Deployment

### Environment Variables (.env.production)

```bash
VITE_GROQ_API_KEY=prod_groq_key_here
VITE_GEMINI_API_KEY=prod_gemini_key_here

# Optional: Rate limits
VITE_LLM_MAX_CONCURRENT=10
VITE_LLM_CACHE_TTL=3600
```

### Monitoring

Track LLM usage:

```javascript
let llmCallCount = 0;
let llmErrorCount = 0;

export async function callLLMWithMetrics(prompt) {
  llmCallCount++;
  try {
    const response = await callLLM(prompt);
    return response;
  } catch (error) {
    llmErrorCount++;
    throw error;
  }
}

// Expose metrics
export function getLLMMetrics() {
  return { calls: llmCallCount, errors: llmErrorCount };
}
```

---

## 📊 Integration with Existing RESQAI System

### Add to Admin Dashboard

Show LLM-generated insights:

```javascript
import { explainAIDecision } from '../services/llmIntegration';

// In Admin Dashboard component
const [explanation, setExplanation] = useState('');

const handleExplainDecision = async (decision) => {
  const explain = await explainAIDecision(decision, data);
  setExplanation(explain);
};
```

### Add to Alerts Page

Auto-generate public alerts:

```javascript
import { generateAlert } from '../services/llmIntegration';

// Generate alert when risk increases
useEffect(() => {
  if (riskPercent > 70) {
    generateAlert(areaData).then(setPublicAlert);
  }
}, [riskPercent]);
```

---

## ✅ Checklist

**Setup:**
- [ ] Get Groq or Gemini API key
- [ ] Add to .env file
- [ ] Restart server
- [ ] Test with console commands

**Integration:**
- [ ] Import functions in components
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Test with real data

**Production:**
- [ ] Set up production API keys
- [ ] Implement rate limiting
- [ ] Add response caching
- [ ] Monitor usage and costs

---

## 🆘 Troubleshooting

### Issue: "API key not found"
**Solution:** Check .env file exists and has correct variable names

### Issue: "Rate limit exceeded"
**Solution:** Implement request queuing or upgrade API plan

### Issue: "Slow responses"
**Solution:** Use Groq (fastest) or cache responses

### Issue: "CORS error"
**Solution:** LLM APIs don't have CORS issues (called from server/backend)

---

## 📞 Support

**Groq:** https://console.groq.com/docs  
**Gemini:** https://ai.google.dev/docs  
**LLM Integration Code:** `src/services/llmIntegration.js`

---

**Your RESQAI system now has AI-powered disaster analysis! 🤖✨**
