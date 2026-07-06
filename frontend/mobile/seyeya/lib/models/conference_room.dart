import 'package:flutter/material.dart';

class ConferenceRoom {
  final String id;
  final String name;
  final String description;
  final int capacity;
  final double hourlyRate;
  final String imageUrl;
  final List<String> amenities;
  final List<String> availableLayouts; // e.g., "Boardroom", "Theater", "U-Shape", "Banquet"
  final double rating;
  final int sizeSqM;

  const ConferenceRoom({
    required this.id,
    required this.name,
    required this.description,
    required this.capacity,
    required this.hourlyRate,
    required this.imageUrl,
    required this.amenities,
    required this.availableLayouts,
    required this.rating,
    required this.sizeSqM,
  });

  static const List<ConferenceRoom> mockConferenceRooms = [
    ConferenceRoom(
      id: "conf_1",
      name: "The Obsidian Executive Boardroom",
      description: "Designed for high-profile executive decisions. Features ergonomic seating, premium oak conference table, integrated microphone panels, and ultra-high-definition presentation displays.",
      capacity: 16,
      hourlyRate: 75.0,
      imageUrl: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80",
      amenities: ["Ultra HD Display", "Video Conferencing system", "Smart Whiteboard", "Privacy Glass", "Catering Service available"],
      availableLayouts: ["Boardroom"],
      rating: 4.9,
      sizeSqM: 60,
    ),
    ConferenceRoom(
      id: "conf_2",
      name: "Royal Opal Grand Ballroom",
      description: "A colossal, majestic hall perfect for keynote conferences, award banquets, and major symposiums. Equipped with state-of-the-art concert acoustic speakers, customizable ambient LED lights, and high-performance projectors.",
      capacity: 350,
      hourlyRate: 250.0,
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
      amenities: ["Concert PA & Sound", "Dual Laser Projectors", "Configurable Stage", "Dimmable LED RGB lighting", "High-speed Dedicated Wi-Fi"],
      availableLayouts: ["Theater", "Banquet", "Classroom"],
      rating: 4.8,
      sizeSqM: 420,
    ),
    ConferenceRoom(
      id: "conf_3",
      name: "Sapphire Seminar Studio",
      description: "A flexible seminar room ideal for mid-sized interactive workshops, academic training, and collaborative focus groups. Standardized layout options with portable desks and multiple whiteboard stations.",
      capacity: 60,
      hourlyRate: 110.0,
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=600&q=80",
      amenities: ["4K Short-throw Projector", "Wireless Mics", "Moveable Acoustic Dividers", "Self-service Coffee Station"],
      availableLayouts: ["Classroom", "U-Shape", "Theater"],
      rating: 4.7,
      sizeSqM: 110,
    ),
  ];
}

class ConferenceReservation {
  final String id;
  final ConferenceRoom conferenceRoom;
  final DateTime date;
  final TimeOfDay startTime;
  final int durationHours;
  final String setupLayout;
  final List<String> selectedAmenities;
  final double totalPrice;
  final String bookingReference;

  ConferenceReservation({
    required this.id,
    required this.conferenceRoom,
    required this.date,
    required this.startTime,
    required this.durationHours,
    required this.setupLayout,
    required this.selectedAmenities,
    required this.totalPrice,
    required this.bookingReference,
  });
}
