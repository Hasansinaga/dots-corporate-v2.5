import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Text,
  Platform,
  StyleSheet,
  RefreshControl,
} from "react-native";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";

import { useCustomerListViewModel } from "./hooks/useCustomerListViewModel";
import { SearchBar } from "./components/SearchBar";
import { NplSummary } from "./components/NplSummary";
import { CollectibilityChips } from "./components/CollectibilityChips";
import { CustomerCard } from "./components/CustomerCard";

const COLL_COLORS: Record<string, string> = {
  "1": "#4CAF50",
  "2": "#FFC107",
  "3": "#FF9800",
  "4": "#F44336",
  "5": "#B71C1C",
};

export default function CustomerListScreen({ navigation }: any) {
  const vm = useCustomerListViewModel();
  const [filterOpen, setFilterOpen] = useState(false);

  // ⬇️ state lokal untuk pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await vm.search(); // atau ganti ke fungsi fetch-awal punyamu
    } finally {
      setRefreshing(false);
    }
  };

  const data = useMemo(
    () => vm.list.map((x) => ({ ...x, balanceFmt: vm.formatIDR(x.balance) })),
    [vm.list],
  );

  const renderRightTop = (item: any) => {
    if (vm.mode !== "kredit" || !item.collectibility) return null;
    const bg = COLL_COLORS[item.collectibility] ?? "#999";
    return (
      <View style={[S.badge, { backgroundColor: bg }]}>
        <Text style={S.badgeText}>{item.collectibility}</Text>
      </View>
    );
  };

  const Header = (
    <View>
      {/* Search + Filter button */}
      <View style={S.row}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={vm.query}
            onChangeText={vm.setQuery}
            onSubmit={vm.search}
            placeholder="Cari berdasarkan nama atau CIF"
            onClear={() => {
              vm.setQuery("");
              vm.search();
            }}
          />
        </View>

        <TouchableOpacity
          onPress={() => setFilterOpen((v) => !v)}
          style={[S.iconBtn, filterOpen && S.iconBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Buka filter"
        >
          <FontAwesome6
            name="filter"
            size={18}
            color={filterOpen ? "#0E73E3" : "#808080"}
          />
        </TouchableOpacity>
      </View>

      {/* Segmented tabs */}
      <View style={S.tabs}>
        <TouchableOpacity
          onPress={() => {
            vm.setMode("tabungan");
            setFilterOpen(false);
          }}
          style={[S.tab, vm.mode === "tabungan" && S.tabActive]}
        >
          <Text style={[S.tabText, vm.mode === "tabungan" && S.tabTextActive]}>
            Tabungan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => vm.setMode("kredit")}
          style={[S.tab, vm.mode === "kredit" && S.tabActive]}
        >
          <Text style={[S.tabText, vm.mode === "kredit" && S.tabTextActive]}>
            Kredit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kredit-only widgets */}
      {vm.mode === "kredit" && (
        <>
          <NplSummary amount={vm.npl.amount} percentage={vm.npl.percentage} />

          {filterOpen && (
            <View style={S.filterPanel}>
              <View style={S.filterHead}>
                <Text style={S.filterTitle}>Filter</Text>
                <TouchableOpacity
                  onPress={() => vm.setCollectibility([])}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={S.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>

              <CollectibilityChips
                max={vm.maxCollect}
                selected={vm.collectibility}
                onToggle={(v) =>
                  vm.setCollectibility((prev) =>
                    prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
                  )
                }
              />
            </View>
          )}
        </>
      )}
    </View>
  );

  const EmptyState = (
    <View style={S.empty}>
      <View style={S.emptyIcon}>
        <FontAwesome6 name="user-large" size={22} color="#9CA3AF" />
      </View>
      <Text style={S.emptyTitle}>Belum ada data</Text>
      <Text style={S.emptySub}>
        Coba ketik nama atau CIF lain, atau ubah filter.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={data}
        keyExtractor={(it, idx) => `${it.cif}-${idx}`}
        renderItem={({ item }) => (
          <CustomerCard
            item={item}
            rightTop={renderRightTop(item)}
            onPress={() => navigation.navigate("Details", { item, activeTab: vm.mode })}
          />
        )}
        ListHeaderComponent={Header}
        ListEmptyComponent={!vm.loading ? EmptyState : null}
        ListFooterComponent={
          vm.loading ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
        onEndReached={vm.loadMore}
        onEndReachedThreshold={0.15}
        contentContainerStyle={{ paddingBottom: 16 }}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    paddingBottom: 10,
    backgroundColor: "#fff",
    // sticky header shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  iconBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  iconBtnActive: { borderColor: "#0E73E3" },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#EEF5FF", borderColor: "#DCE8FF" },
  tabText: { color: "#6B7280", fontWeight: "600" },
  tabTextActive: { color: "#0E73E3" },

  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  filterHead: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTitle: { fontWeight: "700", fontSize: 13, color: "#111827" },
  resetText: { color: "#0E73E3", fontWeight: "700", fontSize: 12 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontWeight: "bold" },

  empty: {
    paddingTop: 48,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  emptySub: { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 4 },
});
