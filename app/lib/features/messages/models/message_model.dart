class MessageModel {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final String createdAt;

  MessageModel({
    required this.id, 
    required this.senderId, 
    required this.senderName, 
    required this.text, 
    required this.createdAt
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? '',
      senderId: json['senderId'] ?? json['sender'] ?? '',
      senderName: json['senderName'] ?? 'Unknown',
      text: json['text'] ?? '',
      createdAt: json['createdAt'] ?? '',
    );
  }
}
