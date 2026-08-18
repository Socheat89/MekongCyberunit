prompt = "\nPlease enter your age (or 'quit' to exit): "
while True:
    age_input = input(prompt)
    if age_input.lower() == 'quit':
        print("Thank you! Enjoy your movie.")
        break
    age = int(age_input)
    if age < 3:
        print("Your movie ticket is free")
    elif 3 <= age <= 12:
        print("Your movie ticket is $10.")
    else:
        print("Your movie ticket is $15")
