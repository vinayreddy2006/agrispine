class UserModel {
  final String id;
  final String name;
  final String phone;
  final String village;
  final String district;
  final String bio;
  final String userType;
  final String profileImage;

  UserModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.village,
    this.district = '',
    this.bio = '',
    required this.userType,
    this.profileImage = '',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      village: json['village'] ?? '',
      district: json['district'] ?? '',
      bio: json['bio'] ?? '',
      userType: json['userType'] ?? 'farmer',
      profileImage: json['profileImage'] ?? '',
    );
  }
}
