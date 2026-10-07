import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import BiasIndicator from '../components/BiasIndicator';
import { colors } from '../theme/colors';

const SourceInfoScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About our sources</Text>
        <Text style={styles.intro}>
          We check where information comes from. Some sources are more reliable than others. Here's how we rate them.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source ratings</Text>
          
          <View style={styles.tierItem}>
            <BiasIndicator tier="most_reliable" />
            <Text style={styles.tierDescription}>
              Very reliable. Official sources, fact-checkers, or well-established news outlets known for accuracy.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="reliable" />
            <Text style={styles.tierDescription}>
              Generally reliable. Good track record, though may have some editorial perspective.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="use_caution" />
            <Text style={styles.tierDescription}>
              Use caution. May have significant bias or mix facts with opinion. Worth double-checking.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="highly_biased" />
            <Text style={styles.tierDescription}>
              Approach carefully. Strong bias or history of inaccuracy. Verify claims elsewhere.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How we check</Text>
          <Text style={styles.methodology}>
            We look at sources in a few ways:
          </Text>
          <Text style={styles.methodologyItem}>
            • We compare against known fact-checking databases
          </Text>
          <Text style={styles.methodologyItem}>
            • We look at the source's track record
          </Text>
          <Text style={styles.methodologyItem}>
            • We note user reports about broken or misleading links
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our goal</Text>
          <Text style={styles.whyMatters}>
            We want to help you find trustworthy information so you can make your own decisions. We don't tell you what to think—we just try to flag where the information comes from.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  intro: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  tierItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  methodology: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  methodologyItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  whyMatters: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default SourceInfoScreen;

