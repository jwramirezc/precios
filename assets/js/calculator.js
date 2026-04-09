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
        this.visible = data.visible !== undefined ? data.visible : true;
        this.type = data.type || 'module';
        this.price_behavior = data.price_behavior || 'standard';
        this.pricing_tier = data.pricing_tier;
        this.category = data.category;
        this.selected = false;
        // Quantity config — only present on modules with variable consumption (blocks/per-unit)
        this.quantity_config = data.quantity_config || null;
        this.selectedQty = data.quantity_config?.default_qty || null;
    }

    toggle() {
        this.selected = !this.selected;
    }

    hasQuantity() {
        return !!(this.quantity_config?.enabled);
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

        // Active preset: null = custom mode; object = preset bundle mode
        this.activePreset = null;

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

    /**
     * Set the active preset (object from PLANS_CONFIG) or null for custom mode.
     */
    setActivePreset(preset) {
        this.activePreset = preset || null;
    }

    getModuleById(id) {
        return this.modules.find(m => m.id === id);
    }

    toggleModule(id) {
        const module = this.getModuleById(id);
        if (module && module.visible) {
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
            this.config[key] = value;
        }
    }

    /**
     * Helper: progressive user cost for exactly N users.
     * Used by both calculateUserCost() and calculateExtraUserCost().
     */
    calculateUserCostForN(n) {
        let remaining = n;
        let total = 0;
        const tiers = this.config.usersPricing || [];
        const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo);
        let prev = 0;

        for (const tier of sorted) {
            if (remaining <= 0) break;
            const span = tier.upTo - prev;
            const inTier = Math.min(remaining, span);
            total += inTier * tier.pricePerUser;
            remaining -= inTier;
            prev = tier.upTo;
        }

        if (remaining > 0 && sorted.length > 0) {
            total += remaining * sorted[sorted.length - 1].pricePerUser;
        }

        return total;
    }

    /**
     * Calculate cost for users using progressive tiers (custom mode).
     */
    calculateUserCost() {
        return this.calculateUserCostForN(this.userCount);
    }

    /**
     * Cost of users ABOVE the preset's includedUsers (preset add-on mode).
     * Returns 0 if current userCount <= includedUsers.
     */
    calculateExtraUserCost(includedUsers) {
        if (this.userCount <= includedUsers) return 0;
        return this.calculateUserCostForN(this.userCount) - this.calculateUserCostForN(includedUsers);
    }

    /**
     * Cost of storage ABOVE the preset's includedStorageGB (preset add-on mode).
     * Returns 0 if current storageGB <= includedStorageGB.
     */
    calculateExtraStorageCost(includedStorageGB) {
        const billableGB = Math.max(0, this.storageGB - includedStorageGB);
        if (billableGB === 0) return 0;

        const tiers = this.config.storagePricing?.tiers || [];
        const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo);

        let cost = 0;
        let remaining = billableGB;
        let prev = 0;

        for (const tier of sorted) {
            if (remaining <= 0) break;
            const span = tier.upTo - prev;
            const inTier = Math.min(remaining, span);
            cost += inTier * tier.pricePerGB;
            remaining -= inTier;
            prev = tier.upTo;
        }

        if (remaining > 0 && sorted.length > 0) {
            cost += remaining * sorted[sorted.length - 1].pricePerGB;
        }

        return cost;
    }

    /**
     * Returns the USD price for a given pricing_key + qty combination.
     * Supports type:"block" (closed pack) and type:"per_unit".
     * Returns 0 if key or qty not found — never throws.
     */
    _getBlockPrice(pricingKey, qty) {
        const def = this.pricingTiers[pricingKey];
        if (!def) return 0;
        if (def.type === 'block') {
            const block = (def.blocks || []).find(b => b.qty === qty);
            return block ? block.priceUSD : 0;
        }
        if (def.type === 'per_unit') {
            return qty * (def.pricePerUnit || 0);
        }
        return 0;
    }

    /**
     * CUSTOM MODE — full price of every selected quantity module.
     * Each module pays the price of its chosen block/tier regardless of any preset.
     */
    calculateQuantityModulesCost() {
        return this.modules
            .filter(m => m.selected && m.visible && m.hasQuantity() && m.selectedQty)
            .reduce((total, m) => {
                return total + this._getBlockPrice(m.quantity_config.pricing_key, m.selectedQty);
            }, 0);
    }

    /**
     * PRESET MODE — only charges the DELTA between selected and included tiers.
     *   extra = price(tier_selected) - price(tier_included)
     * If selected qty <= included qty → extra = 0.
     */
    calculatePresetExtraQuantityCost(preset) {
        const includedQtys = preset.includedQuantities || {};
        return this.modules
            .filter(m => m.selected && m.visible && m.hasQuantity() && m.selectedQty)
            .reduce((total, m) => {
                const includedQty = includedQtys[m.id] || 0;
                if (m.selectedQty <= includedQty) return total;
                const key = m.quantity_config.pricing_key;
                const priceSelected = this._getBlockPrice(key, m.selectedQty);
                const priceIncluded  = this._getBlockPrice(key, includedQty);
                return total + Math.max(0, priceSelected - priceIncluded);
            }, 0);
    }

    calculateModulesCost() {
        const selectedCalculableModules = this.modules.filter(
            m => m.selected && m.calculable && m.visible
        );
        return selectedCalculableModules.reduce((total, module) => {
            let price = 0;
            if (module.pricing_tier && this.pricingTiers[module.pricing_tier] !== undefined) {
                price = this.pricingTiers[module.pricing_tier];
            } else {
                console.warn(`Price not found for tier: ${module.pricing_tier} in module ${module.name}`);
            }
            return total + price;
        }, 0);
    }

    calculateStorageCost() {
        const includedGB = this.config.storagePricing?.includedGB || 0;
        const tiers = this.config.storagePricing?.tiers || [];

        let remainingGB = Math.max(0, this.storageGB - includedGB);

        if (!tiers.length) {
            const pricePerGB = this.config.storagePricing?.pricePerGB || 0;
            return remainingGB * pricePerGB;
        }

        let totalStorageCost = 0;
        const sortedTiers = [...tiers].sort((a, b) => a.upTo - b.upTo);
        let previousLimit = 0;

        for (const tier of sortedTiers) {
            if (remainingGB <= 0) break;
            const tierSpan = tier.upTo - previousLimit;
            const gbInThisTier = Math.min(remainingGB, tierSpan);
            totalStorageCost += gbInThisTier * tier.pricePerGB;
            remainingGB -= gbInThisTier;
            previousLimit = tier.upTo;
        }

        if (remainingGB > 0 && sortedTiers.length > 0) {
            totalStorageCost += remainingGB * sortedTiers[sortedTiers.length - 1].pricePerGB;
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
     * PRESET MODE breakdown: fixed bundle price + à-la-carte add-ons on top.
     * Reads priceUSD, includedModules, includedUsers, includedStorageGB from preset JSON.
     */
    calculatePresetBreakdown() {
        const preset = this.activePreset;
        const presetBaseUSD = preset.priceUSD ?? preset.price;
        const includedModuleIds = preset.includedModules || [];
        const includedQtys = preset.includedQuantities || {};

        // Extra modules = selected calculable modules NOT in the preset's includedModules
        const extraModules = this.modules.filter(
            m => m.selected && m.calculable && m.visible && !includedModuleIds.includes(m.id)
        );
        const extraModulesCost = extraModules.reduce((sum, m) => {
            return sum + (this.pricingTiers[m.pricing_tier] || 0);
        }, 0);

        // Discount for quantity modules that are included in the preset but were deselected
        const removedQtyModules = this.modules.filter(
            m => !m.selected && m.visible && m.hasQuantity() && includedModuleIds.includes(m.id)
        );
        const removedModulesDiscount = removedQtyModules.reduce((sum, m) => {
            const moduleCost = m.calculable ? (this.pricingTiers[m.pricing_tier] || 0) : 0;
            const qtyCost = includedQtys[m.id]
                ? this._getBlockPrice(m.quantity_config.pricing_key, includedQtys[m.id])
                : 0;
            return sum + moduleCost + qtyCost;
        }, 0);

        // Extra users above preset's included count
        const extraUsersCost = this.calculateExtraUserCost(preset.includedUsers);

        // Extra storage above preset's included GB
        const extraStorageCost = this.calculateExtraStorageCost(preset.includedStorageGB);

        // Extra quantity cost (delta between selected tier and included tier)
        const extraQtyCost = this.calculatePresetExtraQuantityCost(preset);

        const totalMonthlyUSD = presetBaseUSD + extraModulesCost - removedModulesDiscount + extraUsersCost + extraStorageCost + extraQtyCost;

        return {
            isPreset: true,
            presetBaseUSD,
            presetName: preset.name,
            presetIncludedNote: preset.includedNote || '',
            includedModuleIds,
            includedUsers: preset.includedUsers,
            includedStorageGB: preset.includedStorageGB,
            extraModules,
            extraModulesCost,
            removedQtyModules,
            removedModulesDiscount,
            extraUsersCost,
            extraStorageCost,
            extraQtyCost,
            // Keep these at 0 so existing code that reads them doesn't break
            platformFee: 0,
            userCost: 0,
            modulesCost: 0,
            storageCost: 0,
            subtotal: totalMonthlyUSD,
            multiplier: 1,
            totalMonthlyUSD
        };
    }

    /**
     * Returns a detailed breakdown of costs in USD (Monthly).
     * Routes to preset or custom calculation based on activePreset.
     */
    calculateBreakdown() {
        if (this.activePreset) {
            return this.calculatePresetBreakdown();
        }

        // Custom mode: full à-la-carte calculation
        const platformFee = this.config.platformFee || 0;
        const userCost = this.calculateUserCost();
        const modulesCost = this.calculateModulesCost();
        const storageCost = this.calculateStorageCost();
        const quantityCost = this.calculateQuantityModulesCost();
        const subtotal = platformFee + userCost + modulesCost + storageCost + quantityCost;

        const multiplier = this.getSzaasMultiplier();
        const totalMonthlyUSD = subtotal * multiplier;

        return {
            isPreset: false,
            platformFee,
            userCost,
            modulesCost,
            storageCost,
            quantityCost,
            subtotal,
            multiplier,
            totalMonthlyUSD
        };
    }

    calculateTotal() {
        const breakdown = this.calculateBreakdown();
        let total = breakdown.totalMonthlyUSD;

        if (this.billingCycle === 'annual') {
            const discountPercent = this.config.annualDiscountPercent || 0;
            const discountMultiplier = 1 - (discountPercent / 100);
            total *= discountMultiplier;
            total *= 12;
        }

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
        return this.modules.filter(m => m.selected && m.visible);
    }
}
