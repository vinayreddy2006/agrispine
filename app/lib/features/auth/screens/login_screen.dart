import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  void _handleLogin() async {
    final success = await ref.read(authProvider.notifier).login(
      _phoneController.text.trim(), 
      _passwordController.text
    );
    if (mounted) {
      if (success) {
        context.go('/dashboard');
      } else {
        final error = ref.read(authProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error ?? 'Login Failed')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.eco, size: 80, color: Colors.green),
              const SizedBox(height: 32),
              TextField(controller: _phoneController, decoration: const InputDecoration(hintText: 'Phone')),
              const SizedBox(height: 16),
              TextField(controller: _passwordController, obscureText: true, decoration: const InputDecoration(hintText: 'Password')),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: authState.isLoading ? null : _handleLogin,
                child: authState.isLoading ? const CircularProgressIndicator() : const Text('LOGIN'),
              ),
              TextButton(
                onPressed: () => context.go('/register'),
                child: const Text('Don\'t have an account? Sign Up'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
