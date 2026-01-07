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
        description: 'Organice, almacene y recupere documentos digitales eficientemente.',
        icon: '<i class="fa-solid fa-file-contract"></i>'
    },
    {
        id: 'archivo_central',
        name: 'Archivo Central y Gestión',
        description: 'Control total de archivos físicos y cumplimiento de tablas de retención.',
        icon: '<i class="fa-solid fa-archive"></i>'
    },
    {
        id: 'pqrs',
        name: 'PQRS',
        description: 'Gestione Peticiones, Quejas, Reclamos y Sugerencias de forma ágil.',
        icon: '<i class="fa-solid fa-comments"></i>'
    },
    {
        id: 'mesa_servicio',
        name: 'Mesa de Servicio',
        description: 'Atención de tickets y soporte técnico interno o externo.',
        icon: '<i class="fa-solid fa-headset"></i>'
    },
    {
        id: 'iso_9001',
        name: 'Sistema ISO 9001:2015',
        description: 'Automatice la gestión de calidad y cumplimiento normativo.',
        icon: '<i class="fa-solid fa-clipboard-check"></i>'
    }
];
