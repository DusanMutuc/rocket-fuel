// src/navigation/RootNavigation.ts

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function resetToLogin() {
    if (navigationRef.isReady()) {
        console.log("Resetting navigation to login");
        navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' as never }],
        });
    } else {
        console.warn("Navigation is not ready yet");
    }
}
