import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showSettings: Bool = false

    // Mock data - will replace with real API calls
    @State private var streak: Int = 0
    @State private var trustScore: Int = 0
    @State private var totalCalls: Int = 0
    @State private var userName: String = "User"

    var streakMessage: String {
        if streak == 0 {
            return "Complete your first call to start."
        } else if streak >= 30 {
            return "Legendary. Keep going."
        } else if streak >= 7 {
            return "You're on fire. Don't stop now."
        } else {
            return "Don't break the chain."
        }
    }

    var isOnFire: Bool {
        streak >= 7
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                GrainOverlay()

                VStack(spacing: 0) {
                    // Navigation Header
                    HStack {
                        Image("mascot")
                            .resizable()
                            .scaledToFit()
                            .frame(height: 32)
                        Spacer()
                        HStack(spacing: 12) {
                            NavigationLink(destination: SettingsView()) {
                                Image(systemName: "gear")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white.opacity(0.6))
                            }

                            Button(action: {
                                authManager.signOut()
                            }) {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white.opacity(0.6))
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(AppTheme.blackAbsolute)

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Welcome Section
                        VStack(alignment: .leading, spacing: 8) {
                            Text("WELCOME BACK")
                                .font(AppTheme.Fonts.mono(11))
                                .tracking(0.15)
                                .foregroundColor(.white.opacity(0.5))

                            Text(userName)
                                .font(AppTheme.Fonts.heavy(36))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 24)

                        VStack(spacing: 20) {
                            // Next Call Timer
                            UpcomingCallCard()

                            // Stats Section
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 8) {
                                    Text("THE RECORD")
                                        .font(AppTheme.Fonts.mono(10))
                                        .tracking(0.2)
                                        .foregroundColor(AppTheme.accent)

                                    Divider()
                                        .frame(height: 1)
                                        .background(Color.white.opacity(0.1))
                                }

                                HStack(spacing: 12) {
                                    StatsCard(icon: "phone.fill", title: "Calls", value: "\(totalCalls)", subtitle: "Total")
                                    StatsCard(icon: "flame.fill", title: "Streak", value: "\(streak)", subtitle: "Days")
                                    StatsCard(icon: "star.fill", title: "Score", value: "\(trustScore)", subtitle: "Trust")
                                }
                            }
                            .padding(.horizontal, 20)

                            // Pillars Section
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 8) {
                                    Text("YOUR PILLARS")
                                        .font(AppTheme.Fonts.mono(10))
                                        .tracking(0.2)
                                        .foregroundColor(AppTheme.accent)

                                    Divider()
                                        .frame(height: 1)
                                        .background(Color.white.opacity(0.1))
                                }

                                VStack(spacing: 10) {
                                    PillarCardRow(title: "Gym", subtitle: "Built like a spartan warrior")
                                    PillarCardRow(title: "Focus", subtitle: "Laser vision for my goals")
                                    PillarCardRow(title: "Business", subtitle: "Run an empire")
                                }
                            }
                            .padding(.horizontal, 20)

                            // Streak Highlight
                            VStack(spacing: 16) {
                                HStack {
                                    HStack(spacing: 8) {
                                        Image(systemName: isOnFire ? "flame.fill" : "target")
                                            .font(.system(size: 14, weight: .semibold))
                                        Text("STREAK")
                                            .font(AppTheme.Fonts.mono(10))
                                            .tracking(0.15)
                                    }
                                    .foregroundColor(isOnFire ? .white : .white.opacity(0.5))

                                    Spacer()

                                    if streak > 0 {
                                        Text("Best: \(streak)d")
                                            .font(AppTheme.Fonts.mono(10))
                                            .foregroundColor(.white.opacity(0.4))
                                    }
                                }

                                HStack(alignment: .bottom, spacing: 8) {
                                    Text("\(streak)")
                                        .font(AppTheme.Fonts.heavy(48))
                                        .foregroundColor(.white)

                                    Text("Days")
                                        .font(AppTheme.Fonts.mono(12))
                                        .foregroundColor(.white.opacity(0.5))

                                    Spacer()
                                }

                                Text(streakMessage)
                                    .font(AppTheme.Fonts.body(14))
                                    .foregroundColor(.white.opacity(0.6))
                                    .lineLimit(3)
                            }
                            .padding(16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(isOnFire ? AppTheme.accent.opacity(0.1) : Color.white.opacity(0.05))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(isOnFire ? AppTheme.accent.opacity(0.3) : Color.white.opacity(0.1), lineWidth: 1)
                            )
                            .padding(.horizontal, 20)
                        }

                        Spacer().frame(height: 40)
                    }
                }
            }
        }
        }
    }
}

// MARK: - Upcoming Call Card
struct UpcomingCallCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "clock.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.accent)

                Text("NEXT CALL")
                    .font(AppTheme.Fonts.mono(10))
                    .tracking(0.2)
                    .foregroundColor(.white.opacity(0.5))

                Spacer()
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Tonight at 7:00 PM")
                    .font(AppTheme.Fonts.heavy(20))
                    .foregroundColor(.white)

                Text("Your Future Self is ready to talk")
                    .font(AppTheme.Fonts.body(13))
                    .foregroundColor(.white.opacity(0.6))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.accent.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(AppTheme.accent.opacity(0.2), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }
}

// MARK: - Stats Card
struct StatsCard: View {
    let icon: String
    let title: String
    let value: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .center, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.accent)

                Spacer()
            }

            Text(value)
                .font(AppTheme.Fonts.heavy(24))
                .foregroundColor(.white)

            Text(title)
                .font(AppTheme.Fonts.mono(10))
                .foregroundColor(.white.opacity(0.5))

            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

// MARK: - Pillar Card Row
struct PillarCardRow: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTheme.Fonts.mono(12))
                    .foregroundColor(.white)

                Text(subtitle)
                    .font(AppTheme.Fonts.body(12))
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(1)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}
