import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Icon } from 'react-native-paper';
import {
  useGetTicketsQuery,
  useCreateTicketMutation,
  useGetSingleTicketQuery,
  useDeleteTicketMutation,
  useReplyTicketMutation,
  useUpdateTicketStatusMutation,
  useGetFaqsQuery,
  useGetFaqCategoriesQuery,
} from '../../redux/apiSlice';
import { SkeletonBox } from '../../components/SkeletonLoader';

const FAQS = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer: 'You can track your order from the "My Orders" section in your profile. Tap on any active order to see real-time tracking.',
  },
  {
    id: '2',
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order before it is out for delivery. Go to My Orders, select the order and tap "Cancel Order".',
  },
  {
    id: '3',
    question: 'What is the refund policy?',
    answer: 'Refunds for damaged or wrong items are processed instantly to your App Wallet or original payment method within 24-48 hours.',
  },
  {
    id: '4',
    question: 'How do I raise a support ticket?',
    answer: 'Tap the "Raise Ticket" tab above, select your issue category, enter details, and our support team will assist you shortly.',
  },
];

const CATEGORIES = [
  'Delivery Issues',
  'Order Issues',
  'Payment Issues',
  'Refund & Wallet',
  'Account & App',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

interface Props {
  onBack: () => void;
  onRequireLogin?: () => void;
}

export default function HelpSupportScreen({ onBack, onRequireLogin }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);

  const [activeTab, setActiveTab] = useState<'tickets' | 'raise' | 'faqs'>('tickets');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Tickets query & mutations
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const {
    data: ticketsRes,
    isLoading: isLoadingTickets,
    isFetching: isFetchingTickets,
    refetch: refetchTickets,
  } = useGetTicketsQuery({
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    page: 1,
    limit: 50,
  });

  const [createTicket, { isLoading: isCreatingTicket }] = useCreateTicketMutation();
  const [deleteTicket] = useDeleteTicketMutation();
  const [replyTicket, { isLoading: isReplying }] = useReplyTicketMutation();
  const [updateTicketStatus] = useUpdateTicketStatusMutation();

  // FAQ state & queries
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  const { data: faqCategoriesRes } = useGetFaqCategoriesQuery(undefined);
  const { data: faqsRes, isLoading: isLoadingFaqs, refetch: refetchFaqs } = useGetFaqsQuery({
    search: faqSearch || undefined,
    category: faqCategory !== 'All' ? faqCategory : undefined,
    page: 1,
    limit: 50,
  });

  const apiFaqCategories = ['All', ...(faqCategoriesRes?.data || ['General', 'Delivery', 'Payments', 'Orders', 'Refunds'])];
  const apiFaqs = faqsRes?.data || [];
  const displayFaqs = apiFaqs.length > 0 ? apiFaqs : FAQS;

  // Raise Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Delivery Issues');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');

  // Ticket Chat / Detail Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const {
    data: singleTicketRes,
    isLoading: isLoadingSingleTicket,
    refetch: refetchSingleTicket,
  } = useGetSingleTicketQuery(selectedTicketId || '', {
    skip: !selectedTicketId,
  });

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    refetchTickets();
    refetchFaqs();
  }, []);

  const rawTicketsList = ticketsRes?.data || [];
  
  // Clean multi-status filtering logic for All, Open, In Progress, Resolved, Closed
  const ticketsList = selectedStatus === 'All'
    ? rawTicketsList
    : rawTicketsList.filter((t: any) => {
        const s = (t.status || 'Open').toLowerCase().trim();
        const target = selectedStatus.toLowerCase().trim();
        return s === target;
      });

  const singleTicket = singleTicketRes?.data;

  // Handle Update Ticket Status (PUT tickets/:id/status)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateTicketStatus({ id, status: newStatus }).unwrap();
      Alert.alert('Status Updated', `Ticket status updated to ${newStatus}`);
      refetchSingleTicket();
      refetchTickets();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Could not update ticket status');
    }
  };

  // Handle Raise Ticket Submit
  const handleCreateTicket = async () => {
    if (!auth?.accessToken) {
      Alert.alert(
        'Login Required 🔐',
        'You must be logged in to raise a support ticket. Please log in to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => {
              if (onRequireLogin) onRequireLogin();
            },
          },
        ]
      );
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a ticket subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message describing your issue');
      return;
    }

    const payload = {
      subject: subject.trim(),
      category: category || 'Delivery Issues',
      priority: priority || 'Medium',
      message: message.trim(),
    };

    console.log('[Create Ticket API Request Payload]', JSON.stringify(payload));

    try {
      const res = await createTicket(payload).unwrap();
      console.log('[Create Ticket API Response]', JSON.stringify(res));

      const successMsg = res?.message || 'Ticket raised successfully.';
      const ticketIdCode = res?.data?.ticketId || 'New Ticket';
      Alert.alert('Success 🎉', `${successMsg}\nTicket ID: ${ticketIdCode}`);

      setSubject('');
      setMessage('');
      setActiveTab('tickets');
      refetchTickets();
    } catch (err: any) {
      console.error('[Create Ticket API Error]', err);
      const errorMsg = err?.data?.message || err?.message || 'Failed to raise support ticket';
      if (errorMsg.includes('no token provided') || errorMsg.includes('Access Denied')) {
        Alert.alert(
          'Login Required 🔐',
          'Your session expired or token is missing. Please log in to raise support tickets.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: () => onRequireLogin && onRequireLogin() },
          ]
        );
      } else {
        Alert.alert('Error Raising Ticket', errorMsg);
      }
    }
  };

  // Handle Delete Ticket
  const handleDeleteTicket = (id: string, ticketIdStr: string) => {
    Alert.alert(
      'Delete Ticket',
      `Are you sure you want to delete ticket #${ticketIdStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTicket(id).unwrap();
              Alert.alert('Deleted', 'Support ticket deleted successfully');
              refetchTickets();
            } catch (err: any) {
              Alert.alert('Error', err?.data?.message || err?.message || 'Could not delete ticket');
            }
          },
        },
      ]
    );
  };

  // Handle Reply to Ticket
  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;

    try {
      await replyTicket({ id: selectedTicketId, message: replyText.trim() }).unwrap();
      setReplyText('');
      refetchSingleTicket();
      refetchTickets();
    } catch (err: any) {
      Alert.alert('Reply Failed', err?.data?.message || err?.message || 'Could not send reply');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 42) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon source="chevron-left" size={28} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSub}>Ticket System & FAQs</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetchTickets()} activeOpacity={0.7}>
          <Icon source="refresh" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Top Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tickets' && styles.tabItemActive]}
          onPress={() => setActiveTab('tickets')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon source="ticket-outline" size={16} color={activeTab === 'tickets' ? '#0C831F' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
              My Tickets ({ticketsList.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'raise' && styles.tabItemActive]}
          onPress={() => setActiveTab('raise')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon source="plus-circle-outline" size={16} color={activeTab === 'raise' ? '#0C831F' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'raise' && styles.tabTextActive]}>
              Raise Ticket
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'faqs' && styles.tabItemActive]}
          onPress={() => setActiveTab('faqs')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon source="help-circle-outline" size={16} color={activeTab === 'faqs' ? '#0C831F' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>
              FAQs
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'tickets' && (
        <View style={{ flex: 1 }}>
          {/* Status Filter Bar */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {STATUS_FILTERS.map((s) => {
                const isSel = selectedStatus === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, isSel && styles.pillSelected]}
                    onPress={() => setSelectedStatus(s)}
                  >
                    <Text style={[styles.pillText, isSel && styles.pillTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {isLoadingTickets || isFetchingTickets ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <SkeletonBox width="100%" height={90} borderRadius={16} style={{ marginBottom: 12 }} />
              <SkeletonBox width="100%" height={90} borderRadius={16} style={{ marginBottom: 12 }} />
              <SkeletonBox width="100%" height={90} borderRadius={16} style={{ marginBottom: 12 }} />
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {ticketsList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon source="ticket-confirmation-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No support tickets found</Text>
                  <Text style={styles.emptySub}>
                    Have an issue with an order? Tap "Raise Ticket" above to reach out to our team.
                  </Text>
                  <TouchableOpacity style={styles.raiseNowBtn} onPress={() => setActiveTab('raise')}>
                    <Text style={styles.raiseNowText}>+ Raise New Ticket</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                ticketsList.map((ticket: any) => {
                  const tId = ticket._id;
                  const ticketCode = ticket.ticketId || tId.slice(-6);
                  const status = ticket.status || 'Open';
                  const priorityVal = ticket.priority || 'Medium';

                  let statusColor = '#0C831F';
                  if (status === 'Closed') statusColor = '#64748B';
                  if (status === 'In Progress') statusColor = '#D97706';

                  return (
                    <View key={tId} style={styles.ticketCard}>
                      <View style={styles.ticketCardHeader}>
                        <View style={styles.ticketTagRow}>
                          <Text style={styles.ticketIdBadge}>#{ticketCode}</Text>
                          <Text style={styles.categoryBadge}>{ticket.category || 'General'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                        </View>
                      </View>

                      <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                      <Text style={styles.ticketDate}>
                        Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Recently'} · Priority: {priorityVal}
                      </Text>

                      {/* Card Actions */}
                      <View style={styles.ticketCardActions}>
                        <TouchableOpacity
                          style={styles.chatBtn}
                          onPress={() => setSelectedTicketId(tId)}
                        >
                          <Text style={styles.chatBtnText}>💬 View Chat / Reply</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteTicket(tId, ticketCode)}
                          activeOpacity={0.7}
                        >
                          <Icon source="trash-can-outline" size={16} color="#EF4444" />
                          <Text style={[styles.deleteBtnText, { marginLeft: 4 }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === 'raise' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Raise a Support Ticket</Text>
            <Text style={styles.formCardSub}>Describe your issue and we'll resolve it promptly.</Text>

            {/* Category Selector */}
            <Text style={styles.label}>Select Issue Category *</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selector */}
            <Text style={styles.label}>Priority Level *</Text>
            <View style={styles.chipsWrap}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, priority === p && styles.chipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                    {p} Priority
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject Input */}
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Order missing items"
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
            />

            {/* Message Description Input */}
            <Text style={styles.label}>Detailed Description / Message *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide complete details about your issue..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isCreatingTicket && { opacity: 0.7 }]}
              onPress={handleCreateTicket}
              disabled={isCreatingTicket}
              activeOpacity={0.8}
            >
              {isCreatingTicket ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Support Ticket →</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {activeTab === 'faqs' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions (FAQs)</Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Icon source="magnify" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs (e.g. refund, delivery)..."
              placeholderTextColor="#94A3B8"
              value={faqSearch}
              onChangeText={setFaqSearch}
            />
            {faqSearch ? (
              <TouchableOpacity onPress={() => setFaqSearch('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* FAQ Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {apiFaqCategories.map((cat: string) => {
              const isSel = faqCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, isSel && styles.pillSelected]}
                  onPress={() => setFaqCategory(cat)}
                >
                  <Text style={[styles.pillText, isSel && styles.pillTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isLoadingFaqs ? (
            <View>
              <SkeletonBox width="100%" height={56} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBox width="100%" height={56} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBox width="100%" height={56} borderRadius={14} style={{ marginBottom: 10 }} />
            </View>
          ) : (
            displayFaqs.map((faq: any) => {
              const faqId = faq._id || faq.id;
              return (
                <TouchableOpacity
                  key={faqId}
                  style={styles.faqCard}
                  onPress={() => setExpandedFaqId((prev) => (prev === faqId ? null : faqId))}
                  activeOpacity={0.9}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={styles.faqArrow}>{expandedFaqId === faqId ? '▲' : '▼'}</Text>
                  </View>
                  {expandedFaqId === faqId && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      {faq.category && (
                        <Text style={styles.faqCategoryTag}>Category: {faq.category}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Ticket Details & Chat Modal */}
      <Modal visible={!!selectedTicketId} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <StatusBar barStyle="dark-content" />

          {/* Modal Header */}
          <View style={[styles.chatHeader, { paddingTop: Math.max(insets.top + 16, 42) }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedTicketId(null)} activeOpacity={0.7}>
              <Icon source="chevron-left" size={28} color="#000000" />
            </TouchableOpacity>
            <View style={styles.chatHeaderCenter}>
              <Text style={styles.chatHeaderTitle}>
                Ticket #{singleTicket?.ticketId || selectedTicketId?.slice(-6)}
              </Text>
              <Text style={styles.chatHeaderSub}>{singleTicket?.category || 'Support Ticket'}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => refetchSingleTicket()} activeOpacity={0.7}>
              <Icon source="refresh" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {isLoadingSingleTicket ? (
              <View style={{ flex: 1, padding: 20 }}>
                <SkeletonBox width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
                <SkeletonBox width="80%" height={70} borderRadius={16} style={{ marginBottom: 16 }} />
                <SkeletonBox width="85%" height={70} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.chatScrollContent} showsVerticalScrollIndicator={false}>
                {/* Ticket Summary Card */}
                <View style={styles.ticketSummaryCard}>
                  <Text style={styles.summarySubject}>{singleTicket?.subject}</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryBadge}>Priority: {singleTicket?.priority}</Text>
                    <Text style={styles.summaryBadge}>Status: {singleTicket?.status}</Text>
                  </View>
                  <View style={styles.statusToggleRow}>
                    <Text style={styles.statusChangeLabel}>Mark Ticket Status:</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        singleTicket?.status === 'Closed' && styles.statusToggleBtnClosed,
                      ]}
                      onPress={() =>
                        handleUpdateStatus(
                          selectedTicketId!,
                          singleTicket?.status === 'Closed' ? 'Open' : 'Closed'
                        )
                      }
                    >
                      <Text style={styles.statusToggleText}>
                        {singleTicket?.status === 'Closed' ? '🔓 Mark as Open' : '🔒 Mark as Closed'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Messages / Conversation List */}
                <Text style={styles.conversationTitle}>Conversation History</Text>
                {singleTicket?.messages && singleTicket.messages.length > 0 ? (
                  singleTicket.messages.map((msg: any) => {
                    const isCustomer = msg.sender === 'Customer';
                    return (
                      <View
                        key={msg._id || msg.createdAt}
                        style={[
                          styles.messageBubble,
                          isCustomer ? styles.customerBubble : styles.supportBubble,
                        ]}
                      >
                        <Text style={[styles.senderName, isCustomer ? styles.customerSender : styles.supportSender]}>
                          {msg.senderName || msg.sender}
                        </Text>
                        <Text style={styles.messageText}>{msg.message}</Text>
                        <Text style={styles.messageTime}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noMessages}>No messages yet.</Text>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* Reply Input Bar - Elevated above bottom tabs */}
            <View style={[styles.replyBar, { paddingBottom: Math.max(insets.bottom + 90, 100) }]}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply message..."
                placeholderTextColor="#94A3B8"
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!replyText.trim() || isReplying) && { opacity: 0.5 }]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || isReplying}
                activeOpacity={0.8}
              >
                {isReplying ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>Send →</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#000', fontWeight: '300', lineHeight: 32 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#000' },
  headerSub: { fontSize: 12, color: '#000', opacity: 0.7, fontWeight: '600' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 18, color: '#000', fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#F0FDF4',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0C831F',
    fontWeight: '800',
  },

  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#0C831F',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },

  scrollContent: { padding: 16 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  raiseNowBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  raiseNowText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTagRow: { flexDirection: 'row', alignItems: 'center' },
  ticketIdBadge: {
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  ticketSubject: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  ticketDate: { fontSize: 11, color: '#94A3B8', marginBottom: 12 },

  ticketCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chatBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chatBtnText: { color: '#0C831F', fontSize: 12, fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  formCardTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  formCardSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0C831F',
    borderColor: '#0C831F',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },

  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  textArea: {
    minHeight: 110,
  },
  submitBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  faqCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 1,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, paddingRight: 10 },
  faqArrow: { fontSize: 12, color: '#94A3B8' },
  faqAnswerBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  faqAnswer: { fontSize: 13, color: '#475569', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  // Modal styles
  chatHeader: {
    backgroundColor: '#F7D117',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  chatHeaderCenter: { flex: 1, marginLeft: 12 },
  chatHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#000000' },
  chatHeaderSub: { fontSize: 11, color: '#000000', opacity: 0.7, fontWeight: '600' },

  chatScrollContent: { padding: 16 },
  ticketSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  summarySubject: { fontSize: 15, fontWeight: '800', color: '#166534', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryBadge: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  conversationTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    maxWidth: '85%',
  },
  customerBubble: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  supportBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  senderName: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  customerSender: { color: '#166534' },
  supportSender: { color: '#1E293B' },
  messageText: { fontSize: 13, color: '#0F172A', lineHeight: 18 },
  messageTime: { fontSize: 10, color: '#64748B', marginTop: 4, alignSelf: 'flex-end' },
  noMessages: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginVertical: 20 },

  replyBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  statusChangeLabel: { fontSize: 11, fontWeight: '700', color: '#166534' },
  statusToggleBtn: {
    backgroundColor: '#0C831F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusToggleBtnClosed: {
    backgroundColor: '#64748B',
  },
  statusToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  faqCategoryTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C831F',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '600' },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },
});
