import SwiftUI

struct BrutalChoice: View {
    let title: String
    let selected: Bool
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(AppTheme.Fonts.heavy(20))
                    .foregroundColor(selected ? .black : AppTheme.text)
                    .textCase(.uppercase)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.black)
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 24)
            .background(
                ZStack {
                    if selected {
                        AppTheme.accent
                    } else {
                        Color.clear
                        
                        // Border
                        Rectangle()
                            .stroke(AppTheme.text.opacity(0.3), lineWidth: 2)
                    }
                }
            )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(selected ? 1.02 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: selected)
    }
}
