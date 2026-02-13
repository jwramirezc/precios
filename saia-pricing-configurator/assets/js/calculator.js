/**
 * Modern Pricing Page - Core Logic
 * Uses Object-Oriented Principles
 */

// --- Classes ---

class Module {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.icon = data.icon;
        // Use URL from data, or fallback to general config, or final fallback
        this.url = data.url || (GENERAL_CONFIG?.links?.defaultModuleUrl) || 'https://www.saiasoftware.com/';
        this.calculable = data.calculable !== undefined ? data.calculable : true;
        this.type = data.type || 'module';
        this.price_behavior = data.price_behavior || 'standard';
        this.pricing_tier = data.pricing_tier;
        this.category = data.category;
        this.selected = false;
    }

    toggle() {
        this.selected = !this.selected;
    }
}

class PricingCalculator {
    constructor(config) {
        this.config = config;
        this.modules = [];
        this.pricingTiers = {}; // Key: tier name, Value: price
        this.userCount = config.userSlider?.default || 10;
        this.licenseType = 'saas'; // Always 'saas'
        this.billingCycle = 'monthly'; // 'monthly' or 'annual'
        this.storageGB = config.storageSlider?.default || 100;

        // Enterprise Flags (can be toggled via updateConfig)
        this.isEnterprise = false;
        this.isDedicated = false;
        this.isCompliance = false;
    }

    setModules(modulesData) {
        this.modules = modulesData.map(data => new Module(data));
    }

    setPricingTiers(pricingTiers) {
        this.pricingTiers = pricingTiers || {};
    }

    getModuleById(id) {
        return this.modules.find(m => m.id === id);
    }

    toggleModule(id) {
        const module = this.getModuleById(id);
        if (module) {
            module.toggle();
            return true;
        }
        return false;
    }

    updateConfig(key, value) {
        // Handle enterprise flags directly
        if (['isEnterprise', 'isDedicated', 'isCompliance'].includes(key)) {
            this[key] = !!value;
            return;
        }

        if (this.hasOwnProperty(key)) {
            this[key] = value;
        } else if (this.config.hasOwnProperty(key)) {
            // Caution: modifying shared config might affect other components, 
            // but here it's arguably local state management if keys match.
            this.config[key] = value;
        }
    }

    /**
     * Calculate cost for users using progressive tiers
     */
    calculateUserCost() {
        let remainingUsers = this.userCount;
        let totalUserCost = 0;
        const tiers = this.config.usersPricing || [];

        // Sort tiers just in case
        const sortedTiers = [...tiers].sort((a, b) => a.upTo - b.upTo);

        let previousLimit = 0;

        for (const tier of sortedTiers) {
            if (remainingUsers <= 0) break;

            const tierSpan = tier.upTo - previousLimit;
            const usersInThisTier = Math.min(remainingUsers, tierSpan);

            totalUserCost += usersInThisTier * tier.pricePerUser;

            remainingUsers -= usersInThisTier;
            previousLimit = tier.upTo;
        }

        // Handle overflow if users exceed max defined tier (fallback to lowest price)
        if (remainingUsers > 0 && sortedTiers.length > 0) {
            const lastTierPrice = sortedTiers[sortedTiers.length - 1].pricePerUser;
            totalUserCost += remainingUsers * lastTierPrice;
        }

        return totalUserCost;
    }

    calculateModulesCost() {
        const selectedCalculableModules = this.modules.filter(m => m.selected && m.calculable);
        return selectedCalculableModules.reduce((total, module) => {
            let price = 0;
            // Look up price by pricing_tier key in the pricingTiers object (module-pricing.json)
            if (module.pricing_tier && this.pricingTiers[module.pricing_tier] !== undefined) {
                price = this.pricingTiers[module.pricing_tier];
            } else {
                console.warn(`Price not found for tier: ${module.pricing_tier} in module ${module.name}`);
            }
            return total + price;
        }, 0);
    }

    calculateStorageCost() {
        // Get config values
        const includedGB = this.config.storagePricing?.includedGB || 0;
        const tiers = this.config.storagePricing?.tiers || [];

        // Calculate billable GB
        let remainingGB = Math.max(0, this.storageGB - includedGB);

        // If no tiers defined, fallback to old linear logic if pricePerGB exists (backward compatibility)
        if (!tiers.length) {
            const pricePerGB = this.config.storagePricing?.pricePerGB || 0;
            return remainingGB * pricePerGB;
        }

        let totalStorageCost = 0;
        // Sort tiers just in case
        const sortedTiers = [...tiers].sort((a, b) => a.upTo - b.upTo);

        // Logic for progressive storage calculation
        // Note: storage tiers are USUALLY defined relative to the *billable* amount in this request context?
        // OR relative to absolute? 
        // Request says: "0-100 GB: gratis", "101-500 GB: $4". 
        // This implies the tier "upTo: 500" covers the range from 0 (billable) to 400 (billable) effectively?
        // NO, wait. The request says "tiers: [{upTo: 500}]". 
        // If I have 600 total GB: 100 included. 500 billable.
        // If the tiers are applied to "billableGB":
        // Tier 1 (upTo 500) covers first 500 billable GB.
        // Tier 2 covers next etc.
        //
        // Let's assume tiers apply to the BILLABLE amount.
        // Tiers: upTo 500, upTo 2000.
        // If I have 600GB total. 100 Included. Billable = 500.
        // Billable 500 fits entirely in first tier (upTo 500). cost = 500 * 4 = 2000.
        //
        // If I have 2100GB total. 100 Included. Billable = 2000.
        // First 500 billable @ 4 = 2000.
        // Next 1500 billable (upTo 2000 tier coverage) @ 3 = 4500.
        // Total = 6500.
        //
        // This matches the "Progressive" model requested.

        let previousLimit = 0;

        for (const tier of sortedTiers) {
            if (remainingGB <= 0) break;

            const tierSpan = tier.upTo - previousLimit;
            const gbInThisTier = Math.min(remainingGB, tierSpan);

            totalStorageCost += gbInThisTier * tier.pricePerGB;

            remainingGB -= gbInThisTier;
            previousLimit = tier.upTo;
        }

        // Handle overflow if GBs exceed max defined tier (fallback to lowest price)
        if (remainingGB > 0 && sortedTiers.length > 0) {
            const lastTierPrice = sortedTiers[sortedTiers.length - 1].pricePerGB;
            totalStorageCost += remainingGB * lastTierPrice;
        }

        return totalStorageCost;
    }

    getSzaasMultiplier() {
        let multiplier = 1.0;
        const multipliers = this.config.saasMultipliers || {};

        if (this.isEnterprise) multiplier *= (multipliers.enterprise || 1.3);
        if (this.isDedicated) multiplier *= (multipliers.dedicatedInstance || 1.5);
        if (this.isCompliance) multiplier *= (multipliers.compliance || 1.2);

        return multiplier;
    }

    /**
     * Returns a detailed breakdown of costs in USD (Monthly)
     */
    calculateBreakdown() {
        const userCost = this.calculateUserCost();
        const modulesCost = this.calculateModulesCost();
        const storageCost = this.calculateStorageCost();
        const subtotal = userCost + modulesCost + storageCost;

        const multiplier = this.getSzaasMultiplier();
        const totalMonthlyUSD = subtotal * multiplier;

        return {
            userCost,
            modulesCost,
            storageCost,
            subtotal,
            multiplier,
            totalMonthlyUSD
        };
    }

    calculateTotal() {
        const breakdown = this.calculateBreakdown();
        let total = breakdown.totalMonthlyUSD;

        // Apply Annual Discount if applicable
        if (this.billingCycle === 'annual') {
            const discountPercent = this.config.annualDiscountPercent || 0;
            const discountMultiplier = 1 - (discountPercent / 100);

            // Apply annual discount to the monthly rate
            total *= discountMultiplier;

            // Total Annual Price
            total *= 12;
        }

        // Convert currency
        if (this.config.currency === 'COP') {
            total *= (this.config.exchangeRate || 4000);
        }

        return total;
    }

    getFormattedTotal() {
        const total = this.calculateTotal();
        const currency = this.config.currency || 'COP';

        const options = {
            style: 'currency',
            currency: currency === 'COP' ? 'COP' : 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        };

        if (currency === 'USD') {
            options.minimumFractionDigits = 2;
            options.maximumFractionDigits = 2;
        }

        return new Intl.NumberFormat('es-CO', options).format(total);
    }

    getSelectedModules() {
        return this.modules.filter(m => m.selected);
    }
}
