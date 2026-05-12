const en = {
  // ─── Navigation ────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    analysis: 'Creative Analysis',
    products: 'Products & SKUs',
    library: 'Library',
    agents: 'AI Agents',
    settings: 'Settings',
  },

  // ─── TopBar ────────────────────────────────────────────────────────────────
  topbar: {
    dashboard: { title: 'Dashboard', subtitle: 'Brand compliance overview' },
    upload: { title: 'Creative Analysis', subtitle: 'Upload & validate creative assets' },
    products: { title: 'Products & SKUs', subtitle: 'Manage product catalog' },
    brands: { title: 'Library', subtitle: 'Brands, rules & reports' },
    agents: { title: 'AI Agents', subtitle: 'Validation agent configuration' },
    settings: { title: 'Settings', subtitle: 'Account & preferences' },
    fallback: 'QA',
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    title: 'Notifications',
    empty: 'No recent notifications',
    completed: 'Validation completed',
    failed: 'Validation failed',
    processing: 'Processing…',
    score: 'Score',
    markSeen: 'Mark as read',
    viewAll: 'View all validations',
  },

  // ─── Common ────────────────────────────────────────────────────────────────
  common: {
    save: 'Save changes',
    cancel: 'Cancel',
    close: 'Close',
    view: 'View',
    download: 'Download',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading…',
    logout: 'Logout',
    invite: 'Invite',
    confirm: 'Confirm',
    back: 'Back',
    noData: 'No data',
    or: 'or',
    vsLastMonth: '% vs last month',
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    kpi: {
      totalValidations: 'Total Validations',
      avgScore: 'Avg Compliance Score',
      issuesFound: 'Issues Found (30d)',
      passRate: 'Pass Rate',
    },
    chart: {
      label: 'VALIDATION ACTIVITY',
      title: 'Monthly Overview',
      noData: 'No validation data yet',
      validations: 'Validations',
    },
    gauge: {
      label: 'AVG COMPLIANCE SCORE',
      critical: 'Critical',
      warning: 'Warning',
      passed: 'Passed',
    },
    distribution: {
      label: 'ISSUE CATEGORIES',
      title: 'Error Distribution',
      noData: 'No issue data yet',
    },
    topIssues: {
      label: 'TOP RECURRING',
      title: 'Most Common Issues',
      noData: 'No issues recorded yet',
    },
    insights: {
      label: 'AI INSIGHTS',
      empty: 'Run your first validation to see insights.',
    },
  },

  // ─── Products ──────────────────────────────────────────────────────────────
  products: {
    catalog: 'PRODUCT CATALOG',
    products: 'products',
    addProduct: 'Add Product',
    searchPlaceholder: 'Search by name or SKU…',
    allBrands: 'All brands',
    modal: {
      addTitle: 'Add Product',
      editTitle: 'Edit Product',
      name: 'NAME',
      sku: 'SKU',
      brand: 'BRAND',
      category: 'CATEGORY',
      namePlaceholder: 'e.g. Pro Plan Adult Chicken',
      skuPlaceholder: 'e.g. PP-AD-CH-3KG',
      brandPlaceholder: 'e.g. Puppies Pro Plan',
      categoryPlaceholder: 'e.g. Dry Food',
    },
    table: {
      product: 'PRODUCT',
      sku: 'SKU',
      brand: 'BRAND',
      assets: 'ASSETS',
      status: 'STATUS',
      created: 'CREATED',
      actions: 'ACTIONS',
      noProducts: 'No products. Add one to get started.',
    },
  },

  // ─── Upload ────────────────────────────────────────────────────────────────
  upload: {
    title: 'Upload & Analyze Creative',
    subtitle: 'Upload your creative asset and select the product/SKU to validate against brand guidelines and regulatory documentation.',
    dropzone: {
      active: 'Drop your creative asset here',
      idle: 'Drag & drop your creative asset here',
      hint: 'Supports PNG, JPG, PDF — Max 50MB',
      browse: 'Browse Files',
    },
    addMore: 'Add more',
    selectProduct: 'SELECT PRODUCT / SKU',
    selectPlaceholder: 'Select product or SKU…',
    docSection: {
      label: 'VALIDATION DOCUMENTATION',
      hint: 'Attach brand guidelines, regulatory PDFs, or style guides. These will be used by the AI to validate your creative.',
      dropActive: 'Drop PDFs here',
      dropIdle: 'Drop PDFs here or browse',
      dropHint: 'PDF, DOCX — Max 25MB per file · multiple files supported',
    },
    run: 'Run AI Validation',
    analyzing: 'AI Analyzing',
    analyzeHint: 'The model is checking compliance…',
    noFile: 'Upload a creative asset to get started',
    noProduct: 'Select a product to continue',
    preview: '+ PREVIEW',
    uploadPreview: 'Upload a file to see preview',
    selectFirst: 'Select a product first',
    failedToStart: 'Failed to start validation. Please try again.',
  },

  // ─── Validation Results ────────────────────────────────────────────────────
  validation: {
    title: 'Validation Result',
    subtitle: 'AI analysis completed',
    score: 'COMPLIANCE SCORE',
    summary: 'AI SUMMARY',
    categories: {
      label: 'CATEGORIES',
      brand: 'Brand',
      legal: 'Legal',
      regulatory: 'Regulatory',
      typography: 'Typography',
      color: 'Color',
      spacing: 'Spacing',
      imagery: 'Imagery',
    },
    issues: {
      label: 'DETECTED ISSUES',
      noIssues: 'No issues detected in this category.',
      severity: {
        critical: 'Critical',
        warning: 'Warning',
        info: 'Info',
      },
    },
    docs: 'DOCUMENTATION USED',
    status: {
      completed: 'Completed',
      failed: 'Failed',
      processing: 'Processing',
      pending: 'Pending',
    },
    download: 'Download PDF Report',
    processing: {
      title: 'AI analyzing…',
      subtitle: 'The validation engine is processing your creative.',
    },
    failed: {
      title: 'Validation failed',
      subtitle: 'An error occurred during validation.',
    },
    passed: 'Passed',
    notPassed: 'Not passed',
  },

  // ─── Agents ────────────────────────────────────────────────────────────────
  agents: {
    title: 'AI Validation Engine',
    subtitle: 'A multimodal model analyzes each piece against {{count}} checks across 7 categories.',
    architecture: {
      label: 'Single-call architecture.',
      desc: 'Each validation sends the image + product context + reference documents to the active model in a single call. The model returns score, summary and issues with position and severity for all 7 categories simultaneously.',
    },
    providers: 'PROVIDERS',
    categories: 'WHAT IT ANALYZES — {{count}} CHECKS IN 7 CATEGORIES',
    status: {
      active: 'Active',
      configured: 'Configured',
      noKey: 'No credentials',
    },
    changeProvider: 'To change the active provider, update',
    changeProviderSuffix: 'in',
    stats: {
      validations: 'Validations',
      avgScore: 'Avg score',
      issuesFound: 'Issues found',
    },
  },

  // ─── Library ───────────────────────────────────────────────────────────────
  library: {
    brands: {
      title: 'Active brands',
      products: 'products',
      assets: 'assets',
      avgScore: 'Avg score',
      noScore: 'No validations',
      noData: 'No brands. Create a product to get started.',
      viewProducts: 'View products →',
    },
    rules: {
      title: 'Validation rules',
      activeRules: '{{count}} active rules',
      categories: {
        brand: 'Brand',
        legal: 'Legal',
        regulatory: 'Regulatory',
        typography: 'Typography',
        color: 'Color',
        spacing: 'Spacing',
        imagery: 'Imagery',
      },
    },
    reports: {
      title: 'All reports',
      exportAll: 'Export all',
      noReports: 'No reports. Run validations to generate reports.',
      table: {
        art: 'ASSET',
        product: 'PRODUCT',
        score: 'SCORE',
        date: 'DATE',
        action: '',
      },
      status: {
        completed: 'Passed',
        failed: 'Failed',
        processing: 'Processing',
        pending: 'Pending',
      },
      view: 'View →',
      download: 'PDF',
    },
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    subtitle: 'Manage your organization, team and integrations.',
    tabs: {
      general: 'General',
      users: 'Users & Roles',
    },
    general: {
      org: 'Organization',
      fields: {
        company: 'Company name',
        country: 'Country',
        timezone: 'Timezone',
        lang: 'Default language',
      },
      score: {
        title: 'Compliance scoring',
        subtitle: 'Set thresholds that determine the color of the validation score.',
        high: 'High score (green)',
        mid: 'Mid score (orange)',
        low: 'Low score (red)',
      },
    },
    users: {
      team: 'Team',
      members: 'members',
      inviteBtn: 'Invite user',
      inviteLabel: 'EMAIL',
      roleLabel: 'ROLE',
      invite: 'Invite',
      table: {
        user: 'User',
        email: 'Email',
        role: 'Role',
        lastActive: 'Last active',
      },
      pending: 'PENDING',
      roles: {
        admin: { label: 'Admin', desc: 'Full access: settings, users, validations' },
        manager: { label: 'Manager', desc: 'Can manage products, validations and approve' },
        reviewer: { label: 'Reviewer', desc: 'Can create and review validations, comment and send for approval by email' },
        viewer: { label: 'Viewer', desc: 'Read-only: can view approved validations' },
      },
      users_one: '{{count}} user',
      users_other: '{{count}} users',
    },
  },

  // ─── Login ─────────────────────────────────────────────────────────────────
  login: {
    tagline: 'Ship compliant packaging.\n',
    taglineHighlight: 'Faster.',
    taglineDesc: 'AI validation against brand guidelines, SENASA rules, and nutritional standards — in 30 seconds, not 3 weeks.',
    features: {
      brand: { label: 'Brand Guidelines', desc: 'Logo placement, color accuracy, typography' },
      legal: { label: 'Legal Requirements', desc: 'Mandatory disclosures, ingredient lists' },
      regulatory: { label: 'Regulatory Compliance', desc: 'FDA, AAFCO, country-specific rules' },
    },
    welcome: 'Welcome back',
    signIn: 'Sign in to your account',
    email: 'Email address',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    demo: 'Preview as Demo',
  },
}

export default en
