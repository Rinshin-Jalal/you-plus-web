import SwiftUI

struct MegaInput: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    @FocusState private var isFocused: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(AppTheme.Fonts.mono(14))
                .foregroundColor(AppTheme.secondaryAccent)
                .textCase(.uppercase)
                .kerning(1.2)
            
            ZStack(alignment: .leading) {
                if text.isEmpty {
                    Text(placeholder)
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(AppTheme.text.opacity(0.3))
                        .textCase(.uppercase)
                }
                
                if isSecure {
                    SecureField("", text: $text)
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(AppTheme.text)
                        .tint(AppTheme.accent)
                        .focused($isFocused)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                } else {
                    TextField("", text: $text)
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(AppTheme.text)
                        .tint(AppTheme.accent)
                        .focused($isFocused)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                }
            }
            .frame(height: 60)
            
            // Underline
            Rectangle()
                .fill(isFocused ? AppTheme.accent : AppTheme.text.opacity(0.2))
                .frame(height: isFocused ? 4 : 2)
                .animation(.spring(response: 0.3), value: isFocused)
        }
    }
}
