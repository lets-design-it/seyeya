import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';
import '../main_navigation.dart';

class BookingsHistoryScreen extends StatefulWidget {
  const BookingsHistoryScreen({super.key});

  @override
  State<BookingsHistoryScreen> createState() => _BookingsHistoryScreenState();
}

class _BookingsHistoryScreenState extends State<BookingsHistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final canPop = Navigator.canPop(context);

    return Container(
      decoration: canPop ? BoxDecoration(gradient: HotelTheme.bgGradient) : null,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: canPop
            ? AppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                leading: IconButton(
                  icon: Icon(Icons.arrow_back_ios_new_rounded, color: HotelTheme.primaryGold, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                title: Text(
                  "MY BOOKINGS",
                  style: TextStyle(
                    color: HotelTheme.primaryGold,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    fontSize: 16,
                  ),
                ),
              )
            : null,
        body: Column(
          children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 8.0, bottom: 8.0),
            child: GlassCard(
              blur: 10,
              radius: 16,
              padding: EdgeInsets.zero,
              child: TabBar(
                controller: _tabController,
                indicatorColor: HotelTheme.primaryGold,
                labelColor: HotelTheme.primaryGold,
                unselectedLabelColor: HotelTheme.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                tabs: const [
                  Tab(text: "STAYS", icon: Icon(Icons.hotel_outlined, size: 20)),
                  Tab(text: "DINING", icon: Icon(Icons.restaurant_outlined, size: 20)),
                  Tab(text: "CONFERENCES", icon: Icon(Icons.business_outlined, size: 20)),
                ],
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              physics: const BouncingScrollPhysics(),
              children: [
                _buildStaysTab(context, state),
                _buildDiningTab(context, state),
                _buildConferencesTab(context, state),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

  // ==========================================
  // STAYS TAB
  // ==========================================
  Widget _buildStaysTab(BuildContext context, AppState state) {
    if (state.roomReservations.isEmpty) {
      return _buildEmptyState(
        context,
        Icons.hotel_outlined,
        "No Active Room Reservations",
        "Experience ultimate five-star comfort. Browse our luxury suites and schedule your checkout details today.",
        "Browse Suites",
        1,
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 110),
      itemCount: state.roomReservations.length,
      itemBuilder: (context, index) {
        final res = state.roomReservations[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassCard(
            blur: 10,
            radius: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      res.room.name,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: HotelTheme.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: HotelTheme.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: HotelTheme.success.withOpacity(0.3)),
                      ),
                      child: Text(
                        "RESERVED",
                        style: TextStyle(color: HotelTheme.success, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        res.room.imageUrl,
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 70,
                            height: 70,
                            color: Colors.white.withOpacity(0.05),
                            child: Center(
                              child: Icon(
                                Icons.hotel_outlined,
                                color: HotelTheme.primaryGold,
                                size: 24,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailRow(Icons.calendar_today_outlined, "Check-In: ${res.checkIn.day}/${res.checkIn.month}/${res.checkIn.year}"),
                          const SizedBox(height: 6),
                          _buildDetailRow(Icons.calendar_today_outlined, "Check-Out: ${res.checkOut.day}/${res.checkOut.month}/${res.checkOut.year}"),
                          const SizedBox(height: 6),
                          _buildDetailRow(Icons.people_outline, "Guests: ${res.guests} Pax"),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("REF: ${res.bookingReference}", style: TextStyle(color: HotelTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                        Text("Paid with Card", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "\$${res.totalPrice.toStringAsFixed(1)}",
                          style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        Text("Total Charge", style: TextStyle(color: HotelTheme.textMuted, fontSize: 9)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // DINING TAB
  // ==========================================
  Widget _buildDiningTab(BuildContext context, AppState state) {
    if (state.foodOrders.isEmpty) {
      return _buildEmptyState(
        context,
        Icons.restaurant_outlined,
        "No Dining Orders Yet",
        "Craving fine culinary delicacies? Check out our gourmet kitchen selections and order directly to your suite.",
        "Open Restaurant Menu",
        2,
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 110),
      itemCount: state.foodOrders.length,
      itemBuilder: (context, index) {
        final order = state.foodOrders[index];
        final isDelivered = order.status == "Delivered";

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassCard(
            blur: 10,
            radius: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Delivery type: ${order.deliveryMethod}",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: HotelTheme.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDelivered ? HotelTheme.success.withOpacity(0.15) : HotelTheme.primaryGold.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: isDelivered ? HotelTheme.success.withOpacity(0.3) : HotelTheme.primaryGold.withOpacity(0.3)),
                      ),
                      child: Text(
                        order.status.toUpperCase(),
                        style: TextStyle(
                          color: isDelivered ? HotelTheme.success : HotelTheme.primaryGold,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 20),
                ...order.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            "${item.quantity}x  ${item.foodItem.name}",
                            style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                          ),
                        ),
                        Text(
                          "\$${item.totalPrice.toInt()}",
                          style: TextStyle(color: HotelTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  );
                }),
                const Divider(color: Colors.white10, height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ORDER REF: ${order.orderReference}", style: TextStyle(color: HotelTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                        Text("Destination: ${order.destinationDetail}", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "\$${(order.totalPrice + 5.0).toStringAsFixed(1)}",
                          style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text("Total (inc. svc)", style: TextStyle(color: HotelTheme.textMuted, fontSize: 9)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // CONFERENCES TAB
  // ==========================================
  Widget _buildConferencesTab(BuildContext context, AppState state) {
    if (state.conferenceReservations.isEmpty) {
      return _buildEmptyState(
        context,
        Icons.business_outlined,
        "No Conference Hall Bookings",
        "Organizing a keynote seminar or corporate retreat? Reserve our acoustics-optimized boardrooms now.",
        "Browse Halls",
        3,
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 110),
      itemCount: state.conferenceReservations.length,
      itemBuilder: (context, index) {
        final res = state.conferenceReservations[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: GlassCard(
            blur: 10,
            radius: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      res.conferenceRoom.name,
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: HotelTheme.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: HotelTheme.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: HotelTheme.success.withOpacity(0.3)),
                      ),
                      child: Text(
                        "CONFIRMED",
                        style: TextStyle(color: HotelTheme.success, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        res.conferenceRoom.imageUrl,
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 70,
                            height: 70,
                            color: Colors.white.withOpacity(0.05),
                            child: Center(
                              child: Icon(
                                Icons.business_outlined,
                                color: HotelTheme.primaryGold,
                                size: 24,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailRow(Icons.calendar_today_outlined, "Date: ${res.date.day}/${res.date.month}/${res.date.year}"),
                          const SizedBox(height: 5),
                          _buildDetailRow(Icons.access_time, "Start: ${res.startTime.format(context)}"),
                          const SizedBox(height: 5),
                          _buildDetailRow(Icons.timer_outlined, "Duration: ${res.durationHours} Hours"),
                          const SizedBox(height: 5),
                          _buildDetailRow(Icons.chair_alt, "Seating Setup: ${res.setupLayout}"),
                        ],
                      ),
                    ),
                  ],
                ),
                if (res.selectedAmenities.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    "Extras: ${res.selectedAmenities.join(', ')}",
                    style: TextStyle(color: HotelTheme.primaryGold, fontSize: 11, fontStyle: FontStyle.italic),
                  ),
                ],
                const Divider(color: Colors.white10, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("BOOKING REF: ${res.bookingReference}", style: TextStyle(color: HotelTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                        Text("Paid with Corporate Card", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "\$${res.totalPrice.toInt()}",
                          style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        Text("Total Charge", style: TextStyle(color: HotelTheme.textMuted, fontSize: 9)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // UTILITY BUILDERS
  // ==========================================
  Widget _buildDetailRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: HotelTheme.primaryGold, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(
    BuildContext context,
    IconData icon,
    String title,
    String description,
    String buttonText,
    int redirectTab,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.02),
              border: Border.all(color: Colors.white.withOpacity(0.04)),
            ),
            child: Icon(icon, size: 48, color: HotelTheme.textMuted),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(fontSize: 13, color: HotelTheme.textSecondary, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          GoldButton(
            width: 200,
            onTap: () {
              // Redirect to navigation bar tab
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => MainNavigation(initialTab: redirectTab)),
                (route) => false,
              );
            },
            child: Text(buttonText),
          ),
        ],
      ),
    );
  }
}