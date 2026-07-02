import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../models/post_model.dart';

class CommunityNotifier extends AsyncNotifier<List<PostModel>> {
  @override
  Future<List<PostModel>> build() async {
    return _fetchPosts();
  }

  Future<List<PostModel>> _fetchPosts() async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/community/fetchall');
      return (response.data as List).map((e) => PostModel.fromJson(e)).toList();
    } catch (e, st) {
      throw e;
    }
  }

  Future<bool> createPost(String title, String content) async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/community/add', data: {'title': title, 'content': content});
      final newPost = PostModel.fromJson(response.data);
      if (state is AsyncData) {
        state = AsyncValue.data([newPost, ...state.value!]);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> addReply(String postId, String text) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/community/reply/$postId', data: {'text': text});
      return true;
    } catch (e) {
      return false;
    }
  }
}

final communityProvider = AsyncNotifierProvider<CommunityNotifier, List<PostModel>>(() {
  return CommunityNotifier();
});
