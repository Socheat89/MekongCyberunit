prompt = "\nPlease enter your age (or type 'quit' to exit): "

while True:
    user_input = input(prompt)
    if user_input.lower() == 'quit':
        print("Enjoy the movie! Goodbye!")
        break
    if not user_input.isdigit():
        print("Please enter a valid number for your age.")
        continue

    age = int(user_input)

    if age < 3:
        price = 0
    elif age <= 12:
        price = 10
    else:
        price = 15

    if price == 0:
        print("Your movie ticket is free!")
    else:
        print(f"Your movie ticket cost is ${price}.")