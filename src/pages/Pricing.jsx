import { useState } from 'react';
import {
  Shield,
  Zap,
  Building2,
  Crown,
  Check,
  X,
  ArrowRight,
  Globe,
  FileText,
  Radio,
  MapPin,
  Bell,
  BarChart3,
  Layers,
  Lock,
  Cpu,
  Phone,
  Users,
  Webhook,
  CloudRain,
} from 'lucide-react';

// ── Plan Data ───────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'Community',
    subtitle: 'For citizens & researchers',
    price: 'Free',
    priceNote: 'Forever',
    icon: Shield,
    gradient: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-500/30',
    bgColor: 'bg-slate-500/5',
    ctaText: 'Get Started Free',
    ctaStyle: 'bg-slate-600 hover:bg-slate-500',
    popular: false,
    features: [
      { text: 'Public EOC Dashboard access', included: true },
      { text: 'Real-time disaster map view', included: true },
      { text: 'Basic weather & flood alerts', included: true },
      { text: 'Dam water level monitoring', included: true },
      { text: 'Community SOS beacon', included: true },
      { text: '5 Land Safety Reports / month', included: true },
      { text: 'Basic risk score lookup', included: true },
      { text: 'WhatsApp alert opt-in', included: true },
      { text: 'Campus-specific alerts', included: false },
      { text: 'Insurance Risk API access', included: false },
      { text: 'Custom geofence alerts', included: false },
      { text: 'Priority evacuation routing', included: false },
      { text: 'Dedicated account manager', included: false },
      { text: 'SLA guarantee', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For businesses & IT parks',
    price: '\u20B950,000',
    priceNote: '/ month per campus',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/5',
    ctaText: 'Start 14-Day Trial',
    ctaStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
    popular: true,
    features: [
      { text: 'Everything in Community', included: true },
      { text: 'Campus-specific flood alerts', included: true },
      { text: 'WhatsApp evacuation orders', included: true },
      { text: 'Employee safety headcount', included: true },
      { text: '50 Land Safety Reports / month', included: true },
      { text: 'Insurance Risk API (1,000 calls/mo)', included: true },
      { text: 'Custom geofence alerts', included: true },
      { text: 'Priority evacuation routing', included: true },
      { text: 'Real-time river level monitoring', included: true },
      { text: 'AI Copilot risk analysis', included: true },
      { text: 'Email + chat support', included: true },
      { text: '99.5% uptime SLA', included: true },
      { text: 'Multi-campus management', included: false },
      { text: 'Unlimited API calls', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'For insurers & government',
    price: 'Custom',
    priceNote: 'Tailored pricing',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    ctaText: 'Contact Sales',
    ctaStyle: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500',
    popular: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited Land Safety Reports', included: true },
      { text: 'Unlimited Insurance Risk API', included: true },
      { text: 'Multi-campus management', included: true },
      { text: 'Bulk risk scoring (batch API)', included: true },
      { text: 'Historical flood data access', included: true },
      { text: 'Soil & geological analysis', included: true },
      { text: 'Custom integrations & webhooks', included: true },
      { text: 'White-label dashboard', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '24/7 priority phone support', included: true },
      { text: '99.99% uptime SLA', included: true },
      { text: 'On-premise deployment option', included: true },
      { text: 'Compliance & audit reports', included: true },
    ],
  },
];

// ── Monetization Streams ────────────────────────────────────────────────────

const streams = [
  {
    icon: Building2,
    title: 'IT Parks & Tech Companies',
    tag: 'Duty of Care',
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    description:
      'Early flood alerts for your specific campus. Employees receive WhatsApp evacuation orders before roads flood.',
    clients: 'TCS, Cognizant, Infosys, Wipro, HCL',
    pricing: '\u20B950,000 \u2013 \u20B91,50,000/month per campus',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: BarChart3,
    title: 'Insurance Risk API',
    tag: 'Underwriting Intelligence',
    tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    description:
      'Instant flood-zone risk score via API before insuring a building or factory. Reduce claim losses with data-driven underwriting.',
    clients: 'HDFC ERGO, Bajaj Allianz, ICICI Lombard',
    pricing: '\u20B920 \u2013 \u20B950 per API call',
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: FileText,
    title: 'Land & Soil Safety Report',
    tag: 'Pre-Purchase Intelligence',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    description:
      'Is this plot on an old lakebed? What is the soil quality? Will it flood? Comprehensive report for home buyers and banks.',
    clients: 'Home buyers, SBI, HDFC Bank, LIC Housing',
    pricing: '\u20B9500 \u2013 \u20B91,000 per report',
    gradient: 'from-emerald-500/10 to-green-500/10',
    border: 'border-emerald-500/20',
  },
];

// ── API Pricing Table ───────────────────────────────────────────────────────

const apiTiers = [
  { calls: 'First 100', price: 'Free', note: 'Sandbox testing' },
  { calls: '101 \u2013 1,000', price: '\u20B950/call', note: 'Startup tier' },
  { calls: '1,001 \u2013 10,000', price: '\u20B935/call', note: 'Growth tier' },
  { calls: '10,001 \u2013 50,000', price: '\u20B925/call', note: 'Scale tier' },
  { calls: '50,000+', price: '\u20B920/call', note: 'Enterprise volume' },
];

// ── Component ───────────────────────────────────────────────────────────────

function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedStream, setExpandedStream] = useState(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Pricing & Plans
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Choose the Right Plan for Your Safety Needs
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          From free community access to enterprise-grade disaster intelligence.
          Protect your people, assets, and investments with real-time flood risk data.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-800 border border-slate-700">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const displayPrice =
            plan.price === 'Free' || plan.price === 'Custom'
              ? plan.price
              : billingCycle === 'annual'
              ? `\u20B9${(parseInt(plan.price.replace(/[^\d]/g, '')) * 0.8).toLocaleString('en-IN')}`
              : plan.price;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${plan.borderColor} ${plan.bgColor} p-6 flex flex-col transition-all hover:scale-[1.02] hover:shadow-xl ${
                plan.popular ? 'ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/10' : ''
              }`}
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{displayPrice}</span>
                </div>
                <span className="text-sm text-slate-400">{plan.priceNote}</span>
              </div>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${plan.ctaStyle} flex items-center justify-center gap-2 mb-6`}
              >
                {plan.ctaText}
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Features */}
              <div className="space-y-3 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  What's included
                </p>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monetization Streams */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Revenue Streams</h2>
          <p className="text-slate-400">
            Three distinct channels powering disaster-resilient infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {streams.map((stream, idx) => {
            const StreamIcon = stream.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl border ${stream.border} bg-gradient-to-br ${stream.gradient} p-6 cursor-pointer transition-all hover:scale-[1.02]`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                onClick={() => setExpandedStream(expandedStream === idx ? null : idx)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <StreamIcon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${stream.tagColor}`}
                  >
                    {stream.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{stream.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {stream.description}
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500">Target: {stream.clients}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">{stream.pricing}</span>
                  </div>
                </div>

                {expandedStream === idx && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                      How it works
                    </p>
                    {idx === 0 && (
                      <ul className="space-y-1.5 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                          Company registers campus GPS coordinates
                        </li>
                        <li className="flex items-start gap-2">
                          <CloudRain className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                          AI monitors rainfall, dam levels, river data 24/7
                        </li>
                        <li className="flex items-start gap-2">
                          <Bell className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                          Campus-specific alerts 2-6 hours before flooding
                        </li>
                        <li className="flex items-start gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                          WhatsApp evacuation orders to all employees
                        </li>
                      </ul>
                    )}
                    {idx === 1 && (
                      <ul className="space-y-1.5 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                          <Webhook className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                          Simple REST API: send lat/lng, get risk score
                        </li>
                        <li className="flex items-start gap-2">
                          <Layers className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                          Multi-layer analysis: flood zone + soil + elevation
                        </li>
                        <li className="flex items-start gap-2">
                          <BarChart3 className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                          Risk score 0-100 with confidence interval
                        </li>
                        <li className="flex items-start gap-2">
                          <Lock className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                          SOC2 compliant, encrypted in transit
                        </li>
                      </ul>
                    )}
                    {idx === 2 && (
                      <ul className="space-y-1.5 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          Enter plot address or survey number
                        </li>
                        <li className="flex items-start gap-2">
                          <Globe className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          Cross-reference with lakebed maps & flood history
                        </li>
                        <li className="flex items-start gap-2">
                          <Cpu className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          AI soil quality & subsidence risk analysis
                        </li>
                        <li className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          Downloadable PDF report with risk rating
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* API Pricing Table */}
      <div className="rounded-2xl border border-purple-500/20 p-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <Webhook className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Insurance Risk API Pricing</h3>
            <p className="text-sm text-slate-400">Pay-per-call volume pricing</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  API Calls / Month
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {apiTiers.map((tier, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-white">{tier.calls}</td>
                  <td className="py-3 px-4 text-sm font-bold text-purple-400">{tier.price}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
                      {tier.note}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Land Report Pricing */}
      <div className="rounded-2xl border border-emerald-500/20 p-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Land & Soil Safety Report</h3>
            <p className="text-sm text-slate-400">Per-report pricing for buyers and lenders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-700/50 p-5" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <h4 className="text-white font-semibold mb-1">Basic Report</h4>
            <p className="text-3xl font-bold text-emerald-400 mb-2">
              {'\u20B9'}500
              <span className="text-sm font-normal text-slate-500 ml-1">/ report</span>
            </p>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Flood zone classification
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Historical flood frequency
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Lakebed / waterbody check
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Basic soil type indicator
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-500/30 p-5 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-semibold">Comprehensive Report</h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                Recommended
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 mb-2">
              {'\u20B9'}1,000
              <span className="text-sm font-normal text-slate-500 ml-1">/ report</span>
            </p>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Everything in Basic
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Detailed soil quality & bearing capacity
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Subsidence & liquefaction risk
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Nearest dam overflow impact radius
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Bank / insurance-ready PDF certificate
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ / Trust Section */}
      <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
        <h3 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: 'Is the Community plan really free?',
              a: 'Yes. Public safety is our core mission. The community plan gives full access to the EOC dashboard, disaster map, and basic alerts at no cost.',
            },
            {
              q: 'How does campus-specific alerting work?',
              a: 'You register your campus GPS coordinates and employee list. Our AI monitors all flood risk factors specific to your location and sends WhatsApp alerts 2-6 hours before flooding.',
            },
            {
              q: 'What data sources power the risk scores?',
              a: 'We aggregate real-time data from CWC dam levels, IMD weather warnings, river gauge stations, historical flood maps, soil surveys, and satellite imagery.',
            },
            {
              q: 'Can I try the Insurance API before committing?',
              a: 'Yes. The first 100 API calls are free for sandbox testing. No credit card required.',
            },
            {
              q: 'How accurate are Land Safety Reports?',
              a: 'Reports cross-reference government flood zone maps, geological survey data, historical lakebed records, and our proprietary AI analysis. Accuracy exceeds 92% on validation sets.',
            },
            {
              q: 'Is a payment gateway integrated?',
              a: 'Not yet \u2014 this is a prototype. Payment integration (Razorpay / Stripe) will be added before production launch.',
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-semibold text-white mb-1.5">{q}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
          <Radio className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-sm text-amber-400 font-medium">
            Prototype Mode \u2014 Payment gateway integration coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
