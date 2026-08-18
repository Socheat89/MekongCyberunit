# ============================================================
# Exercises 06: City Names (city_country)
# The function RETURNS a value instead of printing.
# 'return' sends the formatted string back to the caller.
# ============================================================


def city_country(city, country):
    """Return a formatted 'City, Country' string."""
    return f"{city.title()}, {country.title()}"


print(city_country("santiago", "chile"))
print(city_country("paris", "france"))
print(city_country("tokyo", "japan"))
