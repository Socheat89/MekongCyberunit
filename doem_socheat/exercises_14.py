# ============================================================
# Exercises 14: Cars (make_car with **car_info)
# Required parameters come first, then **car_info captures
# every extra keyword argument into a dictionary.
# ============================================================


def make_car(manufacturer, model, **car_info):
    """Build a dictionary describing a car."""
    car = {"manufacturer": manufacturer.title(), "model": model.title()}
    for key, value in car_info.items():
        car[key] = value
    return car


car = make_car("subaru", "outback", color="blue", tow_package=True)
print(car)
