import SwiftUI

struct HowItWorksSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                Text("HOW IT WORKS")
                    .font(AppTheme.Fonts.mono(12))
                    .tracking(2)
                    .foregroundColor(AppTheme.accent)
                
                Text("THREE MOMENTS.\nEVERY DAY.")
                    .font(AppTheme.Fonts.heavy(32))
                    .foregroundColor(.black)
            }
            .padding(32)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(hex: "F5F5F5"))
            
            // Steps
            VStack(spacing: 0) {
                StepItem(number: "01", title: "THE WEIGHT", description: "Live your day knowing the call is coming tonight. No app to check.", isLast: false)
                StepItem(number: "02", title: "THE AUDIT", description: "Your phone rings. You have to answer for what you did today.", isLast: false)
                StepItem(number: "03", title: "TOMORROW'S PLAN", description: "Set commitments for tomorrow. Say them out loud.", isLast: true)
            }
        }
    }
}

struct StepItem: View {
    let number: String
    let title: String
    let description: String
    let isLast: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Text(number)
                    .font(AppTheme.Fonts.heavy(80))
                    .foregroundColor(isLast ? Color.black.opacity(0.1) : Color(hex: "E5E5E5"))
                    .lineLimit(1)
                    .fixedSize()
                    .offset(x: -10, y: -20)
                
                VStack(alignment: .leading, spacing: 12) {
                    Text(title)
                        .font(AppTheme.Fonts.heavy(18))
                        .foregroundColor(isLast ? .white : .black)
                    
                    Text(description)
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(isLast ? .white.opacity(0.9) : Color(hex: "4A4A4A"))
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.top, 40)
            }
            .padding(32)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isLast ? AppTheme.accent : Color.white)
            .overlay(
                VStack {
                    if !isLast {
                        Rectangle()
                            .fill(Color(hex: "E5E5E5"))
                            .frame(height: 1)
                    }
                },
                alignment: .bottom
            )
        }
    }
}
