import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../../shared/components/ui';
import { useUser } from '../context/UserContext';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';

// Parse "Street, City, ST ZIP" format
function parseAddress(fullAddress: string): { address: string; city: string; state: string; zipCode: string } {
  const parts = fullAddress.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) {
    return { address: fullAddress, city: '', state: '', zipCode: '' };
  }
  const street = parts.slice(0, -2).join(', ');
  const city = parts[parts.length - 2] || '';
  const lastPart = parts[parts.length - 1] || '';
  const match = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  const state = match ? match[1].toUpperCase() : '';
  const zipCode = match ? match[2] : lastPart;
  return { address: street, city, state, zipCode };
}

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const AddressEntryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateLocation, createAnonymousUser } = useUser();

  const isUpdateMode = navigation.canGoBack();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isUpdateMode && user?.location?.address) {
      const parsed = parseAddress(user.location.address);
      setAddress(parsed.address);
      setCity(parsed.city);
      setState(parsed.state || user.location.state || '');
      setZipCode(parsed.zipCode || user.location.zipCode || '');
    }
  }, [isUpdateMode, user?.location?.address, user?.location?.state, user?.location?.zipCode]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    } else if (!US_STATES.includes(state.toUpperCase())) {
      newErrors.state = 'Enter a valid state abbreviation';
    }
    if (!zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      newErrors.zipCode = 'Enter a valid zip code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompare = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const fullAddress = `${address.trim()}, ${city.trim()}, ${state.toUpperCase()} ${zipCode.trim()}`;
      const [geocodeResult] = await Location.geocodeAsync(fullAddress);

      if (!geocodeResult) {
        setErrors({ address: 'Could not find this address. Please check and try again.' });
        return;
      }

      const latitude = Number(geocodeResult.latitude);
      const longitude = Number(geocodeResult.longitude);
      const stateAbbr = state.toUpperCase();

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setErrors({ address: 'Could not resolve coordinates for this address.' });
        return;
      }

      let targetUserId = user?.id;
      if (!targetUserId) {
        const newUser = await createAnonymousUser();
        if (!newUser) {
          setErrors({ address: "Couldn't connect. Check that the backend is running and try again." });
          return;
        }
        targetUserId = newUser.id;
      }

      await updateLocation(
        {
          latitude,
          longitude,
          address: fullAddress,
          district: null,
          state: stateAbbr,
          zipCode: zipCode.trim(),
        },
        targetUserId
      );
      if (isUpdateMode) {
        (navigation as any).goBack();
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      const msg = error?.response?.data?.error || error?.message || 'Unable to save location. Please try again.';
      setErrors({ address: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isUpdateMode && (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={() => (navigation as any).goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {/* Illustration - Voting ballot theme */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <View style={styles.ballotCard}>
              <View style={styles.ballotLine} />
              <View style={[styles.ballotLine, styles.ballotLineShort]} />
              <View style={[styles.ballotLine, styles.ballotLineMedium]} />
              <View style={styles.checkmarkWrapper}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              </View>
            </View>
            <View style={styles.locationPin}>
              <Ionicons name="location" size={28} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Form Card */}
        <View style={[styles.card, shadows.medium as any]}>
          <Text style={styles.title}>
            {isUpdateMode
              ? 'Update your voting address to change your ballot.'
              : 'Enter the address where you are registered to vote to view your ballot.'}
          </Text>

          <Input
            label="Address"
            placeholder="525 N Tryon St"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            autoCapitalize="words"
          />

          <Input
            label="City"
            placeholder="Charlotte"
            value={city}
            onChangeText={setCity}
            error={errors.city}
            autoCapitalize="words"
          />

          <View style={styles.row}>
            <View style={styles.stateInput}>
              <Input
                label="State"
                placeholder="NC"
                value={state}
                onChangeText={(text) => setState(text.toUpperCase())}
                error={errors.state}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.zipInput}>
              <Input
                label="Zip code"
                placeholder="28202"
                value={zipCode}
                onChangeText={setZipCode}
                error={errors.zipCode}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <Button
            title={isUpdateMode ? 'Save address' : 'Compare'}
            onPress={handleCompare}
            loading={loading}
            fullWidth
            size="large"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    width: 200,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballotCard: {
    width: 140,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ballotLine: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 12,
    width: '100%',
  },
  ballotLineShort: {
    width: '70%',
  },
  ballotLineMedium: {
    width: '85%',
    marginBottom: 0,
  },
  checkmarkWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 14,
  },
  locationPin: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 24,
  },
  title: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  stateInput: {
    flex: 1,
  },
  zipInput: {
    flex: 1.5,
  },
});

export default AddressEntryScreen;
