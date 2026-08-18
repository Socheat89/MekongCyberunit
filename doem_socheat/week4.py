def describe_pet(pet_name, animal_type='dog'):

    print(f"\nI have a {animal_type}.")
    print(f"My {animal_type}'s name is {pet_name.title()}.")

describe_pet(pet_name='Jimme')

describe_pet(pet_name='ah luk', animal_type='cat')
