import 'dart:math';
import 'package:flutter/material.dart';
import '../models/room.dart';
import '../models/food_item.dart';
import '../models/conference_room.dart';

class UserProfile {
  String name;
  String email;
  String phone;
  String profilePicUrl;

  UserProfile({
    required this.name,
    required this.email,
    required this.phone,
    required this.profilePicUrl,
  });
}

class PaymentCard {
  final String id;
  final String cardholderName;
  final String cardNumber;
  final String expiryDate;
  final String cardType;

  PaymentCard({
    required this.id,
    required this.cardholderName,
    required this.cardNumber,
    required this.expiryDate,
    required this.cardType,
  });
}

class AppState extends ChangeNotifier {
  // Auth and Profile
  bool _isLoggedIn = true;
  bool get isLoggedIn => _isLoggedIn;

  UserProfile userProfile = UserProfile(
    name: "Alexandra Sterling",
    email: "alexandra.sterling@royalgrand.com",
    phone: "+1 (555) 019-2834",
    profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  );

  final List<PaymentCard> paymentCards = [
    PaymentCard(
      id: "card_1",
      cardholderName: "Alexandra Sterling",
      cardNumber: "**** **** **** 8842",
      expiryDate: "12/28",
      cardType: "Visa Premium",
    ),
  ];

  // Settings preferences
  bool pushNotificationsEnabled = true;
  bool emailOffersEnabled = false;
  bool biometricLoginEnabled = true;
  String appLanguage = "English (US)";
  bool _isDarkMode = false; // Default is light mode (false)
  bool get isDarkMode => _isDarkMode;

  void toggleTheme(bool val) {
    _isDarkMode = val;
    notifyListeners();
  }

  void login(String email, String password) {
    _isLoggedIn = true;
    notifyListeners();
  }

  void register(String name, String email, String phone, String password) {
    userProfile = UserProfile(
      name: name,
      email: email,
      phone: phone,
      profilePicUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    );
    _isLoggedIn = true;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    notifyListeners();
  }

  void updateProfile({String? name, String? email, String? phone, String? profilePicUrl}) {
    if (name != null) userProfile.name = name;
    if (email != null) userProfile.email = email;
    if (phone != null) userProfile.phone = phone;
    if (profilePicUrl != null) userProfile.profilePicUrl = profilePicUrl;
    notifyListeners();
  }

  void togglePushNotifications(bool val) {
    pushNotificationsEnabled = val;
    notifyListeners();
  }

  void toggleEmailOffers(bool val) {
    emailOffersEnabled = val;
    notifyListeners();
  }

  void toggleBiometricLogin(bool val) {
    biometricLoginEnabled = val;
    notifyListeners();
  }

  void updateLanguage(String lang) {
    appLanguage = lang;
    notifyListeners();
  }

  void addPaymentCard(PaymentCard card) {

    paymentCards.add(card);
    notifyListeners();
  }

  void removePaymentCard(String id) {
    paymentCards.removeWhere((card) => card.id == id);
    notifyListeners();
  }
  // Lists of mock data
  final List<Room> rooms = Room.mockRooms;
  final List<FoodItem> menu = FoodItem.mockMenu;
  final List<ConferenceRoom> conferenceRooms = ConferenceRoom.mockConferenceRooms;

  // Active bookings and orders
  final List<RoomReservation> roomReservations = [];
  final List<FoodOrder> foodOrders = [];
  final List<ConferenceReservation> conferenceReservations = [];

  // Cart Management
  final List<CartItem> cart = [];

  double get cartTotal {
    return cart.fold(0.0, (sum, item) => sum + item.totalPrice);
  }

  int get cartCount {
    return cart.fold(0, (sum, item) => sum + item.quantity);
  }

  void addToCart(FoodItem foodItem, {int quantity = 1, String? notes}) {
    final existingIndex = cart.indexWhere((item) => item.foodItem.id == foodItem.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
      if (notes != null) {
        cart[existingIndex].notes = notes;
      }
    } else {
      cart.add(CartItem(foodItem: foodItem, quantity: quantity, notes: notes));
    }
    notifyListeners();
  }

  void removeFromCart(FoodItem foodItem) {
    cart.removeWhere((item) => item.foodItem.id == foodItem.id);
    notifyListeners();
  }

  void decrementQuantity(FoodItem foodItem) {
    final index = cart.indexWhere((item) => item.foodItem.id == foodItem.id);
    if (index >= 0) {
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
      } else {
        cart.removeAt(index);
      }
      notifyListeners();
    }
  }

  void clearCart() {
    cart.clear();
    notifyListeners();
  }

  // Room Booking Actions
  RoomReservation bookRoom(Room room, DateTime checkIn, DateTime checkOut, int guests) {
    final totalNights = checkOut.difference(checkIn).inDays;
    final finalNights = totalNights <= 0 ? 1 : totalNights;
    final totalPrice = room.pricePerNight * finalNights;
    final bookingRef = "ROOM-${_generateRandomRef()}";

    final reservation = RoomReservation(
      id: "res_${DateTime.now().millisecondsSinceEpoch}",
      room: room,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: guests,
      totalPrice: totalPrice,
      bookingReference: bookingRef,
    );

    roomReservations.add(reservation);
    notifyListeners();
    return reservation;
  }

  // Food Order Actions
  FoodOrder placeFoodOrder(String deliveryMethod, String destinationDetail) {
    final orderRef = "FOOD-${_generateRandomRef()}";
    
    final order = FoodOrder(
      id: "order_${DateTime.now().millisecondsSinceEpoch}",
      items: List.from(cart),
      orderTime: DateTime.now(),
      deliveryMethod: deliveryMethod,
      destinationDetail: destinationDetail,
      totalPrice: cartTotal,
      orderReference: orderRef,
      status: "Preparing",
    );

    foodOrders.add(order);
    clearCart(); // Auto clear cart on success
    
    // Simulate order progress
    _simulateOrderStatusUpdate(order);
    
    return order;
  }

  // Conference Booking Actions
  ConferenceReservation bookConference(
    ConferenceRoom room,
    DateTime date,
    TimeOfDay startTime,
    int durationHours,
    String setupLayout,
    List<String> selectedAmenities,
  ) {
    // Add extra pricing for amenities (e.g., $15/hr per selected extra)
    final amenityCharge = selectedAmenities.length * 15.0 * durationHours;
    final roomCharge = room.hourlyRate * durationHours;
    final totalPrice = roomCharge + amenityCharge;
    
    final bookingRef = "CONF-${_generateRandomRef()}";

    final reservation = ConferenceReservation(
      id: "conf_res_${DateTime.now().millisecondsSinceEpoch}",
      conferenceRoom: room,
      date: date,
      startTime: startTime,
      durationHours: durationHours,
      setupLayout: setupLayout,
      selectedAmenities: selectedAmenities,
      totalPrice: totalPrice,
      bookingReference: bookingRef,
    );

    conferenceReservations.add(reservation);
    notifyListeners();
    return reservation;
  }

  // Helper code generators
  String _generateRandomRef() {
    final random = Random();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return List.generate(6, (index) => chars[random.nextInt(chars.length)]).join();
  }

  // Simulate order status transition over time
  void _simulateOrderStatusUpdate(FoodOrder order) {
    Future.delayed(const Duration(minutes: 2), () {
      order.status = "Out for Delivery";
      notifyListeners();
      
      Future.delayed(const Duration(minutes: 3), () {
        order.status = "Delivered";
        notifyListeners();
      });
    });
  }
}

class AppStateProvider extends InheritedNotifier<AppState> {
  const AppStateProvider({
    super.key,
    required AppState super.notifier,
    required super.child,
  });

  static AppState of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<AppStateProvider>();
    assert(provider != null, "No AppStateProvider found in context");
    return provider!.notifier!;
  }
}
