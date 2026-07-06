import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _isSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _handleResetPassword() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      // Simulate sending email reset link
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _isSent = true;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Background Luxury Image
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


          
          // 2. Dark overlay for high contrast
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
          
          // 3. Main Layer
          SafeArea(
            child: TweenAnimationBuilder<double>(
              duration: const Duration(milliseconds: 600),
              tween: Tween(begin: 0.8, end: 1.0),
              curve: Curves.easeOutCubic,
              builder: (context, value, child) {
                return Opacity(
                  opacity: value,
                  child: Transform.scale(
                    scale: value,
                    child: child,
                  ),
                );
              },
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
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
                            errorBuilder: (context, error, stackTrace) {
                              return Icon(Icons.hotel_class_outlined, size: 64, color: HotelTheme.primaryGold);
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          "Forgot Password",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Text(
                            _isSent 
                              ? "We've sent a link to your email address with instructions to reset your password."
                              : "Enter the email associated with your account and we will send a password reset link.",
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // Glass Card Wrapper
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
                          child: _isSent ? _buildSuccessContent() : _buildFormContent(),
                        ),
                        const SizedBox(height: 24),
                        
                        // Back to login text link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              "Remember your password? ",
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
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Email Field
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: "EMAIL ADDRESS",
            labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
            hintText: "Enter your email",
            hintStyle: const TextStyle(color: Colors.white54),
            prefixIcon: Icon(Icons.email_outlined, color: HotelTheme.primaryGold, size: 20),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: HotelTheme.primaryGold),
            ),
            errorStyle: TextStyle(color: HotelTheme.accentOrange),
          ),
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _handleResetPassword(),
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
        const SizedBox(height: 32),
        
        // Reset Button
        _isLoading
            ? Center(child: CircularProgressIndicator(color: HotelTheme.primaryGold))
            : Semantics(
                label: 'Send password reset email link',
                child: GoldButton(
                  height: 48,
                  onTap: _handleResetPassword,
                  child: const Text("SEND RESET LINK"),
                ),
              ),
      ],
    );
  }

  Widget _buildSuccessContent() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: HotelTheme.primaryGold.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.mark_email_read_outlined,
            color: HotelTheme.primaryGold,
            size: 48,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          "Check Your Email",
          style: TextStyle(
            color: HotelTheme.primaryGold,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          "We sent a verification link to your email address.",
          style: TextStyle(color: Colors.white70, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        GoldButton(
          height: 48,
          onTap: () => Navigator.of(context).pop(),
          child: const Text("BACK TO LOGIN"),
        ),
      ],
    );
  }
}
