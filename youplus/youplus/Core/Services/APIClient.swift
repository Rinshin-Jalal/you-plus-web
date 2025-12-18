import Foundation

class APIClient {
    private let baseURL: URL
    private let session: URLSession
    
    init(baseURL: URL = URL(string: "http://localhost:3000")!) {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }
    
    func pushOnboarding(
        payload: OnboardingConversionPayload,
        accessToken: String
    ) async throws -> OnboardingJobResponse {
        let endpoint = baseURL.appendingPathComponent("api/onboarding/conversion/complete")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Encode the payload
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(payload)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse?.error ?? "Unknown error")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(OnboardingJobResponse.self, from: data)
    }
    
    func pollOnboardingStatus(
        jobId: String,
        accessToken: String
    ) async throws -> OnboardingStatusResponse {
        let endpoint = baseURL.appendingPathComponent("api/onboarding/status/\(jobId)")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse?.error ?? "Unknown error")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(OnboardingStatusResponse.self, from: data)
    }
}

// MARK: - Response Models

struct OnboardingConversionPayload: Codable {
    let name: String?
    let times_tried: Int?
    let core_identity: String
    let primary_pillar: String?
    let dark_future: String?
    let quit_pattern: String?
    let favorite_excuse: String?
    let who_disappointed: [String]?
    let selected_pillars: [String]
    let future_self_intro_recording: String // base64
    let why_recording: String // base64
    let pledge_recording: String // base64
    let merged_voice_recording: String?
    let call_time: String?
    let timezone: String?
    let future_self_statement: String?
    let favorite_excuse_context: String?
    
    // Dynamic pillar fields: ${pillarId}_current, ${pillarId}_goal, ${pillarId}_future
    let dynamicPillarFields: [String: String]
    
    enum CodingKeys: String, CodingKey {
        case name, times_tried, core_identity, primary_pillar, dark_future
        case quit_pattern, favorite_excuse, who_disappointed, selected_pillars
        case future_self_intro_recording, why_recording, pledge_recording
        case merged_voice_recording, call_time, timezone
        case future_self_statement, favorite_excuse_context
    }
    
    func encode(to encoder: Encoder) throws {
        // First encode all static fields
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(name, forKey: .name)
        try container.encodeIfPresent(times_tried, forKey: .times_tried)
        try container.encode(core_identity, forKey: .core_identity)
        try container.encodeIfPresent(primary_pillar, forKey: .primary_pillar)
        try container.encodeIfPresent(dark_future, forKey: .dark_future)
        try container.encodeIfPresent(quit_pattern, forKey: .quit_pattern)
        try container.encodeIfPresent(favorite_excuse, forKey: .favorite_excuse)
        try container.encodeIfPresent(who_disappointed, forKey: .who_disappointed)
        try container.encode(selected_pillars, forKey: .selected_pillars)
        try container.encode(future_self_intro_recording, forKey: .future_self_intro_recording)
        try container.encode(why_recording, forKey: .why_recording)
        try container.encode(pledge_recording, forKey: .pledge_recording)
        try container.encodeIfPresent(merged_voice_recording, forKey: .merged_voice_recording)
        try container.encodeIfPresent(call_time, forKey: .call_time)
        try container.encodeIfPresent(timezone, forKey: .timezone)
        try container.encodeIfPresent(future_self_statement, forKey: .future_self_statement)
        try container.encodeIfPresent(favorite_excuse_context, forKey: .favorite_excuse_context)
        
        // Then encode dynamic pillar fields using dynamic keys
        var dynamicContainer = encoder.container(keyedBy: AnyCodingKey.self)
        for (key, value) in dynamicPillarFields {
            try dynamicContainer.encode(value, forKey: AnyCodingKey(stringValue: key))
        }
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        times_tried = try container.decodeIfPresent(Int.self, forKey: .times_tried)
        core_identity = try container.decode(String.self, forKey: .core_identity)
        primary_pillar = try container.decodeIfPresent(String.self, forKey: .primary_pillar)
        dark_future = try container.decodeIfPresent(String.self, forKey: .dark_future)
        quit_pattern = try container.decodeIfPresent(String.self, forKey: .quit_pattern)
        favorite_excuse = try container.decodeIfPresent(String.self, forKey: .favorite_excuse)
        who_disappointed = try container.decodeIfPresent([String].self, forKey: .who_disappointed)
        selected_pillars = try container.decode([String].self, forKey: .selected_pillars)
        future_self_intro_recording = try container.decode(String.self, forKey: .future_self_intro_recording)
        why_recording = try container.decode(String.self, forKey: .why_recording)
        pledge_recording = try container.decode(String.self, forKey: .pledge_recording)
        merged_voice_recording = try container.decodeIfPresent(String.self, forKey: .merged_voice_recording)
        call_time = try container.decodeIfPresent(String.self, forKey: .call_time)
        timezone = try container.decodeIfPresent(String.self, forKey: .timezone)
        future_self_statement = try container.decodeIfPresent(String.self, forKey: .future_self_statement)
        favorite_excuse_context = try container.decodeIfPresent(String.self, forKey: .favorite_excuse_context)
        dynamicPillarFields = [:] // Not needed for decoding
    }
    
    init(
        name: String?,
        times_tried: Int?,
        core_identity: String,
        primary_pillar: String?,
        dark_future: String?,
        quit_pattern: String?,
        favorite_excuse: String?,
        who_disappointed: [String]?,
        selected_pillars: [String],
        future_self_intro_recording: String,
        why_recording: String,
        pledge_recording: String,
        merged_voice_recording: String?,
        call_time: String?,
        timezone: String?,
        future_self_statement: String?,
        favorite_excuse_context: String?,
        dynamicPillarFields: [String: String] = [:]
    ) {
        self.name = name
        self.times_tried = times_tried
        self.core_identity = core_identity
        self.primary_pillar = primary_pillar
        self.dark_future = dark_future
        self.quit_pattern = quit_pattern
        self.favorite_excuse = favorite_excuse
        self.who_disappointed = who_disappointed
        self.selected_pillars = selected_pillars
        self.future_self_intro_recording = future_self_intro_recording
        self.why_recording = why_recording
        self.pledge_recording = pledge_recording
        self.merged_voice_recording = merged_voice_recording
        self.call_time = call_time
        self.timezone = timezone
        self.future_self_statement = future_self_statement
        self.favorite_excuse_context = favorite_excuse_context
        self.dynamicPillarFields = dynamicPillarFields
    }
}

// Helper for dynamic encoding
struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?
    
    init(stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }
    
    init?(intValue: Int) {
        self.stringValue = "\(intValue)"
        self.intValue = intValue
    }
}

struct OnboardingJobResponse: Codable {
    let success: Bool
    let message: String
    let jobId: String
    let status: String
    let pollUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case success, message, status
        case jobId = "jobId"
        case pollUrl = "pollUrl"
    }
}

struct OnboardingStatusResponse: Codable {
    let jobId: String
    let status: String // pending, processing, completed, failed
    let currentStep: String?
    let progress: Int?
    let createdAt: Date?
    let completedAt: Date?
    let error: String?
    let futureSelf: FutureSelfResponse?
    
    enum CodingKeys: String, CodingKey {
        case jobId, status, progress, error
        case currentStep = "currentStep"
        case createdAt = "createdAt"
        case completedAt = "completedAt"
        case futureSelf = "futureSelf"
    }
}

struct FutureSelfResponse: Codable {
    let id: String
    let voiceCloned: Bool
    let pillars: Int
    
    enum CodingKeys: String, CodingKey {
        case id
        case voiceCloned = "voiceCloned"
        case pillars = "pillars"
    }
}

struct ErrorResponse: Codable {
    let error: String
    let details: String?
}

enum APIError: LocalizedError {
    case invalidResponse
    case serverError(String)
    case networkError(Error)
    case decodingError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let message):
            return message
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        }
    }
}

