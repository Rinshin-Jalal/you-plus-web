import SwiftUI
internal import Auth

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = "User"
    @State private var timezone: String = "UTC"
    @State private var notificationsEnabled: Bool = true
    @State private var isDarkMode: Bool = true

    @State private var showSignOutConfirm: Bool = false
    @State private var isSaving: Bool = false
    @State private var saveMessage: String = ""
    @State private var showSaveSuccess: Bool = false

    var userEmail: String {
        authManager.currentUser?.email ?? "—"
    }

    let timezones: [(id: String, display: String)] = [
        ("UTC", "UTC - Coordinated Universal Time"),
        ("America/New_York", "America/New_York - United States (Eastern)"),
        ("America/Chicago", "America/Chicago - United States (Central)"),
        ("America/Denver", "America/Denver - United States (Mountain)"),
        ("America/Los_Angeles", "America/Los_Angeles - United States (Pacific)"),
        ("America/Anchorage", "America/Anchorage - Alaska"),
        ("Pacific/Honolulu", "Pacific/Honolulu - Hawaii"),
        ("Europe/London", "Europe/London - United Kingdom"),
        ("Europe/Paris", "Europe/Paris - France"),
        ("Europe/Berlin", "Europe/Berlin - Germany"),
        ("Europe/Madrid", "Europe/Madrid - Spain"),
        ("Europe/Amsterdam", "Europe/Amsterdam - Netherlands"),
        ("Asia/Tokyo", "Asia/Tokyo - Japan"),
        ("Asia/Shanghai", "Asia/Shanghai - China"),
        ("Asia/Hong_Kong", "Asia/Hong_Kong - Hong Kong"),
        ("Asia/Singapore", "Asia/Singapore - Singapore"),
        ("Asia/Bangkok", "Asia/Bangkok - Thailand"),
        ("Asia/Kolkata", "Asia/Kolkata - India"),
        ("Asia/Dubai", "Asia/Dubai - United Arab Emirates"),
        ("Australia/Sydney", "Australia/Sydney - New South Wales"),
        ("Australia/Melbourne", "Australia/Melbourne - Victoria"),
        ("Australia/Brisbane", "Australia/Brisbane - Queensland"),
        ("Pacific/Auckland", "Pacific/Auckland - New Zealand"),
        ("Pacific/Fiji", "Pacific/Fiji - Fiji")
    ]

    var timezoneIds: [String] {
        timezones.map { $0.id }
    }

    func timezoneDisplay(for id: String) -> String {
        timezones.first(where: { $0.id == id })?.display ?? id
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                GrainOverlay()

                ScrollView {
                    VStack(spacing: 0) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text("SETTINGS")
                                .font(AppTheme.Fonts.mono(12))
                                .tracking(0.2)
                                .foregroundColor(AppTheme.accent)

                            Text("Account & Preferences")
                                .font(AppTheme.Fonts.heavy(28))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 24)

                        VStack(spacing: 20) {
                            // Profile Section
                            SettingsSection(title: "Profile") {
                                VStack(spacing: 16) {
                                    // Email (Read-only)
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("EMAIL")
                                            .font(AppTheme.Fonts.mono(10))
                                            .tracking(0.15)
                                            .foregroundColor(.white.opacity(0.5))

                                        Text(userEmail)
                                            .font(AppTheme.Fonts.body(16))
                                            .foregroundColor(.white.opacity(0.7))

                                        Text("Email cannot be changed")
                                            .font(AppTheme.Fonts.mono(11))
                                            .foregroundColor(.white.opacity(0.4))
                                    }

                                    Divider().background(Color.white.opacity(0.1))

                                    // Name
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("NAME")
                                            .font(AppTheme.Fonts.mono(10))
                                            .tracking(0.15)
                                            .foregroundColor(.white.opacity(0.5))

                                        TextField("Your name", text: $name)
                                            .font(AppTheme.Fonts.body(16))
                                            .foregroundColor(.white)
                                    }

                                    Divider().background(Color.white.opacity(0.1))

                                    // Timezone
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("TIMEZONE")
                                            .font(AppTheme.Fonts.mono(10))
                                            .tracking(0.15)
                                            .foregroundColor(.white.opacity(0.5))

                                        Picker("Timezone", selection: $timezone) {
                                            ForEach(timezones, id: \.id) { item in
                                                HStack {
                                                    Text(item.display)
                                                    if item.id == TimeZone.current.identifier {
                                                        Spacer()
                                                        Text("(Current)")
                                                            .font(.caption)
                                                            .foregroundColor(AppTheme.accent)
                                                    }
                                                }
                                                .tag(item.id)
                                            }
                                        }
                                        .pickerStyle(.menu)
                                        .tint(AppTheme.accent)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .foregroundColor(.white)
                                    }

                                    BrutalButton(title: isSaving ? "Saving..." : "Save Profile", style: .primary) {
                                        saveProfile()
                                    }
                                    .disabled(isSaving)
                                }
                            }

                            // Preferences Section
                            SettingsSection(title: "Preferences") {
                                VStack(spacing: 16) {
                                    // Dark Mode Toggle
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("DARK MODE")
                                                .font(AppTheme.Fonts.mono(10))
                                                .tracking(0.15)
                                                .foregroundColor(.white.opacity(0.5))

                                            Text("Always use dark theme")
                                                .font(AppTheme.Fonts.body(13))
                                                .foregroundColor(.white.opacity(0.6))
                                        }

                                        Spacer()

                                        Toggle("", isOn: $isDarkMode)
                                            .tint(AppTheme.accent)
                                    }

                                    Divider()
                                        .background(Color.white.opacity(0.1))

                                    // Notifications Toggle
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("NOTIFICATIONS")
                                                .font(AppTheme.Fonts.mono(10))
                                                .tracking(0.15)
                                                .foregroundColor(.white.opacity(0.5))

                                            Text("Receive call reminders")
                                                .font(AppTheme.Fonts.body(13))
                                                .foregroundColor(.white.opacity(0.6))
                                        }

                                        Spacer()

                                        Toggle("", isOn: $notificationsEnabled)
                                            .tint(AppTheme.accent)
                                    }

                                    Divider()
                                        .background(Color.white.opacity(0.1))

                                    BrutalButton(title: "Save Preferences", style: .primary) {
                                        // API call to save preferences
                                    }
                                }
                            }

                            // Subscription Section
                            SettingsSection(title: "Subscription") {
                                VStack(spacing: 12) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("YOU+ PRO")
                                                .font(AppTheme.Fonts.mono(11))
                                                .tracking(0.15)
                                                .foregroundColor(.white.opacity(0.5))

                                            Text("Active")
                                                .font(AppTheme.Fonts.body(14))
                                                .foregroundColor(.white)
                                        }

                                        Spacer()

                                        Text("$9.99/mo")
                                            .font(AppTheme.Fonts.heavy(16))
                                            .foregroundColor(.white)
                                    }

                                    Divider().background(Color.white.opacity(0.1))

                                    BrutalButton(title: "Manage Billing", style: .secondary) {
                                        // Open billing portal
                                    }
                                }
                            }

                            // Danger Zone
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Danger Zone")
                                    .font(AppTheme.Fonts.mono(11))
                                    .tracking(0.2)
                                    .foregroundColor(.red.opacity(0.7))

                                if showSignOutConfirm {
                                    Text("Are you sure you want to sign out?")
                                        .font(AppTheme.Fonts.body(13))
                                        .foregroundColor(.red.opacity(0.8))

                                    HStack(spacing: 12) {
                                        BrutalButton(title: "Cancel", style: .secondary) {
                                            showSignOutConfirm = false
                                        }

                                        BrutalButton(title: "Sign Out", style: .primary) {
                                            authManager.signOut()
                                        }
                                    }
                                } else {
                                    BrutalButton(title: "Sign Out", style: .danger) {
                                        showSignOutConfirm = true
                                    }
                                }
                            }

                            Spacer().frame(height: 40)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func saveProfile() {
        Task {
            isSaving = true
            defer { isSaving = false }

            do {
                guard let accessToken = authManager.currentUser?.accessToken else {
                    saveMessage = "No auth token available"
                    showSaveSuccess = false
                    return
                }

                let apiClient = APIClient()
                _ = try await apiClient.updateProfile(
                    name: name.isEmpty ? nil : name,
                    timezone: timezone.isEmpty ? nil : timezone,
                    accessToken: accessToken
                )

                saveMessage = "Profile saved successfully"
                showSaveSuccess = true

                // Clear message after 3 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    showSaveSuccess = false
                }
            } catch {
                saveMessage = "Failed to save profile: \(error.localizedDescription)"
                showSaveSuccess = false
            }
        }
    }
}

// MARK: - Settings Section
struct SettingsSection<Content: View>: View {
    let title: String
    var accentColor: Color = AppTheme.accent
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(AppTheme.Fonts.mono(11))
                .tracking(0.2)
                .foregroundColor(.white.opacity(0.5))

            VStack(spacing: 0) {
                content()
            }
            .padding(16)
            .background(Color.white.opacity(0.03))
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager())
}
