import Foundation

/// App configuration constants
enum Config {
    // Cartesia Agent ID for WebSocket connections
    // This should be the deployed agent ID from 'cartesia deploy'
    static let cartesiaAgentId = "default-agent"  // Replace with actual deployed agent ID

    // Backend API configuration
    static let backendURL = "https://youplus-api.example.com"  // Replace with actual backend URL

    // Feature flags
    static let enableCallKitIntegration = true
}
