class Product:
    def __init__(self, name, price, stock):
        self.name = name
        self.price = price
        self.stock = stock  # Represented as an integer quantity

    def display_status(self):
        print(f"Product: {self.name.title()}")
        print(f"Price: ${self.price}")
        if self.stock > 0:
            print(f"Stock: {self.stock} left")
        else:
            print("Stock: Out of Stock")
        print("-" * 20)

# Creating instances (objects) of the Product class
item1 = Product("shampoo", 15, 0)
item2 = Product("body wash", 12, 5)

# Running the method
item1.display_status()
item2.display_status()