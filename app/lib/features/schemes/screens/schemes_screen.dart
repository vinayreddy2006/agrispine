import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/schemes_provider.dart';

class SchemesScreen extends ConsumerWidget {
  const SchemesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schemesAsync = ref.watch(schemesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Government Schemes')),
      body: schemesAsync.when(
        data: (schemes) => ListView.builder(
          itemCount: schemes.length,
          itemBuilder: (context, index) {
            final scheme = schemes[index];
            return Card(
              margin: const EdgeInsets.all(8),
              child: ListTile(
                title: Text(scheme.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${scheme.description}\nAmount: ${scheme.amount}'),
                isThreeLine: true,
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
