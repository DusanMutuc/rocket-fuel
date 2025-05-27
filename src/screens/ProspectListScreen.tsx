import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    View,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

// ——————————————————————————————————————
// Scaling helper
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Picker-wrapper constants
const ROW_HEIGHT = scale(70);
const VISIBLE_ROWS = 3;
const FULL_WHEEL = ROW_HEIGHT * VISIBLE_ROWS; // e.g. 150
const VISIBLE_HEIGHT = scale(80);             // e.g. 60

// ——————————————————————————————————————
// ContactModal (Prospect & SOI)
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
    onSave: (updated: {
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
            setOriginalContact(
                initialContact.original_contact
                    ? new Date(initialContact.original_contact)
                    : new Date()
            );
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

    const handleSave = () =>
        onSave({
            first_name: firstName,
            last_name: lastName,
            email,
            phone_number: phoneNumber,
            address,
            prospect_note: prospectNote,
            original_contact: showOriginalContact
                ? originalContact.toISOString()
                : undefined,
        });

    return (
        <PaperModal
            visible={visible}
            onDismiss={onDismiss}
            contentContainerStyle={modalStyles.modalContent}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={modalStyles.scrollContent}
                persistentScrollbar
                showsVerticalScrollIndicator
            >
                <PaperText style={modalStyles.modalHeader}>{title}</PaperText>

                {/* First Name */}
                <PaperText style={modalStyles.label}>First Name</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                />

                {/* Last Name */}
                <PaperText style={modalStyles.label}>Last Name</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={lastName}
                    onChangeText={setLastName}
                />

                {/* Email */}
                <PaperText style={modalStyles.label}>Email</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                {/* Phone */}
                <PaperText style={modalStyles.label}>Phone</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />

                {/* Address */}
                <PaperText style={modalStyles.label}>Address</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={address}
                    onChangeText={setAddress}
                />

                {/* Note */}
                <PaperText style={modalStyles.label}>Note</PaperText>
                <PaperTextInput
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={[modalStyles.input, { height: scale(120), textAlignVertical: 'top' }]}
                    theme={{ roundness: scale(24) }}
                    value={prospectNote}
                    onChangeText={setProspectNote}
                />

                {/* Original Contact */}
                {showOriginalContact && (
                    <>
                        <PaperText style={modalStyles.label}>Original Contact</PaperText>
                        <TouchableRipple
                            style={modalStyles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <PaperText>
                                {originalContact.toLocaleDateString()}
                            </PaperText>
                        </TouchableRipple>
                        {showDatePicker && (
                            <DateTimePicker
                                value={originalContact}
                                mode="date"
                                display="default"
                                onChange={(_, d) => {
                                    setShowDatePicker(false);
                                    if (d) setOriginalContact(d);
                                }}
                            />
                        )}
                    </>
                )}

                <PaperButton
                    mode="contained"
                    onPress={handleSave}
                    style={modalStyles.modalButton}
                >
                    Save Changes
                </PaperButton>
                <PaperButton
                    mode="outlined"
                    onPress={onDismiss}
                    style={modalStyles.modalButton}
                >
                    Cancel
                </PaperButton>
            </ScrollView>
        </PaperModal>
    );
};

// ——————————————————————————————————————
// AgentModal
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
    onSave: (updated: {
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

    const handleSave = () =>
        onSave({
            name,
            phone_number: phoneNumber,
            email,
            address,
            brokerage,
            notes,
            original_contact: originalContact.toISOString().split('T')[0],
        });

    return (
        <PaperModal
            visible={visible}
            onDismiss={onDismiss}
            contentContainerStyle={modalStyles.modalContent}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={modalStyles.scrollContent}
            >
                <PaperText style={modalStyles.modalHeader}>{title}</PaperText>

                {/* Name */}
                <PaperText style={modalStyles.label}>Name</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={name}
                    onChangeText={setName}
                />

                {/* Phone */}
                <PaperText style={modalStyles.label}>Phone</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />

                {/* Email */}
                <PaperText style={modalStyles.label}>Email</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                {/* Address */}
                <PaperText style={modalStyles.label}>Address</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={address}
                    onChangeText={setAddress}
                />

                {/* Brokerage */}
                <PaperText style={modalStyles.label}>Brokerage</PaperText>
                <PaperTextInput
                    mode="outlined"
                    style={modalStyles.input}
                    value={brokerage}
                    onChangeText={setBrokerage}
                />

                {/* Notes */}
                <PaperText style={modalStyles.label}>Notes</PaperText>
                <PaperTextInput
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={[modalStyles.input, { height: scale(120), textAlignVertical: 'top' }]}
                    theme={{ roundness: scale(24) }}
                    value={notes}
                    onChangeText={setNotes}
                />

                {/* Original Contact */}
                <PaperText style={modalStyles.label}>Original Contact</PaperText>
                <TouchableRipple
                    style={modalStyles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <PaperText>
                        {originalContact.toLocaleDateString()}
                    </PaperText>
                </TouchableRipple>
                {showDatePicker && (
                    <DateTimePicker
                        value={originalContact}
                        mode="date"
                        display="default"
                        onChange={(_, d) => {
                            setShowDatePicker(false);
                            if (d) setOriginalContact(d);
                        }}
                    />
                )}

                <PaperButton
                    mode="contained"
                    onPress={handleSave}
                    style={modalStyles.modalButton}
                >
                    Save Changes
                </PaperButton>
                <PaperButton
                    mode="outlined"
                    onPress={onDismiss}
                    style={modalStyles.modalButton}
                >
                    Cancel
                </PaperButton>
            </ScrollView>
        </PaperModal>
    );
};

// ——————————————————————————————————————
// Main ContactsScreen
const ContactsScreen = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string>('Prospect');

    const [addClientModalVisible, setAddClientModalVisible] = useState(false);
    const [editClientModalVisible, setEditClientModalVisible] = useState(false);
    const [addAgentModalVisible, setAddAgentModalVisible] = useState(false);
    const [editAgentModalVisible, setEditAgentModalVisible] = useState(false);

    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<any>(null);

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const showSnack = (msg: string) => {
        setSnackbarMessage(msg);
        setSnackbarVisible(true);
    };

    // Fetch contacts
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
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

    // Handlers...
    const handleClientEdit = (c: any) => { setSelectedClient(c); setEditClientModalVisible(true); };
    const handleAgentEdit = (a: any) => { setSelectedAgent(a); setEditAgentModalVisible(true); };

    const handleAddClient = async (data: any) => {
        if (!user) return showSnack('User not logged in');
        if (!data.first_name.trim()) return showSnack('First name is required');
        try {
            const payload: any = {
                user_id: user.id,
                first_name: data.first_name,
                last_name: data.last_name || null,
                email: data.email || null,
                phone_number: data.phone_number || null,
                address: data.address || null,
                prospect_note: data.prospect_note || '',
                created_at: new Date().toISOString(),
            };
            if (selectedType === 'Prospect') payload.original_contact = data.original_contact;
            const { data: inserted, error } = await supabase.from('clients').insert([payload]).select();
            if (error) throw new Error(error.message);
            if (!inserted?.length) throw new Error('No client inserted');
            const newClient = inserted[0];
            const typeId = selectedType === 'Prospect' ? 2 : 1;
            const { error: cctErr } = await supabase
                .from('client_client_types')
                .insert([{ client_id: newClient.client_id, client_type_id: typeId }]);
            if (cctErr) throw new Error(cctErr.message);
            showSnack('Contact added successfully');
            setAddClientModalVisible(false);
            refreshContacts();
        } catch (e: any) {
            showSnack(`Error: ${e.message}`);
        }
    };

    const handleAddAgent = async (data: any) => {
        if (!user) return showSnack('User not logged in');
        if (!data.name.trim()) return showSnack('Name is required');
        try {
            const payload = {
                user_id: user.id,
                name: data.name,
                phone_number: data.phone_number || null,
                email: data.email || null,
                address: data.address || null,
                brokerage: data.brokerage || null,
                original_contact: data.original_contact,
                notes: data.notes || '',
            };
            const { error } = await supabase.from('agents').insert([payload]);
            if (error) throw new Error(error.message);
            showSnack('Agent added successfully');
            setAddAgentModalVisible(false);
            refreshContacts();
        } catch (e: any) {
            showSnack(`Error: ${e.message}`);
        }
    };

    const handleUpdateClient = async (data: any) => {
        if (!user || !selectedClient) return showSnack('No contact selected');
        if (!data.first_name.trim()) return showSnack('First name is required');
        try {
            const { error } = await supabase
                .from('clients')
                .update(data)
                .eq('client_id', selectedClient.client_id);
            if (error) throw new Error(error.message);
            showSnack('Contact updated');
            setEditClientModalVisible(false);
            setSelectedClient(null);
            refreshContacts();
        } catch (e: any) {
            showSnack(`Error: ${e.message}`);
        }
    };

    const handleUpdateAgent = async (data: any) => {
        if (!user || !selectedAgent) return showSnack('No agent selected');
        if (!data.name.trim()) return showSnack('Name is required');
        try {
            const { error } = await supabase
                .from('agent_contacts')
                .update(data)
                .eq('id', selectedAgent.id);
            if (error) throw new Error(error.message);
            showSnack('Agent updated');
            setEditAgentModalVisible(false);
            setSelectedAgent(null);
            refreshContacts();
        } catch (e: any) {
            showSnack(`Error: ${e.message}`);
        }
    };

    const confirmDelete = (item: any) => {
        setContactToDelete(item);
        setDeleteModalVisible(true);
    };
    const handleDeleteConfirm = async () => {
        if (!user || !contactToDelete) return;
        try {
            if (selectedType === 'Agent') {
                const { error } = await supabase.from('agents').delete().eq('id', contactToDelete.id);
                if (error) throw new Error(error.message);
            } else {
                const { error } = await supabase
                    .from('clients')
                    .delete()
                    .eq('client_id', contactToDelete.client_id);
                if (error) throw new Error(error.message);
            }
            showSnack('Deleted successfully');
            refreshContacts();
        } catch (e: any) {
            showSnack(`Error: ${e.message}`);
        }
        setDeleteModalVisible(false);
        setContactToDelete(null);
    };
    const handleDeleteCancel = () => {
        setDeleteModalVisible(false);
        setContactToDelete(null);
    };

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

    // Loading / error
    if (loading) {
        return (
            <Surface style={styles.center}>
                <ActivityIndicator animating size="large" />
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

    // ——————————————————————————————————————
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                <PopoverTooltip tooltipText="Welcome to your Contacts Page! Manage and filter your contacts here." />
                <PaperText style={styles.header}>Contacts Page</PaperText>

                {/* Top picker, styled like Pipeline’s modal picker: */}
                <Surface style={styles.pickerContainer}>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedType}
                            onValueChange={setSelectedType}
                            mode="dialog"
                            style={styles.picker}
                        >
                            <Picker.Item label="Prospect" value="Prospect" />
                            <Picker.Item label="SOI" value="SOI" />
                            <Picker.Item label="Agent" value="Agent" />
                        </Picker>
                    </View>
                </Surface>

                {/*Your list of contacts */}
                <FlatList
                    data={contacts}
                    keyExtractor={item =>
                        item.client_id ? item.client_id.toString() : item.id.toString()
                    }
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />

                {/* Floating “Add” button, same positioning as Pipeline */}
                <PaperButton
                    mode="contained"
                    onPress={() =>
                        selectedType === 'Agent'
                            ? setAddAgentModalVisible(true)
                            : setAddClientModalVisible(true)
                    }
                    style={styles.addButton}
                >
                    {selectedType === 'Agent'
                        ? 'Add Agent'
                        : selectedType === 'SOI'
                            ? 'Add SOI'
                            : 'Add Prospect'}
                </PaperButton>

                <Portal>
                    {/* Add/Edit modals */}
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

                    {/* Delete confirmation */}
                    <PaperModal
                        visible={deleteModalVisible}
                        onDismiss={handleDeleteCancel}
                        contentContainerStyle={modalStyles.modalContent}
                    >
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={modalStyles.scrollContent}
                        >
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
                                mode="outlined"
                                onPress={handleDeleteCancel}
                                style={modalStyles.modalButton}
                            >
                                No
                            </PaperButton>
                        </ScrollView>
                    </PaperModal>

                    {/* Snackbar */}
                    <Snackbar
                        visible={snackbarVisible}
                        onDismiss={() => setSnackbarVisible(false)}
                        duration={3000}
                        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
                    >
                        {snackbarMessage}
                    </Snackbar>
                </Portal>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: scale(16), marginTop: -50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: scale(24), fontWeight: 'bold', marginBottom: scale(10), textAlign: 'center' },
    safeArea: {
        flex: 1,
        backgroundColor: '#fff', // or your preferred background color
    },
    listContainer: {
        flex: 1,
        marginBottom: scale(80), // Space for fixed button
    },
    buttonContainer: {
        position: 'absolute',
        bottom: scale(20),
        left: scale(16),
        right: scale(16),
        zIndex: 1, // Ensure button stays above other content
    },
    addButton: {
        width: '100%',
        elevation: 4, // Add shadow on Android
        shadowColor: '#000', // Add shadow on iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Top picker
    pickerContainer: {
        borderWidth: scale(1),
        borderColor: '#ccc',
        borderRadius: scale(16),
        overflow: 'hidden',
        marginBottom: scale(10),
        width: '100%',
    },
    pickerWrapper: {
        width: '100%',
        height: VISIBLE_HEIGHT,
        overflow: 'hidden',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
        position: 'relative', // Needed for absolute positioning of button container
    },
    listContent: {
        paddingBottom: scale(80), // Add padding to prevent items from being hidden behind button
    },
    picker: {
        width: '100%',
        height: FULL_WHEEL,
    },
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
    deleteIcon: { position: 'absolute', bottom: scale(8), right: scale(8) },
});

const modalStyles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#fff',
        padding: scale(20),
        borderRadius: scale(8),
        alignSelf: 'center',
        width: '90%',
        height: '80%',
    },
    scrollContent: {
        paddingBottom: scale(20),
    },
    modalHeader: {
        fontSize: scale(20),
        fontWeight: 'bold',
        marginBottom: scale(12),
        textAlign: 'center',
    },
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
        alignSelf: 'center',
        width: '100%',
    },
});

export default ContactsScreen;
