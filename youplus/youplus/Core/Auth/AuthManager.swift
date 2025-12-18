import SwiftUI
import Combine
import Supabase

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var currentUser: User?
    @Published var accessToken: String?
    
    private let supabase: SupabaseClient
    private var authStateTask: Task<Void, Never>?
    
    init() {
        do {
            self.supabase = SupabaseClient(
                supabaseURL: SupabaseConfig.shared.url,
                supabaseKey: SupabaseConfig.shared.anonKey
            )
        } catch {
            self.supabase = SupabaseClient(
                supabaseURL: URL(string: "https://placeholder.supabase.co")!,
                supabaseKey: "placeholder"
            )
            errorMessage = "Failed to initialize Supabase"
        }
        
        // Check for existing session on init
        checkSession()
        
        // Listen for auth state changes
        setupAuthStateListener()
    }
    
    private func setupAuthStateListener() {
        authStateTask = Task {
            for await (event, session) in await supabase.auth.authStateChanges {
                await MainActor.run {
                    if let session = session {
                        self.isAuthenticated = true
                        self.currentUser = session.user
                        self.accessToken = session.accessToken
                    } else {
                        self.isAuthenticated = false
                        self.currentUser = nil
                        self.accessToken = nil
                    }
                }
            }
        }
    }
    
    func checkSession() {
        Task {
            do {
                let session = try await supabase.auth.session
                await MainActor.run {
                    if session != nil {
                        self.isAuthenticated = true
                        self.currentUser = session.user
                        self.accessToken = session.accessToken
                    } else {
                        self.isAuthenticated = false
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to check session: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func signIn(email: String, password: String, completion: (() -> Void)? = nil) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await supabase.auth.signIn(
                    email: email,
                    password: password
                )
                
                // After signIn, fetch current session
                let session = try await supabase.auth.session
                
                await MainActor.run {
                    self.isAuthenticated = true
                    self.currentUser = session.user
                    self.accessToken = session.accessToken
                    self.isLoading = false
                    completion?()
                }
            } catch {
                await MainActor.run {
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func signUp(email: String, password: String, completion: (() -> Void)? = nil) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await supabase.auth.signUp(
                    email: email,
                    password: password
                )
                
                // After signUp, fetch current session
                let session = try await supabase.auth.session
                
                await MainActor.run {
                    self.isAuthenticated = true
                    self.currentUser = session.user
                    self.accessToken = session.accessToken
                    self.isLoading = false
                    completion?()
                }
            } catch {
                await MainActor.run {
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func signOut() {
        Task {
            do {
                try await supabase.auth.signOut()
                await MainActor.run {
                    self.isAuthenticated = false
                    self.currentUser = nil
                    self.accessToken = nil
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to sign out: \(error.localizedDescription)"
                }
            }
        }
    }
    
    deinit {
        authStateTask?.cancel()
    }
}
