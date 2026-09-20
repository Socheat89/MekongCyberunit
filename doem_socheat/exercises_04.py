# ============================================================
# Exercises 04: Large Shirts (default values)
# DEFAULT ARGUMENTS: if no argument is given, Python uses the
# default value. Defaults must come after required parameters.
# ============================================================


def make_shirt(size="L", message="I love Python"):
    """Summarize a shirt, defaulting to size L and 'I love Python'."""
    print(f"Making a {size.upper()} shirt with the message: '{message}'.")


make_shirt()
make_shirt(size="M")
make_shirt(size="XL", message="Python Rules!")
