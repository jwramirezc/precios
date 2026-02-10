# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML/CSS/JavaScript pricing configurator for SAIA SOFTWARE, a document management SaaS platform. The project consists of three main pages:

- **index.html** - Main pricing page displaying predefined plans
- **configurator.html** - Custom plan configurator with module selection
- **comparison.html** - Detailed feature comparison table

The project uses Bootstrap 5, Font Awesome, and Google Fonts (Outfit). No build system or package manager is used.

## Development Workflow

This is a static site with no build step. To develop:

1. Open HTML files directly in a browser or use a local server:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve
   ```

2. Make changes to HTML, CSS, or JavaScript files
3. Refresh the browser to see changes

## Deployment

The project deploys automatically to cPanel via FTP when pushing to the `main` branch. The GitHub Actions workflow is configured in [.github/workflows/deploy-ftp.yml](.github/workflows/deploy-ftp.yml).

Manual deployment requires FTP credentials stored in GitHub Secrets:
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

## Architecture

### Data-Driven Design

All content is loaded from JSON configuration files in [assets/data/](assets/data/). This allows non-developers to update pricing, features, and content without touching code.

**Key JSON Files:**
- `pricing-config.json` - Base pricing configuration (user costs, storage costs, discounts)
- `modules-data.json` - Module definitions (name, description, icon, pricing tier)
- `plans-config.json` - Predefined plan definitions
- `comparison-config.json` - Feature comparison table data
- `general-config.json` - External links (demo requests, contact forms)
- `faq.json` - FAQ questions and answers
- `tooltips-config.json` - Tooltip text for help icons
- `proposal-benefits.json` - Benefits displayed in proposal sections
- `module-pricing.json` - Pricing tiers for modules

### JavaScript Architecture

The JavaScript follows a modular, event-driven approach:

**Configuration Loaders** (run first):
- [config.js](assets/js/config.js) - Main config loader, loads all JSON files via `ConfigLoader`
- [general-config.js](assets/js/general-config.js) - Loads general settings and updates links
- [plans-config.js](assets/js/plans-config.js) - Loads predefined plans data

**Core Logic**:
- [calculator.js](assets/js/calculator.js) - Core pricing calculation engine with two main classes:
  - `Module` - Represents a selectable module
  - `PricingCalculator` - Calculates total price based on users, storage, modules, and billing cycle

**UI Renderers**:
- [configurator.js](assets/js/configurator.js) - UI controller for configurator page, handles user interactions
- [plans-renderer.js](assets/js/plans-renderer.js) - Renders predefined plan cards on index.html
- [comparison-renderer.js](assets/js/comparison-renderer.js) - Renders comparison table on comparison.html

**Utilities**:
- [faq.js](assets/js/faq.js) - Renders FAQ accordion from JSON
- [tooltips.js](assets/js/tooltips.js) - Initializes Bootstrap tooltips with custom data
- [proposal-benefits.js](assets/js/proposal-benefits.js) - Renders "What's Included" sections
- [iframe-resizer.js](assets/js/iframe-resizer.js) - Handles iframe resizing for embedding
- [main.js](assets/js/main.js) - Shared utilities (currently minimal)

### Event System

The project uses custom DOM events for coordination:

- `configLoaded` - Fired when all configs from config.js are loaded
- `plansConfigLoaded` - Fired when plans-config.json is loaded
- `generalConfigLoaded` - Fired when general-config.json is loaded

Pages listen for these events before initializing their UI. For example:

```javascript
document.addEventListener('configLoaded', () => {
  app.init();
});
```

### Pricing Calculation Flow

1. User selects modules in configurator
2. User adjusts users slider and storage slider
3. `PricingCalculator` class computes:
   - Module costs based on pricing tiers
   - User-based costs (progressive pricing tiers)
   - Storage costs (first 100 GB free, then tiered)
   - Annual discount if applicable
4. UI updates with calculated price

## File Organization

```
├── index.html                     # Main pricing page
├── configurator.html              # Custom configurator
├── comparison.html                # Feature comparison
├── assets/
│   ├── css/
│   │   └── styles.css            # All styles in one file
│   ├── js/
│   │   ├── config.js             # Main config loader
│   │   ├── general-config.js     # General settings loader
│   │   ├── plans-config.js       # Plans loader
│   │   ├── calculator.js         # Pricing calculation logic (OOP)
│   │   ├── configurator.js       # Configurator UI controller
│   │   ├── plans-renderer.js     # Plan cards renderer
│   │   ├── comparison-renderer.js # Comparison table renderer
│   │   ├── faq.js               # FAQ accordion renderer
│   │   ├── tooltips.js          # Tooltip initializer
│   │   ├── proposal-benefits.js # Benefits section renderer
│   │   ├── iframe-resizer.js    # Iframe integration
│   │   └── main.js              # Shared utilities
│   └── data/
│       ├── pricing-config.json   # Base pricing config
│       ├── modules-data.json     # Module definitions
│       ├── plans-config.json     # Predefined plans
│       ├── comparison-config.json # Comparison data
│       ├── general-config.json   # Links and settings
│       ├── faq.json             # FAQ content
│       ├── tooltips-config.json # Tooltip texts
│       ├── proposal-benefits.json # Benefit items
│       └── module-pricing.json  # Module pricing tiers
└── .github/
    └── workflows/
        └── deploy-ftp.yml        # FTP deployment workflow
```

## Common Tasks

### Updating Prices

Edit [assets/data/pricing-config.json](assets/data/pricing-config.json) to change:
- Base user costs
- Storage costs per GB
- Annual discount percentage
- User and storage slider ranges

### Adding or Modifying Modules

Edit [assets/data/modules-data.json](assets/data/modules-data.json). Each module requires:
```json
{
  "id": "unique_id",
  "name": "Module Name",
  "description": "Module description",
  "icon": "fa-icon-name",
  "calculable": true,
  "type": "module",
  "price_behavior": "standard",
  "pricing_tier": "tier_name",
  "category": "category_name"
}
```

Then update [assets/data/module-pricing.json](assets/data/module-pricing.json) to define the pricing tier cost.

### Updating Predefined Plans

Edit [assets/data/plans-config.json](assets/data/plans-config.json) to modify the Básico, Profesional, and Empresarial plans.

### Updating FAQ

Edit [assets/data/faq.json](assets/data/faq.json). The FAQ accordion is automatically rendered from this data.

### Updating External Links

Edit [assets/data/general-config.json](assets/data/general-config.json) to change:
- Demo request link
- Contact form link
- Personalized quote link

### Testing Configuration Changes

After editing JSON files, refresh the page. If data doesn't load, check the browser console for JSON parsing errors.

## Code Conventions

- All JavaScript uses modern ES6+ syntax (classes, arrow functions, const/let)
- Event listeners use custom events for cross-module communication
- DOM manipulation uses vanilla JavaScript (no jQuery)
- CSS uses CSS custom properties (CSS variables) defined in styles.css
- Bootstrap classes are used extensively for layout and components
- Font Awesome icons use `fa-solid` and `fa-brands` classes

## Important Notes

- The calculator always assumes SaaS model (no perpetual licensing)
- The first 100 GB of storage is free
- Annual billing applies a discount (configurable in pricing-config.json)
- Module selection is tracked in the `PricingCalculator` instance's `modules` array
- Currency switching (COP/USD) applies exchange rate from pricing-config.json
- The project is designed to be embedded in iframes (see iframe-resizer.js)
