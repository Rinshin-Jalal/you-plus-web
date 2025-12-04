"""
Legacy psychological context building from onboarding_context JSONB.
Used as fallback when Supermemory is unavailable.
"""


def build_legacy_psychological_context(onboarding: dict) -> str:
    """
    Build psychological context from legacy onboarding_context JSONB.
    Used as fallback when Supermemory is unavailable.
    """
    lines = []

    # Goal info
    goal = onboarding.get("goal", "")
    if goal:
        lines.append(f"Goal: {goal}")
    goal_deadline = onboarding.get("goal_deadline", "")
    if goal_deadline:
        lines.append(f"Deadline: {goal_deadline}")

    # Failure patterns
    attempt_count = onboarding.get("attempt_count", 0)
    if attempt_count and attempt_count > 0:
        lines.append(f"- Tried this {attempt_count} times before and failed")

    attempt_history = onboarding.get("attempt_history", "")
    if attempt_history:
        lines.append(f'- Their pattern: "{attempt_history}"')

    quit_pattern = onboarding.get("quit_pattern", "")
    if quit_pattern:
        lines.append(f"- Usually quits: {quit_pattern}")

    how_did_quit = onboarding.get("how_did_quit", "")
    if how_did_quit:
        lines.append(f"- How they quit last time: {how_did_quit}")

    biggest_obstacle = onboarding.get("biggest_obstacle", "")
    if biggest_obstacle:
        lines.append(f"- Biggest obstacle: {biggest_obstacle}")

    # Emotional triggers
    favorite_excuse = onboarding.get("favorite_excuse", "")
    if favorite_excuse:
        lines.append(
            f'- FAVORITE EXCUSE: "{favorite_excuse}" (call it out if they use it)'
        )

    future_if_no_change = onboarding.get("future_if_no_change", "")
    if future_if_no_change:
        lines.append(f'- THEIR FEAR: "{future_if_no_change}"')

    who_disappointed = onboarding.get("who_disappointed", "")
    if who_disappointed:
        lines.append(f"- WHO THEY'VE LET DOWN: {who_disappointed}")

    biggest_fear = onboarding.get("biggest_fear", "")
    if biggest_fear:
        lines.append(f"- DEEPEST FEAR: {biggest_fear}")

    witness = onboarding.get("witness", "")
    if witness:
        lines.append(f"- WHO'S WATCHING: {witness}")

    success_vision = onboarding.get("success_vision", "")
    if success_vision:
        lines.append(f'- WHAT THEY\'RE FIGHTING FOR: "{success_vision}"')

    what_spent = onboarding.get("what_spent", "")
    if what_spent:
        lines.append(f"- Already wasted: {what_spent}")

    if not lines:
        return "- First time, learn their patterns tonight."

    return "\n".join(lines)
