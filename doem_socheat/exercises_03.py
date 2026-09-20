# ============================================================
# Exercises 03: T-Shirt (make_shirt)
# Two parameters: size and message.
# First call uses POSITIONAL arguments (order matters!).
# Second call uses KEYWORD arguments (order doesn't matter).
# ============================================================


def make_shirt(size, message):
    """Summarize a shirt's size and printed message."""
    print(f"\nMaking a {size.upper()} shirt with the message: '{message}'.")


make_shirt("medium", "Hello World!")
make_shirt(size="small", message="Coding is Fun!")
