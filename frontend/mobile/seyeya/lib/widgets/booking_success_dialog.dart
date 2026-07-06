import 'package:flutter/material.dart';
import '../theme/hotel_theme.dart';
import 'glass_widgets.dart';

class BookingSuccessDialog extends StatefulWidget {
  final String title;
  final String subtitle;
  final String bookingType; // 'room', 'food', 'conference'
  final Map<String, String> details;
  final VoidCallback onViewBookings;

  const BookingSuccessDialog({
    super.key,
    required this.title,
    required this.subtitle,
    required this.bookingType,
    required this.details,
    required this.onViewBookings,
  });

  @override
  State<BookingSuccessDialog> createState() => _BookingSuccessDialogState();
}

class _BookingSuccessDialogState extends State<BookingSuccessDialog> with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    );

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );

    _scaleController.forward().then((_) {
      _fadeController.forward();
    });
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  IconData _getTypeIcon() {
    switch (widget.bookingType) {
      case 'room':
        return Icons.meeting_room_outlined;
      case 'food':
        return Icons.restaurant_outlined;
      case 'conference':
        return Icons.business_outlined;
      default:
        return Icons.check_circle_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: GlassCard(
        blur: 25.0,
        radius: 24.0,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Animated Checkmark Header
              ScaleTransition(
                scale: _scaleAnimation,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: HotelTheme.goldGradient,
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 44,
                    color: Color(0xFF020617),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Success Title
              Text(
                widget.title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: HotelTheme.primaryGold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                widget.subtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: HotelTheme.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // Fading Ticket Details
              FadeTransition(
                opacity: _fadeAnimation,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(_getTypeIcon(), color: HotelTheme.primaryGold, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            widget.bookingType.toUpperCase(),
                            style: TextStyle(
                              color: HotelTheme.primaryGold,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            "CONFIRMED",
                            style: TextStyle(
                              color: HotelTheme.success,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const Divider(color: Colors.white10, height: 24),
                      ...widget.details.entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                entry.key,
                                style: TextStyle(color: HotelTheme.textSecondary, fontSize: 13),
                              ),
                              Text(
                                entry.value,
                                style: TextStyle(
                                  color: HotelTheme.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              
              // Buttons
              GoldButton(
                onTap: () {
                  Navigator.of(context).pop(); // Close dialog
                  widget.onViewBookings();
                },
                child: const Text("View in Bookings"),
              ),
              const SizedBox(height: 12),
              GlassButton(
                height: 44,
                onTap: () {
                  Navigator.of(context).pop();
                },
                child: Text(
                  "Close",
                  style: TextStyle(color: HotelTheme.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}