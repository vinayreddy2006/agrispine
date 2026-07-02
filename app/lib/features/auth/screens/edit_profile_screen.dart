import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/network/dio_client.dart';
import '../models/user_model.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _villageController;
  late TextEditingController _districtController;
  late TextEditingController _bioController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _villageController = TextEditingController(text: user?.village ?? '');
    _districtController = TextEditingController(text: user?.district ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _villageController.dispose();
    _districtController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _updateProfile() async {
    setState(() => _isLoading = true);
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.put('/auth/updateprofile', data: {
        'name': _nameController.text.trim(),
        'village': _villageController.text.trim(),
        'district': _districtController.text.trim(),
        'bio': _bioController.text.trim(),
      });

      // Update auth state user
      ref.read(authProvider.notifier).updateUserLocally(UserModel.fromJson(response.data));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully')));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update profile: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 16),
            TextField(controller: _villageController, decoration: const InputDecoration(labelText: 'Village')),
            const SizedBox(height: 16),
            TextField(controller: _districtController, decoration: const InputDecoration(labelText: 'District')),
            const SizedBox(height: 16),
            TextField(controller: _bioController, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _updateProfile,
                child: _isLoading ? const CircularProgressIndicator() : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
