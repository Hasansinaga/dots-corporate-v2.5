import { BluetoothEscposPrinter } from "@brooons/react-native-bluetooth-escpos-printer";

export interface BankReceiptHeader {
  bankName: string;
  receiptType: string;
  transactionId: string;
}

export interface BankReceiptBody {
  date: string;
  time: string;
  accountNumber: string;
  customerName: string;
  previousBalance: number;
  depositAmount: number;
  newBalance: number;
}

export interface BankReceiptFooter {
  printedBy: string;
  qrCode?: string;
  disclaimer?: string;
}

export interface BankReceiptData {
  header: BankReceiptHeader;
  body: BankReceiptBody;
  footer: BankReceiptFooter;
}

class BankReceiptService {
  static async printBankReceipt(data: BankReceiptData, printSettings?: any) {
    try {
      console.log("[bank-receipt-service] Received printSettings:", printSettings);
      if (!BluetoothEscposPrinter || typeof BluetoothEscposPrinter.printerInit !== 'function') {
        throw new Error('BluetoothEscposPrinter tidak tersedia. Pastikan library sudah ter-link dengan benar.');
      }

      await BluetoothEscposPrinter.printerInit();
      
      // Print Header
      await this.printHeader(data.header, printSettings);
      
      // Print Body
      await this.printBody(data.body, printSettings);
      
      // Print Footer
      await this.printFooter(data.footer, printSettings);

      await BluetoothEscposPrinter.printAndFeed(3);

      return { success: true, message: "Struk bank berhasil dicetak" };
    } catch (error) {
      console.error("[bank-receipt-print] Error:", error);
      throw error;
    }
  }

  static async printHeader(header: BankReceiptHeader, printSettings?: any) {
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

    const widthTimes = printSettings?.widthTimes || 0;
    const heightTimes = printSettings?.heightTimes || 0;
    const fontType = printSettings?.fontType || 1;
    
    console.log("[print-header] Using widthTimes:", widthTimes, "heightTimes:", heightTimes, "fontType:", fontType);

    // Bank Name
    await BluetoothEscposPrinter.printText(`${header.bankName}\n`, {
      encoding: 'UTF-8', 
      codepage: 0, 
      widthtimes: widthTimes, 
      heigthtimes: heightTimes, 
      fonttype: fontType
    });

    // Receipt Type
    await BluetoothEscposPrinter.printText(`${header.receiptType}\n`, {
      encoding: 'UTF-8', 
      codepage: 0, 
      widthtimes: widthTimes, 
      heigthtimes: heightTimes, 
      fonttype: fontType
    });

    // Separator
    await BluetoothEscposPrinter.printText("================================\n", {});
    
    // Transaction ID
    await BluetoothEscposPrinter.printText(`${header.transactionId}\n\n`, {});
  }

  static async printBody(body: BankReceiptBody, printSettings?: any) {
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    
    const widthTimes = printSettings?.widthTimes || 0;
    const heightTimes = printSettings?.heightTimes || 0;
    const fontType = printSettings?.fontType || 1;
    
    // Helper function untuk membuat text wrap otomatis
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
    
    // Helper function untuk membuat kolom yang rapi
    const printColumn = async (label: string, value: string, labelWidth: number = 15) => {
      const paddedLabel = label.padEnd(labelWidth);
      
      // Hitung lebar maksimal untuk value (total width - label width - ": " - margin)
      const maxValueWidth = 32 - labelWidth - 2; // 32 adalah lebar printer standar
      const wrappedLines = wrapText(value, maxValueWidth);
      
      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i];
        if (i === 0) {
          // Baris pertama dengan label
          await BluetoothEscposPrinter.printText(`${paddedLabel}: ${line}\n`, {
            encoding: 'UTF-8', 
            codepage: 0, 
            widthtimes: widthTimes, 
            heigthtimes: heightTimes, 
            fonttype: fontType
          });
        } else {
          // Baris selanjutnya tanpa label (wrap ke kolom yang sama)
          const emptyLabel = ' '.repeat(labelWidth + 2); // +2 untuk ": "
          await BluetoothEscposPrinter.printText(`${emptyLabel}${line}\n`, {
            encoding: 'UTF-8', 
            codepage: 0, 
            widthtimes: widthTimes, 
            heigthtimes: heightTimes, 
            fonttype: fontType
          });
        }
      }
    };
    
    // Transaction Details dengan format kolom yang rapi
    await printColumn("Tanggal", `${body.date}, ${body.time}`, 15);
    await printColumn("No Rekening", body.accountNumber, 15);
    await printColumn("Nama", body.customerName, 15);
    await printColumn("Saldo", `Rp ${body.previousBalance.toLocaleString('id-ID')},00`, 15);
    await printColumn("Setoran (*)", `Rp ${body.depositAmount.toLocaleString('id-ID')},00`, 15);
    await printColumn("Saldo Baru", `Rp ${body.newBalance.toLocaleString('id-ID')},00`, 15);
    
    // Tambahkan baris kosong
    await BluetoothEscposPrinter.printText("\n", {});
  }

  static async printFooter(footer: BankReceiptFooter, printSettings?: any) {
    const widthTimes = printSettings?.widthTimes || 0;
    const heightTimes = printSettings?.heightTimes || 0;
    const fontType = printSettings?.fontType || 1;

    // Separator
    await BluetoothEscposPrinter.printText("================================\n", {});
    
    // Printed By
    await BluetoothEscposPrinter.printText(`Dicetak Oleh: ${footer.printedBy}\n\n`, {
      encoding: 'UTF-8', 
      codepage: 0, 
      widthtimes: widthTimes, 
      heigthtimes: heightTimes, 
      fonttype: fontType
    });

    // Disclaimer
    const disclaimer = footer.disclaimer || "Bukti Penyetoran tunai yang sah dan telah disetujui oleh Kevin Durham\nDiterbitkan secara elektronik.\nSaldo di setor masuk ke saldo intransit(*) dan tidak bisa di kembalikan.";
    await BluetoothEscposPrinter.printText(`${disclaimer}\n\n`, {
      encoding: 'UTF-8', 
      codepage: 0, 
      widthtimes: widthTimes, 
      heigthtimes: heightTimes, 
      fonttype: fontType
    });

    // QR Code
    if (footer.qrCode) {
      await BluetoothEscposPrinter.printText(`[QR CODE: ${footer.qrCode}]\n`, {
        encoding: 'UTF-8', 
        codepage: 0, 
        widthtimes: widthTimes, 
        heigthtimes: heightTimes, 
        fonttype: fontType
      });
    } else {
      await BluetoothEscposPrinter.printText("[QR CODE]\n", {
        encoding: 'UTF-8', 
        codepage: 0, 
        widthtimes: widthTimes, 
        heigthtimes: heightTimes, 
        fonttype: fontType
      });
    }
  }

  static getSampleData(): BankReceiptData {
    const now = new Date();
    return {
      header: {
        bankName: "BPR Dev",
        receiptType: "Bukti Setoran Tabungan",
        transactionId: "T7371067682935914497"
      },
      body: {
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        accountNumber: "00102010037746",
        customerName: "Kevin Durham Surya Wijaya Putra", // Nama panjang untuk test wrap
        previousBalance: 3467407,
        depositAmount: 100000,
        newBalance: 3567407
      },
      footer: {
        printedBy: "dev9",
        qrCode: "QR123456789",
        disclaimer: "Bukti Penyetoran tunai yang sah dan telah disetujui oleh Kevin Durham\nDiterbitkan secara elektronik.\nSaldo di setor masuk ke saldo intransit(*) dan tidak bisa di kembalikan."
      }
    };
  }

  // Helper methods untuk membuat data secara terpisah
  static createHeader(bankName: string, receiptType: string, transactionId: string): BankReceiptHeader {
    return {
      bankName,
      receiptType,
      transactionId
    };
  }

  static createBody(
    date: string,
    time: string,
    accountNumber: string,
    customerName: string,
    previousBalance: number,
    depositAmount: number,
    newBalance: number
  ): BankReceiptBody {
    return {
      date,
      time,
      accountNumber,
      customerName,
      previousBalance,
      depositAmount,
      newBalance
    };
  }

  static createFooter(printedBy: string, qrCode?: string, disclaimer?: string): BankReceiptFooter {
    return {
      printedBy,
      qrCode,
      disclaimer
    };
  }
}

export default BankReceiptService;
