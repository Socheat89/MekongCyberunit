# ============================================================
# Exercises 11: Unchanged Magicians (make_great with a copy)
# Pass a COPY of the list with the slice magicians[:].
# The function edits the copy, so the ORIGINAL stays unchanged.
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



great_magicians = magicians[:]
make_great(great_magicians)

show_magicians(magicians)
show_magicians(great_magicians)
