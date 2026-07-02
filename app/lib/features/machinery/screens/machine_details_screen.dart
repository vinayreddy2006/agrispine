import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/machine_model.dart';
import '../providers/machinery_provider.dart';
import '../../auth/providers/auth_provider.dart';

class MachineDetailsScreen extends ConsumerStatefulWidget {
  final MachineModel machine;
  const MachineDetailsScreen({super.key, required this.machine});

  @override
  ConsumerState<MachineDetailsScreen> createState() => _MachineDetailsScreenState();
}

class _MachineDetailsScreenState extends ConsumerState<MachineDetailsScreen> {
  DateTime? _selectedDate;
  final _notesController = TextEditingController();

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  Future<void> _book() async {
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a date')));
      return;
    }
    
    final success = await ref.read(bookingProvider.notifier).bookMachine(
      widget.machine.id,
      _selectedDate!.toIso8601String(),
      _notesController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking request sent successfully!')));
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to book machine. Try again.')));
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isBooking = ref.watch(bookingProvider);
    final currentUser = ref.watch(authProvider).user;
    final isMyMachine = widget.machine.ownerName == currentUser?.name; // Simplistic check

    return Scaffold(
      appBar: AppBar(title: Text(widget.machine.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.agriculture, size: 100, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(widget.machine.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                Text('₹${widget.machine.pricePerHour}/hr', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const CircleAvatar(child: Icon(Icons.person)),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.machine.ownerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const Text('Machine Owner', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),
            Text(widget.machine.description, style: const TextStyle(fontSize: 16, height: 1.5)),
            const Divider(height: 48),

            if (!isMyMachine) ...[
              const Text('Request Booking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(_selectedDate == null ? 'Select Date' : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectDate,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _notesController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Additional Notes (Optional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isBooking ? null : _book,
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: isBooking ? const CircularProgressIndicator() : const Text('Book Now', style: TextStyle(fontSize: 18)),
                ),
              ),
            ] else ...[
              const Center(
                child: Text('You cannot book your own machine.', style: TextStyle(color: Colors.grey)),
              )
            ],
          ],
        ),
      ),
    );
  }
}
