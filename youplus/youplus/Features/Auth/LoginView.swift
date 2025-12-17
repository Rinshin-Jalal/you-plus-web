import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                Spacer()
                
                WitnessLogo(size: 64, showWordmark: true)
                
                VStack(spacing: 16) {
                    Text("SIGN IN")
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(.white)
                    
                    Text("Continue your transformation journey")
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(.white.opacity(0.5))
                }
                
                VStack(spacing: 16) {
                    CustomTextField(placeholder: "Email", text: $email)
                    CustomTextField(placeholder: "Password", text: $password, isSecure: true)
                    
                    BrutalButton(title: isLoading ? "Signing in..." : "Sign In", style: .primary) {
                        isLoading = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            authManager.signIn(email: email, password: password)
                            isLoading = false
                        }
                    }
                    .disabled(isLoading)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
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
