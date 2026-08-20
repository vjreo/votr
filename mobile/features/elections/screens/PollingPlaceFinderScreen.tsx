import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ScreenHeader } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import {
  openUrlSafely,
  NC_POLLING_PLACE_URL,
  NC_REGISTRATION_URL,
} from '../../../shared/utils/openUrl';
import { colors, typography, borderRadius } from '../../../shared/theme/colors';

const NC_COUNTIES = [
  { name: 'Mecklenburg', seat: 'Charlotte', phone: '(704) 336-2133', website: 'https://www.mecknc.gov/BOE' },
  { name: 'Wake', seat: 'Raleigh', phone: '(919) 857-6400', website: 'https://www.wakegov.com/elections' },
  { name: 'Guilford', seat: 'Greensboro', phone: '(336) 641-3836', website: 'https://www.guilfordcountync.gov/our-county/board-of-elections' },
  { name: 'Forsyth', seat: 'Winston-Salem', phone: '(336) 703-2800', website: 'https://www.forsyth.cc/elections/' },
  { name: 'Cumberland', seat: 'Fayetteville', phone: '(910) 678-7733', website: 'https://www.cumberlandcountync.gov/departments/board-of-elections-group/board-of-elections' },
  { name: 'Durham', seat: 'Durham', phone: '(919) 560-0700', website: 'https://www.dcovotes.com/' },
  { name: 'Buncombe', seat: 'Asheville', phone: '(828) 250-4200', website: 'https://www.buncombecounty.org/governing/depts/election/default.aspx' },
  { name: 'Union', seat: 'Monroe', phone: '(704) 283-3804', website: 'https://www.unioncountync.gov/government/departments-f-z/voter-registration-elections' },
  { name: 'Cabarrus', seat: 'Concord', phone: '(704) 920-2860', website: 'https://www.cabarruscounty.us/Government/Departments/Board-of-Elections' },
  { name: 'Gaston', seat: 'Gastonia', phone: '(704) 862-7610', website: 'https://www.gastongov.com/government/departments/board_of_elections/index.php' },
];

export default function PollingPlaceFinderScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const address = user?.location?.address;

  const openMaps = (query: string) => {
    const encoded = encodeURIComponent(query);
    const url = Platform.select({
      ios: `maps:?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Polling place"
        subtitle="Official NC lookup — we don’t invent locations"
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {address ? (
            <Text style={styles.address}>{address}</Text>
          ) : (
            <Text style={styles.addressMuted}>
              Add your voting address in Profile so lookups match your ballot.
            </Text>
          )}
          <Button
            title="Find my polling place"
            onPress={() => openUrlSafely(NC_POLLING_PLACE_URL)}
            fullWidth
          />
          <Button
            title="Check registration"
            onPress={() => openUrlSafely(NC_REGISTRATION_URL)}
            variant="secondary"
            fullWidth
          />
        </View>

        <Text style={styles.sectionTitle}>County election offices</Text>
        <Text style={styles.sectionHint}>Call or visit your county board if you need a paper ballot or accessibility help.</Text>
        {NC_COUNTIES.map((county) => (
          <View key={county.name} style={styles.countyCard}>
            <View style={styles.countyTop}>
              <Text style={styles.countyName}>{county.name} County</Text>
              <Text style={styles.countySeat}>{county.seat}</Text>
            </View>
            <View style={styles.countyActions}>
              <TouchableOpacity
                style={styles.countyBtn}
                onPress={() => Linking.openURL(`tel:${county.phone.replace(/\D/g, '')}`)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${county.name} elections office`}
              >
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={styles.countyBtnText}>{county.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.countyBtn}
                onPress={() => openUrlSafely(county.website)}
                accessibilityRole="link"
                accessibilityLabel={`${county.name} elections website`}
              >
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={styles.countyBtnText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.countyBtn}
                onPress={() => openMaps(`${county.seat}, NC`)}
                accessibilityRole="button"
                accessibilityLabel={`Map ${county.seat}`}
              >
                <Ionicons name="map-outline" size={16} color={colors.primary} />
                <Text style={styles.countyBtnText}>Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    marginHorizontal: 20,
    marginBottom: 28,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    gap: 10,
  },
  address: {
    ...typography.callout,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressMuted: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textTertiary,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  sectionHint: {
    ...typography.footnote,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  countyCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  countyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  countyName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  countySeat: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  countyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  countyBtnText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.primary,
  },
});
