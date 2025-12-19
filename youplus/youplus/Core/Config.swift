import Foundation

/// App configuration constants
enum Config {
    // Cartesia Agent ID for WebSocket connections
    // This should be the deployed agent ID from 'cartesia deploy'
    static let cartesiaAgentId = "agent_TQPP1xeFvhjW6fkKXb5zy2"  // Replace with actual deployed agent ID

    // Backend API configuration
    static let backendURL = "http://localhost:8787"  // Replace with actual backend URL

    // Feature flags
    static let enableCallKitIntegration = true
}
