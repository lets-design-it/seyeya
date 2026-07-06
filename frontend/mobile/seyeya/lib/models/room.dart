class Room {
  final String id;
  final String name;
  final String description;
  final double rating;
  final int reviewsCount;
  final double pricePerNight;
  final String imageUrl;
  final List<String> amenities;
  final int capacity;
  final String size;
  final String bedType;
  final bool isAvailable;

  const Room({
    required this.id,
    required this.name,
    required this.description,
    required this.rating,
    required this.reviewsCount,
    required this.pricePerNight,
    required this.imageUrl,
    required this.amenities,
    required this.capacity,
    required this.size,
    required this.bedType,
    this.isAvailable = true,
  });

  static const List<Room> mockRooms = [
    Room(
      id: "room_1",
      name: "Deluxe King Room",
      description: "Indulge in absolute comfort featuring a spacious king-size bed, private marble bathroom, a smart entertainment center, and floor-to-ceiling windows offering scenic city views.",
      rating: 4.8,
      reviewsCount: 124,
      pricePerNight: 220.0,
      imageUrl: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
      amenities: ["Free Wi-Fi", "Mini Bar", "Smart TV", "Coffee Maker", "AC", "24/7 Room Service"],
      capacity: 2,
      size: "45 m²",
      bedType: "1 King Bed",
    ),
    Room(
      id: "room_2",
      name: "Executive Ocean Suite",
      description: "Experience premium oceanfront luxury. This state-of-the-art suite features a separate living area, workspace, high-end espresso machine, premium rain shower, and a private balcony overlooking the coast.",
      rating: 4.9,
      reviewsCount: 86,
      pricePerNight: 450.0,
      imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
      amenities: ["Ocean View", "Private Balcony", "Living Area", "Espresso Machine", "Bath Tub", "Lounge Access"],
      capacity: 3,
      size: "82 m²",
      bedType: "1 Super King Bed + 1 Sofa Bed",
    ),
    Room(
      id: "room_3",
      name: "Presidential Royal Penthouse",
      description: "The peak of luxury hospitality. Spanning across a private high floor, this penthouse offers 360 panoramic views, a private jacuzzi, full butler service, private dining salon, and elite styling throughout.",
      rating: 5.0,
      reviewsCount: 42,
      pricePerNight: 1200.0,
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
      amenities: ["Butler Service", "Private Jacuzzi", "Helipad Access", "Dining Salon", "Premium Bar", "Airport Transfer"],
      capacity: 5,
      size: "210 m²",
      bedType: "2 Grand Master Beds",
    ),
  ];
}

class RoomReservation {
  final String id;
  final Room room;
  final DateTime checkIn;
  final DateTime checkOut;
  final int guests;
  final double totalPrice;
  final String bookingReference;

  RoomReservation({
    required this.id,
    required this.room,
    required this.checkIn,
    required this.checkOut,
    required this.guests,
    required this.totalPrice,
    required this.bookingReference,
  });
}
