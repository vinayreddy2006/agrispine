class MandiRateModel {
  final String id;
  final String state;
  final String market;
  final String crop;
  final String priceMin;
  final String priceMax;
  final String priceAvg;

  MandiRateModel({required this.id, required this.state, required this.market, required this.crop, required this.priceMin, required this.priceMax, required this.priceAvg});

  factory MandiRateModel.fromJson(Map<String, dynamic> json) {
    return MandiRateModel(
      id: json['_id'] ?? '',
      state: json['state'] ?? '',
      market: json['market'] ?? '',
      crop: json['crop'] ?? '',
      priceMin: json['priceMin']?.toString() ?? '',
      priceMax: json['priceMax']?.toString() ?? '',
      priceAvg: json['priceAvg']?.toString() ?? '',
    );
  }
}
