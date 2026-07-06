enum FoodCategory { starters, mains, desserts, drinks }

class FoodItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final FoodCategory category;
  final String prepTime;
  final double rating;
  final bool isSpicy;
  final bool isVegetarian;

  const FoodItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.category,
    required this.prepTime,
    required this.rating,
    required this.isSpicy,
    required this.isVegetarian,
  });

  static const List<FoodItem> mockMenu = [
    // Starters
    FoodItem(
      id: "food_1",
      name: "Truffle Burrata Salad",
      description: "Creamy Italian burrata served over heirloom cherry tomatoes, wild arugula, drizzled with white truffle oil and an aged balsamic glaze.",
      price: 18.0,
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.starters,
      prepTime: "12 min",
      rating: 4.8,
      isSpicy: false,
      isVegetarian: true,
    ),
    FoodItem(
      id: "food_2",
      name: "Seared Scallops",
      description: "Pan-seared jumbo Atlantic scallops resting on a velvet cauliflower purée, topped with crispy pancetta crumbles and herb oil.",
      price: 24.0,
      imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.starters,
      prepTime: "15 min",
      rating: 4.9,
      isSpicy: false,
      isVegetarian: false,
    ),
    
    // Mains
    FoodItem(
      id: "food_3",
      name: "Wagyu Ribeye Steak",
      description: "Grade A5 Wagyu ribeye grilled to perfection, glazed with garlic-herb butter, accompanied by roasted asparagus and truffle mash.",
      price: 85.0,
      imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.mains,
      prepTime: "25 min",
      rating: 5.0,
      isSpicy: false,
      isVegetarian: false,
    ),
    FoodItem(
      id: "food_4",
      name: "Lobster Ravioli",
      description: "Handcrafted pasta pockets stuffed with Maine lobster meat in a rich, creamy saffron-brandy reduction sauce and fresh tarragon.",
      price: 42.0,
      imageUrl: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.mains,
      prepTime: "20 min",
      rating: 4.7,
      isSpicy: false,
      isVegetarian: false,
    ),
    FoodItem(
      id: "food_5",
      name: "Spicy Sichuan Tofu",
      description: "Silken tofu simmered in a fiery fermented chili bean sauce with Sichuan peppercorns, scallions, and served with jasmine rice.",
      price: 28.0,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.mains,
      prepTime: "15 min",
      rating: 4.6,
      isSpicy: true,
      isVegetarian: true,
    ),

    // Desserts
    FoodItem(
      id: "food_6",
      name: "Deconstructed Tiramisu",
      description: "Espresso-soaked ladyfingers, whipped mascarpone mousse, dusted with rich Belgian cocoa powder, and dark chocolate curls.",
      price: 14.0,
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.desserts,
      prepTime: "10 min",
      rating: 4.9,
      isSpicy: false,
      isVegetarian: true,
    ),
    FoodItem(
      id: "food_7",
      name: "Lava Cake with Berries",
      description: "Decadent dark chocolate cake with a molten fudge core, served hot with fresh raspberries and a scoop of vanilla bean gelato.",
      price: 16.0,
      imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.desserts,
      prepTime: "12 min",
      rating: 4.8,
      isSpicy: false,
      isVegetarian: true,
    ),

    // Drinks
    FoodItem(
      id: "food_8",
      name: "Signature Golden Elixir",
      description: "A refreshing mocktail crafted with fresh pineapple juice, passionfruit purée, turmeric honey syrup, and topped with sparkling water and edible gold flake.",
      price: 12.0,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.drinks,
      prepTime: "5 min",
      rating: 4.9,
      isSpicy: false,
      isVegetarian: true,
    ),
    FoodItem(
      id: "food_9",
      name: "Vintage Cabernet Sauvignon",
      description: "A full-bodied red wine with notes of dark blackberry, plum, toasted oak, and a velvety smooth dry finish.",
      price: 22.0,
      imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80",
      category: FoodCategory.drinks,
      prepTime: "3 min",
      rating: 4.9,
      isSpicy: false,
      isVegetarian: true,
    ),
  ];
}

class CartItem {
  final FoodItem foodItem;
  int quantity;
  String? notes;

  CartItem({
    required this.foodItem,
    this.quantity = 1,
    this.notes,
  });

  double get totalPrice => foodItem.price * quantity;
}

class FoodOrder {
  final String id;
  final List<CartItem> items;
  final DateTime orderTime;
  final String deliveryMethod; // "Room Service" or "Restaurant Table"
  final String destinationDetail; // e.g. "Room 402" or "Table #12"
  final double totalPrice;
  final String orderReference;
  String status; // "Preparing", "Out for Delivery", "Delivered"

  FoodOrder({
    required this.id,
    required this.items,
    required this.orderTime,
    required this.deliveryMethod,
    required this.destinationDetail,
    required this.totalPrice,
    required this.orderReference,
    this.status = "Preparing",
  });
}
