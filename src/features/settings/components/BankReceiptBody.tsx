import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BankReceiptBody as BankReceiptBodyType } from '../services/bankReceiptService';
import { colors, spacing, typography } from '../../../theme';

interface BankReceiptBodyProps {
  data: BankReceiptBodyType;
  fontSize?: number;
  labelWidth?: number;
  showCurrency?: boolean;
}

function BankReceiptBody({
  data,
  fontSize = 12,
  labelWidth = 15,
  showCurrency = true
}: BankReceiptBodyProps) {
  const formatCurrency = (amount: number) => {
    if (!showCurrency) return amount.toLocaleString('id-ID');
    return `Rp ${amount.toLocaleString('id-ID')},00`;
  };

  const formatLabel = (label: string) => {
    return label.padEnd(labelWidth, ' ');
  };

  // Helper function untuk membuat text wrap otomatis (sama seperti di printer)
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Jika satu kata saja sudah lebih panjang dari maxWidth
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Helper function untuk render kolom dengan wrap
  const renderColumn = (label: string, value: string) => {
    const maxValueWidth = 32 - labelWidth - 2; // 32 adalah lebar printer standar
    const wrappedLines = wrapText(value, maxValueWidth);
    
    return (
      <View style={S.columnContainer}>
        {wrappedLines.map((line, index) => (
          <Text key={index} style={[S.detailRow, { fontSize: Math.max(fontSize, 1) }]}>
            {index === 0 ? (
              <>
                <Text style={S.label}>{formatLabel(label)}:</Text> {line}
              </>
            ) : (
              <Text style={S.wrappedText}>
                {' '.repeat(labelWidth + 2)}{line}
              </Text>
            )}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={S.container}>
      {/* Date and Time */}
      {renderColumn('Tanggal', `${data.date}, ${data.time}`)}
      
      {/* Account Number */}
      {renderColumn('No Rekening', data.accountNumber)}
      
      {/* Customer Name */}
      {renderColumn('Nama', data.customerName)}
      
      {/* Previous Balance */}
      {renderColumn('Saldo', formatCurrency(data.previousBalance))}
      
      {/* Deposit Amount */}
      {renderColumn('Setoran (*)', formatCurrency(data.depositAmount))}
      
      {/* New Balance */}
      {renderColumn('Saldo Baru', formatCurrency(data.newBalance))}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  columnContainer: {
    marginBottom: spacing.xs,
  },
  detailRow: {
    color: colors.text,
    marginBottom: spacing.xs,
    fontFamily: typography.primary.regular,
  },
  label: {
    fontWeight: '500',
    color: colors.text,
  },
  wrappedText: {
    color: colors.text,
    fontFamily: typography.primary.regular,
  },
});

export default BankReceiptBody;
