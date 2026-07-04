# 1. Our Product Catalog
inventory = {
    "101": {"name": "shampoo", "price": 15.00, "stock": 0},
    "102": {"name": "conditioner", "price": 18.50, "stock": 5},
    "103": {"name": "body wash", "price": 12.00, "stock": 12}
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
        print("\n❌ Error: Invalid Item ID. Please try again.")
        return

    product = inventory[item_id]

    print(f"\n🛒 Checking availability for {product['name'].capitalize()}...")

    if product["stock"] > 0:
        product["stock"] -= 1  # Reduce inventory
        print(f"✅ Success! You bought 1x {product['name']}. That will be ${product['price']:.2f}.")
    else:
        print(f"❌ Sorry, {product['name']} is currently out of stock!")


# --- MAIN INTERACTIVE LOOP ---
print("Welcome to the Python Terminal Store!")

while True:
    display_inventory()

    # Prompting the user for input
    user_choice = input("Enter the ID of the item you want to buy (or type 'exit' to quit): ").strip()

    # Check if user wants to stop the program
    if user_choice.lower() == 'exit':
        print("\nThank you for shopping with us! Goodbye.")
        break

    # Process the purchase based on what they typed
    purchase_item(user_choice)