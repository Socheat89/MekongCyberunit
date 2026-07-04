# 1. Expanded Product Catalog
inventory = {
    "101": {"name": "shampoo", "price": 15.00, "stock": 0},
    "102": {"name": "conditioner", "price": 18.50, "stock": 5},
    "103": {"name": "body wash", "price": 12.00, "stock": 12},
    "104": {"name": "face wash", "price": 9.99, "stock": 8},
    "105": {"name": "moisturizer", "price": 22.00, "stock": 4}
}


# 2. Function to print the store menu
def display_inventory():
    print("\n================ CURRENT CATALOG ================")
    print(f"{'ID':<6}{'Item Name':<15}{'Price':<10}{'Status':<15}")
    print("-" * 50)

    for item_id, details in inventory.items():
        if details["stock"] > 0:
            status = f"In Stock ({details['stock']})"
        else:
            status = "Out of Stock"

        print(f"{item_id:<6}{details['name'].capitalize():<15}${details['price']:<10.2f}{status:<15}")
    print("=================================================\n")


# 3. Function to handle the purchase
def purchase_item(item_id):
    if item_id not in inventory:
        print("\n❌ Error: Invalid Item ID.")
        return

    product = inventory[item_id]
    print(f"\n🛒 Checking availability for {product['name'].capitalize()}...")

    if product["stock"] > 0:
        product["stock"] -= 1
        print(f"✅ Success! You bought 1x {product['name']}. That will be ${product['price']:.2f}.")
    else:
        print(f"❌ Sorry, {product['name']} is currently out of stock!")


# 4. NEW: Function to add a brand new product to the inventory
def add_new_product():
    print("\n--- ➕ ADD NEW PRODUCT ---")

    # Generate a new unique ID automatically
    new_id = str(max(int(k) for k in inventory.keys()) + 1)

    name = input("Enter product name: ").strip().lower()

    # Error handling for inputs to prevent crashes if a user types text for price/stock
    try:
        price = float(input("Enter product price ($): "))
        stock = int(input("Enter starting stock quantity: "))
    except ValueError:
        print("❌ Invalid price or stock number. Product creation failed.")
        return

    # Save to our dictionary
    inventory[new_id] = {"name": name, "price": price, "stock": stock}
    print(f"✅ Successfully added {name.capitalize()} as Item ID: {new_id}!")


# --- MAIN INTERACTIVE LOOP ---
print("Welcome to the Admin & Shopping Terminal!")

while True:
    display_inventory()
    print("Options: [Type ID to Buy] | [Type 'add' to Add Product] | [Type 'exit' to Quit]")
    user_choice = input("What would you like to do? ").strip().lower()

    if user_choice == 'exit':
        print("\nThank you for using the system. Goodbye!")
        break
    elif user_choice == 'add':
        add_new_product()
    else:
        purchase_item(user_choice)