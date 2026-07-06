import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: HotelTheme.bgGradient,
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: HotelTheme.primaryGold, size: 20),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(
            "TERMS & CONDITIONS",
            style: TextStyle(
              color: HotelTheme.primaryGold,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              fontSize: 16,
            ),
          ),
        ),
        body: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            GlassCard(
              blur: 15,
              radius: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Guest Agreement & Hotel Policies",
                    style: TextStyle(
                      color: HotelTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Last updated: June 2026",
                    style: TextStyle(
                      color: HotelTheme.textMuted,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 16),
                  
                  _buildSectionTitle("1. Agreement to Terms"),
                  _buildSectionBody(
                    "By accessing this mobile application and booking accommodations, dining experiences, or conference halls with the Seyeya Royal Grand, you express full agreement to be bound by these Terms and Conditions and all applicable laws and regulations."
                  ),
                  
                  _buildSectionTitle("2. Stays and Reservations"),
                  _buildSectionBody(
                    "Rooms are reserved subject to availability. Standard check-in time is 2:00 PM, and check-out time is 11:00 AM local time. Requests for early check-in or late checkout are subject to hotel availability and may incur additional suite usage charges."
                  ),

                  _buildSectionTitle("3. Cancellations & Refunds"),
                  _buildSectionBody(
                    "Reservations can be modified or cancelled free of charge up to 48 hours prior to the scheduled check-in time. Cancellations made within 48 hours of check-in will incur a charge equal to the first night's room rate plus applicable service fees."
                  ),

                  _buildSectionTitle("4. Gourmet Dining & Kitchen Orders"),
                  _buildSectionBody(
                    "Room service food and beverage orders are final once custom chef preparation has commenced. The estimated delivery time is an approximation and is subject to dining hall capacity. A standard 10% service and delivery charge applies to all room service requests."
                  ),

                  _buildSectionTitle("5. Conference Halls & Corporate Events"),
                  _buildSectionBody(
                    "Conference hall bookings require a non-refundable holding deposit of 30% if cancelled within 7 days of the scheduled event. Use of specialized audiovisual amenities or custom seating setups must be requested at least 48 hours in advance to guarantee setup validation."
                  ),

                  _buildSectionTitle("6. Conduct & Damage Liability"),
                  _buildSectionBody(
                    "Guests are expected to behave in an orderly and premium manner. The hotel reserves the right to terminate room agreements or restaurant access for any disorderly behavior. The registered guest assumes full financial responsibility for any damages to room furniture, walls, or digital keys during their stay."
                  ),

                  _buildSectionTitle("7. Privacy & Security Policies"),
                  _buildSectionBody(
                    "We respect guest confidentiality. All profile details, saved checkout credit card details, and booking logs are stored securely using industry-standard client encryption. Credit card data is masked and never processed or stored in raw text format on unsecured servers."
                  ),
                  
                  const SizedBox(height: 12),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      "Thank you for choosing Seyeya Royal Grand.",
                      style: TextStyle(
                        color: HotelTheme.primaryGold,
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 18.0, bottom: 8.0),
      child: Text(
        title,
        style: TextStyle(
          color: HotelTheme.primaryGold,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildSectionBody(String body) {
    return Text(
      body,
      style: TextStyle(
        color: HotelTheme.textSecondary,
        fontSize: 12,
        height: 1.5,
      ),
    );
  }
}