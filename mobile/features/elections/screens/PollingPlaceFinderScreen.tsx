import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { openUrlSafely } from '../../../shared/utils/openUrl';
import { colors } from '../../../shared/theme/colors';

// NC County data with election office info
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

// Early voting locations for Mecklenburg County (Charlotte area)
const EARLY_VOTING_LOCATIONS = [
  {
    id: '1',
    name: 'Spectrum Center',
    address: '333 E Trade St, Charlotte, NC 28202',
    hours: 'Oct 17 - Nov 2: 8am - 7:30pm',
    type: 'early',
    distance: null,
  },
  {
    id: '2',
    name: 'Charlotte-Mecklenburg Government Center',
    address: '600 E Fourth St, Charlotte, NC 28202',
    hours: 'Oct 17 - Nov 2: 8am - 7:30pm',
    type: 'early',
    distance: null,
  },
  {
    id: '3',
    name: 'University City Regional Library',
    address: '301 E WT Harris Blvd, Charlotte, NC 28262',
    hours: 'Oct 17 - Nov 2: 8am - 7:30pm',
    type: 'early',
    distance: null,
  },
  {
    id: '4',
    name: 'South County Regional Library',
    address: '5801 Rea Rd, Charlotte, NC 28277',
    hours: 'Oct 17 - Nov 2: 8am - 7:30pm',
    type: 'early',
    distance: null,
  },
  {
    id: '5',
    name: 'Morrison Regional Library',
    address: '7015 Morrison Blvd, Charlotte, NC 28211',
    hours: 'Oct 17 - Nov 2: 8am - 7:30pm',
    type: 'early',
    distance: null,
  },
];

export default function PollingPlaceFinderScreen({ navigation }: any) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'polling' | 'early' | 'dropbox'>('polling');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  const requestLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to find polling places near you.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationPermission(true);

      // Simulate finding polling places based on location
      searchNearbyLocations();
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location. Please enter your address manually.');
    }
    setIsLoading(false);
  };

  const searchByAddress = () => {
    if (!address.trim()) {
      Alert.alert('Please enter an address', 'Enter your registered voting address to find your polling place.');
      return;
    }
    setIsLoading(true);
    setHasSearched(true);

    // Simulate API call delay
    setTimeout(() => {
      searchNearbyLocations();
      setIsLoading(false);
    }, 1000);
  };

  const searchNearbyLocations = () => {
    // In a real app, this would call the NC State Board of Elections API
    // or Open States / state Board of Elections
    setSearchResults(EARLY_VOTING_LOCATIONS.map((loc, index) => ({
      ...loc,
      distance: `${(0.5 + index * 1.2).toFixed(1)} mi`,
    })));
    setHasSearched(true);
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  const openNCVoterSearch = () => {
    openUrlSafely('https://vt.ncsbe.gov/RegLkup/');
  };

  const openNCPollingPlaceLookup = () => {
    openUrlSafely('https://vt.ncsbe.gov/PPLkup/');
  };

  const renderLocationCard = (location: any) => (
    <TouchableOpacity
      key={location.id}
      style={styles.locationCard}
      onPress={() => openInMaps(location.address)}
    >
      <View style={styles.locationHeader}>
        <View style={styles.locationIconContainer}>
          <Ionicons
            name={location.type === 'early' ? 'calendar' : 'location'}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{location.name}</Text>
          {location.distance && (
            <Text style={styles.locationDistance}>{location.distance}</Text>
          )}
        </View>
      </View>

      <View style={styles.locationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{location.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{location.hours}</Text>
        </View>
      </View>

      <View style={styles.locationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openInMaps(location.address)}
        >
          <Ionicons name="navigate" size={18} color={colors.white} />
          <Text style={styles.actionButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Find Your Polling Place</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Enter your registered address</Text>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="123 Main St, Charlotte, NC"
              placeholderTextColor={colors.textTertiary}
              value={address}
              onChangeText={setAddress}
              returnKeyType="search"
              onSubmitEditing={searchByAddress}
            />
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchByAddress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="search" size={20} color={colors.white} />
                <Text style={styles.searchButtonText}>Find Polling Place</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={requestLocation}
            disabled={isLoading}
          >
            <Ionicons name="locate" size={20} color={colors.primary} />
            <Text style={styles.locationButtonText}>Use My Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>NC Voter Tools</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={openNCPollingPlaceLookup}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickLinkTitle}>Official Lookup</Text>
              <Text style={styles.quickLinkSubtitle}>NC State Board</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={openNCVoterSearch}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickLinkTitle}>Verify Registration</Text>
              <Text style={styles.quickLinkSubtitle}>Check your status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => openUrlSafely('https://www.ncsbe.gov/voting/vote-mail')}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="mail" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickLinkTitle}>Absentee Ballot</Text>
              <Text style={styles.quickLinkSubtitle}>Vote by mail</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => navigation.navigate('SampleBallot')}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickLinkTitle}>Sample Ballot</Text>
              <Text style={styles.quickLinkSubtitle}>Preview your races</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        {hasSearched && (
          <View style={styles.tabsSection}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'polling' && styles.activeTab]}
                onPress={() => setSelectedTab('polling')}
              >
                <Text style={[styles.tabText, selectedTab === 'polling' && styles.activeTabText]}>
                  Election Day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'early' && styles.activeTab]}
                onPress={() => setSelectedTab('early')}
              >
                <Text style={[styles.tabText, selectedTab === 'early' && styles.activeTabText]}>
                  Early Voting
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'dropbox' && styles.activeTab]}
                onPress={() => setSelectedTab('dropbox')}
              >
                <Text style={[styles.tabText, selectedTab === 'dropbox' && styles.activeTabText]}>
                  Drop Boxes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Results */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            {selectedTab === 'polling' && (
              <View style={styles.electionDayInfo}>
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Election Day Polling</Text>
                    <Text style={styles.infoText}>
                      On Election Day (Nov 5, 2024), you must vote at your assigned precinct.
                      Use the official NC lookup tool to find your exact polling place.
                    </Text>
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={openNCPollingPlaceLookup}
                    >
                      <Text style={styles.infoButtonText}>Find My Precinct</Text>
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {selectedTab === 'early' && (
              <>
                <Text style={styles.resultsTitle}>
                  Early Voting Sites in Mecklenburg County
                </Text>
                <Text style={styles.resultsSubtitle}>
                  During early voting, you can vote at any location
                </Text>
                {searchResults.map(renderLocationCard)}
              </>
            )}

            {selectedTab === 'dropbox' && (
              <View style={styles.infoCard}>
                <Ionicons name="alert-circle" size={24} color="#D97706" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Ballot Drop Boxes</Text>
                  <Text style={styles.infoText}>
                    North Carolina does not currently use ballot drop boxes.
                    Absentee ballots must be returned by mail or in person to your county board of elections office.
                  </Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => openUrlSafely('https://www.ncsbe.gov/voting/vote-mail')}
                  >
                    <Text style={styles.infoButtonText}>Learn About Absentee Voting</Text>
                    <Ionicons name="open-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* County Contact Info */}
        <View style={styles.countySection}>
          <Text style={styles.sectionTitle}>NC County Election Offices</Text>
          <Text style={styles.sectionSubtitle}>
            Contact your county for specific questions
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countyScroll}
          >
            {NC_COUNTIES.map((county) => (
              <TouchableOpacity
                key={county.name}
                style={styles.countyCard}
                onPress={() => openUrlSafely(county.website)}
              >
                <Text style={styles.countyName}>{county.name}</Text>
                <Text style={styles.countySeat}>{county.seat}</Text>
                <View style={styles.countyPhone}>
                  <Ionicons name="call-outline" size={14} color={colors.primary} />
                  <Text style={styles.countyPhoneText}>{county.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Important Dates Reminder */}
        <View style={styles.reminderSection}>
          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="calendar" size={32} color={colors.white} />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>Don't Forget!</Text>
              <Text style={styles.reminderText}>
                Early voting: Oct 17 - Nov 2{'\n'}
                Election Day: November 5, 2024{'\n'}
                Polls open 6:30 AM - 7:30 PM
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchSection: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  locationButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quickLinksSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickLinkCard: {
    width: '47%',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickLinkSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  resultsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationDistance: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  locationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  electionDayInfo: {
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  countySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  countyScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  countyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  countyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countySeat: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countyPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  countyPhoneText: {
    fontSize: 12,
    color: colors.primary,
  },
  reminderSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  reminderIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});
