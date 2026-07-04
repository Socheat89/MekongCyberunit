# 1. Define the Product Catalog using dictionaries
inventory = {
    "101": {"name": "shampoo", "price": 15.00, "stock": 0},
    "102": {"name": "conditioner", "price": 18.50, "stock": 5},
    "103": {"name": "body wash", "price": 12.00, "stock": 12}
}


# 2. Function to display all products and their availability
def display_inventory():
    print("\n================ CURRENT CATALOG ================")
    print(f"{'ID':<6}{'Item Name':<15}{'Price':<10}{'Status':<15}")
    print("-" * 50)

    for item_id, details in inventory.items():
        # Determine stock status automatically from the quantity
        if details["stock"] > 0:
            status = f"In Stock ({details['stock']})"
        else:
            status = "Out of Stock"

        print(f"{item_id:<6}{details['name'].capitalize():<15}${details['price']:<10.2f}{status:<15}")
    print("=================================================\n")


# 3. Function to handle a purchase request
def purchase_item(item_id):
    # Check if the product ID exists in our inventory
    if item_id not in inventory:
        print("❌ Error: Invalid Item ID.")
        return

    product = inventory[item_id]

    print(f"🛒 Attempting to buy: {product['name'].capitalize()}...")

    # Check stock availability
    if product["stock"] > 0:
        product["stock"] -= 1  # Reduce stock by 1
        print(f"✅ Success! You bought {product['name']}. That will be ${product['price']:.2f}.")
    else:
        print(f"❌ Sorry, {product['name']} is currently out of stock and cannot be purchased.")


# --- SIMULATION RUN ---

# Step 1: Show initial stock (Shampoo starts at 0 stock, Body Wash starts at 12)
display_inventory()

# Step 2: Try to buy an out-of-stock item (Shampoo)
purchase_item("101")

# Step 3: Try to buy an in-stock item (Body Wash)
purchase_item("103")

# Step 4: Show updated stock to see the changes
display_inventory()