class ConversationModel {
  final String id;
  final bool isGroup;
  final String groupName;
  final List<dynamic> participants;
  final String lastMessageText;
  final String updatedAt;

  ConversationModel({
    required this.id, 
    required this.isGroup,
    required this.groupName,
    required this.participants, 
    required this.lastMessageText, 
    required this.updatedAt
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['_id'] ?? '',
      isGroup: json['isGroup'] ?? false,
      groupName: json['groupName'] ?? '',
      participants: json['participants'] ?? [],
      lastMessageText: json['latestMessage']?['text'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }
}
