import SwiftUI
import Combine
import Supabase

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var currentUser: User?
    @Published var accessToken: String?

    var userId: String? {
        let id = currentUser?.id.uuidString
        print("DEBUG AuthManager.userId: returning \(id ?? "nil")")
        return id
    }

    private let supabase: SupabaseClient
    private var authStateTask: Task<Void, Never>?

    init() {
        do {
            let authOptions = SupabaseClientOptions.AuthOptions(
                emitLocalSessionAsInitialSession: true
            )
            let options = SupabaseClientOptions(auth: authOptions)
            self.supabase = SupabaseClient(
                supabaseURL: SupabaseConfig.shared.url,
                supabaseKey: SupabaseConfig.shared.anonKey,
                options: options
            )
        } catch {
            self.supabase = SupabaseClient(
                supabaseURL: URL(string: "https://mpicqllpqtwfafqppwal.supabase.co")!,
                supabaseKey: "sb_publishable_Nz8fiV2WC3Md7Sfw0YEe9Q_LiJ3fJs-"
            )
            errorMessage = "Failed to initialize Supabase"
        }

        // Listen for auth state changes (will handle initial session validation)
        setupAuthStateListener()
    }
    
    private func setupAuthStateListener() {
        authStateTask = Task {
            for await (event, session) in await supabase.auth.authStateChanges {
                await MainActor.run {
                    if let session = session, !session.isExpired {
                        self.isAuthenticated = true
                        self.currentUser = session.user
                        self.accessToken = session.accessToken
                        print("DEBUG: Auth state changed - session valid. User: \(session.user.id.uuidString), accessToken: \(session.accessToken.prefix(20))...")
                    } else {
                        self.isAuthenticated = false
                        self.currentUser = nil
                        self.accessToken = nil
                        if let session = session {
                            print("DEBUG: Auth state changed - session expired")
                        } else {
                            print("DEBUG: Auth state changed - no session")
                        }
                    }
                }
            }
        }
    }
    
    func checkSession() {
        Task {
            do {
                print("DEBUG: Checking session...")
                let session = try await supabase.auth.session
                if session.isExpired {
                    print("DEBUG: Session found but expired")
                    return
                }
                await MainActor.run {
                    self.isAuthenticated = true
                    self.currentUser = session.user
                    self.accessToken = session.accessToken
                    print("DEBUG: Session found and valid. User: \(session.user.id.uuidString), accessToken: \(session.accessToken.prefix(20))...")
                }
            } catch {
                await MainActor.run {
                    self.isAuthenticated = false
                    print("DEBUG: No valid session found")
                }
                print("DEBUG: Session check error: \(error.localizedDescription)")
            }
        }
    }
    
    func signIn(email: String, password: String, completion: (() -> Void)? = nil) {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                print("DEBUG: Attempting sign in with email: \(email)")
                let authResponse = try await supabase.auth.signIn(
                    email: email,
                    password: password
                )
                print("DEBUG: Sign in successful")

                // After signIn, fetch current session
                let session = try await supabase.auth.session

                await MainActor.run {
                    self.isAuthenticated = true
                    self.currentUser = session.user
                    self.accessToken = session.accessToken
                    self.isLoading = false
                    print("DEBUG: User authenticated successfully")
                    completion?()
                }
            } catch {
                let errorMessage = error.localizedDescription
                print("DEBUG: Sign in error: \(errorMessage)")
                print("DEBUG: Full error: \(error)")

                await MainActor.run {
                    self.isLoading = false
                    self.errorMessage = errorMessage
                }
            }
        }
    }
    
    func signUp(email: String, password: String, completion: (() -> Void)? = nil) {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                print("DEBUG: Attempting sign up with email: \(email)")
                try await supabase.auth.signUp(
                    email: email,
                    password: password
                )
                print("DEBUG: Sign up successful")

                // After signUp, fetch current session
                let session = try await supabase.auth.session

                await MainActor.run {
                    self.isAuthenticated = true
                    self.currentUser = session.user
                    self.accessToken = session.accessToken
                    self.isLoading = false
                    print("DEBUG: User registered and authenticated successfully")
                    completion?()
                }
            } catch {
                let errorMessage = error.localizedDescription
                print("DEBUG: Sign up error: \(errorMessage)")
                print("DEBUG: Full error: \(error)")

                await MainActor.run {
                    self.isLoading = false
                    self.errorMessage = errorMessage
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
