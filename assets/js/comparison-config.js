/**
 * Comparison Matrix Configuration
 * Defines the features and their availability per plan.
 * Values:
 * - true: Check icon (Included)
 * - false: Cross icon (Not included)
 * - string: Custom text (e.g., "10 GB", "Priority")
 */

const COMPARISON_ITEMS = [
    {
        category: 'Módulos y Funcionalidades',
        features: [
            { name: 'Gestión Documental', basic: true, standard: true, pro: true, enterprise: true },
            { name: 'Correspondencia', basic: true, standard: true, pro: true, enterprise: true },
            { name: 'Archivo Central', basic: true, standard: true, pro: true, enterprise: true },
            { name: 'Creación de Plantillas', basic: 'Básicas', standard: true, pro: true, enterprise: true },
            { name: 'Creación de Plantillas Avanzadas', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Diseño de Flujos de Trabajo (BPM)', basic: false, standard: 'Estándar', pro: 'Avanzado', enterprise: 'A Medida' },
            { name: 'Peticiones, Quejas y Reclamos (PQR)', basic: false, standard: true, pro: true, enterprise: true },
            { name: 'Reportes y Analítica', basic: 'Básico', standard: 'Avanzado', pro: 'Avanzado', enterprise: 'Custom' },
            { name: 'Mesa de Ayuda (Help Desk)', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Sistema ISO 9001', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Planes de Mejoramiento', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Gestión de Riesgos', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Auditorias de Calidad', basic: false, standard: false, pro: true, enterprise: true }
        ]
    },
    {
        category: 'Capacidad y Límites',
        features: [
            { name: 'Usuarios Incluidos', basic: '10', standard: '50', pro: '100', enterprise: 'Ilimitado' },
            { name: 'Almacenamiento', basic: '100 GB', standard: '1 TB', pro: '3 TB', enterprise: 'A Medida' },
            { name: 'Emails Certificados / mes', basic: false, standard: '50', pro: '100', enterprise: 'A Medida' },
            { name: 'Firmas Digitales / mes', basic: false, standard: '50', pro: '100', enterprise: 'A Medida' }
        ]
    },
    {
        category: 'Tecnología y Seguridad',
        features: [
            { name: 'SaaS 100% Cloud', basic: true, standard: true, pro: true, enterprise: true },
            { name: 'Despliegue On-Premise', basic: false, standard: false, pro: false, enterprise: true },
            { name: 'Cifrado de Datos', basic: true, standard: true, pro: true, enterprise: true },
            { name: 'Doble Factor de Autenticación (2FA)', basic: false, standard: true, pro: true, enterprise: true },
            { name: 'Autenticación (Google / Outlook)', basic: false, standard: false, pro: true, enterprise: true },
            { name: 'Inteligencia Artificial', basic: false, standard: 'Básica', pro: 'Avanzada', enterprise: 'Avanzada + Custom' },
            { name: 'API de Integración', basic: false, standard: true, pro: true, enterprise: true },
            { name: 'Single Sign-On (SSO Corporativo)', basic: false, standard: false, pro: false, enterprise: true }
        ]
    },
    {
        category: 'Soporte y Servicio',
        features: [
            { name: 'Soporte Técnico', basic: 'Email', standard: 'Email + Chat', pro: 'Avanzado', enterprise: 'Dedicado' },
            { name: 'Onboarding Asistido', basic: false, standard: true, pro: true, enterprise: true },
            { name: 'Gerente de Cuenta (CSM)', basic: false, standard: false, pro: false, enterprise: true },
            { name: 'SLA Garantizado', basic: false, standard: false, pro: '99.9%', enterprise: '99.99%' }
        ]
    }
];
