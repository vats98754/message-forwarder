import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'forwarding_rule.g.dart';

@HiveType(typeId: 0)
class ForwardingRule extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  bool isEnabled;

  @HiveField(3)
  String sourceType; // 'sms', 'mms', 'email', 'notification'

  @HiveField(4)
  String? sourceSender; // Optional: filter by sender

  @HiveField(5)
  String? sourceKeywords; // Optional: filter by keywords

  @HiveField(6)
  String destinationType; // 'webhook', 'email', 'sms'

  @HiveField(7)
  String destinationAddress; // URL, email, or phone number

  @HiveField(8)
  DateTime createdAt;

  @HiveField(9)
  DateTime updatedAt;

  @HiveField(10)
  Map<String, dynamic>? additionalSettings; // For webhook headers, auth, etc.

  ForwardingRule({
    String? id,
    required this.name,
    this.isEnabled = true,
    required this.sourceType,
    this.sourceSender,
    this.sourceKeywords,
    required this.destinationType,
    required this.destinationAddress,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.additionalSettings,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  void updateTimestamp() {
    updatedAt = DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'isEnabled': isEnabled,
      'sourceType': sourceType,
      'sourceSender': sourceSender,
      'sourceKeywords': sourceKeywords,
      'destinationType': destinationType,
      'destinationAddress': destinationAddress,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'additionalSettings': additionalSettings,
    };
  }

  static ForwardingRule fromJson(Map<String, dynamic> json) {
    return ForwardingRule(
      id: json['id'],
      name: json['name'],
      isEnabled: json['isEnabled'] ?? true,
      sourceType: json['sourceType'],
      sourceSender: json['sourceSender'],
      sourceKeywords: json['sourceKeywords'],
      destinationType: json['destinationType'],
      destinationAddress: json['destinationAddress'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      additionalSettings: json['additionalSettings']?.cast<String, dynamic>(),
    );
  }

  @override
  String toString() {
    return 'ForwardingRule(id: $id, name: $name, enabled: $isEnabled, $sourceType -> $destinationType)';
  }
}
