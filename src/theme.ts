// theme.ts

import { MD3LightTheme } from 'react-native-paper';

const theme = {
    ...MD3LightTheme,
    roundness: 50, // Adjust component border radius
    colors: {
        ...MD3LightTheme.colors,
        primary: '#173764',     // Main brand color
        secondary: '#F2F3F5',    // Secondary brand color
        background: '#f6f6f6',   // App background color
        surface: '#f6f6f6',      // Cards, sheets, etc.
        error: '#B00020',        // Error messages, etc.
        text: '#000000',         // Primary text color
        disabled: 'rgba(0, 0, 0, 0.38)',  // Disabled elements
        placeholder: 'rgba(0, 0, 0, 0.54)', // Input placeholder text
        //backdrop: 'rgba(0, 0, 0, 0.5)',     // Modal backdrop overlay
        notification: '#f50057', // Notification badge color
    },
    animation: {
        scale: 1.0, // Adjust the scale of animations
    },
    // You can add additional custom properties below as needed.
    // For example, custom spacing, typography overrides, or any extra values your app requires.
};

export default theme;
