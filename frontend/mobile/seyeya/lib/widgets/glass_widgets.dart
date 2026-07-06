import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/hotel_theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double radius;
  final double blur;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? width;
  final double? height;
  final Gradient? gradient;
  final BoxBorder? border;

  const GlassCard({
    super.key,
    required this.child,
    this.radius = 16.0,
    this.blur = 15.0,
    this.padding,
    this.margin,
    this.width,
    this.height,
    this.gradient,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding ?? const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: gradient ?? HotelTheme.glassGradient,
              borderRadius: BorderRadius.circular(radius),
              border: border ?? Border.all(
                color: HotelTheme.glassBorder,
                width: 1.0,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class InteractiveCard extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;
  final double scaleFactor;

  const InteractiveCard({
    super.key,
    required this.child,
    required this.onTap,
    this.scaleFactor = 0.96,
  });

  @override
  State<InteractiveCard> createState() => _InteractiveCardState();
}

class _InteractiveCardState extends State<InteractiveCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleFactor,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
    widget.onTap();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}

class GoldButton extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final double radius;
  final double? width;
  final double height;
  final EdgeInsetsGeometry? padding;

  const GoldButton({
    super.key,
    required this.child,
    required this.onTap,
    this.radius = 12.0,
    this.width,
    this.height = 50.0,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return InteractiveCard(
      onTap: onTap,
      child: Container(
        width: width,
        height: height,
        padding: padding,
        decoration: BoxDecoration(
          gradient: HotelTheme.goldGradient,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: [
            BoxShadow(
              color: HotelTheme.primaryGold.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            )
          ],
        ),
        alignment: Alignment.center,
        child: DefaultTextStyle(
          style: const TextStyle(
            color: Color(0xFF0B0F19), // Dark background color for high contrast
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
          child: child,
        ),
      ),
    );
  }
}

class GlassButton extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final double radius;
  final double? width;
  final double height;

  const GlassButton({
    super.key,
    required this.child,
    required this.onTap,
    this.radius = 12.0,
    this.width,
    this.height = 50.0,
  });

  @override
  Widget build(BuildContext context) {
    return InteractiveCard(
      onTap: onTap,
      child: GlassCard(
        radius: radius,
        padding: EdgeInsets.zero,
        width: width,
        height: height,
        child: Center(
          child: DefaultTextStyle(
            style: TextStyle(
              color: HotelTheme.textPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}