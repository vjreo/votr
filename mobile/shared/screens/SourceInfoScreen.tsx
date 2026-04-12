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
        <Text style={styles.title}>Understanding Bias Indicators</Text>
        <Text style={styles.intro}>
          We use a hybrid approach to analyze source reliability, combining machine learning,
          known bias databases, and user feedback to provide you with the most accurate
          information possible.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bias Tiers</Text>
          
          <View style={styles.tierItem}>
            <BiasIndicator tier="most_reliable" />
            <Text style={styles.tierDescription}>
              Sources with minimal bias, fact-based reporting, and high reliability.
              These are typically official government sources, peer-reviewed research,
              or established fact-checking organizations.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="reliable" />
            <Text style={styles.tierDescription}>
              Generally reliable sources with minor bias. These sources typically
              present facts accurately but may have slight editorial leanings.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="use_caution" />
            <Text style={styles.tierDescription}>
              Sources that may contain significant bias, opinion-heavy content, or
              selective fact presentation. Verify claims with additional sources.
            </Text>
          </View>

          <View style={styles.tierItem}>
            <BiasIndicator tier="highly_biased" />
            <Text style={styles.tierDescription}>
              Sources with strong bias, potential misinformation, or agenda-driven
              content. Use extreme caution and verify all claims independently.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Methodology</Text>
          <Text style={styles.methodology}>
            Our bias detection system combines three approaches:
          </Text>
          <Text style={styles.methodologyItem}>
            • Machine Learning Analysis: We analyze content for sentiment, language patterns,
            and fact-checking signals using advanced AI models.
          </Text>
          <Text style={styles.methodologyItem}>
            • Known Bias Databases: We cross-reference sources with established bias rating
            databases like Media Bias Fact Check and AllSides.
          </Text>
          <Text style={styles.methodologyItem}>
            • User Feedback: We incorporate feedback from our community to continuously
            improve our ratings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Matters</Text>
          <Text style={styles.whyMatters}>
            In today's information landscape, it's crucial to understand the reliability
            and potential bias of sources. Our goal is to help you make informed decisions
            by providing transparency about source quality, not by telling you what to think.
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

