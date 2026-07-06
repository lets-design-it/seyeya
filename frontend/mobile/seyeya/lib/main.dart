import 'package:flutter/material.dart';
import 'theme/hotel_theme.dart';
import 'state/app_state.dart';
import 'screens/main_navigation.dart';
import 'screens/auth/welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    AppStateProvider(
      notifier: AppState(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    HotelTheme.isDarkMode = state.isDarkMode;
    
    return MaterialApp(
      title: 'Seyeya Royal Grand',
      debugShowCheckedModeBanner: false,
      theme: HotelTheme.themeData,
      home: state.isLoggedIn ? const MainNavigation() : const WelcomeScreen(),
    );
  }
}
