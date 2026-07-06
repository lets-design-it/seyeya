import 'package:flutter/material.dart';
import '../../theme/hotel_theme.dart';
import '../../widgets/glass_widgets.dart';
import '../../state/app_state.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _holderController = TextEditingController();
  final _numberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  String _selectedCardType = "Visa Premium";

  @override
  void dispose() {
    _holderController.dispose();
    _numberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  void _showAddCardDialog(BuildContext context, AppState state) {
    _holderController.clear();
    _numberController.clear();
    _expiryController.clear();
    _cvvController.clear();
    _selectedCardType = "Visa Premium";

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              backgroundColor: Colors.transparent,
              child: GlassCard(
                blur: 20,
                radius: 24,
                padding: const EdgeInsets.all(20),
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.add_card_outlined, color: HotelTheme.primaryGold),
                            SizedBox(width: 10),
                            Text(
                              "ADD PAYMENT CARD",
                              style: TextStyle(
                                color: HotelTheme.primaryGold,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: Colors.white10),
                        const SizedBox(height: 8),

                        // Cardholder Name
                        TextFormField(
                          controller: _holderController,
                          style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            labelText: "CARDHOLDER NAME",
                            labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold),
                            hintText: "e.g., Alexandra Sterling",
                            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                            focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                          ),
                          validator: (value) => value == null || value.isEmpty ? 'Enter cardholder name' : null,
                        ),
                        const SizedBox(height: 12),

                        // Card Number
                        TextFormField(
                          controller: _numberController,
                          keyboardType: TextInputType.number,
                          style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            labelText: "CARD NUMBER",
                            labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold),
                            hintText: "16-digit card number",
                            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                            focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Enter card number';
                            if (value.replaceAll(RegExp(r'\s+\b|\b\s+'), '').length < 16) return 'Invalid card number length';
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),

                        // Expiry & CVV
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _expiryController,
                                style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                                decoration: InputDecoration(
                                  labelText: "EXPIRY DATE",
                                  labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold),
                                  hintText: "MM/YY",
                                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                                ),
                                validator: (value) {
                                  if (value == null || value.isEmpty) return 'Enter expiry';
                                  if (!value.contains('/')) return 'Use MM/YY';
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: TextFormField(
                                controller: _cvvController,
                                keyboardType: TextInputType.number,
                                obscureText: true,
                                style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                                decoration: InputDecoration(
                                  labelText: "CVV",
                                  labelStyle: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold),
                                  hintText: "3 digits",
                                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
                                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: HotelTheme.primaryGold)),
                                ),
                                validator: (value) {
                                  if (value == null || value.isEmpty) return 'Enter CVV';
                                  if (value.length < 3) return 'Invalid CVV';
                                  return null;
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Card Brand Select
                        Text(
                          "CARD TYPE",
                          style: TextStyle(color: HotelTheme.primaryGold, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                        DropdownButton<String>(
                          value: _selectedCardType,
                          dropdownColor: HotelTheme.backgroundCards,
                          isExpanded: true,
                          underline: Container(height: 1, color: Colors.white10),
                          style: TextStyle(color: HotelTheme.textPrimary, fontSize: 13),
                          items: <String>["Visa Premium", "Mastercard Elite", "American Express Black"].map((String value) {
                            return DropdownMenuItem<String>(
                              value: value,
                              child: Text(value),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setDialogState(() {
                                _selectedCardType = val;
                              });
                            }
                          },
                        ),
                        const SizedBox(height: 28),

                        // Action Buttons
                        Row(
                          children: [
                            Expanded(
                              child: GlassButton(
                                height: 44,
                                onTap: () => Navigator.of(context).pop(),
                                child: const Text("CANCEL"),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: GoldButton(
                                height: 44,
                                onTap: () {
                                  if (_formKey.currentState!.validate()) {
                                    final numberRaw = _numberController.text.replaceAll(RegExp(r'\s+'), '');
                                    final lastFour = numberRaw.substring(numberRaw.length - 4);
                                    
                                    final newCard = PaymentCard(
                                      id: "card_${DateTime.now().millisecondsSinceEpoch}",
                                      cardholderName: _holderController.text,
                                      cardNumber: "**** **** **** $lastFour",
                                      expiryDate: _expiryController.text,
                                      cardType: _selectedCardType,
                                    );

                                    state.addPaymentCard(newCard);
                                    Navigator.of(context).pop();
                                    
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text("Payment card added successfully"),
                                        backgroundColor: HotelTheme.backgroundCards,
                                      ),
                                    );
                                  }
                                },
                                child: const Text("SAVE CARD"),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
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
            "PAYMENT METHODS",
            style: TextStyle(
              color: HotelTheme.primaryGold,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              fontSize: 16,
            ),
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: state.paymentCards.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: state.paymentCards.length,
                      itemBuilder: (context, index) {
                        final card = state.paymentCards[index];
                        return _buildCreditCard(context, card, state);
                      },
                    ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: GoldButton(
                  width: double.infinity,
                  onTap: () => _showAddCardDialog(context, state),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add, color: HotelTheme.backgroundDark, size: 20),
                      SizedBox(width: 8),
                      Text("ADD NEW CARD"),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.02),
                border: Border.all(color: Colors.white.withOpacity(0.04)),
              ),
              child: Icon(Icons.credit_card_off_outlined, size: 48, color: HotelTheme.textMuted),
            ),
            const SizedBox(height: 20),
            Text(
              "No Payment Cards Saved",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: HotelTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              "Add a credit card to enable quick premium checkouts for rooms, conferences, and gourmet restaurant dining orders.",
              style: TextStyle(fontSize: 12, color: HotelTheme.textSecondary, height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreditCard(BuildContext context, PaymentCard card, AppState state) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Stack(
        children: [
          // Glassmorphic Credit Card Design
          GlassCard(
            blur: 15,
            radius: 20,
            padding: const EdgeInsets.all(24),
            gradient: LinearGradient(
              colors: [
                Colors.white.withOpacity(0.08),
                Colors.white.withOpacity(0.02),
                HotelTheme.primaryGold.withOpacity(0.03),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            child: SizedBox(
              height: 140,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 40,
                        height: 30,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFFF9D976),
                              Color(0xFFE9B646),
                              Color(0xFFC1932E),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.white24, width: 0.8),
                        ),
                      ),
                      Text(
                        card.cardType.toUpperCase(),
                        style: TextStyle(
                          color: HotelTheme.primaryGold,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    card.cardNumber,
                    style: TextStyle(
                      color: HotelTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 3.5,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "CARD HOLDER",
                            style: TextStyle(color: HotelTheme.textMuted, fontSize: 8, letterSpacing: 1.0),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            card.cardholderName.toUpperCase(),
                            style: TextStyle(
                              color: HotelTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            "EXPIRES",
                            style: TextStyle(color: HotelTheme.textMuted, fontSize: 8, letterSpacing: 1.0),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            card.expiryDate,
                            style: TextStyle(
                              color: HotelTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          Positioned(
            top: 12,
            right: 12,
            child: InteractiveCard(
              onTap: () {
                state.removePaymentCard(card.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Payment card removed"),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white10),
                ),
                child: Icon(
                  Icons.delete_outline,
                  color: HotelTheme.accentOrange,
                  size: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}