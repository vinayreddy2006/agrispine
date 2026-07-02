import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../auth/providers/auth_provider.dart';

final socketProvider = Provider<IO.Socket?>((ref) {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated || authState.user == null) return null;

  final socket = IO.io('http://localhost:5000', IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

  socket.connect();
  socket.onConnect((_) {
    socket.emit('setup', authState.user!.id);
  });

  ref.onDispose(() {
    socket.disconnect();
    socket.dispose();
  });

  return socket;
});
