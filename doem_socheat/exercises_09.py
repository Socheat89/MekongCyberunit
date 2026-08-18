# ============================================================
# Exercises 09: Magicians (show_magicians)
# A LIST is passed to the function as one argument, then the
# function loops over it. Lists are MUTABLE objects.
# ============================================================

magicians = ["david copperfield", "david blaine", "penn jillette"]


def show_magicians(magicians):
    """Print each magician's name in the list."""
    print("\nMagicians:")
    for magician in magicians:
        print(f"- {magician.title()}")


show_magicians(magicians)
