import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/mandi_rate_model.dart';

final marketProvider = FutureProvider<List<MandiRateModel>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/admin/mandirates');
  return (response.data as List).map((e) => MandiRateModel.fromJson(e)).toList();
});
