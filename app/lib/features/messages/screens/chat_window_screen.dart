import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/chat_provider.dart';

class ChatWindowScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String chatName;
  const ChatWindowScreen({super.key, required this.conversationId, required this.chatName});

  @override
  ConsumerState<ChatWindowScreen> createState() => _ChatWindowScreenState();
}

class _ChatWindowScreenState extends ConsumerState<ChatWindowScreen> {
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(chatProvider.notifier).init(widget.conversationId));
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;
    ref.read(chatProvider.notifier).sendMessage(widget.conversationId, _controller.text.trim());
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final chatMap = ref.watch(chatProvider);
    final chatState = chatMap[widget.conversationId] ?? ChatState(isLoading: true);
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: Text(widget.chatName)),
      body: Column(
        children: [
          Expanded(
            child: _buildChatList(chatState, currentUser),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.grey.shade200,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Theme.of(context).primaryColor,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildChatList(ChatState state, dynamic currentUser) {
    if (state.isLoading) return const Center(child: CircularProgressIndicator());
    if (state.error != null) return Center(child: Text('Error: ${state.error}'));
    
    return ListView.builder(
      itemCount: state.messages.length,
      itemBuilder: (context, index) {
        final msg = state.messages[index];
        final isMe = msg.senderId == currentUser?.id;
        return Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
            decoration: BoxDecoration(
              color: isMe ? Theme.of(context).primaryColor : Colors.grey[200],
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(0),
                bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(16),
              ),
            ),
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe && msg.senderName != 'Unknown')
                  Text(msg.senderName, style: TextStyle(color: Colors.grey.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                Text(
                  msg.text,
                  style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 15),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
