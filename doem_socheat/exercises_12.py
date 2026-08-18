# ============================================================
# Exercises 12: Sandwiches (make_sandwich with *items)
# *items collects ANY number of positional arguments into a
# TUPLE named 'items'. Call with 1, 3, or 7+ items!
# ============================================================


def make_sandwich(*items):
    """Print a summary of the sandwich being ordered."""
    print("\nMaking a sandwich with:")
    for item in items:
        print(f"  - {item}")


make_sandwich("ham")
make_sandwich("turkey", "lettuce", "tomato")
make_sandwich("cheese", "onion", "cucumber", "mayo", "egg", "bacon", "avocado")
