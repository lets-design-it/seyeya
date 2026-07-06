import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  String _passwordStrength = "";
  double _strengthScore = 0.0;
  Color _strengthColor = Colors.transparent;

  void _checkPasswordStrength(String password) {
    if (password.isEmpty) {
      setState(() {
        _passwordStrength = "";
        _strengthScore = 0.0;
        _strengthColor = Colors.transparent;
      });
      return;
    }

    double score = 0.0;
    if (password.length >= 6) score += 0.25;
    if (password.length >= 10) score += 0.25;
    if (RegExp(r'[A-Z]').hasMatch(password)) score += 0.25;
    if (RegExp(r'[0-9]').hasMatch(password)) score += 0.25;
    if (RegExp(r'[!@#\$&*~]').hasMatch(password)) score += 0.25;

    score = score.clamp(0.0, 1.0);

    String text;
    Color color;
    if (score <= 0.25) {
      text = "Weak";
      color = HotelTheme.accentOrange;
    } else if (score <= 0.75) {
      text = "Medium";
      color = HotelTheme.primaryGold;
    } else {
      text = "Strong";
      color = HotelTheme.success;
    }

    setState(() {
      _passwordStrength = text;
      _strengthScore = score;
      _strengthColor = color;
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    if (_formKey.currentState!.validate()) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          return Center(
            child: CircularProgressIndicator(color: HotelTheme.primaryGold),
          );
        },
      );

      Future.delayed(const Duration(milliseconds: 1000), () {
        if (mounted) {
          Navigator.of(context).pop(); // Dismiss loading
          final state = AppStateProvider.of(context);
          state.register(
            _nameController.text,
            _emailController.text,
            _phoneController.text,
            _passwordController.text,
          );
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      });
    }
  }

  void _handleSocialRegister(String provider) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Center(
          child: CircularProgressIndicator(color: HotelTheme.primaryGold),
        );
      },
    );

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        Navigator.of(context).pop(); // Dismiss loading
        final state = AppStateProvider.of(context);
        state.register(
          "Social User",
          "social@royalgrand.com",
          "+1 (555) 019-9999",
          "password",
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    });
  }

  Widget _buildSocialButton({
    required Widget icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InteractiveCard(
        onTap: onTap,
        child: GlassCard(
          blur: 10,
          radius: 12,
          padding: const EdgeInsets.symmetric(vertical: 10),
          gradient: LinearGradient(
            colors: [
              Colors.black.withOpacity(0.55),
              Colors.black.withOpacity(0.35),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: Colors.white.withOpacity(0.12),
            width: 1.0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background Luxury Image
          Image.network(
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80",
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                decoration: BoxDecoration(
                  gradient: HotelTheme.bgGradient,
                ),
              );
            },
          ),
          
          // Dark overlay for high readability/contrast
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.2), // Very light at the top
                  Colors.black.withOpacity(0.4), // Gentle tint in the middle
                  Colors.black.withOpacity(0.55), // Soft grounding at the bottom
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              physics: const BouncingScrollPhysics(),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Logo Area
                    Center(
                      child: Image.asset(
                        'assets/images/logo.png',
                        height: 120,
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "Create An Account",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    
                    // Glass Card Container
                    GlassCard(
                      radius: 24,
                      blur: 20,
                      padding: const EdgeInsets.all(24),
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.6),
                          Colors.black.withOpacity(0.4),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.12),
                        width: 1.0,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Name Field
                          TextFormField(
                            controller: _nameController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "FULL NAME",
                              labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                              hintText: "Enter full name",
                              hintStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: Icon(Icons.person_outline_rounded, color: HotelTheme.primaryGold, size: 18),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: HotelTheme.primaryGold),
                              ),
                              errorStyle: TextStyle(color: HotelTheme.accentOrange),
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter your name';
                              }
                              if (value.trim().split(' ').length < 2) {
                                return 'Please enter first and last name';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Email Field
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "EMAIL ADDRESS",
                              labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                              hintText: "Enter email address",
                              hintStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: Icon(Icons.email_outlined, color: HotelTheme.primaryGold, size: 18),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: HotelTheme.primaryGold),
                              ),
                              errorStyle: TextStyle(color: HotelTheme.accentOrange),
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your email';
                              }
                              if (!RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(value)) {
                                return 'Please enter a valid email address';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Phone Field
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "PHONE NUMBER",
                              labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                              hintText: "Enter phone number",
                              hintStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: Icon(Icons.phone_outlined, color: HotelTheme.primaryGold, size: 18),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: HotelTheme.primaryGold),
                              ),
                              errorStyle: TextStyle(color: HotelTheme.accentOrange),
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your phone number';
                              }
                              if (!RegExp(r'^\+?[0-9\s\-()]{8,15}$').hasMatch(value)) {
                                return 'Please enter a valid phone number';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          
                          // Password Field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: !_isPasswordVisible,
                            onChanged: _checkPasswordStrength,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "PASSWORD",
                              labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                              hintText: "At least 6 characters",
                              hintStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: Icon(Icons.lock_outline_rounded, color: HotelTheme.primaryGold, size: 18),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                  color: Colors.white70,
                                  size: 18,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _isPasswordVisible = !_isPasswordVisible;
                                  });
                                },
                              ),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: HotelTheme.primaryGold),
                              ),
                              errorStyle: TextStyle(color: HotelTheme.accentOrange),
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                  return 'Please enter your password';
                              }
                              if (value.length < 6) {
                                return 'Password must be at least 6 characters';
                              }
                              return null;
                            },
                          ),
                          if (_passwordStrength.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Text(
                                  "Password Strength: ",
                                  style: TextStyle(color: Colors.white70, fontSize: 11),
                                ),
                                Text(
                                  _passwordStrength,
                                  style: TextStyle(
                                    color: _strengthColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: LinearProgressIndicator(
                                value: _strengthScore,
                                backgroundColor: Colors.white10,
                                valueColor: AlwaysStoppedAnimation<Color>(_strengthColor),
                                minHeight: 4,
                              ),
                            ),
                          ],
                          const SizedBox(height: 16),

                          // Confirm Password Field
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: !_isConfirmPasswordVisible,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "CONFIRM PASSWORD",
                              labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                              hintText: "Re-enter password",
                              hintStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: Icon(Icons.lock_outline_rounded, color: HotelTheme.primaryGold, size: 18),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isConfirmPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                  color: Colors.white70,
                                  size: 18,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                                  });
                                },
                              ),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: HotelTheme.primaryGold),
                              ),
                              errorStyle: TextStyle(color: HotelTheme.accentOrange),
                            ),
                            textInputAction: TextInputAction.done,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please confirm your password';
                              }
                              if (value != _passwordController.text) {
                                return 'Passwords do not match';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 32),
                          
                          // Sign Up Button
                          GoldButton(
                            height: 48,
                            onTap: _handleRegister,
                            child: const Text("Create Account"),
                          ),
                          const SizedBox(height: 24),
                          
                          // Divider line
                          Row(
                            children: [
                              const Expanded(child: Divider(color: Colors.white10)),
                              const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 12.0),
                                  child: Text(
                                    "OR SIGN UP WITH",
                                    style: TextStyle(
                                      color: Colors.white60,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ),
                              const Expanded(child: Divider(color: Colors.white10)),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Social registration buttons row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildSocialButton(
                                icon: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: HotelTheme.primaryGold.withOpacity(0.1),
                                  ),
                                  child: Text(
                                    "G",
                                    style: TextStyle(
                                      color: HotelTheme.primaryGold,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      fontFamily: 'serif',
                                    ),
                                  ),
                                ),
                                label: "Google",
                                onTap: () => _handleSocialRegister("Google"),
                              ),
                              const SizedBox(width: 16),
                              _buildSocialButton(
                                icon: Icon(Icons.apple_rounded, color: HotelTheme.primaryGold, size: 20),
                                label: "Apple",
                                onTap: () => _handleSocialRegister("Apple"),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Back to Login Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Already have an account? ",
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Text(
                            "SIGN IN",
                            style: TextStyle(
                              color: HotelTheme.primaryGold,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      "By Clicking Create Account, you agree to the terms of use and privacy policy",
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 10.5,
                        height: 1.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
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
}