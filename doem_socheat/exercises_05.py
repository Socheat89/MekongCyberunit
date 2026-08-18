# ============================================================
# Exercises 05: Cities (describe_city)
# 'country' has a DEFAULT value of 'Iceland'; 'city' is required.
# ============================================================


def describe_city(city, country="Iceland"):
    """Print a sentence about a city and its country."""
    print(f"{city.title()} is in {country.title()}.")


describe_city("reykjavik")
describe_city("akureyri")
describe_city("phnom penh", "cambodia")
