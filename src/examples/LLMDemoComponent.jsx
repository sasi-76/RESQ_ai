/**
 * LLM Demo Component - Shows AI-powered disaster analysis
 * Copy this to your pages folder to use
 */

import { useState } from 'react';
import {
  analyzeDisasterReport,
  generateAlert,
  extractDisasterInfoFromText,
  predictRiskEscalation,
  chatWithAI,
  explainAIDecision,
  callLLM
} from '../services/llmIntegration';
import { Brain, Sparkles, MessageSquare, AlertCircle, TrendingUp, FileText } from 'lucide-react';

function LLMDemoComponent() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab configurations
  const tabs = [
    { id: 'analyze', label: 'Analyze Report', icon: FileText },
    { id: 'alert', label: 'Generate Alert', icon: AlertCircle },
    { id: 'social', label: 'Social Media', icon: MessageSquare },
    { id: 'predict', label: 'Predict Risk', icon: TrendingUp },
    { id: 'chat', label: 'AI Chat', icon: Brain },
  ];

  // Sample inputs for each tab
  const samples = {
    analyze: `Heavy rainfall in Cuddalore district has caused severe flooding. Water levels have risen 2 meters above normal. Approximately 5,000 people are affected in low-lying areas. Roads to the city center are impassable. Multiple houses have been damaged. Urgent need for rescue boats, medical supplies, and evacuation shelters. Local authorities report power outages in affected zones.`,

    alert: JSON.stringify({
      areaName: 'Cuddalore',
      riskPercent: 76,
      rainfall: 145,
      windSpeed: 65,
      waterLevel: 4.8,
      dangerLevel: 6.0,
    }, null, 2),

    social: `Breaking: Major flooding near Cuddalore bus stand. Water up to waist level. Many cars and bikes stuck. People seeking help. #CuddaloreFloods #TamilNaduRains #EmergencyHelp`,

    predict: JSON.stringify({
      historical: { pastRisks: [45, 52, 58, 65, 70] },
      current: {
        currentRisk: 76,
        rainfall: 145,
        windSpeed: 65,
        waterLevel: 4.8,
        trend: 'increasing'
      }
    }, null, 2),

    chat: 'What should emergency operators do when they receive reports of flooding with trapped people?',
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      let result;

      switch (activeTab) {
        case 'analyze':
          result = await analyzeDisasterReport(input);
          break;

        case 'alert':
          const alertData = JSON.parse(input);
          result = await generateAlert(alertData);
          break;

        case 'social':
          result = await extractDisasterInfoFromText(input);
          break;

        case 'predict':
          const predictionData = JSON.parse(input);
          result = await predictRiskEscalation(
            predictionData.historical,
            predictionData.current
          );
          break;

        case 'chat':
          result = await chatWithAI(input);
          break;

        default:
          result = await callLLM(input);
      }

      setOutput(result);
    } catch (err) {
      console.error('LLM Error:', err);
      setError(err.message || 'Failed to process request. Check API keys in .env file.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = () => {
    setInput(samples[activeTab]);
  };

  const formatOutput = (data) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="h-7 w-7 text-purple-400" />
          AI-Powered Disaster Analysis (LLM Demo)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Using Groq & Gemini APIs to analyze disaster data
        </p>
      </div>

      {/* API Status */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase">API Status:</span>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${import.meta.env.VITE_GROQ_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-400">
                Groq: {import.meta.env.VITE_GROQ_API_KEY ? '✓ Connected' : '✗ No API Key'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${import.meta.env.VITE_GEMINI_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-400">
                Gemini: {import.meta.env.VITE_GEMINI_API_KEY ? '✓ Connected' : '✗ No API Key'}
              </span>
            </div>
          </div>

          {!import.meta.env.VITE_GROQ_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY && (
            <span className="text-xs text-yellow-400 font-medium">
              ⚠️ Add API keys to .env file to enable
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Input</h3>
            <button
              onClick={loadSample}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Load Sample
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} data...`}
            className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyze with AI
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            AI Response
          </h3>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <strong>Error:</strong> {error}
              <p className="text-xs mt-2">
                Make sure you have VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY in your .env file.
              </p>
            </div>
          )}

          {output && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">AI Analysis Complete</span>
                </div>

                <pre className="text-sm text-white whitespace-pre-wrap font-mono overflow-x-auto max-h-96">
                  {formatOutput(output)}
                </pre>
              </div>

              {/* Special formatting for specific outputs */}
              {activeTab === 'analyze' && output.disasterType && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/40">
                    <p className="text-xs text-slate-500 mb-1">Disaster Type</p>
                    <p className="text-sm font-bold text-white capitalize">{output.disasterType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40">
                    <p className="text-xs text-slate-500 mb-1">Severity</p>
                    <p className={`text-sm font-bold ${
                      output.severity === 'critical' ? 'text-red-400' :
                      output.severity === 'high' ? 'text-orange-400' :
                      output.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {output.severity?.toUpperCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!output && !error && (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">AI response will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card p-5 border-l-4 border-l-purple-500 bg-purple-500/5">
        <h4 className="text-sm font-semibold text-purple-400 mb-2">How This Works</h4>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li>• <strong>Analyze Report:</strong> Extract structured data from unstructured disaster reports</li>
          <li>• <strong>Generate Alert:</strong> Create natural language public alerts from data</li>
          <li>• <strong>Social Media:</strong> Detect disasters from Twitter/news text</li>
          <li>• <strong>Predict Risk:</strong> Forecast if situation will escalate</li>
          <li>• <strong>AI Chat:</strong> Conversational assistant for operators</li>
        </ul>
      </div>

      {/* Setup Instructions */}
      {!import.meta.env.VITE_GROQ_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY && (
        <div className="glass-card p-6 border-2 border-yellow-500/30">
          <h4 className="text-lg font-bold text-white mb-3">🚀 Quick Setup</h4>
          <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
            <li>Get free API key from <a href="https://console.groq.com" target="_blank" className="text-blue-400 hover:underline">console.groq.com</a></li>
            <li>Create <code className="px-2 py-1 bg-slate-800 rounded text-blue-400">.env</code> file in project root</li>
            <li>Add: <code className="px-2 py-1 bg-slate-800 rounded text-green-400">VITE_GROQ_API_KEY=your_key_here</code></li>
            <li>Restart server: <code className="px-2 py-1 bg-slate-800 rounded text-purple-400">npm run dev</code></li>
            <li>Refresh this page and try the demo!</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default LLMDemoComponent;
