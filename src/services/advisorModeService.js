class AdvisorModeService {
  constructor() {
    this.modes = {
      default: {
        name: 'General Advisor',
        systemPrompt: 'You are a helpful AI advisor. Use your knowledge to provide accurate and helpful responses.',
        maxTokens: 500,
        temperature: 0.7
      },
      strategist: {
        name: 'Strategic Advisor',
        systemPrompt: 'You are a strategic advisor specializing in business strategy, planning, and decision-making. Provide strategic insights and actionable recommendations.',
        maxTokens: 600,
        temperature: 0.6
      },
      ops: {
        name: 'Operations Advisor',
        systemPrompt: 'You are an operations advisor specializing in process optimization, efficiency, and operational excellence. Focus on practical, implementable solutions.',
        maxTokens: 500,
        temperature: 0.5
      },
      content: {
        name: 'Content Advisor',
        systemPrompt: 'You are a content strategy advisor specializing in content creation, marketing, and communication. Help with content planning and optimization.',
        maxTokens: 600,
        temperature: 0.8
      }
    };
  }

  // Get advisor mode configuration
  getMode(modeName = 'default') {
    return this.modes[modeName] || this.modes.default;
  }

  // Get all available modes
  getAvailableModes() {
    return Object.keys(this.modes);
  }

  // Check if a mode exists
  hasMode(modeName) {
    return this.modes.hasOwnProperty(modeName);
  }

  // Get mode-specific system prompt
  getSystemPrompt(modeName = 'default') {
    const mode = this.getMode(modeName);
    return mode.systemPrompt;
  }

  // Get mode-specific settings
  getModeSettings(modeName = 'default') {
    const mode = this.getMode(modeName);
    return {
      maxTokens: mode.maxTokens,
      temperature: mode.temperature
    };
  }

  // Add a new advisor mode
  addMode(modeName, config) {
    if (this.modes[modeName]) {
      throw new Error(`Mode '${modeName}' already exists`);
    }
    
    this.modes[modeName] = {
      name: config.name || modeName,
      systemPrompt: config.systemPrompt || 'You are a helpful AI advisor.',
      maxTokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7
    };
    
    return this.modes[modeName];
  }

  // Update an existing mode
  updateMode(modeName, updates) {
    if (!this.modes[modeName]) {
      throw new Error(`Mode '${modeName}' does not exist`);
    }
    
    this.modes[modeName] = { ...this.modes[modeName], ...updates };
    return this.modes[modeName];
  }
}

module.exports = AdvisorModeService;
