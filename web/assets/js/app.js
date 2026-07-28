const App = {
  get engineUrl() { return window.location.origin },
  sessionId: null,
  currentAgent: 'sparta',
  currentModel: '',
  systemPrompt: `You are S.P.A.R.T.A (Super Personal Assistant for Real-time Tactical & Autonomous).

Core Values:
- Truth over comfort: Accuracy and honesty supersede politeness, approval, or emotional safety.
- Objectivity over agreement: Challenge flawed reasoning regardless of source.
- Action over rumination: Diagnose, decide, execute. Analysis paralysis is failure.
- Growth over stasis: Every interaction must leave the user sharper, not validated.
- Density over prose: Answer directly with structured, high-density information.

Operating Principles:
- Operate as a direct, analytical, data-driven, high-level advisor.
- Do not accept claims at face value. Evaluate all statements critically.
- Begin every query by retrieving real-time data from available sources.
- Actively identify flaws, inconsistencies, unsupported assumptions.
- After analysis, deliver a clear, prioritized improvement plan.
- Generalist capable of handling broad technical, analytical, strategic, and research-based tasks.`,
  menuOpen: false,
  usedSkills: [],
  skills: [
    { faculty: 'I: Meta-Reasoning & Strategic Ops', skills: ['Risk Assessment', 'Resource Optimization', 'Decision Matrix', 'Root Cause Analysis', 'Priority Triage', 'Systems Thinking', 'Communication Strategy', 'Post-Execution Audit', 'Constraint-Based Problem Solving', 'Bias Detection', 'First-Principles Thinking', 'Strategic Foresight', 'Execution Architecture', 'Adversarial Reasoning', 'Calibrated Confidence', 'Self-Correction', 'Temporal Optimization', 'Influence & Negotiation'] },
    { faculty: 'II: Physical & Life Sciences', skills: ['Physics', 'Chemistry', 'Biology', 'Ecology', 'Geology', 'Astronomy', 'Material Science', 'Thermodynamics', 'Quantum Mechanics', 'Genetics', 'Neuroscience', 'Climatology', 'Oceanography', 'Paleontology'] },
    { faculty: 'III: Medical & Clinical Sciences', skills: ['Diagnosis', 'Pharmacology', 'Surgery Protocols', 'Epidemiology', 'Radiology', 'Pathology', 'Immunology', 'Cardiology', 'Neurology', 'Pediatrics', 'Psychiatry', 'Emergency Medicine', 'Preventive Care', 'Medical Ethics'] },
    { faculty: 'IV: Engineering & Applied Sciences', skills: ['Structural Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Civil Engineering', 'Robotics', 'Control Systems', 'Signal Processing', 'Nanotechnology', 'Acoustics', 'Optics'] },
    { faculty: 'V: Quantitative & Data Sciences', skills: ['Statistics', 'Probability', 'Linear Algebra', 'Calculus', 'Discrete Math', 'Number Theory', 'Graph Theory', 'Game Theory', 'Optimization', 'Bayesian Inference', 'Time Series', 'Dimensionality Reduction'] },
    { faculty: 'VI: Business, Economics & Finance', skills: ['Microeconomics', 'Macroeconomics', 'Corporate Finance', 'Investment Strategy', 'Risk Management', 'Marketing', 'Supply Chain', 'M&A', 'Valuation', 'Portfolio Theory', 'Behavioral Economics', 'Market Analysis'] },
    { faculty: 'VII: Law, Jurisprudence & Governance', skills: ['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law', 'Property Law', 'International Law', 'Human Rights', 'Regulatory Compliance', 'Legal Research', 'Arbitration', 'Intellectual Property', 'Tax Law'] },
    { faculty: 'VIII: Social & Behavioral Sciences', skills: ['Psychology', 'Sociology', 'Anthropology', 'Political Science', 'Geography', 'History', 'Archaeology', 'Linguistics', 'Ethnography', 'Demography', 'Criminology', 'Urban Studies'] },
    { faculty: 'IX: Arts, Humanities & Philosophy', skills: ['Philosophy', 'Ethics', 'Logic', 'Aesthetics', 'Metaphysics', 'Epistemology', 'Art History', 'Music Theory', 'Literary Analysis', 'Comparative Religion', 'Mythology', 'Critical Theory'] },
    { faculty: 'X: Professional & Applied Domains', skills: ['Education', 'Military Science', 'Veterinary Science', 'Hospitality', 'Sports Science', 'Journalism', 'Public Relations', 'Event Management', 'Nonprofit Management', 'Public Administration'] },
    { faculty: 'XI: Emerging & Interdisciplinary', skills: ['AI Ethics', 'Synthetic Biology', 'Quantum Computing', 'Blockchain', 'Space Mining', 'Brain-Computer Interfaces', 'Augmented Reality', 'Digital Twins', 'Metaverse', 'Climate Engineering'] },
    { faculty: 'XII: Skilled Trades & Technical Crafts', skills: ['Welding', 'Carpentry', 'Plumbing', 'Electrical Work', 'Masonry', 'HVAC', 'Automotive Repair', 'Machining', 'Woodworking', 'Metalworking', 'Glassblowing'] },
    { faculty: 'XIII: Transportation, Maritime & Aviation', skills: ['Pilot Operations', 'Air Traffic Control', 'Navigation', 'Ship Engineering', 'Rail Operations', 'Logistics', 'Fleet Management', 'Aviation Safety', 'Port Operations', 'Drone Operations'] },
    { faculty: 'XIV: Public Safety & Emergency Response', skills: ['Firefighting', 'Search & Rescue', 'Disaster Response', 'Hazmat Management', 'Emergency Medical', 'Crisis Communication', 'Evacuation Planning', 'Incident Command', 'Flood Control', 'Earthquake Response'] },
    { faculty: 'XV: Culinary, Hospitality & Personal Care', skills: ['Culinary Arts', 'Baking', 'Sommelier', 'Restaurant Management', 'Cosmetology', 'Spa Therapy', 'Nutrition', 'Food Safety', 'Menu Planning', 'Mixology'] },
    { faculty: 'XVI: Creative & Media Production', skills: ['Graphic Design', 'Animation', 'Video Production', 'Sound Design', 'Photography', 'Typography', 'UX Design', 'Game Design', '3D Modeling', 'Color Theory'] },
    { faculty: 'XVII: Healthcare Operations & Allied Health', skills: ['Nursing', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Medical Billing', 'Health Informatics', 'Hospital Admin', 'Pharmacy Ops', 'Radiology Tech', 'Lab Management'] },
    { faculty: 'XVIII: Business Ops, Sales & Administration', skills: ['Sales Strategy', 'CRM', 'Project Management', 'Operations', 'HR', 'Payroll', 'Procurement', 'Inventory', 'Quality Assurance', 'Business Dev'] },
    { faculty: 'XIX: Child, Elder & Social Care Ops', skills: ['Child Development', 'Elder Care', 'Social Work', 'Counseling', 'Adoption Services', 'Foster Care', 'Rehabilitation', 'Community Outreach', 'Home Care', 'Palliative Care'] },
    { faculty: 'XX: Natural Resources & Environmental Ops', skills: ['Mining', 'Oil & Gas', 'Forestry', 'Fisheries', 'Water Management', 'Waste Management', 'Environmental Impact', 'Renewable Energy', 'Conservation', 'Wildlife Management'] },
    { faculty: 'XXI: Entertainment & Venue Operations', skills: ['Concert Production', 'Theme Park Ops', 'Box Office', 'Crowd Management', 'Booking', 'Stage Design', 'Lighting', 'Pyrotechnics', 'Broadcast', 'Streaming'] },
    { faculty: 'XXII: Banking & Lending Operations', skills: ['Retail Banking', 'Commercial Lending', 'Mortgage', 'Credit Analysis', 'Treasury', 'Payments', 'Fraud Detection', 'AML Compliance', 'Wealth Management', 'Private Banking'] },
    { faculty: 'XXIII: Insurance Operations', skills: ['Underwriting', 'Claims', 'Actuarial Science', 'Reinsurance', 'Policy Admin', 'Risk Assessment', 'Insurance Law', 'Brokerage', 'Loss Control', 'Premium Audit'] },
    { faculty: 'XXIV: Real Estate Services', skills: ['Property Valuation', 'Real Estate Law', 'Leasing', 'Property Management', 'Title Search', 'Escrow', 'Zoning', 'Appraisal', 'REITs', 'Construction Mgmt'] },
    { faculty: 'XXV: Government & Public Administration', skills: ['Policy Analysis', 'Public Budgeting', 'Legislative Process', 'Diplomacy', 'Civil Service', 'Urban Planning', 'Public Works', 'Taxation', 'Elections', 'Census'] },
    { faculty: 'XXVI: International Dev & Humanitarian Aid', skills: ['Dev Economics', 'Humanitarian Logistics', 'Refugee Support', 'Food Security', 'Water Sanitation', 'Microfinance', 'Peacebuilding', 'Disaster Relief', 'NGO Mgmt', 'Cultural Sensitivity'] },
    { faculty: 'XXVII: Advertising, PR & Marketing', skills: ['Brand Strategy', 'Media Planning', 'Copywriting', 'SEO/SEM', 'Social Media', 'Market Research', 'Campaign Analytics', 'Influencer Marketing', 'Content Strategy', 'Crisis PR'] },
    { faculty: 'XXVIII: Campaigns, Elections & Political Ops', skills: ['Campaign Strategy', 'Voter Outreach', 'Polling', 'Fundraising', 'Debate Prep', 'Message Crafting', 'Field Ops', 'Digital Organizing', 'Coalition Building', 'Get-Out-Vote'] },
    { faculty: 'XXIX: Language Services', skills: ['Translation', 'Interpretation', 'Localization', 'Subtitling', 'Dubbing', 'Terminology', 'Language Teaching', 'Lexicography', 'Speech Recognition', 'NLP'] },
    { faculty: 'XXX: Pet, Animal & Veterinary Support', skills: ['Veterinary Medicine', 'Animal Nutrition', 'Pet Grooming', 'Animal Training', 'Zoo Keeping', 'Wildlife Rehab', 'Animal Behavior', 'Exotic Pets', 'Vet Tech', 'Animal Welfare'] },
    { faculty: 'XXXI: Fitness, Wellness & Sports Ops', skills: ['Personal Training', 'Sports Medicine', 'Nutrition Coaching', 'Yoga', 'Martial Arts', 'Athletic Training', 'Sports Psychology', 'Facility Mgmt', 'Event Planning', 'Referee'] },
    { faculty: 'XXXII: Funeral, Mortuary & Memorial', skills: ['Embalming', 'Funeral Directing', 'Cremation', 'Memorial Planning', 'Grief Counseling', 'Restorative Art', 'Mortuary Law', 'Cemetery Ops', 'Death Records', 'Green Burial'] },
    { faculty: 'XXXIII: Moving, Storage & Rental', skills: ['Residential Moving', 'Commercial Moving', 'Storage Mgmt', 'Packing', 'Logistics', 'Fleet Mgmt', 'Rental Agreements', 'Inventory', 'Piano Moving', 'Vehicle Rental'] },
    { faculty: 'XXXIV: Addiction, Recovery & Behavioral Health', skills: ['Addiction Counseling', 'Detox Protocols', 'Rehab Planning', 'Relapse Prevention', 'Group Therapy', 'Crisis Intervention', 'Dual Diagnosis', 'Sober Living', 'Family Therapy', 'Harm Reduction'] },
    { faculty: 'XXXV: Disability Services & Accessibility', skills: ['ADA Compliance', 'Assistive Tech', 'Sign Language', 'Braille', 'Accessible Design', 'Disability Advocacy', 'Supported Employment', 'Personal Care', 'Mobility Training', 'Inclusive Education'] },
    { faculty: 'XXXVI: Telecommunications Operations', skills: ['Network Engineering', 'Fiber Optics', '5G', 'Satellite Comms', 'VoIP', 'Spectrum Mgmt', 'Cell Tower', 'Broadband', 'Data Centers', 'Telecom Billing'] },
    { faculty: 'XXXVII: Agriculture Production Ops', skills: ['Crop Science', 'Livestock', 'Agronomy', 'Hydroponics', 'Precision Ag', 'Soil Science', 'Pest Control', 'Irrigation', 'Farm Mgmt', 'Agricultural Economics'] },
    { faculty: 'XXXVIII: Clinical Research & Trial Ops', skills: ['Clinical Trial Design', 'IRB Submissions', 'Patient Recruitment', 'Data Management', 'Biostatistics', 'Regulatory Affairs', 'Site Monitoring', 'SAS Programming', 'Medical Writing', 'Pharmacovigilance'] },
    { faculty: 'XXXIX: Printing, Publishing & Content', skills: ['Print Production', 'Digital Publishing', 'Editorial', 'Proofreading', 'Book Design', 'Magazine Layout', 'Bindery', 'Screen Printing', 'Offset Printing', 'Self-Publishing'] },
    { faculty: 'XL: Broadcasting & Radio Operations', skills: ['Radio Production', 'TV Production', 'Podcasting', 'Audio Engineering', 'News Reporting', 'Sports Broadcasting', 'Traffic Reporting', 'Weather Casting', 'Program Scheduling', 'FCC Compliance'] },
    { faculty: 'XLI: Waste Management & Recycling', skills: ['Solid Waste', 'Recycling', 'Composting', 'Hazmat Disposal', 'Waste-to-Energy', 'Landfill Ops', 'E-Waste', 'Plastic Recycling', 'Organic Waste', 'Circular Economy'] }
  ],

  async init() {
    ChatModule.init()
    this.bindMenu()
    this.bindAgentControls()
    this.bindSidebar()
    this.checkEngine()
    setTimeout(() => this.hideLoader(), 2000)
  },

  bindSidebar() {
    const btn = document.getElementById('sidebarToggle')
    if (btn) {
      btn.addEventListener('click', () => this.toggleSidebar())
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebarOverlay')
    if (!sidebar) return
    const open = sidebar.classList.toggle('open')
    overlay.classList.toggle('hidden', !open)
    document.body.classList.toggle('sidebar-open', open)
  },

  // ─── MENU ──────────────────────────────────────────────────
  bindMenu() {
    const btn = document.getElementById('menuBtn')
    const dd = document.getElementById('menuDropdown')
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.menuOpen = !this.menuOpen
      dd.classList.toggle('hidden', !this.menuOpen)
      btn.classList.toggle('open', this.menuOpen)
    })
    document.addEventListener('click', () => {
      if (this.menuOpen) { dd.classList.add('hidden'); this.menuOpen = false }
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuOpen) { dd.classList.add('hidden'); this.menuOpen = false }
    })
  },

  bindAgentControls() {
    document.getElementById('agentSelect').addEventListener('change', (e) => {
      this.currentAgent = e.target.value
      document.getElementById('agentBadge').textContent = e.target.value.toUpperCase()
    })
    document.getElementById('modelSelect').addEventListener('change', (e) => {
      this.currentModel = e.target.value
    })
    document.getElementById('randomSkillBtn').addEventListener('click', () => this.randomSkill())
  },

  randomizeSkill() {
    const all = []
    for (const f of this.skills) {
      for (const s of f.skills) {
        all.push({ faculty: f.faculty, skill: s })
      }
    }
    const available = all.filter((_, i) => !this.usedSkills.includes(i))
    if (available.length === 0) {
      this.usedSkills = []
      return this.randomizeSkill()
    }
    const idx = Math.floor(Math.random() * all.length)
    while (this.usedSkills.includes(idx)) {
      return this.randomizeSkill()
    }
    this.usedSkills.push(idx)
    return all[idx]
  },

  randomSkill() {
    const pick = this.randomizeSkill()
    if (!pick) return
    const el = document.getElementById('skillTopic')
    el.classList.remove('hidden')
    el.innerHTML = `<strong>${pick.skill}</strong><br><span style="color:var(--text-dim);font-size:0.6rem;">${pick.faculty} | Used: ${this.usedSkills.length}/${this.skills.reduce((a,f)=>a+f.skills.length,0)}</span>`
    document.getElementById('promptInput').value = `Analyze and provide a comprehensive briefing on: ${pick.skill} within the domain of ${pick.faculty}. Include key concepts, current state, practical applications, and future outlook.`
    document.getElementById('charCounter').textContent = `${document.getElementById('promptInput').value.length} chars`
  },

  clearSession() {
    document.getElementById('messages').innerHTML = ''
    ChatModule.messages = []
    this.hidePanel()
    this.showToast('New session started.')
  },

  // ─── PANEL SYSTEM ───────────────────────────────────────────
  showPanel(type) {
    this.menuOpen = false
    document.getElementById('menuDropdown').classList.add('hidden')
    const overlay = document.getElementById('panelOverlay')
    const title = document.getElementById('panelTitle')
    const body = document.getElementById('panelBody')
    overlay.classList.remove('hidden')

    const panels = {
      agent: {
        title: 'SWITCH AGENT',
        html: `
          <div class="form-group">
            <label>Active Agent</label>
            <select id="panelAgentSelect" class="input-select">
              <option value="sparta" ${this.currentAgent==='sparta'?'selected':''}>S.P.A.R.T.A (Master)</option>
              <option value="build" ${this.currentAgent==='build'?'selected':''}>Build (Development)</option>
              <option value="plan" ${this.currentAgent==='plan'?'selected':''}>Plan (Analysis)</option>
              <option value="general" ${this.currentAgent==='general'?'selected':''}>General (Multi-purpose)</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="App.applyAgent()">APPLY</button>`
      },
      model: {
        title: 'MODEL SELECTION',
        html: `
          <div class="form-group">
            <label>AI Model</label>
            <select id="panelModelSelect" class="input-select">
              <option value="">Auto-select</option>
              <option value="gemini-3-flash">Gemini 3 Flash</option>
              <option value="gemini-3-pro">Gemini 3 Pro</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-4-sonnet">Claude 4 Sonnet</option>
              <option value="claude-4-haiku">Claude 4 Haiku</option>
            </select>
          </div>
          <div class="form-group">
            <label>API Key (if required)</label>
            <input type="password" id="apiKeyInput" class="input-text" placeholder="Enter API key" value="${localStorage.getItem('sparta_api_key') || ''}">
          </div>
          <button class="btn btn-primary" onclick="App.applyModel()">APPLY</button>`
      },
      provider: {
        title: 'AI PROVIDERS',
        html: `
          <p style="margin-bottom:1rem;color:var(--text-dim);font-size:0.8rem;">Configure AI providers. The engine auto-detects available providers from environment variables and config files.</p>
          <div class="form-group">
            <label>Provider</label>
            <select class="input-select">
              <option>Google Gemini</option>
              <option>OpenAI</option>
              <option>Anthropic</option>
              <option>OpenRouter</option>
              <option>Local (Ollama)</option>
            </select>
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input type="password" class="input-text" placeholder="sk-...">
          </div>
          <button class="btn btn-emerald">ADD PROVIDER</button>`
      },
      sessions: {
        title: 'SESSION HISTORY',
        html: `
          <p style="color:var(--text-dim);font-size:0.8rem;margin-bottom:1rem;">Previous sessions will appear here when the engine is connected.</p>
          <div style="text-align:center;padding:2rem;color:var(--text-dim);font-family:var(--font-mono);font-size:0.7rem;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
            No session history yet.
          </div>`
      },
      export: {
        title: 'EXPORT SESSION',
        html: `
          <p style="margin-bottom:1rem;color:var(--text-dim);font-size:0.8rem;">Export the current session as a file.</p>
          <div class="preset-grid" style="grid-template-columns:1fr 1fr;">
            <button class="preset-btn" onclick="App.exportSession('markdown')">Markdown</button>
            <button class="preset-btn" onclick="App.exportSession('json')">JSON</button>
            <button class="preset-btn" onclick="App.exportSession('text')">Plain Text</button>
            <button class="preset-btn" onclick="App.hidePanel()">Cancel</button>
          </div>`
      },
      mcp: {
        title: 'MCP SERVERS',
        html: '<p style="margin-bottom:1rem;color:var(--text-dim);font-size:0.8rem;">Model Context Protocol servers extend Sparta with external tools. Below are recommended servers:</p>' +
          '<div style="max-height:280px;overflow-y:auto;margin-bottom:1rem;display:flex;flex-direction:column;gap:0.3rem;font-family:var(--font-mono);font-size:0.65rem;">' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Filesystem</strong> — Read/write files, search directories</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">GitHub</strong> — Repos, issues, PRs, code search</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">PostgreSQL</strong> — Query databases, schemas</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Web Scraper</strong> — Fetch and extract web content</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Brave Search</strong> — Web and local search</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Memory</strong> — Knowledge graph, entity storage</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Puppeteer</strong> — Browser automation, screenshots</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">SQLite</strong> — Local database queries</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Docker</strong> — Container management</div>' +
          '<div style="padding:0.5rem;background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);border-radius:6px;"><strong style="color:var(--cyan);">Slack</strong> — Messaging, channel ops</div>' +
          '</div>' +
          '<div class="form-group"><label>Add Custom Server</label><input type="text" class="input-text" placeholder="Server name"></div>' +
          '<div class="form-group"><label>Command</label><input type="text" class="input-text" placeholder="npx @modelcontextprotocol/server-filesystem /path"></div>' +
          '<button class="btn btn-emerald">ADD SERVER</button>'
      },
      skills: {
        title: 'SKILLS & FACULTIES',
        html: `
          <p style="margin-bottom:1rem;color:var(--text-dim);font-size:0.8rem;">S.P.A.R.T.A has access to 41 faculties with 376+ skills. All loaded automatically.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;font-family:var(--font-mono);font-size:0.65rem;">
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Meta-Reasoning</div>
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Engineering</div>
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Medical</div>
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Finance</div>
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Legal</div>
            <div style="padding:0.4rem;background:rgba(0,240,255,0.05);border-radius:4px;border:1px solid rgba(0,240,255,0.1);">Security</div>
          </div>`
      },
      config: {
        title: 'CONFIGURATION',
        html: `
          <div class="form-group">
            <label>OPENCODE_CONFIG_DIR</label>
            <input type="text" class="input-text" value="${localStorage.getItem('sparta_config_dir') || '~/.config/sparta'}" id="configDirInput">
          </div>
          <div class="form-group">
            <label>API Key (for Gemini Live / external services)</label>
            <input type="password" class="input-text" value="${localStorage.getItem('sparta_api_key') || ''}" id="configApiKeyInput" placeholder="Enter your API key">
          </div>
          <button class="btn btn-primary" onclick="App.saveConfig()">SAVE</button>`
      },
      themes: {
        title: 'THEME',
        html: `
          <p style="margin-bottom:1rem;color:var(--text-dim);font-size:0.8rem;">Choose the visual theme for S.P.A.R.T.A.</p>
          <div class="preset-grid" style="grid-template-columns:1fr 1fr;">
            <button class="preset-btn" style="border-color:var(--cyan);color:var(--cyan);" onclick="App.setTheme('dark')">Dark (Default)</button>
            <button class="preset-btn" onclick="App.setTheme('darker')">Darker</button>
            <button class="preset-btn" onclick="App.setTheme('amber')">Amber HUD</button>
            <button class="preset-btn" onclick="App.setTheme('emerald')">Emerald</button>
          </div>`
      },
      login: {
        title: 'SIGN IN',
        html: `
          <div class="form-group">
            <label>Username / Email</label>
            <input type="text" class="input-text" placeholder="operator@sparta.ai">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="input-text" placeholder="••••••••">
          </div>
          <button class="btn btn-primary">SIGN IN</button>
          <p style="margin-top:0.75rem;font-size:0.7rem;color:var(--text-dim);text-align:center;">Local mode: no sign-in required. API keys are set in Configuration.</p>`
      },
      profile: {
        title: 'PROFILE',
        html: `
          <div style="text-align:center;padding:1rem;">
            <img src="assets/img/logo-t.png" style="width:64px;height:auto;border-radius:50%;border:2px solid var(--border);margin-bottom:0.75rem;">
            <p style="font-weight:600;">Local Operator</p>
            <p style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono);">S.P.A.R.T.A Terminal v1.0.0</p>
          </div>
          <div class="form-group">
            <label>Display Name</label>
            <input type="text" class="input-text" value="Local Operator">
          </div>`
      },
      about: {
        title: 'ABOUT S.P.A.R.T.A',
        html: `
          <div style="text-align:center;padding:1rem;">
            <img src="assets/img/logo-t.png" style="width:80px;height:auto;margin-bottom:1rem;">
            <h3 style="font-family:var(--font-orbitron);color:var(--cyan);letter-spacing:0.15em;margin-bottom:0.25rem;">S.P.A.R.T.A</h3>
            <p style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono);">Super Personal Assistant for Real-time Tactical & Autonomous</p>
            <p style="font-size:0.7rem;color:var(--text-dim);margin-top:1rem;">Version 1.0.0</p>
            <p style="font-size:0.65rem;color:var(--text-dim);margin-top:0.5rem;">Built on opencode engine. 41 faculties. 376 skills.</p>
          </div>`
      },
      manual: {
        title: 'MANUAL INSTRUCTIONS',
        html: `
          <div style="font-size:0.8rem;line-height:1.7;">
            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin-bottom:0.5rem;">GETTING STARTED</h4>
            <p>1. Ensure the S.P.A.R.T.A engine is running (<code style="color:var(--cyan);">sparta serve</code> in terminal).</p>
            <p>2. Type your directive in the input box at the bottom right.</p>
            <p>3. Click <strong style="color:var(--cyan);">ENGAGE</strong> or press <code style="color:var(--cyan);">Enter</code> to send.</p>
            <p>4. Use <code style="color:var(--cyan);">Shift+Enter</code> for new lines in your message.</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">VOICE MODE</h4>
            <p>• <strong>Built-in:</strong> Uses Gemini Live API. Requires an API key set in Configuration.</p>
            <p>• <strong>External:</strong> Connect to any WebSocket voice service. Enter the WSS URL and optional API key.</p>
            <p>• Click <strong style="color:var(--emerald);">INITIALIZE LIVE COMMS</strong> to start, then speak into your microphone.</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">IMAGE ANALYSIS</h4>
            <p>• Click the drop zone or drag an image to attach it.</p>
            <p>• Select which AI model to use for analysis (not all models support vision).</p>
            <p>• The image is sent alongside your text prompt when you click ENGAGE.</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">QUICK COMMANDS</h4>
            <p>• Pre-written tactical directives for common mission types.</p>
            <p>• Click any preset button to auto-fill the input, then customize or send.</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">AGENT & MODEL</h4>
            <p>• <strong>Agent:</strong> Switch between Sparta (master), Build (dev), Plan (analysis), or General.</p>
            <p>• <strong>Model:</strong> Choose which AI backend to use for responses.</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">MENU (☰) OPTIONS</h4>
            <p>• <strong>Agent / Model:</strong> Change active agent or AI model.</p>
            <p>• <strong>Providers:</strong> Add/configure AI provider API keys.</p>
            <p>• <strong>History:</strong> View and resume past sessions.</p>
            <p>• <strong>Export:</strong> Download the current session as Markdown, JSON, or Plain Text.</p>
            <p>• <strong>MCP Servers:</strong> Add external tool plugins (filesystem, database, etc.).</p>
            <p>• <strong>Skills:</strong> View Sparta's 41 faculties / 376 skills.</p>
            <p>• <strong>Configuration:</strong> Set API keys and config directory.</p>
            <p>• <strong>Theme:</strong> Switch between visual themes.</p>
            <p>• <strong>Sign In / Profile:</strong> Manage your account (local mode requires no sign-in).</p>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">SKILLS & FACULTIES</h4>
            <p>All 41 faculties and their skills are loaded automatically. Below is the live database:</p>
            <div style="max-height:300px;overflow-y:auto;margin-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem;font-size:0.6rem;" id="skillsList"></div>

            <h4 style="color:var(--cyan);font-family:var(--font-orbitron);font-size:0.75rem;margin:1rem 0 0.5rem;">TIPS</h4>
            <p>• Enable <strong>Web Recon</strong> to let Sparta search the internet for answers.</p>
            <p>• Use the <strong>Clear</strong> button to reset your input.</p>
            <p>• Click <strong>New Session</strong> from the menu to clear the chat.</p>
          </div>`
      },
      logout: {
        title: 'LOGOUT',
        html: `
          <p style="margin-bottom:1rem;">Are you sure you want to log out?</p>
          <div class="preset-grid" style="grid-template-columns:1fr 1fr;">
            <button class="preset-btn" onclick="App.hidePanel()">Cancel</button>
            <button class="preset-btn" style="border-color:#ff0055;color:#ff0055;" onclick="App.logout()">LOGOUT</button>
          </div>`
      }
    }

    const p = panels[type] || { title: 'UNKNOWN', html: '<p>Panel not found.</p>' }
    title.textContent = p.title
    body.innerHTML = p.html
    if (type === 'manual') this.renderSkillsList()
    window.addEventListener('resize', () => {
      const cb = document.getElementById('panelCloseBtn')
      if (cb && !document.getElementById('panelOverlay').classList.contains('hidden')) {
        cb.style.display = (document.getElementById('panelTitle')?.textContent === 'CONFIGURATION' && window.innerWidth <= 640) ? 'none' : ''
      }
    }, { once: true })
    const closeBtn = document.getElementById('panelCloseBtn')
    if (closeBtn) {
      closeBtn.style.display = (type === 'config' && window.innerWidth <= 640) ? 'none' : ''
    }
  },

  renderSkillsList() {
    const el = document.getElementById('skillsList')
    if (!el) return
    el.innerHTML = this.skills.map(f =>
      `<div style="padding:0.35rem 0.5rem;background:rgba(0,240,255,0.03);border:1px solid rgba(0,240,255,0.08);border-radius:4px;">
        <strong style="color:var(--cyan);">${f.faculty}</strong>
        <span style="color:var(--text-dim);margin-left:0.3rem;">${f.skills.length} skills</span>
        <div style="color:var(--text-dim);font-size:0.55rem;margin-top:0.15rem;">${f.skills.join(', ')}</div>
      </div>`
    ).join('')
  },

  hidePanel() {
    document.getElementById('panelOverlay').classList.add('hidden')
    const closeBtn = document.getElementById('panelCloseBtn')
    if (closeBtn) closeBtn.style.display = ''
  },

  applyAgent() {
    const sel = document.getElementById('panelAgentSelect')
    this.currentAgent = sel.value
    document.getElementById('agentSelect').value = sel.value
    document.getElementById('agentBadge').textContent = sel.value.toUpperCase()
    this.hidePanel()
    this.showToast(`Agent switched to ${sel.value.toUpperCase()}`)
  },

  applyModel() {
    const sel = document.getElementById('panelModelSelect')
    this.currentModel = sel.value
    document.getElementById('modelSelect').value = sel.value
    const key = document.getElementById('apiKeyInput').value
    if (key) localStorage.setItem('sparta_api_key', key)
    this.hidePanel()
    this.showToast(`Model updated: ${sel.value || 'auto-select'}`)
  },

  saveConfig() {
    const dir = document.getElementById('configDirInput').value
    const key = document.getElementById('configApiKeyInput').value
    if (dir) localStorage.setItem('sparta_config_dir', dir)
    if (key) localStorage.setItem('sparta_api_key', key)
    this.hidePanel()
    this.showToast('Configuration saved.')
  },

  setTheme(name) {
    const root = document.documentElement
    const themes = {
      dark: { bg: '#03070d', panel: 'rgba(8,16,28,0.85)', cyan: '#00f0ff', border: 'rgba(0,240,255,0.2)' },
      darker: { bg: '#010305', panel: 'rgba(4,8,14,0.9)', cyan: '#00ccff', border: 'rgba(0,204,255,0.15)' },
      amber: { bg: '#0a0802', panel: 'rgba(20,16,4,0.85)', cyan: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
      emerald: { bg: '#020a05', panel: 'rgba(4,16,8,0.85)', cyan: '#10b981', border: 'rgba(16,185,129,0.2)' }
    }
    const t = themes[name]
    if (t) {
      root.style.setProperty('--bg', t.bg)
      root.style.setProperty('--panel', t.panel)
      root.style.setProperty('--cyan', t.cyan)
      root.style.setProperty('--border', t.border)
      document.body.style.background = t.bg
    }
    this.hidePanel()
    this.showToast(`Theme: ${name}`)
  },

  exportSession(format) {
    const msgs = document.querySelectorAll('#messages .msg')
    let output = ''
    if (format === 'markdown') {
      msgs.forEach(m => {
        const role = m.classList.contains('user') ? 'User' : 'SPARTA'
        const text = m.querySelector('.msg-bubble')?.textContent || ''
        output += `**${role}:** ${text}\n\n`
      })
    } else if (format === 'json') {
      const data = []
      msgs.forEach(m => {
        data.push({
          role: m.classList.contains('user') ? 'user' : 'assistant',
          content: m.querySelector('.msg-bubble')?.textContent || ''
        })
      })
      output = JSON.stringify(data, null, 2)
    } else {
      msgs.forEach(m => {
        const role = m.classList.contains('user') ? 'User' : 'SPARTA'
        output += `${role}: ${m.querySelector('.msg-bubble')?.textContent || ''}\n`
      })
    }
    const blob = new Blob([output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sparta-session.${format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}`
    a.click()
    this.hidePanel()
    this.showToast(`Session exported as ${format}`)
  },

  logout() {
    localStorage.clear()
    this.hidePanel()
    this.showToast('Logged out. API keys cleared.')
  },

  // ─── ENGINE ──────────────────────────────────────────────────
  async checkEngine() {
    try {
      const res = await fetch(`/api/health`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        this.setOnline(true)
        await this.createSession()
      } else { this.setOnline(false) }
    } catch { this.setOnline(false) }
  },

  setOnline(online) {
    document.getElementById('statusDot').className = `status-dot ${online ? 'online' : 'offline'}`
    document.getElementById('statusLabel').textContent = online ? 'ENGINE ONLINE' : 'ENGINE OFFLINE'
  },

  async createSession() {
    try {
      const res = await fetch(`/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        const data = await res.json()
        this.sessionId = data.id || data.sessionID
      }
    } catch {}
  },

  async sendToEngine(payload) {
    const text = payload.messages[1]?.content || ''
    if (!this.sessionId) return this.fallback(text)
    try {
      // send prompt
      const res = await fetch(`/api/session/${this.sessionId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: { text } })
      })
      if (!res.ok) return this.fallback(text)

      // wait for completion via SSE
      const response = await this.waitForResponse(this.sessionId)
      return response || 'No response.'
    } catch {
      return this.fallback(text)
    }
  },

  async waitForResponse(sessionId) {
    try {
      await fetch(`/api/session/${sessionId}/wait`, { method: 'POST', signal: AbortSignal.timeout(120000) })
      const res = await fetch(`/api/session/${sessionId}/message`, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const json = await res.json()
        const msgs = json.data || json.messages || (Array.isArray(json) ? json : [])
        // get last assistant message content
        for (let i = msgs.length - 1; i >= 0; i--) {
          const m = msgs[i]
          if (m.type === 'assistant' && m.content) {
            return m.content.map(c => c.text || '').filter(Boolean).join('')
          }
          if (m.role === 'assistant' && m.content) {
            return typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          }
        }
      }
    } catch {}
    return ''
  },

  fallback(text) {
    return `**TACTICAL ANALYSIS**

Your directive: *"${text.substring(0, 60)}..."*

Engine is offline. Connect via \`sparta serve\` for full AI-powered analysis.
  ` },

  hideLoader() {
    const ls = document.getElementById('loadingScreen')
    ls.classList.add('fade-out')
    setTimeout(() => {
      ls.classList.add('hidden')
      document.getElementById('app').classList.remove('hidden')
    }, 600)
  },

  showToast(msg) {
    let el = document.getElementById('toast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'toast'
      document.body.appendChild(el)
    }
    el.textContent = `ⓘ ${msg}`
    el.className = 'toast show'
    clearTimeout(this._toastTimer)
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 3000)
  }
}

document.addEventListener('DOMContentLoaded', () => App.init())
