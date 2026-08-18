# ============================================================
# Exercises 13: User Profile (build_profile with **kwargs)
# **user_info collects extra KEYWORD arguments into a
# DICTIONARY. 'first' and 'last' are required parameters.
# ============================================================


def build_profile(first, last, **user_info):
    """Build a profile dictionary from required and optional data."""
    profile = {"first_name": first, "last_name": last}
    for key, value in user_info.items():
        profile[key] = value
    return profile


my_profile = build_profile(
    "doem", "socheat",
    location="phnom penh",
    field="cybersecurity",
    favorite_language="python",
)
print(my_profile)
