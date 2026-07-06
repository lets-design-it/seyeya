import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';
import '../bookings/bookings_history_screen.dart';
import 'settings_screen.dart';
import 'payment_methods_screen.dart';
import 'terms_conditions_screen.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showUpdateProfileBottomSheet(BuildContext context, AppState state) {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: state.userProfile.name);
    final emailController = TextEditingController(text: state.userProfile.email);
    final phoneController = TextEditingController(text: state.userProfile.phone);
    final picController = TextEditingController(text: state.userProfile.profilePicUrl);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: GlassCard(
            blur: 25,
            radius: 30,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Form(
                key: formKey,
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
                        Icon(Icons.edit_outlined, color: HotelTheme.primaryGold),
                        SizedBox(width: 10),
                        Text(
                          "UPDATE PROFILE",
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
                    
                    // Name Field
                    TextFormField(
                      controller: nameController,
                      style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: "FULL NAME",
                        labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your name' : null,
                    ),
                    const SizedBox(height: 16),

                    // Email Field
                    TextFormField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: "EMAIL ADDRESS",
                        labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your email' : null,
                    ),
                    const SizedBox(height: 16),

                    // Phone Field
                    TextFormField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: "PHONE NUMBER",
                        labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your phone number' : null,
                    ),
                    const SizedBox(height: 16),

                    // Profile Pic URL Field
                    TextFormField(
                      controller: picController,
                      style: TextStyle(color: HotelTheme.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: "AVATAR IMAGE URL",
                        labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                        focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Save Button
                    GoldButton(
                      width: double.infinity,
                      onTap: () {
                        if (formKey.currentState!.validate()) {
                          state.updateProfile(
                            name: nameController.text,
                            email: emailController.text,
                            phone: phoneController.text,
                            profilePicUrl: picController.text.isNotEmpty ? picController.text : null,
                          );
                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text("Profile updated successfully"),
                              backgroundColor: HotelTheme.backgroundCards,
                            ),
                          );
                        }
                      },
                      child: const Text("SAVE CHANGES"),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showLogoutDialog(BuildContext context, AppState state) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: GlassCard(
            blur: 20,
            radius: 24,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.logout_rounded, color: HotelTheme.accentOrange, size: 48),
                const SizedBox(height: 16),
                Text(
                  "Log Out?",
                  style: TextStyle(color: HotelTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  "Are you sure you want to log out of Seyeya Royal Grand?",
                  style: TextStyle(color: HotelTheme.textSecondary, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: GlassButton(
                        onTap: () => Navigator.of(context).pop(),
                        child: const Text("CANCEL"),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: GoldButton(
                        onTap: () {
                          Navigator.of(context).pop(); // Dismiss dialog
                          state.logout();
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                            (route) => false,
                          );
                        },
                        child: const Text("LOG OUT"),
                      ),
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

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final user = state.userProfile;

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
            "MY ACCOUNT",
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
            // User Info Header Card
            GlassCard(
              blur: 15,
              radius: 24,
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: HotelTheme.primaryGold, width: 1.5),
                    ),
                    child: ClipOval(
                      child: Image.network(
                        user.profilePicUrl,
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 72,
                            height: 72,
                            color: Colors.white10,
                            child: Icon(Icons.person, color: HotelTheme.primaryGold, size: 36),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: TextStyle(
                            color: HotelTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.email,
                          style: TextStyle(
                            color: HotelTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user.phone,
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
            ),
            const SizedBox(height: 24),
            
            // Profile Actions
            Padding(
              padding: EdgeInsets.only(left: 8.0, bottom: 8.0),
              child: Text(
                "ACCOUNT SETTINGS",
                style: TextStyle(
                  color: HotelTheme.primaryGold,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            
            GlassCard(
              blur: 10,
              radius: 20,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildListTile(
                    icon: Icons.person_outline_rounded,
                    title: "Update Profile",
                    subtitle: "Edit name, email, and phone number",
                    onTap: () => _showUpdateProfileBottomSheet(context, state),
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildListTile(
                    icon: Icons.settings_outlined,
                    title: "Settings",
                    subtitle: "Preferences and notification choices",
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const SettingsScreen()),
                      );
                    },
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildListTile(
                    icon: Icons.bookmark_border_outlined,
                    title: "My Bookings",
                    subtitle: "View room, conference & food orders",
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const BookingsHistoryScreen()),
                      );
                    },
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildListTile(
                    icon: Icons.payment_outlined,
                    title: "Payment Method",
                    subtitle: "Manage saved luxury checkout cards",
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const PaymentMethodsScreen()),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Padding(
              padding: EdgeInsets.only(left: 8.0, bottom: 8.0),
              child: Text(
                "LEGAL & SYSTEM",
                style: TextStyle(
                  color: HotelTheme.primaryGold,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            
            GlassCard(
              blur: 10,
              radius: 20,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildListTile(
                    icon: Icons.description_outlined,
                    title: "Terms and Conditions",
                    subtitle: "Seyeya guest policies and rules",
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const TermsConditionsScreen()),
                      );
                    },
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  _buildListTile(
                    icon: Icons.logout_rounded,
                    title: "Log Out",
                    titleColor: HotelTheme.accentOrange,
                    subtitle: "Disconnect from this active session",
                    onTap: () => _showLogoutDialog(context, state),
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

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color titleColor = Colors.white,
  }) {
    return InteractiveCard(
      onTap: onTap,
      scaleFactor: 0.98,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: titleColor == HotelTheme.accentOrange ? HotelTheme.accentOrange : HotelTheme.primaryGold, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: titleColor,
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
            Icon(Icons.arrow_forward_ios_rounded, color: HotelTheme.textMuted, size: 14),
          ],
        ),
      ),
    );
  }
}