import { Linking, Alert, Platform } from 'react-native';

const NC_BALLOT_URL = 'https://vt.ncsbe.gov/BallotLkup/';
const NC_REGISTRATION_URL = 'https://vt.ncsbe.gov/RegLkup/';
const NC_POLLING_PLACE_URL = 'https://vt.ncsbe.gov/PPLkup/';

/**
 * Safely open a URL with error handling
 */
export async function openUrlSafely(url: string, fallbackLabel?: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      if (__DEV__) {
        console.warn('Linking.canOpenURL returned false for:', url);
      }
      Alert.alert(
        "Can't Open Link",
        `Unable to open this link. You can try visiting manually:\n${url}`,
        [{ text: 'OK' }]
      );
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (__DEV__) {
      console.warn('Linking.openURL failed:', message, url);
    }
    Alert.alert(
      "Couldn't Open Link",
      `There was a problem opening the link. You can try visiting in your browser:\n${url}`,
      [{ text: 'OK' }]
    );
    return false;
  }
}

export { NC_BALLOT_URL, NC_REGISTRATION_URL, NC_POLLING_PLACE_URL };
