# ============================================================
# Exercises 10: Great Magicians (make_great)
# The function MODIFIES the list IN PLACE using the index.
# Lists are MUTABLE, so the changes are visible outside the
# function too - no 'return' statement is needed!
# ============================================================

magicians = ["david copperfield", "david blaine", "penn jillette"]


def show_magicians(magicians):
    """Print each magician's name in the list."""
    print("\nMagicians:")
    for magician in magicians:
        print(f"- {magician.title()}")


def make_great(magicians):
    """Add 'the Great' to each name, modifying the list in place."""
    for i in range(len(magicians)):
        magicians[i] = "the Great " + magicians[i]


make_great(magicians)
show_magicians(magicians)
