class SchemeModel {
  final String id;
  final String name;
  final String provider;
  final String amount;
  final String applyDate;
  final String description;

  SchemeModel({required this.id, required this.name, required this.provider, required this.amount, required this.applyDate, required this.description});

  factory SchemeModel.fromJson(Map<String, dynamic> json) {
    return SchemeModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      provider: json['provider'] ?? '',
      amount: json['amount'] ?? '',
      applyDate: json['applyDate'] ?? '',
      description: json['description'] ?? '',
    );
  }
}
