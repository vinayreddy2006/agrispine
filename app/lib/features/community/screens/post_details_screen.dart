import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/post_model.dart';
import '../providers/community_provider.dart';

class PostDetailsScreen extends ConsumerStatefulWidget {
  final PostModel post;
  const PostDetailsScreen({super.key, required this.post});

  @override
  ConsumerState<PostDetailsScreen> createState() => _PostDetailsScreenState();
}

class _PostDetailsScreenState extends ConsumerState<PostDetailsScreen> {
  final _commentController = TextEditingController();
  bool _isSubmitting = false;

  void _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isSubmitting = true);
    final success = await ref.read(communityProvider.notifier).addReply(widget.post.id, text);
    
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      _commentController.clear();
      // Refetch posts to get updated replies
      ref.refresh(communityProvider);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add comment')));
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Find the latest version of the post in state if available
    final posts = ref.watch(communityProvider).value ?? [];
    final currentPost = posts.firstWhere((p) => p.id == widget.post.id, orElse: () => widget.post);

    return Scaffold(
      appBar: AppBar(title: const Text('Discussion')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Main Post
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundImage: currentPost.authorImage.isNotEmpty ? NetworkImage(currentPost.authorImage) : null,
                        child: currentPost.authorImage.isEmpty ? const Icon(Icons.person) : null,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(currentPost.authorName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          if (currentPost.village.isNotEmpty)
                            Text(currentPost.village, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(currentPost.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                  const SizedBox(height: 8),
                  Text(currentPost.content, style: const TextStyle(fontSize: 16)),
                  const SizedBox(height: 16),
                  const Divider(),
                  const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 16),
                  // Comments List
                  if (currentPost.replies.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Center(child: Text('No comments yet. Be the first to reply!', style: TextStyle(color: Colors.grey))),
                    ),
                  ...currentPost.replies.map((reply) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const CircleAvatar(radius: 16, child: Icon(Icons.person, size: 16)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(reply['name'] ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text(reply['text'] ?? ''),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          // Comment Input
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.grey.withOpacity(0.2), spreadRadius: 1, blurRadius: 5, offset: const Offset(0, -1)),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.grey.shade200,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _isSubmitting ? null : _submitComment,
                  icon: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send, color: Colors.green),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
