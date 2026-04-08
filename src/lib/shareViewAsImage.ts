import { Platform } from 'react-native';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

interface ViewTargetRef {
  current: View | null;
}

const waitForNextFrame = () =>
  new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve());
  });

export const isNativeImageSharingAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  return Sharing.isAvailableAsync();
};

export const shareViewAsImage = async (targetRef: ViewTargetRef): Promise<void> => {
  if (!targetRef.current) {
    throw new Error('Share target is not mounted.');
  }

  await waitForNextFrame();

  const uri = await captureRef(targetRef.current, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: 'Share your progress',
  });
};
