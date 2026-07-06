import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../widgets/booking_success_dialog.dart';
import '../../state/app_state.dart';
import '../../models/food_item.dart';
import '../main_navigation.dart';
import '../profile/profile_screen.dart';
import '../bookings/bookings_history_screen.dart';

// ==========================================
// 1. RESTAURANT MENU SCREEN
// ==========================================
class RestaurantMenuScreen extends StatefulWidget {
  const RestaurantMenuScreen({super.key});

  @override
  State<RestaurantMenuScreen> createState() => _RestaurantMenuScreenState();
}

class _RestaurantMenuScreenState extends State<RestaurantMenuScreen> {
  FoodCategory _selectedCategory = FoodCategory.starters;
  String _searchQuery = "";
  bool _showFilters = false;
  bool _onlyVegetarian = false;
  bool _onlySpicy = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);

    // Filtering items
    final filteredMenu = state.menu.where((item) {
      final matchesCategory = item.category == _selectedCategory;
      final matchesSearch = item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesVegetarian = !_onlyVegetarian || item.isVegetarian;
      final matchesSpicy = !_onlySpicy || item.isSpicy;
      
      return matchesCategory && matchesSearch && matchesVegetarian && matchesSpicy;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Column(
            children: [
              // Search input
              _buildSearchBar(),
              
              // Category tab list
              _buildCategorySelector(),
              
              // Collapsible Sub-filters
              AnimatedCrossFade(
                firstChild: _buildSubFilters(),
                secondChild: const SizedBox.shrink(),
                crossFadeState: _showFilters ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                duration: const Duration(milliseconds: 250),
              ),
              
              // List list of food items
              Expanded(
                child: filteredMenu.isEmpty
                    ? Center(
                        child: Text(
                          "No gourmet dishes found.",
                          style: TextStyle(color: HotelTheme.textSecondary),
                        ),
                      )
                    : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 180),
                        itemCount: filteredMenu.length,
                        itemBuilder: (context, index) {
                          final item = filteredMenu[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: _buildFoodCard(item, state),
                          );
                        },
                      ),
              ),
            ],
          ),

          // Floating Cart Bar at bottom if cart is not empty
          if (state.cartCount > 0)
            Positioned(
              bottom: 110, // Float above bottom navigation bar
              left: 16,
              right: 16,
              child: _buildFloatingCartBar(state),
            ),
        ],
      ),
    );
  }

  Widget _buildSubFilters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
      child: GlassCard(
        blur: 5,
        radius: 12,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // Vegetarian filter
            Row(
              children: [
                Icon(Icons.spa_outlined, size: 16, color: HotelTheme.success),
                const SizedBox(width: 6),
                Text("Vegetarian", style: TextStyle(fontSize: 12, color: HotelTheme.textPrimary)),
                const SizedBox(width: 4),
                Switch(
                  value: _onlyVegetarian,
                  activeColor: HotelTheme.primaryGold,
                  onChanged: (val) {
                    setState(() {
                      _onlyVegetarian = val;
                    });
                  },
                ),
              ],
            ),
            // Spicy filter
            Row(
              children: [
                Icon(Icons.whatshot, size: 16, color: HotelTheme.accentOrange),
                const SizedBox(width: 6),
                Text("Spicy Only", style: TextStyle(fontSize: 12, color: HotelTheme.textPrimary)),
                const SizedBox(width: 4),
                Switch(
                  value: _onlySpicy,
                  activeColor: HotelTheme.primaryGold,
                  onChanged: (val) {
                    setState(() {
                      _onlySpicy = val;
                    });
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: GlassCard(
        blur: 10,
        radius: 14,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Row(
          children: [
            Icon(Icons.search, size: 18, color: HotelTheme.primaryGold),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _searchController,
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val;
                  });
                },
                style: TextStyle(fontSize: 14, color: HotelTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: "Search dishes, ingredients, wines...",
                  hintStyle: TextStyle(color: HotelTheme.textSecondary.withOpacity(0.5)),
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
            if (_searchQuery.isNotEmpty)
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: Icon(Icons.clear, size: 18, color: HotelTheme.textSecondary),
                onPressed: () {
                  setState(() {
                    _searchController.clear();
                    _searchQuery = "";
                  });
                },
              ),
            const SizedBox(width: 8),
            IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              icon: Icon(
                Icons.tune,
                size: 18,
                color: _showFilters ? HotelTheme.primaryGold : HotelTheme.textSecondary,
              ),
              onPressed: () {
                setState(() {
                  _showFilters = !_showFilters;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Container(
      height: 45,
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 12.0),
        children: FoodCategory.values.map((cat) {
          final isSelected = _selectedCategory == cat;
          final String title = cat.toString().split('.').last.toUpperCase();

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            child: InteractiveCard(
              scaleFactor: 0.95,
              onTap: () {
                setState(() {
                  _selectedCategory = cat;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSelected ? HotelTheme.goldGradient : null,
                  color: isSelected ? null : Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? Colors.transparent : Colors.white.withOpacity(0.05),
                  ),
                ),
                child: Text(
                  title,
                  style: TextStyle(
                    color: isSelected ? const Color(0xFF020617) : HotelTheme.textSecondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFoodCard(FoodItem item, AppState state) {
    return InteractiveCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FoodDetailScreen(foodItem: item),
          ),
        );
      },
      child: GlassCard(
        blur: 12,
        radius: 16,
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Side: Image with badges
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    item.imageUrl,
                    height: 90,
                    width: 90,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 90,
                        width: 90,
                        color: Colors.white.withOpacity(0.05),
                        child: Center(
                          child: Icon(
                            Icons.restaurant_menu_outlined,
                            color: HotelTheme.primaryGold,
                            size: 28,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (item.isSpicy)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: HotelTheme.accentOrange,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.whatshot, size: 10, color: HotelTheme.textPrimary),
                    ),
                  ),
                if (item.isVegetarian)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: HotelTheme.success,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: const Text("VEG", style: TextStyle(fontSize: 7, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 16),
            
            // Right Side: Details & Action Row
            Expanded(
              child: SizedBox(
                height: 90, // Match image height for clean alignment
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name,
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: HotelTheme.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.description,
                          style: TextStyle(fontSize: 11, color: HotelTheme.textSecondary, height: 1.3),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "\$${item.price.toInt()}",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: HotelTheme.primaryGold),
                        ),
                        InteractiveCard(
                          onTap: () {
                            state.addToCart(item);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text("Added ${item.name} to cart"),
                                duration: const Duration(seconds: 1),
                                backgroundColor: HotelTheme.backgroundCards,
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: HotelTheme.goldGradient,
                            ),
                            child: const Icon(Icons.add, size: 16, color: Color(0xFF020617)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingCartBar(AppState state) {
    return InteractiveCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const FoodCartScreen(),
          ),
        );
      },
      child: GlassCard(
        blur: 15,
        radius: 20,
        gradient: LinearGradient(
          colors: [
            HotelTheme.primaryGold.withOpacity(0.15),
            Colors.white.withOpacity(0.04),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: HotelTheme.goldGradient,
              ),
              child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF020617), size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Gourmet Cart Items", style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(
                    "${state.cartCount} items selected",
                    style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Row(
              children: [
                Text(
                  "\$${state.cartTotal.toStringAsFixed(1)}",
                  style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_ios, color: HotelTheme.primaryGold, size: 14),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// 2. FOOD DETAIL SCREEN (DISH MODIFIERS)
// ==========================================
class FoodDetailScreen extends StatefulWidget {
  final FoodItem foodItem;

  const FoodDetailScreen({super.key, required this.foodItem});

  @override
  State<FoodDetailScreen> createState() => _FoodDetailScreenState();
}

class _FoodDetailScreenState extends State<FoodDetailScreen> {
  int _quantity = 1;
  String _spiciness = "Medium"; // "Mild", "Medium", "Spicy"
  String _portion = "Regular"; // "Regular", "Large"
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final basePrice = widget.foodItem.price * _quantity;
    final portionMarkup = _portion == "Large" ? 8.0 * _quantity : 0.0;
    final finalPrice = basePrice + portionMarkup;

    return Scaffold(
      appBar: AppBar(
        title: const Text("CUSTOMIZE ORDER"),
      ),
      body: Stack(
        children: [
          Container(decoration: BoxDecoration(gradient: HotelTheme.bgGradient)),
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Display Header Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.network(
                    widget.foodItem.imageUrl,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(
                          child: Icon(
                            Icons.restaurant_menu_outlined,
                            color: HotelTheme.primaryGold,
                            size: 48,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                
                // Title & Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        widget.foodItem.name,
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                      ),
                    ),
                    Text(
                      "\$${widget.foodItem.price.toInt()}",
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: HotelTheme.primaryGold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  widget.foodItem.description,
                  style: TextStyle(color: HotelTheme.textSecondary, height: 1.4, fontSize: 13),
                ),
                const Divider(color: Colors.white10, height: 32),
                
                // Portion Selector
                Text("Select Portion", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 12),
                Row(
                  children: ["Regular", "Large"].map((opt) {
                    final isSelected = _portion == opt;
                    return GestureDetector(
                      onTap: () => setState(() => _portion = opt),
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        margin: const EdgeInsets.only(right: 28),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Custom Premium Gold Radio Circle
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? HotelTheme.primaryGold : HotelTheme.textMuted,
                                  width: 2,
                                ),
                              ),
                              child: Center(
                                child: isSelected
                                    ? Container(
                                        width: 10,
                                        height: 10,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: HotelTheme.primaryGold,
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              "$opt ${opt == 'Large' ? '(+\$8)' : ''}",
                              style: TextStyle(
                                color: isSelected ? HotelTheme.primaryGold : HotelTheme.textSecondary,
                                fontSize: 14,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Spice Level (if applicable)
                if (widget.foodItem.isSpicy) ...[
                  Text("Spice Modifier", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                  const SizedBox(height: 8),
                  Row(
                    children: ["Mild", "Medium", "Spicy"].map((opt) {
                      final isSel = _spiciness == opt;
                      return Expanded(
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          child: InteractiveCard(
                            onTap: () => setState(() => _spiciness = opt),
                            child: GlassCard(
                              blur: 5,
                              radius: 12,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              gradient: isSel ? HotelTheme.goldGradient : null,
                              child: Center(
                                child: Text(
                                  opt,
                                  style: TextStyle(
                                    color: isSel ? const Color(0xFF020617) : Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                ],

                // Special Notes Text Field
                Text("Special Requests / Allergy info", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 8),
                GlassCard(
                  blur: 10,
                  radius: 16,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: TextField(
                    controller: _notesController,
                    maxLines: 2,
                    style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "E.g. No onions, sauce on the side, extra ice...",
                      hintStyle: TextStyle(color: HotelTheme.textSecondary.withOpacity(0.5)),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Quantity Counter
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Set Quantity", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(Icons.remove_circle_outline, color: HotelTheme.textSecondary),
                          onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                        ),
                        Text(
                          "$_quantity",
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: Icon(Icons.add_circle_outline, color: HotelTheme.primaryGold),
                          onPressed: () => setState(() => _quantity++),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Bottom Add button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: GoldButton(
                  onTap: () {
                    // Combine notes
                    final List<String> specList = [];
                    if (_portion != "Regular") specList.add("Portion: $_portion");
                    if (widget.foodItem.isSpicy) specList.add("Spicy: $_spiciness");
                    if (_notesController.text.trim().isNotEmpty) specList.add("Note: ${_notesController.text}");
                    
                    final combinedNotes = specList.isEmpty ? null : specList.join(" | ");

                    state.addToCart(widget.foodItem, quantity: _quantity, notes: combinedNotes);
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text("Added ${widget.foodItem.name} to cart"),
                        backgroundColor: HotelTheme.backgroundCards,
                      ),
                    );
                    Navigator.pop(context);
                  },
                  child: Text("Add to Dining Order • \$${finalPrice.toStringAsFixed(1)}"),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 3. FOOD CART SCREEN (DELIVERY OPTIONS)
// ==========================================
class FoodCartScreen extends StatefulWidget {
  const FoodCartScreen({super.key});

  @override
  State<FoodCartScreen> createState() => _FoodCartScreenState();
}

class _FoodCartScreenState extends State<FoodCartScreen> {
  String _deliveryMethod = "Room Service"; // "Room Service", "Restaurant Table"
  final TextEditingController _destinationController = TextEditingController(text: "402"); // default room

  @override
  void dispose() {
    _destinationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final subtotal = state.cartTotal;
    const serviceCharge = 5.0;
    final total = subtotal + serviceCharge;

    return Scaffold(
      appBar: AppBar(
        title: const Text("DINING CART REVIEW"),
      ),
      body: Stack(
        children: [
          Container(decoration: BoxDecoration(gradient: HotelTheme.bgGradient)),
          
          state.cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_bag_outlined, size: 60, color: HotelTheme.textMuted),
                      const SizedBox(height: 16),
                      Text("Your cart is empty", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 16)),
                      const SizedBox(height: 16),
                      GlassButton(
                        width: 160,
                        onTap: () => Navigator.pop(context),
                        child: const Text("Back to Menu"),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 120),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cart Item List
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: state.cart.length,
                        itemBuilder: (context, index) {
                          final item = state.cart[index];
                          return _buildCartItemCard(item, state);
                        },
                      ),
                      const SizedBox(height: 24),

                      // Delivery Toggles
                      Text("Serving Options", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                      const SizedBox(height: 12),
                      Row(
                        children: ["Room Service", "Restaurant Table"].map((opt) {
                          final isSel = _deliveryMethod == opt;
                          return Expanded(
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              child: InteractiveCard(
                                onTap: () {
                                  setState(() {
                                    _deliveryMethod = opt;
                                    _destinationController.text = opt == "Room Service" ? "402" : "Table 15";
                                  });
                                },
                                child: GlassCard(
                                  blur: 5,
                                  radius: 14,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  gradient: isSel ? HotelTheme.goldGradient : null,
                                  child: Center(
                                    child: Text(
                                      opt,
                                      style: TextStyle(
                                        color: isSel ? const Color(0xFF020617) : Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),

                      // Serving Destination Input
                      GlassCard(
                        blur: 10,
                        radius: 14,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            Icon(
                              _deliveryMethod == "Room Service" ? Icons.room_service : Icons.table_bar,
                              color: HotelTheme.primaryGold,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _destinationController,
                                style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                                decoration: InputDecoration(
                                  labelText: _deliveryMethod == "Room Service" ? "Room Suite Number" : "Table Number",
                                  labelStyle: TextStyle(color: HotelTheme.textSecondary, fontSize: 12),
                                  border: InputBorder.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Invoice Summary
                      Text("Summary", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                      const SizedBox(height: 12),
                      GlassCard(
                        blur: 10,
                        radius: 16,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("Items Subtotal", style: TextStyle(color: HotelTheme.textSecondary)),
                                Text("\$${subtotal.toStringAsFixed(1)}", style: const TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("In-Room Delivery / Service Fee", style: TextStyle(color: HotelTheme.textSecondary)),
                                Text("\$5.0", style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const Divider(color: Colors.white10, height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Dining Total",
                                  style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Text(
                                  "\$${total.toStringAsFixed(1)}",
                                  style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 18),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

          // Bottom Trigger
          if (state.cart.isNotEmpty)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GoldButton(
                    onTap: () {
                      final destination = _destinationController.text.trim();
                      final finalDest = destination.isEmpty ? (_deliveryMethod == "Room Service" ? "402" : "Table 15") : destination;

                      // Calculate summary breakdown for dialog
                      final foodSummaryMap = <String, String>{};
                      for (var item in state.cart) {
                        foodSummaryMap[item.foodItem.name] = "${item.quantity}x (\$${item.totalPrice.toInt()})";
                      }
                      foodSummaryMap["Delivery Type"] = _deliveryMethod;
                      foodSummaryMap["Destination"] = finalDest;
                      foodSummaryMap["Service Charge"] = "\$$serviceCharge";

                      // Place order
                      final order = state.placeFoodOrder(_deliveryMethod, finalDest);
                      foodSummaryMap["Order Reference"] = order.orderReference;
                      foodSummaryMap["Total Cost"] = "\$${order.totalPrice + serviceCharge}";

                      // Success modal
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (context) {
                          return BookingSuccessDialog(
                            title: "Gastronomy Order Placed!",
                            subtitle: "Our kitchen is prepping your gourmet selections.",
                            bookingType: 'food',
                            details: foodSummaryMap,
                             onViewBookings: () {
                               Navigator.of(context).pushAndRemoveUntil(
                                 MaterialPageRoute(builder: (context) => const MainNavigation(initialTab: 0)),
                                 (route) => false,
                               );
                               Navigator.of(context).push(
                                 MaterialPageRoute(builder: (context) => const ProfileScreen()),
                               );
                               Navigator.of(context).push(
                                 MaterialPageRoute(builder: (context) => const BookingsHistoryScreen()),
                               );
                             },
                          );
                        },
                      );
                    },
                    child: Text("Place Culinary Order • \$${total.toStringAsFixed(1)}"),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCartItemCard(CartItem item, AppState state) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        blur: 10,
        radius: 16,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                item.foodItem.imageUrl,
                height: 55,
                width: 55,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 55,
                    width: 55,
                    color: Colors.white.withOpacity(0.05),
                    child: Center(
                      child: Icon(
                        Icons.restaurant_menu_outlined,
                        color: HotelTheme.primaryGold,
                        size: 20,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.foodItem.name,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: HotelTheme.textPrimary),
                  ),
                  if (item.notes != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      item.notes!,
                      style: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontStyle: FontStyle.italic),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    "\$${item.foodItem.price.toInt()} each",
                    style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: Icon(Icons.remove_circle_outline, color: HotelTheme.textSecondary, size: 20),
                  onPressed: () => state.decrementQuantity(item.foodItem),
                ),
                Text(
                  "${item.quantity}",
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: Icon(Icons.add_circle_outline, color: HotelTheme.primaryGold, size: 20),
                  onPressed: () => state.addToCart(item.foodItem),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}