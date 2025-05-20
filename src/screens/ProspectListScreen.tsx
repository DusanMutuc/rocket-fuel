import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import {
    ActivityIndicator,
    Button as PaperButton,
    Modal as PaperModal,
    Portal,
    Surface,
    Text as PaperText,
    TextInput as PaperTextInput,
    TouchableRipple,
    IconButton,
    Snackbar,
} from 'react-native-paper';
import PopoverTooltip from '../components/PopoverTooltip';

// Define a scaling function based on the device's screen width.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375; // e.g., iPhone 8 width
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// ---------- Contact Modal Component (for Prospect & SOI) ----------
type ContactModalProps = {
    visible: boolean;
    onDismiss: () => void;
    initialContact?: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        address: string;
        prospect_note: string;
        original_contact?: string;
    };
    onSave: (updatedContact: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        address: string;
        prospect_note: string;
        original_contact?: string;
    }) => void;
    title: string;
    showOriginalContact: boolean;
};

const ContactModal: React.FC<ContactModalProps> = ({
    visible,
    onDismiss,
    initialContact,
    onSave,
    title,
    showOriginalContact,
}) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [prospectNote, setProspectNote] = useState('');
    const [originalContact, setOriginalContact] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (initialContact) {
            setFirstName(initialContact.first_name);
            setLastName(initialContact.last_name);
            setEmail(initialContact.email);
            setPhoneNumber(initialContact.phone_number);
            setAddress(initialContact.address);
            setProspectNote(initialContact.prospect_note);
            if (initialContact.original_contact) {
                setOriginalContact(new Date(initialContact.original_contact));
            } else {
                setOriginalContact(new Date());
            }
        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
            setAddress('');
            setProspectNote('');
            setOriginalContact(new Date());
        }
    }, [initialContact, visible]);

    const handleSave = () => {
        onSave({
            first_name: firstName,
            last_name: lastName,
            email,
            phone_number: phoneNumber,
            address,
            prospect_note: prospectNote,
            original_contact: showOriginalContact ? originalContact.toISOString() : undefined,
        });
    };

    return (
        <PaperModal visible={visible} onDismiss={onDismiss} contentContainerStyle={modalStyles.modalContent}>
            <ScrollView persistentScrollbar={true} showsVerticalScrollIndicator={true}>
                <Surface style={modalStyles.modalInner}>
                    <PaperText style={modalStyles.modalHeader}>{title}</PaperText>
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
                    <PaperText style={modalStyles.label}>Email</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <PaperText style={modalStyles.label}>Phone</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />
                    <PaperText style={modalStyles.label}>Address</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={address}
                        onChangeText={setAddress}
                    />
                    <PaperText style={modalStyles.label}>Note</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        multiline
                        numberOfLines={5}
                        theme={{ roundness: scale(24) }}
                        style={[modalStyles.input, { height: scale(120), textAlignVertical: 'top' }]}
                        value={prospectNote} 
                        onChangeText={setProspectNote}
                    />

                    {showOriginalContact && (
                        <>
                            <PaperText style={modalStyles.label}>Original Contact</PaperText>
                            <TouchableRipple style={modalStyles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                                <PaperText>{originalContact.toLocaleDateString()}</PaperText>
                            </TouchableRipple>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={originalContact}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setOriginalContact(selectedDate);
                                    }}
                                />
                            )}
                        </>
                    )}
                    <PaperButton mode="contained" onPress={handleSave} style={modalStyles.modalButton}>
                        Save Changes
                    </PaperButton>
                    <PaperButton mode="contained" onPress={onDismiss} style={modalStyles.modalButton}>
                        Cancel
                    </PaperButton>
                </Surface>
            </ScrollView>
        </PaperModal>
    );
};

// ---------- Agent Modal Component (for Agents) ----------
type AgentModalProps = {
    visible: boolean;
    onDismiss: () => void;
    initialAgent?: {
        name: string;
        phone_number: string;
        email: string;
        address: string;
        brokerage: string;
        notes: string;
        original_contact: string;
    };
    onSave: (updatedAgent: {
        name: string;
        phone_number: string;
        email: string;
        address: string;
        brokerage: string;
        notes: string;
        original_contact: string;
    }) => void;
    title: string;
};

const AgentModal: React.FC<AgentModalProps> = ({
    visible,
    onDismiss,
    initialAgent,
    onSave,
    title,
}) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [brokerage, setBrokerage] = useState('');
    const [notes, setNotes] = useState('');
    const [originalContact, setOriginalContact] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (initialAgent) {
            setName(initialAgent.name);
            setPhoneNumber(initialAgent.phone_number);
            setEmail(initialAgent.email);
            setAddress(initialAgent.address);
            setBrokerage(initialAgent.brokerage);
            setNotes(initialAgent.notes);
            setOriginalContact(new Date(initialAgent.original_contact));
        } else {
            setName('');
            setPhoneNumber('');
            setEmail('');
            setAddress('');
            setBrokerage('');
            setNotes('');
            setOriginalContact(new Date());
        }
    }, [initialAgent, visible]);

    const handleSave = () => {
        onSave({
            name,
            phone_number: phoneNumber,
            email,
            address,
            brokerage,
            notes,
            original_contact: originalContact.toISOString().split('T')[0],
        });
    };

    return (
        <PaperModal visible={visible} onDismiss={onDismiss} contentContainerStyle={modalStyles.modalContent}>
            <ScrollView>
                <Surface style={modalStyles.modalInner}>
                    <PaperText style={modalStyles.modalHeader}>{title}</PaperText>

                    <PaperText style={modalStyles.label}>Name</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={name}
                        onChangeText={setName}
                    />
                    <PaperText style={modalStyles.label}>Phone</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />
                    <PaperText style={modalStyles.label}>Email</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <PaperText style={modalStyles.label}>Address</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={address}
                        onChangeText={setAddress}
                    />
                    <PaperText style={modalStyles.label}>Brokerage</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        style={modalStyles.input}
                        value={brokerage}
                        onChangeText={setBrokerage}
                    />
                    <PaperText style={modalStyles.label}>Notes</PaperText>
                    <PaperTextInput
                        mode="outlined"
                        multiline
                        numberOfLines={5}
                        style={[modalStyles.input, { height: scale(120), textAlignVertical: 'top' }]}
                        value={notes}
                        theme={{roundness: 24} }
                        onChangeText={setNotes}
                    />

                    <PaperText style={modalStyles.label}>Original Contact</PaperText>
                    <TouchableRipple style={modalStyles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                        <PaperText>{originalContact.toLocaleDateString()}</PaperText>
                    </TouchableRipple>
                    {showDatePicker && (
                        <DateTimePicker
                            value={originalContact}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setOriginalContact(selectedDate);
                            }}
                        />
                    )}

                    <PaperButton mode="contained" onPress={handleSave} style={modalStyles.modalButton}>
                        Save Changes
                    </PaperButton>
                    <PaperButton mode="contained" onPress={onDismiss} style={modalStyles.modalButton}>
                        Cancel
                    </PaperButton>
                </Surface>
            </ScrollView>
        </PaperModal>
    );
};

// ---------- Main ContactsScreen Component ----------
const ContactsScreen = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string>('Prospect');

    // ---------- Modal Visibility States ----------
    const [addClientModalVisible, setAddClientModalVisible] = useState(false);
    const [editClientModalVisible, setEditClientModalVisible] = useState(false);
    const [addAgentModalVisible, setAddAgentModalVisible] = useState(false);
    const [editAgentModalVisible, setEditAgentModalVisible] = useState(false);

    // ---------- Selected Items for editing ----------
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);

    // For delete confirmation
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<any>(null);

    // Snackbar for messages
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnack = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    // ---------- Data Fetching ----------
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            setLoading(true);

            if (selectedType === 'Agent') {
                // Fetch agents
                const { data, error } = await supabase.rpc('get_agents_by_user', { uid: user.id });
                if (error) setError(error.message);
                else setContacts(data);
            } else {
                // Fetch clients (Prospect or SOI)
                const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                    uid: user.id,
                    client_type_name: selectedType,
                });
                if (error) setError(error.message);
                else setContacts(data);
            }
            setLoading(false);
        };
        fetchContacts();
    }, [user, selectedType]);

    const refreshContacts = async () => {
        if (!user) return;
        setLoading(true);

        if (selectedType === 'Agent') {
            const { data, error } = await supabase.rpc('get_agents_by_user', { uid: user.id });
            if (error) setError(error.message);
            else setContacts(data);
        } else {
            const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                uid: user.id,
                client_type_name: selectedType,
            });
            if (error) setError(error.message);
            else setContacts(data);
        }
        setLoading(false);
    };

    // ---------- Editing Handlers ----------
    const handleClientEdit = (client: any) => {
        setSelectedClient(client);
        setEditClientModalVisible(true);
    };

    const handleAgentEdit = (agent: any) => {
        setSelectedAgent(agent);
        setEditAgentModalVisible(true);
    };

    // ---------- Adding a client (Prospect or SOI) ----------
    const handleAddClient = async (contactData: any) => {
        if (!user) {
            showSnack('User not logged in');
            return;
        }
        if (!contactData.first_name.trim()) {
            showSnack('First name is required');
            return;
        }
        try {
            const payload: any = {
                user_id: user.id,
                first_name: contactData.first_name,
                last_name: contactData.last_name || null,
                email: contactData.email || null,
                phone_number: contactData.phone_number || null,
                address: contactData.address || null,
                prospect_note: contactData.prospect_note || '',
                created_at: new Date().toISOString(),
            };
            if (selectedType === 'Prospect') {
                payload.original_contact = contactData.original_contact;
            }

            const { data, error } = await supabase
                .from('clients')
                .insert([payload])
                .select();

            if (error) {
                throw new Error(error.message);
            }
            if (!data || data.length === 0) {
                throw new Error('No client was inserted');
            }

            const newClient = data[0];
            const clientTypeId = (selectedType === 'Prospect') ? 2 : 1;

            const { error: cctError } = await supabase
                .from('client_client_types')
                .insert([{ client_id: newClient.client_id, client_type_id: clientTypeId }]);

            if (cctError) {
                throw new Error(cctError.message);
            }

            showSnack('Contact added successfully');
            setAddClientModalVisible(false);
            refreshContacts();
        } catch (err: any) {
            showSnack(`Error adding contact: ${err.message}`);
        }
    };

    // ---------- Adding an agent ----------
    const handleAddAgent = async (agentData: any) => {
        if (!user) {
            showSnack('User not logged in');
            return;
        }
        if (!agentData.name.trim()) {
            showSnack('Name is required');
            return;
        }
        try {
            const payload = {
                user_id: user.id,
                name: agentData.name,
                phone_number: agentData.phone_number || null,
                email: agentData.email || null,
                address: agentData.address || null,
                brokerage: agentData.brokerage || null,
                original_contact: agentData.original_contact,
                notes: agentData.notes || '',
            };
            const { error } = await supabase.from('agents').insert([payload]);
            if (error) {
                throw new Error(error.message);
            }
            showSnack('Agent added successfully');
            setAddAgentModalVisible(false);
            refreshContacts();
        } catch (err: any) {
            showSnack(`Error adding agent: ${err.message}`);
        }
    };

    // ---------- Updating a client ----------
    const handleUpdateClient = async (updatedData: any) => {
        if (!user || !selectedClient) {
            showSnack('No user or contact selected');
            return;
        }
        if (!updatedData.first_name.trim()) {
            showSnack('First name is required');
            return;
        }
        try {
            const { error } = await supabase
                .from('clients')
                .update(updatedData)
                .eq('client_id', selectedClient.client_id);
            if (error) {
                throw new Error(error.message);
            }
            showSnack('Contact updated successfully');
            setEditClientModalVisible(false);
            setSelectedClient(null);
            refreshContacts();
        } catch (err: any) {
            showSnack(`Error updating contact: ${err.message}`);
        }
    };

    // ---------- Updating an agent ----------
    const handleUpdateAgent = async (updatedData: any) => {
        if (!user || !selectedAgent) {
            showSnack('No user or agent selected');
            return;
        }
        if (!updatedData.name.trim()) {
            showSnack('Name is required');
            return;
        }
        try {
            const { error } = await supabase
                .from('agent_contacts')
                .update(updatedData)
                .eq('id', selectedAgent.id);
            if (error) {
                throw new Error(error.message);
            }
            showSnack('Agent updated successfully');
            setEditAgentModalVisible(false);
            setSelectedAgent(null);
            refreshContacts();
        } catch (err: any) {
            showSnack(`Error updating agent: ${err.message}`);
        }
    };

    // ---------- Delete Handlers ----------
    const confirmDelete = (item: any) => {
        setContactToDelete(item);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!contactToDelete || !user) return;
        try {
            if (selectedType === 'Agent') {
                const { error } = await supabase
                    .from('agents')
                    .delete()
                    .eq('id', contactToDelete.id);
                if (error) throw new Error(error.message);
            } else {
                const { error } = await supabase
                    .from('clients')
                    .delete()
                    .eq('client_id', contactToDelete.client_id);
                if (error) throw new Error(error.message);
            }
            showSnack('Contact deleted successfully');
        } catch (err: any) {
            showSnack(`Error deleting contact: ${err.message}`);
        }
        setDeleteModalVisible(false);
        setContactToDelete(null);
        refreshContacts();
    };

    const handleDeleteCancel = () => {
        setDeleteModalVisible(false);
        setContactToDelete(null);
    };

    // ---------- Rendering Items ----------
    const renderItem = ({ item }: { item: any }) => {
        if (selectedType === 'Agent') {
            return (
                <Surface style={styles.itemContainer}>
                    <TouchableRipple onPress={() => handleAgentEdit(item)}>
                        <View>
                            <PaperText style={styles.name}>{item.name}</PaperText>
                            {item.email && <PaperText>Email: {item.email}</PaperText>}
                            {item.phone_number && <PaperText>Phone: {item.phone_number}</PaperText>}
                            {item.address && <PaperText>Address: {item.address}</PaperText>}
                            {item.brokerage && <PaperText>Brokerage: {item.brokerage}</PaperText>}
                            {item.original_contact && (
                                <PaperText>
                                    Original Contact: {new Date(item.original_contact).toLocaleDateString()}
                                </PaperText>
                            )}
                            {item.notes && <PaperText>Notes: {item.notes}</PaperText>}
                        </View>
                    </TouchableRipple>
                    <IconButton
                        icon="delete"
                        size={scale(20)}
                        onPress={() => confirmDelete(item)}
                        style={styles.deleteIcon}
                    />
                </Surface>
            );
        } else {
            return (
                <Surface style={styles.itemContainer}>
                    <TouchableRipple onPress={() => handleClientEdit(item)}>
                        <View>
                            <PaperText style={styles.name}>
                                {item.first_name} {item.last_name || ''}
                            </PaperText>
                            {item.email && <PaperText>Email: {item.email}</PaperText>}
                            {item.phone_number && <PaperText>Phone: {item.phone_number}</PaperText>}
                            {item.address && <PaperText>Address: {item.address}</PaperText>}
                            {selectedType === 'Prospect' && item.original_contact && (
                                <PaperText>
                                    Original Contact: {new Date(item.original_contact).toLocaleDateString()}
                                </PaperText>
                            )}
                            {item.prospect_note && <PaperText>Note: {item.prospect_note}</PaperText>}
                            <PaperText style={styles.createdAt}>
                                Logged At: {new Date(item.created_at).toLocaleString()}
                            </PaperText>
                        </View>
                    </TouchableRipple>
                    <IconButton
                        icon="delete"
                        size={scale(20)}
                        onPress={() => confirmDelete(item)}
                        style={styles.deleteIcon}
                    />
                </Surface>
            );
        }
    };

    const addButtonText =
        selectedType === 'Agent'
            ? 'Add Agent'
            : selectedType === 'SOI'
                ? 'Add SOI'
                : 'Add Prospect';

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
            <PopoverTooltip
                tooltipText={
                    "Welcome to your Contacts Page! Here you can manage your contacts, and filter them  based on category."
                }
            />
            <PaperText style={styles.header}>Contacts Page</PaperText>
            <Surface style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedType}
                    onValueChange={(itemValue) => setSelectedType(itemValue)}
                    style={styles.picker}
                    mode="dialog"
                >
                    <Picker.Item label="Prospect" value="Prospect" />
                    <Picker.Item label="SOI" value="SOI" />
                    <Picker.Item label="Agent" value="Agent" />
                </Picker>
            </Surface>

            <FlatList
                data={contacts}
                keyExtractor={(item) => (item.client_id ? item.client_id.toString() : item.id.toString())}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />

            <PaperButton
                mode="contained"
                onPress={() => {
                    selectedType === 'Agent'
                        ? setAddAgentModalVisible(true)
                        : setAddClientModalVisible(true);
                }}
                style={styles.addButton}
            >
                {addButtonText}
            </PaperButton>

            <Portal>
                <ContactModal
                    visible={addClientModalVisible}
                    onDismiss={() => setAddClientModalVisible(false)}
                    title={selectedType === 'SOI' ? 'Add SOI' : 'Add Prospect'}
                    showOriginalContact={selectedType === 'Prospect'}
                    onSave={handleAddClient}
                />

                <ContactModal
                    visible={editClientModalVisible}
                    onDismiss={() => setEditClientModalVisible(false)}
                    initialContact={selectedClient}
                    title={selectedType === 'SOI' ? 'Edit SOI' : 'Edit Prospect'}
                    showOriginalContact={selectedType === 'Prospect'}
                    onSave={handleUpdateClient}
                />

                <AgentModal
                    visible={addAgentModalVisible}
                    onDismiss={() => setAddAgentModalVisible(false)}
                    title="Add Agent"
                    onSave={handleAddAgent}
                />

                <AgentModal
                    visible={editAgentModalVisible}
                    onDismiss={() => setEditAgentModalVisible(false)}
                    initialAgent={selectedAgent}
                    title="Edit Agent"
                    onSave={handleUpdateAgent}
                />

                <PaperModal
                    visible={deleteModalVisible}
                    onDismiss={handleDeleteCancel}
                    contentContainerStyle={modalStyles.modalContent}
                >
                    <Surface style={modalStyles.modalInner}>
                        <PaperText style={modalStyles.modalHeader}>
                            Are you sure you want to delete this contact?
                        </PaperText>
                        <PaperButton
                            mode="contained"
                            onPress={handleDeleteConfirm}
                            style={modalStyles.modalButton}
                        >
                            Yes
                        </PaperButton>
                        <PaperButton
                            mode="contained"
                            onPress={handleDeleteCancel}
                            style={modalStyles.modalButton}
                        >
                            No
                        </PaperButton>
                    </Surface>
                </PaperModal>

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
            </Portal>

        </Surface>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: scale(16) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: scale(24), fontWeight: 'bold', marginBottom: scale(10), textAlign: 'center' },
    pickerContainer: { borderWidth: scale(1), borderColor: '#ccc', borderRadius: scale(16), overflow: 'hidden', marginBottom: scale(10), width: '100%' },
    picker: { width: '100%', height: scale(60), backgroundColor: '#fff' },
    listContent: { paddingBottom: scale(16) },
    itemContainer: {
        position: 'relative',
        borderWidth: scale(1),
        borderColor: '#ccc',
        padding: scale(12),
        borderRadius: scale(16),
        marginBottom: scale(12),
        backgroundColor: '#fff',
    },
    name: { fontSize: scale(18), fontWeight: '600' },
    createdAt: { fontSize: scale(12), color: '#555', marginTop: scale(4) },
    addButton: { marginTop: scale(16), alignSelf: 'center', width: '70%' },
    deleteIcon: {
        position: 'absolute',
        bottom: scale(8),
        right: scale(8),
    },
});

const modalStyles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#fff',
        padding: scale(20),
        borderRadius: scale(8),
        width: '90%',
        maxHeight: '80%',
        alignSelf: 'center',
    },
    modalInner: {
        backgroundColor: '#fff',
        paddingRight: scale(10),
    },
    modalHeader: { fontSize: scale(20), fontWeight: 'bold', marginBottom: scale(12), textAlign: 'center' },
    label: { fontWeight: '600', marginVertical: scale(4) },
    input: { marginBottom: scale(12) },
    datePickerButton: {
        borderWidth: scale(1),
        borderColor: '#000',
        padding: scale(12),
        borderRadius: scale(60),
        marginBottom: scale(12),
        height: scale(55),
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    modalButton: {
        marginVertical: scale(6),
        width: '100%', // more room for text
        alignSelf: 'center',
    },

});

export default ContactsScreen;
