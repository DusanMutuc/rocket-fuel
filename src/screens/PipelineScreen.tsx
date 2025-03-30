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
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types/Client';
import Toast from 'react-native-toast-message';

const PipelineScreen = () => {
    const { user } = useAuth();
    const [pipelineClients, setPipelineClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal visibility states
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [prospectModalVisible, setProspectModalVisible] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Editable fields for pipeline clients
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editTemperature, setEditTemperature] = useState<string>('lukewarm');
    const [editPipelineNote, setEditPipelineNote] = useState('');

    // State for listing prospects
    const [prospects, setProspects] = useState<Client[]>([]);

    // We'll need the pipeline client type ID to insert into the join table
    const [pipelineTypeId, setPipelineTypeId] = useState<number | null>(null);

    // Fetch pipeline clients using the RPC function
    useEffect(() => {
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

    // Fetch prospects (clients with type "Prospect")
    // Fetch prospects that are not in pipeline
    const fetchProspects = async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_prospects_not_in_pipeline', { uid: user.id });
        if (error) {
            Toast.show({ type: 'error', text1: 'Error fetching prospects', text2: error.message });
        } else if (data) {
            setProspects(data);
        }
    };


    // Fetch pipeline type id from client_types table
    useEffect(() => {
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

    // Refresh pipeline clients
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

    // Map temperature to a background color
    const getBackgroundColor = (temperature: string) => {
        switch (temperature) {
            case 'lukewarm':
                return '#FFFACD';
            case 'warm':
                return '#FFDAB9';
            case 'hot':
                return '#FFA07A';
            default:
                return '#F0F0F0';
        }
    };

    // Render each pipeline client item
    const renderPipelineItem = ({ item }: { item: Client }) => (
        <TouchableOpacity onPress={() => handleEditPress(item)}>
            <View style={[styles.itemContainer, { backgroundColor: getBackgroundColor(item.temperature) }]}>
                <Text style={styles.name}>
                    {item.first_name} {item.last_name || ''}
                </Text>
                <Text style={styles.temperature}>Temperature: {item.temperature}</Text>
                {item.pipeline_note && <Text style={styles.note}>Pipeline Note: {item.pipeline_note}</Text>}
                <Text style={styles.createdAt}>
                    Logged At: {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Edit pipeline client
    const handleEditPress = (client: Client) => {
        setSelectedClient(client);
        setEditFirstName(client.first_name);
        setEditLastName(client.last_name || '');
        setEditTemperature(client.temperature || 'lukewarm');
        setEditPipelineNote(client.pipeline_note || '');
        setEditModalVisible(true);
    };

    const handleUpdateClient = async () => {
        if (!user || !selectedClient) {
            Toast.show({ type: 'error', text1: 'No user or client selected' });
            return;
        }
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
            refreshPipelineClients();
        }
    };

    // ---------- Handler for adding a prospect to pipeline ----------
    const handleAddToPipeline = async (clientId: string) => {
        if (!pipelineTypeId) {
            Toast.show({ type: 'error', text1: 'Pipeline type not found' });
            return;
        }
        const { error } = await supabase.from('client_client_types').insert([
            {
                client_id: clientId,
                client_type_id: pipelineTypeId,
            },
        ]);
        if (error) {
            Toast.show({ type: 'error', text1: 'Error adding to pipeline', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Added to pipeline' });
            // Optionally refresh the pipeline list
            refreshPipelineClients();
            setProspectModalVisible(false);
        }
    };

    // Render each prospect item in the modal
    const renderProspectItem = ({ item }: { item: Client }) => (
        <View style={styles.prospectItem}>
            <Text style={styles.name}>
                {item.first_name} {item.last_name || ''}
            </Text>
            <TouchableOpacity
                style={styles.addButtonSmall}
                onPress={() => handleAddToPipeline(item.client_id)}
            >
                <Text style={styles.addButtonTextSmall}>Add to Pipeline</Text>
            </TouchableOpacity>
        </View>
    );

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
            <Text style={styles.header}>Pipeline Contacts</Text>
            <FlatList
                data={pipelineClients}
                keyExtractor={(item) => item.client_id}
                renderItem={renderPipelineItem}
                contentContainerStyle={styles.listContent}
            />
            {/* Button to open the modal that lists prospects */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                    setProspectModalVisible(true);
                    fetchProspects();
                }}
            >
                <Text style={styles.addButtonText}>Add Prospect to Pipeline</Text>
            </TouchableOpacity>

            {/* Modal for listing prospects */}
            <Modal
                visible={prospectModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setProspectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Select a Prospect</Text>
                            <FlatList
                                data={prospects}
                                keyExtractor={(item) => item.client_id}
                                renderItem={renderProspectItem}
                                contentContainerStyle={styles.listContent}
                            />
                            <Button title="Close" onPress={() => setProspectModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal for editing a pipeline client */}
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
                            <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} />
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} />
                            <Text style={styles.label}>Temperature</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editTemperature}
                                    onValueChange={(value) => setEditTemperature(value)}
                                    mode="dialog"
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Lukewarm" value="lukewarm" />
                                    <Picker.Item label="Warm" value="warm" />
                                    <Picker.Item label="Hot" value="hot" />
                                </Picker>
                            </View>
                            <Text style={styles.label}>Pipeline Note</Text>
                            <TextInput style={styles.input} value={editPipelineNote} onChangeText={setEditPipelineNote} />
                            <Button title="Save Changes" onPress={handleUpdateClient} />
                            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    listContent: { paddingBottom: 16 },
    itemContainer: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, marginBottom: 12 },
    name: { fontSize: 18, fontWeight: '600' },
    temperature: { fontSize: 16, marginBottom: 4 },
    note: { fontSize: 14, color: '#555' },
    createdAt: { fontSize: 12, color: '#555', marginTop: 4 },
    addButton: { backgroundColor: 'tomato', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
    addButtonText: { color: '#fff', fontSize: 16 },
    addButtonSmall: { backgroundColor: 'green', padding: 6, borderRadius: 4, marginTop: 4 },
    addButtonTextSmall: { color: '#fff', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 8, maxHeight: '80%' },
    modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    label: { fontWeight: '600', marginVertical: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 4 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    picker: { width: '100%', height: 50 },
    prospectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});

export default PipelineScreen;
