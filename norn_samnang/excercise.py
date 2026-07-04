item_name = "shampoo"
item_price = 15
is_in_stock = False

# Displaying a clean product summary
print(f"Product: {item_name.capitalize()}")
print(f"Price: ${item_price:.2f}")

if is_in_stock:
    print("Status: In Stock")
else:
    print("Status: Out of Stock")