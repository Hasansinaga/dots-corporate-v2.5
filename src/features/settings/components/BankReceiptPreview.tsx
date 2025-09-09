import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BankReceiptData } from '../services/bankReceiptService';
import BankReceiptHeader from './BankReceiptHeader';
import BankReceiptBody from './BankReceiptBody';
import BankReceiptFooter from './BankReceiptFooter';
import { colors, spacing } from '../../../theme';

interface BankReceiptPreviewProps {
  data: BankReceiptData;
  // Font size settings
  fontSize?: number;
  bankNameSize?: number;
  receiptTypeSize?: number;
  transactionIdSize?: number;
  disclaimerSize?: number;
  qrCodeSize?: number;
  // Layout settings
  labelWidth?: number;
  showCurrency?: boolean;
  showQRCode?: boolean;
  // Container settings
  maxWidth?: number;
  backgroundColor?: string;
}

function BankReceiptPreview({
  data,
  fontSize = 12,
  bankNameSize = 18,
  receiptTypeSize = 14,
  transactionIdSize = 12,
  disclaimerSize = 10,
  qrCodeSize = 14,
  labelWidth = 15,
  showCurrency = true,
  showQRCode = true,
  maxWidth = 300,
  backgroundColor = colors.background
}: BankReceiptPreviewProps) {
  return (
    <ScrollView style={S.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={[S.container, { maxWidth, backgroundColor }]}>
        {/* Header */}
        <BankReceiptHeader
          data={data.header}
          fontSize={fontSize}
          bankNameSize={bankNameSize}
          receiptTypeSize={receiptTypeSize}
          transactionIdSize={transactionIdSize}
        />
        
        {/* Body */}
        <BankReceiptBody
          data={data.body}
          fontSize={fontSize}
          labelWidth={labelWidth}
          showCurrency={showCurrency}
        />
        
        {/* Footer */}
        <BankReceiptFooter
          data={data.footer}
          fontSize={fontSize}
          disclaimerSize={disclaimerSize}
          qrCodeSize={qrCodeSize}
          showQRCode={showQRCode}
        />
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: 8,
    shadowColor: colors.textSecondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default BankReceiptPreview;
