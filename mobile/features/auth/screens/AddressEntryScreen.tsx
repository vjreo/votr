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
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            {/* Stylized ocean/sunset illustration */}
            <View style={styles.sky}>
              <View style={styles.sun}>
                <View style={styles.sunRays} />
              </View>
              <View style={styles.birds}>
                <Text style={styles.bird}>~</Text>
                <Text style={[styles.bird, styles.bird2]}>~</Text>
              </View>
            </View>
            <View style={styles.waves}>
              <View style={styles.wave1} />
              <View style={styles.wave2} />
              <View style={styles.wave3} />
            </View>
            <View style={styles.boat}>
              <View style={styles.boatBody} />
              <View style={styles.boatMast} />
              <View style={styles.boatFlag} />
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
    width: 220,
    height: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#E8F4F8',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  sun: {
    position: 'absolute',
    top: 15,
    right: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5A962',
  },
  sunRays: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#F5A96230',
  },
  birds: {
    position: 'absolute',
    top: 25,
    left: 50,
  },
  bird: {
    fontSize: 16,
    color: colors.textTertiary,
    transform: [{ rotate: '10deg' }],
  },
  bird2: {
    marginLeft: 10,
    marginTop: -5,
    fontSize: 12,
  },
  waves: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  wave1: {
    position: 'absolute',
    bottom: 30,
    left: -20,
    right: -20,
    height: 50,
    backgroundColor: '#7EC8E3',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 60,
  },
  wave2: {
    position: 'absolute',
    bottom: 15,
    left: -10,
    right: -10,
    height: 45,
    backgroundColor: '#5DADE2',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 100,
  },
  wave3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: '#3498DB',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  boat: {
    position: 'absolute',
    bottom: 55,
    left: '35%',
    width: 40,
    height: 40,
  },
  boatBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 35,
    height: 12,
    backgroundColor: '#A0522D',
    borderRadius: 4,
    transform: [{ skewX: '-5deg' }],
  },
  boatMast: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    width: 3,
    height: 30,
    backgroundColor: '#8B4513',
  },
  boatFlag: {
    position: 'absolute',
    bottom: 30,
    left: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: colors.primary,
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
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
