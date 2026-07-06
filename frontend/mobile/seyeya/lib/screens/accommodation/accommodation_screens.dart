import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../widgets/booking_success_dialog.dart';
import '../../state/app_state.dart';
import '../../models/room.dart';
import '../main_navigation.dart';
import '../profile/profile_screen.dart';
import '../bookings/bookings_history_screen.dart';

// ==========================================
// 1. ROOMS LIST SCREEN
// ==========================================
class RoomsListScreen extends StatefulWidget {
  const RoomsListScreen({super.key});

  @override
  State<RoomsListScreen> createState() => _RoomsListScreenState();
}

class _RoomsListScreenState extends State<RoomsListScreen> {
  double _maxPrice = 1300.0;
  String _searchQuery = "";
  bool _showFilters = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);

    // Filtering logic
    final filteredRooms = state.rooms.where((room) {
      final matchesPrice = !_showFilters || room.pricePerNight <= _maxPrice;
      final matchesSearch = room.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                            room.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesPrice && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          // Filter section
          _buildFilterBar(),
          
          // List View
          Expanded(
            child: filteredRooms.isEmpty
                ? Center(
                    child: Text(
                      "No suites match your filters.",
                      style: TextStyle(color: HotelTheme.textSecondary),
                    ),
                  )
                : ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 110),
                    itemCount: filteredRooms.length,
                    itemBuilder: (context, index) {
                      final room = filteredRooms[index];
                      return _buildRoomCard(room);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: GlassCard(
        blur: 10,
        radius: 16,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
                      hintText: "Search room tiers...",
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
            AnimatedCrossFade(
              firstChild: Column(
                children: [
                  const Divider(color: Colors.white10, height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Max Price: \$${_maxPrice.toInt()}",
                        style: TextStyle(fontSize: 12, color: HotelTheme.textSecondary),
                      ),
                      Expanded(
                        child: Slider(
                          value: _maxPrice,
                          min: 200,
                          max: 1300,
                          activeColor: HotelTheme.primaryGold,
                          inactiveColor: Colors.white10,
                          onChanged: (val) {
                            setState(() {
                              _maxPrice = val;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              secondChild: const SizedBox.shrink(),
              crossFadeState: _showFilters ? CrossFadeState.showFirst : CrossFadeState.showSecond,
              duration: const Duration(milliseconds: 250),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomCard(Room room) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: InteractiveCard(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => RoomDetailScreen(room: room),
            ),
          );
        },
        child: GlassCard(
          blur: 15.0,
          radius: 20.0,
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Hero(
                tag: "room_img_${room.id}",
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: Image.network(
                    room.imageUrl,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 180,
                        width: double.infinity,
                        color: Colors.white.withOpacity(0.05),
                        child: Center(
                          child: Icon(
                            Icons.hotel_outlined,
                            color: HotelTheme.primaryGold,
                            size: 48,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          room.name,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                        ),
                        Row(
                          children: [
                            Icon(Icons.star, color: HotelTheme.primaryGold, size: 16),
                            const SizedBox(width: 4),
                            Text("${room.rating}", style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      room.description,
                      style: TextStyle(color: HotelTheme.textSecondary, fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.people_outline, color: HotelTheme.primaryGold, size: 16),
                            const SizedBox(width: 4),
                            Text("${room.capacity} Guests", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12)),
                            const SizedBox(width: 16),
                            Icon(Icons.aspect_ratio, color: HotelTheme.primaryGold, size: 16),
                            const SizedBox(width: 4),
                            Text(room.size, style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "\$${room.pricePerNight.toInt()}",
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HotelTheme.primaryGold),
                            ),
                            Text("/ night", style: TextStyle(color: HotelTheme.textMuted, fontSize: 10)),
                          ],
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
  }
}

// ==========================================
// 2. ROOM DETAIL SCREEN
// ==========================================
class RoomDetailScreen extends StatelessWidget {
  final Room room;

  const RoomDetailScreen({super.key, required this.room});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background layout
          Container(decoration: BoxDecoration(gradient: HotelTheme.bgGradient)),
          
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                stretch: true,
                backgroundColor: HotelTheme.backgroundDark,
                leading: IconButton(
                  icon: Icon(Icons.arrow_back, color: HotelTheme.textPrimary),
                  onPressed: () => Navigator.pop(context),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [StretchMode.zoomBackground],
                  background: Hero(
                    tag: "room_img_${room.id}",
                    child: Image.network(
                      room.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.white.withOpacity(0.05),
                          child: Center(
                            child: Icon(
                              Icons.hotel_outlined,
                              color: HotelTheme.primaryGold,
                              size: 60,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 120),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Room title and pricing header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                room.name,
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Row(
                                    children: List.generate(5, (index) {
                                      return Icon(
                                        index < room.rating.floor() ? Icons.star : Icons.star_border,
                                        color: HotelTheme.primaryGold,
                                        size: 16,
                                      );
                                    }),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    "${room.rating} (${room.reviewsCount} reviews)",
                                    style: TextStyle(color: HotelTheme.textSecondary, fontSize: 13),
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
                              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: HotelTheme.primaryGold),
                            ),
                            Text("/ night", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11)),
                          ],
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 32),
                    
                    // Room Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem(Icons.people_outline, "Max Guests", "${room.capacity} Person"),
                        _buildStatItem(Icons.aspect_ratio, "Room Size", room.size),
                        _buildStatItem(Icons.king_bed_outlined, "Bed Config", room.bedType),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 32),
                    
                    // Description
                    Text(
                      "Description",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      room.description,
                      style: TextStyle(color: HotelTheme.textSecondary, height: 1.5, fontSize: 14),
                    ),
                    const SizedBox(height: 24),
                    
                    // Amenities
                    Text(
                      "Suite Amenities",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: room.amenities.map((amenity) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.04),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white.withOpacity(0.05)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_circle_outline, color: HotelTheme.primaryGold, size: 14),
                              const SizedBox(width: 6),
                              Text(amenity, style: TextStyle(color: HotelTheme.textPrimary, fontSize: 12)),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ]),
                ),
              ),
            ],
          ),
          
          // Bottom Booking Panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: GlassCard(
                  blur: 20,
                  radius: 20,
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text("Est. Total", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11)),
                          Text(
                            "\$${room.pricePerNight.toInt()}",
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                          ),
                          Text("Per night", style: TextStyle(color: HotelTheme.textMuted, fontSize: 10)),
                        ],
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: GoldButton(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RoomBookingScreen(room: room),
                              ),
                            );
                          },
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text("Book Suite Now"),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String title, String subtitle) {
    return Column(
      children: [
        Icon(icon, color: HotelTheme.primaryGold, size: 24),
        const SizedBox(height: 6),
        Text(title, style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10)),
        const SizedBox(height: 2),
        Text(subtitle, style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
      ],
    );
  }
}

// ==========================================
// 3. ROOM BOOKING SCREEN
// ==========================================
class RoomBookingScreen extends StatefulWidget {
  final Room room;

  const RoomBookingScreen({super.key, required this.room});

  @override
  State<RoomBookingScreen> createState() => _RoomBookingScreenState();
}

class _RoomBookingScreenState extends State<RoomBookingScreen> {
  DateTime _checkInDate = DateTime.now().add(const Duration(days: 1));
  DateTime _checkOutDate = DateTime.now().add(const Duration(days: 3));
  int _guests = 2;

  Future<void> _selectCheckIn(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _checkInDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.dark(
            primary: HotelTheme.primaryGold,
            surface: HotelTheme.backgroundCards,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null && picked != _checkInDate) {
      setState(() {
        _checkInDate = picked;
        if (_checkOutDate.isBefore(_checkInDate) || _checkOutDate.isAtSameMomentAs(_checkInDate)) {
          _checkOutDate = _checkInDate.add(const Duration(days: 1));
        }
      });
    }
  }

  Future<void> _selectCheckOut(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _checkOutDate,
      firstDate: _checkInDate.add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.dark(
            primary: HotelTheme.primaryGold,
            surface: HotelTheme.backgroundCards,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null && picked != _checkOutDate) {
      setState(() {
        _checkOutDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final totalDays = _checkOutDate.difference(_checkInDate).inDays;
    final finalDays = totalDays <= 0 ? 1 : totalDays;
    final basePrice = widget.room.pricePerNight * finalDays;
    final taxCharge = basePrice * 0.12;
    final serviceCharge = 25.0;
    final grandTotal = basePrice + taxCharge + serviceCharge;

    return Scaffold(
      appBar: AppBar(
        title: const Text("RESERVATION CHECKOUT"),
      ),
      body: Stack(
        children: [
          Container(decoration: BoxDecoration(gradient: HotelTheme.bgGradient)),
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Summary Card
                GlassCard(
                  blur: 10,
                  radius: 16,
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          widget.room.imageUrl,
                          height: 70,
                          width: 90,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 70,
                              width: 90,
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
                            Text(
                              widget.room.name,
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: HotelTheme.textPrimary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Est. \$${widget.room.pricePerNight.toInt()}/night",
                              style: TextStyle(color: HotelTheme.primaryGold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Booking Dates
                Text("Select Dates", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InteractiveCard(
                        onTap: () => _selectCheckIn(context),
                        child: GlassCard(
                          blur: 5,
                          radius: 14,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Check-In", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today, size: 14, color: HotelTheme.primaryGold),
                                  const SizedBox(width: 6),
                                  Text(
                                    "${_checkInDate.day}/${_checkInDate.month}/${_checkInDate.year}",
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InteractiveCard(
                        onTap: () => _selectCheckOut(context),
                        child: GlassCard(
                          blur: 5,
                          radius: 14,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Check-Out", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 11)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today, size: 14, color: HotelTheme.primaryGold),
                                  const SizedBox(width: 6),
                                  Text(
                                    "${_checkOutDate.day}/${_checkOutDate.month}/${_checkOutDate.year}",
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Guest Counter
                Text("Guests Setup", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 12),
                GlassCard(
                  blur: 10,
                  radius: 14,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Number of Guests",
                        style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: Icon(Icons.remove_circle_outline, color: HotelTheme.textSecondary),
                            onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                          ),
                          Text(
                            "$_guests",
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: Icon(Icons.add_circle_outline, color: HotelTheme.primaryGold),
                            onPressed: _guests < widget.room.capacity ? () => setState(() => _guests++) : null,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Bill Invoice Breakdown
                Text("Bill Summary", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 12),
                GlassCard(
                  blur: 10,
                  radius: 16,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "\$${widget.room.pricePerNight.toInt()} x $finalDays nights",
                            style: TextStyle(color: HotelTheme.textSecondary),
                          ),
                          Text("\$${basePrice.toInt()}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Local Hotel Taxes (12%)", style: TextStyle(color: HotelTheme.textSecondary)),
                          Text("\$${taxCharge.toStringAsFixed(1)}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Facility & Service Charge", style: TextStyle(color: HotelTheme.textSecondary)),
                          Text("\$25.0", style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Divider(color: Colors.white10, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Grand Total",
                            style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            "\$${grandTotal.toStringAsFixed(1)}",
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

          // Bottom Trigger Button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: GoldButton(
                  onTap: () {
                    // 1. Commit booking in AppState
                    final reservation = state.bookRoom(widget.room, _checkInDate, _checkOutDate, _guests);

                    // 2. Open Success overlay modal
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) {
                        return BookingSuccessDialog(
                          title: "Booking Success!",
                          subtitle: "Your stay has been successfully reserved.",
                          bookingType: 'room',
                          details: {
                            "Room Tier": reservation.room.name,
                            "Check-In": "${reservation.checkIn.day}/${reservation.checkIn.month}/${reservation.checkIn.year}",
                            "Check-Out": "${reservation.checkOut.day}/${reservation.checkOut.month}/${reservation.checkOut.year}",
                            "Guests": "${reservation.guests} pax",
                            "Booking Ref": reservation.bookingReference,
                            "Total Charged": "\$${reservation.totalPrice.toStringAsFixed(1)}",
                          },
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
                  child: Text("Confirm & Pay \$${grandTotal.toStringAsFixed(1)}"),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}