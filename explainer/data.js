/* =============================================================================
   data.js — single source of truth for ALL display copy.
   Components render from this; no headlines/body/labels are hardcoded in JSX.
   Exposed on window.DATA for the Babel-transpiled component scripts.
   ============================================================================= */

const siteConfig = {
  brand: "Interchained",
  brandSub: "AiAssist Secure",
  logos: {
    itc: "explainer/assets/itc-logo.png",
    aias: "explainer/assets/aias-logo.png",
  },
  disclaimer:
    "ITC is a digital asset for ecosystem participation, access, and coordination. Nothing here is financial advice or an offer of securities.",
  summaryLine:
    "AiAssist Secure is the private AI orchestration layer. Interchained is the digital asset and coordination layer. Together, they create builder-owned infrastructure for businesses, operators, developers, and communities.",
  links: [
    { label: "AiAssist Secure", href: "https://aiassist.net" },
    { label: "Interchained", href: "https://interchained.org" },
    { label: "GitHub", href: "https://github.com/interchained" },
    { label: "Telegram", href: "https://t.me/Interchained_itc" },
    { label: "X", href: "https://x.com/interchained" },
    { label: "Contact", href: "mailto:dev@interchained.org" },
  ],
};

/* Section registry — single source of truth for order, nav labels, anchors,
   and progress indicator. Nav, ProgressIndicator, scroll-spy and pitch-mode
   nav all derive from this. */
const sections = [
  { id: "hero", label: "Intro", progressLabel: "Vision" },
  { id: "problem", label: "Problem", progressLabel: "The Problem" },
  { id: "aias", label: "AiAS", progressLabel: "AiAssist Secure" },
  { id: "itc", label: "Interchained", progressLabel: "Digital Asset Layer" },
  { id: "ecosystem", label: "Ecosystem", progressLabel: "The Ecosystem" },
  { id: "use-cases", label: "Use Cases", progressLabel: "Use Cases" },
  { id: "why-now", label: "Why Now", progressLabel: "Why Now" },
  { id: "pitch", label: "Opportunity", progressLabel: "The Opportunity" },
  { id: "closing", label: "Vision", progressLabel: "The Future" },
];

const hero = {
  eyebrow: "Interchained LLC",
  headline: "AI Infrastructure Needs an Ownership Layer",
  subheadline:
    "AiAssist Secure gives businesses private, self-hosted AI orchestration. Interchained gives the ecosystem a digital asset and settlement layer designed for builders, operators, and communities.",
  tagline: "Self-hosted AI. Digital asset rails. Builder-owned infrastructure.",
  ctas: [
    { label: "Start Explainer", target: "problem", variant: "primary" },
    { label: "View Ecosystem", target: "ecosystem", variant: "ghost" },
  ],
};

const problem = {
  eyebrow: "The Problem",
  headline: "Fragmented AI. Rented Platforms. No Ownership.",
  intro:
    "Businesses are trapped in rented, fragmented, data-leaking software with no ownership layer underneath it.",
  cards: [
    {
      title: "Rented SaaS Forever",
      body:
        "Businesses pay monthly for every seat, every tool, and every upgrade, but they do not own the infrastructure.",
    },
    {
      title: "AI Data Exposure",
      body:
        "Companies use hosted AI tools without full control over where prompts, files, customer data, and internal workflows live.",
    },
    {
      title: "Marked-Up AI Costs",
      body:
        "Many platforms resell AI usage with hidden margins instead of allowing businesses to bring their own provider keys.",
    },
    {
      title: "Fragmented Workflows",
      body:
        "Chatbots, CRMs, automations, support tools, agents, customer portals, and analytics are usually disconnected.",
    },
    {
      title: "No Native Incentive Layer",
      body:
        "Communities, operators, contributors, miners, builders, and partners create value, but most SaaS systems have no built-in digital asset layer to reward participation.",
    },
  ],
  toggle: {
    current: { id: "current", label: "Current Stack" },
    fixed: { id: "fixed", label: "Interchained + AiAS Stack" },
  },
};

const aias = {
  eyebrow: "AiAssist Secure",
  headline: "AiAssist Secure: Your Private AI Command Center",
  lead:
    "AiAssist Secure is a self-hosted, multi-tenant AI orchestration platform for businesses, agencies, developers, and communities that want control over their data, AI providers, workflows, and customer-facing tools.",
  features: [
    { title: "Self-Hosted Control", body: "Run the entire platform on infrastructure you own and govern.", icon: "Server" },
    { title: "Multi-Tenant Architecture", body: "Isolate clients, teams, and brands inside one deployment.", icon: "Layers" },
    { title: "Model-Agnostic AI", body: "Route to any model or provider without lock-in.", icon: "Cpu" },
    { title: "BYOK Provider Access", body: "Bring your own keys and pay providers directly, no markup.", icon: "KeyRound" },
    { title: "White-Label Ready", body: "Ship your own brand, domain, and UI to every customer.", icon: "Palette" },
    { title: "Agent Workflows", body: "Orchestrate multi-step agents across tools and data.", icon: "Workflow" },
    { title: "Private Memory + Roles", body: "Scoped memory and role-based access stay inside your walls.", icon: "ShieldCheck" },
    { title: "Reseller / Operator Model", body: "Operators deploy, support, and resell the platform downstream.", icon: "Store" },
  ],
  dashboardModules: [
    "AI Models", "Users", "Tenants", "Workflows",
    "Analytics", "Memory", "Support", "Billing",
  ],
};

const itc = {
  eyebrow: "Interchained / ITC",
  headline: "Interchained: The Digital Asset Layer for Builder-Owned Infrastructure",
  lead:
    "Interchained is the blockchain and digital asset layer connected to the broader ecosystem. ITC can represent participation, settlement, incentives, rewards, access, governance concepts, and future ecosystem utility.",
  features: [
    { title: "Blockchain Settlement Layer", body: "A base layer for coordinating activity across the ecosystem.", icon: "Boxes" },
    { title: "ITC Digital Asset", body: "A digital asset for participation, access, and coordination.", icon: "Coins" },
    { title: "Builder + Operator Incentives", body: "Align the people who deploy, extend, and support the network.", icon: "Handshake" },
    { title: "Token Layer Potential", body: "A coordination layer with room for future ecosystem utility.", icon: "Sparkles" },
    { title: "Mining + Network Participation", body: "Miners and pool operators support the base layer.", icon: "Pickaxe" },
    { title: "Public, Verifiable Activity", body: "Network activity is transparent and verifiable by design.", icon: "ScanLine" },
  ],
  railNodes: ["Users", "Businesses", "Agents", "Contributors", "Operators", "Communities"],
};

/* ----- ecosystem.js: SINGLE source for participants, layers, flows, loop, map ----- */
const participants = [
  {
    id: "businesses", name: "Businesses", icon: "Building2",
    role: "Run private AI assistants, support, portals, automations.",
    benefits: ["Own the AI stack end to end", "Keep customer data in-house", "Bring your own provider keys"],
  },
  {
    id: "agencies", name: "Agencies", icon: "Briefcase",
    role: "Deploy white-label AI products for many clients.",
    benefits: ["One platform, many tenants", "Branded client portals", "Recurring service revenue"],
  },
  {
    id: "developers", name: "Developers", icon: "Code2",
    role: "Build apps, plugins, integrations, and agent workflows.",
    benefits: ["Extend the platform", "Ship to a ready network", "Earn through builder incentives"],
  },
  {
    id: "operators", name: "Operators", icon: "Settings2",
    role: "Deploy, support, and resell AiAS to downstream customers.",
    benefits: ["Run distribution", "Support and manage tenants", "Capture operator margin"],
  },
  {
    id: "pools", name: "Pool Operators / Miners", icon: "Pickaxe",
    role: "Support the base layer and secure network activity.",
    benefits: ["Support the blockchain layer", "Participate in rewards", "Strengthen verifiable activity"],
  },
  {
    id: "communities", name: "Communities", icon: "Users",
    role: "Grow usage, campaigns, and network effects.",
    benefits: ["Coordinate around shared rails", "Grow adoption", "Participate in incentives"],
  },
  {
    id: "endusers", name: "End Users", icon: "UserRound",
    role: "Use the AI assistants, portals, and tools day to day.",
    benefits: ["Private, fast AI tools", "Consistent branded experience", "Data handled with control"],
  },
];

const layers = [
  {
    id: "ai", title: "AI Infrastructure",
    participants: ["Businesses", "Agencies", "Operators"],
    value: "Private AI tools, automations, support systems",
  },
  {
    id: "builder", title: "Builder Network",
    participants: ["Developers", "Communities", "Contributors"],
    value: "Apps, plugins, campaigns, integrations",
  },
  {
    id: "blockchain", title: "Blockchain Layer",
    participants: ["ITC users", "Miners", "Pool operators"],
    value: "Settlement, incentives, rewards, verifiable activity",
  },
];

const aiasFlow = [
  "AI assistants", "Automations", "Client portals", "Support systems",
  "Knowledge bases", "Internal tools", "Agent workflows",
];
const itcFlow = [
  "Incentives", "Settlement", "Access", "Rewards",
  "Digital asset coordination", "Verifiable network activity", "Ecosystem participation",
];
const valueLoop = [
  "Businesses adopt AiAS", "Operators deploy services", "Developers build tools",
  "Communities grow usage", "ITC coordinates incentives", "Network activity increases",
  "Ecosystem value compounds",
];

const ecosystem = {
  eyebrow: "The Ecosystem",
  headline: "A Loop, Not a Funnel",
  centerLabel: "Interchained + AiAssist Secure",
  copy:
    "The ecosystem is designed as a loop, not a funnel. Businesses use the AI layer. Operators deploy and support it. Developers extend it. Communities grow around it. Interchained provides the digital asset rails that can coordinate incentives, access, rewards, and verifiable activity across the network.",
  whyTitle: "Why the Ecosystem Matters",
  whyBody:
    "Most AI startups sell a tool. Most blockchain projects sell a token. Interchained LLC is building a connected operating system where AiAS creates immediate software utility, ITC creates a digital asset and coordination layer, operators and agencies create distribution, developers create extensibility, communities create network effects, and miners and pool operators support the base layer — giving the company multiple paths to growth instead of one product, one market, or one customer.",
  loopTitle: "The Value Loop",
  mapTitle: "Ecosystem Map",
  participants, layers, aiasFlow, itcFlow, valueLoop,
};

const useCases = {
  eyebrow: "Use Cases",
  headline: "Built for the Whole Network",
  cards: [
    { title: "Agency AI Platform", body: "Agencies launch branded, multi-tenant AI products and portals for every client from a single self-hosted deployment." },
    { title: "Business Support Automation", body: "Companies automate support, knowledge bases, and internal workflows with agents that keep data inside their own walls." },
    { title: "Developer Ecosystem", body: "Developers build apps, plugins, and integrations on top of the platform and ship them to a ready network of operators and businesses." },
    { title: "Pool Operator Rewards", body: "Pool operators and miners support the base layer and participate in the rewards and verifiable activity of the network." },
    { title: "Community Growth Campaigns", body: "Communities run campaigns and coordinate around shared rails, growing adoption and participating in ecosystem incentives." },
    { title: "Private AI for Regulated Teams", body: "Regulated teams run model-agnostic AI on infrastructure they own, with private memory, roles, and full data control." },
  ],
};

const whyNow = {
  eyebrow: "Why Now",
  headline: "The Timing Is the Thesis",
  points: [
    { title: "AI Went Mainstream", body: "Every business now needs AI, but few want their data living in someone else's cloud." },
    { title: "Self-Hosting Is Viable", body: "Open models and cheaper compute make private, self-hosted AI practical for normal teams." },
    { title: "SaaS Fatigue Is Real", body: "Companies are tired of renting fragmented tools with no ownership underneath." },
    { title: "Provider Lock-In Hurts", body: "Marked-up AI usage pushed demand toward model-agnostic, bring-your-own-key platforms." },
    { title: "Digital Asset Rails Matured", body: "Coordination and settlement infrastructure is ready to align builders and operators." },
    { title: "Network Effects Compound", body: "The first connected AI-plus-digital-asset operating system gets to compound early." },
  ],
  timeline: [
    { stage: "Web2 SaaS", note: "Rented, fragmented tools" },
    { stage: "AI Wrappers", note: "Hosted, marked-up usage" },
    { stage: "Self-Hosted AI", note: "Private, owned orchestration" },
    { stage: "AI + Digital Asset Infrastructure", note: "Builder-owned coordination", now: true },
  ],
};

const pitch = {
  eyebrow: "The Opportunity",
  headline: "The Opportunity",
  body:
    "Interchained LLC is building a connected operating system, not a single product. AiAS creates immediate software utility, ITC creates a digital asset and coordination layer, and operators, developers, and communities create distribution, extensibility, and network effects — multiple paths to growth instead of one product, one market, or one customer.",
  groups: [
    {
      title: "Revenue Paths",
      items: ["Self-hosted platform deployments", "Operator and reseller distribution", "Agency white-label products", "Builder and developer extensions"],
    },
    {
      title: "Network Effects",
      items: ["Operators expand reach", "Developers extend capability", "Communities grow adoption", "Shared rails coordinate participants"],
    },
    {
      title: "Strategic Advantage",
      items: ["Software utility plus digital asset layer", "Ownership instead of rented SaaS", "Model-agnostic, no provider lock-in", "Builder-owned infrastructure"],
    },
  ],
};

const closing = {
  eyebrow: "The Future",
  headline: "The Future Is Builder-Owned",
  body:
    "The next generation of infrastructure will be owned by the businesses, operators, developers, and communities that build on it — not rented from platforms that keep the upside.",
  ctas: [
    { label: "Request Demo", href: "mailto:dev@interchained.org?subject=AiAssist%20Secure%20%2B%20Interchained%20Demo%20Request", variant: "primary" },
    { label: "View AiAssist Secure", href: "https://aiassist.net", variant: "ghost" },
    { label: "Explore Interchained", href: "https://interchained.org", variant: "ghost" },
  ],
};

window.DATA = {
  siteConfig, sections, hero, problem, aias, itc, ecosystem,
  useCases, whyNow, pitch, closing,
};
