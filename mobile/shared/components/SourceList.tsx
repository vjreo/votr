import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { CandidateSource } from '../types';
import BiasIndicator from './BiasIndicator';
import { colors } from '../theme/colors';

interface SourceListProps {
  sources: CandidateSource[];
  onSourcePress?: (source: CandidateSource) => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, onSourcePress }) => {
  const handlePress = async (source: CandidateSource) => {
    if (onSourcePress) {
      onSourcePress(source);
    } else {
      // Default: open URL
      const supported = await Linking.canOpenURL(source.url);
      if (supported) {
        await Linking.openURL(source.url);
      }
    }
  };

  const renderSource = ({ item }: { item: CandidateSource }) => (
    <TouchableOpacity
      style={styles.sourceItem}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceTitle} numberOfLines={1}>
          {item.title || getSourceTypeLabel(item.sourceType)}
        </Text>
        <BiasIndicator tier={item.biasTier} score={item.biasScore} size="small" />
      </View>
      <Text style={styles.sourceUrl} numberOfLines={1}>
        {item.url}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sources</Text>
      <Text style={styles.subtitle}>Ranked by reliability</Text>
      <FlatList
        data={sources}
        renderItem={renderSource}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

function getSourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    social_media: 'Social Media',
    news_article: 'News Article',
    official_website: 'Official Website',
    voting_resource: 'Voting Resource',
    other: 'Other Source',
  };
  return labels[type] || type;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  sourceItem: {
    padding: 12,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  sourceUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default SourceList;

