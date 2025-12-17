import SwiftUI

struct ProblemSection: View {
    var body: some View {
        ZStack {
            AppTheme.accent.ignoresSafeArea()
            
            VStack(spacing: 48) {
                // The Cycle Card
                VStack(alignment: .leading, spacing: 24) {
                    Text("YOU KNOW\nTHE CYCLE.")
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(.white)
                        .lineSpacing(-5)
                    
                    VStack(alignment: .leading, spacing: 16) {
                        ProblemItem(title: "Sunday night motivation", description: "\"This week is going to be different...\"")
                        ProblemItem(title: "Monday reality", description: "Snoozed the alarm. Skipped the gym.")
                        ProblemItem(title: "The guilt spiral", description: "You're not lazy. You just have no one to answer to.")
                    }
                }
                .padding(32)
                .background(Color.black)
                .rotationEffect(.degrees(-1))
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                
                // What You've Tried Card
                VStack(alignment: .leading, spacing: 24) {
                    HStack(spacing: 12) {
                        Rectangle()
                            .fill(AppTheme.danger)
                            .frame(width: 32, height: 32)
                            .overlay(Image(systemName: "xmark").foregroundColor(.white))
                        
                        Text("WHAT YOU'VE TRIED")
                            .font(AppTheme.Fonts.heavy(18))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        TriedItem(thing: "Productivity apps", why: "Abandoned after 3 days")
                        TriedItem(thing: "Habit trackers", why: "Broke the streak, deleted it")
                        TriedItem(thing: "Accountability partners", why: "They got busy")
                    }
                }
                .padding(32)
                .background(Color.black)
                .rotationEffect(.degrees(1))
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
            }
            .padding(.vertical, 64)
            .padding(.horizontal, 16)
        }
    }
}

struct ProblemItem: View {
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Rectangle()
                .fill(Color.white.opacity(0.3))
                .frame(width: 4)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(AppTheme.Fonts.heavy(18))
                    .foregroundColor(.white)
                
                Text(description)
                    .font(AppTheme.Fonts.body(14))
                    .foregroundColor(.white.opacity(0.6))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

struct TriedItem: View {
    let thing: String
    let why: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "xmark")
                .foregroundColor(AppTheme.danger)
                .font(.system(size: 14, weight: .bold))
                .padding(.top, 4)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(thing)
                    .font(AppTheme.Fonts.heavy(16))
                    .foregroundColor(.white)
                
                Text(why)
                    .font(AppTheme.Fonts.body(14))
                    .foregroundColor(.white.opacity(0.4))
            }
        }
    }
}
