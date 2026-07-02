import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/machinery_provider.dart';

class MachineryScreen extends ConsumerWidget {
  const MachineryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final machineryAsync = ref.watch(machineryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rent Machinery')),
      body: machineryAsync.when(
        data: (machines) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: machines.length,
          itemBuilder: (context, index) {
            final machine = machines[index];
            return GestureDetector(
              onTap: () {}, // Navigate to details
              child: Card(
                child: Column(
                  children: [
                    const Expanded(child: Icon(Icons.agriculture, size: 50, color: Colors.grey)),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        children: [
                          Text(machine.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text('₹${machine.pricePerHour}/hr', style: TextStyle(color: Theme.of(context).primaryColor)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
