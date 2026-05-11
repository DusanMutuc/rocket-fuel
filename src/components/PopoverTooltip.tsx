import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { IconButton, Text, Button, Portal } from 'react-native-paper';
import Popover, { PopoverMode, PopoverPlacement } from 'react-native-popover-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderTooltipProps {
    tooltipText: string;
    icon?: string;        // Icon name (default: "help-circle-outline")
    iconSize?: number;    // Icon size (default: 24)
    containerStyle?: any; // Optional style override for the icon container
    popoverStyle?: any;   // Optional style override for the popover content
    offset?: number;      // Tooltip offset (default: -40)
    absolute?: boolean;   // Use absolute screen positioning when rendering inside page content
}

const HeaderTooltip: React.FC<HeaderTooltipProps> = ({
    tooltipText,
    icon = "help-circle-outline",
    iconSize = 24,
    containerStyle,
    popoverStyle,
    offset = -40,
    absolute = true,
}) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);

    const triggerRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

    // Calculate popover width as 90% of screen width, capped at 400 for larger screens.
    const popoverWidth = Math.min(width * 0.9, 400);

    const combinedContainerStyle = [
        styles.iconContainer,
        absolute && styles.absoluteIconContainer,
        absolute && { top: insets.top, right: insets.right + 10 },
        containerStyle,
    ];

    return (
        <>
            <TouchableOpacity
                ref={triggerRef}
                onPress={() => setVisible(true)}
                style={combinedContainerStyle}
            >
                <IconButton icon={icon} size={iconSize} />
            </TouchableOpacity>
            <Portal>
                <Popover
                    isVisible={visible}
                    onRequestClose={() => setVisible(false)}
                    from={triggerRef}
                    mode={PopoverMode.TOOLTIP}
                    placement={PopoverPlacement.BOTTOM}
                    displayArea={{ x: 0, y: 0, width, height }}
                    offset={offset}
                    popoverShift={{ x: 0, y: -0.5 }}
                    backgroundStyle={{ backgroundColor: 'transparent' }}
                    popoverStyle={[styles.popover, popoverStyle, { width: popoverWidth }]}
                >
                    <Text style={styles.popoverText}>{tooltipText}</Text>
                    <Button mode="text" onPress={() => setVisible(false)} style={styles.popoverButton}>
                        Got it
                    </Button>
                </Popover>
            </Portal>
        </>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 10,
    },
    absoluteIconContainer: {
        position: 'absolute',
    },
    popover: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    popoverText: {
        color: 'black',
        flexWrap: 'wrap',
    },
    popoverButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
});

export default HeaderTooltip;
