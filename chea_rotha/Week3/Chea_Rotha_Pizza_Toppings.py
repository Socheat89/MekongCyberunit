prompt = "\nPlease enter a pizza topping (or 'quit' when you are finished): "
while True:
    topping = input(prompt)

    if topping.lower() == 'quit':
        print("Done adding toppings to your pizza!")
        break
    else:
        print(f"I'll add {topping} to your pizza!")