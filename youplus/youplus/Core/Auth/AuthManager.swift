import SwiftUI
import Combine

class AuthManager: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // Removing shared singleton to use EnvironmentObject pattern consistently
    
    init() {
        // Check for existing session on init
        checkSession()
    }
    
    func checkSession() {
        // Mock session check
        // In real app, this would check Supabase session
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.isAuthenticated = false
        }
    }
    
    func signIn(email: String, password: String) {
        isLoading = true
        errorMessage = nil
        
        // Mock login delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            self.isAuthenticated = true
        }
    }
    
    func signOut() {
        isAuthenticated = false
    }
}
