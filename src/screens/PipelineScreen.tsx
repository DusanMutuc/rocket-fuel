// src/screens/PipelineScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    Button,
    TextInput,
    ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types/Client';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

const PipelineScreen = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for the modal that shows prospects to add to pipeline
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [prospects, setProspects] = useState<Client[]>([]);
    const [prospectsLoading, setProspectsLoading] = useState<boolean>(false);

    // Editing-related state
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Editable fields
    // Note: Let temperature be a plain string so it can handle "none" or any other value
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editTemperature, setEditTemperature] = useState<string>('none');
    const [editPipelineNote, setEditPipelineNote] = useState('');

    // Fetch pipeline clients (is_in_pipeline true)
    useEffect(() => {
        const fetchPipelineClients = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_in_pipeline', true);
            if (error) {
                setError(error.message);
            } else if (data) {
                setClients(data);
            }
            setLoading(false);
        };

        fetchPipelineClients();
    }, [user]);

    // Fetch prospects (clients not in pipeline)
    const fetchProspects = async () => {
        if (!user) return;
        setProspectsLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_in_pipeline', false);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error fetching prospects', text2: error.message });
        } else if (data) {
            setProspects(data);
        }
        setProspectsLoading(false);
    };

    // Refresh both pipeline clients and prospects
    const refreshLists = async () => {
        // Refresh pipeline
        const { data: pipelineData, error: pipelineError } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user?.id)
            .eq('is_in_pipeline', true);

        if (!pipelineError && pipelineData) {
            setClients(pipelineData);
        }

        // Refresh prospects
        fetchProspects();
    };

    // Map temperature to a background color
    const getBackgroundColor = (temperature: string) => {
        switch (temperature) {
            case 'lukewarm':
                return '#FFFACD'; // light yellow
            case 'warm':
                return '#FFDAB9'; // peach
            case 'hot':
                return '#FFA07A'; // salmon
            default:
                return '#F0F0F0'; // fallback / "none"
        }
    };

    // Render an item in the pipeline list
    const renderPipelineItem = ({ item }: { item: Client }) => (
        <TouchableOpacity onPress={() => handleEditPress(item)}>
            <View style={[styles.itemContainer, { backgroundColor: getBackgroundColor(item.temperature) }]}>
                <Text style={styles.name}>
                    {item.first_name} {item.last_name || ''}
                </Text>
                <Text style={styles.temperature}>Temperature: {item.temperature}</Text>
                {item.pipeline_note && <Text style={styles.note}>Pipeline Note: {item.pipeline_note}</Text>}
                {item.original_contact && (
                    <Text>Original Contact: {new Date(item.original_contact).toLocaleDateString()}</Text>
                )}
                <Text style={styles.createdAt}>
                    Logged At: {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // When user taps a pipeline client -> open edit modal
    const handleEditPress = (client: Client) => {
        setSelectedClient(client);

        // Pre-fill fields. If there's no existing temperature or it's something unexpected, default to "none"
        setEditFirstName(client.first_name);
        setEditLastName(client.last_name || '');
        setEditTemperature(client.temperature || 'none');
        setEditPipelineNote(client.pipeline_note || '');

        setEditModalVisible(true);
    };

    // Update the pipeline client with new info
    const handleUpdateClient = async () => {
        if (!user || !selectedClient) {
            Toast.show({ type: 'error', text1: 'No user or client selected' });
            return;
        }
        // Basic validation for first name
        if (!editFirstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }

        const { error } = await supabase
            .from('clients')
            .update({
                first_name: editFirstName,
                last_name: editLastName || null,
                temperature: editTemperature,
                pipeline_note: editPipelineNote,
            })
            .eq('client_id', selectedClient.client_id);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error updating client', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Client updated successfully' });
            setEditModalVisible(false);
            setSelectedClient(null);
            refreshLists();
        }
    };

    // Render each prospect in the modal (for adding to pipeline)
    const renderProspectItem = ({ item }: { item: Client }) => (
        <View style={styles.prospectItem}>
            <Text style={styles.name}>
                {item.first_name} {item.last_name || ''}
            </Text>
            <Button title="Add to Pipeline" onPress={() => handleAddToPipeline(item.client_id)} />
        </View>
    );

    // Update a prospect to be in the pipeline
    const handleAddToPipeline = async (clientId: string) => {
        const { error } = await supabase
            .from('clients')
            .update({ is_in_pipeline: true })
            .eq('client_id', clientId);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error adding to pipeline', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Prospect added to pipeline' });
            await refreshLists();
            setModalVisible(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Pipeline Clients</Text>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.client_id}
                renderItem={renderPipelineItem}
                contentContainerStyle={styles.listContent}
            />

            {/* Button to open modal for adding prospects */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                    setModalVisible(true);
                    fetchProspects();
                }}
            >
                <Text style={styles.addButtonText}>Add Prospect to Pipeline</Text>
            </TouchableOpacity>

            {/* Modal for selecting a prospect to add */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Select Prospect</Text>
                        {prospectsLoading ? (
                            <ActivityIndicator size="large" />
                        ) : (
                            <FlatList
                                data={prospects}
                                keyExtractor={(item) => item.client_id}
                                renderItem={renderProspectItem}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                        <Button title="Close" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            {/* Edit Modal (for existing pipeline clients) */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Edit Pipeline Client</Text>

                            <Text style={styles.label}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editFirstName}
                                onChangeText={setEditFirstName}
                            />

                            <Text style={styles.label}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editLastName}
                                onChangeText={setEditLastName}
                            />

                            <Text style={styles.label}>Temperature</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editTemperature}
                                    onValueChange={(value) => setEditTemperature(value)}
                                    style={styles.picker}
                                    mode="dropdown"
                                >
                                    {/* If the stored temperature is not lukewarm/warm/hot, the "None" option will appear selected. */}
                                    <Picker.Item label="None" value="none" />
                                    <Picker.Item label="Lukewarm" value="lukewarm" />
                                    <Picker.Item label="Warm" value="warm" />
                                    <Picker.Item label="Hot" value="hot" />
                                </Picker>
                            </View>

                            <Text style={styles.label}>Pipeline Note</Text>
                            <TextInput
                                style={styles.input}
                                value={editPipelineNote}
                                onChangeText={setEditPipelineNote}
                            />

                            <Button title="Save Changes" onPress={handleUpdateClient} />
                            <Button
                                title="Cancel"
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setSelectedClient(null);
                                }}
                                color="red"
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 16,
    },
    itemContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
    },
    temperature: {
        fontSize: 16,
        marginBottom: 4,
    },
    note: {
        fontSize: 14,
        color: '#555',
    },
    createdAt: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: 'tomato',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    prospectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        maxHeight: '80%',
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    label: {
        fontWeight: '600',
        marginVertical: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 12,
        borderRadius: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 12,
    },
    picker: {
        height: 50,
        width: '100%',
    },
});

export default PipelineScreen;
