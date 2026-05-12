const es = {
  // ─── Navigation ────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    analysis: 'Análisis Creativo',
    products: 'Productos & SKUs',
    library: 'Biblioteca',
    agents: 'Agentes IA',
    settings: 'Configuración',
  },

  // ─── TopBar ────────────────────────────────────────────────────────────────
  topbar: {
    dashboard: { title: 'Dashboard', subtitle: 'Resumen de cumplimiento de marca' },
    upload: { title: 'Análisis Creativo', subtitle: 'Subir y validar artes' },
    products: { title: 'Productos & SKUs', subtitle: 'Administrar catálogo de productos' },
    brands: { title: 'Biblioteca', subtitle: 'Marcas, reglas y reportes' },
    agents: { title: 'Agentes IA', subtitle: 'Configuración del agente de validación' },
    settings: { title: 'Configuración', subtitle: 'Cuenta y preferencias' },
    fallback: 'QA',
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    title: 'Notificaciones',
    empty: 'Sin notificaciones recientes',
    completed: 'Validación completada',
    failed: 'Validación fallida',
    processing: 'Procesando…',
    score: 'Score',
    markSeen: 'Marcar como leídas',
    viewAll: 'Ver todas las validaciones',
  },

  // ─── Common ────────────────────────────────────────────────────────────────
  common: {
    save: 'Guardar cambios',
    cancel: 'Cancelar',
    close: 'Cerrar',
    view: 'Ver',
    download: 'Descargar',
    delete: 'Eliminar',
    add: 'Agregar',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Cargando…',
    logout: 'Cerrar sesión',
    invite: 'Invitar',
    confirm: 'Confirmar',
    back: 'Volver',
    noData: 'Sin datos',
    or: 'o',
    vsLastMonth: '% vs mes anterior',
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    kpi: {
      totalValidations: 'Total Validaciones',
      avgScore: 'Score Promedio',
      issuesFound: 'Issues Encontrados (30d)',
      passRate: 'Tasa de Aprobación',
    },
    chart: {
      label: 'ACTIVIDAD DE VALIDACIONES',
      title: 'Resumen Mensual',
      noData: 'Sin datos de validación aún',
      validations: 'Validaciones',
    },
    gauge: {
      label: 'SCORE PROMEDIO DE CUMPLIMIENTO',
      critical: 'Crítico',
      warning: 'Advertencia',
      passed: 'Aprobado',
    },
    distribution: {
      label: 'CATEGORÍAS DE ISSUES',
      title: 'Distribución de Errores',
      noData: 'Sin datos de issues aún',
    },
    topIssues: {
      label: 'MÁS FRECUENTES',
      title: 'Issues Más Comunes',
      noData: 'Sin issues registrados aún',
    },
    insights: {
      label: 'AI INSIGHTS',
      empty: 'Ejecutá tu primera validación para ver insights.',
    },
  },

  // ─── Products ──────────────────────────────────────────────────────────────
  products: {
    catalog: 'CATÁLOGO DE PRODUCTOS',
    products: 'productos',
    addProduct: 'Agregar Producto',
    searchPlaceholder: 'Buscar por nombre o SKU…',
    allBrands: 'Todas las marcas',
    modal: {
      addTitle: 'Agregar Producto',
      editTitle: 'Editar Producto',
      name: 'NOMBRE',
      sku: 'SKU',
      brand: 'MARCA',
      category: 'CATEGORÍA',
      namePlaceholder: 'Ej: Pro Plan Adult Chicken',
      skuPlaceholder: 'Ej: PP-AD-CH-3KG',
      brandPlaceholder: 'Ej: Puppies Pro Plan',
      categoryPlaceholder: 'Ej: Dry Food',
    },
    table: {
      product: 'PRODUCTO',
      sku: 'SKU',
      brand: 'MARCA',
      assets: 'ARTES',
      status: 'ESTADO',
      created: 'CREADO',
      actions: 'ACCIONES',
      noProducts: 'Sin productos. Agregá uno para comenzar.',
    },
  },

  // ─── Upload ────────────────────────────────────────────────────────────────
  upload: {
    title: 'Subir y Analizar Arte',
    subtitle: 'Subí tu arte y seleccioná el producto/SKU para validar contra guías de marca y documentación regulatoria.',
    dropzone: {
      active: 'Soltá tu arte aquí',
      idle: 'Arrastrá y soltá tu arte aquí',
      hint: 'Soporta PNG, JPG, PDF — Máx 50MB',
      browse: 'Seleccionar archivo',
    },
    addMore: 'Agregar más',
    selectProduct: 'SELECCIONAR PRODUCTO / SKU',
    selectPlaceholder: 'Seleccioná un producto o SKU…',
    docSection: {
      label: 'DOCUMENTACIÓN DE VALIDACIÓN',
      hint: 'Adjuntá guías de marca, PDFs regulatorios o manuales de estilo. La IA los usará para validar tu arte.',
      dropActive: 'Soltá PDFs aquí',
      dropIdle: 'Soltá PDFs aquí o seleccioná',
      dropHint: 'PDF, DOCX — Máx 25MB por archivo · múltiples archivos soportados',
    },
    run: 'Ejecutar Validación IA',
    analyzing: 'Analizando con IA',
    analyzeHint: 'El modelo está verificando el cumplimiento…',
    noFile: 'Subí un arte para comenzar',
    noProduct: 'Seleccioná un producto para continuar',
    preview: '+ VISTA PREVIA',
    uploadPreview: 'Subí un archivo para ver la vista previa',
    selectFirst: 'Seleccioná un producto primero',
    failedToStart: 'Error al iniciar la validación. Intentá de nuevo.',
  },

  // ─── Validation Results ────────────────────────────────────────────────────
  validation: {
    title: 'Resultado de Validación',
    subtitle: 'Análisis IA completado',
    score: 'SCORE DE CUMPLIMIENTO',
    summary: 'RESUMEN IA',
    categories: {
      label: 'CATEGORÍAS',
      brand: 'Marca',
      legal: 'Legal',
      regulatory: 'Regulatorio',
      typography: 'Tipografía',
      color: 'Color',
      spacing: 'Espaciado',
      imagery: 'Imágenes',
    },
    issues: {
      label: 'ISSUES DETECTADOS',
      noIssues: 'Sin issues detectados en esta categoría.',
      severity: {
        critical: 'Crítico',
        warning: 'Advertencia',
        info: 'Info',
      },
    },
    docs: 'DOCUMENTACIÓN UTILIZADA',
    status: {
      completed: 'Completada',
      failed: 'Fallida',
      processing: 'Procesando',
      pending: 'Pendiente',
    },
    download: 'Descargar Informe PDF',
    processing: {
      title: 'Analizando con IA…',
      subtitle: 'El motor de validación está procesando tu arte.',
    },
    failed: {
      title: 'Validación fallida',
      subtitle: 'Ocurrió un error durante la validación.',
    },
    passed: 'Aprobado',
    notPassed: 'No aprobado',
  },

  // ─── Agents ────────────────────────────────────────────────────────────────
  agents: {
    title: 'Motor de Validación IA',
    subtitle: 'Un modelo multimodal analiza cada pieza contra {{count}} checks en 7 categorías.',
    architecture: {
      label: 'Arquitectura single-call.',
      desc: 'Cada validación envía la imagen + contexto del producto + documentos de referencia al modelo activo en una sola llamada. El modelo devuelve score, resumen e issues con posición y severidad para las 7 categorías simultáneamente.',
    },
    providers: 'PROVEEDORES',
    categories: 'QUÉ ANALIZA — {{count}} CHECKS EN 7 CATEGORÍAS',
    status: {
      active: 'Activo',
      configured: 'Configurado',
      noKey: 'Sin credenciales',
    },
    changeProvider: 'Para cambiar el proveedor activo, actualizá',
    changeProviderSuffix: 'en',
    stats: {
      validations: 'Validaciones',
      avgScore: 'Score promedio',
      issuesFound: 'Issues detectados',
    },
  },

  // ─── Library ───────────────────────────────────────────────────────────────
  library: {
    brands: {
      title: 'Marcas activas',
      products: 'productos',
      assets: 'artes',
      avgScore: 'Score prom.',
      noScore: 'Sin validaciones',
      noData: 'Sin marcas. Creá un producto para comenzar.',
      viewProducts: 'Ver productos →',
    },
    rules: {
      title: 'Reglas de validación',
      activeRules: '{{count}} reglas activas',
      categories: {
        brand: 'Marca',
        legal: 'Legal',
        regulatory: 'Regulatorio',
        typography: 'Tipografía',
        color: 'Color',
        spacing: 'Espaciado',
        imagery: 'Imágenes',
      },
    },
    reports: {
      title: 'Todos los reportes',
      exportAll: 'Exportar todos',
      noReports: 'Sin reportes. Ejecutá validaciones para generar reportes.',
      table: {
        art: 'ARTE',
        product: 'PRODUCTO',
        score: 'SCORE',
        date: 'FECHA',
        action: '',
      },
      status: {
        completed: 'Aprobado',
        failed: 'Rechazado',
        processing: 'Procesando',
        pending: 'Pendiente',
      },
      view: 'Ver →',
      download: 'PDF',
    },
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    title: 'Configuración',
    subtitle: 'Administrá tu organización, equipo e integraciones.',
    tabs: {
      general: 'General',
      users: 'Usuarios & Roles',
    },
    general: {
      org: 'Organización',
      fields: {
        company: 'Nombre de la empresa',
        country: 'País',
        timezone: 'Zona horaria',
        lang: 'Idioma predeterminado',
      },
      score: {
        title: 'Puntuación de conformidad',
        subtitle: 'Definí los umbrales que determinan el color del score de validación.',
        high: 'Score alto (verde)',
        mid: 'Score medio (naranja)',
        low: 'Score bajo (rojo)',
      },
    },
    users: {
      team: 'Equipo',
      members: 'miembros',
      inviteBtn: 'Invitar usuario',
      inviteLabel: 'EMAIL',
      roleLabel: 'ROL',
      invite: 'Invitar',
      table: {
        user: 'Usuario',
        email: 'Email',
        role: 'Rol',
        lastActive: 'Último acceso',
      },
      pending: 'PENDIENTE',
      roles: {
        admin: { label: 'Admin', desc: 'Acceso total: configuración, usuarios, validaciones' },
        manager: { label: 'Manager', desc: 'Puede gestionar productos, validaciones y aprobar' },
        reviewer: { label: 'Reviewer', desc: 'Puede crear y revisar validaciones, comentar y enviar a aprobación por mail' },
        viewer: { label: 'Viewer', desc: 'Solo lectura: puede ver validaciones aprobadas' },
      },
      users_one: '{{count}} usuario',
      users_other: '{{count}} usuarios',
    },
  },

  // ─── Login ─────────────────────────────────────────────────────────────────
  login: {
    tagline: 'Ship compliant packaging.\n',
    taglineHighlight: 'Faster.',
    taglineDesc: 'Validación IA contra brand guidelines, normativa SENASA y estándares nutricionales — en 30 segundos, no en 3 semanas.',
    features: {
      brand: { label: 'Guías de Marca', desc: 'Posición de logo, precisión de colores, tipografía' },
      legal: { label: 'Requisitos Legales', desc: 'Declaraciones obligatorias, listas de ingredientes' },
      regulatory: { label: 'Cumplimiento Regulatorio', desc: 'FDA, AAFCO, reglas por país' },
    },
    welcome: 'Bienvenido',
    signIn: 'Ingresá a tu cuenta',
    email: 'Dirección de email',
    password: 'Contraseña',
    submit: 'Ingresar',
    submitting: 'Ingresando…',
    demo: 'Acceder como Demo',
  },
}

export default es
