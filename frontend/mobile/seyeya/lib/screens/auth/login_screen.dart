import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: "alexandra.sterling@royalgrand.com");
  final _passwordController = TextEditingController(text: "password");
  bool _isPasswordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
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

      Future.delayed(const Duration(milliseconds: 800), () {
        if (mounted) {
          Navigator.of(context).pop(); // Dismiss loading
          final state = AppStateProvider.of(context);
          state.login(_emailController.text, _passwordController.text);
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      });
    }
  }

  void _handleSocialLogin(String provider) {
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
        state.login("social@royalgrand.com", "password");
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
          
          // 2. Dark overlay gradient for high readability/contrast
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
          
          // 3. Main Content Layer
          SafeArea(
            child: TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 800),
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
                            // Safe fallback text if logo.png asset is missing during build
                            return Icon(Icons.hotel_class_outlined, size: 64, color: HotelTheme.primaryGold);
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "Welcome Back",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Sign in to access your royal reservations",
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
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
                            // Email Field
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              decoration: InputDecoration(
                                labelText: "EMAIL ADDRESS",
                                labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                                hintText: "Enter email",
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
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) => FocusScope.of(context).nextFocus(),
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
                            const SizedBox(height: 20),
                            
                            // Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: !_isPasswordVisible,
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              decoration: InputDecoration(
                                labelText: "PASSWORD",
                                labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                                hintText: "Enter password",
                                hintStyle: const TextStyle(color: Colors.white54),
                                prefixIcon: Icon(Icons.lock_outline_rounded, color: HotelTheme.primaryGold, size: 20),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                    color: Colors.white70,
                                    size: 20,
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
                              textInputAction: TextInputAction.done,
                              //onFieldSubmitted: (_) => _handleLogin(),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter your password';
                                }
                                if (value.length < 4) {
                                  return 'Password is too short';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => const ForgotPasswordScreen(),
                                    ),
                                  );
                                },
                                child: Text(
                                  "Forgot Password?",
                                  style: TextStyle(
                                    color: HotelTheme.primaryGold,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            
                            // Sign In Button
                            Semantics(
                              label: 'Sign in to your account',
                              child: GoldButton(
                                height: 48,
                                onTap: _handleLogin,
                                child: const Text("SIGN IN"),
                              ),
                            ),
                            const SizedBox(height: 24),
                            
                            // Divider line
                            Row(
                              children: [
                                const Expanded(child: Divider(color: Colors.white10)),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 12.0),
                                  child: Text(
                                    "OR CONNECT WITH",
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

                            // Social login buttons row
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
                                  onTap: () => _handleSocialLogin("Google"),
                                ),
                                const SizedBox(width: 16),
                                _buildSocialButton(
                                  icon: Icon(Icons.apple_rounded, color: HotelTheme.primaryGold, size: 20),
                                  label: "Apple",
                                  onTap: () => _handleSocialLogin("Apple"),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Registration Link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Don't have an account? ",
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (context) => const RegisterScreen()),
                              );
                            },
                            child: Text(
                              "SIGN UP",
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
            ),)
          ),
        ],
      ),
    );
  }
}