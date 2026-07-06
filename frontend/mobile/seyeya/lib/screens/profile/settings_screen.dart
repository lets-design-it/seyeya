import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  void _showLanguageSelector(BuildContext context, AppState state) {
    final languages = ["English (US)", "French (FR)", "German (DE)", "Spanish (ES)", "Swahili (KE)"];
    
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: GlassCard(
            blur: 20,
            radius: 24,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Select Language",
                  style: TextStyle(color: HotelTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                const Divider(color: Colors.white10),
                ...languages.map((lang) {
                  final isSelected = state.appLanguage == lang;
                  return InkWell(
                    onTap: () {
                      state.updateLanguage(lang);
                      Navigator.of(context).pop();
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            lang,
                            style: TextStyle(
                              color: isSelected ? HotelTheme.primaryGold : HotelTheme.textPrimary,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: 14,
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check, color: HotelTheme.primaryGold, size: 18),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);

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
            "SETTINGS",
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
            // Notifications section
            _buildSectionHeader("NOTIFICATIONS"),
            GlassCard(
              blur: 10,
              radius: 20,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSwitchTile(
                    title: "Push Notifications",
                    subtitle: "Receive suite updates, food status & gate alerts",
                    value: state.pushNotificationsEnabled,
                    onChanged: state.togglePushNotifications,
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildSwitchTile(
                    title: "Email Offers",
                    subtitle: "Receive exclusive luxury suite spa & dining promo discounts",
                    value: state.emailOffersEnabled,
                    onChanged: state.toggleEmailOffers,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Security Section
            _buildSectionHeader("SECURITY & ACCESS"),
            GlassCard(
              blur: 10,
              radius: 20,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSwitchTile(
                    title: "Biometric Login",
                    subtitle: "Unlock app and bookings using FaceID/Fingerprint",
                    value: state.biometricLoginEnabled,
                    onChanged: state.toggleBiometricLogin,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Appearance & System Section
            _buildSectionHeader("PREFERENCES"),
            GlassCard(
              blur: 10,
              radius: 20,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSwitchTile(
                    title: "Dark Mode",
                    subtitle: "Toggle between light and dark royal themes",
                    value: state.isDarkMode,
                    onChanged: state.toggleTheme,
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildInteractiveTile(
                    title: "App Language",
                    subtitle: "Language used across bookings & notifications",
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          state.appLanguage,
                          style: TextStyle(color: HotelTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios_rounded, color: HotelTheme.textMuted, size: 12),
                      ],
                    ),
                    onTap: () => _showLanguageSelector(context, state),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0, bottom: 8.0),
      child: Text(
        title,
        style: TextStyle(
          color: HotelTheme.primaryGold,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: HotelTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: HotelTheme.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              value: value,
              activeColor: HotelTheme.primaryGold,
              activeTrackColor: HotelTheme.primaryGold.withOpacity(0.3),
              inactiveThumbColor: HotelTheme.textSecondary,
              inactiveTrackColor: Colors.white10,
              onChanged: onChanged,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveTile({
    required String title,
    required String subtitle,
    required Widget trailing,
    required VoidCallback onTap,
  }) {
    return InteractiveCard(
      onTap: onTap,
      scaleFactor: 0.98,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: HotelTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: HotelTheme.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            trailing,
          ],
        ),
      ),
    );
  }
}