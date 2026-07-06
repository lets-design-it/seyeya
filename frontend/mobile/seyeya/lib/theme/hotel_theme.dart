import 'package:flutter/material.dart';

class HotelTheme {
  static bool _isDarkMode = false;
  static bool get isDarkMode => _isDarkMode;
  static set isDarkMode(bool val) {
    _isDarkMode = val;
  }

  // Dynamic getters for colors based on theme
  static Color get backgroundDark => _isDarkMode ? const Color(0xFF002B44) : const Color(0xFFF9FAFB);
  static Color get backgroundCards => _isDarkMode ? const Color(0xFF003859) : const Color(0xFFFFFFFF);
  static Color get primaryGold => const Color(0xFFD0B770); // Gold Accent #D0B770
  static Color get goldAccent => const Color(0xFFD0B770);
  static Color get goldDark => const Color(0xFFB09B5A); // Gold Hover/Dark
  static Color get accentOrange => const Color(0xFFFF6B4A);
  static Color get success => const Color(0xFF10B981);
  static Color get textPrimary => _isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF111827);
  static Color get textSecondary => _isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF6B7280);
  static Color get textMuted => _isDarkMode ? const Color(0xFF64748B) : const Color(0xFF9CA3AF);
  
  // Custom Card colors (glass effect)
  static Color get glassBg => _isDarkMode ? const Color(0x24FFFFFF) : const Color(0xFFFFFFFF);
  static Color get glassBorder => _isDarkMode ? const Color(0x2BFFFFFF) : const Color(0xFFE5E7EB);

  // Gradients
  static LinearGradient get bgGradient => _isDarkMode
      ? const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF003859), // Slate dark blue
            Color(0xFF002033), // Deep dark navy
            Color(0xFF001A29), // Deepest dark velvet
          ],
        )
      : const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF9FAFB), // Background #F9FAFB
            Color(0xFFF3F4F6), // Slate 100
            Color(0xFFE5E7EB), // Borders #E5E7EB
          ],
        );

  static LinearGradient get goldGradient => const LinearGradient(
    colors: [
      Color(0xFFD0B770), // primary
      Color(0xFFB09B5A), // primary-dark
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get glassGradient => _isDarkMode
      ? const LinearGradient(
          colors: [
            Color(0x24FFFFFF),
            Color(0x0AFFFFFF),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        )
      : const LinearGradient(
          colors: [
            Color(0xFFFFFFFF),
            Color(0xFFF8FAFC),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );

  static LinearGradient get orangeGradient => const LinearGradient(
    colors: [
      Color(0xFFFF8C69),
      Color(0xFFFF523B),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Box Decorations
  static BoxDecoration glassDecoration({double radius = 16.0}) {
    return BoxDecoration(
      color: glassBg,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: glassBorder, width: 1.0),
    );
  }

  static BoxDecoration solidCardDecoration({double radius = 16.0}) {
    return BoxDecoration(
      color: backgroundCards,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: _isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFE5E7EB), width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(_isDarkMode ? 0.3 : 0.05),
          blurRadius: 10,
          offset: const Offset(0, 4),
        )
      ],
    );
  }

  // Theme Data Builder
  static ThemeData get themeData {
    return _isDarkMode ? _darkTheme : _lightTheme;
  }

  static ThemeData get _darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0B0F19),
      primaryColor: primaryGold,
      colorScheme: ColorScheme.dark(
        primary: primaryGold,
        secondary: goldAccent,
        surface: Color(0xFF161C2A),
      ),
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC), letterSpacing: -0.5),
        headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
        headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFFF8FAFC)),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFFF8FAFC)),
        bodyLarge: TextStyle(fontSize: 16, color: Color(0xFFF8FAFC)),
        bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
        bodySmall: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
      ),
      iconTheme: IconThemeData(color: primaryGold),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
      ),
    );
  }

  static ThemeData get _lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFF9FAFB),
      primaryColor: primaryGold,
      colorScheme: ColorScheme.light(
        primary: primaryGold,
        secondary: goldAccent,
        surface: Colors.white,
      ),
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF111827), letterSpacing: -0.5),
        headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
        bodyLarge: TextStyle(fontSize: 16, color: Color(0xFF111827)),
        bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        bodySmall: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
      ),
      iconTheme: IconThemeData(color: primaryGold),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        iconTheme: IconThemeData(color: Color(0xFF111827)),
      ),
    );
  }
}
