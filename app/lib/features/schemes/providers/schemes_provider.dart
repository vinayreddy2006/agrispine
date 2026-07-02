import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/scheme_model.dart';

final schemesProvider = FutureProvider<List<SchemeModel>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/admin/schemes');
  return (response.data as List).map((e) => SchemeModel.fromJson(e)).toList();
});
