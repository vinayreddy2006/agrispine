import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AgriSpine Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.message),
            onPressed: () => context.push('/messenger'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text('Welcome, ${user?.name ?? 'Farmer'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 3,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildCard(context, Icons.show_chart, 'Market', () => context.go('/market')),
                _buildCard(context, Icons.account_balance, 'Schemes', () => context.go('/schemes')),
                _buildCard(context, Icons.forum, 'Community', () => context.go('/community')),
                _buildCard(context, Icons.agriculture, 'Machinery', () => context.push('/machinery')),
                _buildCard(context, Icons.eco, 'Plant Doctor', () => context.push('/doctor')),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildCard(BuildContext context, IconData icon, String title, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Theme.of(context).primaryColor),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 12), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
