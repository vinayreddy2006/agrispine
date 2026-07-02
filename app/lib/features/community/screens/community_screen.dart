import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/community_provider.dart';

class CommunityScreen extends ConsumerWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(communityProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Community')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/community/create'),
        child: const Icon(Icons.add),
      ),
      body: postsAsync.when(
        data: (posts) {
          if (posts.isEmpty) {
            return const Center(child: Text('No posts yet.', style: TextStyle(fontSize: 18, color: Colors.grey)));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(communityProvider.future),
            child: ListView.builder(
              itemCount: posts.length,
              itemBuilder: (context, index) {
                final post = posts[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: InkWell(
                    onTap: () => context.push('/community/details', extra: post),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundImage: post.authorImage.isNotEmpty ? NetworkImage(post.authorImage) : null,
                                child: post.authorImage.isEmpty ? const Icon(Icons.person) : null,
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(post.authorName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  if (post.village.isNotEmpty)
                                    Text(post.village, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(post.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                          const SizedBox(height: 4),
                          Text(post.content, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(Icons.thumb_up_alt_outlined, size: 20, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text('${post.likes}', style: TextStyle(color: Colors.grey.shade600)),
                              const SizedBox(width: 16),
                              Icon(Icons.comment_outlined, size: 20, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text('${post.replies.length} Replies', style: TextStyle(color: Colors.grey.shade600)),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error loading posts')),
      ),
    );
  }
}
