// EXAMPLE: Blown-Up Image Background for Commitment Card
// Based on app-style-guide principles

import SwiftUI

struct CommitmentCardWithHeroBackground: View {
    @State private var agreed: Bool = false
    
    var body: some View {
        ZStack {
            // LAYER 1: Dramatic blown-up hero image
            Image("commitment-hero") // AI-generated: warrior silhouette, mountain peak
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height)
                .blur(radius: 70) // Heavy blur for dreamy effect
                .overlay(
                    // Gradient overlay to ensure text readability
                    LinearGradient(
                        colors: [
                            Color.black.opacity(0.8),
                            Color.black.opacity(0.5),
                            Color.black.opacity(0.8)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .blendMode(.multiply) // Darkens the image, adds drama
                .ignoresSafeArea()
            
            // LAYER 2: Accent color wash (optional - adds brand vibe)
            RadialGradient(
                colors: [
                    AppTheme.accent.opacity(0.15),
                    .clear
                ],
                center: .top,
                startRadius: 100,
                endRadius: 500
            )
            .blendMode(.screen) // Brightens, adds glow
            .ignoresSafeArea()
            
            // LAYER 3: Your commitment card content (unchanged)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 40) {
                    // Icon
                    Image(systemName: "shield.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [AppTheme.accent, AppTheme.accent.opacity(0.7)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .shadow(color: AppTheme.accent.opacity(0.4), radius: 20, x: 0, y: 10)
                    
                    // Rest of your commitment card UI...
                }
                .padding(20)
            }
        }
    }
}

// EXAMPLE: Pillar-Specific Backgrounds for Questions

struct PillarQuestionWithContextualBackground: View {
    let pillar: String // "gym", "focus", "business", etc.
    
    var backgroundImage: String {
        switch pillar {
        case "gym": return "gym-hero" // Close-up of dumbbells, muscle texture
        case "focus": return "focus-hero" // Abstract neural network, eye macro
        case "business": return "business-hero" // Skyscraper, laptop keys
        case "fighting": return "fighting-hero" // Boxing gloves, sweat droplets
        case "nofap": return "nofap-hero" // Flame, phoenix rising
        default: return "default-hero"
        }
    }
    
    var body: some View {
        ZStack {
            // Dynamic background based on pillar
            Image(backgroundImage)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .blur(radius: 50)
                .overlay(Color.black.opacity(0.7))
                .blendMode(.multiply)
                .ignoresSafeArea()
            
            // Question content on top
            VStack {
                Text("Where are you at with \(pillar.capitalized)?")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(.white)
                    .shadow(color: .black.opacity(0.3), radius: 10)
                
                // Choice buttons...
            }
        }
    }
}

// EXAMPLE: Voice Recording with Waveform Background

struct VoiceRecorderWithDramaticBackground: View {
    var body: some View {
        ZStack {
            // Blown-up microphone mesh texture
            Image("microphone-macro")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .blur(radius: 80)
                .overlay(
                    LinearGradient(
                        colors: [Color.black, Color.black.opacity(0.3), Color.black],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .blendMode(.overlay)
                .opacity(0.4)
                .ignoresSafeArea()
            
            // Animated particle effect (optional - can use Lottie)
            // ParticleEmitter()
            
            // Voice recorder UI
            VStack {
                Text("Why does this matter to you?")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundColor(.white)
                
                // Waveform visualizer...
            }
        }
    }
}

// AI IMAGE PROMPTS FOR EACH PILLAR:

/*
GYM:
"Ultra close-up macro photography of chrome dumbbell, dramatic side lighting, 
shallow depth of field, dark gym background, orange rim light, 8k, cinematic"

FOCUS:
"Abstract flowing neural pathways, glowing connections, deep blue and orange tones, 
particle effects, ethereal atmosphere, bokeh background, digital art"

BUSINESS:
"Aerial view of modern glass skyscraper reflecting golden hour clouds, 
tilt-shift blur, corporate aesthetic, warm orange glow, architectural photography"

FIGHTING:
"Extreme close-up of worn leather boxing glove, sweat droplets on surface, 
dramatic chiaroscuro lighting, texture detail, dark background with orange accent light"

NOFAP:
"Phoenix rising from flames, abstract fire particles, orange and gold embers, 
dark smoky background, rebirth symbolism, fantasy art style, cinematic lighting"

COMMITMENT CARD:
"Silhouette of lone figure standing on mountain peak at sunrise, 
epic scale, golden hour backlighting, atmospheric perspective, 
wide angle, dramatic sky with orange clouds, inspirational photography"

VOICE RECORDING:
"Vintage studio microphone mesh extreme macro, golden hour lighting, 
shallow DOF, bokeh lights in background, warm orange tone, 
professional audio equipment, artistic photography"
*/
