import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/chat_provider.dart';
import '../../auth/providers/auth_provider.dart';

class MessengerScreen extends ConsumerWidget {
  const MessengerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: conversationsAsync.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return const Center(child: Text('No conversations yet.', style: TextStyle(color: Colors.grey, fontSize: 16)));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(conversationsProvider.future),
            child: ListView.builder(
              itemCount: conversations.length,
              itemBuilder: (context, index) {
                final conv = conversations[index];
                
                String displayName = 'Unknown';
                String displayImage = '';
                
                if (conv.isGroup) {
                  displayName = conv.groupName.isNotEmpty ? conv.groupName : 'Group Chat';
                } else {
                  // Find the other participant
                  final otherUser = conv.participants.firstWhere(
                    (p) => p['_id'] != currentUser?.id && p['id'] != currentUser?.id,
                    orElse: () => null,
                  );
                  if (otherUser != null) {
                    displayName = otherUser['name'] ?? 'Unknown';
                    displayImage = otherUser['profileImage'] ?? '';
                  }
                }

                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: displayImage.isNotEmpty ? NetworkImage(displayImage) : null,
                    child: displayImage.isEmpty ? const Icon(Icons.person) : null,
                  ),
                  title: Text(displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(conv.lastMessageText.isEmpty ? 'Started a conversation' : conv.lastMessageText, maxLines: 1, overflow: TextOverflow.ellipsis),
                  onTap: () => context.push('/chat/${conv.id}', extra: displayName),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error loading messages')),
      ),
    );
  }
}
