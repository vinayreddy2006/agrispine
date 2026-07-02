import 'package:flutter/material.dart';

class PlantDoctorScreen extends StatelessWidget {
  const PlantDoctorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plant Doctor')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.eco, size: 100, color: Colors.green),
            SizedBox(height: 16),
            Text('Coming Soon!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text('AI Disease Detection is under development.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
