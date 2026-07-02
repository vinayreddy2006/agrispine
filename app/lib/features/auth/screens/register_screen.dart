import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _villageController = TextEditingController();
  final _passwordController = TextEditingController();

  void _handleRegister() async {
    final success = await ref.read(authProvider.notifier).register(
      _nameController.text.trim(),
      _phoneController.text.trim(), 
      _villageController.text.trim(), 
      _passwordController.text
    );
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration Successful! Please login.')));
        context.go('/login');
      } else {
        final error = ref.read(authProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error ?? 'Registration Failed')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Text('Create Account', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              TextField(controller: _nameController, decoration: const InputDecoration(hintText: 'Name')),
              const SizedBox(height: 16),
              TextField(controller: _phoneController, decoration: const InputDecoration(hintText: 'Phone')),
              const SizedBox(height: 16),
              TextField(controller: _villageController, decoration: const InputDecoration(hintText: 'Village')),
              const SizedBox(height: 16),
              TextField(controller: _passwordController, obscureText: true, decoration: const InputDecoration(hintText: 'Password')),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: authState.isLoading ? null : _handleRegister,
                child: authState.isLoading ? const CircularProgressIndicator() : const Text('SIGN UP'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
