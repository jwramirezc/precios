// config.js
// Holds all specific pricing numbers and configuration

const PRICING_CONFIG = {
    basePricePerUser: 10,       // Precio base por usuario
    saasMultiplier: 1.0,        // Multiplicador para licencia SaaS
    onPremiseMultiplier: 2.5,   // Multiplicador para licencia On Premise
    annualSaaSMultiplier: 0.85, // Multiplicador para pago anual (15% descuento)
    storagePricePerGB: 0.5,     // Precio por GB de almacenamiento para Base (USD)
    moduleBasePrice: 50,        // Precio base por cada módulo seleccionado en Base (USD)
    exchangeRate: 3800,         // Tasa de cambio COP/USD
    currency: 'COP'             // Moneda por defecto
};

const MODULES_DATA = [
     {
        id: 'correspondencia',
        name: 'Correspondencia',
        description: 'Centralice la correspondencia empresarial con trazabilidad completa.',
        icon: '<i class="fa-solid fa-inbox"></i>'
    },
    {
        id: 'gestion_documental',
        name: 'Gestión Documental',
        description: 'Sistematice sus documentos con plantillas, flujos y trazabilidad.',
        icon: '<i class="fa-solid fa-file-lines"></i>'
    },
    {
        id: 'archivo',
        name: 'Archivo',
        description: 'Gestione archivos históricos, central y gestión con ubicación y ciclo vital.',
        icon: '<i class="fa-solid fa-box-archive"></i>'
    },
    {
        id: 'pqr',
        name: 'Peticiones, Quejas y Reclamos',
        description: 'Agilice la atención al cliente con gestión sistemática de las PQR.',
        icon: '<i class="fa-solid fa-headset"></i>'
    },
    {
        id: 'help_desk',
        name: 'Mesa de Servicio (Help Desk)',
        description: 'Resuelva incidentes con métricas y base de conocimiento integrada.',
        icon: '<i class="fa-solid fa-life-ring"></i>'
    },
    {
        id: 'iso',
        name: 'Sistema ISO 9001:2015',
        description: 'Sistematice su SGC con documentación y seguimiento integral.',
        icon: '<i class="fa-solid fa-medal"></i>'
    },
    {
        id: 'contratos',
        name: 'Contratos',
        description: 'Simplifique procesos contractuales con plantillas y aprobaciones digitales.',
        icon: '<i class="fa-solid fa-file-contract"></i>'
    },
    {
        id: 'historias_laborales',
        name: 'Historias Laborales',
        description: 'Consolide documentos del personal con gestión digital integrada.',
        icon: '<i class="fa-solid fa-id-card"></i>'
    },
    {
        id: 'cuentas_pagar',
        name: 'Cuentas x Pagar',
        description: 'Optimice pagos con gestión automatizada de documentos contables.',
        icon: '<i class="fa-solid fa-file-invoice-dollar"></i>'
    },
    {
        id: 'actas',
        name: 'Actas de Reunión',
        description: 'Documente reuniones con gestión efectiva de pendientes y responsables.',
        icon: '<i class="fa-solid fa-clipboard-check"></i>'
    },
    {
        id: 'firma',
        name: 'Firma Certificada',
        description: 'Firme electrónicamente con respaldo normativo y seguridad.',
        icon: '<i class="fa-solid fa-signature"></i>'
    },
    {
        id: 'medida',
        name: 'Procesos a Medida',
        description: 'Construimos procesos a medida con parametrización especializada.',
        icon: '<i class="fa-solid fa-gears"></i>'
    }
    
];
const REASONS_DATA = [
    {
        icon: 'fa-cloud',
        title: 'Infraestructura 100% SaaS',
        description: 'Despliegue inmediato, seguro y sin costos de hardware.'
    },
    {
        icon: 'fa-business-time',
        title: 'Disponibilidad 24/7',
        description: 'Acceso garantizado desde cualquier dispositivo y lugar.'
    },
    {
        icon: 'fa-rotate',
        title: 'Actualizaciones Automáticas',
        description: 'Siempre contará con la última versión y mejoras.'
    },
    {
        icon: 'fa-certificate',
        title: 'Cumplimiento Normativo',
        description: 'Gestión documental alineada con normas AGN e ISO.'
    },
    {
        icon: 'fa-brain',
        title: 'Inteligencia Artificial',
        description: 'Automatización cognitiva y análisis de datos integrado.'
    },
    {
        icon: 'fa-headset',
        title: 'Soporte Corporativo',
        description: 'Acompañamiento especializado por expertos.'
    },
    {
        icon: 'fa-shield-halved',
        title: 'Seguridad Blindada',
        description: 'Protección de datos empresariales y respaldos diarios.'
    },
    {
        icon: 'fa-cubes',
        title: 'Modularidad Total',
        description: 'Personalice su solución activando solo los módulos necesarios.'
    }
];
