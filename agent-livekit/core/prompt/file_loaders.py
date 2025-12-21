"""
File Loading Utilities
======================
Loads markdown files for voice skills and guides.
"""

from pathlib import Path

# Path to skills directory (parent of core directory)
SKILLS_DIR = Path(__file__).parent.parent / "skills"


def load_voice_skill() -> str:
    """
    Load the voice conversation skill from markdown file.
    This skill teaches the agent to have natural voice conversations.
    """
    skill_path = SKILLS_DIR / "voice_conversation.md"
    try:
        if skill_path.exists():
            return skill_path.read_text()
    except Exception as e:
        print(f"⚠️ Could not load voice skill: {e}")
    return ""


def load_voice_control_guide() -> str:
    """
    Load the Cartesia Sonic 3 voice control guide.
    Teaches the agent to use emotions, speed, SSML for powerful delivery.
    """
    guide_path = Path(__file__).parent / "voice_control.md"
    try:
        if guide_path.exists():
            return guide_path.read_text()
    except Exception as e:
        print(f"⚠️ Could not load voice control guide: {e}")
    return ""

