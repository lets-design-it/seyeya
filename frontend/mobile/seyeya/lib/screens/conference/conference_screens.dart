import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../widgets/booking_success_dialog.dart';
import '../../state/app_state.dart';
import '../../models/conference_room.dart';
import '../main_navigation.dart';
import '../profile/profile_screen.dart';
import '../bookings/bookings_history_screen.dart';

// ==========================================
// 1. CONFERENCE LIST SCREEN
// ==========================================
class ConferenceListScreen extends StatefulWidget {
  const ConferenceListScreen({super.key});

  @override
  State<ConferenceListScreen> createState() => _ConferenceListScreenState();
}

class _ConferenceListScreenState extends State<ConferenceListScreen> {
  String _searchQuery = "";
  double _minCapacity = 10.0;
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
    final filteredRooms = state.conferenceRooms.where((room) {
      final matchesCapacity = !_showFilters || room.capacity >= _minCapacity;
      final matchesSearch = room.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                            room.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCapacity && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: filteredRooms.isEmpty
                ? Center(
                    child: Text(
                      "No halls match your criteria.",
                      style: TextStyle(color: HotelTheme.textSecondary),
                    ),
                  )
                : ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 110),
                    itemCount: filteredRooms.length,
                    itemBuilder: (context, index) {
                      final room = filteredRooms[index];
                      return _buildConferenceCard(context, room);
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
                      hintText: "Search conference halls...",
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
                        "Min Capacity: ${_minCapacity.toInt()} Pax",
                        style: TextStyle(fontSize: 12, color: HotelTheme.textSecondary),
                      ),
                      Expanded(
                        child: Slider(
                          value: _minCapacity,
                          min: 10,
                          max: 500,
                          activeColor: HotelTheme.primaryGold,
                          inactiveColor: Colors.white10,
                          onChanged: (val) {
                            setState(() {
                              _minCapacity = val;
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

  Widget _buildConferenceCard(BuildContext context, ConferenceRoom room) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: InteractiveCard(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ConferenceDetailScreen(room: room),
            ),
          );
        },
        child: GlassCard(
          blur: 15,
          radius: 20,
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Image.network(
                  room.imageUrl,
                  height: 170,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 170,
                      width: double.infinity,
                      color: Colors.white.withOpacity(0.05),
                      child: Center(
                        child: Icon(
                          Icons.business_outlined,
                          color: HotelTheme.primaryGold,
                          size: 48,
                        ),
                      ),
                    );
                  },
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
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
                        ),
                        Row(
                          children: [
                            Icon(Icons.star, color: HotelTheme.primaryGold, size: 16),
                            const SizedBox(width: 4),
                            Text("${room.rating}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      room.description,
                      style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.groups_outlined, color: HotelTheme.primaryGold, size: 18),
                            const SizedBox(width: 4),
                            Text("Up to ${room.capacity} Pax", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12)),
                            const SizedBox(width: 16),
                            Icon(Icons.square_foot, color: HotelTheme.primaryGold, size: 18),
                            const SizedBox(width: 4),
                            Text("${room.sizeSqM} m²", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "\$${room.hourlyRate.toInt()}",
                              style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: HotelTheme.primaryGold),
                            ),
                            Text("/ hour", style: TextStyle(color: HotelTheme.textMuted, fontSize: 9)),
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
// 2. CONFERENCE DETAIL & BOOKING SCREEN
// ==========================================
class ConferenceDetailScreen extends StatefulWidget {
  final ConferenceRoom room;

  const ConferenceDetailScreen({super.key, required this.room});

  @override
  State<ConferenceDetailScreen> createState() => _ConferenceDetailScreenState();
}

class _ConferenceDetailScreenState extends State<ConferenceDetailScreen> {
  late String _selectedLayout;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 2));
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0); // 9:00 AM
  int _durationHours = 4;
  final List<String> _selectedAmenities = [];

  @override
  void initState() {
    super.initState();
    _selectedLayout = widget.room.availableLayouts.first;
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 180)),
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
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _startTime,
      builder: (context, child) => Theme(
        data: ThemeData.dark().copyWith(
          timePickerTheme: const TimePickerThemeData(
            hourMinuteTextColor: Colors.white,
            dayPeriodTextColor: Colors.white,
          ),
          colorScheme: ColorScheme.dark(
            primary: HotelTheme.primaryGold,
            surface: HotelTheme.backgroundCards,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _startTime = picked;
      });
    }
  }

  void _toggleAmenity(String amenity) {
    setState(() {
      if (_selectedAmenities.contains(amenity)) {
        _selectedAmenities.remove(amenity);
      } else {
        _selectedAmenities.add(amenity);
      }
    });
  }

  IconData _getLayoutIcon(String layout) {
    switch (layout.toLowerCase()) {
      case "boardroom":
        return Icons.table_restaurant_outlined;
      case "theater":
        return Icons.chair_alt;
      case "banquet":
        return Icons.wine_bar;
      case "classroom":
        return Icons.school_outlined;
      default:
        return Icons.grid_view;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final roomCharge = widget.room.hourlyRate * _durationHours;
    final amenityCharge = _selectedAmenities.length * 15.0 * _durationHours; // $15/hr per extra
    final grandTotal = roomCharge + amenityCharge;

    return Scaffold(
      appBar: AppBar(
        title: const Text("BOOK MEETING SPACE"),
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
                // Info Card
                GlassCard(
                  blur: 10,
                  radius: 16,
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      Image.network(
                        widget.room.imageUrl,
                        height: 160,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 160,
                            width: double.infinity,
                            color: Colors.white.withOpacity(0.05),
                            child: Center(
                              child: Icon(
                                Icons.business_outlined,
                                color: HotelTheme.primaryGold,
                                size: 48,
                              ),
                            ),
                          );
                        },
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.room.name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: HotelTheme.textPrimary)),
                            const SizedBox(height: 6),
                            Text(widget.room.description, style: TextStyle(color: HotelTheme.textSecondary, fontSize: 12, height: 1.4)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Layout Style Selector
                Text("Seating Configuration", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 8),
                Row(
                  children: widget.room.availableLayouts.map((layout) {
                    final isSel = _selectedLayout == layout;
                    return Expanded(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        child: InteractiveCard(
                          onTap: () => setState(() => _selectedLayout = layout),
                          child: GlassCard(
                            blur: 5,
                            radius: 12,
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                            gradient: isSel ? HotelTheme.goldGradient : null,
                            child: Column(
                              children: [
                                Icon(
                                  _getLayoutIcon(layout),
                                  color: isSel ? const Color(0xFF020617) : HotelTheme.primaryGold,
                                  size: 20,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  layout,
                                  style: TextStyle(
                                    color: isSel ? const Color(0xFF020617) : Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
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
                const SizedBox(height: 24),

                // Date & Time pickers
                Text("Schedule Slot", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: InteractiveCard(
                        onTap: () => _selectDate(context),
                        child: GlassCard(
                          blur: 5,
                          radius: 12,
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Select Date", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today, size: 14, color: HotelTheme.primaryGold),
                                  const SizedBox(width: 6),
                                  Text(
                                    "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}",
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
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
                        onTap: () => _selectTime(context),
                        child: GlassCard(
                          blur: 5,
                          radius: 12,
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Starting Time", style: TextStyle(color: HotelTheme.textSecondary, fontSize: 10)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.access_time, size: 14, color: HotelTheme.primaryGold),
                                  const SizedBox(width: 6),
                                  Text(
                                    _startTime.format(context),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
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

                // Duration Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Rental Duration", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                    Text(
                      "$_durationHours hours",
                      style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                Slider(
                  value: _durationHours.toDouble(),
                  min: 1,
                  max: 12,
                  divisions: 11,
                  activeColor: HotelTheme.primaryGold,
                  inactiveColor: Colors.white10,
                  onChanged: (val) {
                    setState(() {
                      _durationHours = val.toInt();
                    });
                  },
                ),
                const SizedBox(height: 20),

                // Add-on Amenities checklist
                Text("Add-on Facilities (+\$15/hr each)", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 10),
                ...widget.room.amenities.map((amenity) {
                  final hasAmenity = _selectedAmenities.contains(amenity);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: InteractiveCard(
                      onTap: () => _toggleAmenity(amenity),
                      child: GlassCard(
                        blur: 5,
                        radius: 12,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        gradient: hasAmenity
                            ? LinearGradient(colors: [HotelTheme.primaryGold.withOpacity(0.1), Colors.white.withOpacity(0.02)])
                            : null,
                        child: Row(
                          children: [
                            Icon(
                              hasAmenity ? Icons.check_box : Icons.check_box_outline_blank,
                              color: hasAmenity ? HotelTheme.primaryGold : HotelTheme.textSecondary,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(amenity, style: TextStyle(fontSize: 13, color: HotelTheme.textPrimary))),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 24),

                // Invoice summary
                Text("Billing Details", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary)),
                const SizedBox(height: 12),
                GlassCard(
                  blur: 10,
                  radius: 16,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Space rent (\$${widget.room.hourlyRate.toInt()} x $_durationHours hrs)", style: TextStyle(color: HotelTheme.textSecondary)),
                          Text("\$${roomCharge.toInt()}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      if (_selectedAmenities.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Amenities fee (${_selectedAmenities.length} x \$15 x $_durationHours hrs)", style: TextStyle(color: HotelTheme.textSecondary)),
                            Text("\$${amenityCharge.toInt()}", style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                      const Divider(color: Colors.white10, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Hall Booking Total", style: TextStyle(color: HotelTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                          Text(
                            "\$${grandTotal.toInt()}",
                            style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 17),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Checkout Button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: GoldButton(
                  onTap: () {
                    // 1. Save Reservation in global state
                    final reservation = state.bookConference(
                      widget.room,
                      _selectedDate,
                      _startTime,
                      _durationHours,
                      _selectedLayout,
                      _selectedAmenities,
                    );

                    // 2. Open Success overlay modal
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) {
                        return BookingSuccessDialog(
                          title: "Venue Reserved!",
                          subtitle: "Your conference hall is booked and confirmed.",
                          bookingType: 'conference',
                          details: {
                            "Hall Name": reservation.conferenceRoom.name,
                            "Reserved Date": "${reservation.date.day}/${reservation.date.month}/${reservation.date.year}",
                            "Start Time": reservation.startTime.format(context),
                            "Duration": "${reservation.durationHours} hours",
                            "Seating Layout": reservation.setupLayout,
                            "Booking Ref": reservation.bookingReference,
                            "Total Charges": "\$${reservation.totalPrice.toInt()}",
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
                  child: Text("Reserve Hall Now • \$${grandTotal.toInt()}"),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}