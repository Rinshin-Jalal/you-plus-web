import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    WitnessLogo(size: 32, showWordmark: true)
                    Spacer()
                    Button(action: {
                        authManager.signOut()
                    }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .padding()
                .background(Color.black.opacity(0.5))
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Welcome
                        VStack(alignment: .leading, spacing: 8) {
                            Text("DASHBOARD")
                                .font(AppTheme.Fonts.mono(12))
                                .tracking(2)
                                .foregroundColor(AppTheme.accent)
                            
                            Text("YOUR TRUTH")
                                .font(AppTheme.Fonts.heavy(32))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        
                        // Stats Grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            StatCard(title: "STREAK", value: "0", subtitle: "DAYS")
                            StatCard(title: "SCORE", value: "—", subtitle: "WEEKLY")
                        }
                        
                        // Action Card
                        VStack(spacing: 16) {
                            Text("NO DATA YET")
                                .font(AppTheme.Fonts.heavy(24))
                                .foregroundColor(.white)
                            
                            Text("Your first call will appear here tonight.")
                                .font(AppTheme.Fonts.body(16))
                                .foregroundColor(.white.opacity(0.6))
                                .multilineTextAlignment(.center)
                            
                            BrutalButton(title: "Setup Call", style: .primary) {
                                // Action
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.05))
                        .overlay(
                            Rectangle()
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                    }
                    .padding(24)
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(AppTheme.Fonts.mono(10))
                .tracking(2)
                .foregroundColor(.white.opacity(0.5))
            
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(value)
                    .font(AppTheme.Fonts.heavy(32))
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(AppTheme.Fonts.mono(10))
                    .foregroundColor(.white.opacity(0.3))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white.opacity(0.05))
        .overlay(
            Rectangle()
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}
