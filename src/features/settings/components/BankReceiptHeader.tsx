import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BankReceiptHeader as BankReceiptHeaderType } from '../services/bankReceiptService';
import { colors, spacing, typography } from '../../../theme';

interface BankReceiptHeaderProps {
  data: BankReceiptHeaderType;
  fontSize?: number;
  bankNameSize?: number;
  receiptTypeSize?: number;
  transactionIdSize?: number;
}

function BankReceiptHeader({
  data,
  fontSize = 14,
  bankNameSize = 18,
  receiptTypeSize = 14,
  transactionIdSize = 12
}: BankReceiptHeaderProps) {
  return (
    <View style={S.container}>
      {/* Bank Name */}
      <Text style={[S.bankName, { fontSize: Math.max(bankNameSize, 1) }]}>
        {data.bankName}
      </Text>
      
      {/* Receipt Type */}
      <Text style={[S.receiptType, { fontSize: Math.max(receiptTypeSize, 1) }]}>
        {data.receiptType}
      </Text>
      
      {/* Separator */}
      <Text style={[S.separator, { fontSize: Math.max(fontSize, 1) }]}>
        ================================
      </Text>
      
      {/* Transaction ID */}
      <Text style={[S.transactionId, { fontSize: Math.max(transactionIdSize, 1) }]}>
        {data.transactionId}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bankName: {
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  receiptType: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  separator: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  transactionId: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: typography.primary.regular,
  },
});

export default BankReceiptHeader;
