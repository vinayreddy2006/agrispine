import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import 'socket_provider.dart';

final conversationsProvider = FutureProvider<List<ConversationModel>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/chat/conversations');
  return (response.data as List).map((e) => ConversationModel.fromJson(e)).toList();
});

class ChatState {
  final bool isLoading;
  final List<MessageModel> messages;
  final String? error;

  ChatState({this.isLoading = false, this.messages = const [], this.error});

  ChatState copyWith({bool? isLoading, List<MessageModel>? messages, String? error}) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      error: error ?? this.error,
    );
  }
}

class ChatMapNotifier extends Notifier<Map<String, ChatState>> {
  @override
  Map<String, ChatState> build() {
    return {};
  }

  void init(String conversationId) {
    if (state.containsKey(conversationId)) return;
    
    Future.microtask(() {
      state = {...state, conversationId: ChatState(isLoading: true)};
      _fetchMessages(conversationId);
      _listenToSocket(conversationId);
    });
  }

  void _updateState(String conversationId, ChatState newState) {
    state = {...state, conversationId: newState};
  }

  Future<void> _fetchMessages(String conversationId) async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/chat/messages/$conversationId');
      final msgs = (response.data as List).map((e) => MessageModel.fromJson(e)).toList();
      _updateState(conversationId, state[conversationId]!.copyWith(isLoading: false, messages: msgs));
    } catch (e) {
      _updateState(conversationId, state[conversationId]!.copyWith(isLoading: false, error: e.toString()));
    }
  }

  void _listenToSocket(String conversationId) {
    final socket = ref.read(socketProvider);
    if (socket == null) return;
    
    socket.emit('join_conversation', {'conversationId': conversationId});
    
    socket.on('receive_message', (data) {
      if (data['conversationId'] != conversationId) return;
      final newMsg = MessageModel.fromJson(data);
      final current = state[conversationId] ?? ChatState();
      _updateState(conversationId, current.copyWith(messages: [...current.messages, newMsg]));
    });
  }

  Future<void> sendMessage(String conversationId, String text) async {
    try {
      final socket = ref.read(socketProvider);
      if (socket == null) return;
      
      final data = {
        'conversationId': conversationId,
        'text': text,
        // Optional: you can include senderId if the backend doesn't resolve it from auth logic automatically
      };
      
      socket.emit('send_message', data);
      
      // We don't manually add the message here, wait for the 'receive_message' event!
      // But we could optimistically add it if we want.
    } catch (e) {
      // Handle error
    }
  }
}

final chatProvider = NotifierProvider<ChatMapNotifier, Map<String, ChatState>>(() {
  return ChatMapNotifier();
});
