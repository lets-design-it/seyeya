import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/hotel_theme.dart';
import '../widgets/glass_widgets.dart';
import '../state/app_state.dart';
import 'home/home_screen.dart';
import 'accommodation/accommodation_screens.dart';
import 'restaurant/restaurant_screens.dart';
import 'conference/conference_screens.dart';
import 'profile/profile_screen.dart';

class MainNavigation extends StatefulWidget {
  final int initialTab;
  const MainNavigation({super.key, this.initialTab = 0});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
  }

  // Helper method to change tab externally if needed
  void setTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _showNotificationsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return GlassCard(
          blur: 25,
          radius: 30,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                child: Container(
                  width: 50,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Icon(Icons.notifications, color: HotelTheme.primaryGold),
                  SizedBox(width: 10),
                  Text(
                    "HOTEL NOTIFICATIONS",
                    style: TextStyle(
                      color: HotelTheme.primaryGold,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Colors.white10),
              const SizedBox(height: 8),
              _buildNotificationItem(
                "Exclusive Offer",
                "Enjoy 15% off at the Royal Spa & Wellness Center today with your suite reservation.",
                "10 min ago",
                true,
              ),
              const SizedBox(height: 12),
              _buildNotificationItem(
                "Dining Order Status",
                "Your order has been received by the kitchen and is being custom-crafted by our gourmet chef.",
                "1 hr ago",
                false,
              ),
              _buildNotificationItem(
                "Welcome to Seyeya",
                "We are thrilled to host you at the Seyeya Royal Grand. Let us know if we can enhance your stay.",
                "2 hrs ago",
                false,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
        );
      },
    );
  }

  Widget _buildNotificationItem(String title, String desc, String time, bool isNew) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 6),
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isNew ? HotelTheme.accentOrange : Colors.transparent,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    time,
                    style: TextStyle(color: HotelTheme.textMuted, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                desc,
                style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12, height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    
    final List<Widget> screens = [
      HomeScreen(onNavigateToTab: setTab),
      const RoomsListScreen(),
      const RestaurantMenuScreen(),
      const ConferenceListScreen(),
    ];

    return Container(
      decoration: BoxDecoration(
        gradient: HotelTheme.bgGradient,
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        extendBody: true, // Allows content to flow behind glass bottom navigation bar
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          flexibleSpace: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15.0, sigmaY: 15.0),
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0x1F000000), // Soft dark tint
                  border: Border(
                    bottom: BorderSide(
                      color: Color(0x1AFFFFFF), // Sleek frosted border
                      width: 1.0,
                    ),
                  ),
                ),
              ),
            ),
          ),
          title: Image.asset(
            'assets/images/logo.png',
            height: 62,
            fit: BoxFit.contain,
          ),
          centerTitle: false,
          
          actions: [
            InteractiveCard(
              onTap: () => _showNotificationsBottomSheet(context),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    Icons.notifications_outlined,
                    color: HotelTheme.primaryGold,
                    size: 24,
                  ),
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: HotelTheme.accentOrange,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 8,
                        minHeight: 8,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            InteractiveCard(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              },
              child: Container(
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: HotelTheme.primaryGold, width: 1.2),
                ),
                child: ClipOval(
                  child: Image.network(
                    state.userProfile.profilePicUrl,
                    width: 32,
                    height: 32,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 32,
                        height: 32,
                        color: Colors.white10,
                        child: Icon(Icons.person, color: HotelTheme.primaryGold, size: 16),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          transitionBuilder: (child, animation) {
            return FadeTransition(
              opacity: CurveTween(curve: Curves.easeInOut).animate(animation),
              child: child,
            );
          },
          child: KeyedSubtree(
            key: ValueKey<int>(_currentIndex),
            child: screens[_currentIndex],
          ),
        ),
        bottomNavigationBar: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: GlassCard(
              blur: 20.0,
              radius: 24.0,
              padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Expanded(child: _buildNavItem(0, Icons.home_outlined, Icons.home, "Home")),
                  Expanded(child: _buildNavItem(1, Icons.meeting_room_outlined, Icons.meeting_room, "Rooms")),
                  Expanded(child: _buildNavItem(2, Icons.restaurant_outlined, Icons.restaurant, "Dining", badgeCount: state.cartCount)),
                  Expanded(child: _buildNavItem(3, Icons.business_outlined, Icons.business, "Meetings")),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData outlineIcon, IconData filledIcon, String label, {int badgeCount = 0}) {
    final isSelected = _currentIndex == index;
    final activeColor = HotelTheme.primaryGold;
    final inactiveColor = HotelTheme.textSecondary;

    return InteractiveCard(
      scaleFactor: 0.9,
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withOpacity(0.05) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? filledIcon : outlineIcon,
                  color: isSelected ? activeColor : inactiveColor,
                  size: 24,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: -6,
                    top: -6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: HotelTheme.accentOrange,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        badgeCount > 9 ? '9+' : '$badgeCount',
                        style: TextStyle(
                          color: HotelTheme.textPrimary,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? activeColor : inactiveColor,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}