/**
 * Plans Configuration
 * Edit this file to change prices, descriptions, or features on the landing page.
 */

const PLANS_CONFIG = [
    {
        id: 'basic',
        name: 'BASIC',
        icon: 'fa-rocket', // FontAwesome class
        description: 'Ideal para pequeños equipos que inician en la gestión digital.',
        price: 50, // USD
        userLimit: 10,
        highlight: false, // "Más Popular" badge
        features: [
            'Módulo de Correspondencia',
            'Módulo de Gestión Documental',
            'Módulo de Archivo Central',
            'Firmas Electrónicas Simples Ilimitadas',
        ],
        buttonText: 'Contactar Ventas',
        buttonAction: 'contact', // contact | custom
        style: 'standard' // standard | white | custom
    },
    {
        id: 'standard',
        name: 'STANDARD',
        icon: 'fa-layer-group',
        description: 'Para empresas en crecimiento con necesidades de PQRS.',
        price: 150,
        userLimit: 50,
        highlight: true,
        features: [
            'Módulo de Correspondencia',
            'Módulo de Gestión Documental',
            'Módulo de Archivo Central',
            'Módulo de PQRS',
            'Reportes Ampliados',
            'Firmas Electrónicas Simples Ilimitadas',
            '50 emails certificados por mes',
            '50 firmas certificadas por mes',
        ],
        buttonText: 'Contactar Ventas',
        buttonAction: 'contact',
        style: 'standard'
    },
    {
        id: 'professional',
        name: 'PROFESSIONAL',
        icon: 'fa-briefcase',
        description: 'Solución completa certificada con ISO 9001.',
        price: 300,
        userLimit: 100,
        highlight: false,
        features: [
            'Módulo de Correspondencia',
            'Módulo de Gestión Documental',
            'Módulo de Archivo Central',
            'Módulo de PQRS',
            'Reportes Ampliados',
            'Módulo de Mesa de Servicio (Help Desk)',
            'Módulo Sistema ISO 9001:2015',
            'Módulo de Flujos de Trabajo',
            'Integraciones Avanzadas (LDAP, API, ERP, CRM, etc.)',
            'Firmas Electrónicas Simples Ilimitadas',
            '100 emails certificados por mes',
            '100 firmas certificadas por mes',
        ],
        buttonText: 'Contactar Ventas',
        buttonAction: 'contact',
        style: 'standard'
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        icon: 'fa-building',
        description: 'Infraestructura dedicada y soporte corporativo.',
        price: 'Contactar', // Text instead of number
        userLimit: 'Más de 100', // Text
        highlight: false,
        features: [
            'Licenciamiento On Premise o SaaS',
            'Escalabilidad Ilimitada',
            'Soporte Prioritario',
            'Instancias Dedicadas'
        ],
        buttonText: 'Contactar Ventas',
        buttonAction: 'contact',
        style: 'white' // bg-white text-dark styling
    },
    {
        id: 'custom',
        name: 'A MEDIDA',
        icon: 'fa-sliders-h',
        description: 'Arma tu plan seleccionando módulos, usuarios y almacenamiento específico.',
        price: null, // No price display
        userLimit: null,
        highlight: false,
        features: [], // No standard feature list
        buttonText: 'Configurar mi plan',
        buttonAction: 'custom', // Triggers navigation
        style: 'dashed' // Dashed border styling
    }
];