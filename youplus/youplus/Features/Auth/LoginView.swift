import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var showSignUp = false

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                Spacer()
                
                WitnessLogo(size: 64, showWordmark: true)
                
                VStack(spacing: 16) {
                    Text(showSignUp ? "CREATE ACCOUNT" : "SIGN IN")
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(.white)
                    
                    Text(showSignUp ? "Join your transformation" : "Continue your transformation journey")
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(.white.opacity(0.5))
                }
                
                VStack(spacing: 16) {
                    CustomTextField(placeholder: "Email", text: $email)
                    CustomTextField(placeholder: "Password", text: $password, isSecure: true)
                    
                    if let errorMessage = authManager.errorMessage {
                        Text(errorMessage)
                            .font(AppTheme.Fonts.mono(12))
                            .foregroundColor(.red.opacity(0.8))
                            .lineLimit(3)
                    }
                    
                    BrutalButton(
                        title: authManager.isLoading ? "Processing..." : (showSignUp ? "Create Account" : "Sign In"),
                        style: .primary
                    ) {
                        if showSignUp {
                            authManager.signUp(email: email, password: password)
                        } else {
                            authManager.signIn(email: email, password: password)
                        }
                    }
                    .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                }
                .padding(.horizontal)
                
                VStack(spacing: 8) {
                    Button(action: { showSignUp.toggle() }) {
                        Text(showSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one")
                            .font(AppTheme.Fonts.body(14))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                
                Spacer()
            }
            .padding()
        }
        .onAppear {
            // Clear any session check errors when entering login screen
            // (it's normal to not have a session when logging in)
            authManager.errorMessage = nil
        }
    }
}

struct CustomTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .foregroundColor(.white)
        .overlay(
            Rectangle()
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
        .font(AppTheme.Fonts.body(16))
    }
}
