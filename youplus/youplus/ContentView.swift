import SwiftUI

struct ContentView: View {
    @StateObject private var authManager = AuthManager()
    @State private var showLogin = false
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                DashboardView()
            } else {
                NavigationView {
                    ZStack {
                        LandingView(onStart: {
                            showLogin = true
                        })
                        
                        NavigationLink(destination: LoginView(), isActive: $showLogin) {
                            EmptyView()
                        }
                    }
                    .navigationBarHidden(true)
                }
            }
        }
        .environmentObject(authManager)
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

#Preview {
    ContentView()
}
