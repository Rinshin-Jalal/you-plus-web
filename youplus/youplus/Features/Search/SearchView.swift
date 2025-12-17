import SwiftUI

struct SearchView: View {
    @State private var searchText = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                // Header
                HStack {
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.white)
                            .font(.system(size: 20))
                    }
                    
                    Text("SEARCH")
                        .font(AppTheme.Fonts.heavy(20))
                        .foregroundColor(.white)
                    
                    Spacer()
                }
                .padding()
                
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.white.opacity(0.3))
                    
                    TextField("Search memories...", text: $searchText)
                        .foregroundColor(.white)
                        .accentColor(AppTheme.accent)
                }
                .padding()
                .background(Color.white.opacity(0.05))
                .overlay(
                    Rectangle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
                .padding(.horizontal)
                
                Spacer()
                
                // Empty State
                VStack(spacing: 16) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 48))
                        .foregroundColor(.white.opacity(0.1))
                    
                    Text("Start typing to search")
                        .font(AppTheme.Fonts.body(14))
                        .foregroundColor(.white.opacity(0.3))
                }
                
                Spacer()
            }
        }
        .navigationBarHidden(true)
    }
}
