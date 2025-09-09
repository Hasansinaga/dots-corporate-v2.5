import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BankReceiptFooter as BankReceiptFooterType } from '../services/bankReceiptService';
import { colors, spacing, typography } from '../../../theme';

interface BankReceiptFooterProps {
  data: BankReceiptFooterType;
  fontSize?: number;
  disclaimerSize?: number;
  qrCodeSize?: number;
  showQRCode?: boolean;
}

function BankReceiptFooter({
  data,
  fontSize = 12,
  disclaimerSize = 10,
  qrCodeSize = 14,
  showQRCode = true
}: BankReceiptFooterProps) {
  return (
    <View style={S.container}>
      {/* Separator */}
      <Text style={[S.separator, { fontSize: Math.max(fontSize, 1) }]}>
        ================================
      </Text>
      
      {/* Printed By */}
      <Text style={[S.printedBy, { fontSize: Math.max(fontSize, 1) }]}>
        Dicetak Oleh: {data.printedBy}
      </Text>
      
      {/* Disclaimer */}
      {data.disclaimer && (
        <View style={S.disclaimerContainer}>
          {data.disclaimer.split('\n').map((line, index) => (
            <Text key={index} style={[S.disclaimer, { fontSize: Math.max(disclaimerSize, 1) }]}>
              {line}
            </Text>
          ))}
        </View>
      )}
      
      {/* QR Code */}
      {showQRCode && (
        <View style={S.qrCodeContainer}>
          <Text style={[S.qrCode, { fontSize: Math.max(qrCodeSize, 1) }]}>
            {data.qrCode ? `[QR CODE: ${data.qrCode}]` : '[QR CODE]'}
          </Text>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  separator: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  printedBy: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  disclaimerContainer: {
    marginBottom: spacing.md,
  },
  disclaimer: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  qrCode: {
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.primary.regular,
    fontWeight: 'bold',
  },
});

export default BankReceiptFooter;
