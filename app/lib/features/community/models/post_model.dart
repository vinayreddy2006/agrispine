class PostModel {
  final String id;
  final String title;
  final String content;
  final String authorName;
  final String authorImage;
  final String village;
  final String createdAt;
  final int likes;
  final List<dynamic> replies;

  PostModel({
    required this.id,
    required this.title,
    required this.content,
    required this.authorName,
    required this.authorImage,
    required this.village,
    required this.createdAt,
    required this.likes,
    required this.replies,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? 'Discussion',
      content: json['content'] ?? '',
      authorName: json['user']?['name'] ?? 'Unknown',
      authorImage: json['user']?['profileImage'] ?? '',
      village: json['user']?['village'] ?? '',
      createdAt: json['createdAt'] ?? '',
      likes: json['likes'] ?? 0,
      replies: json['replies'] ?? [],
    );
  }
}
