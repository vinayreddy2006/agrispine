import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/dio_client.dart';
import '../models/user_model.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? error;

  AuthState({this.isLoading = false, this.isAuthenticated = false, this.user, this.error});

  AuthState copyWith({bool? isLoading, bool? isAuthenticated, UserModel? user, String? error, bool clearError = false}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  @override
  AuthState build() {
    Future.microtask(() => _checkAuthStatus());
    return AuthState();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      try {
        final dio = ref.read(dioProvider);
        final response = await dio.post('/auth/getuser');
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: UserModel.fromJson(response.data),
        );
        return;
      } catch (e) {
        await _storage.delete(key: 'auth_token');
      }
    }
    state = state.copyWith(isLoading: false, isAuthenticated: false);
  }

  Future<bool> login(String phone, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/login', data: {'phone': phone, 'password': password});
      final token = response.data['token'];
      if (token != null) {
        await _storage.write(key: 'auth_token', value: token);
        await _checkAuthStatus();
        return true;
      } else {
        state = state.copyWith(isLoading: false, error: 'Token missing in response');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Login failed');
    }
    return false;
  }

  Future<bool> register(String name, String phone, String village, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/auth/register', data: {
        'name': name, 'phone': phone, 'village': village, 'password': password, 'userType': 'farmer'
      });
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Registration failed');
    }
    return false;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    state = AuthState();
  }

  void updateUserLocally(UserModel updatedUser) {
    state = state.copyWith(user: updatedUser);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
