import Foundation

/// Supabase configuration - pull from environment or plist
struct SupabaseConfig {
    let url: URL
    let anonKey: String
    
    static let shared = SupabaseConfig()
    
    init() {
        // Use hardcoded credentials (from .dev.vars or backend/.dev.vars)
        let supabaseURL = "https://mpicqllpqtwfafqppwal.supabase.co"
        let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waWNxbGxwcXR3ZmFmcXBwd2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE3MjAsImV4cCI6MjA2NTkwNzcyMH0._fDXGCSWd3c9_pylJnhux_Jh0sp3vD8aJUApYxs1_sI"
        
        guard let urlObj = URL(string: supabaseURL) else {
            fatalError("Invalid Supabase URL: \(supabaseURL)")
        }
        
        self.url = urlObj
        self.anonKey = supabaseKey
    }
}

