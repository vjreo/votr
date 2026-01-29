import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../../../../shared/components/ui';
import { useUser } from '../context/UserContext';
import { colors, shadows, borderRadius } from '../../../../shared/theme/colors';

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const AddressEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { updateLocation } = useUser();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      // Save location
      await updateLocation({
        address: `${address}, ${city}, ${state.toUpperCase()} ${zipCode}`,
        city,
        state: state.toUpperCase(),
        zipCode,
      });

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    } catch (error) {
      console.error('Error saving location:', error);
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
            Enter the address where you are registered to vote to view your ballot.
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
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          <Button
            title="Compare"
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
