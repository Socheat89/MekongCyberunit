# ============================================================
# Week 4 Exercises: Functions (Python Crash Course, Chapter 8)
# ============================================================

# 1. Message -------------------------------------------------
# A function with NO parameters: it just prints a sentence.


def display_message():
    """Print what I am learning about in this chapter."""
    print("In this chapter, I am learning about Python functions!")


display_message()  # Example call

# 2. Favorite Book -------------------------------------------
# 'title' is a required PARAMETER. The value passed in the call
# (the ARGUMENT) is stored in 'title' inside the function.


def favorite_book(title):
    """Print a message about a favorite book."""
    print(f"One of my favorite books is {title.title()}.")


favorite_book("Alice in Wonderland")  # positional argument
favorite_book("the khmer history")    # .title() fixes the capitalization

# 3. T-Shirt -------------------------------------------------
# A function with two parameters: size and message.
# Called once with POSITIONAL arguments (order matters!) and
# once with KEYWORD arguments (order doesn't matter).


def make_shirt(size, message):
    """Summarize a shirt's size and printed message."""
    print(f"\nMaking a {size.upper()} shirt with the message: '{message}'.")


make_shirt("medium", "Hello World!")                       # positional
make_shirt(size="small", message="Coding is Fun!")         # keyword

# 4. Large Shirts --------------------------------------------
# DEFAULT ARGUMENT VALUES: if no argument is given, Python uses
# the default value. Defaults must come AFTER required params.


def make_shirt(size="L", message="I love Python"):
    """Summarize a shirt, defaulting to size L and 'I love Python'."""
    print(f"Making a {size.upper()} shirt with the message: '{message}'.")


make_shirt()                                # uses both defaults -> L
make_shirt(size="M")                        # default message, size M
make_shirt(size="XL", message="Python Rules!")  # both overridden

# 5. Cities --------------------------------------------------
# 'country' has a DEFAULT value of 'Iceland'. 'city' is required.


def describe_city(city, country="Iceland"):
    """Print a sentence about a city and its country."""
    print(f"{city.title()} is in {country.title()}.")


describe_city("reykjavik")                  # uses default country
describe_city("akureyri")                   # uses default country
describe_city("phnom penh", "cambodia")     # overrides default

# 6. City Names ----------------------------------------------
# This function RETURNS a value (a formatted string) instead of
# printing. Use 'return' to send data back to the caller.


def city_country(city, country):
    """Return a formatted 'City, Country' string."""
    return f"{city.title()}, {country.title()}"


print(city_country("santiago", "chile"))
print(city_country("paris", "france"))
print(city_country("tokyo", "japan"))

# 7. Album ---------------------------------------------------
# 'tracks' is an OPTIONAL parameter with default None.
# None means "no value given" -> we only add the key if a real
# number was passed. The function RETURNS a dictionary.


def make_album(artist, title, tracks=None):
    """Build a dictionary describing a music album."""
    album = {"artist": artist.title(), "title": title.title()}
    if tracks is not None:          # only add tracks if provided
        album["tracks"] = tracks
    return album                    # return the dictionary


print(make_album("the beatles", "abbey road"))
print(make_album("coldplay", "parachutes"))
print(make_album("eminem", "the eminem show", tracks=20))  # with tracks

# 8. User Albums (Interactive Loop) --------------------------
# A WHILE loop asks for input and calls make_album() each round.
# Typing 'q' for either answer quits the loop.


def make_album(artist, title, tracks=None):
    """Build a dictionary describing a music album (reused)."""
    album = {"artist": artist.title(), "title": title.title()}
    if tracks is not None:
        album["tracks"] = tracks
    return album


while True:
    print("\nEnter an album (or 'q' to quit):")
    artist_name = input("Artist: ")
    if artist_name.lower() == "q":
        break
    album_title = input("Album title: ")
    if album_title.lower() == "q":
        break
    # Call make_album() with the user's input and print the result.
    print(make_album(artist_name, album_title))

# 9. Magicians -----------------------------------------------
# A LIST passed to a function. Inside the function we loop over
# the list. Lists are MUTABLE objects - see exercises 10 & 11.

magicians = ["david copperfield", "david blaine", "penn jillette"]


def show_magicians(magicians):
    """Print each magician's name in the list."""
    print("\nMagicians:")
    for magician in magicians:
        print(f"- {magician.title()}")


show_magicians(magicians)  # pass the whole list as one argument

# 10. Great Magicians ----------------------------------------
# The function MODIFIES the original list in place using the
# loop index (magicians[i]). Because lists are MUTABLE, changes
# are visible outside the function too - no 'return' needed!


def make_great(magicians):
    """Add 'the Great' to each name, modifying the list in place."""
    for i in range(len(magicians)):      # i = 0, 1, 2 ...
        magicians[i] = "the Great " + magicians[i]  # edit in place


make_great(magicians)        # modifies the ORIGINAL list
show_magicians(magicians)    # original list is now changed!

# 11. Unchanged Magicians ------------------------------------
# Pass a COPY of the list using the slice magicians[:].
# The copy is modified, the ORIGINAL list stays unchanged.

magicians = ["david copperfield", "david blaine", "penn jillette"]

# Pass a copy -> the function edits the copy, not the original.
great_magicians = magicians[:]
make_great(great_magicians)

show_magicians(magicians)        # original: unchanged
show_magicians(great_magicians)  # copy: names with "the Great"

# 12. Sandwiches ---------------------------------------------
# *items collects ANY number of positional arguments into a
# TUPLE named 'items'. Call with 1, 3, or 7+ items!


def make_sandwich(*items):
    """Print a summary of the sandwich being ordered."""
    print("\nMaking a sandwich with:")
    for item in items:
        print(f"  - {item}")


make_sandwich("ham")                       # one item
make_sandwich("turkey", "lettuce", "tomato")  # three items
make_sandwich("cheese", "onion", "cucumber", "mayo", "egg", "bacon", "avocado")

# 13. User Profile -------------------------------------------
# **user_info collects extra KEYWORD arguments into a DICTIONARY.
# 'first' and 'last' are required; the rest is optional.


def build_profile(first, last, **user_info):
    """Build a profile dictionary from required and optional data."""
    profile = {"first_name": first, "last_name": last}
    # user_info is a dict of all extra key=value pairs passed in.
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

# 14. Cars ---------------------------------------------------
# Required parameters first, then **car_info captures every
# extra keyword argument (color, tow_package, ...) as a dict.


def make_car(manufacturer, model, **car_info):
    """Build a dictionary describing a car."""
    car = {"manufacturer": manufacturer.title(), "model": model.title()}
    for key, value in car_info.items():
        car[key] = value
    return car


car = make_car("subaru", "outback", color="blue", tow_package=True)
print(car)
