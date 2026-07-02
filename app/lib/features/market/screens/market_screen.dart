import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/market_provider.dart';

class MarketScreen extends ConsumerWidget {
  const MarketScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ratesAsync = ref.watch(marketProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Live Mandi Rates')),
      body: ratesAsync.when(
        data: (rates) => ListView.builder(
          itemCount: rates.length,
          itemBuilder: (context, index) {
            final rate = rates[index];
            return ListTile(
              title: Text(rate.crop),
              subtitle: Text('${rate.market}, ${rate.state}'),
              trailing: Text('₹${rate.priceAvg}/q', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
