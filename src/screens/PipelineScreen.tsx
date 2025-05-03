import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, ScrollView, View, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types/Client';
import PopoverTooltip from '../components/PopoverTooltip';

import {
    ActivityIndicator,
    Button as PaperButton,
    Portal,
    Modal as PaperModal,
    Text as PaperText,
    TextInput as PaperTextInput,
    Surface,
    TouchableRipple,
    IconButton,
    useTheme,
    Snackbar,
    FAB,
} from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// ---------- EditPipelineClientModal Component ----------
const EditPipelineClientModal = ({
    visible,
    onDismiss,
    client,
    onSave,
}: {
    visible: boolean;
    onDismiss: () => void;
    client: Client | null;
    onSave: (updatedClient: {
        first_name: string;
        last_name: string;
        temperature: string;
        pipeline_note: string;
    }) => void;
}) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [temperature, setTemperature] = useState('lukewarm');
    const [pipelineNote, setPipelineNote] = useState('');

    React.useEffect(() => {
        if (client) {
            setFirstName(client.first_name);
            setLastName(client.last_name || '');
            setTemperature(client.temperature || 'lukewarm');
            setPipelineNote(client.pipeline_note || '');
        }
    }, [client]);

    const handleSave = () => {
        onSave({
            first_name: firstName,
            last_name: lastName,
            temperature,
            pipeline_note: pipelineNote,
        });
    };

    return (
        <PaperModal
            visible={visible}
            onDismiss={onDismiss}
            contentContainerStyle={modalStyles.modalContent}
        >
            <ScrollView>
                <PaperText style={modalStyles.modalHeader}>Edit Pipeline Client</PaperText>
                <PaperText style={modalStyles.label}>First Name</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <PaperText style={modalStyles.label}>Last Name</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={lastName}
                    onChangeText={setLastName}
                />
                <PaperText style={modalStyles.label}>Temperature</PaperText>
                <Surface style={modalStyles.pickerContainer}>
                    <Picker
                        selectedValue={temperature}
                        onValueChange={(value) => setTemperature(value)}
                        mode="dialog"
                        style={modalStyles.picker}
                    >
                        <Picker.Item label="Lukewarm" value="lukewarm" />
                        <Picker.Item label="Warm" value="warm" />
                        <Picker.Item label="Hot" value="hot" />
                    </Picker>
                </Surface>
                <PaperText style={modalStyles.label}>Pipeline Note</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={pipelineNote}
                    onChangeText={setPipelineNote}
                />
                <PaperButton
                    mode="contained"
                    onPress={handleSave}
                    style={modalStyles.modalButton}
                >
                    Save Changes
                </PaperButton>
                <PaperButton
                    mode="contained"
                    onPress={onDismiss}
                    style={modalStyles.modalButton}
                >
                    Cancel
                </PaperButton>
            </ScrollView>
        </PaperModal>
    );
};

// ---------- Main PipelineScreen Component ----------
const PipelineScreen = () => {
    const { user } = useAuth();
    const [pipelineClients, setPipelineClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ---------- Modal Visibility States ----------
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [prospectModalVisible, setProspectModalVisible] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // ---------- State for listing Prospects ----------
    const [prospects, setProspects] = useState<Client[]>([]);
    const [pipelineTypeId, setPipelineTypeId] = useState<number | null>(null);

    // For "Remove from Pipeline" confirmation
    const [removeModalVisible, setRemoveModalVisible] = useState<boolean>(false);
    const [clientToRemove, setClientToRemove] = useState<Client | null>(null);

    // Snackbar state
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnack = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    // ---------- Fetch Pipeline Clients ----------
    React.useEffect(() => {
        const fetchPipelineClients = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                uid: user.id,
                client_type_name: 'Pipeline',
            });
            if (error) {
                setError(error.message);
            } else if (data) {
                setPipelineClients(data);
            }
            setLoading(false);
        };

        fetchPipelineClients();
    }, [user]);

    // ---------- Fetch Prospects ----------
    const fetchProspects = async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_prospects_not_in_pipeline', {
            uid: user.id,
        });
        if (error) {
            showSnack(`Error fetching prospects: ${error.message}`);
        } else if (data) {
            setProspects(data);
        }
    };

    // ---------- Fetch Pipeline Type ID ----------
    React.useEffect(() => {
        const fetchPipelineTypeId = async () => {
            const { data, error } = await supabase
                .from('client_types')
                .select('id')
                .eq('name', 'Pipeline')
                .single();
            if (error) {
                console.error('Error fetching pipeline type id:', error);
            } else if (data) {
                setPipelineTypeId(data.id);
            }
        };
        fetchPipelineTypeId();
    }, []);

    // ---------- Refresh Pipeline Clients ----------
    const refreshPipelineClients = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_clients_by_client_type', {
            uid: user.id,
            client_type_name: 'Pipeline',
        });
        if (!error && data) {
            setPipelineClients(data);
        }
        setLoading(false);
    };

    const getBackgroundColor = (temperature: string) => {
        switch (temperature) {
            case 'lukewarm':
                return '#FFFACD'; // LemonChiffon
            case 'warm':
                return '#FFDAB9'; // PeachPuff
            case 'hot':
                return '#FFA07A'; // LightSalmon
            default:
                return '#F0F0F0';
        }
    };

    const renderPipelineItem = ({ item }: { item: Client }) => (
        <Surface
            style={[
                styles.itemContainer,
                { backgroundColor: getBackgroundColor(item.temperature) },
            ]}
        >
            <TouchableRipple onPress={() => handleEditPress(item)}>
                <View>
                    <PaperText style={styles.name}>
                        {item.first_name} {item.last_name || ''}
                    </PaperText>
                    <PaperText style={styles.temperature}>Temperature: {item.temperature}</PaperText>
                    {item.pipeline_note && (
                        <PaperText style={styles.note}>
                            Pipeline Note: {item.pipeline_note}
                        </PaperText>
                    )}
                    <PaperText style={styles.createdAt}>
                        Logged At: {new Date(item.created_at).toLocaleString()}
                    </PaperText>
                </View>
            </TouchableRipple>
            <IconButton
                icon="delete"
                size={scale(20)}
                style={styles.deleteIcon}
                onPress={() => confirmRemove(item)}
            />
        </Surface>
    );

    const handleEditPress = (client: Client) => {
        setSelectedClient(client);
        setEditModalVisible(true);
    };

    const handleUpdateClient = async (updatedFields: {
        first_name: string;
        last_name: string;
        temperature: string;
        pipeline_note: string;
    }) => {
        if (!user || !selectedClient) {
            showSnack('No user or client selected');
            return;
        }
        if (!updatedFields.first_name.trim()) {
            showSnack('First name is required');
            return;
        }
        const { error } = await supabase
            .from('clients')
            .update(updatedFields)
            .eq('client_id', selectedClient.client_id);
        if (error) {
            showSnack(`Error updating client: ${error.message}`);
        } else {
            showSnack('Client updated successfully');
            setEditModalVisible(false);
            setSelectedClient(null);
            refreshPipelineClients();
        }
    };

    const handleAddToPipeline = async (clientId: string) => {
        if (!pipelineTypeId) {
            showSnack('Pipeline type not found');
            return;
        }
        const { error } = await supabase.from('client_client_types').insert([
            {
                client_id: clientId,
                client_type_id: pipelineTypeId,
            },
        ]);
        if (error) {
            showSnack(`Error adding to pipeline: ${error.message}`);
        } else {
            showSnack('Added to pipeline');
            refreshPipelineClients();
            setProspectModalVisible(false);
        }
    };

    const renderProspectItem = ({ item }: { item: Client }) => (
        <Surface style={styles.prospects}>
            <PaperText style={[styles.nameProspect, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                {item.first_name} {item.last_name || ''}
            </PaperText>
            <FAB icon="plus" onPress={() => handleAddToPipeline(item.client_id)} style={styles.FAB} />
        </Surface>
    );

    const confirmRemove = (client: Client) => {
        setClientToRemove(client);
        setRemoveModalVisible(true);
    };

    const handleRemoveConfirm = async () => {
        if (!clientToRemove) return;
        try {
            const pipelineType = pipelineTypeId ?? 3;
            const { error } = await supabase
                .from('client_client_types')
                .delete()
                .eq('client_id', clientToRemove.client_id)
                .eq('client_type_id', pipelineType);
            if (error) {
                showSnack(`Error removing from pipeline: ${error.message}`);
            } else {
                showSnack('Removed from pipeline');
                refreshPipelineClients();
            }
        } catch (err: any) {
            showSnack(`Error removing from pipeline: ${err.message}`);
        }
        setRemoveModalVisible(false);
        setClientToRemove(null);
    };

    const handleRemoveCancel = () => {
        setRemoveModalVisible(false);
        setClientToRemove(null);
    };

    if (loading) {
        return (
            <Surface style={styles.center}>
                <ActivityIndicator animating={true} size="large" />
            </Surface>
        );
    }
    if (error) {
        return (
            <Surface style={styles.center}>
                <PaperText>Error: {error}</PaperText>
            </Surface>
        );
    }

    return (
        <Surface style={styles.container}>
            {/* Render standardized PopoverTooltip at the top-right */}
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Pipeline Contacts screen! Here you can manage your pipeline contacts and add prospects to the pipeline."
                }
            />
            <PaperText style={styles.header}>Pipeline Contacts</PaperText>
            <FlatList
                data={pipelineClients}
                keyExtractor={(item) => item.client_id}
                renderItem={renderPipelineItem}
                contentContainerStyle={styles.listContent}
            />
            <PaperButton
                mode="contained"
                onPress={() => {
                    setProspectModalVisible(true);
                    fetchProspects();
                }}
                style={styles.addButton}
            >
                Add Prospect to Pipeline
            </PaperButton>

            <Portal>
                {/* Prospect Modal */}
                <PaperModal
                    visible={prospectModalVisible}
                    onDismiss={() => setProspectModalVisible(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <PaperText style={styles.modalHeader}>Select a Prospect</PaperText>
                    <FlatList
                        data={prospects}
                        keyExtractor={(item) => item.client_id}
                        renderItem={renderProspectItem}
                        contentContainerStyle={styles.listContent}
                    />
                    <PaperButton
                        mode="contained"
                        onPress={() => setProspectModalVisible(false)}
                        style={styles.closeButton}
                    >
                        Close
                    </PaperButton>
                </PaperModal>

                {/* Edit Client Modal */}
                <EditPipelineClientModal
                    visible={editModalVisible}
                    onDismiss={() => setEditModalVisible(false)}
                    client={selectedClient}
                    onSave={handleUpdateClient}
                />

                {/* Remove Confirmation Modal */}
                <PaperModal
                    visible={removeModalVisible}
                    onDismiss={handleRemoveCancel}
                    contentContainerStyle={styles.modalContent}
                >
                    <Surface style={styles.removeModalInner}>
                        <PaperText style={styles.modalHeader}>
                            Remove this client from the pipeline?
                        </PaperText>
                        <PaperButton
                            mode="contained"
                            onPress={handleRemoveConfirm}
                            style={styles.modalButton}
                        >
                            Yes
                        </PaperButton>
                        <PaperButton
                            mode="contained"
                            onPress={handleRemoveCancel}
                            style={styles.modalButton}
                        >
                            No
                        </PaperButton>
                    </Surface>
                </PaperModal>
            </Portal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                action={{
                    label: 'OK',
                    onPress: () => setSnackbarVisible(false),
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: scale(16) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: scale(24), fontWeight: 'bold', marginBottom: scale(16), textAlign: 'center' },
    listContent: { paddingBottom: scale(16) },
    itemContainer: {
        position: 'relative',
        borderWidth: scale(1),
        borderColor: '#ccc',
        borderRadius: scale(16),
        padding: scale(12),
        marginBottom: scale(12),
    },
    prospects: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: scale(3),
        borderColor: '#505050',
        borderWidth: scale(1),
        marginTop: scale(16),
        borderRadius: scale(60),
        backgroundColor: '#f6f6f6',
    },
    headerLeftPlaceholder: { width: 44 },
    name: { fontSize: scale(18), fontWeight: '600' },
    nameProspect: { fontSize: scale(18), fontWeight: '600', marginLeft: scale(10) },
    temperature: { fontSize: scale(16), marginBottom: scale(4) },
    note: { fontSize: scale(14), color: '#555' },
    createdAt: { fontSize: scale(12), color: '#555', marginTop: scale(4) },
    deleteIcon: {
        position: 'absolute',
        bottom: scale(8),
        right: scale(8),
    },
    addButton: {
        marginTop: scale(16),
        width: '70%',
        alignContent: 'center',
        alignSelf: 'center',
    },
    addButtonSmall: { marginTop: scale(4) },
    closeButton: { marginTop: scale(12) },
    modalContent: {
        backgroundColor: '#fff',
        padding: scale(10),
        margin: scale(10),
        borderRadius: scale(20),
        maxHeight: '80%',
    },
    modalHeader: {
        fontSize: scale(20),
        fontWeight: 'bold',
        marginBottom: scale(12),
        textAlign: 'center',
    },
    prospectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: scale(8),
        borderBottomWidth: scale(1),
        borderBottomColor: '#ccc',
    },
    removeModalInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButton: {
        marginVertical: scale(6),
        alignSelf: 'center',
    },
    FAB: {
        marginHorizontal: scale(10),
        marginVertical: scale(3),
        color: '#f6f6f6',
        backgroundColor: '#c93332',
    },
});

const modalStyles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#fff',
        padding: scale(20),
        margin: scale(20),
        maxHeight: '80%',
        borderRadius: scale(30),
    },
    modalHeader: {
        fontSize: scale(20),
        fontWeight: 'bold',
        marginBottom: scale(12),
        textAlign: 'center',
    },
    label: { fontWeight: '600', marginVertical: scale(4) },
    input: { marginBottom: scale(12) },
    pickerContainer: {
        borderWidth: scale(1),
        borderColor: '#6f6f6f',
        borderRadius: scale(30),
        overflow: 'hidden',
        marginBottom: scale(12),
    },
    picker: { width: '100%', height: scale(50), backgroundColor: '#f6f6f6' },
    modalButton: { marginVertical: scale(6) },
});

export default PipelineScreen;
