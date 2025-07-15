// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forwarding_rule.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ForwardingRuleAdapter extends TypeAdapter<ForwardingRule> {
  @override
  final int typeId = 0;

  @override
  ForwardingRule read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ForwardingRule(
      id: fields[0] as String?,
      name: fields[1] as String,
      isEnabled: fields[2] as bool,
      sourceType: fields[3] as String,
      sourceSender: fields[4] as String?,
      sourceKeywords: fields[5] as String?,
      destinationType: fields[6] as String,
      destinationAddress: fields[7] as String,
      createdAt: fields[8] as DateTime?,
      updatedAt: fields[9] as DateTime?,
      additionalSettings: (fields[10] as Map?)?.cast<String, dynamic>(),
    );
  }

  @override
  void write(BinaryWriter writer, ForwardingRule obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.isEnabled)
      ..writeByte(3)
      ..write(obj.sourceType)
      ..writeByte(4)
      ..write(obj.sourceSender)
      ..writeByte(5)
      ..write(obj.sourceKeywords)
      ..writeByte(6)
      ..write(obj.destinationType)
      ..writeByte(7)
      ..write(obj.destinationAddress)
      ..writeByte(8)
      ..write(obj.createdAt)
      ..writeByte(9)
      ..write(obj.updatedAt)
      ..writeByte(10)
      ..write(obj.additionalSettings);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ForwardingRuleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
