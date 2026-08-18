# ============================================================
# Exercises 02: Favorite Book (favorite_book)
# 'title' is a required PARAMETER: the value passed in the call
# (the ARGUMENT) is stored inside 'title'.
# ============================================================


def favorite_book(title):
    """Print a message about a favorite book."""
    print(f"One of my favorite books is {title.title()}.")


favorite_book("Alice in Wonderland")
