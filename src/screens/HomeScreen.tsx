import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors as TColors, spacing, typography } from '../theme';
import { Users, History, FileText, Calculator, Briefcase } from 'lucide-react-native';
import { useAuth } from '../stores/useAuth';

const { width } = Dimensions.get('window');

const pick = (obj: any, keys: string[], fb: string) =>
  keys.reduce<string | undefined>((v, k) => v ?? obj?.[k], undefined) ?? fb;

const PRIMARY = pick(TColors, ['primaryColor', 'primary'], '#0E73E3');
const BG = pick(TColors, ['background'], '#FFFFFF');
const CARD = pick(TColors, ['inputBackground'], '#F5F7FA');
const TEXT = pick(TColors, ['text'], '#111827');
const TEXT_MUTED = pick(TColors, ['textSecondary'], '#6B7280');
const BORDER = pick(TColors, ['border'], '#E5E7EB');
const WARN_BG = '#FEF3C7';
const WARN_TEXT = '#B45309';

const formatIDR = (n: number) => 'Rp ' + (Math.floor(n) + '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const greet = (h: number) => (h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam');
const indoDate = (d: Date) => {
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()];
  const pad = (x:number)=> String(x).padStart(2,'0');
  return `${hari}, ${d.getDate()} ${bulan} ${d.getFullYear()} | ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type QuickActionProps = { label: string; onPress: () => void; icon: React.ReactNode; };
const QuickAction: React.FC<QuickActionProps> = ({ label, onPress, icon }) => (
  <Pressable style={S.quick} onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
    <View style={S.quickIconWrap}>{icon}</View>
    <Text style={S.quickLabel} numberOfLines={2} ellipsizeMode="clip">{label}</Text>
  </Pressable>
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const name = user?.name ?? 'User';

  const now = useMemo(() => new Date(), []);
  const greetText = `${greet(now.getHours())}, ${name}`;
  const dateText = indoDate(now);

  const [batchActive, setBatchActive] = useState(false);
  const [batchCode, setBatchCode] = useState<string | null>(null);
  const [totalMoney, setTotalMoney] = useState(1000);
  const [totalDeposit, setTotalDeposit] = useState(20);

  const startBatch = () => { setBatchActive(true); setBatchCode('B734211…'); };
  const finishTransfer = () => {};
  const stopBatch = () => { setBatchActive(false); setBatchCode(null); setTotalMoney(0); setTotalDeposit(0); };

  const actions: QuickActionProps[] = [
    { label: 'Daftar Nasabah', onPress: () => navigation.navigate('DaftarNasabah' as never), icon: <Users size={22} color={PRIMARY} /> },
    { label: 'Sejarah Batch', onPress: () => navigation.navigate('SejarahBatch' as never), icon: <History size={22} color={PRIMARY} /> },
    { label: 'Pengajuan\nPinjaman', onPress: () => navigation.navigate('PengajuanPinjaman' as never), icon: <FileText size={22} color={PRIMARY} /> },
    { label: 'Simulasi Kredit', onPress: () => navigation.navigate('SimulasiKredit' as never), icon: <Calculator size={22} color={PRIMARY} /> },
    { label: 'UKM', onPress: () => navigation.navigate('UKM' as never), icon: <Briefcase size={22} color={PRIMARY} /> },
  ];

  return (
    <SafeAreaView style={S.container} edges={['top','left','right']}>
      <View style={S.appbar}><Text style={S.appbarTitle}>BPR Dev</Text></View>

      <View style={S.body}>
        <View style={S.header}>
          <Text style={S.greet}>{greetText}</Text>
          <Text style={S.date}>{dateText}</Text>
        </View>

        <View style={S.card}>
          <View style={S.row}><Text style={S.cardLabel}>Batch</Text><Text style={S.cardValue}>{batchActive ? batchCode : '—'}</Text></View>
          <View style={[S.row,{marginTop:6}]}>
            <Text style={S.cardLabel}>Status</Text>
            <Text style={[S.badge, batchActive ? S.badgeActive : S.badgeInactive]}>{batchActive ? 'Active' : 'Inactive'}</Text>
          </View>

          <View style={S.statsWrap}>
            <View style={S.stat}><Text style={S.statLabel}>Jumlah Uang</Text><Text style={S.statValue}>{formatIDR(totalMoney)}</Text></View>
            <View style={S.dividerV} />
            <View style={S.stat}><Text style={S.statLabel}>Total Setoran</Text><Text style={S.statValue}>{totalDeposit}</Text></View>
          </View>

          {!batchActive ? (
            <Pressable style={S.cta} onPress={startBatch} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
              <Text style={S.ctaText}>Mulai Batch</Text>
            </Pressable>
          ) : (
            <View style={S.ctaBar}>
              <Pressable style={[S.ctaHalf,S.ctaGhost]} onPress={finishTransfer} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
                <Text style={S.ctaGhostText}>Selesai transfer</Text>
              </Pressable>
              <View style={S.dividerH} />
              <Pressable style={S.ctaHalf} onPress={stopBatch} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
                <Text style={S.ctaText}>Hentikan batch</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 4 per baris, item ke-5 turun sendiri */}
        <View style={S.quickRow}>
          {actions.map((a, i) => <QuickAction key={i} {...a} />)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const SIDE = spacing?.xl ?? 20;
const GAP = spacing?.md ?? 12;
// 4 kolom: ada 3 celah
const ITEM_W = (width - SIDE * 2 - GAP * 3) / 4;

const S = StyleSheet.create({
  container:{ flex:1, backgroundColor: BG },
  appbar:{ height:56, paddingHorizontal:SIDE, backgroundColor:PRIMARY, flexDirection:'row', alignItems:'center' },
  appbarTitle:{ color:'#fff', fontSize:18, letterSpacing:0.3, fontFamily: typography?.primary?.bold ?? 'System' },
  body:{ flex:1, paddingHorizontal:SIDE, paddingTop:SIDE, gap:16 },

  header:{ marginBottom:4 },
  greet:{ color:TEXT, fontSize:20, fontFamily: typography?.primary?.bold ?? 'System' },
  date:{ color:TEXT_MUTED, marginTop:4, fontSize:12 },

  card:{ backgroundColor: CARD, borderRadius:16, padding:16, borderWidth:1, borderColor:BORDER },
  row:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  cardLabel:{ color:TEXT_MUTED, fontSize:12 },
  cardValue:{ color:TEXT, fontSize:14, fontFamily: typography?.primary?.medium ?? 'System' },

  badge:{ paddingHorizontal:10, paddingVertical:4, borderRadius:999, fontSize:12, overflow:'hidden' },
  badgeInactive:{ color: WARN_TEXT, backgroundColor: WARN_BG },
  badgeActive:{ color:'#065F46', backgroundColor:'#D1FAE5' },

  statsWrap:{ marginTop:14, marginBottom:12, flexDirection:'row', alignItems:'stretch', backgroundColor:'#fff', borderRadius:12, overflow:'hidden', borderWidth:1, borderColor:BORDER },
  stat:{ flex:1, paddingVertical:12, paddingHorizontal:14, justifyContent:'center' },
  statLabel:{ color:TEXT_MUTED, fontSize:12, marginBottom:6 },
  statValue:{ color:TEXT, fontSize:18, fontFamily: typography?.primary?.bold ?? 'System' },
  dividerV:{ width:1, backgroundColor:BORDER },

  cta:{ marginTop:4, backgroundColor:PRIMARY, borderRadius:24, paddingVertical:12, alignItems:'center', elevation:2 },
  ctaText:{ color:'#fff', fontSize:15, fontFamily: typography?.primary?.bold ?? 'System', letterSpacing:0.2 },

  ctaBar:{ marginTop:4, flexDirection:'row', alignItems:'stretch', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:BORDER },
  ctaHalf:{ flex:1, paddingVertical:12, alignItems:'center', justifyContent:'center', backgroundColor:PRIMARY },
  ctaGhost:{ backgroundColor:'#FFFFFF' },
  ctaGhostText:{ color:TEXT, fontSize:15, fontFamily: typography?.primary?.medium ?? 'System' },
  dividerH:{ width:1, backgroundColor:BORDER },

  quickRow:{ marginTop:6, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  quick:{ width: ITEM_W, alignItems:'center', marginBottom: GAP },
  quickIconWrap:{ width:48, height:48, borderRadius:24, backgroundColor:'#EEF5FF', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#DCE8FF', marginBottom:8 },
  quickLabel:{ color:TEXT, textAlign:'center', fontSize:12, lineHeight:16 },
});
