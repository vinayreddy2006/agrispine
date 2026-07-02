class MachineModel {
  final String id;
  final String name;
  final String category;
  final double pricePerHour;
  final String description;
  final String image;
  final bool available;
  final String ownerName;

  MachineModel({required this.id, required this.name, required this.category, required this.pricePerHour, required this.description, required this.image, required this.available, required this.ownerName});

  factory MachineModel.fromJson(Map<String, dynamic> json) {
    return MachineModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      pricePerHour: (json['pricePerHour'] ?? 0).toDouble(),
      description: json['description'] ?? '',
      image: json['image'] ?? '',
      available: json['available'] ?? true,
      ownerName: json['owner']?['name'] ?? 'Unknown',
    );
  }
}
