import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';
import '../../models/room.dart';
import '../../models/food_item.dart';
import '../accommodation/accommodation_screens.dart';
import '../restaurant/restaurant_screens.dart';
import '../profile/profile_screen.dart';
import '../bookings/bookings_history_screen.dart';

class HomeScreen extends StatelessWidget {
  final Function(int) onNavigateToTab;

  const HomeScreen({super.key, required this.onNavigateToTab});

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final featuredRoom = state.rooms.first;
    final recommendedFood = state.menu.where((item) => item.rating >= 4.9).toList();

    return Scaffold(
      backgroundColor: Colors.transparent, // Let Stack background show
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 80.0), // Padding to avoid overlap with navigation bar
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              _buildWelcomeHeader(context, state),

              // Quick Categories Service Grid
              _buildQuickServices(context),

              // Featured Room Banner Card
              _buildFeaturedCard(context, featuredRoom),

              // Culinary Recommendations (Horizontal List)
              _buildFoodRecommendations(context, recommendedFood),

              // Loyalty Club Perks
              _buildLoyaltyClub(context, state),

              // Upcoming Booking Card (Dynamic)
              _buildUpcomingSummary(context, state),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(BuildContext context, AppState state) {
    final isLoggedIn = state.isLoggedIn;
    final String greeting;
    
    final hour = DateTime.now().hour;
    if (hour < 12) {
      greeting = "Good Morning";
    } else if (hour < 17) {
      greeting = "Good Afternoon";
    } else {
      greeting = "Good Evening";
    }

    final String displayName = isLoggedIn ? state.userProfile.name : "Guest";
    final String displaySubtitle = isLoggedIn 
        ? "We are delighted to host you today." 
        : "Experience luxury at its finest.";

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: HotelTheme.primaryGold.withOpacity(0.1),
              border: Border.all(color: HotelTheme.primaryGold.withOpacity(0.2)),
            ),
            child: Icon(
              Icons.person_outline,
              color: HotelTheme.primaryGold,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "$greeting,",
                  style: TextStyle(
                    color: HotelTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  displayName,
                  style: TextStyle(
                    color: HotelTheme.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  displaySubtitle,
                  style: TextStyle(
                    color: HotelTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickServices(BuildContext context) {
    final services = [
      {
        "title": "Stay",
        "desc": "Rooms & Suites",
        "icon": Icons.hotel_outlined,
        "tabIndex": 1,
      },
      {
        "title": "Dining",
        "desc": "Menu & Order",
        "icon": Icons.restaurant_outlined,
        "tabIndex": 2,
      },
      {
        "title": "Business",
        "desc": "Meeting Halls",
        "icon": Icons.business_outlined,
        "tabIndex": 3,
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Explore Services",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: HotelTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: services.map((service) {
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: InteractiveCard(
                    onTap: () => onNavigateToTab(service["tabIndex"] as int),
                    child: GlassCard(
                      blur: 10,
                      radius: 16,
                      padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: HotelTheme.primaryGold.withOpacity(0.1),
                              border: Border.all(color: HotelTheme.primaryGold.withOpacity(0.2)),
                            ),
                            child: Icon(
                              service["icon"] as IconData,
                              color: HotelTheme.primaryGold,
                              size: 24,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            service["title"] as String,
                            style: TextStyle(
                              color: HotelTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            service["desc"] as String,
                            style: TextStyle(
                              color: HotelTheme.textSecondary,
                              fontSize: 10,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedCard(BuildContext context, Room room) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Featured Accommodations",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: HotelTheme.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: () => onNavigateToTab(1),
                child: Row(
                  children: [
                    Text(
                      "See All",
                      style: TextStyle(color: HotelTheme.primaryGold, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    Icon(Icons.chevron_right, color: HotelTheme.primaryGold, size: 16),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InteractiveCard(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => RoomDetailScreen(room: room),
                ),
              );
            },
            child: Container(
              height: 260,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                image: DecorationImage(
                  image: NetworkImage(room.imageUrl),
                  fit: BoxFit.cover,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  )
                ],
              ),
              child: Stack(
                children: [
                  // Gradient shadow overlay
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.8),
                          ],
                        ),
                      ),
                    ),
                  ),
                  
                  // Top badge
                  Positioned(
                    top: 16,
                    left: 16,
                    child: GlassCard(
                      radius: 8,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.star, color: HotelTheme.primaryGold, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            "${room.rating}",
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Bottom content
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                room.name,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: HotelTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.aspect_ratio, color: HotelTheme.textSecondary, size: 14),
                                  const SizedBox(width: 4),
                                  Text(room.size, style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12)),
                                  const SizedBox(width: 12),
                                  Icon(Icons.king_bed_outlined, color: HotelTheme.textSecondary, size: 14),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      room.bedType,
                                      style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "\$${room.pricePerNight.toInt()}",
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: HotelTheme.primaryGold,
                              ),
                            ),
                            Text(
                              "/ night",
                              style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFoodRecommendations(BuildContext context, List<FoodItem> recommendations) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Restaurant Delights",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: HotelTheme.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: () => onNavigateToTab(2),
                child: Row(
                  children: [
                    Text(
                      "View Menu",
                      style: TextStyle(color: HotelTheme.primaryGold, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    Icon(Icons.chevron_right, color: HotelTheme.primaryGold, size: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 190,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            itemCount: recommendations.length,
            itemBuilder: (context, index) {
              final food = recommendations[index];
              return Container(
                width: 150,
                margin: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 8.0),
                child: InteractiveCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => FoodDetailScreen(foodItem: food),
                      ),
                    );
                  },
                  child: GlassCard(
                    blur: 10,
                    radius: 16,
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: Image.network(
                            food.imageUrl,
                            height: 90,
                            width: 150,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                height: 90,
                                width: 150,
                                color: Colors.white.withOpacity(0.05),
                                child: Center(
                                  child: Icon(
                                    Icons.restaurant_menu_outlined,
                                    color: HotelTheme.primaryGold,
                                    size: 24,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                food.name,
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: HotelTheme.textPrimary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Icon(Icons.star, color: HotelTheme.primaryGold, size: 10),
                                  const SizedBox(width: 2),
                                  Text("${food.rating}", style: TextStyle(fontSize: 10, color: HotelTheme.textSecondary)),
                                  const Spacer(),
                                  Text(
                                    "\$${food.price.toInt()}",
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: HotelTheme.primaryGold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLoyaltyClub(BuildContext context, AppState state) {
    if (state.roomReservations.isNotEmpty || state.conferenceReservations.isNotEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: GlassCard(
        blur: 12,
        radius: 18,
        gradient: LinearGradient(
          colors: [
            HotelTheme.primaryGold.withOpacity(0.05),
            Colors.white.withOpacity(0.02),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HotelTheme.primaryGold.withOpacity(0.1),
              ),
              child: Icon(Icons.stars, color: HotelTheme.primaryGold, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Loyalty Club Perks",
                    style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Earn 1,200 points on your next check-in. Explore rooms and start booking today.",
                    style: TextStyle(color: HotelTheme.textSecondary.withOpacity(0.8), fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingSummary(BuildContext context, AppState state) {
    if (state.roomReservations.isEmpty && state.conferenceReservations.isEmpty) {
      return const SizedBox.shrink();
    }

    // Otherwise, show active reservation recap
    final hasRoom = state.roomReservations.isNotEmpty;
    final title = hasRoom ? "Next Stay Room Reservation" : "Next Hall Meeting Booking";
    final ref = hasRoom ? state.roomReservations.last.bookingReference : state.conferenceReservations.last.bookingReference;
    final name = hasRoom ? state.roomReservations.last.room.name : state.conferenceReservations.last.conferenceRoom.name;
    final dateDetail = hasRoom 
      ? "${state.roomReservations.last.checkIn.day}/${state.roomReservations.last.checkIn.month} - ${state.roomReservations.last.checkOut.day}/${state.roomReservations.last.checkOut.month}" 
      : "${state.conferenceReservations.last.date.day}/${state.conferenceReservations.last.date.month} @ ${state.conferenceReservations.last.startTime.format(context)}";

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Your Next Booking",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
          ),
          const SizedBox(height: 12),
          InteractiveCard(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const ProfileScreen()),
              );
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const BookingsHistoryScreen()),
              );
            },
            child: GlassCard(
              blur: 15.0,
              radius: 20.0,
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: HotelTheme.primaryGold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: HotelTheme.primaryGold.withOpacity(0.2)),
                    ),
                    child: Icon(
                      hasRoom ? Icons.room_service : Icons.business,
                      color: HotelTheme.primaryGold,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          name,
                          style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 16),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Date: $dateDetail • Ref: $ref",
                          style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, color: HotelTheme.textSecondary, size: 14),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}