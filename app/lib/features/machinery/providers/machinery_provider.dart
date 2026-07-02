import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/machine_model.dart';

final machineryProvider = FutureProvider<List<MachineModel>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/machines/fetchall');
  return (response.data as List).map((e) => MachineModel.fromJson(e)).toList();
});

class BookingNotifier extends StateNotifier<bool> {
  final Ref ref;
  BookingNotifier(this.ref) : super(false);

  Future<bool> bookMachine(String machineId, String date, String notes) async {
    state = true;
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/bookings/book', data: {
        'machineId': machineId,
        'date': date,
        'notes': notes,
      });
      state = false;
      return true;
    } catch (e) {
      state = false;
      return false;
    }
  }
}

final bookingProvider = StateNotifierProvider<BookingNotifier, bool>((ref) {
  return BookingNotifier(ref);
});
